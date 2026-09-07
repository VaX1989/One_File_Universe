import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));assert.equal(manifest.sourceCommit,sourceSha,'exact-source shipping build required');
const file=path.resolve('dist/One_File_Universe.html'),evidenceDir=path.resolve('dist/evidence/product-v11');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true}),page=await context.newPage();
const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));
const url=pathToFileURL(file).href;
const raf2=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function fire(type,pointerId,x,y){await page.evaluate(({type,pointerId,x,y})=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId,pointerType:'touch',clientX:r.left+x,clientY:r.top+y,button:0,buttons:type==='pointerup'||type==='pointercancel'||type==='lostpointercapture'?0:1,isPrimary:pointerId%10===1}));},{type,pointerId,x,y})}
const input=()=>page.evaluate(()=>{const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot(),renderer=product.renderer.state(),canvas=document.getElementById('living-view'),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;const sx=Math.max(1,Math.floor(canvas.width/48)),sy=Math.max(1,Math.floor(canvas.height/32));for(let y=0;y<canvas.height;y+=sy)for(let x=0;x<canvas.width;x+=sx){const i=(y*canvas.width+x)*4;for(let k=0;k<4;k++){hash^=pixels[i+k];hash=Math.imul(hash,16777619);}}return{helper:OFU.v11LivingPinchHandoff.snapshot(),core:product.snapshot().input,frames:renderer.metrics.frames,hash:hash>>>0,runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,body:runtime.body?.canonicalId||runtime.body?.entityId||null,historyDepth:runtime.historyDepth},canonicalMutation:product.snapshot().canonicalMutation,framePacing:renderer.framePacing||null};});
async function quiet(){for(let attempt=0;attempt<8;attempt++){const before=await input();await raf2();const after=await input();if(after.frames===before.frames)return after;}throw new Error('Living renderer did not reach a quiet two-RAF baseline');}
async function cycle(firstId,secondId,liftId,moveId){
 await fire('pointerdown',firstId,110,250);await fire('pointerdown',secondId,230,250);
 await page.waitForFunction(()=>OFU.v11LivingPinchHandoff.snapshot().activePointers===2&&OFU.v1LivingProduct.snapshot().input.pinchActive===true);
 await fire('pointermove',secondId,280,250);await page.waitForFunction(()=>OFU.v1LivingProduct.snapshot().input.lastGesture==='pinch');
 await fire('pointerup',liftId,liftId===firstId?110:280,250);
 await page.waitForFunction(id=>{const h=OFU.v11LivingPinchHandoff.snapshot(),i=OFU.v1LivingProduct.snapshot().input;return h.handoffActive&&h.handoffPointerId===id&&h.activePointers===1&&i.activePointers===1&&!i.pinchActive},moveId);
 const cancellationsBefore=(await input()).helper.cancellations;
 await fire('lostpointercapture',liftId,liftId===firstId?110:280,250);
 const afterNormalLost=await input();assert.equal(afterNormalLost.helper.cancellations,cancellationsBefore,'lost capture after normal pointerup must be ignored');assert.equal(afterNormalLost.helper.handoffPointerId,moveId,'normal release handoff must survive its trailing lost-capture event');
 const baseline=await quiet(),startX=moveId===firstId?110:280;
 await fire('pointermove',moveId,startX+2,251);await raf2();const thresholded=await input();
 assert.equal(thresholded.frames,baseline.frames,'sub-threshold continuation jitter must not render');assert.equal(thresholded.helper.handoffMoves,baseline.helper.handoffMoves,'sub-threshold continuation jitter must not rotate');assert.ok(thresholded.helper.thresholdWaits>baseline.helper.thresholdWaits,'sub-threshold continuation must be accounted');
 const beforeMove=await quiet();await fire('pointermove',moveId,startX+36,268);const immediate=await input();
 assert.equal(immediate.frames,beforeMove.frames,'handoff rotation must remain behind canonical RAF frame pacing during dispatch');
 await page.waitForFunction(frames=>OFU.v1LivingProduct.renderer.state().metrics.frames>frames,beforeMove.frames,{timeout:5000});await raf2();const moved=await input();
 assert.equal(moved.frames-beforeMove.frames,1,'handoff drag must produce exactly one paced presentation frame');assert.notEqual(moved.hash,beforeMove.hash,'handoff drag must visibly change the shipping Living canvas');assert.deepEqual(moved.runtime,beforeMove.runtime,'presentation handoff must not mutate canonical runtime identity/history');
 assert.equal(moved.helper.lastGesture,'handoff-drag','remaining touch must transition directly into drag ownership');assert.equal(moved.helper.activePointers,1);assert.equal(moved.core.activePointers,1);assert.equal(moved.core.pinchActive,false);
 await fire('pointerup',moveId,startX+36,268);await page.waitForFunction(()=>OFU.v11LivingPinchHandoff.snapshot().activePointers===0&&OFU.v1LivingProduct.snapshot().input.activePointers===0);
 return{beforeMove,moved};
}
try{
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v11LivingPinchHandoff?.snapshot?.().ready,null,{timeout:30000});
 await page.evaluate(()=>OFU.productUI?.workspace?.('explore',{focus:false,announceChange:false}));
 const canvas=page.locator('#living-view');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();assert(box&&box.width>300&&box.height>300,'shipping Living canvas must be visible on mobile');
 const first=await cycle(11,12,12,11);const second=await cycle(21,22,21,22);
 const beforeCancel=await quiet();
 await fire('pointerdown',31,110,250);await fire('pointerdown',32,230,250);await page.waitForFunction(()=>OFU.v11LivingPinchHandoff.snapshot().activePointers===2&&OFU.v1LivingProduct.snapshot().input.pinchActive===true);await fire('pointermove',32,280,250);await fire('pointercancel',31,110,250);
 await page.waitForFunction(()=>{const h=OFU.v11LivingPinchHandoff.snapshot(),i=OFU.v1LivingProduct.snapshot().input;return h.cancellations>0&&!h.handoffActive&&h.activePointers===1&&i.activePointers===1&&!i.pinchActive;});
 const cancelled=await input();assert.equal(cancelled.helper.handoffActive,false,'pointer cancellation must fail closed instead of promoting the remaining touch');assert.equal(cancelled.helper.lastGesture,'pinch-cancel');
 const cancelMoveBaseline=await quiet();await fire('pointermove',32,280+40,270);await raf2();const afterCancelledMove=await input();assert.equal(afterCancelledMove.frames,cancelMoveBaseline.frames,'cancelled pinch must not synthesize continuation rendering');assert.equal(afterCancelledMove.hash,cancelMoveBaseline.hash,'cancelled pinch must not rotate the visible canvas');assert.deepEqual(afterCancelledMove.runtime,cancelMoveBaseline.runtime,'cancelled pinch must remain semantically inert');await fire('pointerup',32,320,270);await page.waitForFunction(()=>OFU.v11LivingPinchHandoff.snapshot().activePointers===0&&OFU.v1LivingProduct.snapshot().input.activePointers===0);
 const final=await input();assert(final.helper.pinchStarts>=3,'normal and cancellation pinch sequences must be observed');assert(final.helper.handoffs>=2,'handoff must work regardless of which finger lifts first');assert(final.helper.handoffMoves>=2,'remaining-finger drag must execute for both normal lift orders');assert(final.helper.cancellations>=1,'cancellation must be measured');assert.equal(final.canonicalMutation,false,'presentation gesture continuity must not gain canonical mutation authority');
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));assert.deepEqual(unexpected,[],'direct-file touch journey must not require network');assert.deepEqual(errors,[],'touch handoff journey must not emit page errors');
 const evidence={status:'PASS',exactSourceSha:sourceSha,product:'Living pinch-to-drag continuity',shippingForeground:'living-view',version:final.helper.version,pinchStarts:final.helper.pinchStarts,handoffs:final.helper.handoffs,handoffMoves:final.helper.handoffMoves,cancellations:final.helper.cancellations,captureLosses:final.helper.captureLosses,thresholdPx:final.helper.thresholdPx,bothLiftOrders:true,exactlyOnePacedFramePerContinuation:true,subThresholdJitterSuppressed:true,cancelFailsClosed:true,normalLostCaptureIgnored:true,visibleCanvasDelta:true,canonicalMutation:false,mobile:true,directFile:true,offline:true,physicalDevice:false};fs.writeFileSync(path.join(evidenceDir,'living-pinch-handoff.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await context.close();await browser.close()}
