import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r6','macro-streaming'));
fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const initial=await page.evaluate(()=>{const api=__OFU_SPATIAL_CONTINUUM__,snapshot=api.snapshot(),ids=snapshot.openUniverse.catalogue.map(item=>item.id);return{windowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,ids,activeCells:snapshot.openUniverse.galaxyStreaming.activeCells,metrics:snapshot.render.pickTargets.macro,controls:[...document.querySelectorAll('#continuum-field-nav button')].map(button=>button.textContent.trim())}});
  assert.equal(initial.activeCells.length,1);
  assert.ok(initial.ids.length>=3);
  assert.ok(initial.controls.every(label=>label.includes('Drift')&&!label.includes('Field')),'macro controls must describe spatial motion rather than pages');

  await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.nudgeMacro('positiveX'));
  await page.waitForTimeout(120);
  const inFlight=await page.evaluate(()=>{const snapshot=__OFU_SPATIAL_CONTINUUM__.snapshot();return{windowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,macroPosition:snapshot.state.camera.macroPosition,discovery:snapshot.openUniverse.galaxyStreaming.discovery,metrics:snapshot.render.pickTargets.macro}});
  assert.equal(inFlight.windowKey,initial.windowKey,'camera movement must precede cell commitment');
  assert.ok(inFlight.macroPosition[0]>32,'the authoritative camera must cross the spatial streaming boundary');
  assert.equal(inFlight.discovery.state,'DISCOVERING');

  await page.waitForFunction(key=>{const snapshot=__OFU_SPATIAL_CONTINUUM__.snapshot();return snapshot.openUniverse.galaxyStreaming.activeWindowKey!==key&&snapshot.openUniverse.galaxyStreaming.discovery.state==='IDLE'},initial.windowKey,{timeout:120000});
  await page.waitForTimeout(120);
  const settled=await page.evaluate(()=>{const snapshot=__OFU_SPATIAL_CONTINUUM__.snapshot();return{windowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,macroPosition:snapshot.state.camera.macroPosition,activeCells:snapshot.openUniverse.galaxyStreaming.activeCells,activeCellLimit:snapshot.openUniverse.galaxyStreaming.activeCellLimit,visibleCount:snapshot.openUniverse.galaxyStreaming.visibleCount,catalogueIds:snapshot.openUniverse.catalogue.map(item=>item.id),metrics:snapshot.render.pickTargets.macro,bounded:snapshot.openUniverse.bounded,sceneCount:snapshot.render.sceneCount,cameraCount:snapshot.render.cameraCount,network:snapshot.runtimeNetworkResources}});
  const initialWindow=initial.windowKey.split(',').map(BigInt),expectedWindow=`${initialWindow[0]+1n},${initialWindow[1]},${initialWindow[2]}`;
  assert.equal(settled.windowKey,expectedWindow);
  assert.equal(settled.activeCells.length,2,'the prior and current macro cells must coexist');
  assert.ok(settled.activeCells.some(cell=>cell.windowKey===initial.windowKey&&cell.relativeCell[0]===-1));
  assert.ok(settled.activeCells.some(cell=>cell.windowKey===expectedWindow&&cell.relativeCell[0]===0&&cell.current));
  assert.ok(settled.catalogueIds.length>initial.ids.length,'the visible universe must gain spatially resident canonical galaxies');
  assert.equal(new Set(settled.catalogueIds).size,settled.catalogueIds.length,'resident cells must not duplicate canonical identities');
  assert.ok(initial.ids.every(id=>settled.catalogueIds.includes(id)),'the prior cell must remain spatially present after handoff');
  assert.ok(settled.macroPosition[0]<0&&settled.macroPosition[0]>-32,'camera-relative rebasing must retain the physical view while bounding local coordinates');
  const anchorId=initial.ids[0],before=inFlight.metrics[anchorId],after=settled.metrics[anchorId];
  assert.ok(before&&after,'a prior-cell anchor must survive renderer reconciliation');
  assert.ok(Math.abs(before.clientX-after.clientX)<2&&Math.abs(before.clientY-after.clientY)<2,'cell rebasing must preserve the prior object screen-space anchor');
  assert.equal(settled.bounded,true);assert.ok(settled.activeCells.length<=settled.activeCellLimit);assert.equal(settled.sceneCount,1);assert.equal(settled.cameraCount,1);assert.equal(settled.network,0);assert.deepEqual(errors,[]);

  const output={status:'PASS',suite:'spatial-continuum-r6-continuous-macro-streaming',initial:{windowKey:initial.windowKey,galaxies:initial.ids.length,controls:initial.controls},inFlight:{windowKey:inFlight.windowKey,macroPosition:inFlight.macroPosition,pending:inFlight.discovery.pending},settled:{windowKey:settled.windowKey,macroPosition:settled.macroPosition,activeCells:settled.activeCells,visibleCount:settled.visibleCount,screenAnchorDeltaPx:[after.clientX-before.clientX,after.clientY-before.clientY],bounded:settled.bounded,sceneCount:settled.sceneCount,cameraCount:settled.cameraCount,network:settled.network}};
  fs.writeFileSync(path.join(evidenceDir,'macro-streaming.json'),JSON.stringify(output,null,2)+'\n');
  await page.screenshot({path:path.join(evidenceDir,'two-resident-macro-cells.png'),fullPage:true});
  console.log(JSON.stringify(output,null,2));
}finally{await context.close();await browser.close()}
