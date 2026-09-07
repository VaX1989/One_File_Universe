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

const sch=O.v2x01AdaptiveScheduler.create({budgets:{active:1,queue:4}});
const bg=sch.schedule({id:'task.bg',taskClass:'PREFETCH',state:'WARM',run:s=>new Promise((r,j)=>s.addEventListener('abort',()=>j(s.reason),{once:true}))});
await sleep(0);
const urgent=sch.schedule({id:'task.interaction',taskClass:'INTERACTION',state:'IMMEDIATE',run:async()=>1});
await bg.promise.catch(()=>{});assert.equal(await urgent.promise,1);assert(sch.snapshot().metrics.preemptionSignals>=1);

const rt=O.v2x01MaterializationRuntime.create({budgets:{active:2,queue:8,cacheEntries:2,materializations:2,cpuEstimateBytes:200,gpuEstimateBytes:200,heapBytes:1024,entities:8,operations:500,transferBytes:500,taskBytes:65536}});
rt.registerMaterializer({providerId:'provider.test',domain:'test',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q,s){
  if(q.semantic.delay)await new Promise((r,j)=>{const t=setTimeout(r,q.semantic.delay);s.addEventListener('abort',()=>{clearTimeout(t);j(s.reason)},{once:true})});
  return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:20,gpuEstimateBytes:20,entities:1,operations:5,transferBytes:1,value:{v:q.semantic.v}};
}});
const req=(c,d=0,state='HOT',taskClass='REFINE',gpu=30)=>({durable:{identity:{providerId:'provider.test',entityId:h('same'),representationId:'primary'},commitmentDigest:h(c),historyDigest:h('history')},targetState:state,taskClass,semantic:{v:c,delay:d},presentation:{},estimate:{cpuEstimateBytes:30,gpuEstimateBytes:gpu,entities:1,operations:10,transferBytes:2}});

const old=rt.request(req('old',30));await sleep(5);const fresh=rt.request(req('new'));await old.catch(()=>{});assert.equal((await fresh).commitmentDigest,h('new'));

const gpu=rt.request(req('gpu',30,'HOT','REFINE',30));await sleep(5);const loss=rt.handleContextLoss();assert(loss.cancelled>=1);await gpu.catch(()=>{});let snap=await rt.drain();assert.equal(snap.resources.used.gpuEstimateBytes,0);

await rt.request(req('pinned',0,'IMMEDIATE','INTERACTION',30));assert.equal(rt.snapshot().workingSet.entries,1);const pressure=rt.handleMemoryPressure('CRITICAL');assert(pressure.evicted>=1);snap=await rt.drain();assert.equal(snap.workingSet.entries,0);
assert(['UNKNOWN','MEASURED_RUNTIME_EVIDENCE'].includes(snap.resources.heap.state));assert.equal(snap.resources.gpu.state,'ESTIMATED');

const pf=O.v2x01BoundedPrefetch.create({maxCandidates:2,maxRequests:1});
assert.throws(()=>pf.plan({intentSnapshot:{},candidates:[{request:{durable:req('x').durable,targetState:'IMMEDIATE',taskClass:'PREFETCH'},priority:1,distanceHint:1}]}),/AUTHORITY/);
console.log(JSON.stringify({status:'PASS',oracle:'V2X01_RUNTIME_TARGETED_INVARIANTS',snapshot:snap}));
