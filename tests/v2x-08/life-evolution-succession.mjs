import assert from 'node:assert/strict';
import { createLifeState, applyLineageEvent } from '../../src/v2x-08-life-ecology-evolution-embodiment/model.js';
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

const variationA = proposeTraitVariation(base, {
  lineageId: 'lin-a', eventKey: 'p4:variation-1', allowedTraitKeys: ['mobility'], maxAbsoluteDeltaPpm: 50_000,
});
const variationB = proposeTraitVariation(base, {
  lineageId: 'lin-a', eventKey: 'p4:variation-1', allowedTraitKeys: ['mobility'], maxAbsoluteDeltaPpm: 50_000,
});
equal(variationA, variationB, 'trait variation proposals must be deterministic');
equal(variationA.traitKey, 'mobility', 'eligible trait selection must respect allowlist');
equal(variationA.status, 'PROPOSAL_ONLY', 'variation must remain proposal-only');
check(BigInt(variationA.resultingValuePpm) >= 0n && BigInt(variationA.resultingValuePpm) <= 1_000_000n, 'variation must remain bounded');

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
const tamperedResult = { ...variationA, resultingValuePpm: String(BigInt(variationA.resultingValuePpm) === 1_000_000n ? 999_999n : BigInt(variationA.resultingValuePpm) + 1n) };
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

const dispersedA = applyDispersal(base, { type: 'LIFE_DISPERSAL', eventKey: 'p4:dispersal-1', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 30 });
const dispersedB = applyDispersal(base, { type: 'LIFE_DISPERSAL', eventKey: 'p4:dispersal-1', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 30 });
equal(dispersedA, dispersedB, 'dispersal must be deterministic');
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
const pioneer = describeSuccession(dispersedState, 'r2', {
  profileId: 'fixture-succession-v1', pioneerMaxAbundance: 50, establishedMinLineages: 1, networkedMinInteractions: 1,
});
equal(pioneer.stage, 'PIONEER', 'small colonized aggregate should satisfy explicit pioneer profile');
equal(pioneer.authorityClass, 'MODEL_DERIVED_SIMULATION', 'succession stage must remain model-derived');

const recovery = compareRecovery(base, dispersedState, 'r2');
equal(recovery.direction, 'INCREASED_REPRESENTED_ABUNDANCE', 'colonization should increase represented abundance in target region');
equal(recovery.causationClaimed, false, 'recovery comparison must not overclaim causation');

const replayed = replayLifeTransitions(base, [
  { type: 'LIFE_DISPERSAL', eventKey: 'p4:dispersal-1', sourcePopulationId: 'pop-a', targetRegionId: 'r2', count: 30 },
]);
equal(replayed, dispersedState, 'transition replay must reproduce deterministic dispersal state');

console.log(`V2X-08 life evolution succession: PASS (${assertions} assertions)`);
