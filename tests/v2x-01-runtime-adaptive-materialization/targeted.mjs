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
assert.equal(O.v2x01Contracts.workloadDomain(),'default');
const defaultDomainScheduler=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:2}});assert.equal(await defaultDomainScheduler.schedule({id:'default-domain',taskClass:'REFINE',state:'WARM',run:async()=>1}).promise,1);assert.equal(defaultDomainScheduler.snapshot().metrics.startedByWorkload.default,1);
assert.throws(()=>O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:2}}).schedule({id:'bad-preemptible',taskClass:'REFINE',state:'WARM',run:async()=>1,preemptible:'yes'}),/preemptible/);

// Adaptive state is runtime policy over normalized central signals; it does not infer camera or scale semantics.
const adaptive=O.v2x01Contracts.adaptiveState;
assert.equal(adaptive({visible:false,selected:true,scaleRelevancePpm:0,causalRelevancePpm:0}).state,'IMMEDIATE');
assert.equal(adaptive({visible:true,selected:false,scaleRelevancePpm:0,causalRelevancePpm:0}).state,'WARM');
assert.equal(adaptive({visible:false,selected:false,scaleRelevancePpm:600000,causalRelevancePpm:0}).state,'HOT');
assert.equal(adaptive({visible:false,selected:false,scaleRelevancePpm:0,causalRelevancePpm:600000}).state,'HOT');
assert.equal(adaptive({visible:false,selected:false,scaleRelevancePpm:400000,causalRelevancePpm:0,previousState:'HOT'}).reason,'HOT_HYSTERESIS');
assert.equal(adaptive({visible:false,selected:false,scaleRelevancePpm:100000,causalRelevancePpm:0,previousState:'WARM'}).reason,'WARM_HYSTERESIS');
assert.equal(adaptive({visible:false,selected:false,scaleRelevancePpm:0,causalRelevancePpm:0}).state,'COLD');
assert.throws(()=>adaptive({visible:true,selected:false,scaleRelevancePpm:1000001,causalRelevancePpm:0}),/scale relevance ppm/);

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
function enqueueHigh(n){const handle=fair.schedule({id:'task.chain-'+n,taskClass:'REFINE',state:'IMMEDIATE',run:async()=>{highStarted++;if(n<40)enqueueHigh(n+1);return n}});chained.push(handle.promise.catch(()=>{}));}
enqueueHigh(1);
assert.equal(await waiting.promise,'warm');
assert(lowObservedAt>=1&&lowObservedAt<=8,'WARM work exceeded deterministic same-class starvation bound');
await fair.drain();await Promise.all(chained);assert.equal(highStarted,40);assert(fair.snapshot().metrics.startedByState.WARM>=1);

const classFair=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:8}});
let interactionsStarted=0,prefetchObservedAt=-1;const interactionPromises=[];
const waitingPrefetch=classFair.schedule({id:'task.waiting-prefetch',taskClass:'PREFETCH',state:'WARM',run:async()=>{prefetchObservedAt=interactionsStarted;return'prefetch'}});
function enqueueInteraction(n){const handle=classFair.schedule({id:'task.interaction-chain-'+n,taskClass:'INTERACTION',state:'IMMEDIATE',preemptible:false,run:async()=>{interactionsStarted++;if(n<40)enqueueInteraction(n+1);return n}});interactionPromises.push(handle.promise.catch(()=>{}))}
enqueueInteraction(1);assert.equal(await waitingPrefetch.promise,'prefetch');assert(prefetchObservedAt>=1&&prefetchObservedAt<=8,'PREFETCH exceeded deterministic cross-class starvation bound');await classFair.drain();await Promise.all(interactionPromises);assert.equal(interactionsStarted,40);

