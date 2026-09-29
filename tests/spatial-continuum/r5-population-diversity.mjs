import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd();
const artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html');
const evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r5','population-diversity'));
fs.mkdirSync(evidenceDir,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}});
const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
page.on('request',request=>{if(/^https?:/i.test(request.url()))network.push(request.url())});

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const manifest=await page.evaluate(()=>{
    const api=globalThis.__OFU_SPATIAL_CONTINUUM__,open=api.openUniverse,runtime=open.runtime,AS=globalThis.OFU.v1ExplorationAddressSpace,V=globalThis.OFU.v1Common,ctx=runtime.ctx,universe=runtime.universe;
    const plain=value=>{
      if(typeof value==='bigint')return String(value);
      if(Array.isArray(value))return value.map(plain);
      if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,plain(value[key])]));
      return value;
    };
    const hash=(namespace,value)=>V.digest(namespace,plain(value));
    const countBy=(rows,key)=>rows.reduce((counts,row)=>{const value=String(row[key]??'UNKNOWN');counts[value]=(counts[value]||0)+1;return counts},{});
    const galaxyDescriptor=galaxy=>{
      const facts=galaxy.metadata?.facts||{},profile=galaxy.metadata?.modelProfile||{};
      return plain({morphology:facts.morphology||profile.morphology||'UNKNOWN',massLog10MilliDex:facts.massLog10MilliDex??profile.massLog10MilliDex??null,characteristicRadiusPc:facts.characteristicRadiusPc??profile.characteristicRadiusPc??null,populationAgeMyr:facts.populationAgeMyr??profile.meanAgeMyr??null,metallicityMilliDex:facts.metallicityMilliDex??profile.metallicityMilliDex??null,starFormationActivityQ16:facts.starFormationActivityQ16??null,environmentDensityQ16:facts.environmentDensityQ16??null,stellarPopulationMix:profile.stellarPopulationMix??null});
    };
    const systemDescriptor=system=>{
      const facts=plain(system.metadata?.facts||{}),children=AS.systemChildren({ctx,system,includeMoons:true});
      const stars=children.stars.map(star=>plain(star.metadata?.facts||{})),planets=children.planets.map(planet=>plain(planet.metadata?.facts||{})),moons=children.moons.map(moon=>plain(moon.metadata?.facts||{}));
      return{descriptor:plain({facts,stars,planets,moons}),summary:{stellarComponents:stars.length,planets:planets.length,moons:moons.length,architecture:String(facts.planetArchitecture||'UNKNOWN'),bodyClassHistogram:countBy(planets,'bulkPriorClass')}};
    };
    const windows=Array.from({length:12},(_,index)=>Object.freeze({x:2n+BigInt(index),y:-3n+BigInt(index%3),z:-1n+BigInt(index%2)}));
    const galaxies=[],regions=[],systems=[],windowRecords=[];
    for(const window of windows){
      const discovery=AS.discoverGalaxies({ctx,universeNode:universe,window,cursor:0,limit:8,maxProbes:4096}),windowKey=`${window.x},${window.y},${window.z}`,windowGalaxyIds=[];
      for(const galaxy of discovery.galaxies){const descriptor=galaxyDescriptor(galaxy),stateHash=hash('OFU-R5-GALAXY-SCIENTIFIC-DESCRIPTOR',descriptor);galaxies.push({id:galaxy.canonicalId||galaxy.entityId,window:windowKey,morphology:descriptor.morphology,stateHash,descriptor});windowGalaxyIds.push(galaxy.canonicalId||galaxy.entityId)}
      const representative=discovery.galaxies[0];let regionDiscovery=null,systemDiscovery=null;
      if(representative){
        regionDiscovery=AS.discoverRegions({ctx,galaxy:representative,window:{x:0n,y:0n,z:0n},cursor:0,limit:4,maxProbes:512});
        for(const region of regionDiscovery.regions){const descriptor=plain({sectorFacts:region.metadata?.sectorFacts||null,regionProfile:region.metadata?.regionProfile||null});regions.push({id:region.entityId,galaxyId:representative.canonicalId||representative.entityId,stateHash:hash('OFU-R5-REGION-MODEL-DESCRIPTOR',descriptor),descriptor})}
        for(const region of regionDiscovery.regions){const hood=AS.neighborhood(region,{x:0n,y:0n,z:0n}),candidate=AS.discoverSystems({ctx,neighborhood:hood,cursor:0,limit:8,maxProbes:4096});if(candidate.systems.length){systemDiscovery=candidate;break}}
        for(const system of systemDiscovery?.systems||[]){const {descriptor,summary}=systemDescriptor(system),stateHash=hash('OFU-R5-SYSTEM-SCIENTIFIC-DESCRIPTOR',descriptor);systems.push({id:system.canonicalId||system.entityId,galaxyId:representative.canonicalId||representative.entityId,stateHash,summary,descriptor})}
      }
      windowRecords.push({window:windowKey,galaxyIds:windowGalaxyIds,galaxyCount:discovery.galaxies.length,probes:discovery.probes,regionCount:regionDiscovery?.regions.length||0,systemCount:systemDiscovery?.systems.length||0});
    }
    const reverseRecords=[];
    for(const window of [...windows].reverse()){const discovery=AS.discoverGalaxies({ctx,universeNode:universe,window,cursor:0,limit:8,maxProbes:4096});reverseRecords.push({window:`${window.x},${window.y},${window.z}`,galaxyIds:discovery.galaxies.map(galaxy=>galaxy.canonicalId||galaxy.entityId)})}
    const duplicateValues=values=>[...values.reduce((counts,value)=>counts.set(value,(counts.get(value)||0)+1),new Map())].filter(([,count])=>count>1).map(([value,count])=>({value,count}));
    const systemShapes=systems.map(row=>`${row.summary.stellarComponents}:${row.summary.planets}:${row.summary.moons}:${row.summary.architecture}:${JSON.stringify(row.summary.bodyClassHistogram)}`);
    const morphologyDistribution=countBy(galaxies,'morphology'),systemArchitectureDistribution=Object.fromEntries(Object.entries(countBy(systems.map(row=>({architecture:row.summary.architecture})),'architecture')).sort());
    const orderIndependent=windowRecords.every(record=>{const reverse=reverseRecords.find(candidate=>candidate.window===record.window);return JSON.stringify(record.galaxyIds)===JSON.stringify(reverse?.galaxyIds)});
    return plain({contract:'ofu-r5-diversity-manifest-1',testSeed:'R5_POPULATION_WINDOWS_V1',sampleSizes:{windows:windows.length,galaxies:galaxies.length,regions:regions.length,systems:systems.length},uniqueIdentityCounts:{galaxies:new Set(galaxies.map(row=>row.id)).size,regions:new Set(regions.map(row=>row.id)).size,systems:new Set(systems.map(row=>row.id)).size},uniqueScientificStateHashes:{galaxies:new Set(galaxies.map(row=>row.stateHash)).size,regions:new Set(regions.map(row=>row.stateHash)).size,systems:new Set(systems.map(row=>row.stateHash)).size},duplicateFullStateHashes:{galaxies:duplicateValues(galaxies.map(row=>row.stateHash)),regions:duplicateValues(regions.map(row=>row.stateHash)),systems:duplicateValues(systems.map(row=>row.stateHash))},categoryDistributions:{galaxyMorphology:morphologyDistribution,systemArchitecture:systemArchitectureDistribution,systemStructuralShapes:new Set(systemShapes).size},orderIndependent,revisitChecks:{windowsReplayedInReverse:true,exactGalaxyLists:orderIndependent},windowRecords,representativeDossiers:{galaxies:galaxies.slice(0,12),regions:regions.slice(0,12),systems:systems.slice(0,12)},authority:{galaxyAndSystemIdentity:'CANONICAL',regionState:'MODEL_DERIVED',visualGrammar:'PRESENTATION_ONLY'},visualEvidencePaths:[],visualReview:'NOT_PERFORMED_BY_THIS_LIGHTWEIGHT_NON_RENDERING_TEST'});
  });

  fs.writeFileSync(path.join(evidenceDir,'diversity-manifest.partial.json'),JSON.stringify({status:'FALSIFICATION_IN_PROGRESS',manifest,runtimeNetworkRequests:network.length,errors},null,2)+'\n');
  assert.equal(manifest.sampleSizes.windows,12);
  assert.ok(manifest.sampleSizes.galaxies>=72,'twelve bounded sparse discovery windows must yield a substantial lightweight galaxy population');
  assert.ok(manifest.windowRecords.every(record=>record.galaxyCount>0),'a sampled macro window unexpectedly contained no discovered galaxy within its declared probe budget');
  assert.equal(manifest.uniqueIdentityCounts.galaxies,manifest.sampleSizes.galaxies,'galaxy identity collision');
  assert.equal(manifest.duplicateFullStateHashes.galaxies.length,0,'byte-identical galaxy scientific descriptors are suspicious');
  assert.ok(manifest.sampleSizes.systems>=48,'the bounded representative search must sample at least 48 systems');
  assert.equal(manifest.uniqueIdentityCounts.systems,manifest.sampleSizes.systems,'system identity collision');
  assert.equal(manifest.duplicateFullStateHashes.systems.length,0,'byte-identical full system descriptors are suspicious');
  assert.ok(Object.keys(manifest.categoryDistributions.galaxyMorphology).length>=2,'galaxy morphology collapsed to one category');
  assert.ok(manifest.categoryDistributions.systemStructuralShapes>=8,'system structures collapsed to too few shapes');
  assert.equal(manifest.orderIndependent,true,'window discovery changed when traversal order reversed');
  assert.equal(network.length,0,'population audit performed a runtime network request');
  assert.deepEqual(errors,[]);
  const output={status:'PASS',suite:'spatial-continuum-r5-population-diversity',manifest,runtimeNetworkRequests:network.length,errors};
  fs.writeFileSync(path.join(evidenceDir,'diversity-manifest.json'),JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({status:output.status,suite:output.suite,sampleSizes:manifest.sampleSizes,uniqueIdentityCounts:manifest.uniqueIdentityCounts,uniqueScientificStateHashes:manifest.uniqueScientificStateHashes,duplicateFullStateHashes:manifest.duplicateFullStateHashes,categoryDistributions:manifest.categoryDistributions,orderIndependent:manifest.orderIndependent,runtimeNetworkRequests:network.length},null,2));
}finally{
  await context.close();
  await browser.close();
}
