import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  P6_MODEL_VERSION,P5_ENVIRONMENT_VERSION,adaptP5EnvironmentV02,createP2BiosphereBindings,
  productivityBudget,generateBiosphereMacro,materializeMeso,materializeIndividual,
  assertRefinementInvariant,p4BiologicalTransitionDraft,renderingProjection
} from '../../research/p6/biosphere-model.mjs';

for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js']){
  globalThis.OFU=globalThis.OFU||{};
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
const P=OFU.p2;
const seed=Uint8Array.from({length:32},(_,i)=>(i*17+11)&255);
const manifestHash=Uint8Array.from({length:32},(_,i)=>(255-i*7)&255);
const universeIdentity=P.universeIdentity(seed,manifestHash).digest;
const planetId=P.entityIdentity(universeIdentity,'p3.planet',{fixture:'p6-research-planet'});
const bindings=createP2BiosphereBindings({p2:P,masterSeed:seed,semanticManifestHash:manifestHash,universeIdentity});
const hx=(b)=>P.hex(b);

function env(overrides={}){
  const base={
    version:P5_ENVIRONMENT_VERSION,authority:'P5_RESEARCH_DRAFT',planetId,
    environmentalEpochRef:'P4_T0_RESEARCH_REFERENCE',
    energy:{baselineInsolationPpm:1000000},
    temperature:{meanK:288,minSeasonalK:250,maxSeasonalK:315,highLatitudeSeasonalityK:45},
    atmosphere:{pressurePa:101325,columnEquivalentPressurePa:101325,pressureInterpretation:'SURFACE_COLUMN_PRESSURE_PROXY',heavyGasRetentionProxy:0.91,xuvEscapeKgS:1200},
    solvent:{surfaceWaterRegime:'LIQUID_SURFACE_CAPABLE',deepWaterRegime:'SHALLOW_TO_MODERATE_RESERVOIR'},
    geology:{activityProxy:0.45,regimeProxy:'EPISODIC_LID_PROXY'},
    terrain:{oceanFractionPpm:650000,reliefScaleM:5200},
    radiation:{xuvFractionProxy:0.00001},
    spatialRef:{contract:'P5_SPATIAL_RESEARCH_PLACEHOLDER',cell:'fixture-cell-0'}
  };
  const x=structuredClone(base);
  for(const [k,v] of Object.entries(overrides)){
    if(v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Uint8Array))x[k]={...x[k],...v};else x[k]=v;
  }
  x.planetId=planetId;
  return adaptP5EnvironmentV02(x);
}

const canonicalEnv=env();
const macroA=generateBiosphereMacro(canonicalEnv,bindings);
const macroB=generateBiosphereMacro(canonicalEnv,bindings);
assert.equal(P6_MODEL_VERSION,'p6-biosphere-research-v0.1');
assert.deepEqual(macroA,macroB,'same environment and P2 identity must exactly repeat');
assert.equal(hx(macroA.biosphereId),hx(macroB.biosphereId));
assert.equal(macroA.authority.identity,'P2');
assert.equal(macroA.authority.canonicalTime,'P4_ONLY');
assert.equal(macroA.authority.privateClock,false);

// Query-order independence: resolve lineages in different orders and compare by index.
const forward=materializeMeso(canonicalEnv,macroA,bindings,{lineageIndexes:[0,1,2].filter(i=>i<macroA.commitments.lineageCount),speciesPerLineage:2});
const reverse=materializeMeso(canonicalEnv,macroA,bindings,{lineageIndexes:[2,1,0].filter(i=>i<macroA.commitments.lineageCount),speciesPerLineage:2});
const norm=(m)=>m.lineages.map(x=>({i:x.index,id:hx(x.lineageId),medium:x.medium,role:x.trophicRole})).sort((a,b)=>a.i-b.i);
assert.deepEqual(norm(forward),norm(reverse),'lineage query order must not perturb identity or commitments');

// Unrelated entity queries do not perturb already-derived results.
const first=forward.species[0];
const micro0=materializeIndividual(canonicalEnv,macroA,first,bindings,0);
materializeMeso(canonicalEnv,macroA,bindings,{lineageIndexes:[macroA.commitments.lineageCount-1],speciesPerLineage:3});
const micro0Again=materializeIndividual(canonicalEnv,macroA,first,bindings,0);
assert.deepEqual(micro0,micro0Again,'unrelated materialization must not perturb an organism');
assert.equal(assertRefinementInvariant(macroA,forward,micro0),true,'macro→meso→micro refinement invariant');
assert.ok(micro0.energyDemandU<=first.energyDemandCeilingU,'micro energy demand cannot exceed species ceiling');
assert.equal(micro0.medium,first.medium);
assert.equal(micro0.thermalRegime,macroA.commitments.thermalRegime);

