import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import * as playwright from 'playwright';

const html=path.resolve('dist/One_File_Universe.html');
assert.ok(fs.existsSync(html),'real single-file artifact must exist before Living pixel certification');
const names=(process.env.OFU_V2X13_BROWSERS||'chromium').split(',').map(x=>x.trim()).filter(Boolean),results=[];
for(const name of names){
 const launcher=playwright[name];assert.ok(launcher&&typeof launcher.launch==='function','unsupported browser '+name);
 const browser=await launcher.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e?.message||e)));page.on('request',r=>{const u=r.url();if(!u.startsWith('file:')&&!u.startsWith('blob:')&&!u.startsWith('data:'))requests.push(u)});
 await page.goto(pathToFileURL(html).href,{waitUntil:'load'});await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized,{timeout:30000});
 await page.evaluate(async()=>{await OFU.v1LivingProduct.ready();OFU.productUI?.workspace?.('explore',{focus:false,announceChange:false})});
 const healthy=async expected=>{await page.waitForFunction(stage=>{const p=OFU.v1LivingProduct.snapshot(),s=OFU.v1LivingProduct.runtime.snapshot();return s.stage===stage&&p.uiError===null&&p.render.readyRevision===s.revision&&p.render.deep3d?.primaryScale===stage},expected,{timeout:30000});return page.evaluate(()=>{const p=OFU.v1LivingProduct.snapshot(),s=OFU.v1LivingProduct.runtime.snapshot(),old=document.getElementById('living-v2x13-gl'),gl=document.getElementById('living-gl'),wrap=document.getElementById('living-canvas-wrap'),depth=document.getElementById('v2-cinematic-depth'),z=n=>Number(getComputedStyle(n).zIndex)||0,generic=p.render.deep3d.primaryBackend==='DEEP3D_WEBGL2_V2X13',visual=generic?OFU.v1LivingProduct.renderer.capturePrimaryVisualSignal():null;return{stage:s.stage,semanticScale:s.semanticScale,primaryRendererAuthority:p.render.primaryRendererAuthority,primaryPixelBackend:p.render.primaryPixelBackend,legacyPresentationUnderlay:p.render.legacyPresentationUnderlay,deep3d:p.render.deep3d,v2x13:p.render.v2x13,visual,layering:{wrapZ:z(wrap),depthZ:z(depth),glDisplay:getComputedStyle(gl).display,oldHidden:old.hidden,oldDisplay:getComputedStyle(old).display},webgl2:Boolean(gl.getContext('webgl2') instanceof WebGL2RenderingContext)}})};
 const verify=(x,stage,backend)=>{assert.equal(x.stage,stage);assert.equal(x.primaryRendererAuthority,'WAVE_A_LIVING_RENDERER');assert.equal(x.primaryPixelBackend,backend);assert.equal(x.legacyPresentationUnderlay,false);assert.equal(x.deep3d.primaryBackend,backend);assert.equal(x.v2x13.suppressed,true);assert.equal(x.v2x13.suppressedBy,'DEEP3D_PRIMARY_COMPOSITION');assert.equal(x.v2x13.active,false);assert.equal(x.v2x13.resourceManager.liveResources,0);assert.equal(x.v2x13.resourceManager.disposed,true,'suppressed compatibility consumer must release its obsolete WebGL context lifecycle');assert.equal(x.layering.oldHidden,true);assert.equal(x.layering.oldDisplay,'none');assert.equal(x.layering.glDisplay,'block');assert(x.layering.wrapZ>x.layering.depthZ,'composed primary pixel layer must be above cinematic depth');assert.equal(x.webgl2,true);if(backend==='DEEP3D_WEBGL2_V2X13'){assert.equal(x.visual.version,'ofu-v2x13-framebuffer-signal-1');assert.equal(x.visual.glError,0);assert(x.visual.nonClearPixels>0);assert(x.visual.bounds?.width>0&&x.visual.bounds?.height>0)}};
 const boot=await healthy('UNIVERSE');verify(boot,'UNIVERSE','DEEP3D_WEBGL2_V2X13');
 for(const stage of ['GALAXY','REGION','SYSTEM']){const button=page.locator(`[data-living-scale="${stage}"]:visible`).first();await button.waitFor({state:'visible',timeout:5000});await button.click();const x=await healthy(stage);verify(x,stage,'DEEP3D_WEBGL2_V2X13')}
 const entered=await page.evaluate(()=>{const s=OFU.v1LivingProduct.runtime.snapshot(),body=s.rows?.find(x=>x.kind==='planet')||s.rows?.find(x=>x.kind==='moon');if(!body)return false;OFU.v1LivingProduct.runtime.enterBody(body);return true});assert.equal(entered,true,'SYSTEM must expose a world for exact Living GPU certification');
 const orbit=await healthy('ORBIT');verify(orbit,'ORBIT','DEEP3D_PLANET_SPECIALIZED_WEBGL2');
 assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));assert.deepEqual(requests,[],'network requests: '+requests.join('\n'));
 results.push({browser:name,bootSignal:boot.visual.signature,orbitBackend:orbit.primaryPixelBackend,centralCompatibilitySuppressed:orbit.v2x13.suppressed,primaryRendererAuthority:orbit.primaryRendererAuthority});await context.close();await browser.close();
}
console.log(JSON.stringify({schema:'ofu-v2-central-living-v2x13-suppression-witness-1',status:'PASS',artifact:'dist/One_File_Universe.html',results}));
