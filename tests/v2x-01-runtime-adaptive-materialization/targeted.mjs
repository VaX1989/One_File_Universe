import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of[
  'src/kernel/sha256.js','src/extensions/contracts.js','src/runtime/v2x-01-contracts.js',
  'src/simulation/materialization/cache-key.js','src/runtime/scheduling/adaptive-scheduler.js',
  'src/runtime/resources/resource-ledger.js','src/runtime/workers/worker-executor.js',
  'src/runtime/prefetch/bounded-prefetch.js','src/runtime/lifecycle/lifecycle-coordinator.js',
  'src/simulation/materialization/materialization-runtime.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});

const O=globalThis.OFU,h=x=>crypto.createHash('sha256').update(x).digest('hex'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base={identity:{providerId:'provider.test',entityId:h('e'),representationId:'primary'},modelVersion:'1.0.0',representationVersion:'1.0.0',commitmentDigest:h('c'),historyDigest:h('h'),semanticDigest:h('s')};
assert.notEqual(O.v2x01CacheKey.create(base).digest,O.v2x01CacheKey.create({...base,modelVersion:'1.0.1'}).digest);

assert.throws(()=>O.v2x01Contracts.budgets({gpuEstimateBytez:1}),/unknown field/);
assert.throws(()=>O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:2}}).schedule({id:'bad-preemptible',taskClass:'REFINE',state:'WARM',run:async()=>1,preemptible:'yes'}),/preemptible/);

// State priority must remain responsive without starving lower lifecycle states.
const prio=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:4}});
let unblock;
const gate=prio.schedule({id:'task.gate',taskClass:'REFINE',state:'WARM',run:()=>new Promise(r=>{unblock=r})});
await sleep(0);
const order=[];
const low=prio.schedule({id:'task.low',taskClass:'REFINE',state:'WARM',run:async()=>{order.push('low');return'low'}});
const high=prio.schedule({id:'task.high',taskClass:'REFINE',state:'IMMEDIATE',run:async()=>{order.push('high');return'high'}});
unblock('gate');
await gate.promise;await Promise.all([low.promise,high.promise]);
assert.deepEqual(order,['high','low']);

const fair=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:8}});
let highStarted=0,lowObservedAt=-1;
const chained=[];
const waiting=fair.schedule({id:'task.waiting-warm',taskClass:'REFINE',state:'WARM',run:async()=>{lowObservedAt=highStarted;return'warm'}});
function enqueueHigh(n){
  const handle=fair.schedule({id:'task.chain-'+n,taskClass:'REFINE',state:'IMMEDIATE',run:async()=>{highStarted++;if(n<40)enqueueHigh(n+1);return n}});
  chained.push(handle.promise.catch(()=>{}));
}
enqueueHigh(1);
assert.equal(await waiting.promise,'warm');
assert(lowObservedAt>=1&&lowObservedAt<=8,'WARM work exceeded deterministic same-class starvation bound');
await fair.drain();await Promise.all(chained);assert.equal(highStarted,40);assert(fair.snapshot().metrics.startedByState.WARM>=1);

const classFair=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:8}});
let interactionsStarted=0,prefetchObservedAt=-1;const interactionPromises=[];
const waitingPrefetch=classFair.schedule({id:'task.waiting-prefetch',taskClass:'PREFETCH',state:'WARM',run:async()=>{prefetchObservedAt=interactionsStarted;return'prefetch'}});
function enqueueInteraction(n){const handle=classFair.schedule({id:'task.interaction-chain-'+n,taskClass:'INTERACTION',state:'IMMEDIATE',preemptible:false,run:async()=>{interactionsStarted++;if(n<40)enqueueInteraction(n+1);return n}});interactionPromises.push(handle.promise.catch(()=>{}))}
enqueueInteraction(1);assert.equal(await waitingPrefetch.promise,'prefetch');assert(prefetchObservedAt>=1&&prefetchObservedAt<=8,'PREFETCH exceeded deterministic cross-class starvation bound');await classFair.drain();await Promise.all(interactionPromises);assert.equal(interactionsStarted,40);

// Direct interaction still preempts lower-priority cooperative work.
const sch=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:4}});
const bg=sch.schedule({id:'task.bg',taskClass:'PREFETCH',state:'WARM',run:s=>new Promise((r,j)=>s.addEventListener('abort',()=>j(s.reason),{once:true}))});
await sleep(0);
const urgent=sch.schedule({id:'task.interaction',taskClass:'INTERACTION',state:'IMMEDIATE',run:async()=>1});
await bg.promise.catch(()=>{});assert.equal(await urgent.promise,1);assert(sch.snapshot().metrics.preemptionSignals>=1);