// Same-class terrain flood must not starve life/civilization/matter workloads.
const domainFair=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:32}});let releaseDomainGate;const domainGate=domainFair.schedule({id:'domain.gate',taskClass:'REFINE',state:'HOT',workloadDomain:'terrain',run:()=>new Promise(r=>{releaseDomainGate=r})});await sleep(0);const domainOrder=[],domainPromises=[];
for(let i=0;i<12;i++){const hnd=domainFair.schedule({id:'domain.terrain.'+i,taskClass:'REFINE',state:'HOT',workloadDomain:'terrain',run:async()=>{domainOrder.push('terrain');return i}});domainPromises.push(hnd.promise)}
for(const domain of ['life','civilization','matter']){const hnd=domainFair.schedule({id:'domain.'+domain,taskClass:'REFINE',state:'WARM',workloadDomain:domain,run:async()=>{domainOrder.push(domain);return domain}});domainPromises.push(hnd.promise)}
releaseDomainGate();await domainGate.promise;await Promise.all(domainPromises);for(const domain of ['life','civilization','matter'])assert(domainOrder.indexOf(domain)>=0&&domainOrder.indexOf(domain)<=3,domain+' workload starved behind terrain flood');const domainSnap=domainFair.snapshot();assert.equal(domainSnap.metrics.startedByWorkload.terrain,13);assert.equal(domainSnap.metrics.startedByWorkload.life,1);assert.equal(domainSnap.metrics.startedByWorkload.civilization,1);assert.equal(domainSnap.metrics.startedByWorkload.matter,1);assert.equal(domainSnap.fairness.workloadPolicy,'OLDEST_LAST_SERVED_THEN_FIFO');

// Returning workloads must not be penalized by their historical dispatch count.
const returningFair=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:32}});for(let i=0;i<16;i++)await returningFair.schedule({id:'returning.prime.'+i,taskClass:'REFINE',state:'HOT',workloadDomain:'terrain',run:async()=>i}).promise;let returningRelease;const returningGate=returningFair.schedule({id:'returning.gate',taskClass:'REFINE',state:'HOT',workloadDomain:'gate',run:()=>new Promise(r=>{returningRelease=r})});await sleep(0);const returningOrder=[],returningPromises=[];for(let i=0;i<16;i++)returningPromises.push(returningFair.schedule({id:'returning.life.'+i,taskClass:'REFINE',state:'HOT',workloadDomain:'life',run:async()=>{returningOrder.push('life')}}).promise);returningPromises.push(returningFair.schedule({id:'returning.terrain',taskClass:'REFINE',state:'HOT',workloadDomain:'terrain',run:async()=>{returningOrder.push('terrain')}}).promise);returningRelease();await returningGate.promise;await Promise.all(returningPromises);assert(returningOrder.indexOf('terrain')>=0&&returningOrder.indexOf('terrain')<=1,'historically busy terrain workload was starved after returning');

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

// Streaming fallback is chunk-bounded, cumulatively byte-bounded, ordered, and applies consumer backpressure before the next chunk.
const streamExecutor=O.v2x01WorkerExecutor.create({maxStreamChunks:4,maxChunkBytes:1024,maxStreamBytes:14,timeoutMs:100});streamExecutor.register({id:'worker.stream',version:'1.0.0',direct:async()=>({ok:true}),directStream:async function*(){yield{n:1};yield{n:2};return{done:true}}});const streamChunks=[];const streamResult=await streamExecutor.executeStream({handlerId:'worker.stream',payload:{x:1},preferWorker:false,onChunk:async(chunk,index)=>{streamChunks.push([index,chunk.n]);await sleep(1)}});assert.equal(streamResult.mode,'STREAM_FALLBACK');assert.equal(streamResult.chunks,2);assert.equal(streamResult.bytes,14);assert.deepEqual(streamResult.value,{done:true});assert.deepEqual(streamChunks,[[0,1],[1,2]]);const streamSnap=streamExecutor.snapshot();assert.equal(streamSnap.metrics.streamFallbackRuns,1);assert.equal(streamSnap.metrics.streamChunks,2);assert.equal(streamSnap.metrics.streamAcks,2);assert.equal(streamSnap.metrics.streamBytes,14);assert.equal(streamSnap.metrics.peakStreamBytes,14);assert.equal(streamSnap.metrics.streamFailures,0);

// Cumulative stream bytes fail closed even when every individual chunk is below maxChunkBytes.
const streamBudgetExecutor=O.v2x01WorkerExecutor.create({maxStreamChunks:4,maxChunkBytes:64,maxStreamBytes:13,timeoutMs:100});streamBudgetExecutor.register({id:'worker.stream-budget',version:'1.0.0',direct:async()=>({ok:true}),directStream:async function*(){yield{n:1};yield{n:2};return{done:true}}});await assert.rejects(streamBudgetExecutor.executeStream({handlerId:'worker.stream-budget',payload:{x:1},preferWorker:false,onChunk:async()=>{}}),/stream bytes/);const streamBudgetSnap=streamBudgetExecutor.snapshot();assert.equal(streamBudgetSnap.metrics.streamChunks,1);assert.equal(streamBudgetSnap.metrics.streamAcks,1);assert.equal(streamBudgetSnap.metrics.streamBytes,7);assert.equal(streamBudgetSnap.metrics.peakStreamBytes,7);assert.equal(streamBudgetSnap.metrics.streamFailures,1);

