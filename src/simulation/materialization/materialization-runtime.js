(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,R=O.v2x01Contracts,K=O.v2x01CacheKey,S=O.v2x01AdaptiveScheduler,L=O.v2x01ResourceLedger,W=O.v2x01WorkerExecutor,V='ofu-v2x01-materialization-runtime-3';
if(!C||!R||!K||!S||!L)throw Error('V2X-01 materialization dependencies');
function fail(c,m){const e=Error('OFU V2X-01 '+c+': '+m);e.code=c;return e}
function create(o={}){
  C.keys(o,[],['budgets','scheduler','ledger','workerExecutor']);const b=R.budgets(o.budgets||{}),scheduler=o.scheduler||S.create({budgets:b}),ledger=o.ledger||L.create({budgets:b}),workers=o.workerExecutor===false?null:(o.workerExecutor||(W?W.create({maxPayloadBytes:b.taskBytes}):null)),providers=new Map(),entries=new Map(),active=new Map(),gen=new Map(),quarantine=new Map(),detached=new Map(),max=Math.min(b.cacheEntries,b.materializations);
  C.assert(scheduler&&typeof scheduler.schedule==='function'&&typeof scheduler.cancel==='function'&&typeof scheduler.cancelWhere==='function'&&typeof scheduler.drain==='function'&&typeof scheduler.snapshot==='function','DEPENDENCY','scheduler surface');C.assert(ledger&&typeof ledger.reserve==='function'&&typeof ledger.commit==='function'&&typeof ledger.release==='function'&&typeof ledger.snapshot==='function','DEPENDENCY','resource ledger surface');if(workers)C.assert(typeof workers.register==='function'&&typeof workers.execute==='function'&&typeof workers.canRunWorker==='function'&&typeof workers.snapshot==='function','DEPENDENCY','worker executor surface');
  let seq=0,clock=0;
  const m={requests:0,hits:0,misses:0,materializations:0,evictions:0,invalidations:0,cancellations:0,staleRejects:0,releaseFailures:0,quarantinedReleases:0,quarantineRecoveries:0,detachedFallbacks:0,detachedSettlements:0,fallbackAdmissionRejects:0,contextLosses:0,memoryPressureEvents:0,restorations:0,workerResults:0,fallbackResults:0};
  function reg(x){
    C.keys(x,['providerId','domain','modelVersion','representationVersion','load'],['release','workerProgram']);
    const id=C.token(x.providerId),domain=C.token(x.domain,'domain');C.assert(typeof x.load==='function'&&!providers.has(id),'SCHEMA','materializer');if(x.release!==undefined)C.assert(typeof x.release==='function','SCHEMA','materializer release');if(x.workerProgram!==undefined)C.assert(typeof x.workerProgram==='string'&&x.workerProgram.length<=65536,'BUDGET','worker program');
    const v=Object.freeze({...x,providerId:id,domain,modelVersion:C.version(x.modelVersion),representationVersion:C.version(x.representationVersion),handlerId:'v2x01.materializer.'+id});providers.set(id,v);workers?.register({id:v.handlerId,version:v.modelVersion,direct:(p,s)=>v.load(p,s),workerProgram:x.workerProgram||null});return v;
  }
  function norm(x){
    C.keys(x,['durable','targetState','taskClass','semantic','presentation','estimate'],['preferWorker']);if(x.preferWorker!==undefined)C.assert(typeof x.preferWorker==='boolean','SCHEMA','preferWorker');
    const d=R.durable(x.durable),p=providers.get(d.identity.providerId);C.assert(p,'IMPLEMENTATION','materializer');
    const semantic=C.data(x.semantic,{bytes:b.taskBytes,nodes:4096}),sd=C.digest(semantic),state=R.state(x.targetState),klass=R.taskClass(x.taskClass),estimate=R.estimate(x.estimate),cache=K.create({identity:d.identity,modelVersion:p.modelVersion,representationVersion:p.representationVersion,commitmentDigest:d.commitmentDigest,historyDigest:d.historyDigest,semanticDigest:sd});
    if(state==='COLD')C.assert(Object.values(estimate).every(v=>v===0),'BUDGET','cold request must reserve zero materialization resources');
    if(state==='WARM')C.assert(estimate.gpuEstimateBytes===0,'BUDGET','warm request cannot reserve GPU resources');
    return{durable:d,provider:p,semantic,semanticDigest:sd,presentation:C.data(x.presentation),targetState:state,taskClass:klass,estimate,cache,preferWorker:x.preferWorker!==false};
  }
  function logical(r){return R.logicalIdentityKey(r.durable.identity)}
  function release(e,why){try{e.provider.release?.(e.value,{identity:e.identity,cacheDigest:e.cacheDigest},why)}catch(error){m.releaseFailures++;throw fail('RELEASE_FAILURE',String(error&&error.message||error||e.cacheDigest))}C.assert(ledger.release(e.resourceId),'RESOURCE','missing resource allocation '+e.resourceId);entries.delete(e.cacheDigest);m.evictions++;return true}
  function cleanupRaw(rid,r,raw,why,originalError){
    try{r.provider.release?.(raw,{identity:r.durable.identity,cacheDigest:r.cache.digest},why);return true}catch(error){
      m.releaseFailures++;m.quarantinedReleases++;ledger.commit(rid,r.estimate);quarantine.set(rid,{resourceId:rid,provider:r.provider,identity:r.durable.identity,cacheDigest:r.cache.digest,raw,reason:why,lastError:String(error&&error.message||error)});const wrapped=fail('RELEASE_FAILURE',String(error&&error.message||error||why));wrapped.cause=originalError||error;throw wrapped;
    }
  }
  function retryQuarantinedReleases(reason='retry'){
    C.token(reason,'release retry reason');let released=0,failed=0;for(const [rid,q] of [...quarantine.entries()]){try{q.provider.release?.(q.raw,{identity:q.identity,cacheDigest:q.cacheDigest},reason);C.assert(ledger.release(rid),'RESOURCE','missing quarantined allocation '+rid);quarantine.delete(rid);m.quarantineRecoveries++;released++}catch(error){q.lastError=String(error&&error.message||error);m.releaseFailures++;failed++}}return Object.freeze({released,failed,remaining:quarantine.size});
  }
  function trackDetachedFallback(rid,r,promise,reason){
    m.detachedFallbacks++;detached.set(rid,{reason});Promise.resolve(promise).then(raw=>{try{cleanupRaw(rid,r,raw,'detached-'+reason);if(!quarantine.has(rid))C.assert(ledger.release(rid),'RESOURCE','missing detached reservation '+rid)}catch{}finally{detached.delete(rid);m.detachedSettlements++}},()=>{try{C.assert(ledger.release(rid),'RESOURCE','missing detached reservation '+rid)}finally{detached.delete(rid);m.detachedSettlements++}});
  }
  function candidates(protect,includePinned=false){return[...entries.values()].filter(e=>(includePinned||!e.pinned)&&e.logicalKey!==protect).sort((a,b)=>R.compareStates(a.state,b.state)||a.lastUse-b.lastUse||a.cacheDigest.localeCompare(b.cacheDigest))}
  function room(protect){while(entries.size>=max){const e=candidates(protect)[0];if(!e)throw fail('CACHE_BUDGET','no evictable entry');release(e,'cache-capacity')}}
  function cancelPending(predicate,reason){let n=0;for(const [key,a] of [...active.entries()]){if(!predicate(a,key))continue;if(scheduler.cancel(a.jobId,reason)){gen.set(key,(gen.get(key)||0)+1);m.cancellations++;n++}}return n}
  function invalidateLogical(k,why='invalidated'){
    const a=active.get(k);if(a){scheduler.cancel(a.jobId,why);active.delete(k);m.cancellations++}
    let n=0;for(const e of [...entries.values()])if(e.logicalKey===k){e.pinned=false;release(e,why);n++}m.invalidations+=n;return n;
  }
  function reserve(id,x,k){for(;;){try{return ledger.reserve(id,x)}catch(e){if(e.code!=='RESOURCE_BUDGET')throw e;const v=candidates(k)[0];if(!v)throw e;release(v,'resource-pressure')}}}
  function witness(r,e,hit,mode=null){return C.data({version:V,identity:r.durable.identity,commitmentDigest:r.durable.commitmentDigest,historyDigest:r.durable.historyDigest,semanticDigest:r.semanticDigest,cacheDigest:r.cache.digest,targetState:r.targetState,materialized:!!e,cacheHit:hit,executionMode:mode,usage:e?e.usage:{cpuEstimateBytes:0,gpuEstimateBytes:0,entities:0,operations:0,transferBytes:0}})}
  async function request(x){
    m.requests++;const r=norm(x),k=logical(r);
    if(r.targetState==='COLD'){invalidateLogical(k,'cold');return witness(r,null,false)}
    const hit=entries.get(r.cache.digest);if(hit&&hit.state===r.targetState){hit.lastUse=++clock;hit.pinned=r.targetState==='IMMEDIATE';m.hits++;return witness(r,hit,true,hit.executionMode)}
    const workerCapable=!!(workers&&r.preferWorker&&r.provider.workerProgram&&workers.canRunWorker(r.provider.handlerId));if(!workerCapable&&r.estimate.operations>b.syncFallbackOperations){m.fallbackAdmissionRejects++;throw fail('SYNC_FALLBACK_BUDGET','declared operations '+r.estimate.operations+' exceed '+b.syncFallbackOperations)}
    m.misses++;invalidateLogical(k,'superseded');room(k);
    const g=(gen.get(k)||0)+1;gen.set(k,g);const rid='v2x01.resource.'+(++seq),jid='v2x01.task.'+seq;reserve(rid,r.estimate,k);let h;
    try{
      h=scheduler.schedule({id:jid,taskClass:r.taskClass,state:r.targetState,preemptible:r.taskClass!=='INTERACTION',run:async signal=>{
        const payload={durable:r.durable,targetState:r.targetState,taskClass:r.taskClass,semantic:r.semantic,semanticDigest:r.semanticDigest,presentation:r.presentation,modelVersion:r.provider.modelVersion,representationVersion:r.provider.representationVersion};
        let mode='DIRECT',raw,committed=false;
        try{
          if(workers){let ex;try{ex=await workers.execute({handlerId:r.provider.handlerId,payload,signal,preferWorker:r.preferWorker&&!!r.provider.workerProgram})}catch(error){if(error?.detached)trackDetachedFallback(rid,r,error.detached,error.code||'fallback-detached');throw error}mode=ex.mode;raw=ex.value;mode==='WORKER'?m.workerResults++:m.fallbackResults++}else raw=await r.provider.load(payload,signal);
          if(signal.aborted||gen.get(k)!==g){m.staleRejects++;throw fail('STALE_WORK','superseded work')}
          C.keys(raw,['identity','semanticDigest','state','cpuEstimateBytes','gpuEstimateBytes','entities','operations','transferBytes','value']);C.assert(C.stable(R.identity(raw.identity))===C.stable(r.durable.identity)&&raw.semanticDigest===r.semanticDigest,'SEMANTIC_INVARIANCE','identity/digest');C.assert(R.state(raw.state)===r.targetState,'LIFECYCLE','materializer state mismatch');
          const actual=R.estimate({cpuEstimateBytes:raw.cpuEstimateBytes,gpuEstimateBytes:raw.gpuEstimateBytes,entities:raw.entities,operations:raw.operations,transferBytes:raw.transferBytes});for(const q of ['cpuEstimateBytes','gpuEstimateBytes','entities','operations','transferBytes'])C.assert(actual[q]<=r.estimate[q],'BUDGET','actual '+q);
          const value=C.data(raw.value,{bytes:b.taskBytes,nodes:4096});room(k);const e={cacheDigest:r.cache.digest,logicalKey:k,provider:r.provider,identity:r.durable.identity,state:r.targetState,pinned:r.targetState==='IMMEDIATE',lastUse:++clock,resourceId:rid,usage:actual,value,executionMode:mode},out=witness(r,e,false,mode);ledger.commit(rid,actual);committed=true;entries.set(e.cacheDigest,e);m.materializations++;return out;
        }catch(error){if(raw!==undefined&&!committed&&!quarantine.has(rid))cleanupRaw(rid,r,raw,signal.aborted||gen.get(k)!==g?'stale-work':'rejected-materialization',error);throw error}
      }});
    }catch(e){ledger.release(rid);throw e}
    active.set(k,{jobId:jid,g,taskClass:r.taskClass,state:r.targetState,gpuEstimateBytes:r.estimate.gpuEstimateBytes});
    try{return await h.promise}finally{if(active.get(k)?.jobId===jid)active.delete(k);if(!entries.has(r.cache.digest)&&!quarantine.has(rid)&&!detached.has(rid))ledger.release(rid)}
  }
  async function reconcileWorkingSet(xs){C.assert(Array.isArray(xs)&&xs.length<=max,'BUDGET','working set');const want=new Set();for(const x of xs){const key=logical(norm(x));C.assert(!want.has(key),'DUPLICATE','working set logical identity '+key);want.add(key)}for(const e of [...entries.values()])if(!want.has(e.logicalKey)){e.pinned=false;release(e,'working-set')}return Promise.allSettled(xs.map(request))}
  function handleMemoryPressure(level){
    C.assert(['MODERATE','CRITICAL'].includes(level),'RESOURCE','pressure');m.memoryPressureEvents++;
    const cancelled=cancelPending(a=>level==='CRITICAL'?a.taskClass!=='INTERACTION':a.taskClass==='PREFETCH'||a.taskClass==='HISTORY_RECONCILE','memory-pressure-'+level.toLowerCase());
    const target=level==='CRITICAL'?0:Math.floor(max/2);let evicted=0;
    while(entries.size>target){const e=candidates(null,level==='CRITICAL')[0];if(!e)break;if(level==='CRITICAL')e.pinned=false;release(e,'memory-pressure');evicted++}
    return Object.freeze({cancelled,evicted});
  }
  function handleContextLoss(){
    m.contextLosses++;const cancelled=cancelPending(a=>a.taskClass==='RENDER_PREP'||a.gpuEstimateBytes>0,'context-loss');let evicted=0;
    for(const e of [...entries.values()])if(e.usage.gpuEstimateBytes>0){e.pinned=false;release(e,'context-loss');evicted++}
    return Object.freeze({cancelled,evicted});
  }
  async function restoreWorkingSet(xs){
    m.restorations++;cancelPending(()=>true,'restore');active.clear();for(const e of [...entries.values()]){e.pinned=false;release(e,'restore')}return reconcileWorkingSet(xs);
  }
  function pauseBackground(reason='lifecycle'){return cancelPending(a=>a.taskClass==='PREFETCH'||a.taskClass==='HISTORY_RECONCILE',reason)}
  function snapshot(){const states=Object.fromEntries(R.STATES.map(s=>[s,0]));for(const e of entries.values())states[e.state]++;return C.data({version:V,workingSet:{entries:entries.size,active:active.size,quarantined:quarantine.size,detached:detached.size,states},metrics:m,scheduler:scheduler.snapshot(),resources:ledger.snapshot(),workers:workers?workers.snapshot():null},{bytes:262144,nodes:8192})}
  async function drain(){await scheduler.drain();return snapshot()}
  return Object.freeze({VERSION:V,registerMaterializer:reg,request,reconcileWorkingSet,restoreWorkingSet,handleMemoryPressure,handleContextLoss,pauseBackground,retryQuarantinedReleases,invalidate:x=>invalidateLogical(R.logicalIdentityKey(x),'explicit'),snapshot,drain});
}
O.v2x01MaterializationRuntime=Object.freeze({VERSION:V,create})
})(globalThis);
