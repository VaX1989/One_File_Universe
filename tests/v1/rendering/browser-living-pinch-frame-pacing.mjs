import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const target=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,hasTouch:true});
const page=await context.newPage();
const errors=[],requests=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
page.on('request',request=>{const url=request.url();if(!url.startsWith('file:')&&!url.startsWith('blob:')&&!url.startsWith('data:'))requests.push(url);});

const sample=()=>page.evaluate(()=>{
 const runtime=OFU.v1LivingProduct.runtime.snapshot(),renderer=OFU.v1LivingProduct.renderer.state(),pacing=OFU.v1LivingProduct.runtime.navigationPacingSnapshot();
 const canvas=document.getElementById('living-view'),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 let hash=2166136261,nonEmpty=0;const sx=Math.max(1,Math.floor(canvas.width/64)),sy=Math.max(1,Math.floor(canvas.height/40));
 for(let y=0;y<canvas.height;y+=sy)for(let x=0;x<canvas.width;x+=sx){const i=(y*canvas.width+x)*4;for(let k=0;k<4;k++){hash^=pixels[i+k];hash=Math.imul(hash,16777619)>>>0;}if(pixels[i+3]&&(pixels[i]||pixels[i+1]||pixels[i+2]))nonEmpty++;}
 return {runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,body:runtime.body?.canonicalId||runtime.body?.entityId||null,historyDepth:runtime.historyDepth,navigationCoordinate:runtime.navigationCoordinate,continuousDistanceRadii:runtime.continuousDistanceRadii},renderer:{authority:renderer.authority,frames:renderer.metrics.frames,readyRevision:renderer.readyRevision},pacing,canvas:{hash,nonEmpty,width:canvas.width,height:canvas.height},input:OFU.v1LivingProduct.snapshot().input,scheduler:OFU.v1LivingRuntime.NAVIGATION_PACING_VERSION};
});

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v1LivingRuntime?.NAVIGATION_PACING_VERSION&&typeof OFU?.v1LivingProduct?.runtime?.navigationPacingSnapshot==='function'&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});OFU.v1LivingProduct.runtime.scale('REGION');await OFU.v1LivingProduct.ready();});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='REGION'&&OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
 await page.waitForTimeout(80);
 const before=await sample();
 assert.equal(before.runtime.stage,'REGION');
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');
 assert.equal(before.pacing.strategy,'RAF_LATEST_PINCH_COORDINATE');
 assert.equal(before.pacing.pendingEvents,0);
 assert.ok(before.canvas.nonEmpty>0,'Living canvas must contain visible pixels before the pinch pacing probe');

 const immediate=await page.evaluate(()=>{
  const product=OFU.v1LivingProduct,runtime=product.runtime,canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect();
  const before=runtime.snapshot(),pacingBefore=runtime.navigationPacingSnapshot(),rendererBefore=product.renderer.state();
  const y=rect.top+rect.height*.44,cx=rect.left+rect.width*.5,startHalf=50;
  const fire=(type,id,x,buttons)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===1201,clientX:x,clientY:y,bubbles:true,cancelable:true,buttons}));
  fire('pointerdown',1201,cx-startHalf,1);fire('pointerdown',1202,cx+startHalf,1);
  let finalSpan=100;
  for(let i=1;i<=24;i++){
   const outward=i*.375;fire('pointermove',1201,cx-startHalf-outward,1);fire('pointermove',1202,cx+startHalf+outward,1);finalSpan=100+outward*2;
  }
  const finalTarget=before.navigationCoordinate+Math.log2(finalSpan/100)*1.5;
  fire('pointerup',1201,cx-startHalf-9,0);fire('pointerup',1202,cx+startHalf+9,0);
  const after=runtime.snapshot(),pacingAfter=runtime.navigationPacingSnapshot(),rendererAfter=product.renderer.state(),input=product.snapshot().input;
  return {before:{revision:before.revision,stage:before.stage,node:before.node?.canonicalId||before.node?.entityId||null,body:before.body?.canonicalId||before.body?.entityId||null,historyDepth:before.historyDepth,navigationCoordinate:before.navigationCoordinate},after:{revision:after.revision,stage:after.stage,node:after.node?.canonicalId||after.node?.entityId||null,body:after.body?.canonicalId||after.body?.entityId||null,historyDepth:after.historyDepth,navigationCoordinate:after.navigationCoordinate},pacing:{inputEvents:pacingAfter.inputEvents-pacingBefore.inputEvents,frames:pacingAfter.frames-pacingBefore.frames,coalesced:pacingAfter.coalescedEvents-pacingBefore.coalescedEvents,pending:pacingAfter.pendingEvents,staleDrops:pacingAfter.staleDrops-pacingBefore.staleDrops},rendererFrames:rendererAfter.metrics.frames-rendererBefore.metrics.frames,finalTarget,input};
 });
 assert.ok(immediate.pacing.inputEvents>=40,'touch pinch burst must enqueue substantial continuous-navigation input');
 assert.equal(immediate.pacing.frames,0,'pinch navigation must not execute once per pointermove inside the dispatch task');
 assert.equal(immediate.rendererFrames,0,'Living renderer must not redraw once per pinch pointermove inside the dispatch task');
 assert.equal(immediate.after.revision,immediate.before.revision,'runtime revision must remain unchanged until the animation-frame navigation commit');
 assert.equal(immediate.after.navigationCoordinate,immediate.before.navigationCoordinate,'continuous navigation coordinate must remain unchanged until the animation frame');
 assert.ok(immediate.pacing.pending>=immediate.pacing.inputEvents,'the full pinch burst should be pending before the animation frame');
 assert.equal(immediate.input.activePointers,0);
 assert.equal(immediate.input.pinchActive,false);

 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.navigationPacingSnapshot().pendingEvents===0&&OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
 const after=await sample();
 const inputDelta=after.pacing.inputEvents-before.pacing.inputEvents,pacingFrames=after.pacing.frames-before.pacing.frames,coalesced=after.pacing.coalescedEvents-before.pacing.coalescedEvents,staleDrops=after.pacing.staleDrops-before.pacing.staleDrops,renderFrames=after.renderer.frames-before.renderer.frames;
 assert.equal(pacingFrames,1,'one synchronous pinch burst must produce one continuous-navigation commit per animation frame');
 assert.equal(coalesced,inputDelta-1,'all additional pinch pointer events in the burst must be coalesced to the latest coordinate');
 assert.equal(staleDrops,0,'stable-stage pinch burst must not be discarded as stale');
 assert.equal(after.runtime.revision,before.runtime.revision+1,'coalesced pinch must advance the derived navigation runtime exactly once');
 assert.equal(after.runtime.stage,before.runtime.stage,'bounded pinch probe must remain within the same semantic stage');
 assert.equal(after.runtime.node,before.runtime.node,'continuous pinch must retain canonical node identity');
 assert.equal(after.runtime.body,before.runtime.body,'continuous pinch must retain canonical body identity');
 assert.equal(after.runtime.historyDepth,before.runtime.historyDepth,'same-stage continuous pinch must not manufacture navigation history');
 assert.ok(Math.abs(after.runtime.navigationCoordinate-immediate.finalTarget)<1e-6,'animation-frame commit must preserve the latest requested pinch coordinate');
 assert.ok(renderFrames>=1&&renderFrames<=2,'visible renderer work must remain frame-bounded rather than pointer-event-bounded');
 assert.notEqual(after.canvas.hash,before.canvas.hash,'coalesced pinch navigation must still produce a visible canvas delta');
 assert.ok(after.canvas.nonEmpty>0);
 assert.equal(after.pacing.pendingEvents,0);
 assert.equal(after.input.activePointers,0);
 assert.equal(after.input.pinchActive,false);
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-pinch-frame-pacing',navigationPacingVersion:after.scheduler,inputEvents:inputDelta,navigationFrames:pacingFrames,coalescedEvents:coalesced,rendererFrameDelta:renderFrames,visibleCanvasDelta:true,runtimeRevisionDelta:after.runtime.revision-before.runtime.revision,canonicalNodePreserved:true,historyPreserved:true,offline:true,physicalDevice:false}));
}finally{
 await context.close();
 await browser.close();
}
