import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r4-generalization'));fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error.stack||error)));page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});await page.waitForFunction(()=>__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const galaxyId=await page.evaluate(()=>{const galaxy=__OFU_SPATIAL_CONTINUUM__.openUniverse.galaxies[0];return String(galaxy.canonicalId||galaxy.entityId)});await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),galaxyId);const regions=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('GALAXY').slice(0,4).map(item=>item.id));
  const worlds=[],blockers=[],seenBodies=new Set();
  for(const regionId of regions){
    await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),regionId);await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('NEIGHBORHOOD');__OFU_SPATIAL_CONTINUUM__.settle()});const systems=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('NEIGHBORHOOD').slice(0,6).map(item=>item.id));
    for(const systemId of systems){
      await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),systemId);await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());let systemState=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());const bodyCatalogue=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('SYSTEM').filter(item=>item.kind==='PLANET'||item.kind==='MOON'));
      if(bodyCatalogue[0]){const metric=systemState.render.pickTargets.macro[bodyCatalogue[0].id];if(metric){const picked=await page.evaluate(({x,y})=>__OFU_SPATIAL_CONTINUUM__.renderer.pick(x,y)?.id||null,{x:metric.clientX,y:metric.clientY});assert.equal(picked,bodyCatalogue[0].id,'system body picking must agree with the visible renderer target')}}
      for(const body of bodyCatalogue){
        if(seenBodies.has(body.id))continue;seenBodies.add(body.id);try{await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),body.id)}catch(error){blockers.push({bodyId:body.id,kind:body.kind,reason:String(error?.message||error)});continue}await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());const orbit=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());if(orbit.worldIdentity!==body.id){blockers.push({bodyId:body.id,kind:body.kind,reason:orbit.openUniverse.materialization.blocker?.reason||'UNAVAILABLE'});continue}
        assert.equal(orbit.state.graph.focusId,body.id);assert.equal(orbit.state.camera.derivation.fromTargetId,body.id);assert.equal(orbit.render.sceneCount,1);assert.equal(orbit.render.cameraCount,1);await page.screenshot({path:path.join(evidenceDir,`world-${worlds.length+1}-orbit.png`)});
        for(const stage of ['APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'])await page.evaluate(stage=>{__OFU_SPATIAL_CONTINUUM__.travelTo(stage);__OFU_SPATIAL_CONTINUUM__.settle()},stage);const sample=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.localDestinations().nodes[0]);assert.ok(sample);await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseSample(id),sample.id);await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('ATOMIC');__OFU_SPATIAL_CONTINUUM__.settle()});const atomic=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(atomic.sourceSampleIdentity,sample.id);assert.ok(atomic.render.activeMeshes>0);assert.equal(atomic.render.microGrammar.claims.exactNuclearComposition,false);await page.screenshot({path:path.join(evidenceDir,`world-${worlds.length+1}-atomic.png`)});worlds.push({bodyId:body.id,systemId,regionId,radiusM:orbit.state.camera.derivation.fromRadiusM,surfaceId:orbit.openUniverse.surfaceIdentity,sampleId:sample.id,sampleKind:sample.kind,microFamily:atomic.render.microGrammar.family,address:atomic.openUniverse.currentAddress.serialized});
        await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('SYSTEM');__OFU_SPATIAL_CONTINUUM__.settle()});if(worlds.length>=3)break;
      }
      if(worlds.length>=3)break;
    }
    if(worlds.length>=3)break;
  }
  assert.ok(worlds.length>=3,'the open kernel must prove at least three genuine materialized worlds: '+JSON.stringify({worlds,blockers}));assert.equal(new Set(worlds.map(item=>item.bodyId)).size,worlds.length);assert.equal(new Set(worlds.map(item=>item.surfaceId)).size,worlds.length);const final=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(final.openUniverse.cache.bounded,true);assert.equal(final.branchHistory.bounded,true);assert.ok(final.openUniverse.cache.metrics.evictions>0,'multi-world traversal must exercise bounded eviction rather than retain the universe');assert.deepEqual(errors,[]);
  const output={status:'PASS',suite:'spatial-continuum-r4-multi-world-generalization',worlds,blockers,distinctWorlds:worlds.length,distinctSystems:new Set(worlds.map(item=>item.systemId)).size,cache:final.openUniverse.cache,history:final.branchHistory,rendererOwnedBodyPicking:true};fs.writeFileSync(path.join(evidenceDir,'open-generalization.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}finally{await context.close();await browser.close()}
