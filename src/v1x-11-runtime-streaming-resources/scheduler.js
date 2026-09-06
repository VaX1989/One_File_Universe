(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,L=O.v1x11Lifecycle;
if(!C||!L)throw new Error('V1X-11 scheduler requires lifecycle and PX contracts');
const VERSION='ofu-v1x11-scheduler-1';
const priority=Object.freeze({IMMEDIATE:0,HOT:1,WARM:2,COLD:3});
function fail(code,detail){const error=new Error('OFU V1X-11 '+code+': '+detail);error.code=code;return error;}
function integer(value,label,min,max){C.assert(Number.isSafeInteger(value)&&value>=min&&value<=max,'BUDGET',label);return value;}
function create(options={}){
  C.assert(options&&typeof options==='object'&&!Array.isArray(options),'SCHEMA','scheduler options');
  const maxWorkers=integer(options.maxWorkers??4,'worker slots',1,16);
  const maxQueue=integer(options.maxQueue??128,'scheduler queue',1,C.LIMITS.queue);
  const maxJobs=integer(options.maxJobs??Math.min(C.LIMITS.queue,maxQueue+maxWorkers),'scheduler jobs',maxWorkers,C.LIMITS.queue);
  C.assert(maxJobs>=maxWorkers&&maxJobs<=maxQueue+maxWorkers,'BUDGET','scheduler jobs must fit active plus queue');
  const jobs=new Map(),queued=[],waiters=[];
  let active=0,sequence=0;
  const metrics={submitted:0,started:0,completed:0,rejected:0,cancelled:0,backpressure:0,peakActive:0,peakQueued:0,peakJobs:0};
  function snapshot(){return C.data({version:VERSION,budget:{maxWorkers,maxQueue,maxJobs},current:{active,queued:queued.length,jobs:jobs.size},metrics});}
  function updatePeaks(){metrics.peakActive=Math.max(metrics.peakActive,active);metrics.peakQueued=Math.max(metrics.peakQueued,queued.length);metrics.peakJobs=Math.max(metrics.peakJobs,jobs.size);}
  function flush(){if(jobs.size||active||queued.length)return;const value=snapshot();while(waiters.length)waiters.shift()(value);}
  function removeQueued(job){const index=queued.indexOf(job);if(index>=0)queued.splice(index,1);}
  function finish(job,status,value){
    if(job.status==='ACTIVE')active--;
    removeQueued(job);jobs.delete(job.id);job.status=status;
    if(status==='RESOLVED'){metrics.completed++;job.resolve(value);}else if(status==='CANCELLED'){metrics.cancelled++;job.reject(value instanceof Error?value:fail('CANCELLED',String(value||job.id)));}else{metrics.rejected++;job.reject(value instanceof Error?value:fail('JOB_FAILED',String(value||job.id)));}
    updatePeaks();queueMicrotask(pump);flush();
  }
  function pump(){
    queued.sort((a,b)=>priority[a.state]-priority[b.state]||a.sequence-b.sequence);
    while(active<maxWorkers&&queued.length){
      const job=queued.shift();
      if(job.controller.signal.aborted){finish(job,'CANCELLED',fail('CANCELLED',job.id));continue;}
      active++;job.status='ACTIVE';metrics.started++;updatePeaks();
      Promise.resolve().then(()=>job.run(job.controller.signal)).then(
        value=>finish(job,job.controller.signal.aborted?'CANCELLED':'RESOLVED',job.controller.signal.aborted?fail('CANCELLED',job.id):value),
        error=>finish(job,job.controller.signal.aborted?'CANCELLED':'REJECTED',error)
      );
    }
    flush();
  }
  function schedule(input){
    C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','job');
    const id=C.token(input.id,'job id'),state=L.state(input.state);
    C.assert(typeof input.run==='function','SCHEMA','job run');
    C.assert(!jobs.has(id),'DUPLICATE','job '+id);
    if(queued.length>=maxQueue||jobs.size>=maxJobs){metrics.backpressure++;throw fail('BACKPRESSURE','bounded scheduler capacity reached');}
    const controller=new AbortController();let resolve,reject;
    const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    const job={id,state,run:input.run,controller,resolve,reject,promise,status:'QUEUED',sequence:sequence++};
    jobs.set(id,job);queued.push(job);metrics.submitted++;updatePeaks();pump();
    return Object.freeze({id,promise,cancel(reason='cancelled'){return cancel(id,reason);},status(){return jobs.get(id)?.status||job.status;}});
  }
  function cancel(id,reason='cancelled'){
    C.token(id,'job id');const job=jobs.get(id);if(!job)return false;
    const error=fail('CANCELLED',reason);job.controller.abort(error);
    if(job.status==='QUEUED')finish(job,'CANCELLED',error);
    return true;
  }
  function cancelWhere(predicate,reason='cancelled'){
    C.assert(typeof predicate==='function','SCHEMA','cancel predicate');let count=0;
    for(const job of [...jobs.values()])if(predicate(Object.freeze({id:job.id,state:job.state,status:job.status}))&&cancel(job.id,reason))count++;
    return count;
  }
  function drain(){if(!jobs.size&&!active&&!queued.length)return Promise.resolve(snapshot());return new Promise(resolve=>waiters.push(resolve));}
  return Object.freeze({VERSION,schedule,cancel,cancelWhere,drain,snapshot});
}
O.v1x11Scheduler=Object.freeze({VERSION,create});
})(globalThis);
