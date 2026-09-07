import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of[
  'src/kernel/sha256.js','src/extensions/contracts.js','src/runtime/v2x-01-contracts.js',
  'src/simulation/materialization/cache-key.js','src/runtime/scheduling/adaptive-scheduler.js',
  'src/runtime/resources/resource-ledger.js','src/runtime/workers/worker-executor.js',
  'src/simulation/materialization/materialization-runtime.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});

const O=globalThis.OFU,h=x=>crypto.createHash('sha256').update(x).digest('hex');
const rt=O.v2x01MaterializationRuntime.create({budgets:{active:3,queue:24,cacheEntries:12,materializations:12,cpuEstimateBytes:2048,gpuEstimateBytes:2048,heapBytes:1048576,entities:64,operations:8192,transferBytes:4096,taskBytes:65536}}),domains=['macro','planet','surface','life','civilization','micro'];
for(const d of domains)rt.registerMaterializer({providerId:'provider.'+d,domain:d,modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q){return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:48,gpuEstimateBytes:q.targetState==='WARM'?0:48,entities:1,operations:8,transferBytes:2,value:{d}}}});
const req=(d,id,state='HOT')=>({durable:{identity:{providerId:'provider.'+d,entityId:h(id),representationId:'primary'},commitmentDigest:h('c:'+id),historyDigest:h('history')},targetState:state,taskClass:'REFINE',semantic:{d,id},presentation:{},estimate:{cpuEstimateBytes:64,gpuEstimateBytes:state==='WARM'?0:64,entities:1,operations:16,transferBytes:4}}),path=['macro','planet','surface','life','civilization','micro','surface','planet','macro'];
for(let j=0;j<120;j++)for(let s=0;s<path.length;s++){const r=await rt.reconcileWorkingSet([req(path[s],j+':'+s,s===3?'WARM':'HOT')]);assert.equal(r[0].status,'fulfilled')}
const serial=await rt.drain();assert(serial.workingSet.entries<=12);assert(serial.resources.peak.cpuEstimateBytes<=2048);assert(serial.resources.peak.gpuEstimateBytes<=2048);assert(serial.scheduler.metrics.peakQueued<=24);assert(serial.metrics.evictions>0);

// Deterministic concurrent churn: supersession, cancellation, context loss and pressure must plateau under the same finite accounting rules.
let seed=0x5eed1234,releases=0,fulfilled=0,rejected=0;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const cb={active:4,queue:32,cacheEntries:8,materializations:8,cpuEstimateBytes:2048,gpuEstimateBytes:2048,heapBytes:1048576,entities:64,operations:8192,syncFallbackOperations:64,transferBytes:4096,taskBytes:65536},churn=O.v2x01MaterializationRuntime.create({workerExecutor:false,budgets:cb});
churn.registerMaterializer({providerId:'provider.churn',domain:'churn',modelVersion:'1.0.0',representationVersion:'1.0.0',async load(q,signal){const delay=Math.floor(rnd()*3);if(delay)await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,delay);signal?.addEventListener?.('abort',()=>{clearTimeout(timer);reject(signal.reason)},{once:true})});const warm=q.targetState==='WARM';return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:16,gpuEstimateBytes:warm?0:16,entities:1,operations:4,transferBytes:1,value:{n:q.semantic.n}}},release(){releases++}});
const churnReq=(round,slot)=>{const idx=Math.floor(rnd()*16),state=rnd()<.28?'WARM':'HOT',taskClass=state==='WARM'&&rnd()<.4?'PREFETCH':(rnd()<.12?'RENDER_PREP':'REFINE');return{durable:{identity:{providerId:'provider.churn',entityId:h('churn:'+idx),representationId:'primary'},commitmentDigest:h('churn-c:'+round+':'+slot),historyDigest:h('history')},targetState:state,taskClass,semantic:{n:round*10+slot},presentation:{},estimate:{cpuEstimateBytes:24,gpuEstimateBytes:state==='WARM'?0:24,entities:1,operations:8,transferBytes:2}}};
for(let round=0;round<200;round++){
  const results=await Promise.allSettled(Array.from({length:6},(_,slot)=>churn.request(churnReq(round,slot))));for(const result of results)result.status==='fulfilled'?fulfilled++:rejected++;
  if(round%17===0)churn.handleContextLoss();if(round%19===0)churn.handleMemoryPressure('MODERATE');if(round%53===0)churn.handleMemoryPressure('CRITICAL');
  if(round%20===0){const s=churn.snapshot(),total=k=>s.resources.used[k]+s.resources.reserved[k];assert(s.workingSet.entries<=cb.cacheEntries);assert(s.scheduler.current.active<=cb.active);assert(s.scheduler.current.queued<=cb.queue);for(const k of ['cpuEstimateBytes','gpuEstimateBytes','entities','operations','transferBytes'])assert(total(k)<=cb[k]);assert.equal(s.workingSet.quarantined,0);assert.equal(s.workingSet.detached,0)}
}
await churn.drain();churn.handleMemoryPressure('CRITICAL');const concurrent=await churn.drain();for(const k of ['cpuEstimateBytes','gpuEstimateBytes','entities','operations','transferBytes']){assert.equal(concurrent.resources.reserved[k],0);assert.equal(concurrent.resources.used[k],0)}assert.equal(concurrent.workingSet.entries,0);assert.equal(concurrent.workingSet.active,0);assert.equal(concurrent.workingSet.quarantined,0);assert.equal(concurrent.workingSet.detached,0);assert(concurrent.scheduler.metrics.peakActive<=cb.active);assert(concurrent.resources.peak.cpuEstimateBytes<=cb.cpuEstimateBytes);assert(concurrent.resources.peak.gpuEstimateBytes<=cb.gpuEstimateBytes);assert.equal(fulfilled+rejected,1200);assert.equal(releases,concurrent.metrics.materializations);

console.log(JSON.stringify({status:'PASS',oracle:'V2X01_LONG_RESOURCE_PLATEAU',journeys:120,steps:1080,concurrentRequests:1200,concurrentFulfilled:fulfilled,concurrentRejected:rejected,serial,concurrent}));
