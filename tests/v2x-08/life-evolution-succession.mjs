import assert from 'node:assert/strict';
import { createLifeState, advanceEcology, applyLineageEvent } from '../../src/v2x-08-life-ecology-evolution-embodiment/model.js';
import {
  LIFE_V2_EVOLUTION_DESCRIPTOR,
  proposeTraitVariation,
  evaluateSelectionCriterion,
  buildSpeciationProposal,
} from '../../src/v2x-08-life-ecology-evolution-embodiment/evolution.js';
import {
  LIFE_V2_SUCCESSION_DESCRIPTOR,
  applyDispersal,
  describeSuccession,
  compareRecovery,
  replayLifeTransitions,
} from '../../src/v2x-08-life-ecology-evolution-embodiment/succession.js';

const PPM = 1_000_000n;
let assertions = 0;
const equal = (actual, expected, message) => { assertions += 1; assert.deepEqual(actual, expected, message); };
const check = (condition, message) => { assertions += 1; assert.ok(condition, message); };
const throws = (fn, pattern, message) => { assertions += 1; assert.throws(fn, pattern, message); };

function fixture() {
  return createLifeState({
    eventKey: 'fixture:seed',
    lineages: [{
      id: 'lin-a',
      traits: [
        { key: 'mobility', valuePpm: 400_000 },
        { key: 'resilience', valuePpm: 500_000 },
      ],
      morphology: { locomotionMode: 'ACTIVE_SURFACE_TRAVEL' },
    }],
    populations: [{
      id: 'pop-a', lineageId: 'lin-a', regionId: 'r1', abundance: 100,
      energyStore: 1000, nutrientStore: 500,
      lifecycleStagePpm: { juvenile: 200_000, mature: 700_000, senescent: 100_000 },
    }],
    interactions: [],
    regions: {
      r1: { resourcePool: 10000, nutrientPool: 10000, opportunityPpm: 900_000, disturbancePpm: 0 },
      r2: { resourcePool: 8000, nutrientPool: 8000, opportunityPpm: 800_000, disturbancePpm: 0 },
    },
  });
}

const base = fixture();
equal(LIFE_V2_EVOLUTION_DESCRIPTOR.eventAdmission, 'NONE_P4_REMAINS_AUTHORITY', 'evolution helper must not become event authority');
equal(LIFE_V2_SUCCESSION_DESCRIPTOR.temporalAuthority, 'P4_EXTERNAL_EVENT_ORDER', 'succession helper must preserve P4 temporal authority');

throws(() => createLifeState({
  lineages: [{ id: 'child', parentId: 'missing', traits: [] }], populations: [], interactions: [], regions: {},
}), /parent missing/, 'lineage parent references must fail closed when parent identity is absent');
throws(() => createLifeState({
  lineages: [{ id: 'a', parentId: 'b', traits: [] }, { id: 'b', parentId: 'a', traits: [] }], populations: [], interactions: [], regions: {},
}), /parent cycle detected/, 'lineage parent graph must reject cycles');
throws(() => createLifeState({
  lineages: [{ id: 'dup-trait', traits: [{ key: 'mobility', valuePpm: 1 }, { key: 'mobility', valuePpm: 2 }] }], populations: [], interactions: [], regions: {},
}), /duplicate trait key/, 'lineage trait keys must remain unambiguous');
throws(() => createLifeState({
  lineages: [{ id: 'extinct', extinctionEventKey: 'p4:extinct', traits: [] }],
  populations: [{ id: 'ghost', lineageId: 'extinct', regionId: 'r', abundance: 1 }], interactions: [],
  regions: { r: { resourcePool: 0, nutrientPool: 0 } },
}), /formally extinct lineage .* represented abundance/, 'formal extinction state must never coexist with positive represented abundance');
throws(() => createLifeState({
  lineages: [{ id: 'lin', traits: [] }], populations: [{ id: 'orphan-region', lineageId: 'lin', regionId: 'missing', abundance: 1 }], interactions: [], regions: {},
}), /region missing/, 'population aggregates must fail closed when their upstream region identity is absent');
throws(() => createLifeState({
  lineages: [{ id: 'lin', traits: [] }],
  populations: [
    { id: 'aggregate-a', lineageId: 'lin', regionId: 'r', abundance: 1 },
    { id: 'aggregate-b', lineageId: 'lin', regionId: 'r', abundance: 1 },
  ],
  interactions: [], regions: { r: { resourcePool: 0, nutrientPool: 0 } },
}), /multiple population aggregates/, 'one lineage/region pair must map to one unambiguous aggregate population');