// Stream handler initialization itself is covered by the overall timeout.
const streamStartTimeoutExecutor=O.v2x01WorkerExecutor.create({timeoutMs:10});streamStartTimeoutExecutor.register({id:'worker.stream-start-timeout',version:'1.0.0',direct:async()=>({ok:true}),directStream:()=>new Promise(()=>{})});await assert.rejects(streamStartTimeoutExecutor.executeStream({handlerId:'worker.stream-start-timeout',payload:{x:1},preferWorker:false,onChunk:async()=>{}}),/STREAM_TIMEOUT/);const streamStartTimeoutSnap=streamStartTimeoutExecutor.snapshot();assert.equal(streamStartTimeoutSnap.metrics.timeouts,1);assert.equal(streamStartTimeoutSnap.metrics.streamFailures,1);

// A timed-out async fallback keeps its resource reservation until the late result is explicitly released.
let detachedReleases=0;const detachedExecutor=O.v2x01WorkerExecutor.create({timeoutMs:5});const detachedRt=O.v2x01MaterializationRuntime.create({workerExecutor:detachedExecutor,budgets:{active:1,queue:2,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,syncFallbackOperations:4,transferBytes:100,taskBytes:65536}});detachedRt.registerMaterializer({providerId:'provider.detached',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){await sleep(25);return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:10,gpuEstimateBytes:10,entities:1,operations:3,transferBytes:1,value:{late:true}}},release(){detachedReleases++}});const detachedReq={durable:{identity:{providerId:'provider.detached',entityId:h('detached'),representationId:'primary'},commitmentDigest:h('detached-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'detached'},presentation:{},estimate:{cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:4,transferBytes:2}};await assert.rejects(detachedRt.request(detachedReq),/FALLBACK_TIMEOUT/);let detachedSnap=detachedRt.snapshot();assert.equal(detachedSnap.workingSet.detached,1);assert.equal(detachedSnap.resources.reserved.operations,4);await sleep(35);detachedSnap=detachedRt.snapshot();assert.equal(detachedSnap.workingSet.detached,0);assert.equal(detachedSnap.resources.reserved.operations,0);assert.equal(detachedSnap.resources.used.operations,0);assert.equal(detachedReleases,1);assert.equal(detachedSnap.metrics.detachedFallbacks,1);assert.equal(detachedSnap.metrics.detachedSettlements,1);

// Lifecycle binding reflects an already-hidden document immediately and coalesces resize without owning navigation state.
const lifecycleEvents=[],docTarget=new EventTarget(),winTarget=new EventTarget();docTarget.visibilityState='hidden';const lifecycle=O.v2x01LifecycleCoordinator.create({resizeDelayMs:0,pauseBackground:r=>lifecycleEvents.push('pause:'+r),resumeBackground:r=>lifecycleEvents.push('resume:'+r),resize:()=>lifecycleEvents.push('resize')});lifecycle.bindDocument(docTarget);assert.equal(lifecycle.snapshot().state.hidden,true);assert(lifecycleEvents.includes('pause:visibility-initial-hidden'));docTarget.visibilityState='visible';docTarget.dispatchEvent(new Event('visibilitychange'));assert(lifecycleEvents.includes('resume:visibility-visible'));lifecycle.bindWindow(winTarget);winTarget.dispatchEvent(new Event('resize'));winTarget.dispatchEvent(new Event('resize'));await sleep(5);assert.equal(lifecycleEvents.filter(x=>x==='resize').length,1);lifecycle.dispose();

const rt=O.v2x01MaterializationRuntime.create({budgets:{active:2,queue:8,cacheEntries:2,materializations:2,cpuEstimateBytes:200,gpuEstimateBytes:200,heapBytes:1024,entities:8,operations:500,transferBytes:500,taskBytes:65536}});
rt.registerMaterializer({providerId:'provider.test',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q,s){if(q.semantic.delay)await new Promise((r,j)=>{const t=setTimeout(r,q.semantic.delay);s.addEventListener('abort',()=>{clearTimeout(t);j(s.reason)},{once:true})});return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.semantic.returnState||q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:q.targetState==='WARM'?0:20,entities:1,operations:5,transferBytes:1,value:{v:q.semantic.v}};}});
const req=(c,d=0,state='HOT',taskClass='REFINE',gpu=30,semanticExtra={})=>({durable:{identity:{providerId:'provider.test',entityId:h('same'),representationId:'primary'},commitmentDigest:h(c),historyDigest:h('history')},targetState:state,taskClass,semantic:{v:c,delay:d,...semanticExtra},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:gpu,entities:1,operations:10,transferBytes:2}});
const adaptiveReq=(id,signals,taskClass='REFINE',gpu=30)=>({durable:{identity:{providerId:'provider.test',entityId:h('adaptive:'+id),representationId:'primary'},commitmentDigest:h('adaptive-c:'+id),historyDigest:h('history')},taskClass,signals,semantic:{v:'adaptive:'+id},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:gpu,entities:1,operations:10,transferBytes:2}});
assert.equal(typeof rt.requestAdaptive,'function');assert.equal(typeof rt.runtimePacket,'function');
const adaptiveWarm=await rt.requestAdaptive(adaptiveReq('visible',{visible:true,selected:false,scaleRelevancePpm:0,causalRelevancePpm:0},'REFINE',30));assert.equal(adaptiveWarm.targetState,'WARM');assert.equal(adaptiveWarm.usage.gpuEstimateBytes,0);assert.equal(adaptiveWarm.adaptiveDecision.reason,'VISIBLE');
const adaptiveSelected=await rt.requestAdaptive(adaptiveReq('selected',{visible:true,selected:true,scaleRelevancePpm:900000,causalRelevancePpm:900000},'INTERACTION',30));assert.equal(adaptiveSelected.targetState,'IMMEDIATE');assert.equal(adaptiveSelected.adaptiveDecision.reason,'SELECTED');
const adaptiveCold=await rt.requestAdaptive(adaptiveReq('cold',{visible:false,selected:false,scaleRelevancePpm:0,causalRelevancePpm:0},'PREFETCH',30));assert.equal(adaptiveCold.targetState,'COLD');assert.equal(adaptiveCold.materialized,false);assert.deepEqual(adaptiveCold.usage,{cpuEstimateBytes:0,gpuEstimateBytes:0,entities:0,operations:0,transferBytes:0});
const runtimePacket=rt.runtimePacket();assert.equal(runtimePacket.contract,'ofu-v2x01-runtime-packet-1');assert.equal(runtimePacket.authority,'MEASURED_RUNTIME_EVIDENCE');assert.equal(runtimePacket.adaptivePolicyVersion,O.v2x01Contracts.ADAPTIVE_POLICY_VERSION);assert(runtimePacket.metrics.adaptiveDecisions>=3);assert(runtimePacket.scheduler.metrics.startedByWorkload.test>=2);assert(Object.values(runtimePacket.centralAuthorityClaims).every(x=>x===false));

