import assert from 'node:assert/strict';
import * as B from '../../research/wave-v-biology-evolution/biology-frontier-v5.mjs';

const p5Ready = Object.freeze({
  contractId: B.P5_READINESS_CONTRACT,
  researchPostGenesisEligible: true,
  canAuthorizeCanonicalBiology: false,
  canonicalGenesisAvailable: false,
  canonicalPositivePath: false,
  abiogenesisStatus: 'NO_CANONICAL_GENESIS_MODEL',
  environmentEpochKey: 'fixture-epoch-1'
});

const eligibility = B.positiveLifeEligibility({
  p5Readiness: p5Ready,
  viableMediumEstablished: true,
  usableEnergyEstablished: true,
  nutrientAvailabilityEstablished: true,
  redoxGradientEstablished: true,
  seedAuthority: 'RESEARCH_FIXTURE_ONLY',
  canonicalGenesisClaim: false
});
assert.equal(eligibility.state, 'RESEARCH_POST_GENESIS_ELIGIBLE');
assert.equal(eligibility.canonicalBiologyAuthority, false);
assert.equal(eligibility.abiogenesisInferred, false);
assert.equal(eligibility.abiogenesisProbability, null);
assert.throws(() => B.positiveLifeEligibility({
  p5Readiness: p5Ready,
  viableMediumEstablished: true,
  usableEnergyEstablished: true,
  nutrientAvailabilityEstablished: true,
  redoxGradientEstablished: true,
  seedAuthority: 'RESEARCH_FIXTURE_ONLY',
  canonicalGenesisClaim: true
}), /cannot claim canonical genesis/);

const energy = B.energyBudget({
  sources: [
    {sourceId:'photo', energyClass:'PHOTOTROPHIC', availableLowerU:1000n, availableUpperU:1200n, captureEfficiencyLowerPpm:200000n, captureEfficiencyUpperPpm:300000n, statusCategory:'EARTH_EMPIRICAL'},
    {sourceId:'chem', energyClass:'CHEMOTROPHIC', availableLowerU:500n, availableUpperU:700n, captureEfficiencyLowerPpm:100000n, captureEfficiencyUpperPpm:200000n, statusCategory:'EARTH_EMPIRICAL'}
  ],
  maintenanceFractionLowerPpm:100000n,
  maintenanceFractionUpperPpm:200000n
});
assert.deepEqual(energy.capturedEnergyIntervalU, [250n, 500n]);
assert.deepEqual(energy.maintenanceIntervalU, [25n, 100n]);
assert.deepEqual(energy.allocatableEnergyIntervalU, [200n, 450n]);
assert.equal(energy.biomassConversion, 'NOT_INFERRED');
assert.equal(energy.silentEfficienciesUsed, false);

const network = B.validateEcologicalNetwork({
  populations: [
    {populationId:'producer', lineageId:'L1', allocatableEnergyUpperU:450n},
    {populationId:'consumer', lineageId:'L2', allocatableEnergyUpperU:100n}
  ],
  interactions: [
    {interactionId:'e1', type:'TROPHIC', fromPopulationId:'producer', toPopulationId:'consumer', energyDemandLowerU:50n, energyDemandUpperU:100n, statusCategory:'EARTH_EMPIRICAL'},
    {interactionId:'e2', type:'COMPETITION', fromPopulationId:'producer', toPopulationId:'consumer', energyDemandLowerU:null, energyDemandUpperU:null, statusCategory:'EARTH_EMPIRICAL'}
  ]
});
assert.equal(network.energyOversubscription, false);
assert.equal(network.stabilityInferred, false);
assert.equal(network.networkMetricCausalAuthority, false);
assert.throws(() => B.validateEcologicalNetwork({
  populations: [
    {populationId:'p', lineageId:'L1', allocatableEnergyUpperU:10n},
    {populationId:'q', lineageId:'L2', allocatableEnergyUpperU:10n}
  ],
  interactions: [{interactionId:'x', type:'TROPHIC', fromPopulationId:'p', toPopulationId:'q', energyDemandLowerU:11n, energyDemandUpperU:11n, statusCategory:'EARTH_EMPIRICAL'}]
}), /trophic demand exceeds/);

