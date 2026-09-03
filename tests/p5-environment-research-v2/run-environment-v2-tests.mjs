import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';
import {constants,evidence,volatileInventoryHypothesis,surfaceColumnPressurePa,radiativeEquilibriumEnvelope,classifyWaterSurfaceRegime,researchEnvironmentV2,applyAtmosphereLossTransition} from '../../research/p5-environment-v2/environment-research-v2.mjs';

const O=loadP5Runtime(),P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,ctx=canonicalContext(A,41);
assert.equal(constants.CONTRACT_ID,'ofu-p5-p6-environment-research-v2');
assert.equal(constants.AUTHORITY,'P5_RESEARCH_DRAFT');
assert.equal(P5.VERSION,'p5-planet-physical-1');

const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const adapted=P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot);
const planet=P5.realizePhysicalPlanet(ctx,adapted);
const topology=P5.createTerrainTopology(planet);
const before=P.hex(P5.physicalDigest(planet));
const env=researchEnvironmentV2(P,P5,ctx,planet,topology,{face:'PZ',level:3n,x:2n,y:3n});
const after=P.hex(P5.physicalDigest(P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(A.planetaryInputSnapshot(ctx,chosen.key)))));
assert.equal(before,after,'research environment must not mutate frozen P5 v1 realization');
assert.equal(env.canonicalBase.contractId,'ofu-p5-p6-environment-v1');
assert.equal(env.authority,'P5_RESEARCH_DRAFT');
assert.equal(env.spatial.topologyVersion,'p5-cube-sphere-topology-1');
assert.equal(env.temporal.canonicalTimeOwner,'P4');
assert.equal(env.temporal.privateClock,false);
assert.equal(env.research.oceanAreaFraction,'UNSUPPORTED');
assert.equal(env.research.geochemicalEnergyAvailability,'UNSUPPORTED');

const inv=volatileInventoryHypothesis(P,P5,ctx,planet);
assert.equal(inv.totalMassPpb,inv.conservationPpb);
assert.equal(inv.totalMassPpb,inv.atmosphericRetainedMassPpb+inv.condensedSurfaceMassPpb+inv.subsurfaceInteriorMassPpb+inv.lostMassPpb);
assert.deepEqual(inv,volatileInventoryHypothesis(P,P5,ctx,planet),'query repeatability');
assert.equal(surfaceColumnPressurePa(planet,0n),0n,'zero atmosphere must have zero pressure');
const p1=surfaceColumnPressurePa(planet,100000n),p2=surfaceColumnPressurePa(planet,200000n);
assert(p1>0n&&p2>=p1,'more atmosphere at fixed planet cannot reduce column pressure');
assert.equal(env.research.pressure.pressurePa,surfaceColumnPressurePa(planet,inv.atmosphericRetainedMassPpb));

const thermal=radiativeEquilibriumEnvelope(planet);
assert(thermal.effectiveTemperatureK[1]>=thermal.effectiveTemperatureK[0]);
assert.equal(thermal.surfaceTemperatureK,null);
assert.equal(thermal.greenhouseResponse,'UNSUPPORTED');
assert.equal(thermal.numericAuthority,'FLOATING_SCIENTIFIC_REFERENCE_ONLY');

assert.equal(classifyWaterSurfaceRegime({temperatureK:300,pressurePa:100000,waterMassPpb:0n}).regime,'TRACE_OR_ABSENT');
assert.equal(classifyWaterSurfaceRegime({temperatureK:700,pressurePa:30000000,waterMassPpb:1000n}).regime,'SUPERCRITICAL_CAPABLE');
assert.equal(classifyWaterSurfaceRegime({temperatureK:700,pressurePa:100000,waterMassPpb:1000n}).regime,'HOT_STEAM_VAPOR');
assert.equal(classifyWaterSurfaceRegime({temperatureK:250,pressurePa:100,waterMassPpb:1000n}).regime,'LOW_PRESSURE_ICE_OR_VAPOR');
assert.equal(classifyWaterSurfaceRegime({temperatureK:250,pressurePa:100000,waterMassPpb:1000n}).regime,'SURFACE_ICE_CAPABLE');

const loss=inv.atmosphericRetainedMassPpb>0n?inv.atmosphericRetainedMassPpb/2n:0n;
const next=applyAtmosphereLossTransition(inv,{acceptedByP4:true,timeKey:'P4_TEST_T1',lostMassPpb:loss});
assert.equal(next.atmosphericRetainedMassPpb+next.condensedSurfaceMassPpb+next.subsurfaceInteriorMassPpb+next.lostMassPpb,inv.totalMassPpb,'transition may not create/destroy volatile inventory');
assert.equal(next.p4TimeKey,'P4_TEST_T1');
assert.throws(()=>applyAtmosphereLossTransition(inv,{acceptedByP4:false,timeKey:'T',lostMassPpb:1n}));

const keys=[{face:'NX',level:4n,x:3n,y:7n},{face:'PY',level:4n,x:11n,y:1n},{face:'NZ',level:4n,x:0n,y:15n}];
const forward=keys.map(k=>researchEnvironmentV2(P,P5,ctx,planet,topology,k).research.pressure.pressurePa);
const reverse=[...keys].reverse().map(k=>researchEnvironmentV2(P,P5,ctx,planet,topology,k).research.pressure.pressurePa).reverse();
assert.deepEqual(forward,reverse,'query order must not alter planetary environment realization');
assert.equal(evidence.hydrostaticColumnPressure.evidenceClass,'ESTABLISHED');
assert.equal(evidence.volatileInventoryHypothesis.evidenceClass,'HYPOTHETICAL');
console.log(JSON.stringify({status:'PASS',contractId:constants.CONTRACT_ID,canonicalP5Preserved:before===after,pressurePa:String(env.research.pressure.pressurePa),temperatureEnvelopeK:thermal.effectiveTemperatureK,waterRegime:env.research.water.regime,xuvStatus:env.research.xuvEscape.status}));
