import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const engine={chromium,firefox,webkit}[browserName];
if(!engine)throw new Error('unknown browser '+browserName);
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const build=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));if(build.sourceCommit!==sourceSha)throw new Error('source mismatch');
const file=path.resolve('dist/One_File_Universe.html');
const evidenceDir=path.resolve('dist/evidence/rendering-production');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await engine.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:Number(process.env.DPR||1)});
const page=await context.newPage();
const errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));
const url=pathToFileURL(file).href;
const ready=()=>page.waitForFunction(()=>{
 const O=globalThis.OFU,P=globalThis.__OFU_PLANET_PREVIEW__,N=O?.v08ExploreNavigation,I=O?.inspectorTest?.state?.current;
 return globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&P?.targetStatus==='SUPPORTED'&&P?.camera&&N?.state?.ready&&I?.type==='Planet'&&O?.v08InspectorProduct&&O?.v08LabTechnical&&O?.v08MobileInteraction&&O?.v08SelectionBridge;
},undefined,{timeout:30000});
const noOverflow=async label=>{const x=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,iw:innerWidth}));if(x.sw>x.cw+2||x.sw>x.iw+2)throw new Error(label+' horizontal overflow '+JSON.stringify(x));return x};
const shot=async name=>{if(browserName!=='chromium')return null;const out=path.join(evidenceDir,`v08-${name}.png`);await page.screenshot({path:out,fullPage:true});return path.basename(out)};
try{
 await page.goto(url,{waitUntil:'load'});await ready();
 await page.waitForFunction(()=>document.getElementById('inspector-object-status')?.textContent!=='pending');
 const initial=await page.evaluate(()=>{
  const O=OFU,P=__OFU_PLANET_PREVIEW__,N=O.v08ExploreNavigation,I=O.inspectorTest.state.current,A=O.p3Astronomy,target=N.state.targets[N.state.selectedIndex],panel=document.querySelector('[data-workspace-panel="explore"]');
  const resolved=A.resolvePlanet(P.ctx,target.key),snap=P.snapshot();
  return{workspace:O.productUI.state.workspace,targets:N.state.targets.length,selected:N.state.selectedIndex,selectedName:target.name,visibleExplore:String(panel?.innerText||'').replace(/\s+/g,' ').trim(),viewportName:document.getElementById('selected-object-name')?.textContent,viewportIdHidden:document.getElementById('selected-object-id')?.hidden,planetId:O.p2.hex(resolved.id),previewId:P.provider?.planetId||P.chosen?.planetId,inspectorId:O.p2.hex(I.r.id),planetDigest:O.p2.hex(A.digestFact(resolved)),systemDigest:O.p2.hex(A.digestFact(N.state.system)),palette:snap.renderer?.palette,authority:snap.authority};
 });
 if(initial.workspace!=='explore'||initial.targets<1)throw new Error('Explore did not establish discoverable system context');
 if(initial.planetId!==initial.previewId||initial.planetId!==initial.inspectorId)throw new Error('initial selected target continuity failed '+JSON.stringify(initial));
 if(initial.viewportIdHidden!==true||/[0-9a-f]{32,}/i.test(initial.visibleExplore)||/galaxyX|sectorX|siteX/i.test(initial.visibleExplore))throw new Error('technical identity leaked into primary Explore experience');
 if(!/Planet \d+/.test(initial.viewportName||'')||!/System overview/.test(initial.visibleExplore)||!/Approach selected world/.test(initial.visibleExplore)||!/Inspect this world/.test(initial.visibleExplore))throw new Error('30-second Explore orientation/action hierarchy incomplete '+initial.visibleExplore);
 if(initial.palette!=='MINERAL_PRESENTATION_ONLY'||initial.authority!=='PRESENTATION_ONLY')throw new Error('renderer presentation authority/palette drift '+JSON.stringify({palette:initial.palette,authority:initial.authority}));
 await noOverflow('desktop Explore');
 const screenshots=[];const s0=await shot('founder-desktop-explore');if(s0)screenshots.push(s0);

 await page.click('#explore-go');
 await page.waitForFunction(()=>Math.abs(__OFU_PLANET_PREVIEW__.camera.targetDistanceM/__OFU_PLANET_PREVIEW__.radius-1.35)<1e-9);
 await page.waitForTimeout(150);
 const approach=await page.evaluate(()=>{const s=__OFU_PLANET_PREVIEW__.snapshot();return{distance:s.cameraTarget.distanceM/__OFU_PLANET_PREVIEW__.radius,penetrating:s.camera.penetratingPresentationGeometry,coverage:s.plan?.coverageComplete,mode:s.plan?.coverageMode,outer:s.presentationBounds?.maxRadiusM,min:s.cameraEnvelope?.minDistanceM,working:s.workingSet,gpu:s.gpu?.gpu||null,clip:s.clip}});
 if(Math.abs(approach.distance-1.35)>1e-9||approach.penetrating!==false||approach.coverage!==true)throw new Error('Approach camera/LOD invariant failed '+JSON.stringify(approach));
 if(approach.working?.activePatches>28||approach.working?.cpuMeshes>56||approach.gpu?.liveMeshes>48||approach.gpu?.liveTrackedBytes>8*1024*1024)throw new Error('render working set exceeded v0.8 bounds '+JSON.stringify(approach));
 const s1=await shot('founder-desktop-approach');if(s1)screenshots.push(s1);

 await page.click('[data-workspace-panel="explore"] [data-open-workspace="inspect"]');
 await page.waitForFunction(()=>OFU.productUI.state.workspace==='inspect'&&document.querySelector('[data-workspace-panel="inspect"]')?.hidden===false);
 await page.waitForFunction(()=>/canonical|unsupported|synchronizing/i.test(document.getElementById('inspector-object-status')?.textContent||''));
 const inspect=await page.evaluate(()=>{
  const panel=document.querySelector('[data-workspace-panel="inspect"]'),advanced=panel.querySelector('.raw-details');
  return{text:String(panel.innerText||'').replace(/\s+/g,' ').trim(),headings:[...panel.querySelectorAll('h3')].map(n=>n.textContent.trim()),advancedOpen:advanced?.open===true,biology:document.getElementById('inspector-biology-copy')?.textContent,p6:document.getElementById('inspector-biology-state')?.textContent};
 });
 const identityVisible=await page.locator('#entity-id').isVisible();
 for(const expected of ['Where is it?','Physical state','Environment','Biology','Evidence, limits & provenance'])if(!inspect.headings.includes(expected))throw new Error('Inspector missing human-first section '+expected);
 if(inspect.advancedOpen||identityVisible)throw new Error('raw canonical identity is not progressively disclosed '+JSON.stringify({advancedOpen:inspect.advancedOpen,identityVisible}));
 if(inspect.p6==='INSUFFICIENT_ENVIRONMENT'&&!/cannot currently make a canonical biosphere assessment/i.test(inspect.biology||''))throw new Error('P6 insufficiency lacks plain-language interpretation');
 await noOverflow('desktop Inspect');const s2=await shot('founder-desktop-inspect');if(s2)screenshots.push(s2);

 await page.click('[data-workspace-panel="inspect"] [data-open-workspace="lab"]');
 await page.waitForFunction(()=>OFU.productUI.state.workspace==='lab');
 await page.evaluate(()=>OFU.v08LabTechnical.sync());
 const lab=await page.evaluate(()=>({heading:document.getElementById('lab-heading')?.textContent,continuity:document.getElementById('lab-target-continuity')?.textContent,canonical:document.getElementById('lab-entity-type')?.textContent,visible:String(document.querySelector('[data-workspace-panel="lab"]')?.innerText||'').replace(/\s+/g,' ').trim()}));
 if(!/Lab \/ technical/.test(lab.heading||'')||!/^MATCH/.test(lab.continuity||'')||lab.canonical!=='Planet')throw new Error('Lab technical handoff/continuity failed '+JSON.stringify(lab));
 if(!/Canonical evidence/.test(lab.visible)||!/Rendering diagnostics/.test(lab.visible)||!/Archive \/ replay/.test(lab.visible))throw new Error('Lab technical partition incomplete');
 const s3=await shot('founder-desktop-lab');if(s3)screenshots.push(s3);

 await page.click('[data-workspace-panel="lab"] [data-open-workspace="explore"]');
 await page.waitForFunction(()=>OFU.productUI.state.workspace==='explore');
 const returned=await page.evaluate(()=>{const O=OFU,P=__OFU_PLANET_PREVIEW__,I=O.inspectorTest.state.current,A=O.p3Astronomy,N=O.v08ExploreNavigation,target=N.state.targets[N.state.selectedIndex],planet=A.resolvePlanet(P.ctx,target.key);return{previewId:P.provider?.planetId||P.chosen?.planetId,inspectorId:O.p2.hex(I.r.id),planetId:O.p2.hex(planet.id),planetDigest:O.p2.hex(A.digestFact(planet)),systemDigest:O.p2.hex(A.digestFact(N.state.system))}});
 if(returned.previewId!==initial.planetId||returned.inspectorId!==initial.planetId||returned.planetId!==initial.planetId||returned.planetDigest!==initial.planetDigest||returned.systemDigest!==initial.systemDigest)throw new Error('Explore/Inspect/Lab round trip lost target or canonical witness '+JSON.stringify(returned));

 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>document.documentElement.dataset.ofuMobile==='true'&&globalThis.__OFU_MOBILE_INTERACTION__?.snapshot().active===true);
 await page.waitForFunction(()=>__OFU_MOBILE_INTERACTION__.snapshot().sheet==='peek');
 const mobile=await page.evaluate(()=>{const s=__OFU_MOBILE_INTERACTION__.snapshot(),canvas=document.getElementById('planet-view'),r=canvas.getBoundingClientRect(),buttons=[...document.querySelectorAll('.workspace-nav button,.scale-controls button')].map(n=>Math.min(n.getBoundingClientRect().width,n.getBoundingClientRect().height));return{snap:s,canvas:{top:r.top,width:r.width,height:r.height,bottom:r.bottom},touch:getComputedStyle(canvas).touchAction,minTarget:Math.min(...buttons),hiddenId:document.getElementById('selected-object-id').hidden}});
 if(mobile.snap.sheet!=='peek'||mobile.canvas.height<420||mobile.canvas.height/844<.49||mobile.touch!=='pan-y pinch-zoom'||mobile.minTarget<40||mobile.hiddenId!==true)throw new Error('mobile viewport-first composition failed '+JSON.stringify(mobile));
 await noOverflow('390x844 Explore');const s4=await shot('founder-mobile-explore');if(s4)screenshots.push(s4);
 await page.click('[data-workspace="inspect"]');await page.waitForFunction(()=>OFU.productUI.state.workspace==='inspect'&&__OFU_MOBILE_INTERACTION__.snapshot().sheet==='expanded');
 const mobileInspect=await page.evaluate(()=>({sheet:__OFU_MOBILE_INTERACTION__.snapshot().sheet,workspace:OFU.productUI.state.workspace,expanded:document.querySelector('.mobile-sheet-toggle')?.getAttribute('aria-expanded'),panelVisible:document.querySelector('[data-workspace-panel="inspect"]')?.hidden===false}));
 if(mobileInspect.sheet!=='expanded'||mobileInspect.expanded!=='true'||!mobileInspect.panelVisible)throw new Error('mobile Inspector did not expand progressive sheet '+JSON.stringify(mobileInspect));
 await noOverflow('390x844 Inspect');const s5=await shot('founder-mobile-inspect');if(s5)screenshots.push(s5);
 await page.click('[data-workspace="explore"]');await page.waitForFunction(()=>OFU.productUI.state.workspace==='explore'&&__OFU_MOBILE_INTERACTION__.snapshot().sheet==='peek');

 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));
 if(unexpected.length)throw new Error('unexpected network requests '+JSON.stringify(unexpected));
 if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
 const evidence={status:'PASS',exactSourceSha:sourceSha,browser:browserName,platform:process.platform,productLoop:'ORIENT_DISCOVER_SELECT_APPROACH_UNDERSTAND_CONTINUE',primaryExploreHumanFirst:true,rawIdentityProgressivelyDisclosed:true,inspectorHumanFirst:true,labTechnicalSeparation:true,targetContinuityAcrossWorkspaces:true,approachCameraPenetration:false,approachLodCoverage:true,presentationPalette:'MINERAL_PRESENTATION_ONLY',mobileViewportFirst:true,mobileBottomSheet:true,mobileTouchAction:'pan-y pinch-zoom',canonicalWitnessNonInterference:true,directFile:true,offline:true,physicalAndroid:'NOT_VERIFIED',screenshots};
 fs.writeFileSync(path.join(evidenceDir,`v08-integrated-${browserName}.json`),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await browser.close()}