// Multiple interaction arrivals must preempt distinct already-active victims rather than repeatedly signalling one aborted job.
const multi=O.v2x01AdaptiveScheduler.create({budgets:{active:2,queue:8}}),multiBg=[],multiInteraction=[],multiReleases=[];
for(let i=0;i<2;i++){const handle=multi.schedule({id:'task.multi-bg-'+i,taskClass:'PREFETCH',state:'WARM',run:signal=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(signal.reason),{once:true})})});multiBg.push(handle.promise.catch(()=>{}) )}
await sleep(0);for(let i=0;i<2;i++){const handle=multi.schedule({id:'task.multi-interaction-'+i,taskClass:'INTERACTION',state:'IMMEDIATE',run:()=>new Promise(resolve=>{multiReleases[i]=resolve})});multiInteraction.push(handle)}
await sleep(0);assert.deepEqual(multiInteraction.map(x=>x.status()),['ACTIVE','ACTIVE']);assert.equal(multi.snapshot().metrics.preemptionSignals,2);for(const release of multiReleases)release();await Promise.all([...multiBg,...multiInteraction.map(x=>x.promise)]);

// Cancellation is idempotent while an active job is already aborting.
const cancelSched=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:2}});const cancelJob=cancelSched.schedule({id:'task.cancel-idempotent',taskClass:'PREFETCH',state:'WARM',run:signal=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))});await sleep(0);assert.equal(cancelJob.cancel('first'),true);assert.equal(cancelJob.cancel('second'),false);await cancelJob.promise.catch(()=>{});assert.equal(cancelSched.snapshot().metrics.cancelled,1);

// Async fallback that ignores AbortSignal cannot retain a scheduler slot forever; abort and timeout race it.
const abortExecutor=O.v2x01WorkerExecutor.create({timeoutMs:50});abortExecutor.register({id:'worker.abort',version:'1.0.0',direct:()=>new Promise(()=>{})});const abortController=new AbortController(),abortPromise=abortExecutor.execute({handlerId:'worker.abort',payload:{x:1},signal:abortController.signal,preferWorker:false});setTimeout(()=>abortController.abort(),5);await assert.rejects(abortPromise,/CANCELLED/);assert.equal(abortExecutor.snapshot().metrics.cancelled,1);
const timeoutExecutor=O.v2x01WorkerExecutor.create({timeoutMs:10});timeoutExecutor.register({id:'worker.timeout',version:'1.0.0',direct:()=>new Promise(()=>{})});await assert.rejects(timeoutExecutor.execute({handlerId:'worker.timeout',payload:{x:1},preferWorker:false}),/FALLBACK_TIMEOUT/);assert.equal(timeoutExecutor.snapshot().metrics.timeouts,1);

// A timed-out async fallback keeps its resource reservation until the late result is explicitly released.
let detachedReleases=0;const detachedExecutor=O.v2x01WorkerExecutor.create({timeoutMs:5});const detachedRt=O.v2x01MaterializationRuntime.create({workerExecutor:detachedExecutor,budgets:{active:1,queue:2,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,syncFallbackOperations:4,transferBytes:100,taskBytes:65536}});detachedRt.registerMaterializer({providerId:'provider.detached',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){await sleep(25);return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:10,gpuEstimateBytes:10,entities:1,operations:3,transferBytes:1,value:{late:true}}},release(){detachedReleases++}});const detachedReq={durable:{identity:{providerId:'provider.detached',entityId:h('detached'),representationId:'primary'},commitmentDigest:h('detached-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'detached'},presentation:{},estimate:{cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:4,transferBytes:2}};await assert.rejects(detachedRt.request(detachedReq),/FALLBACK_TIMEOUT/);let detachedSnap=detachedRt.snapshot();assert.equal(detachedSnap.workingSet.detached,1);assert.equal(detachedSnap.resources.reserved.operations,4);await sleep(35);detachedSnap=detachedRt.snapshot();assert.equal(detachedSnap.workingSet.detached,0);assert.equal(detachedSnap.resources.reserved.operations,0);assert.equal(detachedSnap.resources.used.operations,0);assert.equal(detachedReleases,1);assert.equal(detachedSnap.metrics.detachedFallbacks,1);assert.equal(detachedSnap.metrics.detachedSettlements,1);

// Lifecycle binding reflects an already-hidden document immediately and coalesces resize without owning navigation state.
const lifecycleEvents=[],docTarget=new EventTarget(),winTarget=new EventTarget();docTarget.visibilityState='hidden';const lifecycle=O.v2x01LifecycleCoordinator.create({resizeDelayMs:0,pauseBackground:r=>lifecycleEvents.push('pause:'+r),resumeBackground:r=>lifecycleEvents.push('resume:'+r),resize:()=>lifecycleEvents.push('resize')});lifecycle.bindDocument(docTarget);assert.equal(lifecycle.snapshot().state.hidden,true);assert(lifecycleEvents.includes('pause:visibility-initial-hidden'));docTarget.visibilityState='visible';docTarget.dispatchEvent(new Event('visibilitychange'));assert(lifecycleEvents.includes('resume:visibility-visible'));lifecycle.bindWindow(winTarget);winTarget.dispatchEvent(new Event('resize'));winTarget.dispatchEvent(new Event('resize'));await sleep(5);assert.equal(lifecycleEvents.filter(x=>x==='resize').length,1);lifecycle.dispose();

const rt=O.v2x01MaterializationRuntime.create({budgets:{active:2,queue:8,cacheEntries:2,materializations:2,cpuEstimateBytes:200,gpuEstimateBytes:200,heapBytes:1024,entities:8,operations:500,transferBytes:500,taskBytes:65536}});
rt.registerMaterializer({providerId:'provider.test',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q,s){
  if(q.semantic.delay)await new Promise((r,j)=>{const t=setTimeout(r,q.semantic.delay);s.addEventListener('abort',()=>{clearTimeout(t);j(s.reason)},{once:true})});
  return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.semantic.returnState||q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:q.targetState==='WARM'?0:20,entities:1,operations:5,transferBytes:1,value:{v:q.semantic.v}};
}});
const req=(c,d=0,state='HOT',taskClass='REFINE',gpu=30,semanticExtra={})=>({durable:{identity:{providerId:'provider.test',entityId:h('same'),representationId:'primary'},commitmentDigest:h(c),historyDigest:h('history')},targetState:state,taskClass,semantic:{v:c,delay:d,...semanticExtra},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:gpu,entities:1,operations:10,transferBytes:2}});

