import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const engine={chromium,firefox,webkit}[browserName];
if(!engine)throw new Error('unknown browser '+browserName);
const sourceSha=process.env.OFU_SOURCE_SHA;
if(!sourceSha)throw new Error('OFU_SOURCE_SHA required for exact-source journey evidence');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));
if(manifest.sourceCommit!==sourceSha)throw new Error(`source mismatch ${manifest.sourceCommit} != ${sourceSha}`);
const extensions=manifest.additiveComponents?.extensions||[];
for(const id of ['v1x10.ux.direct-manipulation','v1x10.ux.viewport','v1x10.ux.accessibility','v1x10.ux.viewport-first-style']){
  if(!extensions.some(x=>x.id===id))throw new Error('missing additive V1X-10 component '+id);
}
const file=path.resolve('dist/One_File_Universe.html'),url=pathToFileURL(file).href;
const evidenceDir=path.resolve('dist/evidence/v1x-10-ux-mobile-accessibility');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await engine.launch({headless:true});
const errors=[];
const screenshots=[];
const shot=async(page,name)=>{if(browserName!=='chromium')return null;const out=path.join(evidenceDir,name+'.png');await page.screenshot({path:out,fullPage:true});screenshots.push(path.basename(out));return out};
const bindErrors=page=>page.on('pageerror',e=>errors.push(String(e?.message||e).slice(0,600)));
const ready=page=>page.waitForFunction(()=>{
 const O=globalThis.OFU;
 return globalThis.__OFU_V1X10_DIRECT_MANIPULATION__?.snapshot().initialized===true&&
  globalThis.__OFU_V1X10_VIEWPORT_UX__?.snapshot().initialized===true&&
  globalThis.__OFU_V1X10_ACCESSIBILITY__?.snapshot().initialized===true&&
  O?.waveIVInputRouter?.VERSION==='ofu-wave-iv-input-router-6'&&
  O?.waveIVScaleRuntime?.VERSION==='ofu-wave-iv-scale-runtime-3';
},undefined,{timeout:30000});
const dimensions=page=>page.evaluate(()=>{
 const shell=document.querySelector('.viewport-shell')?.getBoundingClientRect(),panel=document.querySelector('.experience > .panel')?.getBoundingClientRect();
 return shell&&panel?{viewportWidth:shell.width,panelWidth:panel.width,ratio:shell.width/Math.max(1,panel.width)}:null;
});
const overlap=(a,b)=>!!a&&!!b&&Math.max(a.left,b.left)<Math.min(a.right,b.right)&&Math.max(a.top,b.top)<Math.min(a.bottom,b.bottom);

