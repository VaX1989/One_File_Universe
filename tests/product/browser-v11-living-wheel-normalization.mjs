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
const raf2=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const ready=()=>page.waitForFunction(()=>OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v11LivingWheelNormalization?.snapshot&&OFU?.v1LivingRuntime?.WHEEL_PACING_VERSION&&typeof OFU?.v1LivingProduct?.runtime?.wheelPacingSnapshot==='function'&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});OFU.v1LivingProduct.runtime.setNavigationCoordinate(2,{source:'wheel-normalization-reset'});});
 await raf2();await ready();
 const authority=await page.evaluate(()=>({normalizer:OFU.v11LivingWheelNormalization.snapshot(),product:OFU.v1LivingProduct.snapshot(),scheduler:OFU.v1LivingRuntime.WHEEL_PACING_VERSION,pacing:OFU.v1LivingProduct.runtime.wheelPacingSnapshot()}));
 assert.equal(authority.normalizer.authority,'PRESENTATION_ONLY');
 assert.equal(authority.normalizer.strategy,'UNIT_AWARE_REDISPATCH_TO_SHIPPING_PIXEL_WHEEL_PATH');
 assert.equal(authority.product.canonicalMutation,false);
 assert.equal(authority.scheduler,'ofu-living-wheel-pacer-2');
 assert.equal(authority.pacing.strategy,'RAF_ACCUMULATED_WHEEL_DELTA_WITH_RUNTIME_NORMALIZED_SYNC_BOUNDARIES');

 const fire=async(deltaY,deltaMode)=>{
  const immediate=await page.evaluate(({deltaY,deltaMode})=>{
   const product=OFU.v1LivingProduct,runtime=product.runtime,canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect(),before=runtime.snapshot(),n0=OFU.v11LivingWheelNormalization.snapshot(),p0=runtime.wheelPacingSnapshot();
   const seen=[];const observe=e=>seen.push({deltaMode:e.deltaMode,deltaY:e.deltaY,defaultPrevented:e.defaultPrevented});canvas.addEventListener('wheel',observe,{capture:true});
   const original=new WheelEvent('wheel',{deltaY,deltaMode,clientX:rect.left+rect.width*.5,clientY:rect.top+rect.height*.5,bubbles:true,cancelable:true});
   const dispatchResult=canvas.dispatchEvent(original);canvas.removeEventListener('wheel',observe,{capture:true});
   const after=runtime.snapshot(),n1=OFU.v11LivingWheelNormalization.snapshot(),p1=runtime.wheelPacingSnapshot();
   return {dispatchResult,originalDefaultPrevented:original.defaultPrevented,seen,before:{revision:before.revision,stage:before.stage,navigationCoordinate:before.navigationCoordinate,node:before.node?.canonicalId||before.node?.entityId||null,body:before.body?.canonicalId||before.body?.entityId||null,historyDepth:before.historyDepth},after:{revision:after.revision,stage:after.stage,navigationCoordinate:after.navigationCoordinate,node:after.node?.canonicalId||after.node?.entityId||null,body:after.body?.canonicalId||after.body?.entityId||null,historyDepth:after.historyDepth},normalization:{line:n1.lineEvents-n0.lineEvents,page:n1.pageEvents-n0.pageEvents,redispatched:n1.redispatchedEvents-n0.redispatchedEvents,maxAbs:n1.maxAbsNormalizedDeltaY},pacingBefore:p0,pacingImmediate:p1,input:product.snapshot().input};
  },{deltaY,deltaMode});
  await raf2();await ready();
  const settled=await page.evaluate(()=>{const runtime=OFU.v1LivingProduct.runtime,s=runtime.snapshot();return{revision:s.revision,stage:s.stage,navigationCoordinate:s.navigationCoordinate,node:s.node?.canonicalId||s.node?.entityId||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth,input:OFU.v1LivingProduct.snapshot().input,normalization:OFU.v11LivingWheelNormalization.snapshot(),pacing:runtime.wheelPacingSnapshot()};});
  return {immediate,settled};
 };

 const line=await fire(-1,1);
 assert.equal(line.immediate.originalDefaultPrevented,true,'line-mode event must be consumed by the unit normalizer');
 assert.equal(line.immediate.dispatchResult,false,'prevented source event must report cancelled dispatch');
 assert.deepEqual(line.immediate.seen.map(e=>[e.deltaMode,e.deltaY]),[[0,-40]],'one line notch must redispatch as one bounded pixel-wheel event');
 assert.deepEqual(line.immediate.normalization,{line:1,page:0,redispatched:1,maxAbs:40});
 assert.equal(line.immediate.pacingImmediate.inputEvents-line.immediate.pacingBefore.inputEvents,1,'normalized line input must enter the canonical wheel pacer exactly once');
 assert.equal(line.immediate.pacingImmediate.frames-line.immediate.pacingBefore.frames,0,'same-stage normalized line input must not commit inside the dispatch task');
 assert.equal(line.immediate.pacingImmediate.pendingEvents,1,'normalized line input must remain pending for the next native animation frame');
 assert.equal(line.immediate.after.revision,line.immediate.before.revision,'normalized same-stage line input must preserve runtime revision until paced flush');
 assert.equal(line.immediate.after.navigationCoordinate,line.immediate.before.navigationCoordinate,'normalized same-stage line input must preserve coordinate until paced flush');
 assert.equal(line.settled.pacing.frames-line.immediate.pacingBefore.frames,1,'normalized line input must produce exactly one canonical paced navigation frame');
 assert.equal(line.settled.pacing.pendingEvents,0,'normalized line input must leave no pending wheel work after flush');
 assert.equal(line.settled.input.lastGesture,'wheel','normalized event must still traverse the shipping Living wheel listener');
 assert.equal(line.settled.stage,line.immediate.before.stage,'one line notch from REGION must remain same-stage');
 assert.equal(line.settled.node,line.immediate.before.node);assert.equal(line.settled.body,line.immediate.before.body);assert.equal(line.settled.historyDepth,line.immediate.before.historyDepth);
 const lineDelta=line.settled.navigationCoordinate-line.immediate.before.navigationCoordinate;
 assert.ok(Math.abs(lineDelta-1/3)<1e-6,'one line unit must map to the established 40px / 120px Living wheel scale');

 await page.evaluate(()=>OFU.v1LivingProduct.runtime.setNavigationCoordinate(2,{source:'wheel-normalization-reset-pixel'}));await raf2();await ready();
 const pixel=await fire(-40,0);
 assert.equal(pixel.immediate.originalDefaultPrevented,true,'shipping pixel-wheel listener must still consume pixel events');
 assert.equal(pixel.immediate.normalization.line,0);assert.equal(pixel.immediate.normalization.page,0);assert.equal(pixel.immediate.normalization.redispatched,0,'pixel input must not be redispatched');
 const pixelDelta=pixel.settled.navigationCoordinate-pixel.immediate.before.navigationCoordinate;
 assert.ok(Math.abs(pixelDelta-lineDelta)<1e-6,'line normalization must be behaviorally equivalent to the matching pixel delta');

 await page.evaluate(()=>OFU.v1LivingProduct.runtime.setNavigationCoordinate(2,{source:'wheel-normalization-reset-page'}));await raf2();await ready();
 const pageMode=await fire(-1,2);
 assert.equal(pageMode.immediate.originalDefaultPrevented,true);
 assert.deepEqual(pageMode.immediate.seen.map(e=>[e.deltaMode,e.deltaY]),[[0,-300]],'page wheel input must be bounded before entering the shipping pixel path');
 assert.equal(pageMode.immediate.normalization.line,0);assert.equal(pageMode.immediate.normalization.page,1);assert.equal(pageMode.immediate.normalization.redispatched,1);
 assert.ok(pageMode.settled.normalization.maxAbsNormalizedDeltaY<=300,'normalized wheel magnitude must remain bounded');
 assert.equal(pageMode.settled.input.lastGesture,'wheel');

 assert.equal(errors.length,0,errors.join('\n'));assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v11-living-wheel-normalization',authority:'PRESENTATION_ONLY',wheelPacingVersion:authority.scheduler,lineEquivalentPixels:40,lineCoordinateDelta:lineDelta,pixelCoordinateDelta:pixelDelta,lineNavigationFrames:line.settled.pacing.frames-line.immediate.pacingBefore.frames,pageNormalizedPixels:300,maxAbsNormalizedDeltaY:pageMode.settled.normalization.maxAbsNormalizedDeltaY,shippingWheelPathPreserved:true,canonicalWheelPacerPreserved:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
