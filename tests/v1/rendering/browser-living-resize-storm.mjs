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

const snapshot=()=>page.evaluate(()=>{
 const runtime=OFU.v1LivingProduct.runtime.snapshot(),product=OFU.v1LivingProduct.snapshot(),renderer=OFU.v1LivingProduct.renderer.state(),canvas=document.getElementById('living-view'),rect=canvas.getBoundingClientRect();
 return {runtime:{revision:runtime.revision,stage:runtime.stage,node:runtime.node?.canonicalId||runtime.node?.entityId||null,body:runtime.body?.canonicalId||runtime.body?.entityId||null,historyDepth:runtime.historyDepth},renderer:{frames:renderer.metrics.frames,cancellations:renderer.metrics.cancellations,readyRevision:renderer.readyRevision,pickCount:product.render.pickCount},canvas:{width:rect.width,height:rect.height,left:rect.left,right:rect.right,bufferWidth:canvas.width,bufferHeight:canvas.height},doc:{width:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth},observer:globalThis.__OFU_RESIZE_MEASURE__||null};
});
const settle=async()=>{
 await page.waitForFunction(()=>OFU.v1LivingProduct.renderer.state().readyRevision===OFU.v1LivingProduct.runtime.snapshot().revision,null,{timeout:10000});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
 await page.waitForTimeout(80);
};

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.productUI,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI.workspace('explore',{focus:false,announceChange:false});OFU.v1LivingProduct.runtime.scale('SYSTEM');await OFU.v1LivingProduct.ready();const canvas=document.getElementById('living-view');const state={callbacks:0,widths:[]};const observer=new ResizeObserver(entries=>{state.callbacks++;const box=entries[0]?.contentRect;if(box)state.widths.push(Math.round(box.width));});observer.observe(canvas);globalThis.__OFU_RESIZE_MEASURE__=state;globalThis.__OFU_RESIZE_OBSERVER__=observer;});
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='SYSTEM'&&OFU.v1LivingProduct.snapshot().render.pickCount>0,null,{timeout:10000});
 await settle();
 const before=await snapshot();
 assert.equal(before.runtime.stage,'SYSTEM');
 assert.ok(before.renderer.pickCount>0,'SYSTEM must be pickable before resize measurement');

 // Actual browser viewport/orientation churn. No artificial sleeps are inserted between changes:
 // this intentionally lets ResizeObserver and the renderer demonstrate their own batching behavior.
 const viewports=[
  {width:390,height:844},{width:360,height:800},{width:320,height:700},
  {width:700,height:320},{width:800,height:360},{width:844,height:390},
  {width:360,height:800},{width:390,height:844},{width:320,height:700},
  {width:844,height:390},{width:390,height:844},
 ];
 for(const viewport of viewports)await page.setViewportSize(viewport);
 await settle();
 const after=await snapshot();
 const frameDelta=after.renderer.frames-before.renderer.frames,cancelDelta=after.renderer.cancellations-before.renderer.cancellations,observerDelta=(after.observer?.callbacks||0)-(before.observer?.callbacks||0);
 assert.deepEqual(after.runtime,before.runtime,'viewport churn must not mutate Living canonical navigation/history');
 assert.ok(observerDelta>0,'browser viewport churn must exercise the Living ResizeObserver');
 assert.ok(frameDelta>0,'viewport churn must produce visible presentation work');
 assert.ok(frameDelta<=observerDelta+3,`renderer work must stay bounded by observed resize batches (${frameDelta} frames / ${observerDelta} observer batches)`);
 assert.ok(cancelDelta<=observerDelta+1,`async cancellation work must stay bounded by observed resize batches (${cancelDelta} cancellations / ${observerDelta} batches)`);
 assert.ok(after.renderer.pickCount>0,'SYSTEM must remain pickable after portrait/landscape churn');
 assert.ok(after.canvas.width>0&&after.canvas.height>0&&after.canvas.left>=-1&&after.canvas.right<=390+1,'final 390px Living canvas must remain on-screen');
 assert.ok(after.doc.width<=after.doc.clientWidth+1,'final portrait layout must not overflow horizontally');

 // A quiet window after settling catches a backlog of resize RAF callbacks that would otherwise
 // continue redrawing after geometry has stopped changing.
 const quietBefore=await snapshot();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))));
 await page.waitForTimeout(120);
 const quietAfter=await snapshot();
 assert.equal(quietAfter.renderer.frames,quietBefore.renderer.frames,'settled viewport must not retain a resize-render RAF backlog');
 assert.equal(quietAfter.renderer.cancellations,quietBefore.renderer.cancellations,'settled viewport must not retain asynchronous render cancellations');
 assert.equal(quietAfter.renderer.pickCount,quietBefore.renderer.pickCount,'quiet resize settlement must preserve pick targets');
 assert.deepEqual(quietAfter.runtime,quietBefore.runtime,'quiet settlement must remain semantically inert');
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(requests.length,0,requests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-resize-storm-measurement',viewportChanges:viewports.length,resizeObserverBatches:observerDelta,rendererFrameDelta:frameDelta,cancellationDelta:cancelDelta,finalViewport:'390x844',pickable:true,noLateBacklog:true,canonicalRuntimePreserved:true,offline:true,physicalDevice:false,interpretation:'MEASURED_BROWSER_PRESENTATION_EVIDENCE_NOT_GPU_MEMORY_TELEMETRY'}));
}finally{
 await page.evaluate(()=>globalThis.__OFU_RESIZE_OBSERVER__?.disconnect?.()).catch(()=>{});
 await context.close();
 await browser.close();
}
