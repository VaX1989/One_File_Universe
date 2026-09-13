import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),fileUrl=pathToFileURL(artifact).href,evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r2'));
fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-precise-memory-info','--js-flags=--expose-gc']}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
await page.goto(fileUrl,{waitUntil:'load'});await page.waitForFunction(()=>__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
const snap=()=>page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
const heap=()=>page.evaluate(()=>{try{globalThis.gc?.()}catch{}const value=performance.memory;return value?{usedJSHeapSize:value.usedJSHeapSize,totalJSHeapSize:value.totalJSHeapSize,jsHeapSizeLimit:value.jsHeapSizeLimit}:null});
const resourceShape=state=>({meshes:state.render.meshCount,materials:state.render.materialCount,textures:state.render.textureCount,vertices:state.render.totalVertices,terrainPool:state.render.terrainPatchPool,sceneCount:state.render.sceneCount,cameraCount:state.render.cameraCount});

try{
  const initial=await snap(),initialResources=resourceShape(initial),idleSamples=initial.render.profile.samples;await page.waitForTimeout(900);const idle=await snap();assert.equal(idle.render.profile.samples,idleSamples,'idle scene must not issue redundant renderer work');
  await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.resetMetrics());const continuous=[];
  for(const stage of ['ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN']){const started=Date.now();await page.evaluate(stage=>__OFU_SPATIAL_CONTINUUM__.travelTo(stage),stage);await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.waitForSettled(8000));continuous.push({stage,durationMs:Date.now()-started})}
  await page.locator('#continuum-canvas').focus();await page.keyboard.down('w');await page.waitForTimeout(850);await page.keyboard.up('w');await page.waitForTimeout(120);const interactive=await snap();assert.ok(interactive.performance.inputResponseMedian<80,'input response must remain perceptually prompt in the automated environment');
  const samples=[{loop:0,heap:await heap(),resources:resourceShape(interactive),history:interactive.state.historyDepth}];
  for(let loop=1;loop<=10;loop++){
    for(const stage of ['SYSTEM','HUMAN','MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC','HUMAN','SYSTEM'])await page.evaluate(stage=>{__OFU_SPATIAL_CONTINUUM__.travelTo(stage);__OFU_SPATIAL_CONTINUUM__.settle()},stage);
    await page.waitForTimeout(80);const state=await snap(),resources=resourceShape(state);assert.deepEqual(resources,initialResources,'renderer resources must remain structurally bounded through repeated journeys');assert.ok(state.state.historyDepth<=64);samples.push({loop,heap:await heap(),resources,history:state.state.historyDepth});
  }
  const final=await snap(),heaps=samples.map(row=>row.heap?.usedJSHeapSize).filter(Number.isFinite),memory=heaps.length?{available:true,startBytes:heaps[0],endBytes:heaps.at(-1),minBytes:Math.min(...heaps),maxBytes:Math.max(...heaps),deltaBytes:heaps.at(-1)-heaps[0],samples:heaps.length}:{available:false};
  if(memory.available)assert.ok(memory.endBytes<=memory.startBytes*1.3+8*1024*1024,'forced-GC JS heap trend must remain bounded');
  const output={status:'PASS',suite:'spatial-continuum-performance-resource',environment:{browser:await browser.version(),headless:true,physicalGpu:false,viewport:'1440x900'},idleDemandRendering:{rendererSamplesAdded:idle.render.profile.samples-idleSamples},continuousTransitions:continuous,animationCadence:interactive.performance,rendererCpu:final.render.profile,hardwareScalingLevel:final.render.hardwareScalingLevel,resources:initialResources,resourceSoak:{loops:10,samples,memory},limitations:['Headless Chromium/software rendering is not physical-GPU frame-pacing evidence.','Draw calls use Babylon SceneInstrumentation and reflect the most recently rendered frame.']};
  fs.writeFileSync(path.join(evidenceDir,'performance-results.json'),JSON.stringify(output,null,2)+'\n');assert.deepEqual(errors,[]);console.log(JSON.stringify(output,null,2));
}finally{await context.close();await browser.close()}