const lifecycleNoFlow = advanceEcology(base, {
  type: 'LIFE_ADVANCE', eventKey: 'p4:lifecycle-no-flow',
  profile: {
    birthPpm: 0, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1,
    maintenancePerIndividual: 0, disturbanceMortalityPpm: 0,
    juvenileMaturationPpm: 0, matureSenescencePpm: 0,
  },
}).state;
equal(lifecycleNoFlow.populations[0].lifecycleStagePpm, base.populations[0].lifecycleStagePpm, 'zero explicit lifecycle transition rates must preserve stage composition when demography is unchanged');

const lifecycleAdvanced = advanceEcology(base, {
  type: 'LIFE_ADVANCE', eventKey: 'p4:lifecycle-advance',
  profile: {
    birthPpm: 0, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1,
    maintenancePerIndividual: 0, disturbanceMortalityPpm: 0,
    juvenileMaturationPpm: 500_000, matureSenescencePpm: 100_000,
  },
}).state;
equal(lifecycleAdvanced.populations[0].lifecycleStagePpm, {
  juvenile: 100_000n,
  mature: 730_000n,
  senescent: 170_000n,
}, 'explicit lifecycle rates must advance exact 20/70/10 counts to 10/73/17 without changing abundance');
equal(Object.values(lifecycleAdvanced.populations[0].lifecycleStagePpm).reduce((sum, value) => sum + value, 0n), PPM, 'advanced lifecycle composition must remain exactly normalized to one million ppm');
equal(lifecycleAdvanced.populations[0].abundance, base.populations[0].abundance, 'pure lifecycle transitions must conserve represented abundance');
throws(() => advanceEcology(base, {
  type: 'LIFE_ADVANCE', eventKey: 'p4:lifecycle-invalid',
  profile: { birthPpm: 0, mortalityPpm: 0, maintenancePerIndividual: 0, juvenileMaturationPpm: 1_000_001 },
}), /juvenileMaturationPpm out of bounds/, 'lifecycle rate profiles above one million ppm must fail closed');

const birthLifecycleFixture = createLifeState({
  eventKey: 'fixture:birth-lifecycle',
  lineages: [{ id: 'lin-birth', traits: [{ key: 'fecundity', valuePpm: PPM }, { key: 'resilience', valuePpm: PPM }] }],
  populations: [{
    id: 'pop-birth', lineageId: 'lin-birth', regionId: 'r', abundance: 100,
    lifecycleStagePpm: { juvenile: 0, mature: PPM, senescent: 0 },
  }],
  interactions: [],
  regions: { r: { resourcePool: 50, nutrientPool: 50, opportunityPpm: PPM, disturbancePpm: 0 } },
});
const birthLifecycleNext = advanceEcology(birthLifecycleFixture, {
  type: 'LIFE_ADVANCE', eventKey: 'p4:birth-lifecycle',
  profile: {
    birthPpm: 500_000, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1,
    maintenancePerIndividual: 0, disturbanceMortalityPpm: 0,
    juvenileMaturationPpm: 0, matureSenescencePpm: 0,
  },
}).state;
equal(birthLifecycleNext.populations[0].abundance, 150n, 'resource-funded births must increase aggregate abundance by the exact bounded birth count');
check(birthLifecycleNext.populations[0].lifecycleStagePpm.juvenile > 0n, 'new modeled births must enter the juvenile lifecycle pool');
equal(Object.values(birthLifecycleNext.populations[0].lifecycleStagePpm).reduce((sum, value) => sum + value, 0n), PPM, 'birth-adjusted lifecycle composition must remain exactly normalized');

const indivisibleMaintenance = createLifeState({
  eventKey: 'fixture:indivisible-maintenance',
  lineages: [{ id: 'lin-1', traits: [] }, { id: 'lin-2', traits: [] }],
  populations: [
    { id: 'pop-1', lineageId: 'lin-1', regionId: 'r', abundance: 1 },
    { id: 'pop-2', lineageId: 'lin-2', regionId: 'r', abundance: 1 },
  ],
  interactions: [],
  regions: { r: { resourcePool: 1, nutrientPool: 0, opportunityPpm: 0, disturbancePpm: 0 } },
});
const indivisibleMaintenanceNext = advanceEcology(indivisibleMaintenance, {
  type: 'LIFE_ADVANCE', eventKey: 'p4:indivisible-maintenance',
  profile: { birthPpm: 0, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1, maintenancePerIndividual: 1, disturbanceMortalityPpm: 0 },
}).state;
equal(indivisibleMaintenanceNext.populations.reduce((sum, population) => sum + population.abundance, 0n), 1n, 'one indivisible maintenance unit must support exactly one represented individual rather than disappear to flooring');
equal(indivisibleMaintenanceNext.regions.r.resourcePool, 0n, 'indivisible maintenance allocation must consume the exact used resource unit');

