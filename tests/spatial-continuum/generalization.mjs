import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),fileUrl=pathToFileURL(artifact).href,evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r2'));
fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
const forward=['SYSTEM','ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN','MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'],reverse=[...forward].reverse();

async function openWorld(orbitSlot,latMicroDeg,lonMicroDeg){
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),page=await context.newPage(),errors=[],network=[];
  page.on('pageerror',error=>errors.push(String(error.stack||error)));
  page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
  page.on('request',request=>{if(/^https?:/i.test(request.url()))network.push(request.url())});
  await page.goto(fileUrl+'?continuumWorld=multi&orbitSlot='+orbitSlot+'&latMicroDeg='+latMicroDeg+'&lonMicroDeg='+lonMicroDeg,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.status==='FAIL'||globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const startup=await page.evaluate(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.status==='FAIL'?globalThis.__OFU_SPATIAL_CONTINUUM__:null);
  if(startup)throw new Error('Generalization world failed to start: '+JSON.stringify({orbitSlot,startup,errors}));
  return{context,page,errors,network};
}

try{
  for(const [orbitSlot,latMicroDeg,lonMicroDeg] of [[0,0,0],[2,12345678,23456789],[5,-33000000,151000000]]){
    const test=await openWorld(orbitSlot,latMicroDeg,lonMicroDeg),{page}=test;
    try{
      const initial=await page.evaluate(()=>{const api=__OFU_SPATIAL_CONTINUUM__,snapshot=api.snapshot();return{snapshot,profile:api.world.profile,bodyId:api.world.bodyId,bodyClass:api.world.body.metadata.facts.bulkPriorClass,radiusM:api.world.physicalRadiusM,sampleKind:api.world.sample.kind,sampleId:api.world.sampleId,surfaceTarget:api.world.surfaceTarget,sampleLocalPoint:api.world.sampleLocalPoint,sampleLocalRootPoint:api.world.frames.directionToRoot(api.world.sampleLocalPoint,api.world.frameIds.local),sampleFrameOffset:api.world.frames.relativeMeters([0,0,0],api.world.frameIds.sample,[0,0,0],api.world.frameIds.local),bodyCount:api.world.bodies.filter(item=>item.kind==='planet').length}});
      assert.equal(initial.profile,'MULTI_WORLD_ADVERSARIAL');assert.equal(initial.snapshot.worldIdentity,initial.bodyId);assert.ok(initial.bodyCount>=3);assert.ok(initial.radiusM>0);assert.equal(initial.surfaceTarget.bodyId,initial.bodyId);assert.equal(initial.surfaceTarget.latitudeDeg,latMicroDeg/1e6);assert.equal(initial.surfaceTarget.longitudeDeg,lonMicroDeg/1e6);assert.equal(initial.surfaceTarget.canonicalGeodesyClaim,false);assert.equal(initial.snapshot.state.camera.targetDerived,true);assert.equal(initial.snapshot.render.sceneTransformsFromReferenceFrames,true);for(let axis=0;axis<3;axis++)assert.ok(Math.abs(initial.sampleFrameOffset[axis]-initial.sampleLocalRootPoint[axis])<1e-12);assert.equal(test.network.length,0);

      let alternate=null;
      if(orbitSlot===2){
        alternate=await page.evaluate(primary=>{const api=__OFU_SPATIAL_CONTINUUM__,targets=api.snapshot().render.pickTargets.bodies;for(const[id,metric]of Object.entries(targets)){if(id===primary||!metric.visible)continue;const hit=api.renderer.pick(metric.clientX,metric.clientY);if(hit?.id===id)return{id,metric,radiusM:api.world.cameraTargets.bodies[id].radiusM}}return null},initial.bodyId);
        assert.ok(alternate,'at least one differently rendered body must be independently pickable');
        await page.mouse.click(alternate.metric.clientX,alternate.metric.clientY);await page.waitForTimeout(80);
        await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('ORBIT');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(100);
        const selected=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(selected.state.graph.focusId,alternate.id);assert.equal(selected.state.camera.derivation.fromTargetId,alternate.id);assert.equal(selected.state.camera.derivation.fromRadiusM,alternate.radiusM);assert.equal(selected.render.pickTargets.body.visible,true);
        await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.travelTo('GLOBAL_SURFACE'));await page.waitForTimeout(50);assert.equal((await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot())).state.scale.semanticStage,'ORBIT','an alternate body without materialized surface context must fail closed at approach');
        await page.selectOption('#continuum-body-select',initial.bodyId);await page.waitForTimeout(80);
      }

      for(const stage of forward){await page.evaluate(stage=>{__OFU_SPATIAL_CONTINUUM__.travelTo(stage);__OFU_SPATIAL_CONTINUUM__.settle()},stage);await page.waitForTimeout(35);const state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(state.state.scale.semanticStage,stage);assert.ok(state.state.graph.focusAncestry.includes(initial.bodyId));assert.equal(state.render.sceneCount,1);assert.equal(state.render.cameraCount,1);if(['MOLECULAR','ATOMIC'].includes(stage))assert.ok(state.render.activeMeshes>0)}
      await page.screenshot({path:path.join(evidenceDir,'world-'+orbitSlot+'-atomic.png')});
      for(const stage of reverse){await page.evaluate(stage=>{__OFU_SPATIAL_CONTINUUM__.travelTo(stage);__OFU_SPATIAL_CONTINUUM__.settle()},stage);await page.waitForTimeout(25)}
      const reversed=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(reversed.state.scale.semanticStage,'SYSTEM');assert.equal(reversed.worldIdentity,initial.bodyId);assert.equal(reversed.state.graph.focusId,initial.bodyId);assert.deepEqual(test.errors,[]);
      results.push({orbitSlot,bodyId:initial.bodyId,bodyClass:initial.bodyClass,radiusM:initial.radiusM,surfaceId:initial.surfaceTarget.locationIdentity,sampleKind:initial.sampleKind,sampleId:initial.sampleId,latitudeDeg:initial.surfaceTarget.latitudeDeg,longitudeDeg:initial.surfaceTarget.longitudeDeg,alternatePick:alternate?{id:alternate.id,radiusM:alternate.radiusM}:null,resources:{meshes:reversed.render.meshCount,materials:reversed.render.materialCount,textures:reversed.render.textureCount,totalVertices:reversed.render.totalVertices,terrainPatchPool:reversed.render.terrainPatchPool},rendererProfile:reversed.render.profile});
    }finally{await test.context.close()}
  }
  assert.equal(new Set(results.map(item=>item.bodyId)).size,3);assert.equal(new Set(results.map(item=>item.surfaceId)).size,3,'different bodies/coordinates must never inherit another world surface frame');assert.ok(new Set(results.map(item=>item.radiusM)).size>=2,'target-derived framing must be exercised against different physical radii');assert.ok(new Set(results.map(item=>item.sampleKind)).size>=2,'multi-world suite must exercise material/sample diversity');
  const output={status:'PASS',suite:'spatial-continuum-r2-generalization',worlds:results.length,fullForwardReverse:true,rendererOwnedAlternateBodyPicking:true,targetDerivedCamera:true,frameDerivedRendering:true,surfaceTargetContinuity:true,results};
  fs.writeFileSync(path.join(evidenceDir,'generalization-results.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}finally{await browser.close()}
