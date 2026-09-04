import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CONTRACT_ID,SOURCE_RECORD_CONTRACT,PRODUCER_RECORD_CONTRACT,THERMAL_STATE_CONTRACT,
  ENVIRONMENT_PREREQUISITE_CONTRACT,ENVIRONMENT_TRANSITION_CONTRACT,P4_PROTOCOL,
  validateScientificSource,validateStateProducerRecord,validateThermalState,
  surfaceTemperatureFromEffectiveTemperature,thermalSeparationDiagnostic,waterMediumPlausibility,
  escapeDependencyWitness,validateEnvironmentTransitionEnvelope,p6EnvironmentReadinessWitnessV2,
  researchSimulationModeDescriptor
} from '../../research/p5-environment-next-science/environment-next-frontier-v4.mjs';

const golden=JSON.parse(fs.readFileSync(new URL('./golden-frontier-v4.json',import.meta.url),'utf8'));
const source=(overrides={})=>({
  contractId:SOURCE_RECORD_CONTRACT,sourceId:'fixture-source',sourceVersion:'2026-09-04',locator:'research://fixture',retrievedDate:'2026-09-04',
  sourceType:'RESEARCH_FIXTURE',evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED',validityDomain:'test fixture only',assumptions:['explicit fixture'],uncertainty:'not quantified',units:'declared by field',...overrides
});
const externalSource=source({sourceId:'external-dataset-1',locator:'dataset://external-1',sourceType:'EXTERNAL_DATASET',evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',validityDomain:'supplied research world only'});
validateScientificSource(externalSource);

const producer=validateStateProducerRecord({contractId:PRODUCER_RECORD_CONTRACT,disposition:'SOURCE_BOUND_EXTERNAL_STATE',epistemicStatus:'KNOWN',authority:'P5_RESEARCH_SOURCE_BOUND',evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',source:externalSource,provenance:'explicit external volatile inventory',dependencies:['p5.physical']});
assert.throws(()=>validateStateProducerRecord({...producer,disposition:'CANONICAL_INPUT'}),/separate canonical promotion/);

const effective=validateThermalState({contractId:THERMAL_STATE_CONTRACT,kind:'EFFECTIVE_RADIATIVE_TEMPERATURE',epistemicStatus:'DERIVED',authority:'P5_CANONICAL_TIER0_REFERENCE',provenance:'test effective temperature',evidenceClass:'ESTABLISHED',fidelity:'APPROXIMATE',temperatureMilliKLower:250000n,temperatureMilliKUpper:250000n,source:null,dependencies:['p5-radiative-tier0']});
const surface=validateThermalState({contractId:THERMAL_STATE_CONTRACT,kind:'SURFACE_TEMPERATURE',epistemicStatus:'RESEARCH_FIXTURE_ONLY',authority:'P5_RESEARCH_FIXTURE',provenance:'explicit test surface interval',evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED',temperatureMilliKLower:288000n,temperatureMilliKUpper:290000n,source:source(),dependencies:['fixture']});
const inferred=surfaceTemperatureFromEffectiveTemperature(effective);assert.equal(inferred.epistemicStatus,'UNKNOWN');validateThermalState(inferred);
const offset=thermalSeparationDiagnostic({effectiveRadiativeTemperatureState:effective,surfaceTemperatureState:surface});
assert.deepEqual(offset.surfaceMinusEffectiveTemperatureIntervalMilliK,[38000n,40000n]);assert.equal(offset.causalAttribution,'NOT_INFERRED');

const surfacePoint=validateThermalState({...surface,temperatureMilliKLower:288000n,temperatureMilliKUpper:288000n});
const water=waterMediumPlausibility({surfaceTemperatureState:surfacePoint,waterInventory:{h2oCondensedSurfaceTg:1000n,compositionComplete:true},waterSaturationDiagnostic:{epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',regime:'SUPERSATURATED_CONDENSATION_FAVORED',waterPartialPressurePa:2000n,saturationPressurePa:1700n,sourceContract:'ofu-p5-environment-next-research-v2'},totalPressurePa:101325n});
assert.equal(water.phasePlausibility,'LIQUID_WATER_THERMODYNAMICALLY_PERMITTED_GLOBAL_IDEALIZED');assert.equal(water.viableBiologicalMediumEstablished,false);

const prereq=(kind)=>({contractId:ENVIRONMENT_PREREQUISITE_CONTRACT,kind,status:'AVAILABLE',authorityClass:'RESEARCH_FIXTURE',evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED',provenance:'fixture prerequisite',sourceId:'fixture-source'});
const readiness=p6EnvironmentReadinessWitnessV2({volatileProducer:producer,acceptedP4History:true,volatileCompositionComplete:true,surfaceTemperatureState:surfacePoint,viableMediumState:prereq('VIABLE_MEDIUM'),energyState:prereq('USABLE_ENERGY'),nutrientRedoxState:prereq('NUTRIENT_REDOX'),postGenesisAuthority:'RESEARCH_FIXTURE_ONLY'});
assert.equal(readiness.researchPostGenesisEligible,true);assert.equal(readiness.canAuthorizeCanonicalBiology,false);assert.equal(readiness.canonicalPositivePath,false);
const noHistory=p6EnvironmentReadinessWitnessV2({volatileProducer:producer,acceptedP4History:false,volatileCompositionComplete:true,surfaceTemperatureState:surfacePoint,viableMediumState:prereq('VIABLE_MEDIUM'),energyState:prereq('USABLE_ENERGY'),nutrientRedoxState:prereq('NUTRIENT_REDOX'),postGenesisAuthority:'RESEARCH_FIXTURE_ONLY'});assert.equal(noHistory.researchPostGenesisEligible,false);

const escape=escapeDependencyWitness({stellarXuvHistory:null,upperAtmosphereComposition:null,absorptionRadiusModel:null,heatingEfficiencyModel:null,escapeRegimeAssessment:null,p4AcceptedHistory:false});assert.equal(escape.escapeRate,null);assert.equal(escape.missing.length,6);
const d0='0'.repeat(64),d1='1'.repeat(64);const event={contractId:ENVIRONMENT_TRANSITION_CONTRACT,p4Protocol:P4_PROTOCOL,transitionType:'VOLATILE_SOURCE_UPDATE',operationKey:'epoch-1',sourceDigestHex:d1,source:externalSource,changes:[{field:'atmosphere.H2O',beforeDigestHex:d0,afterDigestHex:d1}]};assert.equal(validateEnvironmentTransitionEnvelope(event).retainedP5HistoryEntries,0);assert.throws(()=>validateEnvironmentTransitionEnvelope({...event,changes:[{field:'x',beforeDigestHex:d0,afterDigestHex:d0}]}),/zero-change/);
const mode=researchSimulationModeDescriptor();assert.equal(mode.mode,'RESEARCH_ONLY');assert.equal(mode.planetStateAuthority,'NOT_CANONICAL_PLANET_STATE');

const actual={contractId:CONTRACT_ID,thermalOffsetLowerMilliK:String(offset.surfaceMinusEffectiveTemperatureIntervalMilliK[0]),thermalOffsetUpperMilliK:String(offset.surfaceMinusEffectiveTemperatureIntervalMilliK[1]),waterPhasePlausibility:water.phasePlausibility,waterViableBiologicalMediumEstablished:water.viableBiologicalMediumEstablished,researchPostGenesisEligible:readiness.researchPostGenesisEligible,canonicalPositivePath:readiness.canonicalPositivePath,escapeRate:escape.escapeRate,researchMode:mode.mode};
assert.deepEqual(actual,golden);
console.log('P5 Wave IV frontier tests PASS',actual);
