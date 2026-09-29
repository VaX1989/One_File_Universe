const integer=(value,label,{min=0,max=Number.MAX_SAFE_INTEGER}={})=>{const output=Number(value);if(!Number.isInteger(output)||output<min||output>max)throw new TypeError(`${label} must be an integer from ${min} to ${max}`);return output};
const text=(value,label)=>{const output=String(value??'').trim();if(!output)throw new TypeError(label+' is required');return output};
const defaultYield=()=>new Promise(resolve=>setTimeout(resolve,0));

/**
 * Cooperatively schedules deterministic cursor-based discovery. Scheduling is
 * deliberately excluded from generated identity: slices only concatenate the
 * discoverer's canonical cursor order and cancelled partial results never commit.
 */
export function createDiscoveryScheduler({maxPending=4,probesPerSlice=32,yieldControl=defaultYield}={}){
  const capacity=integer(maxPending,'maxPending',{min:1,max:32}),sliceBudget=integer(probesPerSlice,'probesPerSlice',{min:1,max:4096});
  if(typeof yieldControl!=='function')throw new TypeError('yieldControl must be a function');
  const tasks=new Map(),intentOwners=new Map();let sequence=0,cycle=0,pumping=false,disposed=false,completed=0,cancelled=0,rejected=0,slices=0;
  const publicTask=task=>Object.freeze({requestId:task.id,key:task.key,intentKey:task.intentKey,priority:task.priority,status:task.status,cursor:task.cursor,probes:task.probes,slices:task.slices,items:task.items.length,limit:task.limit,maxProbes:task.maxProbes});
  const remove=task=>{tasks.delete(task.id);if(intentOwners.get(task.intentKey)===task.id)intentOwners.delete(task.intentKey);task.signal?.removeEventListener?.('abort',task.abortListener)};
  const finish=(task,status,payload={})=>{if(task.settled)return;task.settled=true;task.status=status;remove(task);const result=Object.freeze({contract:'ofu-discovery-result-1',requestId:task.id,key:task.key,intentKey:task.intentKey,status,items:Object.freeze([...task.items].slice(0,task.limit)),cursor:task.cursor,probes:task.probes,slices:task.slices,...payload});if(status==='COMPLETED'){completed++;task.resolve(result)}else if(status==='CANCELLED'){cancelled++;task.resolve(result)}else{rejected++;task.reject(payload.error||new Error(`Discovery ${task.key} failed`))}};
  const cancelTask=(task,reason='CANCELLED')=>{if(!task||task.settled)return false;task.cancelReason=String(reason);task.status='CANCEL_PENDING';if(!task.running)finish(task,'CANCELLED',{reason:task.cancelReason});return true};
  const select=()=>[...tasks.values()].filter(task=>!task.settled&&!task.running).sort((a,b)=>b.priority-a.priority||a.lastRun-b.lastRun||a.sequence-b.sequence)[0]||null;
  const pump=async()=>{
    if(pumping||disposed)return;pumping=true;
    try{
      await yieldControl();
      while(!disposed&&tasks.size){
        const task=select();if(!task)break;
        if(task.cancelReason){finish(task,'CANCELLED',{reason:task.cancelReason});continue}
        task.running=true;task.status='RUNNING';const remainingBudget=task.maxProbes-task.probes,budget=Math.min(sliceBudget,remainingBudget),remainingItems=task.limit-task.items.length;
        try{
          if(budget<=0||remainingItems<=0){finish(task,'COMPLETED');continue}
          const result=task.discover(Object.freeze({cursor:task.cursor,limit:remainingItems,maxProbes:budget,requestId:task.id,key:task.key}));
          if(!result||!Array.isArray(result.items))throw new TypeError('Discovery slice must return an items array');
          const used=integer(result.probes,'slice probes',{min:0,max:budget});
          if(used===0&&result.nextCursor!==null&&result.nextCursor!==undefined)throw new Error('Discovery slice made no cursor progress');
          task.items.push(...result.items);task.probes+=used;task.slices++;slices++;task.cursor=result.nextCursor??null;task.lastRun=++cycle;
          if(task.cancelReason){finish(task,'CANCELLED',{reason:task.cancelReason});continue}
          task.onProgress?.(Object.freeze({...publicTask(task),latest:Object.freeze([...result.items])}));
          if(task.items.length>=task.limit||task.cursor===null||task.probes>=task.maxProbes)finish(task,'COMPLETED',{exhausted:task.cursor===null,budgetExhausted:task.probes>=task.maxProbes&&task.items.length<task.limit});
          else task.status='QUEUED';
        }catch(error){finish(task,'REJECTED',{error})}
        finally{task.running=false}
        if(tasks.size)await yieldControl();
      }
    }finally{pumping=false;if(!disposed&&tasks.size)queueMicrotask(pump)}
  };
  const admit=task=>{
    if(tasks.size<capacity)return true;
    const victim=[...tasks.values()].filter(candidate=>!candidate.running).sort((a,b)=>a.priority-b.priority||a.sequence-b.sequence)[0];
    if(!victim||victim.priority>task.priority)return false;
    cancelTask(victim,'QUEUE_SUPERSEDED');return true;
  };
  return Object.freeze({
    request({key,intentKey=key,priority=0,cursor=0,limit=8,maxProbes=4096,discover,onProgress=null,signal=null}={}){
      if(disposed)throw new Error('Discovery scheduler is disposed');key=text(key,'key');intentKey=text(intentKey,'intentKey');priority=Number(priority)||0;cursor=integer(cursor,'cursor');limit=integer(limit,'limit',{min:1,max:64});maxProbes=integer(maxProbes,'maxProbes',{min:1,max:65536});if(typeof discover!=='function')throw new TypeError('discover must be a function');if(onProgress!==null&&typeof onProgress!=='function')throw new TypeError('onProgress must be a function');
      const prior=tasks.get(intentOwners.get(intentKey));if(prior)cancelTask(prior,'INTENT_SUPERSEDED');
      const id=`discovery-${++sequence}`,task={id,key,intentKey,priority,cursor,limit,maxProbes,discover,onProgress,signal,sequence,lastRun:0,probes:0,slices:0,items:[],status:'QUEUED',running:false,settled:false,cancelReason:null,resolve:null,reject:null,abortListener:null};
      const promise=new Promise((resolve,reject)=>{task.resolve=resolve;task.reject=reject});
      if(!admit(task)){rejected++;task.settled=true;task.status='REJECTED';task.reject(new Error('Discovery queue is full with higher-priority work'));return Object.freeze({requestId:id,promise,cancel:()=>false})}
      tasks.set(id,task);intentOwners.set(intentKey,id);task.abortListener=()=>cancelTask(task,'ABORTED');if(signal?.aborted)task.cancelReason='ABORTED';else signal?.addEventListener?.('abort',task.abortListener,{once:true});queueMicrotask(pump);
      return Object.freeze({requestId:id,promise,cancel:reason=>cancelTask(task,reason)});
    },
    cancel(requestId,reason='CANCELLED'){return cancelTask(tasks.get(String(requestId)),reason)},
    cancelIntent(intentKey,reason='INTENT_CANCELLED'){return cancelTask(tasks.get(intentOwners.get(String(intentKey))),reason)},
    snapshot(){const pending=[...tasks.values()].map(publicTask);return Object.freeze({contract:'ofu-discovery-scheduler-1',capacity,size:pending.length,bounded:pending.length<=capacity,probesPerSlice:sliceBudget,pumping,disposed,completed,cancelled,rejected,slices,pending:Object.freeze(pending)})},
    dispose(){if(disposed)return false;disposed=true;for(const task of [...tasks.values()])cancelTask(task,'SCHEDULER_DISPOSED');return true}
  });
}
