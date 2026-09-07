import assert from 'node:assert/strict';
import { createLifeState } from '../../src/v2x-08-life-ecology-evolution-embodiment/model.js';
import { createLifeProvider, LIFE_V2_PROVIDER_DESCRIPTOR } from '../../src/v2x-08-life-ecology-evolution-embodiment/provider.js';
import { buildOrganismRenderDescriptors, cullOrganismRenderDescriptors } from '../../src/v2x-08-life-ecology-evolution-embodiment/renderer.js';

const PPM = 1_000_000n;
const state = createLifeState({
  eventKey: 'fixture:provider',
  lineages: [{
    id: 'lin-provider',
    traits: [
      { key: 'body-size', valuePpm: 800_000 },
      { key: 'mobility', valuePpm: 850_000 },
      { key: 'structural-defense', valuePpm: 800_000 },
    ],
    morphology: {
      symmetry: 'BILATERAL_LIKE_MODEL_DESCRIPTOR',
      supportMode: 'STRUCTURAL_SUPPORT_MODELED',
      locomotionMode: 'ACTIVE_SURFACE_TRAVEL',
      feedingMode: 'RESOURCE_CAPTURE',
    },
  }],
  populations: [{
    id: 'pop-provider', lineageId: 'lin-provider', regionId: 'r-provider', abundance: 400,
    lifecycleStagePpm: { juvenile: 250_000, mature: 650_000, senescent: 100_000 },
  }],
  interactions: [],
  regions: { 'r-provider': { resourcePool: 10000, nutrientPool: 10000, opportunityPpm: 900_000 } },
});

