import assert from 'node:assert/strict';
import {
  LIFE_V2_AUTHORITY,
  LIFE_V2_LIMITS,
  createLifeState,
  advanceEcology,
  applyLineageEvent,
  replayLife,
  summarizeLifeState,
} from '../../src/v2x-08-life-ecology-evolution-embodiment/model.js';
import {
  materializeLocalOrganisms,
  projectSelectionToAggregate,
} from '../../src/v2x-08-life-ecology-evolution-embodiment/embodiment.js';

const PPM = 1_000_000n;
let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};
const throws = (fn, pattern, message) => {
  assertions += 1;
  assert.throws(fn, pattern, message);
};

function fixture(overrides = {}) {
  return createLifeState({
    eventKey: 'fixture:seed',
    lineages: [{
      id: 'lin-a',
      originEventKey: 'fixture:seed',
      traits: [
        { key: 'body-size', valuePpm: 420_000 },
        { key: 'fecundity', valuePpm: 600_000 },
        { key: 'mobility', valuePpm: 720_000 },
        { key: 'resilience', valuePpm: 800_000 },
        { key: 'structural-defense', valuePpm: 350_000 },
      ],
      morphology: {
        symmetry: 'BILATERAL_LIKE_MODEL_DESCRIPTOR',
        supportMode: 'INTERNAL_OR_EXTERNAL_SUPPORT_UNRESOLVED',
        locomotionMode: 'ACTIVE_SURFACE_TRAVEL',
        feedingMode: 'RESOURCE_CAPTURE',
      },
    }],
    populations: [{
      id: 'pop-a',
      lineageId: 'lin-a',
      regionId: 'r1',
      abundance: 1000,
      energyStore: 100,
      nutrientStore: 100,
      lifecycleStagePpm: { juvenile: 200_000, mature: 700_000, senescent: 100_000 },
    }],
    interactions: [],
    regions: {
      r1: { resourcePool: 100_000, nutrientPool: 100_000, disturbancePpm: 0, opportunityPpm: 900_000 },
    },
    ...overrides,
  });
}

const base = fixture();
equal(base.authority.class, 'MODEL_DERIVED_SIMULATION', 'life v2 must remain model-derived');
equal(LIFE_V2_AUTHORITY.abiogenesisStatus, 'NOT_MODELED', 'abiogenesis must remain out of scope');
equal(LIFE_V2_AUTHORITY.temporalAuthority, 'P4_EXTERNAL_EVENT_ORDER', 'P4 remains temporal authority');

const event = {
  type: 'LIFE_ADVANCE',
  eventKey: 'p4:0001',
  profile: {
    birthPpm: 50_000,
    mortalityPpm: 20_000,
    resourcePerBirth: 1,
    nutrientPerBirth: 1,
    maintenancePerIndividual: 0,
    disturbanceMortalityPpm: 300_000,
  },
};
const first = advanceEcology(base, event).state;
const second = advanceEcology(base, event).state;
equal(first, second, 'identical state + event must replay identically');
check(first.populations[0].abundance > base.populations[0].abundance, 'favorable bounded environment should permit positive growth in this explicit profile');

const disturbed = fixture({
  regions: { r1: { resourcePool: 100_000, nutrientPool: 100_000, disturbancePpm: 900_000, opportunityPpm: 900_000 } },
});
const disturbedNext = advanceEcology(disturbed, event).state;
check(disturbedNext.populations[0].abundance < first.populations[0].abundance, 'higher disturbance must not improve abundance under identical explicit profile');

const resourcePoor = fixture({
  regions: { r1: { resourcePool: 0, nutrientPool: 0, disturbancePpm: 0, opportunityPpm: 900_000 } },
});
const resourcePoorNext = advanceEcology(resourcePoor, event).state;
check(resourcePoorNext.populations[0].abundance <= base.populations[0].abundance, 'zero birth resources must prevent resource-funded growth');

