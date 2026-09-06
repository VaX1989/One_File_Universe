import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));assert.equal(manifest.sourceCommit,sourceSha,'exact-source shipping build required');
const file=path.resolve('dist/One_File_Universe.html'),url=pathToFileURL(file).href;
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},offline:true}),page=await context.newPage();
const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));
const waitReady=()=>page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v11LivingFirstFlight?.snapshot?.().ready===true,null,{timeout:30000});
try{
 await page.goto(url,{waitUntil:'load'});await waitReady();await page.evaluate(()=>OFU.productUI?.workspace?.('explore',{focus:false,announceChange:false}));
 const initial=await page.evaluate(()=>{const box=document.getElementById('living-first-flight'),r=box?.getBoundingClientRect(),api=OFU.v11LivingFirstFlight.snapshot();return{text:box?.innerText||'',box:r?[r.width,r.height]:null,steps:[...document.querySelectorAll('[data-living-first-flight-step]')].map(x=>[x.dataset.livingFirstFlightStep,x.dataset.complete]),state:api,canonicalMutation:OFU.v1LivingProduct.runtime.snapshot().canonicalMutation}});
 assert(initial.box?.[0]>0&&initial.box?.[1]>0,'first flight must be visible on a fresh local session');assert.match(initial.text,/First flight/);assert.match(initial.text,/local product progress/);assert.deepEqual(initial.steps,[['started','false'],['world','false'],['surface','false']]);assert.equal(initial.state.storage,'localStorage');assert.equal(initial.canonicalMutation,false);
 const galaxy=page.locator('#living-rail [data-living-scale="GALAXY"]').first();await galaxy.click();await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='GALAXY'&&document.querySelector('[data-living-first-flight-step="started"]')?.dataset.complete==='true',null,{timeout:15000});
 const progressed=await page.evaluate(()=>({progress:OFU.v11LivingFirstFlight.snapshot().progress,label:document.querySelector('[data-living-first-flight-step="started"]')?.getAttribute('aria-label'),canonicalMutation:OFU.v1LivingProduct.runtime.snapshot().canonicalMutation}));assert.equal(progressed.progress.started,true);assert.match(progressed.label||'',/Completed: Enter a galaxy/);assert.equal(progressed.canonicalMutation,false);
 await page.locator('[data-living-first-flight-dismiss]').click();await page.waitForFunction(()=>!document.getElementById('living-first-flight')&&OFU.v11LivingFirstFlight.snapshot().dismissed===true);const stored=await page.evaluate(()=>localStorage.getItem('ofu:v11:living-first-flight:1'));assert.match(stored||'',/"dismissed":true/);
 await page.reload({waitUntil:'load'});await waitReady();const resumed=await page.evaluate(()=>({box:!!document.getElementById('living-first-flight'),state:OFU.v11LivingFirstFlight.snapshot(),canonicalMutation:OFU.v1LivingProduct.runtime.snapshot().canonicalMutation}));assert.equal(resumed.box,false,'dismissed first flight must remain quiet after reload');assert.equal(resumed.state.dismissed,true);assert.equal(resumed.canonicalMutation,false);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,dismissed:OFU.v11LivingFirstFlight.snapshot().dismissed}));assert(mobile.overflow<=2,'first-flight state must not introduce mobile overflow');assert.equal(mobile.dismissed,true);
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));assert.deepEqual(unexpected,[],'direct-file first flight must not require network');assert.deepEqual(errors,[],'first-flight journey must not emit page errors');
 console.log(JSON.stringify({status:'PASS',exactSourceSha:sourceSha,product:'Living first flight',shippingForeground:'living-panel',visibleFreshSession:true,progressReactive:true,dismissalPersistent:true,localProductStateOnly:true,mobileResponsive:true,directFile:true,offline:true}));
}finally{await context.close();await browser.close()}
