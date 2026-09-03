import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';

function localSeal(offset){
  const O=loadP5Runtime();
  if(!O.p5EnvironmentV2)vm.runInThisContext(fs.readFileSync('src/domains/planetology/p5-environment-v2.js','utf8'),{filename:'src/domains/planetology/p5-environment-v2.js'});
  const A=O.p3Astronomy,P5=O.p5Planetology,E=O.p5EnvironmentV2,P=O.p2,ctx=canonicalContext(A,offset);
  const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
  const planet=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot)),topology=P5.createTerrainTopology(planet);
  return {planetId:P.hex(planet.planetId),environmentDigest:P.hex(E.environmentDigest(E.environmentV2Projection(planet,topology))),earth:String(E.radiativeEffectiveTemperatureMilliK(1000000n,300000n))};
}

const expected=localSeal(37);
const workerSource=`
  const {parentPort}=require('node:worker_threads');
  const fs=require('node:fs'),vm=require('node:vm');
  globalThis.OFU={};
  for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js','src/temporal/p4-temporal.js','src/domains/planetology/p5-canonical.js','src/domains/planetology/p5-environment-v2.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
  const O=globalThis.OFU,P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,E=O.p5EnvironmentV2,masterSeed=Uint8Array.from({length:32},(_,i)=>(i+37)&255),ctx={masterSeed,semanticManifestHash:A.semanticManifestHash()};
  let chosen=null;outer:for(let i=0;i<30000&& !chosen;i++){const g={x:BigInt((i%120)-60),y:BigInt((Math.floor(i/120)%120)-60),z:BigInt(Math.floor(i/14400)-1)};if(A.resolveGalaxy(ctx,g).status!=='PRESENT')continue;const base={galaxyX:g.x,galaxyY:g.y,galaxyZ:g.z};for(let j=0n;j<100000n;j++){const k={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:j%512n,siteY:(j/512n)%512n,siteZ:(j/(512n*512n))%512n},system=A.resolveSystem(ctx,k);if(system.status!=='PRESENT'||system.facts.planetCount===0n)continue;for(let slot=0n;slot<system.facts.planetCount;slot++){const key={...k,orbitSlot:slot},snapshot=A.planetaryInputSnapshot(ctx,key);if(snapshot.status!=='ABSENT'&&snapshot.formation.bulkPriorClass==='TERRESTRIAL'&&snapshot.formation.baselineMassMilliEarth>=1000n&&snapshot.formation.baselineMassMilliEarth<=8000n){chosen={snapshot};break outer}}}}
  if(!chosen)throw new Error('worker could not find bounded terrestrial planet');
  const planet=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot)),topology=P5.createTerrainTopology(planet);parentPort.postMessage({planetId:P.hex(planet.planetId),environmentDigest:P.hex(E.environmentDigest(E.environmentV2Projection(planet,topology))),earth:String(E.radiativeEffectiveTemperatureMilliK(1000000n,300000n))});`;
function run(delay){return new Promise((resolve,reject)=>setTimeout(()=>{const w=new Worker(workerSource,{eval:true});w.once('message',resolve);w.once('error',reject);},delay));}
const results=await Promise.all([run(0),run(7),run(1),run(13)]);for(const r of results)assert.deepEqual(r,expected);assert.equal(expected.earth,'254578');console.log(JSON.stringify({status:'PASS',workers:results.length,scheduling:'STAGGERED',...expected}));