const provider = createLifeProvider({ getState: () => state });
assert.equal(LIFE_V2_PROVIDER_DESCRIPTOR.authorityClass, 'MODEL_DERIVED_SIMULATION');
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.capabilities.includes('LIFE_SELECTION_CRITERION_WITNESS'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.capabilities.includes('LIFE_INTERACTION_INSPECTION'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.capabilities.includes('LIFE_REGION_INSPECTION'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.capabilities.includes('LIFE_LIFECYCLE_COMPOSITION'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.capabilities.includes('LIFE_REPRESENTATIVE_LIFECYCLE_SAMPLE'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.exclusions.includes('P4_EVENT_ADMISSION'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.exclusions.includes('UNIVERSAL_MUTATION_RATE'));
assert.ok(LIFE_V2_PROVIDER_DESCRIPTOR.exclusions.includes('UNIVERSAL_LIFECYCLE_RATE'));
assert.equal(provider.summary().totalAbundance, 400n);
assert.equal(provider.inspectLineage('lin-provider').aggregateAbundance, 400n);
assert.deepEqual(provider.inspectPopulation('pop-provider').incomingInteractionIds, []);
assert.equal(provider.inspectPopulation('pop-provider').lifecycleSemantics, 'PROFILE_BOUND_AGGREGATE_COMPOSITION');
assert.equal(provider.inspectRegion('r-provider').totalRepresentedAbundance, 400n);
assert.equal(provider.inspectLineage('missing'), null);
assert.equal(provider.inspectInteraction('missing'), null);

const interactionState = createLifeState({
  eventKey: 'fixture:provider-interaction',
  lineages: [
    { id: 'lin-source', traits: [] },
    { id: 'lin-target', traits: [] },
  ],
  populations: [
    { id: 'pop-source', lineageId: 'lin-source', regionId: 'r-provider', abundance: 20 },
    { id: 'pop-target', lineageId: 'lin-target', regionId: 'r-provider', abundance: 30 },
  ],
  interactions: [
    { id: 'edge-causal', kind: 'PREDATION', sourcePopulationId: 'pop-source', targetPopulationId: 'pop-target', intensityPpm: 100_000, assimilationPpm: 500_000 },
    { id: 'edge-association', kind: 'ASSOCIATION_ONLY', sourcePopulationId: 'pop-source', targetPopulationId: 'pop-target', intensityPpm: 0, assimilationPpm: 0 },
  ],
  regions: { 'r-provider': { resourcePool: 0, nutrientPool: 0, opportunityPpm: 500_000 } },
});
const interactionProvider = createLifeProvider({ getState: () => interactionState });
const causalInspection = interactionProvider.inspectInteraction('edge-causal');
assert.equal(causalInspection.causalWithinModel, true);
assert.equal(causalInspection.empiricalCausationClaimed, false);
assert.equal(causalInspection.source.lineageId, 'lin-source');
assert.equal(causalInspection.target.representedAbundance, 30n);
const associationInspection = interactionProvider.inspectInteraction('edge-association');
assert.equal(associationInspection.causalWithinModel, false);
assert.match(associationInspection.limitation, /non-causal/);

const variation = provider.proposeTraitVariation({
  lineageId: 'lin-provider', eventKey: 'p4:provider-variation', allowedTraitKeys: ['mobility'], maxAbsoluteDeltaPpm: 25_000,
});
assert.equal(variation.status, 'PROPOSAL_ONLY');
const witness = provider.evaluateSelection(variation, {
  regionId: 'r-provider',
  criterion: {
    profileId: 'provider-selection-fixture', traitKey: 'mobility',
    targetPpm: variation.resultingValuePpm, minimumImprovementPpm: 1, minimumOpportunityPpm: 500_000,
  },
});
assert.equal(witness.satisfied, true);
const speciationProposal = provider.proposeSpeciation(variation, witness, { eventKey: 'p4:provider-speciation' });
assert.equal(speciationProposal.status, 'EVENT_PROPOSAL_REQUIRES_EXTERNAL_P4_ADMISSION');

const succession = provider.inspectSuccession('r-provider', {
  profileId: 'provider-succession-fixture', pioneerMaxAbundance: 50, establishedMinLineages: 1, networkedMinInteractions: 1,
});
assert.equal(succession.stage, 'ESTABLISHED');
assert.equal(succession.authorityClass, 'MODEL_DERIVED_SIMULATION');
const emptyBefore = createLifeState({
  eventKey: 'fixture:empty-before', lineages: state.lineages, populations: [], interactions: [], regions: state.regions,
});
const recovery = provider.compareRecovery(emptyBefore, 'r-provider');
assert.equal(recovery.direction, 'INCREASED_REPRESENTED_ABUNDANCE');
assert.equal(recovery.causationClaimed, false);

const samples = provider.localSamples({ regionId: 'r-provider', maxSamples: 6, viewportKey: 'render-test' });
assert.equal(samples.length, 6);
assert.ok(samples.every((sample) => sample.lifecycle.authorityClass === 'MODEL_DERIVED_SIMULATION'));
assert.ok(samples.every((sample) => sample.lifecycle.representativeOnly === true && sample.lifecycle.persistentIndividualFact === false));
assert.ok(samples.every((sample) => ['JUVENILE', 'MATURE', 'SENESCENT'].includes(sample.lifecycle.stage)));
const descriptorsA = buildOrganismRenderDescriptors(samples, { quality: 'HIGH' });
const descriptorsB = buildOrganismRenderDescriptors(samples, { quality: 'HIGH' });
assert.deepEqual(descriptorsA, descriptorsB);
assert.equal(descriptorsA.length, 6);
assert.ok(descriptorsA.every((descriptor) => descriptor.authorityClass === 'PRESENTATION_ONLY'));
assert.ok(descriptorsA.every((descriptor) => descriptor.evidenceLink.representativeOnly === true));
assert.ok(descriptorsA.every((descriptor) => ['JUVENILE', 'MATURE', 'SENESCENT'].includes(descriptor.evidenceLink.representativeLifecycleStage)));
assert.ok(descriptorsA.every((descriptor) => descriptor.segmentBudget === 8));
assert.ok(descriptorsA.every((descriptor) => descriptor.primitiveFamily === 'CHAINED_ELLIPSOIDS'));

const matureState = createLifeState({
  ...state,
  eventKey: 'fixture:mature-only',
  populations: [{ ...state.populations[0], lifecycleStagePpm: { juvenile: 0, mature: PPM, senescent: 0 } }],
});
const matureSamples = createLifeProvider({ getState: () => matureState }).localSamples({ regionId: 'r-provider', maxSamples: 8, viewportKey: 'mature-only' });
assert.ok(matureSamples.every((sample) => sample.lifecycle.stage === 'MATURE'), '100% mature aggregate must materialize only representative mature stages');
const matureDescriptors = buildOrganismRenderDescriptors(matureSamples, { quality: 'BALANCED' });
assert.ok(matureDescriptors.every((descriptor) => descriptor.visualGrammar.representativeLifecycleStage === 'MATURE'));
assert.ok(matureDescriptors.every((descriptor) => descriptor.motion.authorityClass === 'PRESENTATION_ONLY'));

const culled = cullOrganismRenderDescriptors(descriptorsA, (position) => position.x >= 0);
assert.ok(culled.length <= descriptorsA.length);
assert.ok(culled.every((descriptor) => descriptor.position.x >= 0));

const capped = buildOrganismRenderDescriptors([...samples, ...samples, ...samples], { quality: 'LOW', maxDescriptors: 4 });
assert.equal(capped.length, 4);
assert.ok(capped.every((descriptor) => descriptor.segmentBudget === 3));

const stressLineages = Array.from({ length: 64 }, (_, index) => ({
  id: `stress-lineage-${index}`,
  traits: [
    { key: 'body-size', valuePpm: 100_000 + index * 10_000 },
    { key: 'mobility', valuePpm: 300_000 + index * 5_000 },
  ],
}));
const stressState = createLifeState({
  eventKey: 'fixture:stress-bound',
  lineages: stressLineages,
  populations: stressLineages.map((lineage, index) => ({
    id: `stress-population-${index}`,
    lineageId: lineage.id,
    regionId: 'stress-region',
    abundance: index + 1,
    lifecycleStagePpm: { juvenile: 200_000, mature: 700_000, senescent: 100_000 },
  })),
  interactions: [],
  regions: { 'stress-region': { resourcePool: 0, nutrientPool: 0, opportunityPpm: 500_000 } },
});
const stressProvider = createLifeProvider({ getState: () => stressState });
const stressSamplesA = stressProvider.localSamples({ regionId: 'stress-region', maxSamples: 9999, viewportKey: 'stress' });
const stressSamplesB = stressProvider.localSamples({ regionId: 'stress-region', maxSamples: 9999, viewportKey: 'stress' });
assert.equal(stressSamplesA.length, 128, 'materialization must clamp adversarial sample requests to hard product bound');
assert.deepEqual(stressSamplesA, stressSamplesB, 'maximum bounded materialization must remain deterministic');
const stressDescriptors = buildOrganismRenderDescriptors(stressSamplesA, { quality: 'LOW', maxDescriptors: 9999 });
assert.equal(stressDescriptors.length, 128, 'renderer must clamp maximum descriptor production to hard product bound');
assert.ok(stressDescriptors.every((descriptor) => descriptor.segmentBudget === 3), 'bounded stress render must preserve requested low quality grammar');

const fractionalCap = buildOrganismRenderDescriptors(samples, { quality: 'BALANCED', maxDescriptors: 2.9 });
assert.equal(fractionalCap.length, 2, 'fractional descriptor budgets must be floored deterministically');
assert.throws(() => buildOrganismRenderDescriptors(samples, { maxDescriptors: Number.NaN }), /maxDescriptors must be a non-negative finite number/);
assert.throws(() => buildOrganismRenderDescriptors(samples, { maxDescriptors: -1 }), /maxDescriptors must be a non-negative finite number/);
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], representativeOfAggregate: false }]), /representative aggregate sample required/);
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], presentation: { ...samples[0].presentation, authorityClass: 'MODEL_DERIVED_SIMULATION' } }]), /presentation-only motion descriptor required/);
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], lifecycle: { ...samples[0].lifecycle, authorityClass: 'CANONICAL_PROVEN' } }]), /representative lifecycle descriptor required/, 'lifecycle representative must not escalate authority');
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], lifecycle: { ...samples[0].lifecycle, stage: 'UNKNOWN_MAGIC_STAGE' } }]), /unsupported representative lifecycle stage/, 'unknown lifecycle stage must fail closed at render handoff');
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], position: { ...samples[0].position, x: Number.NaN } }]), /position.x must be finite/, 'non-finite spatial evidence must fail closed before renderer handoff');
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], position: { ...samples[0].position, y: 2 } }]), /position.y out of bounds/, 'out-of-domain local position must fail closed before renderer handoff');
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], presentation: { ...samples[0].presentation, motionAmplitude: Number.NaN } }]), /motionAmplitude must be finite/, 'non-finite presentation motion must fail closed');
assert.throws(() => buildOrganismRenderDescriptors([{ ...samples[0], aggregateAbundance: '400' }]), /aggregate abundance evidence must be a non-negative bigint/, 'render evidence must preserve exact aggregate abundance type');

console.log('V2X-08 life provider renderer: PASS (62 assertions)');
