(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,R=O.v2x01Contracts;
if(!C||!R)throw new Error('V2X-01 scheduler requires PX and runtime contracts');
const VERSION='ofu-v2x01-adaptive-scheduler-1';
function fail(code,detail){const e=new Error('OFU V2X-01 '+code+': '+detail);e.code=code;return e;}
function create(options={}){
  const budget=R.budgets(options.budgets||{}),maxActive=budget.active,maxQueue=budget.queue;
  const queues=new Map(R.TASK_CLASSES.map(k=>[k,[]])),jobs=new Map(),activeJobs=new Map(),waiters=[];
  const cycle=[];for(const klass of R.TASK_CLASSES)for(let i=0;i<R.CLASS_WEIGHTS[klass];i++)cycle.push(klass);
  let cursor=0,sequence=0,pumpScheduled=false;
  const metrics={submitted:0,started:0,completed:0,failed:0,cancelled:0,backpressure:0,preemptionSignals:0,peakActive:0,peakQueued:0,peakJobs:0,startedByClass:Object.fromEntries(R.TASK_CLASSES.map(k=>[k,0]))};
  const queuedCount=()=>[...queues.values()].reduce((n,q)=>n+q.length,0);
  function snapshot(){return C.data({version:VERSION,budget:{active:maxActive,queue:maxQueue},current:{active:activeJobs.size,queued:queuedCount(),jobs:jobs.size},metrics});}
  function peaks(){metrics.peakActive=Math.max(metrics.peakActive,activeJobs.size);metrics.peakQueued=Math.max(metrics.peakQueued,queuedCount());metrics.peakJobs=Math.max(metrics.peakJobs,jobs.size);}
  function flush(){if(jobs.size)return;const value=snapshot();while(waiters.length)waiters.shift()(value);}
  function removeQueued(job){const q=queues.get(job.taskClass),index=q.indexOf(job);if(index>=0)q.splice(index,1);}
  function enqueue(job){const q=queues.get(job.taskClass);q.push(job);q.sort((a,b)=>R.STATE_RANK[b.state]-R.STATE_RANK[a.state]||a.sequence-b.sequence);}
  function selectNext(){
    if(!queuedCount())return null;
    for(let i=0;i<cycle.length;i++){
      const klass=cycle[cursor];cursor=(cursor+1)%cycle.length;
      const q=queues.get(klass);if(q.length)return q.shift();
    }
    for(const klass of R.TASK_CLASSES){const q=queues.get(klass);if(q.length)return q.shift();}
    return null;
  }
  function finish(job,status,value){
    if(job.status==='ACTIVE')activeJobs.delete(job.id);else removeQueued(job);
    jobs.delete(job.id);job.status=status;
    if(status==='RESOLVED'){metrics.completed++;job.resolve(value);}else if(status==='CANCELLED'){metrics.cancelled++;job.reject(value instanceof Error?value:fail('CANCELLED',String(value||job.id)));}else{metrics.failed++;job.reject(value instanceof Error?value:fail('TASK_FAILED',String(value||job.id)));}
    peaks();schedulePump();flush();
  }
  function start(job){
    if(job.controller.signal.aborted){finish(job,'CANCELLED',fail('CANCELLED',job.id));return;}
    job.status='ACTIVE';activeJobs.set(job.id,job);metrics.started++;metrics.startedByClass[job.taskClass]++;peaks();
    Promise.resolve().then(()=>job.run(job.controller.signal,Object.freeze({id:job.id,taskClass:job.taskClass,state:job.state,sequence:job.sequence}))).then(
      value=>finish(job,job.controller.signal.aborted?'CANCELLED':'RESOLVED',job.controller.signal.aborted?fail('CANCELLED',job.id):value),
      error=>finish(job,job.controller.signal.aborted?'CANCELLED':'REJECTED',error)
    );
  }
  function pump(){pumpScheduled=false;while(activeJobs.size<maxActive&&queuedCount()){const next=selectNext();if(!next)break;start(next);}flush();}
  function schedulePump(){if(pumpScheduled)return;pumpScheduled=true;queueMicrotask(pump);}
  function signalPreemptionForInteraction(){
    if(activeJobs.size<maxActive)return false;
    const candidates=[...activeJobs.values()].filter(j=>j.preemptible&&j.taskClass!=='INTERACTION').sort((a,b)=>R.TASK_CLASSES.indexOf(b.taskClass)-R.TASK_CLASSES.indexOf(a.taskClass)||R.STATE_RANK[a.state]-R.STATE_RANK[b.state]||a.sequence-b.sequence);
    const victim=candidates[0];if(!victim)return false;metrics.preemptionSignals++;victim.controller.abort(fail('PREEMPTED','interaction '+victim.id));return true;
  }
  function schedule(input){
    C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','scheduler task');C.keys(input,['id','taskClass','state','run'],['preemptible']);
    const id=C.token(input.id,'task id'),taskClass=R.taskClass(input.taskClass),state=R.state(input.state);C.assert(typeof input.run==='function','SCHEMA','task run');C.assert(!jobs.has(id),'DUPLICATE','task '+id);
    if(queuedCount()>=maxQueue||jobs.size>=maxQueue+maxActive){metrics.backpressure++;throw fail('BACKPRESSURE','bounded scheduler capacity reached');}
    const controller=new AbortController();let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    const job={id,taskClass,state,run:input.run,preemptible:input.preemptible!==false,controller,resolve,reject,promise,status:'QUEUED',sequence:sequence++};
    jobs.set(id,job);enqueue(job);metrics.submitted++;peaks();if(taskClass==='INTERACTION')signalPreemptionForInteraction();schedulePump();
    return Object.freeze({id,promise,cancel(reason='cancelled'){return cancel(id,reason);},status(){return jobs.get(id)?.status||job.status;}});
  }
  function cancel(id,reason='cancelled'){
    C.token(id,'task id');const job=jobs.get(id);if(!job)return false;const error=fail('CANCELLED',reason);job.controller.abort(error);if(job.status==='QUEUED')finish(job,'CANCELLED',error);return true;
  }
  function cancelWhere(predicate,reason='cancelled'){
    C.assert(typeof predicate==='function','SCHEMA','cancel predicate');let count=0;
    for(const job of [...jobs.values()]){const view=Object.freeze({id:job.id,taskClass:job.taskClass,state:job.state,status:job.status,sequence:job.sequence});if(predicate(view)&&cancel(job.id,reason))count++;}
    return count;
  }
  function drain(){if(!jobs.size)return Promise.resolve(snapshot());return new Promise(resolve=>waiters.push(resolve));}
  return Object.freeze({VERSION,schedule,cancel,cancelWhere,drain,snapshot});
}
O.v2x01AdaptiveScheduler=Object.freeze({VERSION,create});
})(globalThis);
