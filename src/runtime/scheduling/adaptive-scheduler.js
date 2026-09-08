(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,R=O.v2x01Contracts;
if(!C||!R)throw new Error('V2X-01 scheduler requires PX and runtime contracts');
const VERSION='ofu-v2x01-adaptive-scheduler-5';
function fail(code,detail){const e=new Error('OFU V2X-01 '+code+': '+detail);e.code=code;return e;}
function create(options={}){
  C.keys(options,[],['budgets']);const budget=R.budgets(options.budgets||{}),maxActive=budget.active,maxQueue=budget.queue;
  const queues=new Map(R.TASK_CLASSES.map(k=>[k,[]])),jobs=new Map(),activeJobs=new Map(),admissions=new Set(),waiters=[],classDispatches=new Map(R.TASK_CLASSES.map(k=>[k,0])),workloadDispatches=new Map(R.TASK_CLASSES.map(k=>[k,new Map()])),workloadLastServed=new Map(R.TASK_CLASSES.map(k=>[k,new Map()]));
  const cycle=[];for(const klass of R.TASK_CLASSES)for(let i=0;i<R.CLASS_WEIGHTS[klass];i++)cycle.push(klass);
  let cursor=0,sequence=0,pumpScheduled=false;
  const metrics={submitted:0,started:0,completed:0,failed:0,cancelled:0,backpressure:0,preemptionSignals:0,agedPromotions:0,workloadSelections:0,admissionsReserved:0,admissionsConsumed:0,admissionsReleased:0,peakAdmissions:0,peakActive:0,peakQueued:0,peakJobs:0,startedByClass:Object.fromEntries(R.TASK_CLASSES.map(k=>[k,0])),startedByState:Object.fromEntries(R.STATES.map(k=>[k,0])),startedByWorkload:{}};
  const queuedCount=()=>[...queues.values()].reduce((n,q)=>n+q.length,0);
  function workloadFairness(){const out={};for(const klass of R.TASK_CLASSES){const rows=[...workloadDispatches.get(klass).entries()].sort((a,b)=>a[0].localeCompare(b[0]));out[klass]=Object.fromEntries(rows)}return out;}
  function snapshot(){return C.data({version:VERSION,budget:{active:maxActive,queue:maxQueue},fairness:{classWeights:R.CLASS_WEIGHTS,stateStarvationBound:R.STATE_STARVATION_BOUND,workloadPolicy:'OLDEST_LAST_SERVED_THEN_FIFO',workloadDispatches:workloadFairness()},current:{active:activeJobs.size,queued:queuedCount(),admissions:admissions.size,jobs:jobs.size},metrics});}
  function peaks(){metrics.peakAdmissions=Math.max(metrics.peakAdmissions,admissions.size);metrics.peakActive=Math.max(metrics.peakActive,activeJobs.size);metrics.peakQueued=Math.max(metrics.peakQueued,queuedCount());metrics.peakJobs=Math.max(metrics.peakJobs,jobs.size);}
  function flush(){if(jobs.size||admissions.size)return;const value=snapshot();while(waiters.length)waiters.shift()(value);}
  function removeQueued(job){const q=queues.get(job.taskClass),index=q.indexOf(job);if(index>=0)q.splice(index,1);}
  function workloadForClass(klass,q){
    const served=workloadLastServed.get(klass),seen=new Map();
    for(const job of q)if(!seen.has(job.workloadDomain))seen.set(job.workloadDomain,job.sequence);
    let best=null;
    for(const [domain,firstSequence] of seen){const lastServed=served.has(domain)?served.get(domain):-1,candidate={domain,lastServed,firstSequence};if(!best||candidate.lastServed<best.lastServed||(candidate.lastServed===best.lastServed&&candidate.firstSequence<best.firstSequence)||(candidate.lastServed===best.lastServed&&candidate.firstSequence===best.firstSequence&&candidate.domain.localeCompare(best.domain)<0))best=candidate;}
    return best?.domain||null;
  }
  function selectFromClass(klass){
    const q=queues.get(klass);if(!q.length)return null;const domain=workloadForClass(klass,q);if(!domain)return null;const dispatched=classDispatches.get(klass);
    let bestIndex=-1,best=null;
    for(let i=0;i<q.length;i++){
      const job=q[i];if(job.workloadDomain!==domain)continue;const aged=dispatched-job.classDispatchAtEnqueue>=R.STATE_STARVATION_BOUND;
      if(aged&&(!best||!best.aged||job.sequence<best.job.sequence)){best={job,aged:true};bestIndex=i;continue;}
      if(best?.aged)continue;
      if(!best||R.STATE_RANK[job.state]>R.STATE_RANK[best.job.state]||(job.state===best.job.state&&job.sequence<best.job.sequence)){best={job,aged:false};bestIndex=i;}
    }
    if(best?.aged)metrics.agedPromotions++;if(best)metrics.workloadSelections++;return best?q.splice(bestIndex,1)[0]:null;
  }
  function selectNext(){
    if(!queuedCount())return null;
    for(let i=0;i<cycle.length;i++){
      const klass=cycle[cursor];cursor=(cursor+1)%cycle.length;const job=selectFromClass(klass);if(job)return job;
    }
    for(const klass of R.TASK_CLASSES){const job=selectFromClass(klass);if(job)return job;}
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
    classDispatches.set(job.taskClass,classDispatches.get(job.taskClass)+1);const wd=workloadDispatches.get(job.taskClass),served=workloadLastServed.get(job.taskClass);wd.set(job.workloadDomain,(wd.get(job.workloadDomain)||0)+1);served.set(job.workloadDomain,classDispatches.get(job.taskClass));job.status='ACTIVE';activeJobs.set(job.id,job);metrics.started++;metrics.startedByClass[job.taskClass]++;metrics.startedByState[job.state]++;metrics.startedByWorkload[job.workloadDomain]=(metrics.startedByWorkload[job.workloadDomain]||0)+1;peaks();
    Promise.resolve().then(()=>job.run(job.controller.signal,Object.freeze({id:job.id,taskClass:job.taskClass,state:job.state,workloadDomain:job.workloadDomain,sequence:job.sequence}))).then(
      value=>finish(job,job.controller.signal.aborted?'CANCELLED':'RESOLVED',job.controller.signal.aborted?fail('CANCELLED',job.id):value),
      error=>finish(job,job.controller.signal.aborted?'CANCELLED':'REJECTED',error)
    );
  }
  function pump(){pumpScheduled=false;while(activeJobs.size<maxActive&&queuedCount()){const next=selectNext();if(!next)break;start(next);}flush();}
  function schedulePump(){if(pumpScheduled)return;pumpScheduled=true;queueMicrotask(pump);}
  function signalPreemptionForInteraction(){
    if(activeJobs.size<maxActive)return false;
    const candidates=[...activeJobs.values()].filter(j=>j.preemptible&&j.taskClass!=='INTERACTION'&&!j.controller.signal.aborted).sort((a,b)=>R.TASK_CLASSES.indexOf(b.taskClass)-R.TASK_CLASSES.indexOf(a.taskClass)||R.STATE_RANK[a.state]-R.STATE_RANK[b.state]||a.sequence-b.sequence);
    const victim=candidates[0];if(!victim)return false;metrics.preemptionSignals++;victim.controller.abort(fail('PREEMPTED','interaction '+victim.id));return true;
  }
  function capacityReached(){return queuedCount()+admissions.size>=maxQueue||jobs.size+admissions.size>=maxQueue+maxActive;}
  function reserveAdmission(){
    if(capacityReached()){metrics.backpressure++;throw fail('BACKPRESSURE','bounded scheduler capacity reached');}
    let open=true,token;token=Object.freeze({release(){if(!open)return false;open=false;const removed=admissions.delete(token);if(removed){metrics.admissionsReleased++;peaks();flush();}return removed;}});
    admissions.add(token);metrics.admissionsReserved++;peaks();return token;
  }
  function schedule(input){
    C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','scheduler task');C.keys(input,['id','taskClass','state','run'],['preemptible','admission','workloadDomain']);
    const id=C.token(input.id,'task id'),taskClass=R.taskClass(input.taskClass),state=R.state(input.state),workloadDomain=R.workloadDomain(input.workloadDomain??'default');C.assert(typeof input.run==='function','SCHEMA','task run');if(input.preemptible!==undefined)C.assert(typeof input.preemptible==='boolean','SCHEMA','preemptible');C.assert(!jobs.has(id),'DUPLICATE','task '+id);
    if(input.admission!==undefined){C.assert(admissions.has(input.admission),'ADMISSION','invalid or consumed scheduler admission');admissions.delete(input.admission);metrics.admissionsConsumed++;}else if(capacityReached()){metrics.backpressure++;throw fail('BACKPRESSURE','bounded scheduler capacity reached');}
    const controller=new AbortController();let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    const job={id,taskClass,state,workloadDomain,run:input.run,preemptible:input.preemptible!==false,controller,resolve,reject,promise,status:'QUEUED',sequence:sequence++,classDispatchAtEnqueue:classDispatches.get(taskClass)};
    jobs.set(id,job);queues.get(taskClass).push(job);metrics.submitted++;peaks();if(taskClass==='INTERACTION')signalPreemptionForInteraction();schedulePump();
    return Object.freeze({id,promise,cancel(reason='cancelled'){return cancel(id,reason);},status(){return jobs.get(id)?.status||job.status;}});
  }
  function cancel(id,reason='cancelled'){
    C.token(id,'task id');const job=jobs.get(id);if(!job||job.controller.signal.aborted)return false;const error=fail('CANCELLED',reason);job.controller.abort(error);if(job.status==='QUEUED')finish(job,'CANCELLED',error);return true;
  }
  function cancelWhere(predicate,reason='cancelled'){
    C.assert(typeof predicate==='function','SCHEMA','cancel predicate');let count=0;
    for(const job of [...jobs.values()]){const view=Object.freeze({id:job.id,taskClass:job.taskClass,state:job.state,workloadDomain:job.workloadDomain,status:job.status,sequence:job.sequence});if(predicate(view)&&cancel(job.id,reason))count++;}
    return count;
  }
  function drain(){if(!jobs.size&&!admissions.size)return Promise.resolve(snapshot());return new Promise(resolve=>waiters.push(resolve));}
  return Object.freeze({VERSION,reserveAdmission,schedule,cancel,cancelWhere,drain,snapshot});
}
O.v2x01AdaptiveScheduler=Object.freeze({VERSION,create});
})(globalThis);
