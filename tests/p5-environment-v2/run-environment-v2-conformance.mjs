import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';

const O=loadP5Runtime();vm.runInThisContext(fs.readFileSync('src/domains/planetology/p5-environment-v2.js','utf8'),{filename:'src/domains/planetology/p5-environment-v2.js'});
const P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,E=O.p5EnvironmentV2,ctx=canonicalContext(A,0),golden=JSON.parse(fs.readFileSync('tests/vectors/golden-p5-environment-v2-corpus.json','utf8'));
const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const adapted=P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot),planet=P5.realizePhysicalPlanet(ctx,adapted),topology=P5.createTerrainTopology(planet);
assert.equal(P.hex(planet.planetId),golden.canonicalPlanet.planetId);assert.equal(P.hex(P5.physicalDigest(planet)),golden.canonicalPlanet.physicalDigest);
assert.equal(E.CONTRACT_ID,golden.contractId);assert.equal(String(E.SCHEMA_VERSION),golden.contractVersion);assert.equal(E.VERSION,golden.modelVersion);assert.equal(E.ATMOSPHERE_STATE_CONTRACT,golden.atmosphereStateContractId);assert.equal(P.hex(E.semanticManifestHash()),golden.semanticManifestHash);assert.equal(E.GENESIS_POLICY,'NO_CANONICAL_GENESIS');
assert.equal(String(E.planetMassTgAtBaseline(planet)),golden.canonicalPlanet.baselinePlanetMassTg);

const v1Before=P.hex(O.sha256.digest(P.encode(P5.p6EnvironmentalProjection(planet,topology)))),p5Before=P.hex(P5.physicalDigest(planet));
const unknown=E.unknownAtmosphereState(planet),env=E.environmentV2Projection(planet,topology);
assert.equal(unknown.epistemicStatus,'UNKNOWN');assert.equal(env.atmosphere.genesisPolicy,'NO_CANONICAL_GENESIS');assert.equal(env.pressure.epistemicStatus,'UNKNOWN');assert.equal(env.pressure.pressurePa,null);
assert.equal(env.radiativeTier0.effectiveTemperature.epistemicStatus,'UNKNOWN');assert.equal(env.radiativeTier0.surfaceTemperature.epistemicStatus,'UNSUPPORTED');assert.equal(env.radiativeTier0.greenhouseResponse.epistemicStatus,'UNSUPPORTED');assert.equal(env.waterPhase.epistemicStatus,'UNSUPPORTED');assert.equal(env.xuvEvolution.epistemicStatus,'UNSUPPORTED');assert.equal(env.geologicalActivity.epistemicStatus,'UNSUPPORTED');assert.equal(env.oceanAreaFraction.epistemicStatus,'UNSUPPORTED');assert.equal(env.temporal.canonicalTimeOwner,'P4');assert.equal(env.temporal.privateClock,false);
assert.equal(P.hex(P5.physicalDigest(planet)),p5Before);assert.equal(P.hex(O.sha256.digest(P.encode(P5.p6EnvironmentalProjection(planet,topology)))),v1Before);
assert.equal(P5.P6_ENV_CONTRACT,'ofu-p5-p6-environment-v1');assert.equal(env.canonicalV1.contractId,'ofu-p5-p6-environment-v1');

for(const c of golden.pressureCases)assert.equal(String(E.globalSurfaceColumnPressurePa(planet,BigInt(c.atmosphericMassTg))),c.pressurePa,c.name);
for(let i=1;i<golden.pressureCases.length;i++)assert(BigInt(golden.pressureCases[i].pressurePa)>=BigInt(golden.pressureCases[i-1].pressurePa));
assert.equal(E.globalSurfaceColumnPressurePa(planet,0n),0n);
assert.throws(()=>E.globalSurfaceColumnPressurePa(planet,-1n),/u64/);assert.throws(()=>E.globalSurfaceColumnPressurePa(planet,E.planetMassTgAtBaseline(planet)+1n),/exceeds/);

for(const c of golden.radiativeCases)assert.equal(String(E.radiativeEffectiveTemperatureMilliK(BigInt(c.insolationPpm),BigInt(c.bondAlbedoPpm))),c.effectiveTemperatureMilliK,c.name);
assert.equal(E.radiativeEffectiveTemperatureMilliK(1000000n,300000n),254578n);assert.equal(E.radiativeEffectiveTemperatureMilliK(1000000n,1000000n),0n);assert.equal(E.radiativeEffectiveTemperatureMilliK(0n,300000n),0n);
for(const s of [0n,1n,1000n,1000000n,2000000n,1000000000n])assert(E.radiativeEffectiveTemperatureMilliK(s,300000n)<=E.radiativeEffectiveTemperatureMilliK(s*2n,300000n));
for(const a of [0n,100000n,300000n,600000n,900000n])assert(E.radiativeEffectiveTemperatureMilliK(1000000n,a)>=E.radiativeEffectiveTemperatureMilliK(1000000n,a+100000n));
assert.throws(()=>E.radiativeEffectiveTemperatureMilliK(E.P3_INSOLATION_MAX_PPM+1n,0n),/insolation/);assert.throws(()=>E.radiativeEffectiveTemperatureMilliK(1n,1000001n),/albedo/);

const known={contractId:E.ATMOSPHERE_STATE_CONTRACT,version:E.SCHEMA_VERSION,authority:'P5_CANONICAL_STATE',epistemicStatus:'KNOWN',provenance:'TEST_FIXTURE_P4_ACCEPTED_STATE',genesisPolicy:'EXTERNAL_CANONICAL_STATE',unit:E.MASS_UNIT,reference:'ABSOLUTE_MASS_NO_DENOMINATOR',totalVolatileMassTg:10000000000n,atmosphericRetainedMassTg:5000000000n,condensedSurfaceMassTg:2000000000n,subsurfaceInteriorMassTg:3000000000n,lostMassTg:0n};
E.validateConservedAtmosphereState(planet,known);const derived=E.pressureFromAtmosphereState(planet,known);assert.equal(derived.epistemicStatus,'DERIVED');assert.equal(derived.pressurePa,87888n);
assert.throws(()=>E.validateConservedAtmosphereState(planet,{...known,atmosphericRetainedMassTg:5000000001n}),/conservation/);assert.throws(()=>E.validateConservedAtmosphereState(planet,{...known,authority:'P5_RESEARCH_DRAFT'}),/research atmosphere/);

const first=P.hex(E.environmentDigest(E.environmentV2Projection(planet,topology)));for(let i=0;i<20;i++)assert.equal(P.hex(E.environmentDigest(E.environmentV2Projection(planet,topology))),first);
const other=findPlanet(A,ctx,(s,p)=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n&&P.hex(p.id)!==P.hex(planet.planetId));P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(other.snapshot));assert.equal(P.hex(E.environmentDigest(E.environmentV2Projection(planet,topology))),first);
assert.equal(P.hex(E.deriveEnvironmentBytes(ctx,planet.planetId,'lineage-test')),P.hex(E.deriveEnvironmentBytes(ctx,planet.planetId,'lineage-test')));assert.notEqual(P.hex(E.semanticManifestHash()),P.hex(P5.semanticManifestHash()));
console.log(JSON.stringify({status:'PASS',contract:E.CONTRACT_ID,model:E.VERSION,manifestHash:P.hex(E.semanticManifestHash()),environmentDigest:first,earthAnchorMilliK:'254578',volatileGenesis:E.GENESIS_POLICY,p5PhysicalDigest:p5Before,p5V1ProjectionDigest:v1Before},null,2));