throws(() => applyLineageEvent(base, {
  type: 'SPECIATION',
  eventKey: 'p4:0002',
  parentLineageId: 'lin-a',
  criterionWitness: { satisfied: false, kind: 'TEST' },
}), /requires explicit satisfied criterion witness/, 'speciation without a satisfied criterion witness must fail closed');

const speciated = applyLineageEvent(base, {
  type: 'SPECIATION',
  eventKey: 'p4:0002',
  parentLineageId: 'lin-a',
  criterionWitness: { satisfied: true, kind: 'EXPLICIT_MODEL_CRITERION', note: 'fixture-only bounded criterion' },
  traitDeltasPpm: [{ key: 'mobility', deltaPpm: -100_000 }],
});
equal(speciated.lineages.length, 2, 'speciation must retain parent and append child lineage');
const child = speciated.lineages.find((lineage) => lineage.id !== 'lin-a');
equal(child.parentId, 'lin-a', 'child lineage must preserve parent identity');
equal(child.originEventKey, 'p4:0002', 'child lineage origin must bind to external event key');
check(child.speciationWitness.satisfied === true, 'child lineage must retain speciation witness');

throws(() => applyLineageEvent(base, {
  type: 'EXTINCTION', eventKey: 'p4:0003', lineageId: 'lin-a',
}), /requires represented aggregate abundance exactly zero/, 'formal extinction with nonzero represented abundance must fail closed');

const extinctFixture = createLifeState({
  ...base,
  populations: [{ ...base.populations[0], abundance: 0 }],
});
const extinct = applyLineageEvent(extinctFixture, {
  type: 'EXTINCTION', eventKey: 'p4:0003', lineageId: 'lin-a',
});
equal(extinct.lineages[0].extinctionEventKey, 'p4:0003', 'formal extinction must persist event identity');

const replayedA = replayLife(base, [event]);
const replayedB = replayLife(base, [event]);
equal(replayedA, replayedB, 'replay helper must remain deterministic');
throws(() => replayLife(base, Array.from({ length: LIFE_V2_LIMITS.maxReplayEvents + 1 }, (_, i) => ({ ...event, eventKey: `p4:${i}` }))), /replay event bound exceeded/, 'replay must enforce lifetime invocation bound');

const samples = materializeLocalOrganisms(base, { regionId: 'r1', maxSamples: 12, viewportKey: 'test-view' });
equal(samples.length, 12, 'materializer should honor bounded requested sample count for populated fixture');
equal(samples, materializeLocalOrganisms(base, { regionId: 'r1', maxSamples: 12, viewportKey: 'test-view' }), 'materialization must be deterministic');
check(samples.every((sample) => sample.persistent === false), 'local organism samples must not become persistent persons');
check(samples.every((sample) => sample.individualIdentityPromoted === false), 'local samples must not promote individual identity');
check(samples.every((sample) => sample.morphology.authorityClass === 'MODEL_DERIVED_SIMULATION'), 'semantic morphology must remain model-derived');
check(samples.every((sample) => sample.presentation.authorityClass === 'PRESENTATION_ONLY'), 'animation/motion must remain presentation-only');

const selection = projectSelectionToAggregate(samples[0], base);
equal(selection.populationId, 'pop-a', 'sample selection must project back to its modeled aggregate');
equal(selection.inferenceGuard, 'LOCAL_SAMPLE_MUST_NOT_INFER_GLOBAL_ABUNDANCE', 'selection handoff must carry abundance inference guard');

const sterile = createLifeState({ eventKey: 'fixture:sterile', lineages: [], populations: [], interactions: [], regions: { r0: { resourcePool: 1000, nutrientPool: 1000, opportunityPpm: PPM } } });
equal(materializeLocalOrganisms(sterile, { regionId: 'r0', maxSamples: 128 }), [], 'sterile path must remain visually empty');

const summary = summarizeLifeState(base);
equal(summary.totalAbundance, 1000n, 'summary must preserve exact aggregate abundance');
equal(summary.authorityClass, 'MODEL_DERIVED_SIMULATION', 'summary must expose authority class');

console.log(`V2X-08 life ecology evolution embodiment: PASS (${assertions} assertions)`);
