import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 CONTRACT_ID,SPECIES_STATE_CONTRACT,SPECIES_REGISTRY_ID,SPECIES_REGISTRY,AUTHORITY,STATE_ORIGIN_CLASSES,
 GAS_MIXING_ASSUMPTION,speciesDefinition,validateVolatileSpeciesState,globalSurfaceColumnPressurePa,
 atmosphereGasComposition,waterInventory,iapwsIf97SaturationPressurePa,waterVaporSaturationAssessment,
 surfaceTemperatureAssessment,xuvEscapeAssessment,geochemicalEnergyAssessment
} from '../../research/p5-environment-next-science/environment-next-research.mjs';

const golden=JSON.parse(readFileSync(new URL('./golden-research-v2.json',import.meta.url),'utf8'));
const r=(totalTg,atmosphereTg,condensedSurfaceTg=0n,subsurfaceInteriorTg=0n,lostTg=0n)=>({totalTg,atmosphereTg,condensedSurfaceTg,subsurfaceInteriorTg,lostTg});
const origin={class:'RESEARCH_FIXTURE',sourceId:'golden-research-v2',sourceRevision:'1'};
const complete={contractId:SPECIES_STATE_CONTRACT,authority:AUTHORITY,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',origin,provenance:'P5_RESEARCH_FIXTURE_ONLY',compositionCompleteness:'COMPLETE',species:[
 {speciesId:'H2O',...r(1000000n,1000000n)},
 {speciesId:'N2',...r(9000000n,9000000n)}
],unresolved:r(0n,0n)};

assert.equal(CONTRACT_ID,golden.contractId);
assert.equal(SPECIES_REGISTRY_ID,golden.registry.registryId);
assert.equal(SPECIES_REGISTRY.length,golden.registry.species.length);
assert.deepEqual(SPECIES_REGISTRY.map(x=>({
 speciesId:x.speciesId,formula:x.formula,molarMassNanoKgPerMol:x.molarMassNanoKgPerMol.toString(),casRegistryNumber:x.casRegistryNumber
})),golden.registry.species);
assert.ok(STATE_ORIGIN_CLASSES.includes('AUTHORITATIVE_EXTERNAL_STATE'));
assert.equal(speciesDefinition('H2O').molarMassNanoKgPerMol,18015300n);
assert.equal(speciesDefinition('CO2').molarMassNanoKgPerMol,44009500n);

const v=validateVolatileSpeciesState(complete);
assert.equal(v.aggregate.totalTg,10000000n);
assert.equal(v.aggregate.atmosphereTg,10000000n);
assert.equal(v.epistemicStatus,'HYPOTHETICAL_MODEL_VALUE');
assert.equal(v.registryId,SPECIES_REGISTRY_ID);
assert.throws(()=>validateVolatileSpeciesState({...complete,species:[{...complete.species[0],lostTg:1n},complete.species[1]]}),/conservation/);
assert.throws(()=>validateVolatileSpeciesState({...complete,species:[{...complete.species[0],molarMassNanoKgPerMol:18015280n},complete.species[1]]}),/unsupported field molarMassNanoKgPerMol/);
assert.throws(()=>validateVolatileSpeciesState({...complete,species:[{speciesId:'Xe',...r(1n,1n)}]}),/not in bounded research registry/);
assert.throws(()=>validateVolatileSpeciesState({...complete,species:[complete.species[1],complete.species[0]]}),/strictly sorted/);
assert.throws(()=>validateVolatileSpeciesState({...complete,epistemicStatus:'KNOWN'}),/KNOWN state requires AUTHORITATIVE_EXTERNAL_STATE/);
assert.throws(()=>validateVolatileSpeciesState({...complete,compositionCompleteness:'PARTIAL'}),/non-zero unresolved mass/);

