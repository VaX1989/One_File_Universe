import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';
const O=loadP5Runtime();
vm.runInThisContext(fs.readFileSync('research/rendering/p5-vertical-slice.js','utf8'),{filename:'research/rendering/p5-vertical-slice.js'});
vm.runInThisContext(fs.readFileSync('research/rendering/wave2-bounds-fix.js','utf8'),{filename:'research/rendering/wave2-bounds-fix.js'});
const A=O.p3Astronomy,P5=O.p5Planetology,R=O.renderWave2,ctx=canonicalContext(A);
const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const physical=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot));
assert.equal(physical.status,'SUPPORTED');
const provider=R.createP5Provider(ctx,physical,{elevationScale:120});
assert.equal(provider.authority,'CONSUMER_ONLY');
assert.equal(provider.topologyVersion,'p5-cube-sphere-topology-1');
assert.equal(provider.heightSemantic,'DIMENSIONLESS_STYLIZED_ELEVATION_CODE_I16');
const before=R.canonicalWitness(ctx,chosen.key);
const mesh=R.buildIndexedMesh(provider,{face:'PZ',level:3n,x:2n,y:3n});
assert.equal(mesh.authority,'PRESENTATION_ONLY');
assert.equal(mesh.sourceTopology,'p5-cube-sphere-topology-1');
assert.equal(mesh.canonicalVertexCount,25);
assert.equal(mesh.presentationSkirtVertices,20);
assert.equal(mesh.presentationVertexCount,45);
assert.equal(mesh.triangles,64);
assert.equal(mesh.indices.length,192);
assert.equal(mesh.vertexBytes,45*3*4);
assert.equal(mesh.indexBytes,192*2);
assert.equal(mesh.physicalElevationMeaning,'UNSUPPORTED');
const canonicalIds=mesh.canonicalVertexIds.slice(0,25);
assert.equal(new Set(canonicalIds).size,25);
for(const id of mesh.canonicalVertexIds.slice(25))assert(canonicalIds.includes(id),'skirts must reuse canonical edge samples');
const sameA=provider.getPatch({face:'PZ',level:3n,x:2n,y:3n}),sameB=provider.getPatch({face:'PZ',level:3n,x:3n,y:3n});
const seam=P5.commonSeam(sameA,sameB);assert.equal(seam.commonVertexCount,5n);assert.equal(seam.maxElevationCodeDelta,0n);
const children=provider.refine({face:'PX',level:2n,x:1n,y:2n}).map(k=>provider.getPatch(k));
const projection=P5.projectRefinedChildren(ctx,provider.topology,{face:'PX',level:2n,x:1n,y:2n},children);assert.equal(projection.missingParentVertices,0n);assert.equal(projection.maxParentElevationCodeDelta,0n);
for(const face of P5.CUBE_FACES){const m=R.buildIndexedMesh(provider,{face,level:2n,x:1n,y:1n},{skirts:false});assert.equal(m.canonicalVertexCount,25)}
const audit=P5.auditCubeFaceContinuityAtLevel(ctx,provider.topology,3n);assert.equal(audit.status,'PASS');assert.equal(audit.cornerVertices,8n);
const session=R.createSession(provider,{maxCacheEntries:6,maxActivePatches:4});
let keys=R.boundedPatchPlan({face:'PZ',level:4,x:4,y:6,maxPatches:4});
assert.equal(keys.length,4);
let s=R.activatePlan(session,keys);assert.equal(s.activePatches,4);assert(s.approxGpuBytes>0);assert(s.retainedCacheEntries<=6);
for(let i=0;i<12;i++){keys=R.boundedPatchPlan({face:'PZ',level:4,x:i%16,y:(i*3)%16,maxPatches:4});assert(keys.length<=4);R.activatePlan(session,keys)}
s=R.stats(session);assert(s.retainedCacheEntries<=6);assert(s.cache.evictions>0);assert(s.activePatches<=4);
const overBudget=R.boundedPatchPlan({face:'PZ',level:3,x:2,y:2,maxPatches:5});assert.equal(overBudget.length,5);assert.throws(()=>R.activatePlan(session,overBudget),/active patch budget exceeded/);
const base=10n**25n,world=base+1234567n;assert.equal(R.exactLocalDelta(world,base),1234567);assert.throws(()=>R.exactLocalDelta(base+BigInt(Number.MAX_SAFE_INTEGER)+2n,base),/safe presentation range/);
const split=R.splitBoundedFloat(1234567.125);assert(Math.abs((split[0]+split[1])-1234567.125)<1e-9);
for(const d of [1e9,1e8,1e7,1e6]){const l=R.chooseLevel({radiusM:Number(physical.physical.meanRadiusM),distanceM:d,maxLevel:10});assert(l>=0&&l<=10)}
assert.equal(R.transitionForDistance(6371000,1e9),'SYSTEM_VIEW');assert.equal(R.transitionForDistance(6371000,4e7),'PLANET_APPROACH');assert.equal(R.transitionForDistance(6371000,7e6),'SURFACE_LOCAL');
const paths=[
 [{face:'PZ',level:2,x:1,y:1},{face:'PZ',level:4,x:6,y:6}],
 [{face:'PX',level:3,x:2,y:3},{face:'NY',level:4,x:8,y:4}],
 [{face:'NZ',level:5,x:0,y:31},{face:'PY',level:3,x:7,y:7}]
];
for(const path of paths){for(const p of path){const ks=R.boundedPatchPlan({face:p.face,level:p.level,x:p.x,y:p.y,maxPatches:3});assert(ks.length<=3);R.activatePlan(session,ks)}assert.deepEqual(R.canonicalWitness(ctx,chosen.key),before)}
session.cache.clear();assert.deepEqual(R.canonicalWitness(ctx,chosen.key),before);
for(const cadence of [16.6,16.7,33.3,12.1,55.0,8.0,16.2])R.recordFrame(session,cadence);const f=R.frameStats(session);assert.equal(f.samples,7);assert(f.p95>=f.p50);assert.equal(f.longFrames,1);
const after=R.canonicalWitness(ctx,chosen.key);assert.deepEqual(after,before);
console.log(JSON.stringify({status:'PASS',planetId:provider.planetId,topology:provider.topologyVersion,mesh:{canonicalVertices:mesh.canonicalVertexCount,presentationVertices:mesh.presentationVertexCount,triangles:mesh.triangles,vertexBytes:mesh.vertexBytes,indexBytes:mesh.indexBytes},seam:{commonVertexCount:String(seam.commonVertexCount),maxElevationCodeDelta:String(seam.maxElevationCodeDelta)},cubeAudit:{status:audit.status,corners:String(audit.cornerVertices)},workingSet:s,frameStats:f,precision:{testedAbsoluteMagnitude:'1e25',localDelta:1234567},depthStrategy:'CONVENTIONAL_LOCAL_FRAME',canonicalWitness:after},null,2));