const old=rt.request(req('old',30));await sleep(5);const fresh=rt.request(req('new'));await old.catch(()=>{});assert.equal((await fresh).commitmentDigest,h('new'));
await assert.rejects(rt.request(req('wrong-state',0,'HOT','REFINE',30,{returnState:'WARM'})),/state mismatch/);
await assert.rejects(rt.request(req('warm-gpu',0,'WARM','REFINE',30)),/warm request cannot reserve GPU/);
await assert.rejects(rt.request(req('cold-nonzero',0,'COLD','REFINE',1)),/cold request must reserve zero/);
await assert.rejects(rt.reconcileWorkingSet([req('dup-a'),req('dup-b')]),/working set logical identity/);
const gpu=rt.request(req('gpu',30,'HOT','REFINE',30));await sleep(5);const loss=rt.handleContextLoss();assert(loss.cancelled>=1);await gpu.catch(()=>{});let snap=await rt.drain();assert.equal(snap.resources.used.gpuEstimateBytes,0);
await rt.request(req('pinned',0,'IMMEDIATE','INTERACTION',30));assert.equal(rt.snapshot().workingSet.entries,1);const pressure=rt.handleMemoryPressure('CRITICAL');assert(pressure.evicted>=1);snap=await rt.drain();assert.equal(snap.workingSet.entries,0);assert(['UNKNOWN','MEASURED_RUNTIME_EVIDENCE'].includes(snap.resources.heap.state));assert.equal(snap.resources.gpu.state,'ESTIMATED');

