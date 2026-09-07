import { LIFE_V2_LIMITS } from './model.js';

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_EMBODIMENT_INVALID: ${message}`);
}

function deterministicHash(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function unitFromHash(text) {
  return deterministicHash(text) / 0xffffffff;
}

function traitValue(lineage, key, fallback = 500_000n) {
  return lineage.traits.find((trait) => trait.key === key)?.valuePpm ?? fallback;
}

function morphologyDescriptor(lineage) {
  const mobility = traitValue(lineage, 'mobility');
  const size = traitValue(lineage, 'body-size');
  const armor = traitValue(lineage, 'structural-defense');
  const photosynthetic = traitValue(lineage, 'phototrophy');

  return Object.freeze({
    symmetry: lineage.morphology.symmetry,
    supportMode: lineage.morphology.supportMode,
    locomotionMode: lineage.morphology.locomotionMode,
    feedingMode: lineage.morphology.feedingMode,
    semanticBodyPlan: mobility > 650_000n
      ? 'MOBILE_ARTICULATED'
      : photosynthetic > 650_000n
        ? 'SESSILE_CAPTURE_SURFACE'
        : 'LOW_MOBILITY_MODULAR',
    sizeBand: size < 250_000n ? 'TINY' : size < 650_000n ? 'SMALL_TO_MEDIUM' : 'LARGE',
    defenseBand: armor < 300_000n ? 'LOW' : armor < 700_000n ? 'MODERATE' : 'HIGH',
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    limitation: 'Semantic morphology only; not a prediction of real alien anatomy.',
  });
}

function apportionSampleQuotas(populations, cap, totalAbundance, viewportKey) {
  const quotas = populations.map((population) => {
    const scaled = population.abundance * BigInt(cap);
    return {
      population,
      quota: Number(scaled / totalAbundance),
      remainder: scaled % totalAbundance,
    };
  });

  let assigned = quotas.reduce((sum, entry) => sum + entry.quota, 0);
  const remaining = Math.max(0, cap - assigned);
  if (remaining > 0) {
    const ranked = [...quotas].sort((a, b) => {
      if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
      if (a.population.abundance !== b.population.abundance) return a.population.abundance > b.population.abundance ? -1 : 1;
      const ah = deterministicHash(`${viewportKey}|apportion|${a.population.id}`);
      const bh = deterministicHash(`${viewportKey}|apportion|${b.population.id}`);
      if (ah !== bh) return ah - bh;
      return a.population.id.localeCompare(b.population.id);
    });
    for (let index = 0; index < remaining && index < ranked.length; index += 1) {
      ranked[index].quota += 1;
      assigned += 1;
    }
  }

  assert(assigned <= cap, 'sample apportionment exceeded cap');
  return quotas;
}

export function materializeLocalOrganisms(state, request) {
  assert(state?.schema === 'ofu-v2x-08-life-state-1', 'invalid life state');
  assert(request?.regionId, 'regionId required');
  const requested = Number(request.maxSamples ?? LIFE_V2_LIMITS.maxLocalSamples);
  assert(Number.isFinite(requested) && requested >= 0, 'maxSamples must be a non-negative finite number');
  const cap = Math.max(0, Math.min(Math.floor(requested), LIFE_V2_LIMITS.maxLocalSamples));
  if (cap === 0) return Object.freeze([]);

  const populations = state.populations
    .filter((population) => population.regionId === String(request.regionId) && population.abundance > 0n)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (populations.length === 0) return Object.freeze([]);

  const totalAbundance = populations.reduce((sum, population) => sum + population.abundance, 0n);
  if (totalAbundance === 0n) return Object.freeze([]);

  const viewportKey = String(request.viewportKey ?? 'local');
  const quotas = apportionSampleQuotas(populations, cap, totalAbundance, viewportKey);
  const samples = [];

  for (const { population, quota } of quotas) {
    if (quota === 0) continue;
    const lineage = state.lineages.find((candidate) => candidate.id === population.lineageId);
    assert(lineage, `lineage ${population.lineageId} missing`);

    for (let index = 0; index < quota; index += 1) {
      const sampleId = `sample:${population.id}:${state.eventKey}:${index}`;
      const seed = `${sampleId}|${viewportKey}`;
      samples.push(Object.freeze({
        id: sampleId,
        populationId: population.id,
        lineageId: population.lineageId,
        regionId: population.regionId,
        persistent: false,
        individualIdentityPromoted: false,
        representativeOfAggregate: true,
        aggregateAbundance: population.abundance,
        position: Object.freeze({
          x: unitFromHash(`${seed}|x`) * 2 - 1,
          y: unitFromHash(`${seed}|y`) * 2 - 1,
          z: unitFromHash(`${seed}|z`) * 2 - 1,
        }),
        orientationTurns: unitFromHash(`${seed}|orientation`),
        morphology: morphologyDescriptor(lineage),
        presentation: Object.freeze({
          motionPhase: unitFromHash(`${seed}|motion`),
          motionAmplitude: Number(traitValue(lineage, 'mobility')) / 1_000_000,
          authorityClass: 'PRESENTATION_ONLY',
        }),
      }));
    }
  }

  assert(samples.length <= cap, 'materialized sample count exceeded cap');
  return Object.freeze(samples);
}

export function projectSelectionToAggregate(sample, state) {
  assert(sample?.representativeOfAggregate === true, 'representative sample required');
  const population = state.populations.find((candidate) => candidate.id === sample.populationId);
  assert(population, 'sample population not present in aggregate state');
  return Object.freeze({
    selectionKind: 'MODELED_POPULATION',
    populationId: population.id,
    lineageId: population.lineageId,
    regionId: population.regionId,
    sampleId: sample.id,
    sampleIsPersistentIndividual: false,
    inferenceGuard: 'LOCAL_SAMPLE_MUST_NOT_INFER_GLOBAL_ABUNDANCE',
  });
}
