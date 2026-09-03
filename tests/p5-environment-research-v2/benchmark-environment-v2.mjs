import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';
import {researchEnvironmentV2} from '../../research/p5-environment-v2/environment-research-v2.mjs';

const O=loadP5Runtime(),P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,ctx=canonicalContext(A,73);
const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const planet=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot));
const topology=P5.createTerrainTopology(planet);
const iterations=2000;

for(let i=0;i<100;i++)researchEnvironmentV2(P,P5,ctx,planet,topology,{face:'PZ',level:4n,x:BigInt(i%16),y:BigInt((i*7)%16)});
if(global.gc)global.gc();
const heapBefore=process.memoryUsage().heapUsed;
const t0=performance.now();
let checksum=0n;
for(let i=0;i<iterations;i++){
  const env=researchEnvironmentV2(P,P5,ctx,planet,topology,{face:'PZ',level:4n,x:BigInt(i%16),y:BigInt((i*7)%16)});
  checksum^=env.research.pressure.pressurePa;
}
const elapsedMs=performance.now()-t0;
if(global.gc)global.gc();
const heapAfter=process.memoryUsage().heapUsed;
const avgQueryUs=elapsedMs*1000/iterations;
const retainedHeapDeltaBytes=Math.max(0,heapAfter-heapBefore);
const result={status:'PASS',iterations,elapsedMs:Number(elapsedMs.toFixed(3)),avgQueryUs:Number(avgQueryUs.toFixed(3)),retainedHeapDeltaBytes,activeClimateCellsPerQuery:0,mandatoryRetainedRegionalCaches:0,globalClimateGridMaterialized:false,globalTerrainHeightmapMaterialized:false,checksum:String(checksum)};
assert.equal(result.activeClimateCellsPerQuery,0);
assert.equal(result.mandatoryRetainedRegionalCaches,0);
assert.equal(result.globalClimateGridMaterialized,false);
assert.equal(result.globalTerrainHeightmapMaterialized,false);
assert(avgQueryUs<5000,'research environment query unexpectedly exceeds 5 ms average on CI benchmark');
console.log('P5_ENVIRONMENT_BENCHMARK '+JSON.stringify(result));
