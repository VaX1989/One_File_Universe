import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {loadP5Runtime,canonicalContext,findPlanet} from './p5-test-helpers.mjs';

const O=loadP5Runtime(),A=O.p3Astronomy,P5=O.p5Planetology,ctx=canonicalContext(A);
const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const planet=P5.realizePhysicalPlanet(ctx,chosen.snapshot);assert.equal(planet.status,'SUPPORTED');
const topology=P5.createTerrainTopology(planet);
const radiusIterations=1000,terrainPatches=128;
let checksum=0n;
const r0=performance.now();
for(let i=0;i<radiusIterations;i++){
  const mass=1000n+BigInt((i*7)%7001),cmf=BigInt((i*13)%401),r=P5.rockyRadiusMeters(mass,cmf);assert.equal(r.status,'IN_DOMAIN');checksum^=r.radiusM;
}
const r1=performance.now();
const heap0=process.memoryUsage().heapUsed;
const t0=performance.now();
for(let i=0;i<terrainPatches;i++){
  const x=BigInt(i%64),y=BigInt(Math.floor(i/64)),p=P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:6n,x,y});assert.equal(p.vertexCount,25n);checksum^=p.vertices[0].elevationCode;
}
const t1=performance.now(),heap1=process.memoryUsage().heapUsed;
const reconcile=P5.reconcileTerrain(ctx,topology,{face:'PX',level:5n,x:7n,y:11n});assert.equal(reconcile.status,'PASS');assert.equal(reconcile.materializedVertexCount,125n);
assert.equal(topology.materializesGlobalHeightmap,false);
const evidence={status:'PASS',kind:'P5_NONCANONICAL_PERFORMANCE_OBSERVATION',canonical:false,nodeVersion:process.version,platform:process.platform,arch:process.arch,radiusIterations,radiusElapsedMs:r1-r0,radiusAverageMicros:(r1-r0)*1000/radiusIterations,terrainPatches,terrainElapsedMs:t1-t0,terrainAverageMs:(t1-t0)/terrainPatches,observedHeapDeltaBytes:heap1-heap0,workingSetStructural:{verticesPerPatch:25,reconcileMaximumMaterializedVertices:125,globalPlanetHeightmapMaterialized:false,sequentialProbeRetainedPatches:0},checksum:String(checksum)};
console.log(JSON.stringify(evidence,null,2));
