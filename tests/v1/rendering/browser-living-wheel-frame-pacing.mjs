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

const sample=()=>page.evaluate(()=>{
 const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot(),renderer=product.renderer.state(),pacing=product.runtime.wheelPacingSnapshot();
 const canvas=document.getElementById('living-view'),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 let hash=2166136261,nonEmpty=0;const sx=Math.max(1,Math.floor(canvas.width/64)),sy=Math.max(1,Math.floor(canvas.height/40));
 for(let y=0;y<canvas.height;y+=sy)for(let x=0;x<canvas.width;x+=sx){const i=(y*canvas.width+x)*4;for(let k=0;k<4;k++){hash^=pixels[i+k];hash=Math.imul(hash,16777619)>>>0;}if(pixels[i+3]&&(pixels[i]||pixels[i+1]||pixels[i+2]))nonEmpty++;}
 return {runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,body:runtime.body?.canonicalId||runtime.body?.entityId||null,historyDepth:runtime.historyDepth,navigationCoordinate:runtime.navigationCoordinate,continuousDistanceRadii:runtime.continuousDistanceRadii},renderer:{authority:renderer.authority,frames:renderer.metrics.frames,readyRevision:renderer.readyRevision},pacing,canvas:{hash,nonEmpty,width:canvas.width,height:canvas.height},input:product.snapshot().input,scheduler:OFU.v1LivingRuntime.WHEEL_PACING_VERSION};
});

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v1LivingRuntime?.WHEEL_PACING_VERSION&&typeof OFU?.v1LivingProduct?.runtime?.wheelPacingSnapshot==='function'&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});OFU.v1LivingProduct.runtime.scale('REGION');await OFU.v1LivingProduct.ready();});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='REGION'&&OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
 await page.waitForTimeout(80);
 const before=await sample();
 assert.equal(before.runtime.stage,'REGION');
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');
 assert.equal(before.pacing.strategy,'RAF_ACCUMULATED_WHEEL_DELTA');
 assert.equal(before.pacing.pendingEvents,0);
 assert.ok(before.canvas.nonEmpty>0,'Living canvas must contain visible pixels before the wheel pacing probe');

 const immediate=await page.evaluate(()=>{
  const product=OFU.v1LivingProduct,runtime=product.runtime,canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect();
  const before=runtime.snapshot(),pacingBefore=runtime.wheelPacingSnapshot(),rendererBefore=product.renderer.state();
  const eventCount=36,deltaY=-1.2,perEvent=Math.max(-2.5,Math.min(2.5,-deltaY/120));
  canvas.focus({preventScroll:true});
  for(let i=0;i<eventCount;i++)canvas.dispatchEvent(new WheelEvent('wheel',{deltaY,clientX:rect.left+rect.width*.5,clientY:rect.top+rect.height*.5,bubbles:true,cancelable:true}));
  const after=runtime.snapshot(),pacingAfter=runtime.wheelPacingSnapshot(),rendererAfter=product.renderer.state(),input=product.snapshot().input;
  return {before:{revision:before.revision,stage:before.stage,node:before.node?.canonicalId||before.node?.entityId||null,body:before.body?.canonicalId||before.body?.entityId||null,historyDepth:before.historyDepth,navigationCoordinate:before.navigationCoordinate},after:{revision:after.revision,stage:after.stage,node:after.node?.canonicalId||after.node?.entityId||null,body:after.body?.canonicalId||after.body?.entityId||null,historyDepth:after.historyDepth,navigationCoordinate:after.navigationCoordinate},pacing:{inputEvents:pacingAfter.inputEvents-pacingBefore.inputEvents,frames:pacingAfter.frames-pacingBefore.frames,coalesced:pacingAfter.coalescedEvents-pacingBefore.coalescedEvents,pending:pacingAfter.pendingEvents,staleDrops:pacingAfter.staleDrops-pacingBefore.staleDrops},rendererFrames:rendererAfter.metrics.frames-rendererBefore.metrics.frames,expectedTarget:before.navigationCoordinate+eventCount*perEvent,input};
 });
 assert.equal(immediate.pacing.inputEvents,36,'wheel burst must enqueue every continuous-navigation input');
 assert.equal(immediate.pacing.frames,0,'wheel navigation must not execute once per WheelEvent inside the dispatch task');
 assert.equal(immediate.rendererFrames,0,'Living renderer must not redraw once per WheelEvent inside the dispatch task');
 assert.equal(immediate.after.revision,immediate.before.revision,'runtime revision must remain unchanged until the animation-frame wheel commit');
 assert.equal(immediate.after.navigationCoordinate,immediate.before.navigationCoordinate,'continuous navigation coordinate must remain unchanged until the animation frame');
 assert.equal(immediate.pacing.pending,36,'the full wheel burst should be pending before the animation frame');
 assert.equal(immediate.input.lastGesture,'wheel');

 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.wheelPacingSnapshot().pendingEvents===0&&OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
 const after=await sample();
 const inputDelta=after.pacing.inputEvents-before.pacing.inputEvents,pacingFrames=after.pacing.frames-before.pacing.frames,coalesced=after.pacing.coalescedEvents-before.pacing.coalescedEvents,staleDrops=after.pacing.staleDrops-before.pacing.staleDrops,renderFrames=after.renderer.frames-before.renderer.frames;
 assert.equal(pacingFrames,1,'one synchronous wheel burst must produce one continuous-navigation commit per animation frame');
 assert.equal(coalesced,inputDelta-1,'all additional WheelEvents in the burst must be coalesced into the frame delta');
 assert.equal(staleDrops,0,'stable-stage wheel burst must not be discarded as stale');
 assert.equal(after.runtime.revision,before.runtime.revision+1,'coalesced wheel navigation must advance the derived navigation runtime exactly once');
 assert.equal(after.runtime.stage,before.runtime.stage,'bounded wheel probe must remain within the same semantic stage');
 assert.equal(after.runtime.node,before.runtime.node,'continuous wheel navigation must retain canonical node identity');
 assert.equal(after.runtime.body,before.runtime.body,'continuous wheel navigation must retain canonical body identity');
 assert.equal(after.runtime.historyDepth,before.runtime.historyDepth,'same-stage continuous wheel navigation must not manufacture navigation history');
 assert.ok(Math.abs(after.runtime.navigationCoordinate-immediate.expectedTarget)<1e-6,'animation-frame commit must preserve the full accumulated wheel delta');
 assert.ok(renderFrames>=1&&renderFrames<=2,'visible renderer work must remain frame-bounded rather than WheelEvent-bounded');
 assert.notEqual(after.canvas.hash,before.canvas.hash,'coalesced wheel navigation must still produce a visible canvas delta');
 assert.ok(after.canvas.nonEmpty>0);
 assert.equal(after.pacing.pendingEvents,0);
 assert.equal(after.input.lastGesture,'wheel');
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-wheel-frame-pacing',wheelPacingVersion:after.scheduler,inputEvents:inputDelta,navigationFrames:pacingFrames,coalescedEvents:coalesced,rendererFrameDelta:renderFrames,visibleCanvasDelta:true,runtimeRevisionDelta:after.runtime.revision-before.runtime.revision,canonicalNodePreserved:true,historyPreserved:true,offline:true,physicalDevice:false}));
}finally{
 await context.close();
 await browser.close();
}
