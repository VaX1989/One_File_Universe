import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd();
const artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html');
const evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r5','generative-universe'));
fs.mkdirSync(evidenceDir,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
page.on('request',request=>{if(/^https?:/i.test(request.url()))network.push(request.url())});
const evaluate=callback=>page.evaluate(callback);
const settle=stage=>page.evaluate(stage=>{const api=__OFU_SPATIAL_CONTINUUM__;api.travelTo(stage);api.settle();return api.snapshot()},stage);
const choose=id=>page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),id);
const screenshot=name=>page.screenshot({path:path.join(evidenceDir,name)});

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const rootState=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
  const galaxyIds=Object.keys(rootState.render.pickTargets.macro);
  assert.ok(galaxyIds.length>=3,'the active deterministic galaxy window must expose at least three choices');

  const descents=[],blockers=[];
  for(const galaxyId of galaxyIds){
    if(descents.length>=3)break;
    await choose(galaxyId);
    const regions=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('GALAXY').slice(0,6).map(item=>item.id));
    let completed=null;
    for(const regionId of regions){
      await choose(regionId);await settle('NEIGHBORHOOD');
      const systems=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('NEIGHBORHOOD').slice(0,8).map(item=>item.id));
      for(const systemId of systems){
        await choose(systemId);await settle('SYSTEM');
        const bodies=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('SYSTEM').filter(item=>item.kind==='PLANET'||item.kind==='MOON').map(item=>({id:item.id,kind:item.kind})));
        for(const body of bodies){
          await choose(body.id);await page.waitForTimeout(20);
          const selected=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
          if(selected.worldIdentity!==body.id){blockers.push({galaxyId,regionId,systemId,bodyId:body.id,reason:selected.openUniverse.materialization.blocker?.reason||'UNSUPPORTED_WORLD'});continue}
          await settle('ORBIT');await screenshot(`galaxy-${descents.length+1}-orbit.png`);
          const visited=['SYSTEM','ORBIT'];
          for(const stage of ['APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN']){await settle(stage);visited.push(stage)}
          await screenshot(`galaxy-${descents.length+1}-human.png`);
          await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.discoverLocalDestinations());const local=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.localDestinationsSnapshot().nodes.map(item=>({id:item.id,kind:item.kind})));
          assert.ok(local.length,'a supported descent must expose a genuine inspectable local source');
          await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseSample(id),local[0].id);
          for(const stage of ['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC']){await settle(stage);visited.push(stage);if(stage==='MOLECULAR')await screenshot(`galaxy-${descents.length+1}-molecular.png`)}
          await screenshot(`galaxy-${descents.length+1}-atomic.png`);
          const atomic=await evaluate(()=>{const api=__OFU_SPATIAL_CONTINUUM__,snapshot=api.snapshot(),science=api.world.generative.scientificState;return{snapshot,science,profile:snapshot.generative.presentation,micro:snapshot.render.microGrammar,bookmark:JSON.parse(JSON.stringify(api.createBookmark()))}});
          assert.equal(atomic.snapshot.state.scale.semanticStage,'ATOMIC');
          assert.equal(atomic.snapshot.worldIdentity,body.id);assert.equal(atomic.snapshot.sourceSampleIdentity,local[0].id);assert.ok(atomic.snapshot.render.activeMeshes>0);
          const reverse=[];for(const stage of ['MOLECULAR','MICROSTRUCTURE','MATERIAL','HUMAN','LOCAL_SURFACE','REGIONAL_SURFACE','GLOBAL_SURFACE','APPROACH','ORBIT','SYSTEM']){await settle(stage);reverse.push(stage)}
          const reversed=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
          assert.equal(reversed.worldIdentity,body.id);assert.equal(reversed.state.graph.focusId,body.id);assert.equal(reversed.state.scale.semanticStage,'SYSTEM');
          completed={galaxyId,regionId,systemId,bodyId:body.id,surfaceId:atomic.snapshot.openUniverse.surfaceIdentity,sampleId:local[0].id,sampleKind:local[0].kind,address:atomic.snapshot.openUniverse.currentAddress.serialized,scientificHash:atomic.snapshot.generative.scientificHashes.context,planetScientificHash:atomic.snapshot.generative.scientificHashes.planet,representationHash:atomic.snapshot.generative.representationHash,physical:{radiusM:Number(atomic.science.planet.meanRadiusM),gravityMicroMs2:Number(atomic.science.planet.surfaceGravityMicroMs2),insolationPpm:Number(atomic.science.planet.insolationPpm),massMilliEarth:Number(atomic.science.planet.massMilliEarth),bulkPriorClass:atomic.science.planet.bulkPriorClass},terrain:atomic.profile.terrain,palette:atomic.profile.planetPalette,micro:{family:atomic.micro.family,positionSignature:atomic.micro.positions.slice(0,8)},causalTrace:atomic.snapshot.generative.causalTrace,visited,reverse,bookmark:atomic.bookmark};
          break;
        }
        if(completed)break;
      }
      if(completed)break;
    }
    if(completed)descents.push(completed);else blockers.push({galaxyId,reason:'NO_SUPPORTED_DESCENT_IN_BOUNDED_SEARCH'});
  }

  assert.equal(descents.length,3,'three independent galaxies must complete a genuine SYSTEM-to-ATOMIC descent: '+JSON.stringify({descents,blockers}));
  assert.equal(new Set(descents.map(item=>item.galaxyId)).size,3);assert.equal(new Set(descents.map(item=>item.bodyId)).size,3);assert.equal(new Set(descents.map(item=>item.address)).size,3);
  const diversity={planetScientificHashes:new Set(descents.map(item=>item.planetScientificHash)).size,representationHashes:new Set(descents.map(item=>item.representationHash)).size,radii:new Set(descents.map(item=>item.physical.radiusM)).size,gravities:new Set(descents.map(item=>item.physical.gravityMicroMs2)).size,insolations:new Set(descents.map(item=>item.physical.insolationPpm)).size,masses:new Set(descents.map(item=>item.physical.massMilliEarth)).size,terrainRelief:new Set(descents.map(item=>`${item.terrain.macroAmplitudeM}:${item.terrain.ridgeAmplitudeM}:${item.terrain.localAmplitudeM}`)).size,terrainWavelengths:new Set(descents.map(item=>`${item.terrain.macroWavelengthM}:${item.terrain.detailWavelengthM}`)).size,palettes:new Set(descents.map(item=>item.palette.join(':'))).size,microFamilies:new Set(descents.map(item=>item.micro.family)).size,microLayouts:new Set(descents.map(item=>JSON.stringify(item.micro.positionSignature))).size};
  fs.writeFileSync(path.join(evidenceDir,'cross-galaxy-generative-universe.partial.json'),JSON.stringify({descents,diversity,blockers},null,2)+'\n');
  assert.equal(diversity.planetScientificHashes,3,'planet scientific state hashes');assert.ok([diversity.radii,diversity.gravities,diversity.insolations,diversity.masses].filter(count=>count>1).length>=3,'genuine planetary inputs must differ across multiple physical dimensions: '+JSON.stringify(diversity));assert.equal(diversity.terrainRelief,3,'terrain relief profiles');assert.equal(diversity.terrainWavelengths,3,'terrain wavelength profiles');assert.equal(diversity.palettes,3,'planet palettes');assert.equal(diversity.microLayouts,3,'microscopic layouts');
  assert.ok(descents.every(item=>item.causalTrace.scientificClaimsAdded===false));assert.equal(network.length,0);assert.deepEqual(errors,[]);
  const final=await evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(final.openUniverse.cache.bounded,true);assert.equal(final.branchHistory.bounded,true);
  const output={status:'PASS',suite:'spatial-continuum-r5-cross-galaxy-generative-universe',generatorVersions:rootState.generative?.versions||descents[0].bookmark.integrity,crossGalaxyDescents:descents,diversity,blockers,bounds:{cache:final.openUniverse.cache,history:final.branchHistory},runtimeNetworkRequests:network.length,evidenceDirectory:evidenceDir};
  fs.writeFileSync(path.join(evidenceDir,'cross-galaxy-generative-universe.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}finally{await context.close();await browser.close()}
