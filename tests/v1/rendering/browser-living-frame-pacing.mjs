import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const target=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[],requests=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
page.on('request',request=>{const url=request.url();if(!url.startsWith('file:')&&!url.startsWith('blob:')&&!url.startsWith('data:'))requests.push(url);});

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v1LivingRenderer?.FRAME_PACING_VERSION&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});});
 await page.waitForTimeout(100);
 await page.evaluate(()=>{
  globalThis.__ofuFramePacingVisualSample=async()=>{
   const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot();
   await product.renderer.render(runtime);
   const state=product.renderer.state(),gpuPrimary=state.deep3d?.primaryBackend==='DEEP3D_WEBGL2_V2X13',canvas=document.getElementById(gpuPrimary?'living-gl':'living-view');
   let pixels;
   if(gpuPrimary){const gl=canvas.getContext('webgl2');pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);if(gl.getError()!==gl.NO_ERROR)throw new Error('Deep3D visual sampling failed');}
   else pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   let hash=2166136261,nonEmpty=0;const sx=Math.max(1,Math.floor(canvas.width/64)),sy=Math.max(1,Math.floor(canvas.height/40));
   for(let y=0;y<canvas.height;y+=sy)for(let x=0;x<canvas.width;x+=sx){const i=(y*canvas.width+x)*4;for(let k=0;k<4;k++){hash^=pixels[i+k];hash=Math.imul(hash,16777619)>>>0;}if(pixels[i+3]&&(pixels[i]||pixels[i+1]||pixels[i+2]))nonEmpty++;}
   return {hash,nonEmpty,width:canvas.width,height:canvas.height,surfaceId:canvas.id,gpuPrimary,hidden:canvas.hidden};
  };
 });
 const before=await page.evaluate(async()=>{
  const canvas=await __ofuFramePacingVisualSample();
  const runtime=OFU.v1LivingProduct.runtime.snapshot(),renderer=OFU.v1LivingProduct.renderer.state();
  return {runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,historyDepth:runtime.historyDepth},renderer:{authority:renderer.authority,frames:renderer.metrics.frames,readyRevision:renderer.readyRevision,framePacing:renderer.framePacing,deep3dPrimary:renderer.deep3d?.primaryBackend||null},canvas,scheduler:OFU.v1LivingRenderer.FRAME_PACING_VERSION};
 });
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');
 assert.equal(before.renderer.framePacing.strategy,'RAF_COALESCED_ROTATION');
 assert.equal(before.renderer.framePacing.pendingEvents,0);
 assert.ok(before.canvas.nonEmpty>0,'Living canvas must contain visible pixels before the pacing probe');
 assert.equal(before.canvas.hidden,false,'active presentation surface must be visible');
 if(before.renderer.deep3dPrimary)assert.deepEqual({surface:before.canvas.surfaceId,gpuPrimary:before.canvas.gpuPrimary},{surface:'living-gl',gpuPrimary:true},'Deep3D stages must be sampled from the GPU-primary surface');

 const immediate=await page.evaluate(()=>{
  const canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect(),runtime=OFU.v1LivingProduct.runtime.snapshot(),before=OFU.v1LivingProduct.renderer.state();
  const startX=rect.left+rect.width*.34,startY=rect.top+rect.height*.44;
  const fire=(type,x,y,buttons)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:901,pointerType:'mouse',isPrimary:true,clientX:x,clientY:y,bubbles:true,cancelable:true,buttons}));
  fire('pointerdown',startX,startY,1);
  for(let i=1;i<=32;i++)fire('pointermove',startX+i*2,startY+i*.5,1);
  fire('pointerup',startX+64,startY+16,0);
  const after=OFU.v1LivingProduct.renderer.state(),current=OFU.v1LivingProduct.runtime.snapshot();
  return {inputEvents:after.framePacing.inputEvents-before.framePacing.inputEvents,rotationFrames:after.framePacing.frames-before.framePacing.frames,pending:after.framePacing.pendingEvents,renderFrames:after.metrics.frames-before.metrics.frames,runtimeBefore:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,historyDepth:runtime.historyDepth},runtimeAfter:{revision:current.revision,stage:current.stage,node:current.node?.canonicalId||current.node?.entityId||null,historyDepth:current.historyDepth}};
 });
 assert.ok(immediate.inputEvents>=28,'synthetic drag must enqueue a substantial burst of rotation input');
 assert.equal(immediate.rotationFrames,0,'rotation renders must not execute once per pointermove in the dispatch task');
 assert.equal(immediate.renderFrames,0,'Living presentation render must remain deferred until the animation frame');
 assert.ok(immediate.pending>=immediate.inputEvents,'the full input burst should be pending before the animation frame');
 assert.deepEqual(immediate.runtimeAfter,immediate.runtimeBefore,'presentation drag must not mutate runtime identity/history');

 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>OFU.v1LivingProduct.renderer.state().framePacing.pendingEvents===0,null,{timeout:5000});
 const afterState=await page.evaluate(()=>{
  const runtime=OFU.v1LivingProduct.runtime.snapshot(),renderer=OFU.v1LivingProduct.renderer.state();
  return {runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,historyDepth:runtime.historyDepth},renderer:{authority:renderer.authority,frames:renderer.metrics.frames,readyRevision:renderer.readyRevision,framePacing:renderer.framePacing},input:OFU.v1LivingProduct.snapshot().input};
 });
 const after={...afterState,canvas:await page.evaluate(()=>__ofuFramePacingVisualSample())};
 const inputDelta=after.renderer.framePacing.inputEvents-before.renderer.framePacing.inputEvents;
 const pacingFrames=after.renderer.framePacing.frames-before.renderer.framePacing.frames;
 const coalesced=after.renderer.framePacing.coalescedEvents-before.renderer.framePacing.coalescedEvents;
 const renderFrames=after.renderer.frames-before.renderer.frames;
 assert.equal(pacingFrames,1,'one synchronous pointer burst must produce one scheduled presentation rotation frame');
 assert.equal(coalesced,inputDelta-1,'all additional pointer rotation events in the burst must be coalesced');
 assert.ok(renderFrames>=1&&renderFrames<=2,'visible renderer work must remain frame-bounded rather than pointer-event-bounded');
 assert.equal(after.renderer.framePacing.pendingEvents,0);
 assert.equal(after.renderer.authority,'PRESENTATION_ONLY');
 assert.equal(after.runtime.revision,before.runtime.revision,'camera presentation must not advance authoritative runtime revision');
 assert.equal(after.runtime.stage,before.runtime.stage);
 assert.equal(after.runtime.node,before.runtime.node);
 assert.equal(after.runtime.historyDepth,before.runtime.historyDepth);
 assert.notEqual(after.canvas.hash,before.canvas.hash,'coalesced camera motion must still produce a visible canvas delta');
 assert.ok(after.canvas.nonEmpty>0);
 assert.equal(after.input.activePointers,0);
 assert.equal(after.input.pinchActive,false);
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-frame-pacing',framePacingVersion:before.scheduler,inputEvents:inputDelta,presentationFrames:pacingFrames,coalescedEvents:coalesced,rendererFrameDelta:renderFrames,visibleCanvasDelta:true,runtimeRevisionPreserved:true,authority:'PRESENTATION_ONLY',offline:true,physicalDevice:false}));
}finally{
 await context.close();
 await browser.close();
}
