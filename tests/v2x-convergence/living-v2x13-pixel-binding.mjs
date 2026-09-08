import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import * as playwright from 'playwright';

const html=path.resolve('dist/One_File_Universe.html');
assert.ok(fs.existsSync(html),'real single-file artifact must exist before Living V2X13 certification');
const names=(process.env.OFU_V2X13_BROWSERS||'chromium').split(',').map(x=>x.trim()).filter(Boolean);
const results=[];
for(const name of names){
 const launcher=playwright[name];assert.ok(launcher&&typeof launcher.launch==='function','unsupported browser '+name);
 const browser=await launcher.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e?.message||e)));page.on('request',r=>{const u=r.url();if(!u.startsWith('file:')&&!u.startsWith('blob:')&&!u.startsWith('data:'))requests.push(u)});
 await page.goto(pathToFileURL(html).href,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI?.workspace?.('explore',{focus:false,announceChange:false})});
 const healthy=async expected=>{
  await page.waitForFunction(stage=>{const p=OFU.v1LivingProduct.snapshot(),s=OFU.v1LivingProduct.runtime.snapshot(),v=p.render?.v2x13;return s.stage===stage&&p.uiError===null&&p.render.readyRevision===s.revision&&v?.active===true&&v?.lastWitness?.drawCalls>0},expected,{timeout:30000});
  return page.evaluate(()=>{const p=OFU.v1LivingProduct.snapshot(),s=OFU.v1LivingProduct.runtime.snapshot(),c=document.getElementById('living-v2x13-gl'),style=getComputedStyle(c),gl=c.getContext('webgl2'),v=p.render.v2x13,w=v.lastWitness;return {stage:s.stage,semanticScale:s.semanticScale,primaryRendererAuthority:p.render.primaryRendererAuthority,primaryPixelBackend:p.render.primaryPixelBackend,legacyPresentationUnderlay:p.render.legacyPresentationUnderlay,active:v.active,backend:v.backend,consumerPrimaryRendererAuthority:v.consumerPrimaryRendererAuthority,canvas2dFallbackUsed:v.canvas2dFallbackUsed,cameraAuthority:v.cameraAuthority,sceneCompositionAuthority:v.sceneCompositionAuthority,semanticScaleAuthority:v.semanticScaleAuthority,frames:v.frames,error:v.error,canvas:{id:c.id,width:c.width,height:c.height,hidden:c.hidden,display:style.display,zIndex:Number(style.zIndex),pointerEvents:style.pointerEvents,webgl2:Boolean(gl&&globalThis.WebGL2RenderingContext&&gl instanceof WebGL2RenderingContext)},witness:{backend:w.backend,pixelConsumer:w.pixelConsumer,drawCalls:w.drawCalls,geometryDrawCalls:w.geometryDrawCalls,domainCounts:w.domainCounts,shadowPresentation:w.shadowPresentation||false,shadowDrawCalls:w.shadowDrawCalls||0,volumetricPresentation:w.volumetricPresentation||false,volumetricDrawCalls:w.volumetricDrawCalls||0,primaryRendererAuthority:w.primaryRendererAuthority,canvas2dFallbackUsed:w.canvas2dFallbackUsed},resource:v.resourceManager}})
 };
 const verify=(x,stage,domain)=>{assert.equal(x.stage,stage);assert.equal(x.primaryRendererAuthority,'WAVE_A_LIVING_RENDERER');assert.equal(x.primaryPixelBackend,'V2X13_WEBGL2_PIXEL_CONSUMER');assert.equal(x.legacyPresentationUnderlay,true);assert.equal(x.active,true);assert.equal(x.backend,'V2X13_WEBGL2_PIXEL_CONSUMER');assert.equal(x.consumerPrimaryRendererAuthority,false);assert.equal(x.canvas2dFallbackUsed,false);assert.equal(x.cameraAuthority,'EXTERNAL_READ_ONLY');assert.equal(x.sceneCompositionAuthority,'EXTERNAL_READ_ONLY');assert.equal(x.semanticScaleAuthority,'EXTERNAL_READ_ONLY');assert.equal(x.error,null);assert.equal(x.canvas.id,'living-v2x13-gl');assert.equal(x.canvas.hidden,false);assert.equal(x.canvas.display,'block');assert.ok(x.canvas.zIndex>=3);assert.equal(x.canvas.pointerEvents,'none');assert.equal(x.canvas.webgl2,true);assert.ok(x.canvas.width>0&&x.canvas.height>0);assert.equal(x.witness.backend,'V2X13_WEBGL2_PIXEL_CONSUMER');assert.equal(x.witness.pixelConsumer,'V2X-13');assert.equal(x.witness.primaryRendererAuthority,false);assert.equal(x.witness.canvas2dFallbackUsed,false);assert.ok(x.witness.drawCalls>0);assert.ok(x.witness.geometryDrawCalls>0);assert.ok((x.witness.domainCounts?.[domain]||0)>0,'expected '+domain+' GPU domain at '+stage);assert.equal(x.resource?.accountingExact,true)};
 const boot=await healthy('UNIVERSE');verify(boot,'UNIVERSE','MACRO');
 for(const stage of ['GALAXY','REGION','SYSTEM']){const b=page.locator(`[data-living-scale="${stage}"]:visible`).first();await b.waitFor({state:'visible',timeout:5000});await b.click();const x=await healthy(stage);verify(x,stage,stage==='SYSTEM'?'SYSTEM':'MACRO')}
 const entered=await page.evaluate(()=>{const s=OFU.v1LivingProduct.runtime.snapshot(),body=s.rows?.find(x=>x.kind==='planet')||s.rows?.find(x=>x.kind==='moon');if(!body)return false;OFU.v1LivingProduct.runtime.enterBody(body);return true});
 assert.equal(entered,true,'SYSTEM must expose a world for exact Living GPU certification');
 const orbit=await healthy('ORBIT');verify(orbit,'ORBIT','PLANET');assert.equal(orbit.witness.shadowPresentation,true);assert.ok(orbit.witness.shadowDrawCalls>0);assert.equal(orbit.witness.volumetricPresentation,true);assert.equal(orbit.witness.volumetricDrawCalls,1);
 assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));assert.deepEqual(requests,[],'network requests: '+requests.join('\n'));
 results.push({browser:name,bootFrames:boot.frames,orbitFrames:orbit.frames,orbitDrawCalls:orbit.witness.drawCalls,shadowDrawCalls:orbit.witness.shadowDrawCalls,volumetricDrawCalls:orbit.witness.volumetricDrawCalls,backend:orbit.backend,primaryRendererAuthority:orbit.primaryRendererAuthority});
 await context.close();await browser.close();
}
console.log(JSON.stringify({schema:'ofu-v2-central-living-v2x13-browser-witness-1',status:'PASS',artifact:'dist/One_File_Universe.html',results}));