const indivisibleInteraction = createLifeState({
  eventKey: 'fixture:indivisible-interaction',
  lineages: [{ id: 'lin-p1', traits: [] }, { id: 'lin-p2', traits: [] }, { id: 'lin-prey', traits: [] }],
  populations: [
    { id: 'pred-1', lineageId: 'lin-p1', regionId: 'r', abundance: 1 },
    { id: 'pred-2', lineageId: 'lin-p2', regionId: 'r', abundance: 1 },
    { id: 'prey', lineageId: 'lin-prey', regionId: 'r', abundance: 1 },
  ],
  interactions: [
    { id: 'edge-1', kind: 'PREDATION', sourcePopulationId: 'pred-1', targetPopulationId: 'prey', intensityPpm: PPM, assimilationPpm: PPM },
    { id: 'edge-2', kind: 'PREDATION', sourcePopulationId: 'pred-2', targetPopulationId: 'prey', intensityPpm: PPM, assimilationPpm: PPM },
  ],
  regions: { r: { resourcePool: 0, nutrientPool: 0, opportunityPpm: 0, disturbancePpm: 0 } },
});
const indivisibleInteractionNext = advanceEcology(indivisibleInteraction, {
  type: 'LIFE_ADVANCE', eventKey: 'p4:indivisible-interaction',
  profile: { birthPpm: 0, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1, maintenancePerIndividual: 0, disturbanceMortalityPpm: 0 },
}).state;
equal(indivisibleInteractionNext.populations.find((population) => population.id === 'prey').abundance, 0n, 'oversubscribed indivisible interaction loss must consume the represented prey capacity exactly');
equal(indivisibleInteractionNext.populations.filter((population) => population.id.startsWith('pred-')).reduce((sum, population) => sum + population.energyStore, 0n), 1n, 'bounded indivisible predation must conserve the single assimilable removal across competing claims');

const variationA = proposeTraitVariation(base, {
  lineageId: 'lin-a', eventKey: 'p4:variation-1', allowedTraitKeys: ['mobility'], maxAbsoluteDeltaPpm: 50_000,
});
const variationB = proposeTraitVariation(base, {
  lineageId: 'lin-a', eventKey: 'p4:variation-1', allowedTraitKeys: ['mobility'], maxAbsoluteDeltaPpm: 50_000,
});
equal(variationA, variationB, 'trait variation proposals must be deterministic');
equal(variationA.traitKey, 'mobility', 'eligible trait selection must respect allowlist');
equal(variationA.status, 'PROPOSAL_ONLY', 'variation must remain proposal-only');
check(BigInt(variationA.resultingValuePpm) >= 0n && BigInt(variationA.resultingValuePpm) <= PPM, 'variation must remain bounded');

const target = BigInt(variationA.resultingValuePpm);
const selectionRequest = {
  regionId: 'r1',
  criterion: {
    profileId: 'fixture-selection-v1', traitKey: 'mobility', targetPpm: target,
    minimumImprovementPpm: 1, minimumOpportunityPpm: 500_000,
  },
};
const witness = evaluateSelectionCriterion(base, variationA, selectionRequest);
equal(witness.satisfied, true, 'explicit fixture criterion should recognize a closer proposed trait value');
equal(witness.kind, 'PROFILE_BOUND_SELECTION_WITNESS', 'selection must expose profile-bound witness semantics');
equal(witness.proposalEventKey, variationA.eventKey, 'selection witness must bind to exact variation proposal event identity');
equal(witness.proposalPriorValuePpm, variationA.priorValuePpm, 'selection witness must bind exact proposal prior value');
equal(witness.proposalDeltaPpm, variationA.deltaPpm, 'selection witness must bind exact proposal delta');
equal(witness.proposalResultingValuePpm, variationA.resultingValuePpm, 'selection witness must bind exact proposal result');

