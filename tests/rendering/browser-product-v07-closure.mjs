import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const engine={chromium,firefox,webkit}[browserName];
if(!engine)throw new Error('unknown browser '+browserName);
const sourceSha=process.env.OFU_SOURCE_SHA;
if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const build=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));
if(build.sourceCommit!==sourceSha)throw new Error('source mismatch');
const url=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const browser=await engine.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:Number(process.env.DPR||1)});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));
const fields=['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'];
const waitReady=()=>page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&globalThis.__OFU_PLANET_PREVIEW__?.targetStatus==='SUPPORTED'&&globalThis.__OFU_PLANET_PREVIEW__?.camera&&globalThis.__OFU_PRODUCT_UI__,undefined,{timeout:30000});
const hiddenFocus=()=>page.evaluate(()=>{const a=document.activeElement,p=a?.closest?.('[data-workspace-panel]');return{tag:a?.tagName||null,id:a?.id||null,panel:p?.dataset?.workspacePanel||null,panelHidden:p?.hidden??null}});
async function fillPlanet(key){
 await page.evaluate(()=>OFU.productUI.workspace('inspect',{announceChange:false}));
 await page.selectOption('#entity-type','Planet');
 await page.evaluate(()=>document.getElementById('entity-type').dispatchEvent(new Event('change',{bubbles:true})));
 for(const f of fields)await page.fill('#f-'+f,String(key[f]));
 await page.click('#query');
}
try{
 await page.goto(url,{waitUntil:'load'});await waitReady();
 const baselineKey=await page.evaluate(()=>Object.fromEntries(Object.entries(__OFU_PLANET_PREVIEW__.chosen.key).map(([k,v])=>[k,v.toString()])));

 await page.evaluate(()=>OFU.productUI.workspace('explore',{announceChange:false}));
 await page.click('[data-open-workspace="inspect"]');
 let focus=await hiddenFocus();
 if(focus.panel!=='inspect'||focus.panelHidden!==false)throw new Error('Inspect CTA did not transfer focus to visible destination '+JSON.stringify(focus));
 await page.click('[data-workspace-panel="inspect"] [data-open-workspace="explore"]');
 focus=await hiddenFocus();
 if(focus.panel!=='explore'||focus.panelHidden!==false)throw new Error('Inspect Back did not transfer focus to visible Explore '+JSON.stringify(focus));
 await page.click('[data-workspace-panel="explore"] [data-open-workspace="lab"]');
 focus=await hiddenFocus();
 if(focus.panel!=='lab'||focus.panelHidden!==false)throw new Error('Lab CTA did not transfer focus to visible destination '+JSON.stringify(focus));
 await page.click('[data-workspace-panel="lab"] [data-open-workspace="explore"]');
 focus=await hiddenFocus();
 if(focus.panel!=='explore'||focus.panelHidden!==false)throw new Error('Lab Back did not transfer focus to visible Explore '+JSON.stringify(focus));

 const unsupported=await page.evaluate(()=>{const O=OFU,S=__OFU_PLANET_PREVIEW__,A=O.p3Astronomy,P5=O.p5Planetology;for(let y=0n;y<16n;y++)for(let x=0n;x<512n;x++){const base={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:x,siteY:y,siteZ:0n},system=A.resolveSystem(S.ctx,base);if(system.status!=='PRESENT')continue;for(let orbitSlot=0n;orbitSlot<system.facts.planetCount;orbitSlot++){const key={...base,orbitSlot},snapshot=A.planetaryInputSnapshot(S.ctx,key);if(snapshot.status==='ABSENT')continue;const physical=P5.realizePhysicalPlanet(S.ctx,P5.adaptP3PlanetaryInputSnapshot(snapshot));if(physical.status==='UNSUPPORTED')return{key:Object.fromEntries(Object.entries(key).map(([k,v])=>[k,v.toString()])),reason:physical.reason};}}return null});
 if(!unsupported)throw new Error('real canonical unsupported target not found');
 await fillPlanet(unsupported.key);
 await page.waitForFunction(()=>__OFU_PLANET_PREVIEW__?.targetStatus==='UNSUPPORTED',undefined,{timeout:20000});
 await page.waitForFunction(()=>document.getElementById('science-environment')?.textContent==='Not evaluated — target unsupported',undefined,{timeout:5000});
 const unsupportedUi=await page.evaluate(()=>({environment:document.getElementById('science-environment')?.textContent,biology:document.getElementById('science-biology')?.textContent,targetState:document.getElementById('render-target-state')?.textContent,viewportHidden:document.getElementById('viewport-state')?.hidden,viewportStatus:document.getElementById('viewport-status')?.textContent,reason:__OFU_PLANET_PREVIEW__?.targetReason,testOnly:__OFU_PLANET_PREVIEW__?.targetTestOnly}));
 if(unsupportedUi.environment!=='Not evaluated — target unsupported'||unsupportedUi.biology!=='Not evaluated — target unsupported'||unsupportedUi.targetState!=='UNSUPPORTED'||unsupportedUi.viewportHidden!==false||!/unsupported/i.test(unsupportedUi.viewportStatus||'')||unsupportedUi.testOnly)throw new Error('real unsupported product truthfulness failed '+JSON.stringify(unsupportedUi));

 await fillPlanet(baselineKey);
 await page.waitForFunction(()=>__OFU_PLANET_PREVIEW__?.targetStatus==='SUPPORTED'&&document.getElementById('science-environment')?.textContent==='Canonical environment',undefined,{timeout:20000});
 const restored=await page.evaluate(()=>({environment:document.getElementById('science-environment')?.textContent,biology:document.getElementById('science-biology')?.textContent,targetState:document.getElementById('render-target-state')?.textContent,viewportHidden:document.getElementById('viewport-state')?.hidden,viewportStatus:document.getElementById('viewport-status')?.textContent}));
 if(restored.environment!=='Canonical environment'||restored.targetState!=='READY'||restored.viewportHidden!==true||!/presentation-only realization/i.test(restored.viewportStatus||''))throw new Error('supported product state did not recover '+JSON.stringify(restored));
 if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
 console.log(JSON.stringify({status:'PASS',exactSourceSha:sourceSha,browser:browserName,focusHandoff:{inspectCta:true,inspectBack:true,labCta:true,labBack:true},realCanonicalUnsupported:{verified:true,reason:unsupported.reason,staleEnvironmentPrevented:true,persistentAccessibleStatus:true},supportedRestore:true}));
}finally{await browser.close()}
