import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r4'));
fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],network=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
page.on('request',request=>{if(/^https?:/i.test(request.url()))network.push(request.url())});

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',{timeout:30000});
  await page.waitForTimeout(250);
  const initial=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
  assert.equal(initial.state.scale.semanticStage,'UNIVERSE');
  assert.equal(initial.worldIdentity,null,'the fresh open-universe session must not preselect a world');
  assert.ok(initial.openUniverse.visibleGalaxies>=3);
  assert.equal(initial.openUniverse.visibleGalaxies,initial.openUniverse.selectableGalaxies);
  assert.equal(initial.openUniverse.currentAddress.depth,1);
  assert.equal(initial.openUniverse.cache.bounded,true);
  assert.equal(initial.render.sceneCount,1);assert.equal(initial.render.cameraCount,1);assert.equal(initial.runtimeNetworkResources,0);assert.deepEqual(network,[]);
  const galaxyTargets=initial.render.pickTargets.macro,galaxyIds=Object.keys(galaxyTargets);assert.equal(galaxyIds.length,initial.openUniverse.visibleGalaxies);
  const firstTarget=galaxyTargets[galaxyIds[0]];assert.equal(firstTarget.visible,true);
  const pickedGalaxy=await page.evaluate(({x,y})=>__OFU_SPATIAL_CONTINUUM__.renderer.pick(x,y)?.id||null,{x:firstTarget.clientX,y:firstTarget.clientY});
  assert.equal(pickedGalaxy,galaxyIds[0],'renderer-owned picking must resolve the visible galaxy');
  await page.screenshot({path:path.join(evidenceDir,'universe-open.png')});

  const branches=[];
  for(const galaxyId of galaxyIds.slice(0,3)){
    await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),galaxyId);
    await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());await page.waitForTimeout(40);
    const state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
    assert.equal(state.state.scale.semanticStage,'GALAXY');assert.equal(state.openUniverse.focusId,galaxyId);assert.equal(state.openUniverse.currentAddress.depth,2);assert.ok(state.openUniverse.catalogue.length>0);assert.ok(state.openUniverse.currentAddress.ids.includes(galaxyId));
    branches.push({galaxyId,address:state.openUniverse.currentAddress.serialized,regions:state.openUniverse.catalogue.map(item=>item.id)});
  }
  assert.equal(new Set(branches.map(item=>item.address)).size,3,'different user selections must produce different persistent addresses');
  assert.ok(branches.some((item,index)=>branches.some((other,otherIndex)=>index!==otherIndex&&item.regions.join('|')!==other.regions.join('|'))),'galaxies must not all converge to one region catalogue');

  await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),branches[0].galaxyId);
  let state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot()),regionId=state.openUniverse.catalogue[0].id;
  await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),regionId);
  await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('NEIGHBORHOOD');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(40);
  state=await page.evaluate(()=>{const snapshot=__OFU_SPATIAL_CONTINUUM__.snapshot();return{...snapshot,visibleCatalogue:__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('NEIGHBORHOOD')}});assert.equal(state.state.scale.semanticStage,'NEIGHBORHOOD');assert.ok(state.visibleCatalogue.length>0);
  await page.screenshot({path:path.join(evidenceDir,'neighborhood-branch.png')});

  let selected=null;const materializationErrors=[],systemAudits=[];
  const systemIds=state.visibleCatalogue.map(item=>item.id);
  for(const systemId of systemIds){
    await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),systemId);
    state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
    systemAudits.push({systemId,focusKind:state.openUniverse.focusKind,catalogue:state.openUniverse.catalogue.map(item=>({id:item.id,kind:item.kind}))});
    const body=state.openUniverse.catalogue.find(item=>item.kind==='PLANET'||item.kind==='MOON');
    if(!body)continue;
    try{await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),body.id);selected=body.id;break}catch(error){materializationErrors.push({systemId,bodyId:body.id,error:String(error?.message||error)})}
  }
  assert.ok(selected,'at least one genuine discovered branch must materialize a supported planetary world: '+JSON.stringify({materializationErrors,systemAudits}));
  await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());await page.waitForTimeout(80);
  const orbital=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
  assert.equal(orbital.state.scale.semanticStage,'ORBIT');assert.equal(orbital.worldIdentity,selected);assert.ok(orbital.openUniverse.currentAddress.ids.includes(selected));assert.equal(orbital.openUniverse.cache.bounded,true);assert.equal(orbital.render.sceneCount,1);assert.equal(orbital.render.cameraCount,1);
  assert.equal(orbital.openUniverse.currentAddress.ids.includes(orbital.openUniverse.sampleIdentity),false,'a lazily proposed sample must not enter the user-owned address before selection');
  await page.screenshot({path:path.join(evidenceDir,'selected-world-orbit.png')});
  await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('APPROACH');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(60);
  const approach=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot()),bodyTarget=approach.render.pickTargets.body,priorSurface=approach.openUniverse.surfaceIdentity;
  const selectedSurface=await page.evaluate(({x,y})=>__OFU_SPATIAL_CONTINUUM__.chooseSurfaceTarget(x,y)?.world.surfaceId||null,{x:bodyTarget.clientX+bodyTarget.diameterCssPx*.12,y:bodyTarget.clientY});assert.ok(selectedSurface);assert.notEqual(selectedSurface,priorSurface,'selecting a new point on the rendered globe must retarget the surface context');
  await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());await page.waitForTimeout(60);const global=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(global.state.scale.semanticStage,'GLOBAL_SURFACE');assert.equal(global.openUniverse.surfaceIdentity,selectedSurface);assert.ok(global.openUniverse.currentAddress.ids.includes(selectedSurface));assert.equal(global.render.planetaryLod.topology,'CUBE_SPHERE');assert.equal(global.render.planetaryLod.faces,6);assert.equal(global.render.planetaryLod.bounded,true);await page.screenshot({path:path.join(evidenceDir,'selected-surface-global.png')});
  await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('HUMAN');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(80);const human=await page.evaluate(()=>({snapshot:__OFU_SPATIAL_CONTINUUM__.snapshot(),proposedSampleId:__OFU_SPATIAL_CONTINUUM__.world.sampleId,objects:__OFU_SPATIAL_CONTINUUM__.openUniverse.localDestinations().nodes.map(item=>({id:item.id,kind:item.kind,latMicroDeg:item.latMicroDeg,lonMicroDeg:item.lonMicroDeg}))}));assert.ok(human.objects.length>=2,'bounded nearby OFU model points must expose plural inspectable destinations');assert.equal(Object.keys(human.snapshot.render.pickTargets.samples).length,Math.min(16,human.objects.length));
  const firstObject=human.objects.find(item=>item.id===human.proposedSampleId)||human.objects.find(item=>{const metric=human.snapshot.render.pickTargets.samples[item.id];return metric&&metric.clientX>=0&&metric.clientX<=1440&&metric.clientY>=0&&metric.clientY<=900}),firstMetric=human.snapshot.render.pickTargets.samples[firstObject.id],pickedLocal=await page.evaluate(({x,y})=>__OFU_SPATIAL_CONTINUUM__.renderer.pick(x,y)?.id||null,{x:firstMetric.clientX,y:firstMetric.clientY});assert.equal(pickedLocal,firstObject.id,'local object selection must use the same renderer geometry shown to the user');
  await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseSample(id),firstObject.id);await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('MOLECULAR');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(50);const firstMicro=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(firstMicro.sourceSampleIdentity,firstObject.id);assert.equal(firstMicro.render.microGrammar.sourceSampleId,firstObject.id);assert.equal(firstMicro.render.microGrammar.claims.exactMolecularSpecies,false);await page.screenshot({path:path.join(evidenceDir,'molecular-sample-a.png')});
  await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('HUMAN');__OFU_SPATIAL_CONTINUUM__.settle()});const secondObject=human.objects.find(item=>item.kind!==firstObject.kind)||human.objects[1];await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseSample(id),secondObject.id);await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('MOLECULAR');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(50);const secondMicro=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(secondMicro.sourceSampleIdentity,secondObject.id);assert.notDeepEqual(secondMicro.render.microGrammar.positions,firstMicro.render.microGrammar.positions,'different source samples must not converge to one fixed microscopic wallpaper');assert.ok(secondMicro.openUniverse.currentAddress.ids.includes(secondObject.id));await page.screenshot({path:path.join(evidenceDir,'molecular-sample-b.png')});
  await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.back();__OFU_SPATIAL_CONTINUUM__.settle();__OFU_SPATIAL_CONTINUUM__.back();__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(60);const restoredSample=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(restoredSample.sourceSampleIdentity,firstObject.id,'branch back must restore the exact previously selected sample');assert.ok(restoredSample.openUniverse.currentAddress.ids.includes(firstObject.id));assert.equal(restoredSample.branchHistory.bounded,true);
  assert.deepEqual(errors,[]);

  const output={status:'PASS',suite:'spatial-continuum-r4-open-universe',visibleGalaxies:initial.openUniverse.visibleGalaxies,distinctGalaxyBranches:branches.length,selectedWorld:selected,selectedSurface,selectedSamples:[firstObject,secondObject],restoredSample:restoredSample.sourceSampleIdentity,address:restoredSample.openUniverse.currentAddress.serialized,cache:restoredSample.openUniverse.cache,rendererOwnedGalaxyPicking:true,rendererOwnedSurfacePicking:true,rendererOwnedLocalPicking:true,planetaryTopology:global.render.planetaryLod.topology,microVariation:true,branchHistoryBounded:restoredSample.branchHistory.bounded,runtimeNetworkRequests:network.length,errors};
  fs.writeFileSync(path.join(evidenceDir,'open-universe.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}finally{await context.close();await browser.close()}