const tamperedPrior = { ...variationA, priorValuePpm: '399999' };
throws(() => evaluateSelectionCriterion(base, tamperedPrior, selectionRequest), /stale or tampered/, 'selection must reject proposal prior values not matching current lineage state');
const tamperedResult = { ...variationA, resultingValuePpm: String(BigInt(variationA.resultingValuePpm) === PPM ? PPM - 1n : BigInt(variationA.resultingValuePpm) + 1n) };
throws(() => evaluateSelectionCriterion(base, tamperedResult, selectionRequest), /inconsistent with prior value and delta/, 'selection must reject proposal results inconsistent with proposal delta');
const tamperedAuthority = { ...variationA, authorityClass: 'CANONICAL_PROVEN' };
throws(() => evaluateSelectionCriterion(base, tamperedAuthority, selectionRequest), /authority class mismatch/, 'selection must reject authority escalation in variation proposal');
const tamperedStatus = { ...variationA, status: 'ADMITTED' };
throws(() => evaluateSelectionCriterion(base, tamperedStatus, selectionRequest), /status mismatch/, 'selection must reject proposal status escalation');

const changedTraitState = createLifeState({
  ...base,
  lineages: [{
    ...base.lineages[0],
    traits: base.lineages[0].traits.map((trait) => trait.key === 'mobility' ? { ...trait, valuePpm: trait.valuePpm + 1n } : trait),
  }],
});
throws(() => evaluateSelectionCriterion(changedTraitState, variationA, selectionRequest), /stale or tampered/, 'proposal must become stale when current lineage trait state has advanced');

const unsatisfied = evaluateSelectionCriterion(base, variationA, {
  regionId: 'r1',
  criterion: {
    profileId: 'fixture-selection-v1', traitKey: 'mobility', targetPpm: target,
    minimumImprovementPpm: 1, minimumOpportunityPpm: 950_000,
  },
});
equal(unsatisfied.satisfied, false, 'insufficient explicit opportunity must fail the criterion');
throws(() => buildSpeciationProposal(variationA, unsatisfied, { eventKey: 'p4:speciation-1' }), /satisfied selection witness required/, 'unsatisfied selection must not produce speciation event proposal');

const forgedWitnessTrait = { ...witness, traitKey: 'resilience' };
throws(() => buildSpeciationProposal(variationA, forgedWitnessTrait, { eventKey: 'p4:speciation-forged-trait' }), /trait mismatch/, 'speciation proposal must reject witness bound to a different trait');
const forgedWitnessEvent = { ...witness, proposalEventKey: 'p4:variation-other' };
throws(() => buildSpeciationProposal(variationA, forgedWitnessEvent, { eventKey: 'p4:speciation-forged-event' }), /event mismatch/, 'speciation proposal must reject witness bound to another proposal event');
const forgedWitnessDelta = { ...witness, proposalDeltaPpm: '0' };
throws(() => buildSpeciationProposal(variationA, forgedWitnessDelta, { eventKey: 'p4:speciation-forged-delta' }), /delta mismatch/, 'speciation proposal must reject witness whose bound proposal delta was altered');
const forgedWitnessAuthority = { ...witness, authorityClass: 'CANONICAL_PROVEN' };
throws(() => buildSpeciationProposal(variationA, forgedWitnessAuthority, { eventKey: 'p4:speciation-forged-authority' }), /authority class mismatch/, 'speciation proposal must reject witness authority escalation');

const speciationProposal = buildSpeciationProposal(variationA, witness, { eventKey: 'p4:speciation-1' });
equal(speciationProposal.status, 'EVENT_PROPOSAL_REQUIRES_EXTERNAL_P4_ADMISSION', 'speciation proposal must require external admission');
equal(speciationProposal.criterionWitness.proposalEventKey, variationA.eventKey, 'speciation criterion witness must preserve original proposal identity');
const speciated = applyLineageEvent(base, speciationProposal);
equal(speciated.lineages.length, 2, 'admitted proposal must append a lineage through model lineage event semantics');
throws(() => applyLineageEvent(base, {
  ...speciationProposal,
  eventKey: 'p4:speciation-missing-trait',
  traitDeltasPpm: [{ key: 'not-modeled', deltaPpm: 1 }],
}), /trait delta target .* missing/, 'speciation must reject trait deltas that target traits absent from parent lineage');

const zeroExtinctState = createLifeState({
  eventKey: 'fixture:extinct-parent',
  lineages: [{ id: 'lin-extinct', extinctionEventKey: 'p4:prior-extinction', traits: [{ key: 'mobility', valuePpm: 1 }] }],
  populations: [{ id: 'pop-extinct', lineageId: 'lin-extinct', regionId: 'r', abundance: 0 }],
  interactions: [], regions: { r: { resourcePool: 0, nutrientPool: 0 } },
});
throws(() => applyLineageEvent(zeroExtinctState, {
  type: 'SPECIATION', eventKey: 'p4:bad-speciation', parentLineageId: 'lin-extinct',
  criterionWitness: { satisfied: true }, traitDeltasPpm: [{ key: 'mobility', deltaPpm: 1 }],
}), /cannot speciate from a formally extinct lineage/, 'formally extinct lineage must never seed a new modeled lineage');
throws(() => applyLineageEvent(zeroExtinctState, {
  type: 'EXTINCTION', eventKey: 'p4:duplicate-extinction', lineageId: 'lin-extinct',
}), /already formally extinct/, 'formal extinction identity must be single-assignment');

