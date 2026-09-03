import assert from 'node:assert/strict';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';
import {semanticManifestHash,canonicalP5SourceEnvelope,adaptP5EnvironmentV1,adaptP5ResearchExtensionV02,composeResearchEnvironment,createP2BiosphereBindings,generateBiosphereMacro,materializeMeso} from '../../research/p6/biosphere-model-v2.mjs';

function runQueries(key,order){
  const O=loadP5Runtime(),P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,ctx=canonicalContext(A);
  const snapshot=A.planetaryInputSnapshot(ctx,key),planet=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(snapshot)),topology=P5.createTerrainTopology(planet);
  const canonical=adaptP5EnvironmentV1(canonicalP5SourceEnvelope(P5,P5.p6EnvironmentalProjection(planet,topology)));
  const ext=adaptP5ResearchExtensionV02({version:'p6-environment-research-v0.2',authority:'P5_RESEARCH_DRAFT',planetId:snapshot.planetId,environmentalEpochRef:'WORKER_RESEARCH_T0',energy:{baselineInsolationPpm:Number(snapshot.orbit.baselineInsolationPpm)},temperature:{meanK:288,minSeasonalK:250,maxSeasonalK:315,highLatitudeSeasonalityK:45},atmosphere:{pressurePa:101325,columnEquivalentPressurePa:101325,pressureInterpretation:'RESEARCH',heavyGasRetentionProxy:0.9,xuvEscapeKgS:1000},solvent:{surfaceWaterRegime:'LIQUID_SURFACE_CAPABLE',deepWaterRegime:'RESEARCH'},geology:{activityProxy:0.4,regimeProxy:'RESEARCH'},terrain:{oceanFractionPpm:500000,reliefScaleM:4000},radiation:{xuvFractionProxy:0.00001}});
  const env=composeResearchEnvironment(canonical,ext),uid=P.universeIdentity(ctx.masterSeed,ctx.semanticManifestHash).digest,bindings=createP2BiosphereBindings({p2:P,masterSeed:ctx.masterSeed,p6SemanticManifestHash:semanticManifestHash(P),canonicalUniverseIdentity:uid}),macro=generateBiosphereMacro(env,bindings);
  const out=[];for(const i of order.filter(i=>i<macro.commitments.lineageCount)){const m=materializeMeso(env,macro,bindings,{lineageIndexes:[i],speciesPerLineage:2});out.push({i,id:P.hex(m.lineages[0].lineageId),species:m.species.map(s=>P.hex(s.speciesId)).sort()})}
  return out.sort((a,b)=>a.i-b.i);
}

if(!isMainThread){parentPort.postMessage(runQueries(workerData.key,workerData.order));}
else{
  const O=loadP5Runtime(),A=O.p3Astronomy,ctx=canonicalContext(A),chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n),key=chosen.key;
  const forward=[0,1,2,3,4,5],shuffled=[3,0,5,1,4,2],sequential=runQueries(key,forward),shuffledResult=runQueries(key,shuffled);assert.deepEqual(sequential,shuffledResult);
  const worker=(order)=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{key,order}});w.once('message',resolve);w.once('error',reject)});
  const [a,b]=await Promise.all([worker([0,2,4]),worker([1,3,5])]);
  assert.deepEqual([...a,...b].sort((x,y)=>x.i-y.i),sequential);
  const batched=[...runQueries(key,[0,1,2]),...runQueries(key,[3,4,5])].sort((x,y)=>x.i-y.i);assert.deepEqual(batched,sequential);
  console.log(JSON.stringify({status:'PASS',sequential:true,shuffled:true,workers:true,differentBatching:true,resultCount:sequential.length},null,2));
}
