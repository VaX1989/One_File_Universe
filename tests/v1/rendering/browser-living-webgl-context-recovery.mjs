import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

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
const runtimeIdentity=s=>({revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth});

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

 const before=await page.evaluate(()=>{const p=OFU.v1LivingProduct,s=p.runtime.snapshot(),r=p.renderer.state(),canvas=document.getElementById('living-gl'),gl=canvas?.getContext('webgl2');return{runtime:{revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth},renderer:{authority:r.authority,gpuError:r.gpuError,gpu:r.gpu},canvas:{hidden:canvas?.hidden??true,width:canvas?.width||0,height:canvas?.height||0},webgl2:!!gl,extension:!!gl?.getExtension('WEBGL_lose_context')};});
 assert.equal(before.runtime.stage,'APPROACH');assert.ok(before.runtime.world,'APPROACH must retain a concrete world identity');
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');assert.equal(before.renderer.gpuError,null);assert.ok(before.renderer.gpu,'Living APPROACH must own the shipping WebGL2 world backend');
 assert.equal(before.renderer.gpu.contextLost,false);assert.ok(before.renderer.gpu.frame>0);assert.ok(before.renderer.gpu.allocatedPrograms>0&&before.renderer.gpu.allocatedBuffers>0&&before.renderer.gpu.allocatedTextures>0);
 assert.equal(before.canvas.hidden,false);assert.ok(before.canvas.width>0&&before.canvas.height>0);assert.equal(before.webgl2,true,'real WebGL2 is required for this recovery oracle');assert.equal(before.extension,true,'WEBGL_lose_context is required for exact recovery evidence');

 const lifecycle=await page.evaluate(async beforeFrame=>{
  const canvas=document.getElementById('living-gl'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_lose_context');
  if(!ext)throw new Error('WEBGL_lose_context disappeared before lifecycle probe');
  const waitEvent=(name,timeout)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(name+' timeout')),timeout);canvas.addEventListener(name,()=>{clearTimeout(timer);resolve(true)},{once:true});});
  const lostEvent=waitEvent('webglcontextlost',3000);ext.loseContext();await lostEvent;await new Promise(resolve=>setTimeout(resolve,0));
  const lostProduct=OFU.v1LivingProduct,lostState=lostProduct.runtime.snapshot(),lostRenderer=lostProduct.renderer.state();
  const lost={runtime:{revision:lostState.revision,stage:lostState.stage,semanticScale:lostState.semanticScale,world:lostState.world?.planetIdentity||null,body:lostState.body?.canonicalId||lostState.body?.entityId||null,historyDepth:lostState.historyDepth},gpu:lostRenderer.gpu,gpuError:lostRenderer.gpuError};
  const restoredEvent=waitEvent('webglcontextrestored',4000);ext.restoreContext();await restoredEvent;
  const deadline=performance.now()+5000;let restored=null;
  while(performance.now()<deadline){
   const product=OFU.v1LivingProduct,gpu=product.renderer.state().gpu;
   if(gpu&&!gpu.contextLost&&gpu.frame>beforeFrame&&gpu.measurements?.restores>0){const state=product.runtime.snapshot();restored={gpu,runtime:{revision:state.revision,stage:state.stage,semanticScale:state.semanticScale,world:state.world?.planetIdentity||null,body:state.body?.canonicalId||state.body?.entityId||null,historyDepth:state.historyDepth},renderer:product.renderer.state()};break;}
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  if(!restored)throw new Error('Living WebGL2 backend did not establish a fresh rendered state after restoration');
  return {lost,restored};
 },before.renderer.gpu.frame);

 assert.equal(lifecycle.lost.gpu.contextLost,true,'shipping Living GPU backend must surface exact context-loss state');
 assert.equal(lifecycle.lost.gpuError,null,'context loss is a recoverable lifecycle state, not a renderer construction error');
 assert.deepEqual(lifecycle.lost.runtime,before.runtime,'WebGL context loss must not mutate canonical/runtime navigation context');
 const restored=lifecycle.restored;
 assert.equal(restored.gpu.contextLost,false);assert.ok(restored.gpu.frame>before.renderer.gpu.frame,'restoration must rerender the last Living globe scene');
 assert.ok(restored.gpu.measurements.restores>=before.renderer.gpu.measurements.restores+1,'restoration accounting must advance');
 assert.ok(restored.gpu.allocatedPrograms>0&&restored.gpu.allocatedBuffers>0&&restored.gpu.allocatedTextures>0,'restoration must recreate executable GPU resources');
 assert.equal(restored.renderer.authority,'PRESENTATION_ONLY');assert.equal(restored.renderer.gpuError,null);
 assert.deepEqual(restored.runtime,before.runtime,'context restoration must preserve world identity, scale, revision and history');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(externalRequests.length,0,externalRequests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-webgl-context-recovery',backend:restored.gpu.version,lossObserved:true,restoreObserved:true,frameBefore:before.renderer.gpu.frame,frameAfter:restored.gpu.frame,restoreCount:restored.gpu.measurements.restores,identityPreserved:true,authority:'PRESENTATION_ONLY',directFile:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
