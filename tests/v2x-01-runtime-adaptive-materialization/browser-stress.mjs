import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const engines={chromium,firefox,webkit};
const names=process.env.BROWSER?[process.env.BROWSER]:['chromium','firefox','webkit'];
const file=path.resolve('dist/One_File_Universe.html');
assert(fs.existsSync(file));
for(const name of names)assert(engines[name],`unsupported browser ${name}`);
const url=pathToFileURL(file).href,evidence=[];

for(const name of names){
  const browser=await engines[name].launch({headless:true}),page=await browser.newPage(),requests=[];
  page.on('request',r=>requests.push(r.url()));
  try{
    await page.goto(url,{waitUntil:'load'});
    await page.waitForFunction(()=>OFU.v2x01MaterializationRuntime&&OFU.v2x01WorkerExecutor&&OFU.v2x01Contracts?.adaptiveState,null,{timeout:30000});
    const ev=await page.evaluate(async()=>{
      const h=x=>OFU.pxContracts.digest({x}),sleep=ms=>new Promise(r=>setTimeout(r,ms));
      const rt=OFU.v2x01MaterializationRuntime.create({budgets:{active:2,queue:12,cacheEntries:6,materializations:6,cpuEstimateBytes:1024,gpuEstimateBytes:1024,heapBytes:268435456,entities:32,operations:4096,syncFallbackOperations:4,transferBytes:2048,taskBytes:65536}});
      const program=`async function(q){if(q.semantic.delay)await new Promise(r=>setTimeout(r,q.semantic.delay));const warm=q.targetState==='WARM';return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:32,gpuEstimateBytes:warm?0:32,entities:1,operations:4,transferBytes:2,value:{id:q.semantic.id}}}`;
      rt.registerMaterializer({providerId:'provider.browser',domain:'browser',modelVersion:'1.0.0',representationVersion:'1.0.0',workerProgram:program,async load(q,s){if(q.semantic.delay)await new Promise((r,j)=>{const t=setTimeout(r,q.semantic.delay);s?.addEventListener?.('abort',()=>{clearTimeout(t);j(s.reason)},{once:true})});const warm=q.targetState==='WARM';return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:32,gpuEstimateBytes:warm?0:32,entities:1,operations:4,transferBytes:2,value:{id:q.semantic.id}}}});
      const req=(id,{state='HOT',taskClass='REFINE',delay=0}={})=>({durable:{identity:{providerId:'provider.browser',entityId:h(id),representationId:'primary'},commitmentDigest:h('c:'+id),historyDigest:h('history')},targetState:state,taskClass,semantic:{id,delay},presentation:{},estimate:{cpuEstimateBytes:40,gpuEstimateBytes:state==='WARM'?0:40,entities:1,operations:8,transferBytes:4},preferWorker:true});
      const adaptiveReq=(id,{selected=false,visible=true,scaleRelevancePpm=650000,causalRelevancePpm=50000,delay=0}={})=>{const signals={visible,selected,scaleRelevancePpm,causalRelevancePpm},decision=OFU.v2x01Contracts.adaptiveState(signals),gpu=decision.state==='WARM'||decision.state==='COLD'?0:40;return{durable:{identity:{providerId:'provider.browser',entityId:h('adaptive:'+id),representationId:'primary'},commitmentDigest:h('adaptive-c:'+id),historyDigest:h('history')},taskClass:decision.state==='IMMEDIATE'?'INTERACTION':'REFINE',signals,semantic:{id:'adaptive:'+id,delay},presentation:{},estimate:{cpuEstimateBytes:40,gpuEstimateBytes:gpu,entities:1,operations:8,transferBytes:4},preferWorker:true}};
      for(let i=0;i<160;i++){const settled=await rt.reconcileWorkingSet([req('journey:'+i,{taskClass:i%7?'REFINE':'INTERACTION'})]);if(settled[0].status!=='fulfilled')throw settled[0].reason}
      const scaleLadder=['universe','galaxy','region','stellar-neighborhood','system','orbit','planet','global','regional','local','human','microscopic'],path=[...scaleLadder,...scaleLadder.slice(0,-1).reverse()];let adaptiveRuns=0;
      for(let cycle=0;cycle<12;cycle++)for(let step=0;step<path.length;step++){const scale=path[step],selected=scale==='human'&&cycle%4===0,scaleRelevancePpm=(step+cycle)%5===0?100000:650000,causalRelevancePpm=scale==='human'?800000:50000;const out=await rt.requestAdaptive(adaptiveReq(cycle+':'+step+':'+scale,{selected,scaleRelevancePpm,causalRelevancePpm}));if(!['WARM','HOT','IMMEDIATE'].includes(out.targetState))throw new Error('unexpected adaptive state '+out.targetState);adaptiveRuns++}
      const streamExecutor=OFU.v2x01WorkerExecutor.create({maxStreamChunks:8,maxChunkBytes:1024,timeoutMs:5000});
      const streamProgram=`async function*(q){for(let i=0;i<3;i++)yield{index:i,id:q.id};return{done:true,id:q.id}}`;
      streamExecutor.register({id:'worker.browser-stream',version:'1.0.0',direct:async()=>({ok:true}),workerStreamProgram:streamProgram,directStream:async function*(q){for(let i=0;i<3;i++)yield{index:i,id:q.id};return{done:true,id:q.id}}});
      const streamed=[];const streamResult=await streamExecutor.executeStream({handlerId:'worker.browser-stream',payload:{id:'browser-stream'},preferWorker:true,onChunk:async(chunk,index)=>{streamed.push({index,value:chunk.index});await sleep(1)}});const streamSnapshot=streamExecutor.snapshot();
      const productPacket=rt.runtimePacket();
      const slow=rt.request(req('context-loss',{state:'HOT',taskClass:'REFINE',delay:200}));await sleep(20);const loss=rt.handleContextLoss();let slowRejected=false;try{await slow}catch{slowRejected=true}const afterLoss=await rt.drain();
      const warm=await rt.request(req('warm',{state:'WARM',taskClass:'PREFETCH'}));const beforePressure=rt.snapshot();const pressure=rt.handleMemoryPressure('CRITICAL');const final=await rt.drain(),finalPacket=rt.runtimePacket();
      return{loss,slowRejected,afterLoss,warm,beforePressure,pressure,final,productPacket,finalPacket,adaptiveRuns,scaleLadder,streamResult,streamed,streamSnapshot};
    });
    assert.equal(ev.final.workers.available.blobWorker,true);
    assert(ev.final.workers.metrics.workerRuns>0);
    assert(ev.final.workers.metrics.cancelled>0);
    assert.equal(ev.final.metrics.fallbackResults,0);
    assert.equal(ev.final.metrics.fallbackAdmissionRejects,0);
    assert.equal(ev.streamResult.mode,'WORKER_STREAM');assert.equal(ev.streamResult.chunks,3);assert.deepEqual(ev.streamResult.value,{done:true,id:'browser-stream'});assert.deepEqual(ev.streamed,[{index:0,value:0},{index:1,value:1},{index:2,value:2}]);assert.equal(ev.streamSnapshot.metrics.streamWorkerRuns,1);assert.equal(ev.streamSnapshot.metrics.streamChunks,3);assert.equal(ev.streamSnapshot.metrics.streamAcks,3);assert.equal(ev.streamSnapshot.metrics.streamFailures,0);
    assert.equal(ev.slowRejected,true);
    assert(ev.loss.cancelled>=1);
    assert.equal(ev.afterLoss.resources.used.gpuEstimateBytes,0);
    assert.equal(ev.warm.targetState,'WARM');
    assert.equal(ev.warm.usage.gpuEstimateBytes,0);
    assert.equal(ev.beforePressure.resources.used.gpuEstimateBytes,0);
    assert(ev.pressure.evicted>=1);
    assert.equal(ev.final.workingSet.entries,0);
    assert.equal(ev.final.workingSet.quarantined,0);
    assert.equal(ev.final.workingSet.detached,0);
    assert.equal(ev.final.scheduler.current.admissions,0);
    assert(ev.final.scheduler.metrics.peakAdmissions<=1);
    assert(ev.final.resources.peak.cpuEstimateBytes<=1024);
    assert(ev.final.resources.peak.gpuEstimateBytes<=1024);
    assert.equal(ev.productPacket.contract,'ofu-v2x01-runtime-packet-1');
    assert.equal(ev.productPacket.authority,'MEASURED_RUNTIME_EVIDENCE');
    assert.equal(ev.productPacket.metrics.adaptiveDecisions,ev.adaptiveRuns);
    assert(ev.productPacket.scheduler.metrics.startedByWorkload.browser>=ev.adaptiveRuns);
    assert(Object.values(ev.productPacket.centralAuthorityClaims).every(x=>x===false));
    assert.equal(ev.finalPacket.contract,'ofu-v2x01-runtime-packet-1');
    assert(ev.finalPacket.sequence>ev.productPacket.sequence);
    assert.deepEqual(ev.scaleLadder,['universe','galaxy','region','stellar-neighborhood','system','orbit','planet','global','regional','local','human','microscopic']);
    const unexpected=requests.filter(x=>x!==url&&!x.startsWith('blob:')&&!x.startsWith('data:')&&!x.startsWith('about:'));
    assert.equal(unexpected.length,0);
    evidence.push({browser:name,directFile:true,offline:true,exactArtifactAdaptiveRuntime:true,adaptiveRuns:ev.adaptiveRuns,scaleLadder:ev.scaleLadder,runtimePacketContract:ev.productPacket.contract,workerRuns:ev.final.workers.metrics.workerRuns,streamWorkerRuns:ev.streamSnapshot.metrics.streamWorkerRuns,streamChunks:ev.streamSnapshot.metrics.streamChunks,workerCancellations:ev.final.workers.metrics.cancelled,contextLossWorkerCancellation:true,warmGpuFree:true,peakAdmissions:ev.final.scheduler.metrics.peakAdmissions,peak:ev.final.resources.peak});
  }finally{await browser.close()}
}

console.log(JSON.stringify({status:'PASS',oracle:'V2X01_BROWSER_DIRECT_FILE_WORKER_RESOURCE_PLATEAU',generation:'V2_RUNTIME_2',browserMatrix:names,evidence}));
