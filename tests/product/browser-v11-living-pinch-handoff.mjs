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
async function fire(type,pointerId,x,y){await page.evaluate(({type,pointerId,x,y})=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId,pointerType:'touch',clientX:r.left+x,clientY:r.top+y,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,isPrimary:pointerId%10===1}));},{type,pointerId,x,y})}
const input=()=>page.evaluate(()=>({helper:OFU.v11LivingPinchHandoff.snapshot(),core:OFU.v1LivingProduct.snapshot().input,frames:OFU.v1LivingProduct.renderer.state().metrics.frames,stage:OFU.v1LivingProduct.runtime.snapshot().stage,canonicalMutation:OFU.v1LivingProduct.snapshot().canonicalMutation}));
async function cycle(firstId,secondId,liftId,moveId){
 const baseline=await input();
 await fire('pointerdown',firstId,110,250);await fire('pointerdown',secondId,230,250);
 await page.waitForFunction(()=>OFU.v11LivingPinchHandoff.snapshot().activePointers===2&&OFU.v1LivingProduct.snapshot().input.pinchActive===true);
 await fire('pointermove',secondId,280,250);
 await page.waitForFunction(()=>OFU.v1LivingProduct.snapshot().input.lastGesture==='pinch');
 await fire('pointerup',liftId,liftId===firstId?110:280,250);
 await page.waitForFunction(id=>{const h=OFU.v11LivingPinchHandoff.snapshot(),i=OFU.v1LivingProduct.snapshot().input;return h.handoffActive&&h.handoffPointerId===id&&h.activePointers===1&&i.activePointers===1&&!i.pinchActive},moveId);
 const beforeMove=await input();
 const startX=moveId===firstId?110:280;await fire('pointermove',moveId,startX+36,268);
 await page.waitForFunction(({moves,frames})=>OFU.v11LivingPinchHandoff.snapshot().handoffMoves>moves&&OFU.v1LivingProduct.renderer.state().metrics.frames>frames,{moves:beforeMove.helper.handoffMoves,frames:beforeMove.frames});
 const moved=await input();
 assert.equal(moved.helper.lastGesture,'handoff-drag','remaining touch must transition directly into drag ownership');
 assert.equal(moved.helper.activePointers,1);assert.equal(moved.core.activePointers,1);assert.equal(moved.core.pinchActive,false);
 await fire('pointerup',moveId,startX+36,268);await page.waitForFunction(()=>OFU.v11LivingPinchHandoff.snapshot().activePointers===0&&OFU.v1LivingProduct.snapshot().input.activePointers===0);
 return{baseline,beforeMove,moved};
}
try{
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v11LivingPinchHandoff?.snapshot?.().ready,null,{timeout:30000});
 await page.evaluate(()=>OFU.productUI?.workspace?.('explore',{focus:false,announceChange:false}));
 const canvas=page.locator('#living-view');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();assert(box&&box.width>300&&box.height>300,'shipping Living canvas must be visible on mobile');
 const first=await cycle(11,12,12,11);const second=await cycle(21,22,21,22);
 const final=await input();assert(final.helper.pinchStarts>=2,'both pinch sequences must be observed');assert(final.helper.handoffs>=2,'handoff must work regardless of which finger lifts first');assert(final.helper.handoffMoves>=2,'remaining-finger drag must execute for both lift orders');assert(final.frames>first.baseline.frames,'handoff drag must advance visible renderer frames');assert.equal(final.canonicalMutation,false,'presentation gesture continuity must not gain canonical mutation authority');
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));assert.deepEqual(unexpected,[],'direct-file touch journey must not require network');assert.deepEqual(errors,[],'touch handoff journey must not emit page errors');
 const evidence={status:'PASS',exactSourceSha:sourceSha,product:'Living pinch-to-drag continuity',shippingForeground:'living-view',version:final.helper.version,pinchStarts:final.helper.pinchStarts,handoffs:final.helper.handoffs,handoffMoves:final.helper.handoffMoves,rendererFrames:final.frames,bothLiftOrders:true,canonicalMutation:false,mobile:true,directFile:true,offline:true};fs.writeFileSync(path.join(evidenceDir,'living-pinch-handoff.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await context.close();await browser.close()}