// Runtime pins are retention preferences, not an escape from the hard cache bound.
const pinBoundRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:2,cacheEntries:1,materializations:1,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,transferBytes:100,taskBytes:65536}});pinBoundRt.registerMaterializer({providerId:'provider.pin-bound',domain:'pin-bound',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:10,gpuEstimateBytes:10,entities:1,operations:2,transferBytes:1,value:{id:q.semantic.id}}}});const pinReq=id=>({durable:{identity:{providerId:'provider.pin-bound',entityId:h('pin:'+id),representationId:'primary'},commitmentDigest:h('pin-c:'+id),historyDigest:h('history')},targetState:'IMMEDIATE',taskClass:'INTERACTION',semantic:{id},presentation:{},estimate:{cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:4,transferBytes:2}});await pinBoundRt.request(pinReq('a'));await pinBoundRt.request(pinReq('b'));const pinBoundSnap=await pinBoundRt.drain();assert.equal(pinBoundSnap.workingSet.entries,1);assert.equal(pinBoundSnap.metrics.forcedPinnedEvictions,1);assert(pinBoundSnap.resources.used.cpuEstimateBytes<=100);assert(pinBoundSnap.resources.used.gpuEstimateBytes<=100);

const fallbackRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:4,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,syncFallbackOperations:4,transferBytes:100,taskBytes:65536}});fallbackRt.registerMaterializer({providerId:'provider.fallback',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:3,transferBytes:1,value:{ok:true}}}});const fallbackReq={durable:{identity:{providerId:'provider.fallback',entityId:h('fallback'),representationId:'primary'},commitmentDigest:h('fallback-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'fallback'},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:30,entities:1,operations:8,transferBytes:2}};const fallbackGood={...fallbackReq,durable:{...fallbackReq.durable,commitmentDigest:h('fallback-good')},semantic:{id:'fallback-good'},estimate:{...fallbackReq.estimate,operations:4}};await fallbackRt.request(fallbackGood);const fallbackBeforeReject=fallbackRt.snapshot();assert.equal(fallbackBeforeReject.workingSet.entries,1);assert.equal(fallbackBeforeReject.resources.used.operations,3);await assert.rejects(fallbackRt.request(fallbackReq),/SYNC_FALLBACK_BUDGET/);const fallbackSnap=fallbackRt.snapshot();assert.equal(fallbackSnap.metrics.fallbackAdmissionRejects,1);assert.equal(fallbackSnap.workingSet.entries,1);assert.equal(fallbackSnap.resources.used.operations,3);assert.equal(fallbackSnap.resources.reserved.operations,0);assert.equal(fallbackSnap.workers.metrics.fallbackRuns,1);

let releaseAttempts=0;const releaseRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:4,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,transferBytes:100,taskBytes:65536}});releaseRt.registerMaterializer({providerId:'provider.release',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:5,transferBytes:1,value:{ok:true}}},release(){releaseAttempts++;if(releaseAttempts===1)throw new Error('synthetic release failure')}});const releaseReq={durable:{identity:{providerId:'provider.release',entityId:h('release'),representationId:'primary'},commitmentDigest:h('release-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'release'},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:30,entities:1,operations:10,transferBytes:2}};await releaseRt.request(releaseReq);assert.throws(()=>releaseRt.handleMemoryPressure('CRITICAL'),/RELEASE_FAILURE/);let releaseSnap=releaseRt.snapshot();assert.equal(releaseSnap.workingSet.entries,1);assert.equal(releaseSnap.resources.used.gpuEstimateBytes,20);assert.equal(releaseSnap.metrics.releaseFailures,1);assert.equal(releaseRt.handleMemoryPressure('CRITICAL').evicted,1);releaseSnap=await releaseRt.drain();assert.equal(releaseSnap.workingSet.entries,0);assert.equal(releaseSnap.resources.used.gpuEstimateBytes,0);

let quarantineReleaseAttempts=0;const quarantineRt=O.v2x01MaterializationRuntime.create({budgets:{active:1,queue:4,cacheEntries:2,materializations:2,cpuEstimateBytes:100,gpuEstimateBytes:100,heapBytes:1024,entities:4,operations:100,transferBytes:100,taskBytes:65536}});quarantineRt.registerMaterializer({providerId:'provider.quarantine',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:'WARM',cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:5,transferBytes:1,value:{bad:true}}},release(){quarantineReleaseAttempts++;if(quarantineReleaseAttempts===1)throw new Error('synthetic rejected-result release failure')}});const quarantineReq={durable:{identity:{providerId:'provider.quarantine',entityId:h('quarantine'),representationId:'primary'},commitmentDigest:h('quarantine-c'),historyDigest:h('history')},targetState:'HOT',taskClass:'REFINE',semantic:{id:'quarantine'},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:30,entities:1,operations:10,transferBytes:2}};await assert.rejects(quarantineRt.request(quarantineReq),/RELEASE_FAILURE/);let quarantineSnap=quarantineRt.snapshot();assert.equal(quarantineSnap.workingSet.quarantined,1);assert.equal(quarantineSnap.resources.used.gpuEstimateBytes,30);assert.equal(quarantineSnap.resources.reserved.gpuEstimateBytes,0);assert.equal(quarantineSnap.metrics.quarantinedReleases,1);const recovered=quarantineRt.retryQuarantinedReleases('targeted-retry');assert.deepEqual(recovered,{released:1,failed:0,remaining:0});quarantineSnap=await quarantineRt.drain();assert.equal(quarantineSnap.workingSet.quarantined,0);assert.equal(quarantineSnap.resources.used.gpuEstimateBytes,0);assert.equal(quarantineSnap.metrics.quarantineRecoveries,1);

