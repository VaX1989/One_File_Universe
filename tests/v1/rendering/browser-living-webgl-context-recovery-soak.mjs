import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const CYCLES=3;
const target=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,offline:true});
const page=await context.newPage();
const errors=[],externalRequests=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
page.on('request',request=>{if(/^https?:/i.test(request.url()))externalRequests.push(request.url());});

async function ready(stage=null){
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});});
 await page.waitForFunction(expected=>{const p=OFU.v1LivingProduct,s=p.runtime.snapshot(),r=p.snapshot();return (!expected||s.stage===expected)&&r.uiError===null&&r.render.readyRevision===s.revision;},stage,{timeout:30000});
}
async function scale(stage){const button=page.locator(`#living-rail [data-living-scale="${stage}"]:visible`).first();await button.waitFor({state:'visible',timeout:5000});await button.click();await ready(stage);}
async function entity(id,stage){const button=page.locator(`#living-panel [data-living-entity="${id}"]:visible`).first();await button.waitFor({state:'visible',timeout:5000});await button.click();await ready(stage);}
async function chooseSystem(){
 for(let pageIndex=0;pageIndex<8;pageIndex++){
  const system=await page.evaluate(()=>{const s=OFU.v1LivingProduct.runtime.snapshot();return s.rows.find(n=>n.kind==='system'&&Number(n.metadata?.facts?.planetCount)>0)?.canonicalId||null;});
  if(system){await entity(system,'SYSTEM');return system;}
  const action=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().page?.nextCursor!=null?'next-page':'next-window');
  const button=page.locator(`#living-panel [data-living-action="${action}"]:visible`).first();await button.click();await ready();
 }
 throw new Error('No planet-bearing system found in eight bounded pages');
}

