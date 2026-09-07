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
    await page.waitForFunction(()=>OFU.v2x01MaterializationRuntime&&OFU.v2x01WorkerExecutor,null,{timeout:30000});
    const ev=await page.evaluate(async()=>{
      const h=x=>OFU.pxContracts.digest({x}),sleep=ms=>new Promise(r=>setTimeout(r,ms));
      const rt=OFU.v2x01MaterializationRuntime.create({budgets:{active:2,queue:12,cacheEntries:6,materializations:6,cpuEstimateBytes:1024,gpuEstimateBytes:1024,heapBytes:268435456,entities:32,operations:4096,syncFallbackOperations:4,transferBytes:2048,taskBytes:65536}});
      const program=`async function(q){if(q.semantic.delay)await new Promise(r=>setTimeout(r,q.semantic.delay));const warm=q.targetState==='WARM';return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:32,gpuEstimateBytes:warm?0:32,entities:1,operations:4,transferBytes:2,value:{id:q.semantic.id}}}`;
      rt.registerMaterializer({providerId:'provider.browser',domain:'browser',modelVersion:'1.0.0',representationVersion:'1.0.0',workerProgram:program,async load(q,s){if(q.semantic.delay)await new Promise((r,j)=>{const t=setTimeout(r,q.semantic.delay);s?.addEventListener?.('abort',()=>{clearTimeout(t);j(s.reason)},{once:true})});const warm=q.targetState==='WARM';return{identity:q.durable.identity,semanticDigest:q.semanticDigest,state:q.targetState,cpuEstimateBytes:32,gpuEstimateBytes:warm?0:32,entities:1,operations:4,transferBytes:2,value:{id:q.semantic.id}}}});
      const req=(id,{state='HOT',taskClass='REFINE',delay=0}={})=>({durable:{identity:{providerId:'provider.browser',entityId:h(id),representationId:'primary'},commitmentDigest:h('c:'+id),historyDigest:h('history')},targetState:state,taskClass,semantic:{id,delay},presentation:{},estimate:{cpuEstimateBytes:40,gpuEstimateBytes:state==='WARM'?0:40,entities:1,operations:8,transferBytes:4},preferWorker:true});
      for(let i=0;i<160;i++){const settled=await rt.reconcileWorkingSet([req('journey:'+i,{taskClass:i%7?'REFINE':'INTERACTION'})]);if(settled[0].status!=='fulfilled')throw settled[0].reason}
      const slow=rt.request(req('context-loss',{state:'HOT',taskClass:'REFINE',delay:200}));await sleep(20);const loss=rt.handleContextLoss();let slowRejected=false;try{await slow}catch{slowRejected=true}const afterLoss=await rt.drain();
      const warm=await rt.request(req('warm',{state:'WARM',taskClass:'PREFETCH'}));const beforePressure=rt.snapshot();const pressure=rt.handleMemoryPressure('CRITICAL');const final=await rt.drain();
      return{loss,slowRejected,afterLoss,warm,beforePressure,pressure,final};
    });
    assert.equal(ev.final.workers.available.blobWorker,true);
    assert(ev.final.workers.metrics.workerRuns>0);
    assert(ev.final.workers.metrics.cancelled>0);
    assert.equal(ev.final.metrics.fallbackResults,0);
    assert.equal(ev.final.metrics.fallbackAdmissionRejects,0);
    assert.equal(ev.slowRejected,true);
    assert(ev.loss.cancelled>=1);
    assert.equal(ev.afterLoss.resources.used.gpuEstimateBytes,0);
    assert.equal(ev.warm.targetState,'WARM');
    assert.equal(ev.warm.usage.gpuEstimateBytes,0);
    assert.equal(ev.beforePressure.resources.used.gpuEstimateBytes,0);
    assert(ev.pressure.evicted>=1);
    assert.equal(ev.final.workingSet.entries,0);
    assert.equal(ev.final.workingSet.quarantined,0);
    assert(ev.final.resources.peak.cpuEstimateBytes<=1024);
    assert(ev.final.resources.peak.gpuEstimateBytes<=1024);
    const unexpected=requests.filter(x=>x!==url&&!x.startsWith('blob:')&&!x.startsWith('data:')&&!x.startsWith('about:'));
    assert.equal(unexpected.length,0);
    evidence.push({browser:name,directFile:true,offline:true,workerRuns:ev.final.workers.metrics.workerRuns,workerCancellations:ev.final.workers.metrics.cancelled,contextLossWorkerCancellation:true,warmGpuFree:true,peak:ev.final.resources.peak});
  }finally{await browser.close()}
}

console.log(JSON.stringify({status:'PASS',oracle:'V2X01_BROWSER_DIRECT_FILE_WORKER_RESOURCE_PLATEAU',browserMatrix:names,evidence}));
