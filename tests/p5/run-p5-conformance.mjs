import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from './p5-test-helpers.mjs';

const O=loadP5Runtime(),P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,ctx=canonicalContext(A);
const golden=JSON.parse(fs.readFileSync('tests/vectors/golden-p5-corpus-v1.json','utf8'));
assert.equal(P5.VERSION,'p5-planet-physical-1');
assert.equal(P5.SCHEMA_VERSION,1n);
assert.equal(P5.P3_INPUT_CONTRACT,'ofu-p3-p5-planetary-input-v1');
assert.equal(P5.BASELINE_EPOCH,'P4_T0');
assert.equal(golden.contractId,P5.PHYSICAL_CONTRACT);
assert.equal(golden.modelVersion,P5.VERSION);
assert.equal(golden.sourceP3ContractId,P5.P3_INPUT_CONTRACT);
assert.equal(golden.baselineEpoch,P5.BASELINE_EPOCH);
assert.equal(P5.MANIFEST.dependencies.astronomy,'p3-astronomy-1');
assert.equal(P5.MANIFEST.dependencies.temporal,'ofu-p4-temporal-v1');
assert.equal(P.semanticManifestHash(P5.MANIFEST).length,32);

const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const snapshot=chosen.snapshot,adapted=P5.adaptP3PlanetaryInputSnapshot(snapshot);
assert(P5.assertP3BaselinePreserved(snapshot,adapted));
assert.equal(P.hex(snapshot.planetId),P.hex(adapted.planetId));
assert.equal(typeof adapted.upstreamBaseline.orbit.baselineInsolationPpm,'bigint');
const first=P5.realizePhysicalPlanet(ctx,adapted),second=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(A.planetaryInputSnapshot(ctx,chosen.key)));
assert.deepEqual(first,second,'P5 realization must be direct-random-access repeatable');
assert.equal(first.status,'SUPPORTED');
assert.equal(first.upstreamBaseline.formation.baselineMassMilliEarth,snapshot.formation.baselineMassMilliEarth);
assert.equal(first.upstreamBaseline.orbit.baselineInsolationPpm,snapshot.orbit.baselineInsolationPpm);
assert.equal(first.physical.massAuthority,'P3_BASELINE');
assert.equal(first.physical.composition.sumPpm,1000000n);
assert(first.physical.composition.coreMassFractionPermille>=200n&&first.physical.composition.coreMassFractionPermille<=400n);
assert(first.physical.meanRadiusM>0n&&first.physical.surfaceGravityMicroMs2>0n&&first.physical.meanDensityKgM3>0n);
assert.equal(first.temporalBinding.canonicalTimeOwner,'P4');
assert.equal(first.temporalBinding.persistentMutableP5StatePromoted,false);
assert.equal(first.temporalBinding.transitionContract,null);
const digest=P.hex(P5.physicalDigest(first));
assert.equal(P.hex(first.planetId),golden.planetId,'Golden P5 selector identity drift');
assert.equal(String(snapshot.formation.baselineMassMilliEarth),golden.baselineMassMilliEarth,'Golden P5 P3 mass drift');
assert.equal(String(first.physical.composition.coreMassFractionPermille),golden.coreMassFractionPermille,'Golden P5 composition drift');
assert.equal(String(first.physical.meanRadiusM),golden.meanRadiusM,'Golden P5 radius drift');
assert.equal(String(first.physical.surfaceGravityMicroMs2),golden.surfaceGravityMicroMs2,'Golden P5 gravity drift');
assert.equal(String(first.physical.meanDensityKgM3),golden.meanDensityKgM3,'Golden P5 density drift');
assert.equal(digest,golden.physicalDigest,'Golden P5 digest drift');

let maxRelativeError=0;
for(let m=1000n;m<=8000n;m+=500n){
  for(let c=0n;c<=400n;c+=50n){
    const got=P5.rockyRadiusMeters(m,c);assert.equal(got.status,'IN_DOMAIN');
    const expected=(1.07-0.21*Number(c)/1000)*Math.pow(Number(m)/1000,1/3.7)*6371000;
    maxRelativeError=Math.max(maxRelativeError,Math.abs(Number(got.radiusM)-expected)/expected);
  }
}
assert(maxRelativeError<golden.numericOracle.rockyGridMaxRelativeErrorUpperBound,'bounded fixed rocky radius exceeds Golden oracle error bound');
assert.equal(P5.rockyRadiusMeters(999n,300n).status,'OUT_OF_DOMAIN');
assert.equal(P5.rockyRadiusMeters(8001n,300n).status,'OUT_OF_DOMAIN');
assert.equal(P5.rockyRadiusMeters(1000n,401n).status,'OUT_OF_DOMAIN');
const earth=P5.rockyRadiusMeters(1000n,330n);assert.equal(earth.status,'IN_DOMAIN');
const g=P5.gravityMicroMs2(1000n,earth.radiusM),rho=P5.densityKgM3(1000n,earth.radiusM);
assert(g>8000000n&&g<12000000n);assert(rho>4500n&&rho<6500n);