try{
 await page.goto(target,{waitUntil:'load'});await ready('UNIVERSE');
 const roots=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows.filter(n=>n.kind==='galaxy').map(n=>n.canonicalId));
 assert.ok(roots.length>0,'Living universe must expose a real galaxy');
 await entity(roots[0],'GALAXY');
 const region=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows[0]?.entityId||OFU.v1LivingProduct.runtime.snapshot().rows[0]?.canonicalId||null);
 assert.ok(region,'selected galaxy must expose a bounded region');await entity(region,'REGION');
 await scale('NEIGHBORHOOD');await chooseSystem();
 const planet=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows.find(n=>n.kind==='planet')?.canonicalId||null);
 assert.ok(planet,'planet-bearing system must expose a planet');await entity(planet,'ORBIT');await scale('APPROACH');

 const baseline=await page.evaluate(()=>{const p=OFU.v1LivingProduct,s=p.runtime.snapshot(),r=p.renderer.state(),canvas=document.getElementById('living-gl'),gl=canvas?.getContext('webgl2');return{runtime:{revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth},renderer:{authority:r.authority,gpuError:r.gpuError,gpu:r.gpu},canvas:{hidden:canvas?.hidden??true,width:canvas?.width||0,height:canvas?.height||0},webgl2:!!gl,extension:!!gl?.getExtension('WEBGL_lose_context')};});
 assert.equal(baseline.runtime.stage,'APPROACH');assert.ok(baseline.runtime.world,'APPROACH must retain a concrete world identity');
 assert.equal(baseline.renderer.authority,'PRESENTATION_ONLY');assert.equal(baseline.renderer.gpuError,null);assert.ok(baseline.renderer.gpu,'Living APPROACH must own the shipping WebGL2 world backend');
 assert.equal(baseline.renderer.gpu.contextLost,false);assert.ok(baseline.renderer.gpu.frame>0);
 assert.deepEqual({programs:baseline.renderer.gpu.allocatedPrograms,buffers:baseline.renderer.gpu.allocatedBuffers,textures:baseline.renderer.gpu.allocatedTextures},{programs:2,buffers:1,textures:1},'shipping WebGL2 live resource inventory must begin bounded');
 assert.equal(baseline.canvas.hidden,false);assert.ok(baseline.canvas.width>0&&baseline.canvas.height>0);assert.equal(baseline.webgl2,true,'real WebGL2 is required for this recovery soak');assert.equal(baseline.extension,true,'WEBGL_lose_context is required for exact recovery evidence');

 const evidence=[];
 for(let cycle=1;cycle<=CYCLES;cycle++){
  const previous=await page.evaluate(()=>{const gpu=OFU.v1LivingProduct.renderer.state().gpu;return{frame:gpu.frame,restores:gpu.measurements?.restores||0};});
  const result=await page.evaluate(async ({cycle,previous})=>{
   const product=OFU.v1LivingProduct,canvas=document.getElementById('living-gl'),gl=canvas.getContext('webgl2'),ext=gl?.getExtension('WEBGL_lose_context');
   if(!gl||!ext)throw new Error('WEBGL_lose_context unavailable at recovery cycle '+cycle);
   const waitEvent=(name,timeout)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(name+' timeout at cycle '+cycle)),timeout);canvas.addEventListener(name,()=>{clearTimeout(timer);resolve(true)},{once:true});});
   const runtimeSnapshot=()=>{const s=product.runtime.snapshot();return{revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth};};
   const lostEvent=waitEvent('webglcontextlost',4000);ext.loseContext();await lostEvent;await new Promise(resolve=>setTimeout(resolve,0));
   const lostRenderer=product.renderer.state(),lost={runtime:runtimeSnapshot(),gpu:lostRenderer.gpu,gpuError:lostRenderer.gpuError};
   const restoredEvent=waitEvent('webglcontextrestored',5000);ext.restoreContext();await restoredEvent;
   const deadline=performance.now()+6000;let restored=null;
   while(performance.now()<deadline){
    const renderer=product.renderer.state(),gpu=renderer.gpu;
    if(gpu&&!gpu.contextLost&&gpu.frame>previous.frame&&(gpu.measurements?.restores||0)>=previous.restores+1){restored={runtime:runtimeSnapshot(),gpu,gpuError:renderer.gpuError};break;}
    await new Promise(resolve=>requestAnimationFrame(resolve));
   }
   if(!restored)throw new Error('Living WebGL2 backend did not recover cycle '+cycle);
   return{cycle,previous,lost,restored};
  },{cycle,previous});

  assert.deepEqual(result.lost.runtime,baseline.runtime,`cycle ${cycle}: context loss must not mutate canonical/runtime navigation state`);
  assert.equal(result.lost.gpuError,null,`cycle ${cycle}: recoverable context loss must not become a construction error`);
  assert.equal(result.lost.gpu.contextLost,true,`cycle ${cycle}: lost state must be observable`);
  assert.deepEqual({programs:result.lost.gpu.allocatedPrograms,buffers:result.lost.gpu.allocatedBuffers,textures:result.lost.gpu.allocatedTextures},{programs:0,buffers:0,textures:0},`cycle ${cycle}: invalidated WebGL handles must not be reported live`);

  assert.deepEqual(result.restored.runtime,baseline.runtime,`cycle ${cycle}: restoration must preserve canonical/runtime navigation state`);
  assert.equal(result.restored.gpuError,null,`cycle ${cycle}: restoration must leave renderer healthy`);
  assert.equal(result.restored.gpu.contextLost,false,`cycle ${cycle}: context must be live after restoration`);
  assert.ok(result.restored.gpu.frame>result.previous.frame,`cycle ${cycle}: restoration must redraw the last Living scene`);
  assert.equal(result.restored.gpu.measurements.restores,result.previous.restores+1,`cycle ${cycle}: exactly one restore event must be accounted`);
  assert.deepEqual({programs:result.restored.gpu.allocatedPrograms,buffers:result.restored.gpu.allocatedBuffers,textures:result.restored.gpu.allocatedTextures},{programs:2,buffers:1,textures:1},`cycle ${cycle}: executable WebGL resource inventory must return to the fixed shipping bound`);
  evidence.push({cycle,frameBefore:result.previous.frame,frameAfter:result.restored.gpu.frame,restores:result.restored.gpu.measurements.restores});
 }

 const final=await page.evaluate(()=>{const r=OFU.v1LivingProduct.renderer.state(),s=OFU.v1LivingProduct.runtime.snapshot();return{runtime:{revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth},renderer:r,gpu:r.gpu};});
 assert.deepEqual(final.runtime,baseline.runtime,'full recovery soak must preserve world identity, scale, revision and history');
 assert.equal(final.renderer.authority,'PRESENTATION_ONLY');assert.equal(final.renderer.gpuError,null);
 assert.equal(final.gpu.measurements.restores,baseline.renderer.gpu.measurements.restores+CYCLES,'restore counter must equal the deliberate cycle count');
 assert.deepEqual({programs:final.gpu.allocatedPrograms,buffers:final.gpu.allocatedBuffers,textures:final.gpu.allocatedTextures},{programs:2,buffers:1,textures:1},'live executable resource inventory must remain bounded after the soak');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(externalRequests.length,0,externalRequests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-webgl-context-recovery-soak',cycles:CYCLES,evidence,stableExecutableResourceInventory:true,identityPreserved:true,authority:'PRESENTATION_ONLY',resourceCountsAreLifecycleEvidence:true,driverVramMeasured:false,heapMemoryMeasured:false,directFile:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
