import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';
import {
  P6_MODEL_VERSION,P6_ADAPTER_VERSION,P6_STATES,P6_IDENTITY_POLICY,P6_SEMANTIC_MANIFEST,
  P5_CANONICAL_ENV_CONTRACT,P5_CANONICAL_AUTHORITY,P5_RESEARCH_AUTHORITY,
  semanticManifestHash,canonicalP5SourceEnvelope,adaptP5EnvironmentV1,evaluateCanonicalMinimum,
  adaptP5ResearchExtensionV02,composeResearchEnvironment,createP2BiosphereBindings,productivityBudget,
  generateBiosphereMacro,materializeMeso,materializeIndividual,assertRefinementInvariant,p4BiologicalReducerResearch
} from '../../research/p6/biosphere-model-v2.mjs';

const O=loadP5Runtime(),P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology,ctx=canonicalContext(A);
const hx=P.hex;
const chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n);
const p3Snapshot=A.planetaryInputSnapshot(ctx,chosen.key);
const p5Adapted=P5.adaptP3PlanetaryInputSnapshot(p3Snapshot);
const planet=P5.realizePhysicalPlanet(ctx,p5Adapted);
const topology=P5.createTerrainTopology(planet);
const projection=P5.p6EnvironmentalProjection(planet,topology);

