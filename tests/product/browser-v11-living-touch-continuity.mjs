import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const target=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
const page=await context.newPage();
const errors=[],requests=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
page.on('request',request=>{const url=request.url();if(!url.startsWith('file:')&&!url.startsWith('blob:')&&!url.startsWith('data:'))requests.push(url);});
const raf2=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

async function measure(){
 return page.evaluate(()=>{
  const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot(),renderer=product.renderer.state(),canvas=document.getElementById('living-view'),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let hash=2166136261;const sx=Math.max(1,Math.floor(canvas.width/48)),sy=Math.max(1,Math.floor(canvas.height/32));
  for(let y=0;y<canvas.height;y+=sy)for(let x=0;x<canvas.width;x+=sx){const i=(y*canvas.width+x)*4;for(let k=0;k<4;k++){hash^=pixels[i+k];hash=Math.imul(hash,16777619);}}
  return {runtime:{revision:runtime.revision,stage:runtime.stage,navigationCoordinate:runtime.navigationCoordinate,node:runtime.node?.canonicalId||runtime.node?.entityId||null,body:runtime.body?.canonicalId||runtime.body?.entityId||null,historyDepth:runtime.historyDepth},frames:renderer.metrics.frames,hash:hash>>>0,picks:product.snapshot().render.pickCount,input:product.snapshot().input,continuity:OFU.v11LivingTouchContinuity.snapshot(),dragPacing:product.renderer.dragPacingSnapshot?.()||null};
 });
}

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v11LivingTouchContinuity?.snapshot?.().installed&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});});
 await page.waitForFunction(()=>OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision&&OFU.v1LivingProduct.snapshot().render.pickCount>0,null,{timeout:10000});
 await raf2();
 const boot=await measure();
 assert.equal(boot.continuity.authority,'PRESENTATION_ONLY');
 assert.equal(boot.continuity.strategy,'PINCH_RELEASE_PROMOTES_REMAINING_TOUCH_TO_PRESENTATION_DRAG');
 assert.ok(boot.picks>0,'Living viewport must remain pickable');

 const release=await page.evaluate(async()=>{
  const c=document.getElementById('living-view'),r=c.getBoundingClientRect();
  const fire=(type,id,x,y,buttons=1)=>c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===301,clientX:r.left+x,clientY:r.top+y,bubbles:true,cancelable:true,buttons}));
  fire('pointerdown',301,100,150);fire('pointerdown',302,180,150);fire('pointerup',301,100,150,0);
  // A normal capture release is allowed to emit lostpointercapture; once the
  // normal pointerup removed the pointer it must not be reclassified as cancel.
  fire('lostpointercapture',301,100,150,0);await Promise.resolve();
  return {continuity:OFU.v11LivingTouchContinuity.snapshot(),input:OFU.v1LivingProduct.snapshot().input};
 });
 assert.equal(release.continuity.promotions,1,'normal pinch release to one pointer must promote the remaining touch');
 assert.equal(release.continuity.continuationPointer,302);
 assert.equal(release.continuity.activePointers,1);
 assert.equal(release.continuity.cancellations,0,'normal release/lost-capture ordering must not be classified as cancellation');
 assert.equal(release.input.activePointers,1);assert.equal(release.input.pinchActive,false);

 const beforeDrag=await measure();
 const immediate=await page.evaluate(()=>{
  const c=document.getElementById('living-view'),r=c.getBoundingClientRect(),before=OFU.v1LivingProduct.renderer.state().metrics.frames;
  c.dispatchEvent(new PointerEvent('pointermove',{pointerId:302,pointerType:'touch',isPrimary:false,clientX:r.left+230,clientY:r.top+170,bubbles:true,cancelable:true,buttons:1}));
  return {framesBefore:before,framesAfter:OFU.v1LivingProduct.renderer.state().metrics.frames,continuity:OFU.v11LivingTouchContinuity.snapshot()};
 });
 assert.equal(immediate.continuity.continuationMoves,1,'remaining touch must drive presentation rotation after crossing drag threshold');
 assert.equal(immediate.framesAfter,immediate.framesBefore,'continuation rotation must preserve canonical RAF drag pacing inside the dispatch task');
 await raf2();
 const afterDrag=await measure();
 assert.equal(afterDrag.frames-beforeDrag.frames,1,'pinch-to-drag continuation must produce one paced presentation frame');
 assert.notEqual(afterDrag.hash,beforeDrag.hash,'continued one-finger drag must visibly change the Living canvas');
 assert.deepEqual(afterDrag.runtime,beforeDrag.runtime,'presentation drag continuation must not mutate canonical navigation/history');
 assert.equal(afterDrag.continuity.continuationPointer,302);

 await page.evaluate(()=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerup',{pointerId:302,pointerType:'touch',clientX:r.left+230,clientY:r.top+170,bubbles:true,cancelable:true,buttons:0}));});
 await Promise.resolve();
 const cleared=await measure();assert.equal(cleared.continuity.activePointers,0);assert.equal(cleared.continuity.continuationPointer,null);assert.equal(cleared.input.activePointers,0);

 // A true capture loss is fail-closed: it must not promote the remaining
 // pointer into drag continuation, and subsequent movement must not redraw.
 const cancelSetup=await page.evaluate(async()=>{
  const c=document.getElementById('living-view'),r=c.getBoundingClientRect();
  const fire=(type,id,x,y,buttons=1)=>c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===401,clientX:r.left+x,clientY:r.top+y,bubbles:true,cancelable:true,buttons}));
  fire('pointerdown',401,100,150);fire('pointerdown',402,180,150);fire('lostpointercapture',401,100,150,0);await Promise.resolve();
  return OFU.v11LivingTouchContinuity.snapshot();
 });
 assert.equal(cancelSetup.cancellations,1,'unmatched lost capture must cancel continuation state');
 assert.equal(cancelSetup.continuationPointer,null);assert.equal(cancelSetup.activePointers,1);
 const beforeCancelledMove=await measure();
 await page.evaluate(()=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointermove',{pointerId:402,pointerType:'touch',clientX:r.left+230,clientY:r.top+170,bubbles:true,cancelable:true,buttons:1}));});
 await raf2();
 const afterCancelledMove=await measure();
 assert.equal(afterCancelledMove.frames,beforeCancelledMove.frames,'cancelled pinch must not synthesize a continuation render');
 assert.equal(afterCancelledMove.hash,beforeCancelledMove.hash,'cancelled pinch must not rotate the visible canvas');
 assert.deepEqual(afterCancelledMove.runtime,beforeCancelledMove.runtime,'cancel path must remain semantically inert');
 await page.evaluate(()=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerup',{pointerId:402,pointerType:'touch',clientX:r.left+230,clientY:r.top+170,bubbles:true,cancelable:true,buttons:0}));});
 await raf2();
 const final=await measure();assert.equal(final.continuity.activePointers,0);assert.equal(final.input.activePointers,0);

 const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,touchAction:getComputedStyle(document.getElementById('living-view')).touchAction}));
 assert.ok(layout.scrollWidth<=layout.clientWidth+1,'390px mobile continuation must not introduce horizontal overflow');
 assert.equal(layout.touchAction,'none');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v11-living-touch-continuity',viewport:'390x844@2',authority:'PRESENTATION_ONLY',promotions:final.continuity.promotions,continuationMoves:final.continuity.continuationMoves,cancellations:final.continuity.cancellations,onePacedFrame:true,visibleCanvasDelta:true,cancelFailsClosed:true,canonicalRuntimePreserved:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