const pf=O.v2x01BoundedPrefetch.create({maxCandidates:3,maxRequests:2});assert.throws(()=>pf.plan({intentSnapshot:{},candidates:[{request:{durable:req('x').durable,targetState:'IMMEDIATE',taskClass:'PREFETCH',semantic:{},presentation:{},estimate:{cpuEstimateBytes:0,gpuEstimateBytes:0,entities:0,operations:0,transferBytes:0}},priority:1,distanceHint:1}]}),/AUTHORITY/);assert.throws(()=>pf.plan({intentSnapshot:{},candidates:[{request:{...req('elevated',0,'WARM','REFINE',0)},priority:1,distanceHint:1}]}),/AUTHORITY/);const p1=req('prefetch-low',0,'WARM','PREFETCH',0),p2=req('prefetch-high',0,'WARM','PREFETCH',0);const selected=pf.plan({intentSnapshot:{direction:'forward'},candidates:[{request:p1,priority:1,distanceHint:1},{request:p2,priority:2,distanceHint:2}]});assert.equal(selected.length,1);assert.equal(selected[0].durable.commitmentDigest,h('prefetch-high'));assert.equal(pf.snapshot().metrics.duplicatesDropped,1);

console.log(JSON.stringify({status:'PASS',oracle:'V2X01_RUNTIME_TARGETED_INVARIANTS',generation:'V2_RUNTIME_2',starvationBound:{sameClassImmediateStartsBeforeWarm:lowObservedAt,crossClassInteractionsBeforePrefetch:prefetchObservedAt,workloadOrder:domainOrder.slice(0,8)},adaptivePolicy:{version:O.v2x01Contracts.ADAPTIVE_POLICY_VERSION,packet:runtimePacket},streaming:{success:streamSnap,budget:streamBudgetSnap,startTimeout:streamStartTimeoutSnap},snapshot:snap,detachedSnapshot:detachedSnap,fallbackSnapshot:fallbackSnap,releaseSnapshot:releaseSnap,quarantineSnapshot:quarantineSnap,prefetch:pf.snapshot()}));

// Exercise the shipping Living binding against the real registration and request contracts.
let livingDraws=0;
O.v1LivingRenderer={create:()=>({render:async()=>{livingDraws++},state:()=>({}),dispose(){}})};
vm.runInThisContext(fs.readFileSync('src/runtime/living-materialization-binding.js','utf8'),{filename:'src/runtime/living-materialization-binding.js'});
const livingBound=O.v1LivingRenderer.create({width:390,height:844},null);
await livingBound.render({stage:'UNIVERSE',semanticScale:'galaxy',revision:0,historyDepth:0});
assert.equal(livingDraws,1);
assert.equal(livingBound.state().v2x01.failures,0);
assert.equal(livingBound.state().v2x01.requests,1);
assert(livingBound.state().v2x01.runtimePacket);
livingBound.dispose();
console.log(JSON.stringify({status:'PASS',oracle:'V2X01_REAL_LIVING_MATERIALIZER_CONTRACT'}));
