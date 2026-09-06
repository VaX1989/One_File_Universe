import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));assert.equal(manifest.sourceCommit,sourceSha,'exact source build required');
const file=path.resolve('dist/One_File_Universe.html');assert(fs.existsSync(file),'shipping single-file product required');
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));
const url=pathToFileURL(file).href;
try{
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.pxProduct?.snapshot().registry.bindingsSealed&&OFU?.v09ExplorerBeta?.state?.ready&&document.getElementById('beta-modeled-discovery'),null,{timeout:30000});
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-beta-modeled-goal]')].every(b=>!b.disabled),null,{timeout:10000});
 const before=await page.evaluate(()=>({capture:OFU.pxProduct.captured(),p6:__OFU_PLANET_PREVIEW__?.eligibility?.state??null,explorer:OFU.v09ExplorerBeta.snapshot()}));
 assert.equal(before.explorer.state.seamVersion,4);assert.equal(before.explorer.state.modeledDiscovery.status,'idle');assert.equal(before.explorer.state.modeledDiscovery.candidates.length,0);
 await page.click('[data-beta-modeled-goal="ANY"]');
 await page.waitForFunction(()=>{const d=OFU.v09ExplorerBeta.snapshot().state.modeledDiscovery;return d.goal==='ANY'&&!d.searching&&['ready','error'].includes(d.status)},null,{timeout:30000});
 const searched=await page.evaluate(()=>({capture:OFU.pxProduct.captured(),p6:__OFU_PLANET_PREVIEW__?.eligibility?.state??null,discovery:OFU.v09ExplorerBeta.snapshot().state.modeledDiscovery,cards:[...document.querySelectorAll('#beta-modeled-discovery-list [data-beta-modeled-open]')].map(b=>b.textContent),status:document.getElementById('beta-modeled-discovery-status')?.textContent||''}));
 assert.equal(searched.discovery.status,'ready',searched.discovery.error||searched.status);assert.equal(searched.discovery.goal,'ANY');assert(searched.discovery.candidates.length>=1&&searched.discovery.candidates.length<=3,'first bounded page should expose at least one different world');assert(searched.discovery.pages===1);assert(searched.discovery.systemQueries>=1&&searched.discovery.systemQueries<=128);assert(searched.discovery.worldsEvaluated>=1&&searched.discovery.worldsEvaluated<=24);assert.equal(searched.capture.selection.target.entityId,before.capture.selection.target.entityId,'modeled search must not change canonical selection');assert.equal(searched.capture.selection.time.historyDigest,before.capture.selection.time.historyDigest,'modeled search must not change P4 history');assert.equal(searched.p6,before.p6,'modeled search must not change selected-world canonical P6 state');assert(searched.cards.length===searched.discovery.candidates.length);assert(searched.cards.every(text=>/MODEL_DERIVED_SIMULATION/.test(text)),'every modeled result must carry visible authority');assert(/model-derived scenarios/i.test(searched.status),'search status must explain modeled authority');
 const candidate=searched.discovery.candidates[0];assert(candidate.planetIdentity&&candidate.canonicalKey);assert.notEqual(candidate.planetIdentity,before.capture.selection.target.entityId,'current world must be filtered from discovery results');
 await page.click('[data-beta-modeled-open="0"]');
 await page.waitForFunction(id=>OFU.pxProduct.captured().selection.target.entityId===id,candidate.planetIdentity,{timeout:20000});
 await page.waitForFunction(id=>OFU.inspectorTest?.state?.current?.type==='Planet'&&OFU.p2.hex(OFU.inspectorTest.state.current.r.id)===id,candidate.planetIdentity,{timeout:20000});
 const opened=await page.evaluate(()=>({capture:OFU.pxProduct.captured(),explorer:OFU.v09ExplorerBeta.snapshot(),rendererId:__OFU_PLANET_PREVIEW__?.provider?.planetId||__OFU_PLANET_PREVIEW__?.chosen?.planetId||null,status:document.getElementById('beta-modeled-discovery-status')?.textContent||''}));
 assert.equal(opened.capture.selection.target.entityId,candidate.planetIdentity);assert.equal(opened.explorer.state.lastAction,'modeled-discovery-open');assert.equal(opened.explorer.session.current,OFUKeyToken(candidate.canonicalKey));assert.equal(opened.explorer.state.modeledDiscovery.status,'idle','search must clear when navigation target changes');assert.match(opened.status,/search cleared|choose an outcome/i);if(opened.rendererId)assert.equal(opened.rendererId,candidate.planetIdentity,'renderer identity must follow canonical candidate selection');
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!['data:','blob:','about:'].some(prefix=>r.url.startsWith(prefix)));assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',exactSourceSha:sourceSha,product:'v1.1 modeled discovery',authority:'MODEL_DERIVED_SIMULATION',bounded:true,firstPageCandidates:searched.discovery.candidates.length,systemQueries:searched.discovery.systemQueries,worldsEvaluated:searched.discovery.worldsEvaluated,canonicalSearchNonInterference:true,candidateCanonicalNavigation:true,directFile:true,offline:true}));
}finally{await context.close();await browser.close()}

function OFUKeyToken(key){return ['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'].map(name=>name+'='+BigInt(key[name]).toString()).join(';')}
