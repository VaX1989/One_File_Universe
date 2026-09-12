import assert from 'node:assert/strict';
import {
  LIFE_V2_AUTHORITY,
  LIFE_V2_LIMITS,
  LIFE_V2_SCENARIO_ASSUMPTIONS,
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

function populationByLineage(state) {
  return Object.fromEntries(state.populations.map((population) => [population.lineageId, {
    abundance: population.abundance,
    energyStore: population.energyStore,
    nutrientStore: population.nutrientStore,
    regionId: population.regionId,
  }]));
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
equal(LIFE_V2_SCENARIO_ASSUMPTIONS.assumptionClass, 'MODEL_ASSUMPTION_NOT_OBSERVATION', 'scenario priors must be explicitly classified as assumptions, not observations');
const explicitOnly = advanceEcology(base, {
  ...event,
  eventKey: 'p4:explicit-only',
  profile: { ...event.profile, juvenileMaturationPpm: 0, matureSenescencePpm: 0 },
});
equal(explicitOnly.scenarioAssumptions, null, 'fully explicit profile and lineage traits must not manufacture an assumption envelope');

const assumptionFixture = createLifeState({
  eventKey: 'fixture:assumption-provenance',
  lineages: [{ id: 'lin-assumed', traits: [] }],
  populations: [{
    id: 'pop-assumed', lineageId: 'lin-assumed', regionId: 'r-assumed', abundance: 100,
    energyStore: 0, nutrientStore: 0,
    lifecycleStagePpm: { juvenile: 200_000, mature: 700_000, senescent: 100_000 },
  }],
  interactions: [],
  regions: { 'r-assumed': { resourcePool: 1000, nutrientPool: 1000, disturbancePpm: 0, opportunityPpm: PPM } },
});
const assumedAdvance = advanceEcology(assumptionFixture, { type: 'LIFE_ADVANCE', eventKey: 'p4:assumed' });
check(assumedAdvance.scenarioAssumptions?.assumptionClass === 'MODEL_ASSUMPTION_NOT_OBSERVATION', 'omitted ecology parameters must surface governed assumption authority');
check(assumedAdvance.scenarioAssumptions?.provenance.includes('not measured'), 'scenario assumption provenance must deny observational authority');
for (const field of [
  'profile.birthPpm', 'profile.mortalityPpm', 'profile.resourcePerBirth', 'profile.nutrientPerBirth',
  'profile.maintenancePerIndividual', 'profile.disturbanceMortalityPpm', 'profile.juvenileMaturationPpm',
  'profile.matureSenescencePpm', 'trait.fecundity', 'trait.resilience',
]) check(assumedAdvance.scenarioAssumptions.fields.includes(field), `missing governed assumption witness for ${field}`);
check(assumedAdvance.diagnostics.every((entry) => entry.scenarioAssumptions === assumedAdvance.scenarioAssumptions), 'downstream demographic diagnostics must retain the exact assumption envelope');

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

const sharedLineages = [
  { id: 'lin-small', traits: [{ key: 'fecundity', valuePpm: PPM }, { key: 'resilience', valuePpm: PPM }] },
  { id: 'lin-large', traits: [{ key: 'fecundity', valuePpm: PPM }, { key: 'resilience', valuePpm: PPM }] },
];
function limitedResourceFixture(ids) {
  return createLifeState({
    eventKey: 'fixture:limited',
    lineages: sharedLineages,
    populations: [
      { id: ids.small, lineageId: 'lin-small', regionId: 'r', abundance: 100, energyStore: 0, nutrientStore: 0 },
      { id: ids.large, lineageId: 'lin-large', regionId: 'r', abundance: 300, energyStore: 0, nutrientStore: 0 },
    ],
    interactions: [],
    regions: { r: { resourcePool: 100, nutrientPool: 100, disturbancePpm: 0, opportunityPpm: PPM } },
  });
}
const saturatedGrowthEvent = {
  type: 'LIFE_ADVANCE', eventKey: 'p4:limited',
  profile: { birthPpm: PPM, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1, maintenancePerIndividual: 0, disturbanceMortalityPpm: 0 },
};
const limitedA = advanceEcology(limitedResourceFixture({ small: 'a-small', large: 'z-large' }), saturatedGrowthEvent).state;
const limitedB = advanceEcology(limitedResourceFixture({ small: 'z-small', large: 'a-large' }), saturatedGrowthEvent).state;
equal(populationByLineage(limitedA), populationByLineage(limitedB), 'renaming population IDs must not redirect shared regional birth resources between unchanged ecological roles');
equal(populationByLineage(limitedA)['lin-small'].abundance, 125n, 'limited birth resources must be proportionally allocated to small population');
equal(populationByLineage(limitedA)['lin-large'].abundance, 375n, 'limited birth resources must be proportionally allocated to large population');
equal(limitedA.regions.r.resourcePool, 0n, 'allocated births must consume the explicit shared resource budget exactly in divisible fixture');
equal(limitedA.regions.r.nutrientPool, 0n, 'allocated births must consume the explicit shared nutrient budget exactly in divisible fixture');

function interactionFixture(edgeIds) {
  return createLifeState({
    eventKey: 'fixture:interaction',
    lineages: [
      { id: 'lin-p1', traits: [{ key: 'fecundity', valuePpm: 0 }, { key: 'resilience', valuePpm: PPM }] },
      { id: 'lin-p2', traits: [{ key: 'fecundity', valuePpm: 0 }, { key: 'resilience', valuePpm: PPM }] },
      { id: 'lin-prey', traits: [{ key: 'fecundity', valuePpm: 0 }, { key: 'resilience', valuePpm: PPM }] },
    ],
    populations: [
      { id: 'predator-1', lineageId: 'lin-p1', regionId: 'r', abundance: 100, energyStore: 0, nutrientStore: 0 },
      { id: 'predator-2', lineageId: 'lin-p2', regionId: 'r', abundance: 100, energyStore: 0, nutrientStore: 0 },
      { id: 'prey', lineageId: 'lin-prey', regionId: 'r', abundance: 100, energyStore: 0, nutrientStore: 0 },
    ],
    interactions: [
      { id: edgeIds.first, kind: 'PREDATION', sourcePopulationId: 'predator-1', targetPopulationId: 'prey', intensityPpm: PPM, assimilationPpm: PPM },
      { id: edgeIds.second, kind: 'PREDATION', sourcePopulationId: 'predator-2', targetPopulationId: 'prey', intensityPpm: PPM, assimilationPpm: PPM },
    ],
    regions: { r: { resourcePool: 0, nutrientPool: 0, disturbancePpm: 0, opportunityPpm: 0 } },
  });
}
const interactionEvent = {
  type: 'LIFE_ADVANCE', eventKey: 'p4:interaction',
  profile: { birthPpm: 0, mortalityPpm: 0, resourcePerBirth: 1, nutrientPerBirth: 1, maintenancePerIndividual: 0, disturbanceMortalityPpm: 0 },
};
const interactionA = advanceEcology(interactionFixture({ first: 'a-edge', second: 'z-edge' }), interactionEvent).state;
const interactionB = advanceEcology(interactionFixture({ first: 'z-edge', second: 'a-edge' }), interactionEvent).state;
equal(populationByLineage(interactionA), populationByLineage(interactionB), 'renaming interaction IDs must not change simultaneous ecological pressure outcomes');
equal(populationByLineage(interactionA)['lin-prey'].abundance, 0n, 'oversubscribed predation pressure must never remove more than represented prey abundance');
equal(populationByLineage(interactionA)['lin-p1'].energyStore, 50n, 'simultaneous predation must share bounded removal without first-edge privilege');
equal(populationByLineage(interactionA)['lin-p2'].energyStore, 50n, 'simultaneous predation must share bounded removal symmetrically in symmetric fixture');

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

const skewed = createLifeState({
  eventKey: 'fixture:skewed',
  lineages: [
    { id: 'lin-dominant', traits: [] },
    { id: 'lin-rare-a', traits: [] },
    { id: 'lin-rare-b', traits: [] },
  ],
  populations: [
    { id: 'dominant', lineageId: 'lin-dominant', regionId: 'r', abundance: 98 },
    { id: 'rare-a', lineageId: 'lin-rare-a', regionId: 'r', abundance: 1 },
    { id: 'rare-b', lineageId: 'lin-rare-b', regionId: 'r', abundance: 1 },
  ],
  interactions: [],
  regions: { r: { resourcePool: 0, nutrientPool: 0, opportunityPpm: PPM } },
});
const skewedSamples = materializeLocalOrganisms(skewed, { regionId: 'r', maxSamples: 3, viewportKey: 'skewed-view' });
equal(skewedSamples.length, 3, 'apportionment must fill bounded sample budget when represented abundance exists');
equal(skewedSamples.filter((sample) => sample.populationId === 'dominant').length, 3, 'largest-remainder apportionment must not force a rare population sample at the expense of a 98% aggregate');
equal(skewedSamples.filter((sample) => sample.populationId !== 'dominant').length, 0, 'sub-sample rare aggregates may remain unmaterialized rather than receiving order-biased minimum-one privilege');
throws(() => materializeLocalOrganisms(base, { regionId: 'r1', maxSamples: Number.NaN }), /maxSamples must be a non-negative finite number/, 'invalid sample budgets must fail closed');

const sterile = createLifeState({ eventKey: 'fixture:sterile', lineages: [], populations: [], interactions: [], regions: { r0: { resourcePool: 1000, nutrientPool: 1000, opportunityPpm: PPM } } });
equal(materializeLocalOrganisms(sterile, { regionId: 'r0', maxSamples: 128 }), [], 'sterile path must remain visually empty');

const summary = summarizeLifeState(base);
equal(summary.totalAbundance, 1000n, 'summary must preserve exact aggregate abundance');
equal(summary.authorityClass, 'MODEL_DERIVED_SIMULATION', 'summary must expose authority class');

console.log(`V2X-08 life ecology evolution embodiment: PASS (${assertions} assertions)`);
