import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));assert.equal(manifest.sourceCommit,sourceSha,'exact-source shipping build required');
const file=path.resolve('dist/One_File_Universe.html'),evidenceDir=path.resolve('dist/evidence/product-v11');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},offline:true}),page=await context.newPage();
const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));
const url=pathToFileURL(file).href;
async function ready(stage){await page.waitForFunction(expected=>{const p=OFU?.v1LivingProduct?.snapshot?.(),s=OFU?.v1LivingProduct?.runtime?.snapshot?.();return p?.initialized&&p.uiError===null&&s?.stage===expected&&p.render?.readyRevision===s.revision;},stage,{timeout:30000});}
async function assertNavigationChoices(){
 const state=await page.evaluate(()=>({stage:OFU.v1LivingProduct.runtime.snapshot().stage,buttons:[...document.querySelectorAll('#living-panel .living-choice[data-living-entity]')].map(b=>({id:b.dataset.livingEntity,pressed:b.getAttribute('aria-pressed'),text:b.textContent}))}));
 assert(state.buttons.length>0,'expected visible Living navigation choices at '+state.stage);for(const b of state.buttons)assert.equal(b.pressed,null,'navigation button must not claim toggle state at '+state.stage+': '+b.text);return state;
}
try{
 await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.v11LivingChoiceSemantics?.snapshot?.().ready,null,{timeout:30000});await ready('UNIVERSE');
 await assertNavigationChoices();
 await page.locator('#living-panel .living-choice[data-living-entity]').first().click();await ready('GALAXY');await assertNavigationChoices();
 await page.locator('#living-panel .living-choice[data-living-entity]').first().click();await ready('REGION');
 await page.locator('#living-panel [data-living-action="deeper"]').click();await ready('NEIGHBORHOOD');await assertNavigationChoices();
 await page.locator('#living-panel .living-choice[data-living-entity]').first().click();await ready('SYSTEM');const system=await assertNavigationChoices();
 const worldIndex=system.buttons.findIndex(b=>/^World /i.test(String(b.text||'').trim()));assert(worldIndex>=0,'deterministic system must expose at least one world choice');await page.locator('#living-panel .living-choice[data-living-entity]').nth(worldIndex).click();await ready('ORBIT');
 await page.locator('#living-panel [data-living-action="deeper"]').click();await ready('APPROACH');
 await page.evaluate(()=>OFU.v1LivingProduct.runtime.at(0,0,{stage:'LOCAL_SURFACE'}));await ready('LOCAL_SURFACE');
 await page.waitForFunction(()=>{const s=OFU.v1LivingProduct.runtime.snapshot();return Array.isArray(s.local?.objects)&&s.local.objects.length>0&&document.querySelectorAll('#living-panel .living-choice[data-living-entity]').length>0},null,{timeout:10000});
 const local=await page.evaluate(()=>{const s=OFU.v1LivingProduct.runtime.snapshot(),ids=new Set((s.local?.objects||[]).map(o=>String(o.entityId)));return{stage:s.stage,selected:s.selectedObjectId,localIds:[...ids],buttons:[...document.querySelectorAll('#living-panel .living-choice[data-living-entity]')].map(b=>({id:b.dataset.livingEntity,pressed:b.getAttribute('aria-pressed'),text:b.textContent}))};});
 const localButtons=local.buttons.filter(b=>local.localIds.includes(String(b.id))),otherButtons=local.buttons.filter(b=>!local.localIds.includes(String(b.id)));assert(localButtons.length>0,'local object choices must be rendered');for(const b of localButtons)assert.equal(b.pressed,String(String(b.id)===String(local.selected||'')),'local object choice must expose selection state');for(const b of otherButtons)assert.equal(b.pressed,null,'non-local navigation choices in a world panel must not claim toggle state');
 const target=localButtons[0];await page.locator(`#living-panel .living-choice[data-living-entity="${target.id}"]`).first().click();await page.waitForFunction(id=>{const s=OFU.v1LivingProduct.runtime.snapshot(),b=document.querySelector(`#living-panel .living-choice[data-living-entity="${CSS.escape(id)}"]`);return String(s.selectedObjectId)===String(id)&&b?.getAttribute('aria-pressed')==='true';},target.id,{timeout:5000});
 const selected=await page.evaluate(id=>({selected:OFU.v1LivingProduct.runtime.snapshot().selectedObjectId,pressed:[...document.querySelectorAll('#living-panel .living-choice[data-living-entity][aria-pressed]')].map(b=>({id:b.dataset.livingEntity,value:b.getAttribute('aria-pressed')})),adapter:OFU.v11LivingChoiceSemantics.snapshot()}),target.id);assert.equal(String(selected.selected),String(target.id));assert.equal(selected.pressed.filter(x=>x.value==='true').length,1,'exactly one local object button should expose selected state');assert(selected.adapter.navigationPressedRemoved>0,'adapter must have corrected navigation buttons');assert(selected.adapter.selectionPressedApplied>0,'adapter must have synchronized local selection buttons');
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));assert.deepEqual(unexpected,[],'direct-file semantics journey must not require network');assert.deepEqual(errors,[],'choice semantics journey must not emit page errors');
 const evidence={status:'PASS',exactSourceSha:sourceSha,product:'Living choice semantics',shippingForeground:'living-panel',navigationButtonsAreNotToggles:true,localObjectSelectionState:true,singleSelectedObjectState:true,authority:'PRESENTATION_ONLY',directFile:true,offline:true};fs.writeFileSync(path.join(evidenceDir,'living-choice-semantics.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await context.close();await browser.close()}