const old=rt.request(req('old',30));await sleep(5);const fresh=rt.request(req('new'));await old.catch(()=>{});assert.equal((await fresh).commitmentDigest,h('new'));
await assert.rejects(rt.request(req('wrong-state',0,'HOT','REFINE',30,{returnState:'WARM'})),/state mismatch/);
await assert.rejects(rt.request(req('warm-gpu',0,'WARM','REFINE',30)),/warm request cannot reserve GPU/);
await assert.rejects(rt.request(req('cold-nonzero',0,'COLD','REFINE',1)),/cold request must reserve zero/);
await assert.rejects(rt.reconcileWorkingSet([req('dup-a'),req('dup-b')]),/working set logical identity/);

const gpu=rt.request(req('gpu',30,'HOT','REFINE',30));await sleep(5);const loss=rt.handleContextLoss();assert(loss.cancelled>=1);await gpu.catch(()=>{});let snap=await rt.drain();assert.equal(snap.resources.used.gpuEstimateBytes,0);

await rt.request(req('pinned',0,'IMMEDIATE','INTERACTION',30));assert.equal(rt.snapshot().workingSet.entries,1);const pressure=rt.handleMemoryPressure('CRITICAL');assert(pressure.evicted>=1);snap=await rt.drain();assert.equal(snap.workingSet.entries,0);
assert(['UNKNOWN','MEASURED_RUNTIME_EVIDENCE'].includes(snap.resources.heap.state));assert.equal(snap.resources.gpu.state,'ESTIMATED');

