import { summarizeLifeState } from './model.js';
import { materializeLocalOrganisms } from './embodiment.js';

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_PROVIDER_INVALID: ${message}`);
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
    'LIFE_LOCAL_REPRESENTATIVE_SAMPLES',
  ]),
  exclusions: Object.freeze([
    'ABIogenesis',
    'CANONICAL_ALIEN_BIOLOGY',
    'PERSISTENT_PERSON_IDENTITY',
    'P4_EVENT_ADMISSION',
    'GLOBAL_ABUNDANCE_FROM_LOCAL_SAMPLE',
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
        authorityClass: 'MODEL_DERIVED_SIMULATION',
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

    localSamples(request) {
      return materializeLocalOrganisms(state(), request);
    },
  });
}