// REAL executable P3 -> P5 physical -> P5 topology -> P5 projection -> P6 adapter path.
assert.equal(projection.contractId,P5_CANONICAL_ENV_CONTRACT);
assert.equal(projection.version,1n);
assert.equal(projection.status,'PARTIAL');
assert.equal(hx(projection.planetId),hx(p3Snapshot.planetId));
assert.equal(hx(planet.planetId),hx(p3Snapshot.planetId));
const envelope=canonicalP5SourceEnvelope(P5,projection);
assert.equal(envelope.authority,P5_CANONICAL_AUTHORITY);
const canonicalEnv=adaptP5EnvironmentV1(envelope);
assert.equal(canonicalEnv.adapterVersion,P6_ADAPTER_VERSION);
assert.equal(canonicalEnv.state,P6_STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(hx(canonicalEnv.planetId),hx(p3Snapshot.planetId));
assert.equal(canonicalEnv.physical.gravityMicroMs2,planet.physical.surfaceGravityMicroMs2);
assert.equal(canonicalEnv.unsupported.pressurePa,null);
assert.equal(canonicalEnv.unsupported.temperatureEnvelopeK,null);
assert.equal(canonicalEnv.unsupported.waterVolatileRegime,'UNSUPPORTED');
assert.equal(canonicalEnv.unsupported.geologicalActivity,'UNSUPPORTED');
assert.equal(canonicalEnv.provenance.unsupportedPreserved,true);

const minimum=evaluateCanonicalMinimum(canonicalEnv);
assert.equal(minimum.state,P6_STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(minimum.canGenerateBiosphere,false);
assert.equal(minimum.nextState,P6_STATES.RESEARCH_EXTENSION_REQUIRED);
assert.equal(minimum.energySources.PHOTOTROPHIC,'UNSUPPORTED');
assert.equal(minimum.energySources.CHEMOTROPHIC,'UNSUPPORTED');
assert.equal(minimum.physicalConstraints.gravityMicroMs2,planet.physical.surfaceGravityMicroMs2);

// Fail closed: contract/version/authority/topology mismatch.
assert.throws(()=>adaptP5EnvironmentV1({...envelope,authority:'P5_RESEARCH_DRAFT'}),/authority mismatch/);
assert.throws(()=>adaptP5EnvironmentV1({...envelope,projection:{...projection,contractId:'ofu-p5-p6-environment-v99'}}),/unsupported canonical P5->P6 contract/);
assert.throws(()=>adaptP5EnvironmentV1({...envelope,projection:{...projection,version:2n}}),/unsupported canonical P5->P6 version/);
assert.throws(()=>adaptP5EnvironmentV1({...envelope,projection:{...projection,terrain:{...projection.terrain,topologyVersion:'unknown'}}}),/terrain topology mismatch/);
assert.throws(()=>adaptP5EnvironmentV1({...envelope,projection:{...projection,pressurePa:101325n}}),/unsupported scalar fields changed/);
assert.throws(()=>adaptP5EnvironmentV1({...envelope,projection:{...projection,waterVolatileRegime:'LIQUID_OCEAN'}}),/unsupported markers changed/);

// Unsupported P5 planet stays unsupported and does not acquire a biosphere.
const unsupportedProjection={contractId:P5_CANONICAL_ENV_CONTRACT,version:1n,planetId:p3Snapshot.planetId,status:'UNSUPPORTED',reason:'TEST_UNSUPPORTED'};
const unsupported=adaptP5EnvironmentV1(canonicalP5SourceEnvelope(P5,unsupportedProjection));
assert.equal(unsupported.state,P6_STATES.UNSUPPORTED_ENVIRONMENT);
assert.equal(evaluateCanonicalMinimum(unsupported).canGenerateBiosphere,false);

// P6 research semantic manifest is validated and hashed by canonical P2.
const p6ManifestHash=semanticManifestHash(P);
assert.equal(p6ManifestHash.length,32);
assert.deepEqual(P6_SEMANTIC_MANIFEST.dependencies.planetEnvironment,P5_CANONICAL_ENV_CONTRACT);
const canonicalUniverseIdentity=P.universeIdentity(ctx.masterSeed,ctx.semanticManifestHash).digest;
const bindings=createP2BiosphereBindings({p2:P,masterSeed:ctx.masterSeed,p6SemanticManifestHash:p6ManifestHash,canonicalUniverseIdentity});

function researchExtension(overrides={}){
  const base={
    version:'p6-environment-research-v0.2',authority:P5_RESEARCH_AUTHORITY,planetId:p3Snapshot.planetId,
    environmentalEpochRef:'P4_T0_RESEARCH_REFERENCE',spatialRef:{contract:'P5_RESEARCH_SPATIAL_V0',cell:'research-cell-0'},
    energy:{baselineInsolationPpm:Number(p3Snapshot.orbit.baselineInsolationPpm)},
    temperature:{meanK:288,minSeasonalK:250,maxSeasonalK:315,highLatitudeSeasonalityK:45},
    atmosphere:{pressurePa:101325,columnEquivalentPressurePa:101325,pressureInterpretation:'RESEARCH_SURFACE_COLUMN_PROXY',heavyGasRetentionProxy:0.91,xuvEscapeKgS:1200},
    solvent:{surfaceWaterRegime:'LIQUID_SURFACE_CAPABLE',deepWaterRegime:'SHALLOW_TO_MODERATE_RESERVOIR'},
    geology:{activityProxy:0.45,regimeProxy:'EPISODIC_LID_RESEARCH_PROXY'},
    terrain:{oceanFractionPpm:650000,reliefScaleM:5200},radiation:{xuvFractionProxy:0.00001}
  };
  const x=structuredClone(base);
  for(const [k,v] of Object.entries(overrides)){if(v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Uint8Array))x[k]={...x[k],...v};else x[k]=v}
  x.planetId=p3Snapshot.planetId;return adaptP5ResearchExtensionV02(x);
}

const extension=researchExtension();
assert.equal(extension.sourceAuthority,P5_RESEARCH_AUTHORITY);
const researchEnv=composeResearchEnvironment(canonicalEnv,extension);
assert.equal(researchEnv.state,P6_STATES.RESEARCH_ONLY);
assert.equal(hx(researchEnv.planetId),hx(canonicalEnv.planetId));
assert.throws(()=>composeResearchEnvironment(canonicalEnv,{...extension,planetId:P.entityIdentity(canonicalUniverseIdentity,'p3.planet',{other:true})}),/planet identity mismatch/);

// Rich biosphere generation is unavailable from canonical minimum alone.
assert.throws(()=>generateBiosphereMacro(canonicalEnv,bindings),/requires explicit research environment extension/);
const macroA=generateBiosphereMacro(researchEnv,bindings),macroB=generateBiosphereMacro(researchEnv,bindings);
assert.equal(P6_MODEL_VERSION,'p6-biosphere-research-v0.2');
assert.equal(macroA.identityPolicy,P6_IDENTITY_POLICY);
assert.equal(macroA.state,P6_STATES.RESEARCH_ONLY);
assert.deepEqual(macroA,macroB);
assert.equal(hx(macroA.planetId),hx(p3Snapshot.planetId));
assert.equal(macroA.authority.privateClock,false);
assert.equal(macroA.authority.privateEventLog,false);

// Model A identity decision: generator/manifest revision may alter derivation, but not semantic Entity ID.
const changedManifest=structuredClone(P6_SEMANTIC_MANIFEST);changedManifest.generatorSuiteVersion=99n;
const changedHash=P.semanticManifestHash(changedManifest);
const bindingsChanged=createP2BiosphereBindings({p2:P,masterSeed:ctx.masterSeed,p6SemanticManifestHash:changedHash,canonicalUniverseIdentity});
const stableKey={planetId:p3Snapshot.planetId,identityPolicy:P6_IDENTITY_POLICY};
assert.equal(hx(bindings.entity('p6.biosphere',stableKey)),hx(bindingsChanged.entity('p6.biosphere',stableKey)),'Model A requires semantic identity to survive generator revision');
assert.notEqual(bindings.drawU32(p3Snapshot.planetId,'biosphere',0n,'manifest-change-test'),bindingsChanged.drawU32(p3Snapshot.planetId,'biosphere',0n,'manifest-change-test'),'manifest revision should bind derivation semantics');

// Query order / refinement order / unrelated-query independence.
const indexes=Array.from({length:Math.min(4,macroA.commitments.lineageCount)},(_,i)=>i);
const forward=materializeMeso(researchEnv,macroA,bindings,{lineageIndexes:indexes,speciesPerLineage:2});
const reverse=materializeMeso(researchEnv,macroA,bindings,{lineageIndexes:[...indexes].reverse(),speciesPerLineage:2});
const norm=(m)=>m.lineages.map(x=>({i:x.index,id:hx(x.lineageId),medium:x.medium,role:x.trophicRole,thermal:x.thermalRegime})).sort((a,b)=>a.i-b.i);
assert.deepEqual(norm(forward),norm(reverse));
if(forward.species.length){
  const first=forward.species[0],micro=materializeIndividual(researchEnv,macroA,first,bindings,0);
  materializeMeso(researchEnv,macroA,bindings,{lineageIndexes:[indexes.at(-1)],speciesPerLineage:3});
  assert.deepEqual(micro,materializeIndividual(researchEnv,macroA,first,bindings,0));
  assert.equal(assertRefinementInvariant(macroA,forward,micro),true);
  const bad={...forward,species:Object.freeze([Object.freeze({...first,trophicRole:'CONTRADICTORY_ROLE'}),...forward.species.slice(1)])};
  assert.equal(assertRefinementInvariant(macroA,bad),false);
}

// Energy source split: phototrophic research can run; chemotrophic estimate remains extension-dependent.
const baseP=productivityBudget(researchEnv);
assert.equal(baseP.energySources.mode,'PHOTOTROPHIC');
assert.equal(baseP.energySources.CHEMOTROPHIC.status,P6_STATES.RESEARCH_EXTENSION_REQUIRED);
const lowEnergy=composeResearchEnvironment(canonicalEnv,researchExtension({energy:{baselineInsolationPpm:Math.max(1,Math.floor(Number(p3Snapshot.orbit.baselineInsolationPpm)/4))}}));
assert.ok(productivityBudget(lowEnergy).primaryProductivityU<=baseP.primaryProductivityU);
const withChem=composeResearchEnvironment(canonicalEnv,researchExtension({chemistry:{usableChemicalEnergyProxyPpm:100000}}));
const chemP=productivityBudget(withChem);
assert.equal(chemP.energySources.mode,'MIXED');
assert.ok(chemP.primaryProductivityU>=baseP.primaryProductivityU);
for(const level of macroA.trophic)assert.ok(level.energyCeilingU<=macroA.productivity.primaryProductivityU);
const producer=macroA.trophic.find(x=>x.role==='PRIMARY_PRODUCER'),consumer=macroA.trophic.find(x=>x.role==='PRIMARY_CONSUMER'),higher=macroA.trophic.find(x=>x.role==='HIGHER_CONSUMER');
if(consumer)assert.ok(consumer.energyCeilingU<producer.energyCeilingU);if(higher&&consumer)assert.ok(higher.energyCeilingU<consumer.energyCeilingU);

const reducer=p4BiologicalReducerResearch();
assert.equal(reducer.privateClock,false);assert.equal(reducer.privateEventLog,false);assert.equal(reducer.ownsOrdering,false);assert.equal(reducer.ownsReplay,false);assert.equal(reducer.ownsCompaction,false);
assert.equal(reducer.reduce({}, {type:'p6.speciation@1'}).lastAcceptedP4EventType,'p6.speciation@1');

console.log(JSON.stringify({
  status:'PASS',pipeline:'P3_REAL_SNAPSHOT->P5_REALIZATION->P5_TERRAIN->P5_P6_PROJECTION->P6_ADAPTER',
  planetId:hx(p3Snapshot.planetId),canonicalContract:projection.contractId,canonicalStatus:canonicalEnv.state,
  researchStatus:macroA.state,p6ModelVersion:P6_MODEL_VERSION,p6ManifestHash:hx(p6ManifestHash),identityPolicy:P6_IDENTITY_POLICY,
  unsupportedPreserved:true,canonicalMinimumGeneratesBiosphere:false,researchExtensionAuthority:extension.sourceAuthority,
  p4PrivateClock:false,p4PrivateLog:false,refinementInvariant:true
},null,2));