const unsupportedAdapted=Object.freeze({...adapted,upstreamBaseline:Object.freeze({...adapted.upstreamBaseline,formation:Object.freeze({...adapted.upstreamBaseline.formation,bulkPriorClass:'VOLATILE_RICH'})})});
const unsupported=P5.realizePhysicalPlanet(ctx,unsupportedAdapted);assert.equal(unsupported.status,'UNSUPPORTED');assert.equal(unsupported.reason,'BULK_PRIOR');

const topology=P5.createTerrainTopology(first);assert.equal(topology.materializesGlobalHeightmap,false);assert.equal(topology.patchSegments,4n);
const patch=P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:3n,x:2n,y:3n});
assert.equal(patch.vertexCount,25n);assert.equal(patch.materializesGlobalHeightmap,false);
assert.deepEqual(patch,P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:3n,x:2n,y:3n}));
const neighbor=P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:3n,x:3n,y:3n}),seam=P5.commonSeam(patch,neighbor);
assert.equal(seam.commonVertexCount,5n);assert.equal(seam.maxElevationCodeDelta,0n);
for(let level=0n;level<=3n;level++){
  const audit=P5.auditCubeFaceContinuityAtLevel(ctx,topology,level);assert.equal(audit.status,'PASS');assert.equal(audit.unsharedBoundaryVertices,0n);assert.equal(audit.elevationContradictions,0n);assert.equal(audit.cornerVertices,8n);
}
const parent={face:'PX',level:2n,x:1n,y:2n},children=P5.refinePatchKey(parent).map(k=>P5.generateTerrainPatch(ctx,topology,k));
const projected=P5.projectRefinedChildren(ctx,topology,parent,children);assert.equal(projected.missingParentVertices,0n);assert.equal(projected.maxParentElevationCodeDelta,0n);
const reversed=P5.projectRefinedChildren(ctx,topology,parent,[...children].reverse());assert.deepEqual(projected,reversed,'refinement order must not alter projection');
const reconciled=P5.reconcileTerrain(ctx,topology,parent);assert.equal(reconciled.status,'PASS');assert.equal(reconciled.materializedVertexCount,125n);
const keys=[{face:'NX',level:4n,x:3n,y:7n},{face:'PY',level:4n,x:11n,y:1n},{face:'NZ',level:4n,x:0n,y:15n}];
const ordered=keys.map(k=>P.hex(P5.generateTerrainPatch(ctx,topology,k).vertices[0].address));
const reverse=[...keys].reverse().map(k=>P.hex(P5.generateTerrainPatch(ctx,topology,k).vertices[0].address)).reverse();assert.deepEqual(ordered,reverse,'terrain query order changed canonical addresses');

const env=P5.p6EnvironmentalProjection(first,topology);assert.equal(env.contractId,'ofu-p5-p6-environment-v1');assert.equal(env.status,'PARTIAL');assert.equal(env.gravityMicroMs2,first.physical.surfaceGravityMicroMs2);assert.equal(env.pressurePa,null);assert.equal(env.waterVolatileRegime,'UNSUPPORTED');
console.log(JSON.stringify({status:'PASS',contract:P5.PHYSICAL_CONTRACT,model:P5.VERSION,planetId:P.hex(first.planetId),goldenCorpusVersion:golden.corpusVersion,goldenDigest:digest,baselineMassMilliEarth:String(snapshot.formation.baselineMassMilliEarth),coreMassFractionPermille:String(first.physical.composition.coreMassFractionPermille),radiusM:String(first.physical.meanRadiusM),gravityMicroMs2:String(first.physical.surfaceGravityMicroMs2),densityKgM3:String(first.physical.meanDensityKgM3),numeric:{maxRelativeError,goldenUpperBound:golden.numericOracle.rockyGridMaxRelativeErrorUpperBound},terrain:{patchVertices:25,globalHeightmap:false,faceAuditThroughLevel:3,refinementOrderIndependent:true,reconcileMaterializedVertices:125},p6Projection:env.status},null,2));