const stages = B.stageStructuredStep({
  birthStageId:'juvenile',
  stages:[
    {stageId:'juvenile', countU:100n, mortalityPpm:100000n, externalBirthsU:0n, transitions:[{toStageId:'adult', probabilityPpm:400000n}]},
    {stageId:'adult', countU:50n, mortalityPpm:100000n, externalBirthsU:20n, transitions:[]}
  ]
});
assert.equal(stages.totalBeforeU, 150n);
assert.equal(stages.totalDeathsU, 15n);
assert.equal(stages.totalBirthsU, 20n);
assert.equal(stages.totalAfterU, 155n);
assert.deepEqual(stages.stageCounts, [{stageId:'juvenile', countU:70n}, {stageId:'adult', countU:85n}]);
assert.equal(stages.endogenousGrowthLaw, 'NONE');

const lifeModel = {
  modelId:'fixture-cycle',
  stages:['PROPAGULE','GROWTH','REPRODUCTIVE'],
  transitions:[
    {transitionId:'germinate', fromStageId:'PROPAGULE', toStageId:'GROWTH', triggerClass:'EXPLICIT_ENVIRONMENT_WITNESS'},
    {transitionId:'mature', fromStageId:'GROWTH', toStageId:'REPRODUCTIVE', triggerClass:'EXPLICIT_DEVELOPMENT_WITNESS'}
  ]
};
const lifeTransition = B.lifecycleTransition({model:lifeModel, currentStageId:'GROWTH', transitionId:'mature', p4OperationKey:'op:mature:1'});
assert.equal(lifeTransition.toStageId, 'REPRODUCTIVE');
assert.equal(lifeTransition.mutableTruthOwner, 'P4');
assert.equal(lifeTransition.privateBiologyHistoryEntries, 0n);

const evo = B.evolutionTransitionWitness({
  lineageId:'L1',
  mechanisms:[
    {mechanism:'MUTATION', statusCategory:'EARTH_EMPIRICAL', sourceId:'source-genetics', witness:'bounded synthetic mutation fixture'},
    {mechanism:'SELECTION', statusCategory:'EARTH_EMPIRICAL', sourceId:'source-selection', witness:'explicit model-conditional selection fixture'}
  ],
  proposedTraitChanges:[{traitId:'trait-a', beforeI:500n, afterI:520n, unit:'MODEL_U', statusCategory:'GENERATIVE_FICTIONAL'}],
  p4OperationKey:'op:evo:1'
});
assert.equal(evo.mayProposeP4Transition, true);
assert.equal(evo.automaticallyAccepted, false);
assert.equal(evo.microToMacroPrediction, false);

const spec = B.speciationWitness({
  parentLineageId:'L1', childLineageId:'L2', criterionId:'fixture-criterion', criterionSatisfied:true,
  criterionStatusCategory:'GENERATIVE_FICTIONAL', evidenceWitness:'synthetic conformance only', p4OperationKey:'op:spec:1'
});
assert.equal(spec.mayProposeSpeciationEvent, true);
assert.equal(spec.universalSpeciesThresholdUsed, false);
assert.equal(spec.taxonomicTruthEstablished, false);

const extant = B.extinctionWitness({lineageId:'L2', populationCountU:5n, causeWitnesses:[], p4OperationKey:'op:ext:0'});
assert.equal(extant.mayProposeExtinctionEvent, false);
const extinct = B.extinctionWitness({lineageId:'L2', populationCountU:0n, causeWitnesses:[], p4OperationKey:'op:ext:1'});
assert.equal(extinct.demographicExtinctionEstablished, true);
assert.equal(extinct.predictiveExtinctionProbability, null);

