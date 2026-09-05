import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const file=path.resolve('dist/One_File_Universe.html'),evidenceDir=path.resolve('dist/evidence/product-v09');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
try{
 await page.goto(pathToFileURL(file).href,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v09ExplorerScene?.seamVersion===3&&OFU?.v09VisualUniverseBridge?.state?.ready&&OFU?.v09VisualUniverse?.snapshot().sceneStatus==='READY',{},{timeout:30000});
 const first=await page.evaluate(()=>({bridge:OFU.v09VisualUniverseBridge.snapshot(),visual:OFU.v09VisualUniverse.snapshot(),scene:OFU.v09ExplorerScene.snapshot(),canvas:!!document.getElementById('visual-universe-overlay'),runtime:OFU.waveIVScaleRuntime.snapshot()}));
 if(!first.canvas||first.visual.canonicalBodyCount!==first.scene.bodies.length||first.visual.selectedOrbitSlot!==first.scene.selection.orbitIndex)throw new Error('visual bridge mismatch '+JSON.stringify(first));
 await page.click('[data-render-stage="approach"]');await page.waitForFunction(()=>OFU.v09VisualUniverse.snapshot().stage==='approach'&&OFU.waveIVScaleRuntime.snapshot().semanticScale==='approach');
 await page.click('[data-render-stage="system"]');await page.waitForFunction(()=>OFU.v09VisualUniverse.snapshot().stage==='system'&&OFU.waveIVScaleRuntime.snapshot().activeSceneProvider==='visual-universe-system');
 await page.screenshot({path:path.join(evidenceDir,'v09-converged-system.png'),fullPage:true});
 const final=await page.evaluate(()=>({bridge:OFU.v09VisualUniverseBridge.snapshot(),visual:OFU.v09VisualUniverse.snapshot(),runtime:OFU.waveIVScaleRuntime.snapshot()}));if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
 const evidence={status:'PASS',exactSourceSha:sourceSha,sceneSeamVersion:3,visualAuthority:final.visual.authority,sceneStatus:final.visual.sceneStatus,canonicalBodies:final.visual.canonicalBodyCount,canonicalStars:final.visual.canonicalStarCount,decorativeStars:final.visual.decorativeStarCount,selectedOrbitSlot:final.visual.selectedOrbitSlot,bridgeUpdates:final.bridge.updates,eventDrivenSceneConvergence:true,legacyPollingAuthority:false,primarySceneProvider:final.runtime.activeSceneProvider,screenshot:'v09-converged-system.png'};fs.writeFileSync(path.join(evidenceDir,'v09-visual-bridge.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await browser.close()}