for(const p of golden.pressureVectors)assert.equal(
 globalSurfaceColumnPressurePa(BigInt(p.gravityMicroMs2),BigInt(p.meanRadiusM),BigInt(p.atmosphericMassTg)),
 BigInt(p.expectedPressurePa)
);
const gas=atmosphereGasComposition(complete,9800000n,6371000n,GAS_MIXING_ASSUMPTION);
assert.equal(gas.epistemicStatus,'HYPOTHETICAL_MODEL_VALUE');
assert.equal(gas.totalPressurePa,192n);
assert.deepEqual(gas.components.map(x=>[x.speciesId,x.molarMassNanoKgPerMol,x.moleFractionPpm,x.partialPressurePa]),[
 ['H2O',18015300n,147322n,28n],['N2',28013400n,852678n,164n]
]);

assert.equal(waterInventory(complete).epistemicStatus,'HYPOTHETICAL_MODEL_VALUE');
assert.equal(waterInventory(complete).quantitySemantics,'EXACT_WITHIN_SUPPLIED_STATE');
const partial={...complete,compositionCompleteness:'PARTIAL',unresolved:r(10n,10n)};
assert.equal(atmosphereGasComposition(partial,9800000n,6371000n,GAS_MIXING_ASSUMPTION).epistemicStatus,'UNKNOWN');
assert.equal(waterInventory(partial).quantitySemantics,'LOWER_BOUND_ONLY');

for(const s of golden.saturationVectors)assert.equal(iapwsIf97SaturationPressurePa(BigInt(s.temperatureMilliK)),BigInt(s.expectedSaturationPressurePa));
assert.throws(()=>iapwsIf97SaturationPressurePa(273159n),/domain/);
assert.equal(waterVaporSaturationAssessment({state:complete,gravityMicroMs2:9800000n,meanRadiusM:6371000n,mixingAssumption:GAS_MIXING_ASSUMPTION}).regime,'SURFACE_TEMPERATURE_NOT_ESTABLISHED');
assert.throws(()=>waterVaporSaturationAssessment({state:complete,gravityMicroMs2:9800000n,meanRadiusM:6371000n,surfaceTemperatureMilliK:300000n,mixingAssumption:GAS_MIXING_ASSUMPTION}),/unsupported field surfaceTemperatureMilliK/);

const hypotheticalTemp={milliK:300000n,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',authority:'P5_RESEARCH_DRAFT',provenance:'fixture'};
const sat=waterVaporSaturationAssessment({state:complete,gravityMicroMs2:9800000n,meanRadiusM:6371000n,surfaceTemperatureState:hypotheticalTemp,mixingAssumption:GAS_MIXING_ASSUMPTION});
assert.equal(sat.regime,'SUBSATURATED_VAPOR');
assert.equal(sat.epistemicStatus,'HYPOTHETICAL_MODEL_VALUE');

const known={...complete,epistemicStatus:'KNOWN',origin:{class:'AUTHORITATIVE_EXTERNAL_STATE',sourceId:'external-state',sourceRevision:'1'}};
assert.equal(atmosphereGasComposition(known,9800000n,6371000n,GAS_MIXING_ASSUMPTION).epistemicStatus,'DERIVED');
const knownTemp={milliK:300000n,epistemicStatus:'KNOWN',authority:'EXTERNAL_STATE',provenance:'fixture'};
assert.equal(waterVaporSaturationAssessment({state:known,gravityMicroMs2:9800000n,meanRadiusM:6371000n,surfaceTemperatureState:knownTemp,mixingAssumption:GAS_MIXING_ASSUMPTION}).epistemicStatus,'DERIVED');

assert.equal(surfaceTemperatureAssessment().epistemicStatus,'UNSUPPORTED');
assert.equal(xuvEscapeAssessment({}).epistemicStatus,'UNSUPPORTED');
assert.ok(xuvEscapeAssessment({}).missing.includes('stellarRotationHistory'));
assert.equal(geochemicalEnergyAssessment().epistemicStatus,'UNSUPPORTED');
console.log('P5 environment-next research v2 tests: PASS');
