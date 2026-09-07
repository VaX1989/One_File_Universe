import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const target=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:2,offline:true});
const page=await context.newPage();
const errors=[],externalRequests=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
page.on('request',request=>{if(/^https?:/i.test(request.url()))externalRequests.push(request.url());});

try{
 await page.goto(target,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v1WorldWebGL2&&OFU?.v1RenderBudget?.surfacePlan,null,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();});
 const evidence=await page.evaluate(()=>{
  const product=OFU.v1LivingProduct,before=product.runtime.snapshot(),limits=OFU.v1RenderBudget.SURFACE_LIMITS;
  const canonical=s=>({revision:s.revision,stage:s.stage,node:s.node?.entityId||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth});
  function probe(width,height,mobile){
   const canvas=document.createElement('canvas');canvas.style.cssText=`position:fixed;left:-20000px;top:0;width:${width}px;height:${height}px`;document.body.append(canvas);
   const backend=OFU.v1WorldWebGL2.create(canvas,{maxDpr:2,mobile});
   const result=backend.render({scale:'UNIVERSE',objects:[]}),snap=backend.snapshot(),gl=canvas.getContext('webgl2');
   const out={requestedCss:[width,height],canvas:[canvas.width,canvas.height],drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],surface:snap.surface,renderSurface:result.surface,metrics:snap.measurements};
   backend.dispose();canvas.remove();return out;
  }
  const desktop=probe(2560,1440,false),mobile=probe(390,844,true),after=product.runtime.snapshot();
  return {limits,desktop,mobile,before:canonical(before),after:canonical(after)};
 });
 const {desktop,mobile,limits}=evidence;
 assert.equal(desktop.surface.constrained,true,'large desktop WebGL backing store must be presentation-bounded');
 assert.ok(desktop.surface.effectiveDpr<desktop.surface.requestedDpr,'large desktop surface must lower backing DPR rather than allocate without a ceiling');
 assert.ok(desktop.surface.pixels<=limits.desktopPixels,'desktop backing pixels exceed the deterministic ceiling');
 assert.ok(desktop.surface.width<=limits.maxDimension&&desktop.surface.height<=limits.maxDimension,'desktop backing dimensions exceed deterministic ceiling');
 assert.deepEqual(desktop.canvas,[desktop.surface.width,desktop.surface.height]);
 assert.deepEqual(desktop.drawingBuffer,desktop.canvas,'WebGL drawing buffer must match the bounded canvas backing store');
 assert.equal(desktop.surface.modeledColorBytes,desktop.surface.pixels*4);
 assert.equal(desktop.surface.accounting.driverMemoryMeasured,false);assert.equal(desktop.surface.accounting.gpuMemoryMeasured,false);assert.equal(desktop.surface.accounting.heapMemoryMeasured,false);assert.equal(desktop.surface.accounting.framebufferAttachmentsMeasured,false);
 assert.ok(desktop.metrics.surfaceConstraintEvents>=1);assert.ok(desktop.metrics.maxSurfacePixels<=limits.desktopPixels);
 assert.equal(mobile.surface.requestedDpr,2);assert.equal(mobile.surface.constrained,false,'390x844@2 should retain full requested backing DPR under the mobile ceiling');
 assert.deepEqual(mobile.canvas,[780,1688]);assert.ok(mobile.surface.pixels<=limits.mobilePixels);assert.equal(mobile.surface.accounting.driverMemoryMeasured,false);
 assert.deepEqual(evidence.after,evidence.before,'isolated presentation surface probes must not mutate Living canonical/runtime navigation state');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(externalRequests.length,0,externalRequests.join('\n'));
 console.log(JSON.stringify({status:'PASS',suite:'v1-living-webgl-surface-budget',desktop:{requestedCss:desktop.requestedCss,requestedDpr:desktop.surface.requestedDpr,effectiveDpr:desktop.surface.effectiveDpr,backing:desktop.canvas,pixels:desktop.surface.pixels,pixelCeiling:desktop.surface.pixelCeiling,modeledColorBytes:desktop.surface.modeledColorBytes},mobile:{requestedCss:mobile.requestedCss,effectiveDpr:mobile.surface.effectiveDpr,backing:mobile.canvas,pixels:mobile.surface.pixels,pixelCeiling:mobile.surface.pixelCeiling},canonicalStatePreserved:true,authority:'PRESENTATION_ONLY',accounting:'MODELED_BACKING_SURFACE_ACCOUNTING',driverMemoryMeasured:false,gpuMemoryMeasured:false,heapMemoryMeasured:false,directFile:true,offline:true,physicalDevice:false}));
}finally{await context.close();await browser.close();}