const morph = B.morphologyConstraintWitness({
  lineageId:'L1',
  environmentTags:['AQUEOUS','LOW_LIGHT'],
  ecologicalRoleTags:['PRIMARY_PRODUCER','SUSPENDED'],
  lifecycleStageId:'GROWTH',
  traitEnvelopes:[{traitId:'body-scale', lowerI:10n, upperI:100n, unit:'MODEL_U', statusCategory:'GENERATIVE_FICTIONAL'}],
  candidate:{candidateId:'organism-template-1', requiredEnvironmentTags:['AQUEOUS'], requiredEcologicalRoleTags:['PRIMARY_PRODUCER'], traits:[{traitId:'body-scale', valueI:50n, unit:'MODEL_U'}], bodyParts:null}
});
assert.equal(morph.constraintSatisfied, true);
assert.equal(morph.geometryPrescription, false);
assert.equal(morph.arbitraryBodyPartGenerationAllowed, false);
assert.throws(() => B.morphologyConstraintWitness({
  lineageId:'L1', environmentTags:['AQUEOUS'], ecologicalRoleTags:['PRIMARY_PRODUCER'], lifecycleStageId:'GROWTH',
  traitEnvelopes:[], candidate:{candidateId:'bad', requiredEnvironmentTags:[], requiredEcologicalRoleTags:[], traits:[], bodyParts:['random-fin']}
}), /body-part roulette is forbidden/);

const immediate = [
  {sampleKey:'sample:1', populationId:'producer', lineageId:'L1', persistent:false, individualIdentityPromoted:false}
];
const mat = B.materializationWitness({
  level:'IMMEDIATE', biosphereId:'B1', ecosystemIds:['E1'], populationIds:['producer'], lineageIds:['L1'], immediateOrganisms:immediate, environmentEpochKey:'fixture-epoch-1'
});
assert.equal(mat.lowerLevelMaterializationCreatesTruth, false);
assert.equal(mat.individualIdentityPromoted, false);
const rec = B.reconcileHierarchy({coarsePopulationId:'producer', coarseLineageId:'L1', coarsePopulationCountU:1000n, materializedOrganisms:immediate});
assert.equal(rec.reconciled, true);
assert.equal(rec.coarseCountMutated, false);
assert.equal(rec.abundanceInferredFromSample, false);
assert.throws(() => B.materializationWitness({
  level:'WARM', biosphereId:'B1', ecosystemIds:['E1'], populationIds:['producer'], lineageIds:['L1'], immediateOrganisms:[], environmentEpochKey:'fixture-epoch-1'
}), /WARM materialization may not instantiate lineage detail/);

const claim = B.validateClaim({
  claimId:'claim-fixture', statusCategory:'SPECULATIVE_EXOBIOLOGY', fidelity:'STYLIZED',
  statement:'Synthetic extraterrestrial organism morphology is exploratory only.',
  validityDomain:'conformance fixtures', sourceIds:['source-a'], uncertainty:'No empirical extraterrestrial biology exists.'
});
assert.equal(claim.statusCategory, 'SPECULATIVE_EXOBIOLOGY');

const golden = {
  contractId:B.CONTRACT_ID,
  modelId:B.MODEL_ID,
  eligibilityState:eligibility.state,
  canonicalBiologyAuthority:eligibility.canonicalBiologyAuthority,
  capturedEnergyIntervalU:energy.capturedEnergyIntervalU.map(String),
  allocatableEnergyIntervalU:energy.allocatableEnergyIntervalU.map(String),
  stageCounts:stages.stageCounts.map(x=>({stageId:x.stageId,countU:String(x.countU)})),
  stageTotalAfterU:String(stages.totalAfterU),
  ecologyStabilityInferred:network.stabilityInferred,
  speciationTaxonomicTruthEstablished:spec.taxonomicTruthEstablished,
  extinctionZeroPopulationEstablished:extinct.demographicExtinctionEstablished,
  morphologyGeometryPrescription:morph.geometryPrescription,
  materializationCreatesTruth:mat.lowerLevelMaterializationCreatesTruth,
  hierarchyReconciled:rec.reconciled
};
console.log(JSON.stringify(golden, null, 2));
console.error('WV-C focused tests: PASS');
