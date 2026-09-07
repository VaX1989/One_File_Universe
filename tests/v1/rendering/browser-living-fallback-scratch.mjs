import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const target=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await chromium.launch({headless:true});
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
  await page.locator(`#living-panel [data-living-action="${action}"]:visible`).first().click();await ready();
 }
 throw new Error('No planet-bearing system found in eight bounded pages');
}
const hashCanvas=()=>page.evaluate(()=>{const canvas=document.getElementById('living-view'),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261,nonEmpty=0;const sx=Math.max(1,Math.floor(canvas.width/48)),sy=Math.max(1,Math.floor(canvas.height/32));for(let y=0;y<canvas.height;y+=sy)for(let x=0;x<canvas.width;x+=sx){const i=(y*canvas.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];if(a&&(r||g||b))nonEmpty++;hash^=r;hash=Math.imul(hash,16777619);hash^=g;hash=Math.imul(hash,16777619);hash^=b;hash=Math.imul(hash,16777619);hash^=a;hash=Math.imul(hash,16777619);}return{hash:hash>>>0,nonEmpty,width:canvas.width,height:canvas.height};});
const state=()=>page.evaluate(()=>{const p=OFU.v1LivingProduct,s=p.runtime.snapshot(),r=p.renderer.state();return{runtime:{revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth},renderer:{readyRevision:r.readyRevision,gpu:r.gpu,gpuError:r.gpuError,metrics:r.metrics,scratch:r.fallbackScratch,authority:r.authority,pickCount:r.pickCount}};});
async function rotate(dx,dy){
 const before=await page.evaluate(()=>OFU.v1LivingProduct.renderer.state().metrics.fallbackFrames);
 await page.evaluate(([x,y])=>OFU.v1LivingProduct.renderer.rotate(x,y),[dx,dy]);
 await page.waitForFunction(frame=>OFU.v1LivingProduct.renderer.state().metrics.fallbackFrames>frame,before,{timeout:10000});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

try{
 await page.goto(target,{waitUntil:'load'});await ready('UNIVERSE');
 const roots=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows.filter(n=>n.kind==='galaxy').map(n=>n.canonicalId));assert.ok(roots.length>0);
 await entity(roots[0],'GALAXY');
 const region=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows[0]?.entityId||OFU.v1LivingProduct.runtime.snapshot().rows[0]?.canonicalId||null);assert.ok(region);await entity(region,'REGION');
 await scale('NEIGHBORHOOD');await chooseSystem();

 // Force only the presentation backend into its shipping Canvas2D fallback. The runtime,
 // canonical identities and world-model providers remain untouched.
 await page.evaluate(()=>{const real=OFU.v1WorldWebGL2;globalThis.__OFU_REAL_WORLD_WEBGL2__=real;OFU.v1WorldWebGL2=Object.freeze({...real,create(){throw new Error('FORCED_WEBGL2_FALLBACK_ORACLE')}});});
 const planet=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows.find(n=>n.kind==='planet')?.canonicalId||null);assert.ok(planet);await entity(planet,'ORBIT');await scale('APPROACH');

 const before=await state(),pixelsBefore=await hashCanvas();
 assert.equal(before.runtime.stage,'APPROACH');assert.ok(before.runtime.world);
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');assert.equal(before.renderer.gpu,null);assert.match(String(before.renderer.gpuError),/FORCED_WEBGL2_FALLBACK_ORACLE/);
 assert.equal(before.renderer.metrics.fallbackScratchAllocations,1,'first fallback frame must allocate exactly one reusable scratch canvas');
 assert.equal(before.renderer.metrics.fallbackScratchResizes,1,'first fallback frame must size its reusable scratch once');
 assert.ok(before.renderer.metrics.fallbackFrames>=1);assert.ok(before.renderer.scratch?.allocated);assert.ok(before.renderer.scratch.size>0&&before.renderer.scratch.size<=420);
 assert.ok(before.renderer.scratch.pixels<=420*420);assert.equal(before.renderer.scratch.accounting,'MODELED_SCRATCH_SURFACE_LIFECYCLE');assert.equal(before.renderer.scratch.heapMemoryMeasured,false);assert.equal(before.renderer.scratch.gpuMemoryMeasured,false);
 assert.ok(pixelsBefore.nonEmpty>0,'Canvas2D fallback must remain visibly populated');

 const canonical=before.runtime,hashes=[pixelsBefore.hash];
 for(const [dx,dy] of [[18,2],[15,-3],[12,4],[10,-2],[14,1],[11,3]]){await rotate(dx,dy);hashes.push((await hashCanvas()).hash);}
 const after=await state();
 assert.deepEqual(after.runtime,canonical,'fallback camera rotation must not mutate canonical/runtime navigation state');
 assert.equal(after.renderer.metrics.fallbackScratchAllocations,1,'repeated fallback frames must reuse one scratch canvas');
 assert.equal(after.renderer.metrics.fallbackScratchResizes,1,'stable viewport fallback must reuse one ImageData allocation');
 assert.ok(after.renderer.metrics.fallbackFrames>=before.renderer.metrics.fallbackFrames+6,'all deliberate fallback camera frames must execute');
 assert.ok(after.renderer.metrics.maxFallbackScratchPixels<=420*420,'fallback scratch pixels must remain under the hard presentation bound');
 assert.equal(after.renderer.scratch.size,before.renderer.scratch.size);assert.equal(after.renderer.scratch.pixels,before.renderer.scratch.pixels);
 assert.ok(new Set(hashes).size>1,'camera rotation must produce a visible Canvas2D fallback delta');
 assert.equal(after.renderer.pickCount,before.renderer.pickCount,'presentation-only fallback rotation must preserve pick-target cardinality');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(externalRequests.length,0,externalRequests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-fallback-scratch',fallbackFrames:after.renderer.metrics.fallbackFrames,scratchAllocations:after.renderer.metrics.fallbackScratchAllocations,scratchResizes:after.renderer.metrics.fallbackScratchResizes,maxScratchPixels:after.renderer.metrics.maxFallbackScratchPixels,visibleDelta:true,identityPreserved:true,authority:'PRESENTATION_ONLY',accounting:'MODELED_SCRATCH_SURFACE_LIFECYCLE',heapMemoryMeasured:false,gpuMemoryMeasured:false,directFile:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