// Heavy synchronous fallback is rejected before reservation when Worker execution is unavailable.
const fallbackRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:4,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,syncFallbackOperations:4,transferBytes:100,taskBytes:65536}});
fallbackRt.registerMaterializer({providerId:'provider.fallback',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:3,transferBytes:1,value:{ok:true}}}});
const fallbackReq={durable:{identity:{providerId:'provider.fallback',entityId:h('fallback'),representationId:'primary'},commitmentDigest:h('fallback-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'fallback'},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:30,entities:1,operations:8,transferBytes:2}};
const fallbackGood={...fallbackReq,durable:{...fallbackReq.durable,commitmentDigest:h('fallback-good')},semantic:{id:'fallback-good'},estimate:{...fallbackReq.estimate,operations:4}};await fallbackRt.request(fallbackGood);const fallbackBeforeReject=fallbackRt.snapshot();assert.equal(fallbackBeforeReject.workingSet.entries,1);assert.equal(fallbackBeforeReject.resources.used.operations,3);
await assert.rejects(fallbackRt.request(fallbackReq),/SYNC_FALLBACK_BUDGET/);const fallbackSnap=fallbackRt.snapshot();assert.equal(fallbackSnap.metrics.fallbackAdmissionRejects,1);assert.equal(fallbackSnap.workingSet.entries,1);assert.equal(fallbackSnap.resources.used.operations,3);assert.equal(fallbackSnap.resources.reserved.operations,0);assert.equal(fallbackSnap.workers.metrics.fallbackRuns,1);

// Provider release is transactional: a failed physical/runtime release must not erase accounting.
let releaseAttempts=0;
const releaseRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:4,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,transferBytes:100,taskBytes:65536}});
releaseRt.registerMaterializer({providerId:'provider.release',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:5,transferBytes:1,value:{ok:true}}},release(){releaseAttempts++;if(releaseAttempts===1)throw new Error('synthetic release failure')}});
const releaseReq={durable:{identity:{providerId:'provider.release',entityId:h('release'),representationId:'primary'},commitmentDigest:h('release-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'release'},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:30,entities:1,operations:10,transferBytes:2}};
await releaseRt.request(releaseReq);assert.throws(()=>releaseRt.handleMemoryPressure('CRITICAL'),/RELEASE_FAILURE/);let releaseSnap=releaseRt.snapshot();assert.equal(releaseSnap.workingSet.entries,1);assert.equal(releaseSnap.resources.used.gpuEstimateBytes,20);assert.equal(releaseSnap.metrics.releaseFailures,1);assert.equal(releaseRt.handleMemoryPressure('CRITICAL').evicted,1);releaseSnap=await releaseRt.drain();assert.equal(releaseSnap.workingSet.entries,0);assert.equal(releaseSnap.resources.used.gpuEstimateBytes,0);

// Invalid materializer output must be released; if release itself fails, accounting is quarantined until a successful retry.
let quarantineReleaseAttempts=0;
const quarantineRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:4,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,transferBytes:100,taskBytes:65536}});
quarantineRt.registerMaterializer({providerId:'provider.quarantine',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:'WARM',cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:5,transferBytes:1,value:{bad:true}}},release(){quarantineReleaseAttempts++;if(quarantineReleaseAttempts===1)throw new Error('synthetic rejected-result release failure')}});
const quarantineReq={durable:{identity:{providerId:'provider.quarantine',entityId:h('quarantine'),representationId:'primary'},commitmentDigest:h('quarantine-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'quarantine'},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:30,entities:1,operations:10,transferBytes:2}};
await assert.rejects(quarantineRt.request(quarantineReq),/RELEASE_FAILURE/);let quarantineSnap=quarantineRt.snapshot();assert.equal(quarantineSnap.workingSet.quarantined,1);assert.equal(quarantineSnap.resources.used.gpuEstimateBytes,30);assert.equal(quarantineSnap.resources.reserved.gpuEstimateBytes,0);assert.equal(quarantineSnap.metrics.quarantinedReleases,1);const recovered=quarantineRt.retryQuarantinedReleases('targeted-retry');assert.deepEqual(recovered,{released:1,failed:0,remaining:0});quarantineSnap=await quarantineRt.drain();assert.equal(quarantineSnap.workingSet.quarantined,0);assert.equal(quarantineSnap.resources.used.gpuEstimateBytes,0);assert.equal(quarantineSnap.metrics.quarantineRecoveries,1);

// Prefetch validates complete runtime requests and deduplicates logical identities deterministically.
const pf=O.v2x01BoundedPrefetch.create({maxCandidates:3,maxRequests:2});
assert.throws(()=>pf.plan({intentSnapshot:{},candidates:[{request:{durable:req('x').durable,targetState:'IMMEDIATE',taskClass:'PREFETCH',semantic:{},presentation:{},estimate:{cpuEstimateBytes:0,gpuEstimateBytes:0,entities:0,operations:0,transferBytes:0}},priority:1,distanceHint:1}]}),/AUTHORITY/);
assert.throws(()=>pf.plan({intentSnapshot:{},candidates:[{request:{...req('elevated',0,'WARM','REFINE',0)},priority:1,distanceHint:1}]}),/AUTHORITY/);
const p1=req('prefetch-low',0,'WARM','PREFETCH',0),p2=req('prefetch-high',0,'WARM','PREFETCH',0);
const selected=pf.plan({intentSnapshot:{direction:'forward'},candidates:[{request:p1,priority:1,distanceHint:1},{request:p2,priority:2,distanceHint:2}]});
assert.equal(selected.length,1);assert.equal(selected[0].durable.commitmentDigest,h('prefetch-high'));assert.equal(pf.snapshot().metrics.duplicatesDropped,1);

console.log(JSON.stringify({status:'PASS',oracle:'V2X01_RUNTIME_TARGETED_INVARIANTS',starvationBound:{sameClassImmediateStartsBeforeWarm:lowObservedAt,crossClassInteractionsBeforePrefetch:prefetchObservedAt},snapshot:snap,detachedSnapshot:detachedSnap,fallbackSnapshot:fallbackSnap,releaseSnapshot:releaseSnap,quarantineSnapshot:quarantineSnap,prefetch:pf.snapshot()}));