// Energy causal relation: lower available stellar forcing must not increase the bounded productivity proxy.
const lowEnergy=env({energy:{baselineInsolationPpm:250000}});
const lowP=productivityBudget(lowEnergy),baseP=productivityBudget(canonicalEnv);
assert.ok(lowP.primaryProductivityU<=baseP.primaryProductivityU,'lower forcing must not increase primary productivity proxy');
assert.ok(lowP.sustainableBiomassU<=baseP.sustainableBiomassU,'lower forcing must not increase sustainable biomass proxy');

// Solvent causal relation: removing surface liquid water cannot increase the water suitability factor or aquatic availability.
const dry=env({solvent:{surfaceWaterRegime:'TRACE_OR_ABSENT'},terrain:{oceanFractionPpm:0}});
const dryP=productivityBudget(dry);
assert.ok(dryP.factors.waterPpm<=baseP.factors.waterPpm,'harsher water regime must not improve water suitability');
const dryMacro=generateBiosphereMacro(dry,bindings);
assert.equal(dryMacro.commitments.viableMedia.includes('AQUATIC'),false,'dry macro state cannot commit an aquatic niche');

// Trophic energy is bounded by primary productivity and decreases across consumer levels.
const producer=macroA.trophic.find(x=>x.role==='PRIMARY_PRODUCER');
const primaryConsumer=macroA.trophic.find(x=>x.role==='PRIMARY_CONSUMER');
const higherConsumer=macroA.trophic.find(x=>x.role==='HIGHER_CONSUMER');
assert.ok(producer.energyCeilingU<=macroA.productivity.primaryProductivityU);
if(primaryConsumer)assert.ok(primaryConsumer.energyCeilingU<producer.energyCeilingU);
if(higherConsumer&&primaryConsumer)assert.ok(higherConsumer.energyCeilingU<primaryConsumer.energyCeilingU);

// Stronger persistent disturbance proxy should increase or preserve turnover pressure for controlled pairs.
const calm=generateBiosphereMacro(env({geology:{activityProxy:0.1}}),bindings);
const active=generateBiosphereMacro(env({geology:{activityProxy:1.2}}),bindings);
assert.ok(active.evolutionPressure.turnoverPressurePpm>=calm.evolutionPressure.turnoverPressurePpm,'disturbance pressure relation');

// Invalid refinement is detected rather than silently accepted.
const badMeso={...forward,species:Object.freeze([Object.freeze({...first,medium:'IMPOSSIBLE_MEDIUM'}),...forward.species.slice(1)])};
assert.equal(assertRefinementInvariant(macroA,badMeso),false,'contradictory refinement must fail');

// Rendering projection is presentation-only and cannot own biological truth.
const render=renderingProjection(macroA,forward);
assert.equal(render.presentationOnly,true);
assert.equal('camera' in render,false);

// P4 integration draft must not create private time/history authority.
const transition=p4BiologicalTransitionDraft();
assert.equal(transition.requiresProtocol,'ofu-p4-temporal-v1');
assert.equal(transition.privateClock,false);
assert.equal(transition.privateEventLog,false);
assert.ok(transition.eventFamilies.includes('p6.speciation@1'));
assert.ok(transition.eventFamilies.includes('p6.extinction@1'));

// Environmental consumer boundary must fail closed on version/authority changes.
assert.throws(()=>adaptP5EnvironmentV02({...structuredClone({version:'p6-environment-research-v9',authority:'P5_RESEARCH_DRAFT'}),planetId}),/unsupported P5->P6 environmental contract/);

const report={
  status:'PASS',modelVersion:P6_MODEL_VERSION,environmentVersion:P5_ENVIRONMENT_VERSION,
  deterministicBiosphereId:hx(macroA.biosphereId),lineageCount:macroA.commitments.lineageCount,
  nicheCount:macroA.commitments.nicheCount,primaryProductivityU:macroA.productivity.primaryProductivityU,
  lowEnergyPrimaryProductivityU:lowP.primaryProductivityU,maxTrophicLevel:macroA.commitments.maxTrophicLevel,
  refinementInvariant:true,p2IdentityBound:true,p4PrivateClock:false,p5SpatialContractAvailable:canonicalEnv.authority.spatialContractAvailable
};
console.log(JSON.stringify(report,null,2));
