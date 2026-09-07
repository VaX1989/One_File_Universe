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
 return {runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,body:runtime.body?.canonicalId||runtime.body?.entityId||null,historyDepth:runtime.historyDepth,navigationCoordinate:runtime.navigationCoordinate},renderer:{authority:renderer.authority,frames:renderer.metrics.frames,readyRevision:renderer.readyRevision},pacing,canvas:{hash,nonEmpty},input:OFU.v1LivingProduct.snapshot().input,scheduler:OFU.v1LivingRuntime.NAVIGATION_PACING_VERSION};
});
const waitReady=()=>page.waitForFunction(()=>OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
const raf2=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v1LivingRuntime?.NAVIGATION_PACING_VERSION&&typeof OFU?.v1LivingProduct?.runtime?.navigationPacingSnapshot==='function'&&typeof OFU?.v1LivingProduct?.runtime?.finishPinchNavigation==='function'&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});OFU.v1LivingProduct.runtime.scale('REGION');await OFU.v1LivingProduct.ready();});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='REGION',null,{timeout:10000});await waitReady();
 const before=await sample();
 assert.equal(before.renderer.authority,'PRESENTATION_ONLY');
 assert.equal(before.pacing.strategy,'RAF_LATEST_PINCH_COORDINATE_WITH_RUNTIME_NORMALIZED_SYNC_BOUNDARIES_AND_TERMINAL_FLUSH');
 assert.ok(before.canvas.nonEmpty>0);

 const active=await page.evaluate(()=>{
  const product=OFU.v1LivingProduct,runtime=product.runtime,canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect(),before=runtime.snapshot(),p0=runtime.navigationPacingSnapshot(),r0=product.renderer.state();
  const y=rect.top+rect.height*.44,cx=rect.left+rect.width*.5,half=50,fire=(type,id,x,buttons)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===1201,clientX:x,clientY:y,bubbles:true,cancelable:true,buttons}));
  fire('pointerdown',1201,cx-half,1);fire('pointerdown',1202,cx+half,1);let span=100;
  for(let i=1;i<=24;i++){const d=i*.375;fire('pointermove',1201,cx-half-d,1);fire('pointermove',1202,cx+half+d,1);span=100+d*2;}
  const p1=runtime.navigationPacingSnapshot(),after=runtime.snapshot(),r1=product.renderer.state();
  return {beforeRevision:before.revision,beforeCoordinate:before.navigationCoordinate,afterRevision:after.revision,afterCoordinate:after.navigationCoordinate,target:before.navigationCoordinate+Math.log2(span/100)*1.5,inputEvents:p1.inputEvents-p0.inputEvents,frames:p1.frames-p0.frames,pending:p1.pendingEvents,boundaries:p1.boundaryCommits-p0.boundaryCommits,terminals:p1.terminalCommits-p0.terminalCommits,rendererFrames:r1.metrics.frames-r0.metrics.frames,input:product.snapshot().input};
 });
 assert.ok(active.inputEvents>=40);
 assert.equal(active.frames,0);assert.equal(active.boundaries,0);assert.equal(active.terminals,0);assert.equal(active.rendererFrames,0);
 assert.equal(active.afterRevision,active.beforeRevision);assert.equal(active.afterCoordinate,active.beforeCoordinate);assert.ok(active.pending>=active.inputEvents);
 assert.equal(active.input.activePointers,2);assert.equal(active.input.pinchActive,true);

 await page.evaluate(()=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect(),y=r.top+r.height*.44,cx=r.left+r.width*.5,fire=(id,x)=>c.dispatchEvent(new PointerEvent('pointerup',{pointerId:id,pointerType:'touch',isPrimary:id===1201,clientX:x,clientY:y,bubbles:true,cancelable:true,buttons:0}));fire(1201,cx-59);fire(1202,cx+59);});
 const released=await sample();
 assert.equal(released.pacing.frames-before.pacing.frames,1);assert.equal(released.pacing.terminalCommits-before.pacing.terminalCommits,1);assert.equal(released.pacing.pendingEvents,0);
 assert.equal(released.runtime.revision,before.runtime.revision+1);assert.equal(released.runtime.stage,'REGION');assert.ok(Math.abs(released.runtime.navigationCoordinate-active.target)<1e-6);
 assert.equal(released.input.activePointers,0);assert.equal(released.input.pinchActive,false);
 await waitReady();await raf2();const after=await sample();
 const inputDelta=after.pacing.inputEvents-before.pacing.inputEvents,renderFrames=after.renderer.frames-before.renderer.frames;
 assert.equal(after.pacing.frames-before.pacing.frames,1,'terminal flush must cancel the scheduled RAF instead of replaying it');
 assert.equal(after.pacing.coalescedEvents-before.pacing.coalescedEvents,inputDelta-1);assert.equal(after.pacing.staleDrops-before.pacing.staleDrops,0);
 assert.equal(after.runtime.revision,before.runtime.revision+1);assert.equal(after.runtime.node,before.runtime.node);assert.equal(after.runtime.body,before.runtime.body);assert.equal(after.runtime.historyDepth,before.runtime.historyDepth);
 assert.ok(renderFrames>=1&&renderFrames<=2);assert.notEqual(after.canvas.hash,before.canvas.hash);assert.ok(after.canvas.nonEmpty>0);

 await page.evaluate(()=>{const runtime=OFU.v1LivingProduct.runtime,index=OFU.v1LivingRuntime.NAVIGATION_STAGES.indexOf('REGION');runtime.setNavigationCoordinate(index,{source:'v1-pinch-founder-regression-reset'});});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='REGION',null,{timeout:10000});await waitReady();const founderBefore=await sample();
 const founder=await page.evaluate(()=>{
  const c=document.getElementById('living-view'),runtime=OFU.v1LivingProduct.runtime,r=c.getBoundingClientRect(),fire=(type,id,x)=>c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===201,clientX:r.left+x,clientY:r.top+100,bubbles:true,cancelable:true,buttons:type==='pointerup'||type==='pointercancel'?0:1})),p0=runtime.navigationPacingSnapshot();
  fire('pointerdown',201,90);fire('pointerdown',202,150);fire('pointermove',201,30);fire('pointermove',202,210);const inward=runtime.snapshot().stage;fire('pointerup',201,30);fire('pointerup',202,210);const firstCoordinate=runtime.snapshot().navigationCoordinate;
  fire('pointerdown',203,30);fire('pointerdown',204,210);fire('pointermove',203,75);fire('pointermove',204,165);const outward=runtime.snapshot().stage;fire('pointerup',203,75);fire('pointerup',204,165);fire('pointerdown',205,80);fire('pointercancel',205,80);
  const final=runtime.snapshot(),p1=runtime.navigationPacingSnapshot(),input=OFU.v1LivingProduct.snapshot().input;
  return {inward,outward,firstCoordinate,final:{revision:final.revision,stage:final.stage,navigationCoordinate:final.navigationCoordinate},boundaryCommits:p1.boundaryCommits-p0.boundaryCommits,terminalCommits:p1.terminalCommits-p0.terminalCommits,pending:p1.pendingEvents,input};
 });
 const order=['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'];
 assert(order.indexOf(founder.inward)>order.indexOf('REGION'));assert(order.indexOf(founder.outward)<order.indexOf(founder.inward));assert.notEqual(founder.outward,'REGION');
 assert.ok(founder.firstCoordinate>3.5,'first gesture must retain its terminal same-stage coordinate before the reverse gesture starts');
 assert.ok(founder.boundaryCommits>=2);assert.ok(founder.terminalCommits>=1);assert.equal(founder.pending,0);assert.equal(founder.input.activePointers,0);assert.equal(founder.input.pinchActive,false);assert.ok(founder.input.cancellations>0);
 await page.waitForFunction(stage=>OFU.v1LivingProduct.runtime.snapshot().stage===stage,founder.outward,{timeout:10000});await waitReady();const founderAfter=await sample();assert.notEqual(founderAfter.canvas.hash,founderBefore.canvas.hash);
 const stable={revision:founderAfter.runtime.revision,stage:founderAfter.runtime.stage,navigationCoordinate:founderAfter.runtime.navigationCoordinate};await raf2();const noRollback=await sample();assert.deepEqual({revision:noRollback.runtime.revision,stage:noRollback.runtime.stage,navigationCoordinate:noRollback.runtime.navigationCoordinate},stable);assert.equal(noRollback.pacing.pendingEvents,0);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-pinch-frame-pacing',navigationPacingVersion:after.scheduler,inputEvents:inputDelta,navigationFrames:after.pacing.frames-before.pacing.frames,terminalCommits:after.pacing.terminalCommits-before.pacing.terminalCommits,boundaryRegressionCommits:founder.boundaryCommits,founderOutwardStage:founder.outward,rendererFrameDelta:renderFrames,visibleCanvasDelta:true,noLateRollback:true,canonicalNodePreserved:true,historyPreserved:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
