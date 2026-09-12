import { advanceEcology, summarizeLifeState } from './model.js';
import { materializeLocalOrganisms } from './embodiment.js';
import {
  proposeTraitVariation,
  evaluateSelectionCriterion,
  buildSpeciationProposal,
} from './evolution.js';
import {
  applyDispersal,
  describeSuccession,
  compareRecovery,
} from './succession.js';

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_PROVIDER_INVALID: ${message}`);
}

function buildAdvanceWitness(source, result, event) {
  const diagnosticByPopulation = new Map(result.diagnostics.map((entry) => [entry.populationId, entry]));
  const regions = Object.keys(source.regions).sort().map((regionId) => {
    const before = source.regions[regionId];
    const after = result.state.regions[regionId];
    assert(after, `simulation removed upstream region ${regionId}`);
    const sourcePopulations = source.populations.filter((population) => population.regionId === regionId);
    let births = 0n;
    let demographicDeaths = 0n;
    for (const population of sourcePopulations) {
      const diagnostic = diagnosticByPopulation.get(population.id);
      if (!diagnostic) continue;
      births += diagnostic.births;
      demographicDeaths += diagnostic.deaths;
    }
    return Object.freeze({
      regionId,
      resourceBefore: before.resourcePool,
      resourceAfter: after.resourcePool,
      resourceDelta: after.resourcePool - before.resourcePool,
      nutrientBefore: before.nutrientPool,
      nutrientAfter: after.nutrientPool,
      nutrientDelta: after.nutrientPool - before.nutrientPool,
      representedBirths: births,
      representedDemographicDeaths: demographicDeaths,
      authorityClass: 'MODEL_DERIVED_SIMULATION',
    });
  });

  return Object.freeze({
    schema: 'ofu-v2x-08-life-advance-witness-1',
    sourceEventKey: source.eventKey,
    eventKey: String(event.eventKey),
    regions: Object.freeze(regions),
    empiricalCausationClaimed: false,
    environmentMutationAuthorityClaimed: false,
    eventAdmissionPerformed: false,
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    limitation: 'This witness reports exact bounded model transition deltas; it does not establish empirical ecological causation or authority over the upstream environment.',
  });
}

export const LIFE_V2_PROVIDER_DESCRIPTOR = Object.freeze({
  id: 'ofu.v2x-08.life-ecology-evolution-embodiment',
  version: '2.0.0-exploration',
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  capabilities: Object.freeze([
    'LIFE_AGGREGATE_SUMMARY',
    'LIFE_LINEAGE_INSPECTION',
    'LIFE_POPULATION_INSPECTION',
    'LIFE_INTERACTION_INSPECTION',
    'LIFE_REGION_INSPECTION',
    'LIFE_LIFECYCLE_COMPOSITION',
    'LIFE_ADVANCE_SIMULATION',
    'LIFE_ADVANCE_TRANSITION_WITNESS',
    'LIFE_DISPERSAL_SIMULATION',
    'LIFE_LOCAL_REPRESENTATIVE_SAMPLES',
    'LIFE_REPRESENTATIVE_LIFECYCLE_SAMPLE',
    'LIFE_BEHAVIOR_OPPORTUNITY',
    'LIFE_TRAIT_VARIATION_PROPOSAL',
    'LIFE_SELECTION_CRITERION_WITNESS',
    'LIFE_SPECIATION_EVENT_PROPOSAL',
    'LIFE_SUCCESSION_INSPECTION',
    'LIFE_RECOVERY_COMPARISON',
  ]),
  exclusions: Object.freeze([
    'ABIOGENESIS',
    'CANONICAL_ALIEN_BIOLOGY',
    'PERSISTENT_PERSON_IDENTITY',
    'P4_EVENT_ADMISSION',
    'GLOBAL_ABUNDANCE_FROM_LOCAL_SAMPLE',
    'UNIVERSAL_SPECIES_THRESHOLD',
    'UNIVERSAL_MUTATION_RATE',
    'UNIVERSAL_LIFECYCLE_RATE',
    'EMPIRICAL_ETHOLOGY',
    'COGNITION_INFERENCE',
    'MOLECULAR_GENETICS',
    'ENVIRONMENT_MUTATION_AUTHORITY',
  ]),
});

export function createLifeProvider({ getState }) {
  assert(typeof getState === 'function', 'getState function required');

  function state() {
    const value = getState();
    assert(value?.schema === 'ofu-v2x-08-life-state-1', 'provider received invalid life state');
    return value;
  }

  return Object.freeze({
    descriptor: LIFE_V2_PROVIDER_DESCRIPTOR,

    summary() {
      return summarizeLifeState(state());
    },

    inspectLineage(lineageId) {
      const current = state();
      const lineage = current.lineages.find((candidate) => candidate.id === String(lineageId));
      if (!lineage) return null;
      const populations = current.populations.filter((population) => population.lineageId === lineage.id);
      const aggregateAbundance = populations.reduce((sum, population) => sum + population.abundance, 0n);
      return Object.freeze({
        ...lineage,
        aggregateAbundance,
        populationIds: Object.freeze(populations.map((population) => population.id).sort()),
        authorityClass: 'MODEL_DERIVED_SIMULATION',
        limitations: current.limitations,
      });
    },

    inspectPopulation(populationId) {
      const current = state();
      const population = current.populations.find((candidate) => candidate.id === String(populationId));
      if (!population) return null;
      const incoming = current.interactions.filter((edge) => edge.targetPopulationId === population.id);
      const outgoing = current.interactions.filter((edge) => edge.sourcePopulationId === population.id);
      return Object.freeze({
        ...population,
        incomingInteractionIds: Object.freeze(incoming.map((edge) => edge.id).sort()),
        outgoingInteractionIds: Object.freeze(outgoing.map((edge) => edge.id).sort()),
        lifecycleSemantics: 'PROFILE_BOUND_AGGREGATE_COMPOSITION',
        authorityClass: 'MODEL_DERIVED_SIMULATION',
      });
    },

    inspectInteraction(interactionId) {
      const current = state();
      const interaction = current.interactions.find((candidate) => candidate.id === String(interactionId));
      if (!interaction) return null;
      const source = current.populations.find((population) => population.id === interaction.sourcePopulationId);
      const target = current.populations.find((population) => population.id === interaction.targetPopulationId);
      assert(source && target, `interaction ${interaction.id} endpoints missing from aggregate state`);
      return Object.freeze({
        ...interaction,
        source: Object.freeze({
          populationId: source.id,
          lineageId: source.lineageId,
          regionId: source.regionId,
          representedAbundance: source.abundance,
        }),
        target: Object.freeze({
          populationId: target.id,
          lineageId: target.lineageId,
          regionId: target.regionId,
          representedAbundance: target.abundance,
        }),
        causalWithinModel: interaction.kind !== 'ASSOCIATION_ONLY',
        empiricalCausationClaimed: false,
        authorityClass: 'MODEL_DERIVED_SIMULATION',
        limitation: interaction.kind === 'ASSOCIATION_ONLY'
          ? 'Association-only edges are explicitly non-causal in this model.'
          : 'Causal semantics are bounded to this explicit model interaction and are not empirical validation.',
      });
    },

    inspectRegion(regionId) {
      const current = state();
      const region = current.regions[String(regionId)];
      if (!region) return null;
      const populations = current.populations.filter((population) => population.regionId === String(regionId));
      return Object.freeze({
        regionId: String(regionId),
        resourcePool: region.resourcePool,
        nutrientPool: region.nutrientPool,
        disturbancePpm: region.disturbancePpm,
        opportunityPpm: region.opportunityPpm,
        populationIds: Object.freeze(populations.map((population) => population.id).sort()),
        totalRepresentedAbundance: populations.reduce((sum, population) => sum + population.abundance, 0n),
        authorityClass: 'MODEL_DERIVED_SIMULATION',
      });
    },

    simulateAdvance(event) {
      const current = state();
      const result = advanceEcology(current, event);
      return Object.freeze({
        ...result,
        transitionWitness: buildAdvanceWitness(current, result, event),
        sourceEventKey: current.eventKey,
        eventAdmissionPerformed: false,
        authorityClass: 'MODEL_DERIVED_SIMULATION',
      });
    },

    simulateDispersal(event) {
      const current = state();
      const result = applyDispersal(current, event);
      return Object.freeze({
        ...result,
        sourceEventKey: current.eventKey,
        eventAdmissionPerformed: false,
        authorityClass: 'MODEL_DERIVED_SIMULATION',
      });
    },

    localSamples(request) {
      return materializeLocalOrganisms(state(), request);
    },

    proposeTraitVariation(request) {
      return proposeTraitVariation(state(), request);
    },

    evaluateSelection(proposal, request) {
      return evaluateSelectionCriterion(state(), proposal, request);
    },

    proposeSpeciation(proposal, witness, request) {
      return buildSpeciationProposal(proposal, witness, request);
    },

    inspectSuccession(regionId, profile) {
      return describeSuccession(state(), regionId, profile);
    },

    compareRecovery(beforeState, regionId) {
      return compareRecovery(beforeState, state(), regionId);
    },
  });
}
