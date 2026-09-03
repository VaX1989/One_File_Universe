import assert from 'node:assert/strict';
import {
 SPECIES_STATE_CONTRACT,AUTHORITY,GAS_MIXING_ASSUMPTION,validateVolatileSpeciesState,
 globalSurfaceColumnPressurePa,atmosphereGasComposition,waterInventory,
 iapwsIf97SaturationPressurePa,waterVaporSaturationAssessment,surfaceTemperatureAssessment,
 xuvEscapeAssessment,geochemicalEnergyAssessment
} from '../../research/p5-environment-next-science/environment-next-research.mjs';
const r=(totalTg,atmosphereTg,condensedSurfaceTg=0n,subsurfaceInteriorTg=0n,lostTg=0n)=>({totalTg,atmosphereTg,condensedSurfaceTg,subsurfaceInteriorTg,lostTg});
const complete={contractId:SPECIES_STATE_CONTRACT,authority:AUTHORITY,provenance:'P5_RESEARCH_FIXTURE_ONLY',compositionCompleteness:'COMPLETE',species:[
 {speciesId:'H2O',molarMassNanoKgPerMol:18015280n,...r(1000000n,1000000n)},
 {speciesId:'N2',molarMassNanoKgPerMol:28013400n,...r(9000000n,9000000n)}
],unresolved:r(0n,0n)};
const v=validateVolatileSpeciesState(complete);assert.equal(v.aggregate.totalTg,10000000n);assert.equal(v.aggregate.atmosphereTg,10000000n);
assert.throws(()=>validateVolatileSpeciesState({...complete,species:[{...complete.species[0],lostTg:1n},complete.species[1]]}),/conservation/);
assert.equal(globalSurfaceColumnPressurePa(9806650n,6371000n,5148000000n),98977n);
const gas=atmosphereGasComposition(complete,9800000n,6371000n,GAS_MIXING_ASSUMPTION);assert.equal(gas.totalPressurePa,192n);assert.deepEqual(gas.components.map(x=>[x.speciesId,x.moleFractionPpm,x.partialPressurePa]),[['H2O',147322n,28n],['N2',852678n,164n]]);
assert.equal(waterInventory(complete).epistemicStatus,'KNOWN');
const partial={...complete,compositionCompleteness:'PARTIAL',unresolved:r(10n,10n)};assert.equal(atmosphereGasComposition(partial,9800000n,6371000n,GAS_MIXING_ASSUMPTION).epistemicStatus,'UNKNOWN');assert.equal(waterInventory(partial).epistemicStatus,'LOWER_BOUND_ONLY');
for(const [t,p] of [[273160n,612n],[300000n,3537n],[373150n,101418n],[500000n,2638898n],[647096n,22064000n]])assert.equal(iapwsIf97SaturationPressurePa(t),p);
assert.throws(()=>iapwsIf97SaturationPressurePa(273159n),/domain/);
assert.equal(waterVaporSaturationAssessment({state:complete,gravityMicroMs2:9800000n,meanRadiusM:6371000n,mixingAssumption:GAS_MIXING_ASSUMPTION}).regime,'SURFACE_TEMPERATURE_NOT_ESTABLISHED');
assert.equal(waterVaporSaturationAssessment({state:complete,gravityMicroMs2:9800000n,meanRadiusM:6371000n,surfaceTemperatureMilliK:300000n,mixingAssumption:GAS_MIXING_ASSUMPTION}).regime,'SUBSATURATED_VAPOR');
assert.equal(surfaceTemperatureAssessment().epistemicStatus,'UNSUPPORTED');
assert.equal(xuvEscapeAssessment({}).epistemicStatus,'UNSUPPORTED');assert.ok(xuvEscapeAssessment({}).missing.includes('stellarRotationHistory'));
assert.equal(geochemicalEnergyAssessment().epistemicStatus,'UNSUPPORTED');
console.log('P5 environment-next research tests: PASS');
