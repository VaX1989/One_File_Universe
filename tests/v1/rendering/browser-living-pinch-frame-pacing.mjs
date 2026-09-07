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
const waitReady=()=>page.waitForFunction(()=>OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
const raf2=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v1LivingRuntime?.NAVIGATION_PACING_VERSION&&typeof OFU?.v1LivingProduct?.runtime?.navigationPacingSnapshot==='function'&&typeof OFU?.v1LivingProduct?.runtime?.finishPinchNavigation==='function'&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});OFU.v1LivingProduct.runtime.scale('REGION');await OFU.v1LivingProduct.ready();});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='REGION'&&OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
 await page.waitForTimeout(80);
 const before=await sample();
 assert.equal(before.runtime.stage,'REGION');
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');
 assert.equal(before.pacing.strategy,'RAF_LATEST_PINCH_COORDINATE_WITH_SYNC_BOUNDARIES_AND_TERMINAL_FLUSH');
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
  const after=runtime.snapshot(),pacingAfter=runtime.navigationPacingSnapshot(),rendererAfter=product.renderer.state(),input=product.snapshot().input;
  return {before:{revision:before.revision,stage:before.stage,node:before.node?.canonicalId||before.node?.entityId||null,body:before.body?.canonicalId||before.body?.entityId||null,historyDepth:before.historyDepth,navigationCoordinate:before.navigationCoordinate},after:{revision:after.revision,stage:after.stage,navigationCoordinate:after.navigationCoordinate},pacing:{inputEvents:pacingAfter.inputEvents-pacingBefore.inputEvents,frames:pacingAfter.frames-pacingBefore.frames,boundaryCommits:pacingAfter.boundaryCommits-pacingBefore.boundaryCommits,terminalCommits:pacingAfter.terminalCommits-pacingBefore.terminalCommits,coalesced:pacingAfter.coalescedEvents-pacingBefore.coalescedEvents,pending:pacingAfter.pendingEvents,staleDrops:pacingAfter.staleDrops-pacingBefore.staleDrops},rendererFrames:rendererAfter.metrics.frames-rendererBefore.metrics.frames,finalTarget,input};
 });
 assert.ok(immediate.pacing.inputEvents>=40,'touch pinch burst must enqueue substantial continuous-navigation input');
 assert.equal(immediate.pacing.frames,0,'pinch navigation must not execute once per pointermove while the gesture remains active');
 assert.equal(immediate.pacing.boundaryCommits,0,'bounded same-stage pinch probe must not need a synchronous boundary commit');
 assert.equal(immediate.pacing.terminalCommits,0,'active pinch must not commit terminal state before release');
 assert.equal(immediate.rendererFrames,0,'Living renderer must not redraw once per pinch pointermove inside the dispatch task');
 assert.equal(immediate.after.revision,immediate.before.revision,'runtime revision must remain unchanged while the same-stage gesture is active');
 assert.equal(immediate.after.navigationCoordinate,immediate.before.navigationCoordinate,'continuous navigation coordinate must remain unchanged until frame or gesture-end commit');
 assert.ok(immediate.pacing.pending>=immediate.pacing.inputEvents,'the full pinch burst should remain pending while both touch pointers are active');
 assert.equal(immediate.input.activePointers,2);
 assert.equal(immediate.input.pinchActive,true);

 await page.evaluate(()=>{
  const canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect(),y=rect.top+rect.height*.44,cx=rect.left+rect.width*.5;
  const fire=(type,id,x)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===1201,clientX:x,clientY:y,bubbles:true,cancelable:true,buttons:0}));
  fire('pointerup',1201,cx-59);fire('pointerup',1202,cx+59);
 });
 const released=await sample();
 assert.equal(released.pacing.frames-before.pacing.frames,1,'gesture end must commit the coalesced terminal coordinate exactly once');
 assert.equal(released.pacing.terminalCommits-before.pacing.terminalCommits,1,'normal pinch release must be recorded as one terminal commit');
 assert.equal(released.pacing.pendingEvents,0,'terminal pinch commit must leave no late RAF work pending');
 assert.equal(released.runtime.revision,before.runtime.revision+1,'terminal coalesced pinch must advance derived navigation exactly once');
 assert.equal(released.runtime.stage,before.runtime.stage,'bounded pinch probe must remain within the same semantic stage');
 assert.ok(Math.abs(released.runtime.navigationCoordinate-immediate.finalTarget)<1e-6,'terminal commit must preserve the latest requested pinch coordinate');
 assert.equal(released.input.activePointers,0);
 assert.equal(released.input.pinchActive,false);

 await waitReady();await raf2();
 const after=await sample();
 const inputDelta=after.pacing.inputEvents-before.pacing.inputEvents,pacingFrames=after.pacing.frames-before.pacing.frames,coalesced=after.pacing.coalescedEvents-before.pacing.coalescedEvents,staleDrops=after.pacing.staleDrops-before.pacing.staleDrops,renderFrames=after.renderer.frames-before.renderer.frames;
 assert.equal(pacingFrames,1,'release-cancelled RAF must not replay terminal pinch state later');
 assert.equal(coalesced,inputDelta-1,'all additional pinch pointer events in the burst must be coalesced to the latest coordinate');
 assert.equal(staleDrops,0,'stable-stage pinch burst must not be discarded as stale');
 assert.equal(after.runtime.revision,before.runtime.revision+1,'no late animation frame may mutate navigation after the terminal commit');
 assert.equal(after.runtime.node,before.runtime.node,'continuous pinch must retain canonical node identity');
 assert.equal(after.runtime.body,before.runtime.body,'continuous pinch must retain canonical body identity');
 assert.equal(after.runtime.historyDepth,before.runtime.historyDepth,'same-stage continuous pinch must not manufacture navigation history');
 assert.ok(renderFrames>=1&&renderFrames<=2,'visible renderer work must remain frame-bounded rather than pointer-event-bounded');
 assert.notEqual(after.canvas.hash,before.canvas.hash,'coalesced terminal pinch navigation must still produce a visible canvas delta');
 assert.ok(after.canvas.nonEmpty>0);

 await page.evaluate(()=>{const runtime=OFU.v1LivingProduct.runtime,index=OFU.v1LivingRuntime.NAVIGATION_STAGES.indexOf('REGION');runtime.setNavigationCoordinate(index,{source:'v1-pinch-founder-regression-reset'});});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='REGION',null,{timeout:10000});await waitReady();
 const founderBefore=await sample();
 const founder=await page.evaluate(()=>{
  const canvas=document.getElementById('living-view'),runtime=OFU.v1LivingProduct.runtime,rect=canvas.getBoundingClientRect();
  const fire=(type,id,x)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===201,clientX:rect.left+x,clientY:rect.top+100,bubbles:true,cancelable:true,buttons:type==='pointerup'||type==='pointercancel'?0:1}));
  const pacingBefore=runtime.navigationPacingSnapshot();
  fire('pointerdown',201,90);fire('pointerdown',202,150);fire('pointermove',201,30);fire('pointermove',202,210);const inward=runtime.snapshot().stage;fire('pointerup',201,30);fire('pointerup',202,210);
  const afterFirstRelease=runtime.snapshot();
  fire('pointerdown',203,30);fire('pointerdown',204,210);fire('pointermove',203,75);fire('pointermove',204,165);const outward=runtime.snapshot().stage;fire('pointerup',203,75);fire('pointerup',204,165);fire('pointerdown',205,80);fire('pointercancel',205,80);
  const final=runtime.snapshot(),pacingAfter=runtime.navigationPacingSnapshot(),input=OFU.v1LivingProduct.snapshot().input;
  return {inward,outward,afterFirstRelease:{stage:afterFirstRelease.stage,navigationCoordinate:afterFirstRelease.navigationCoordinate},final:{revision:final.revision,stage:final.stage,navigationCoordinate:final.navigationCoordinate},pacing:{frames:pacingAfter.frames-pacingBefore.frames,boundaryCommits:pacingAfter.boundaryCommits-pacingBefore.boundaryCommits,terminalCommits:pacingAfter.terminalCommits-pacingBefore.terminalCommits,pending:pacingAfter.pendingEvents,cancelledEvents:pacingAfter.cancelledEvents-pacingBefore.cancelledEvents},input};
 });
 const order=OFU_STAGES=['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'];
 assert(order.indexOf(founder.inward)>order.indexOf('REGION'),'founder pinch inward must synchronously cross a visible stage');
 assert(order.indexOf(founder.outward)<order.indexOf(founder.inward),'founder pinch outward must reverse visible scale traversal');
 assert.notEqual(founder.outward,'REGION','terminal coordinate from the first gesture must seed the reverse gesture instead of rolling back to its earlier boundary coordinate');
 assert.ok(founder.pacing.boundaryCommits>=2,'founder round-trip must retain synchronous semantic-stage boundary commits');
 assert.ok(founder.pacing.terminalCommits>=1,'first founder gesture must flush its latest same-stage coordinate on release');
 assert.equal(founder.pacing.pending,0,'founder round-trip must leave no latent pinch RAF');
 assert.equal(founder.input.activePointers,0);assert.equal(founder.input.pinchActive,false);assert.ok(founder.input.cancellations>0);
 await page.waitForFunction(stage=>OFU.v1LivingProduct.runtime.snapshot().stage===stage,founder.outward,{timeout:10000});await waitReady();const founderAfter=await sample();
 assert.notEqual(founderAfter.canvas.hash,founderBefore.canvas.hash,'founder two-gesture pinch round-trip must visibly differ from its initial REGION frame');
 const stable={revision:founderAfter.runtime.revision,stage:founderAfter.runtime.stage,navigationCoordinate:founderAfter.runtime.navigationCoordinate};await raf2();const noRollback=await sample();
 assert.deepEqual({revision:noRollback.runtime.revision,stage:noRollback.runtime.stage,navigationCoordinate:noRollback.runtime.navigationCoordinate},stable,'no cancelled or superseded pinch RAF may roll navigation back after gesture end');
 assert.equal(noRollback.pacing.pendingEvents,0);
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-pinch-frame-pacing',navigationPacingVersion:after.scheduler,inputEvents:inputDelta,navigationFrames:pacingFrames,terminalCommits:after.pacing.terminalCommits-before.pacing.terminalCommits,boundaryRegressionCommits:founder.pacing.boundaryCommits,founderOutwardStage:founder.outward,coalescedEvents:coalesced,rendererFrameDelta:renderFrames,visibleCanvasDelta:true,noLateRollback:true,runtimeRevisionDelta:after.runtime.revision-before.runtime.revision,canonicalNodePreserved:true,historyPreserved:true,offline:true,physicalDevice:false}));
}finally{
 await context.close();
 await browser.close();
}