throws(() => applyDispersal(base, { type: 'LIFE_DISPERSAL', eventKey: 'p4:missing-count', sourcePopulationId: 'pop-a', targetRegionId: 'r2' }), /dispersal count required/, 'dispersal must require an explicit bounded transfer count');
const dispersedA = applyDispersal(base, { type: 'LIFE_DISPERSAL', eventKey: 'p4:dispersal-1', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 30 });
const dispersedB = applyDispersal(base, { type: 'LIFE_DISPERSAL', eventKey: 'p4:dispersal-1', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 30 });
equal(dispersedA, dispersedB, 'dispersal must be deterministic');
equal(dispersedA.transfer.eventKey, 'p4:dispersal-1', 'dispersal transfer witness must retain exact external event identity');
equal(dispersedA.transfer.sourceStateEventKey, base.eventKey, 'dispersal witness must identify its exact source-state event key');
equal(dispersedA.transfer.causationClaimedBeyondTransfer, false, 'dispersal witness must not infer downstream ecological causation');
const dispersedState = dispersedA.state;
equal(dispersedState.populations.reduce((sum, population) => sum + population.abundance, 0n), 100n, 'aggregate dispersal must conserve represented abundance');
equal(dispersedState.populations.reduce((sum, population) => sum + population.energyStore, 0n), 1000n, 'aggregate dispersal must conserve represented energy store');
equal(dispersedState.populations.reduce((sum, population) => sum + population.nutrientStore, 0n), 500n, 'aggregate dispersal must conserve represented nutrient store');
equal(dispersedState.populations.find((population) => population.regionId === 'r2').abundance, 30n, 'new region must receive exact transferred count');
throws(() => applyDispersal(base, { type: 'LIFE_DISPERSAL', eventKey: 'p4:bad', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 101 }), /exceeds represented source abundance/, 'dispersal cannot create abundance');

const sterileRegionDescriptor = describeSuccession(base, 'r2', {
  profileId: 'fixture-succession-v1', pioneerMaxAbundance: 50, establishedMinLineages: 1, networkedMinInteractions: 1,
});
equal(sterileRegionDescriptor.stage, 'NO_REPRESENTED_LIFE', 'uncolonized represented region must stay empty');
equal(sterileRegionDescriptor.eventKey, base.eventKey, 'succession descriptor must bind to inspected state event identity');
const pioneer = describeSuccession(dispersedState, 'r2', {
  profileId: 'fixture-succession-v1', pioneerMaxAbundance: 50, establishedMinLineages: 1, networkedMinInteractions: 1,
});
equal(pioneer.stage, 'PIONEER', 'small colonized aggregate should satisfy explicit pioneer profile');
equal(pioneer.authorityClass, 'MODEL_DERIVED_SIMULATION', 'succession stage must remain model-derived');

const recovery = compareRecovery(base, dispersedState, 'r2');
equal(recovery.direction, 'INCREASED_REPRESENTED_ABUNDANCE', 'colonization should increase represented abundance in target region');
equal(recovery.causationClaimed, false, 'recovery comparison must not overclaim causation');
equal(recovery.beforeEventKey, base.eventKey, 'recovery comparison must identify before-state event key');
equal(recovery.afterEventKey, dispersedState.eventKey, 'recovery comparison must identify after-state event key');
const missingRegionState = createLifeState({ eventKey: 'fixture:no-r2', lineages: [], populations: [], interactions: [], regions: { r1: { resourcePool: 0, nutrientPool: 0 } } });
throws(() => compareRecovery(base, missingRegionState, 'r2'), /after-state region r2 missing/, 'recovery comparison must fail closed when region identity is absent in either compared state');

const replayed = replayLifeTransitions(base, [
  { type: 'LIFE_DISPERSAL', eventKey: 'p4:dispersal-1', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 30 },
]);
equal(replayed, dispersedState, 'transition replay must reproduce deterministic dispersal state');

console.log(`V2X-08 life evolution succession: PASS (${assertions} assertions)`);
