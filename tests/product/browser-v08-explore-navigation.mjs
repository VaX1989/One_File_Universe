import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const engine={chromium,firefox,webkit}[browserName];
if(!engine)throw new Error('unknown browser '+browserName);
const file=path.resolve('dist/One_File_Universe.html');
if(!fs.existsSync(file))throw new Error('build dist/One_File_Universe.html before running Lane A browser evidence');
const evidenceDir=path.resolve('dist/evidence/v08-lane-a');
fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await engine.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
try{
 await page.goto(pathToFileURL(file).href,{waitUntil:'load'});
 await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&globalThis.__OFU_PLANET_PREVIEW__?.targetStatus==='SUPPORTED'&&globalThis.OFU?.v08ExploreNavigation?.state?.ready,{timeout:30000});
 const initial=await page.evaluate(()=>{
  const O=OFU,N=O.v08ExploreNavigation,P=__OFU_PLANET_PREVIEW__,A=O.p3Astronomy;
  const target=N.state.targets[N.state.selectedIndex],system=N.state.system,current=A.resolvePlanet(P.ctx,target.key);
  return{planetCount:Number(system.facts.planetCount),targetCount:N.state.targets.length,selectedIndex:N.state.selectedIndex,selectedName:target.name,previewId:P.provider?.planetId||P.chosen?.planetId,currentId:O.p2.hex(current.id),systemDigest:O.p2.hex(O.p3Astronomy.digestFact(system)),planetDigest:O.p2.hex(O.p3Astronomy.digestFact(current)),approachDisabled:document.getElementById('explore-go').disabled,layoutNote:document.getElementById('explore-layout-note').textContent};
 });
 if(initial.planetCount!==initial.targetCount||initial.targetCount<1)throw new Error('canonical system discovery count mismatch');
 if(initial.previewId!==initial.currentId||initial.approachDisabled)throw new Error('initial target identity continuity failed');
 if(!/not a claim about physical orbital geometry/i.test(initial.layoutNote))throw new Error('presentation-layout scientific guardrail missing');
 await page.click('#explore-go');
 const approach=await page.evaluate(()=>{const P=__OFU_PLANET_PREVIEW__;return{stage:OFU.v08ExploreNavigation.state.stage,targetRadii:P.camera.targetDistanceM/P.radius}});
 if(approach.stage!=='approach'||Math.abs(approach.targetRadii-1.35)>1e-9)throw new Error('selection to approach failed');
 await page.click('[data-explore-stage="system"]');
 const systemStage=await page.evaluate(()=>{const P=__OFU_PLANET_PREVIEW__;return{stage:OFU.v08ExploreNavigation.state.stage,targetRadii:P.camera.targetDistanceM/P.radius}});
 if(systemStage.stage!=='system'||Math.abs(systemStage.targetRadii-180)>1e-9)throw new Error('navigation back to system failed');
 let alternate=null;
 if(initial.targetCount>1){
  await page.focus('[data-explore-relative="1"]');await page.keyboard.press('Enter');
  alternate=await page.evaluate(()=>{const N=OFU.v08ExploreNavigation,P=__OFU_PLANET_PREVIEW__,target=N.state.targets[N.state.selectedIndex],resolved=OFU.p3Astronomy.resolvePlanet(P.ctx,target.key);return{selectedIndex:N.state.selectedIndex,name:target.name,status:resolved.status,approachDisabled:document.getElementById('explore-go').disabled,previewId:P.provider?.planetId||P.chosen?.planetId,message:document.getElementById('explore-selection-status').textContent}});
  if(alternate.selectedIndex===initial.selectedIndex||alternate.status!=='PRESENT'||!alternate.approachDisabled)throw new Error('alternate canonical target behavior failed');
  if(alternate.previewId!==initial.previewId)throw new Error('discovery selection interfered with renderer/canonical selection');
  if(!/navigation bridge/i.test(alternate.message))throw new Error('renderer dependency is not stated truthfully');
  await page.focus('[data-explore-relative="-1"]');await page.keyboard.press('Enter');
 }
 const final=await page.evaluate(()=>{
  const O=OFU,N=O.v08ExploreNavigation,P=__OFU_PLANET_PREVIEW__,A=O.p3Astronomy,target=N.state.targets[N.state.selectedIndex],system=A.resolveSystem(P.ctx,Object.fromEntries(Object.entries(target.key).filter(([k])=>k!=='orbitSlot'))),planet=A.resolvePlanet(P.ctx,target.key);
  return{selectedIndex:N.state.selectedIndex,systemDigest:O.p2.hex(A.digestFact(system)),planetDigest:O.p2.hex(A.digestFact(planet)),workspace:O.productUI.state.workspace,stage:N.state.stage};
 });
 if(final.selectedIndex!==initial.selectedIndex)throw new Error('previous/next target round trip failed');
 if(final.systemDigest!==initial.systemDigest||final.planetDigest!==initial.planetDigest)throw new Error('canonical witness changed after Explore navigation');
 if(pageErrors.length)throw new Error('page errors '+JSON.stringify(pageErrors));
 const shots=[];
 if(browserName==='chromium'){
  const shot=path.join(evidenceDir,'lane-a-system.png');await page.screenshot({path:shot,fullPage:true});shots.push(path.basename(shot));
 }
 const evidence={status:'PASS',lane:'A',browser:browserName,systemToBodySelection:true,selectionToApproach:true,backToSystem:true,targetIdentityContinuity:true,alternateCanonicalTargetFailClosed:initial.targetCount>1,canonicalWitnessNonInterference:true,keyboardButtonActivation:true,presentationOrbitLayoutDisclosed:true,screenshots:shots};
 fs.writeFileSync(path.join(evidenceDir,`lane-a-${browserName}.json`),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence));
}finally{await browser.close()}