let desktopContext,mobileContext,reducedContext;
try{
 desktopContext=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:Number(process.env.DPR||1)});
 const page=await desktopContext.newPage();bindErrors(page);await page.goto(url,{waitUntil:'load'});await ready(page);
 const initial=await page.evaluate(()=>({dm:__OFU_V1X10_DIRECT_MANIPULATION__.snapshot(),ux:__OFU_V1X10_VIEWPORT_UX__.snapshot(),a11y:__OFU_V1X10_ACCESSIBILITY__.snapshot(),workspace:OFU.productUI?.state?.workspace||document.documentElement.dataset.workspace,scale:OFU.waveIVScaleRuntime.snapshot()}));
 assert.equal(initial.dm.secondInputAuthority,false);assert.equal(initial.dm.routesNativeInput,false);assert.equal(initial.dm.inputOwner,'ofu-wave-iv-input-router-6');assert.equal(initial.a11y.aiRequired,false);assert.equal(initial.a11y.hiddenDeveloperPanelRequired,false);assert.equal(initial.workspace,'explore');
 const desktopSize=await dimensions(page);assert.ok(desktopSize&&desktopSize.ratio>=1.35,'Explore viewport must dominate desktop details panel '+JSON.stringify(desktopSize));
 await page.click('[data-render-stage="orbit"]');await page.waitForFunction(()=>OFU.waveIVScaleRuntime.snapshot().semanticScale==='orbit');
 await page.focus('#planet-view');
 const beforeKeyboard=await page.evaluate(()=>({distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii,count:OFU.waveIVInputRouter.state.keyboardIntents}));
 await page.keyboard.press('-');await page.waitForTimeout(50);
 const outward=await page.evaluate(()=>({distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii,count:OFU.waveIVInputRouter.state.keyboardIntents}));
 assert.ok(outward.count>beforeKeyboard.count,'keyboard must route through frozen input owner');assert.ok(outward.distance>beforeKeyboard.distance,'minus must provide reverse/outward semantic travel');
 await page.keyboard.press('+');await page.waitForTimeout(50);
 const inward=await page.evaluate(()=>({distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii,count:OFU.waveIVInputRouter.state.keyboardIntents}));
 assert.ok(inward.count>outward.count);assert.ok(inward.distance<outward.distance,'plus must provide inward semantic travel');
 const canvas=page.locator('#planet-view'),box=await canvas.boundingBox();assert.ok(box);
 const pointerBefore=await page.evaluate(()=>OFU.waveIVInputRouter.state.pointerIntents);await page.mouse.move(box.x+box.width*.52,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.56,{steps:5});await page.mouse.up();await page.waitForTimeout(50);const pointerAfter=await page.evaluate(()=>OFU.waveIVInputRouter.state.pointerIntents);assert.ok(pointerAfter>pointerBefore,'pointer drag must route through frozen input owner');
 const wheelBefore=await page.evaluate(()=>({count:OFU.waveIVInputRouter.state.wheelCommands,distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii}));await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.wheel(0,120);await page.waitForTimeout(50);const wheelAfter=await page.evaluate(()=>({count:OFU.waveIVInputRouter.state.wheelCommands,distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii}));assert.ok(wheelAfter.count>wheelBefore.count);assert.notEqual(wheelAfter.distance,wheelBefore.distance);
 await page.focus('#planet-view');await page.keyboard.press('i');await page.waitForFunction(()=>OFU.productUI?.state?.workspace==='inspect'||document.documentElement.dataset.workspace==='inspect');const inspectFocused=await page.evaluate(()=>({workspace:OFU.productUI?.state?.workspace||document.documentElement.dataset.workspace,focusInside:document.querySelector('[data-workspace-panel="inspect"]')?.contains(document.activeElement)}));assert.equal(inspectFocused.workspace,'inspect');assert.equal(inspectFocused.focusInside,true);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>OFU.productUI?.state?.workspace==='explore'||document.documentElement.dataset.workspace==='explore');assert.equal(await page.evaluate(()=>document.activeElement?.id),'planet-view');
 const trace=await page.evaluate(()=>__OFU_V1X10_DIRECT_MANIPULATION__.trace());for(const kind of ['keyboard-observed','pointer-start','wheel-observed'])assert.ok(trace.some(x=>x.type===kind),'missing journey trace '+kind);
 await shot(page,'desktop-viewport-first');

 mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const mobile=await mobileContext.newPage();bindErrors(mobile);await mobile.goto(url,{waitUntil:'load'});await ready(mobile);await mobile.waitForFunction(()=>document.documentElement.dataset.ofuMobile==='true',{timeout:10000});
 const mobileInitial=await mobile.evaluate(()=>({sheet:OFU.v08MobileInteraction?.snapshot?.().sheet,ux:__OFU_V1X10_VIEWPORT_UX__.measureOcclusion(),touch:getComputedStyle(document.getElementById('planet-view')).touchAction,body:getComputedStyle(document.querySelector('.mobile-sheet-body')).overscrollBehavior,workspaceOverflow:getComputedStyle(document.querySelector('.mobile-sheet-body .workspace-panel')).overflow}));
 assert.equal(mobileInitial.touch,'none','application must retain semantic pinch ownership');assert.equal(mobileInitial.body,'contain','mobile sheet must stop scroll chaining');assert.ok(mobileInitial.workspaceOverflow==='visible'||mobileInitial.workspaceOverflow==='clip','workspace panel must not create a nested scroll trap');assert.equal(mobileInitial.ux.scaleReachable,true);assert.equal(mobileInitial.ux.contextReachable,true);
 await mobile.click('[data-render-stage="orbit"]');await mobile.waitForFunction(()=>OFU.waveIVScaleRuntime.snapshot().semanticScale==='orbit');
 const pinchBefore=await mobile.evaluate(()=>({count:OFU.waveIVInputRouter.state.pinchIntents,distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii}));
 await mobile.evaluate(()=>{
  const c=document.getElementById('planet-view'),r=c.getBoundingClientRect(),ev=(type,id,x,y)=>c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,buttons:type==='pointerup'?0:1}));
  const cy=r.top+r.height*.5,cx=r.left+r.width*.5;ev('pointerdown',1,cx-35,cy);ev('pointerdown',2,cx+35,cy);ev('pointermove',1,cx-62,cy);ev('pointermove',2,cx+62,cy);ev('pointerup',2,cx+62,cy);ev('pointerup',1,cx-62,cy);
 });await mobile.waitForTimeout(80);
 const pinchAfter=await mobile.evaluate(()=>({count:OFU.waveIVInputRouter.state.pinchIntents,distance:OFU.waveIVScaleRuntime.snapshot().distanceIntentRadii,trace:__OFU_V1X10_DIRECT_MANIPULATION__.trace().filter(x=>x.type==='pinch-observed')}));assert.ok(pinchAfter.count>pinchBefore.count,'emulated two-pointer pinch must reach frozen input owner');assert.notEqual(pinchAfter.distance,pinchBefore.distance);assert.ok(pinchAfter.trace.length>0,'pinch must be visible in deterministic lane trace');
 await mobile.evaluate(()=>OFU.v08MobileInteraction.expand());await mobile.waitForFunction(()=>OFU.v08MobileInteraction.snapshot().sheet==='expanded');await mobile.locator('.scale-bar').scrollIntoViewIfNeeded();await mobile.waitForTimeout(100);
 const expanded=await mobile.evaluate(()=>{const rect=n=>{const r=n?.getBoundingClientRect();return r&&{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}},panel=rect(document.querySelector('.experience > .panel')),scale=rect(document.querySelector('.scale-bar')),context=rect(document.getElementById('v1x10-context-dock')),ux=__OFU_V1X10_VIEWPORT_UX__.measureOcclusion();return{panel,scale,context,ux,minTargets:Math.min(...[...document.querySelectorAll('.workspace-nav button,.scale-controls button,.v1x10-context-actions button')].map(n=>Math.min(n.getBoundingClientRect().width,n.getBoundingClientRect().height)))}});
 assert.ok(expanded.minTargets>=44,'compact critical controls must remain at least 44 CSS px');assert.equal(overlap(expanded.panel,expanded.scale),false,'expanded sheet must not occlude semantic scale controls');assert.equal(overlap(expanded.panel,expanded.context),false,'expanded sheet must not occlude contextual actions');assert.equal(expanded.ux.scaleOccluded,false);assert.equal(expanded.ux.contextOccluded,false);
 await shot(mobile,'mobile-emulation-expanded-no-occlusion');

 reducedContext=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});const reduced=await reducedContext.newPage();bindErrors(reduced);await reduced.goto(url,{waitUntil:'load'});await ready(reduced);const reducedEvidence=await reduced.evaluate(()=>({snapshot:__OFU_V1X10_ACCESSIBILITY__.snapshot(),transition:getComputedStyle(document.querySelector('.v1x10-context-dock')).transitionDuration}));assert.equal(reducedEvidence.snapshot.reducedMotion,true);assert.ok(['0s','0.001ms'].includes(reducedEvidence.transition)||Number.parseFloat(reducedEvidence.transition)<=.001);
 if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
 const evidence={schema:'ofu-v1x10-browser-journey-evidence-1',status:'PASS',exactSourceSha:sourceSha,browser:browserName,platform:process.platform,desktop:{viewportDominanceRatio:desktopSize.ratio,keyboardInwardOutward:true,pointerDrag:true,wheelSemanticTravel:true,inspectShortcut:true,escapeReturn:true},mobile:{method:'BROWSER_POINTER_EVENT_EMULATION',physicalDeviceVerified:false,pinchSemanticTravel:true,bottomSheetNoNestedScrollTrap:true,expandedCriticalControlsNoOcclusion:true,minTargetCssPx:expanded.minTargets},accessibility:{keyboardPrimaryJourney:true,reducedMotion:true,aiRequired:false,hiddenDeveloperPanelRequired:false},authority:'PRESENTATION_ONLY',screenshots};fs.writeFileSync(path.join(evidenceDir,`browser-journeys-${browserName}.json`),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{
 for(const context of [desktopContext,mobileContext,reducedContext])if(context)await context.close();
 await browser.close();
}
