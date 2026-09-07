const PPM = 1_000_000n;

export const LIFE_V2_AUTHORITY = Object.freeze({
  class: 'MODEL_DERIVED_SIMULATION',
  abiogenesisStatus: 'NOT_MODELED',
  canonicalAlienBiology: false,
  persistentIndividualIdentity: false,
  temporalAuthority: 'P4_EXTERNAL_EVENT_ORDER',
});

export const LIFE_V2_LIMITS = Object.freeze({
  maxPopulations: 64,
  maxLineages: 128,
  maxInteractions: 256,
  maxTraitsPerLineage: 16,
  maxReplayEvents: 1024,
  maxLocalSamples: 128,
});

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_INVALID: ${message}`);
}

function asInt(value, name, min = 0n, max = 2n ** 63n - 1n) {
  const out = typeof value === 'bigint' ? value : BigInt(value);
  assert(out >= min && out <= max, `${name} out of bounds`);
  return out;
}

function asPpm(value, name) {
  return asInt(value, name, 0n, PPM);
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function sortedCopy(items, key = (x) => x.id) {
  return [...items].sort((a, b) => String(key(a)).localeCompare(String(key(b))));
}

function deterministicHash(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function deriveId(prefix, ...parts) {
  const material = parts.map((part) => String(part)).join('|');
  return `${prefix}-${deterministicHash(material).toString(16).padStart(8, '0')}`;
}

export function createLifeState(input) {
  assert(input && typeof input === 'object', 'state input required');
  const lineages = sortedCopy(input.lineages ?? []);
  const populations = sortedCopy(input.populations ?? []);
  const interactions = sortedCopy(input.interactions ?? []);

  assert(lineages.length <= LIFE_V2_LIMITS.maxLineages, 'lineage limit exceeded');
  assert(populations.length <= LIFE_V2_LIMITS.maxPopulations, 'population limit exceeded');
  assert(interactions.length <= LIFE_V2_LIMITS.maxInteractions, 'interaction limit exceeded');

  const lineageIds = new Set();
  const normalizedLineages = lineages.map((lineage) => {
    assert(lineage.id && !lineageIds.has(lineage.id), 'duplicate lineage id');
    lineageIds.add(lineage.id);
    const traits = sortedCopy(lineage.traits ?? [], (trait) => trait.key);
    assert(traits.length <= LIFE_V2_LIMITS.maxTraitsPerLineage, 'trait limit exceeded');
    return Object.freeze({
      id: String(lineage.id),
      parentId: lineage.parentId == null ? null : String(lineage.parentId),
      originEventKey: String(lineage.originEventKey ?? 'fixture:seed'),
      extinctionEventKey: lineage.extinctionEventKey == null ? null : String(lineage.extinctionEventKey),
      speciationWitness: lineage.speciationWitness ?? null,
      traits: Object.freeze(traits.map((trait) => Object.freeze({
        key: String(trait.key),
        valuePpm: asPpm(trait.valuePpm, `trait ${trait.key}`),
      }))),
      morphology: Object.freeze({
        symmetry: String(lineage.morphology?.symmetry ?? 'RADIAL_OR_BILATERAL_UNRESOLVED'),
        supportMode: String(lineage.morphology?.supportMode ?? 'UNRESOLVED'),
        locomotionMode: String(lineage.morphology?.locomotionMode ?? 'UNRESOLVED'),
        feedingMode: String(lineage.morphology?.feedingMode ?? 'UNRESOLVED'),
      }),
    });
  });

  const populationIds = new Set();
  const normalizedPopulations = populations.map((population) => {
    assert(population.id && !populationIds.has(population.id), 'duplicate population id');
    populationIds.add(population.id);
    assert(lineageIds.has(String(population.lineageId)), 'population lineage missing');
    return Object.freeze({
      id: String(population.id),
      lineageId: String(population.lineageId),
      regionId: String(population.regionId),
      abundance: asInt(population.abundance, `population ${population.id} abundance`),
      energyStore: asInt(population.energyStore ?? 0, `population ${population.id} energyStore`),
      nutrientStore: asInt(population.nutrientStore ?? 0, `population ${population.id} nutrientStore`),
      lifecycleStagePpm: Object.freeze({
        juvenile: asPpm(population.lifecycleStagePpm?.juvenile ?? 0, 'juvenile ppm'),
        mature: asPpm(population.lifecycleStagePpm?.mature ?? PPM, 'mature ppm'),
        senescent: asPpm(population.lifecycleStagePpm?.senescent ?? 0, 'senescent ppm'),
      }),
    });
  });

  for (const population of normalizedPopulations) {
    const sum = population.lifecycleStagePpm.juvenile + population.lifecycleStagePpm.mature + population.lifecycleStagePpm.senescent;
    assert(sum === PPM, `population ${population.id} lifecycle fractions must total 1e6 ppm`);
  }

  const interactionIds = new Set();
  const normalizedInteractions = interactions.map((edge) => {
    assert(edge.id && !interactionIds.has(edge.id), 'duplicate interaction id');
    interactionIds.add(edge.id);
    assert(populationIds.has(String(edge.sourcePopulationId)), 'interaction source missing');
    assert(populationIds.has(String(edge.targetPopulationId)), 'interaction target missing');
    const kind = String(edge.kind);
    assert(['PREDATION', 'PARASITISM', 'COMPETITION', 'MUTUALISM', 'RECYCLING', 'ASSOCIATION_ONLY'].includes(kind), `unsupported interaction ${kind}`);
    return Object.freeze({
      id: String(edge.id),
      kind,
      sourcePopulationId: String(edge.sourcePopulationId),
      targetPopulationId: String(edge.targetPopulationId),
      intensityPpm: asPpm(edge.intensityPpm ?? 0, `interaction ${edge.id} intensity`),
      assimilationPpm: asPpm(edge.assimilationPpm ?? 0, `interaction ${edge.id} assimilation`),
    });
  });

  const regions = Object.freeze(Object.fromEntries(Object.entries(input.regions ?? {}).map(([id, region]) => [id, Object.freeze({
    resourcePool: asInt(region.resourcePool ?? 0, `region ${id} resourcePool`),
    nutrientPool: asInt(region.nutrientPool ?? 0, `region ${id} nutrientPool`),
    disturbancePpm: asPpm(region.disturbancePpm ?? 0, `region ${id} disturbancePpm`),
    opportunityPpm: asPpm(region.opportunityPpm ?? PPM, `region ${id} opportunityPpm`),
  })])));

  return Object.freeze({
    schema: 'ofu-v2x-08-life-state-1',
    authority: LIFE_V2_AUTHORITY,
    eventKey: String(input.eventKey ?? 'fixture:seed'),
    lineages: Object.freeze(normalizedLineages),
    populations: Object.freeze(normalizedPopulations),
    interactions: Object.freeze(normalizedInteractions),
    regions,
    limitations: Object.freeze([
      'No abiogenesis inference.',
      'No universal alien biochemistry, morphology, behavior, or speciation threshold is asserted.',
      'Persistent state is aggregate population/lineage state; local organism samples are representative only.',
      'P4 remains temporal/event admission authority.',
    ]),
  });
}

function traitValue(lineage, key, fallback = 500_000n) {
  return lineage.traits.find((trait) => trait.key === key)?.valuePpm ?? fallback;
}

function populationMap(state) {
  return new Map(state.populations.map((population) => [population.id, { ...population }]));
}

function lineageMap(state) {
  return new Map(state.lineages.map((lineage) => [lineage.id, lineage]));
}

export function advanceEcology(state, event) {
  assert(state?.schema === 'ofu-v2x-08-life-state-1', 'invalid source state');
  assert(event?.type === 'LIFE_ADVANCE', 'expected LIFE_ADVANCE event');
  const populations = populationMap(state);
  const lineages = lineageMap(state);
  const regionBudgets = new Map(Object.entries(state.regions).map(([id, region]) => [id, { ...region }]));
  const profile = event.profile ?? {};

  const birthPpm = asPpm(profile.birthPpm ?? 30_000, 'birthPpm');
  const mortalityPpm = asPpm(profile.mortalityPpm ?? 20_000, 'mortalityPpm');
  const resourcePerBirth = asInt(profile.resourcePerBirth ?? 1, 'resourcePerBirth', 1n);
  const nutrientPerBirth = asInt(profile.nutrientPerBirth ?? 1, 'nutrientPerBirth', 1n);
  const maintenancePerIndividual = asInt(profile.maintenancePerIndividual ?? 1, 'maintenancePerIndividual', 0n);
  const disturbanceMortalityPpm = asPpm(profile.disturbanceMortalityPpm ?? 250_000, 'disturbanceMortalityPpm');

  const diagnostics = [];

  for (const population of sortedCopy(populations.values())) {
    if (population.abundance === 0n) continue;
    const lineage = lineages.get(population.lineageId);
    const region = regionBudgets.get(population.regionId);
    assert(region, `missing region ${population.regionId}`);

    const fecundity = traitValue(lineage, 'fecundity', 500_000n);
    const resilience = traitValue(lineage, 'resilience', 500_000n);
    const effectiveBirthPpm = birthPpm * fecundity / PPM * region.opportunityPpm / PPM;
    const requestedBirths = population.abundance * effectiveBirthPpm / PPM;
    const resourceCeiling = resourcePerBirth === 0n ? requestedBirths : region.resourcePool / resourcePerBirth;
    const nutrientCeiling = nutrientPerBirth === 0n ? requestedBirths : region.nutrientPool / nutrientPerBirth;
    const births = clamp(requestedBirths, 0n, resourceCeiling < nutrientCeiling ? resourceCeiling : nutrientCeiling);

    const disturbanceExposurePpm = region.disturbancePpm * (PPM - resilience) / PPM;
    const disturbanceDeaths = population.abundance * disturbanceExposurePpm / PPM * disturbanceMortalityPpm / PPM;
    const baselineDeaths = population.abundance * mortalityPpm / PPM;
    const maintenanceDemand = population.abundance * maintenancePerIndividual;
    const maintenanceShortfall = maintenanceDemand > region.resourcePool ? maintenanceDemand - region.resourcePool : 0n;
    const starvationDeaths = maintenancePerIndividual === 0n ? 0n : clamp(maintenanceShortfall / maintenancePerIndividual, 0n, population.abundance);
    const deaths = clamp(baselineDeaths + disturbanceDeaths + starvationDeaths, 0n, population.abundance + births);

    region.resourcePool = clamp(region.resourcePool - births * resourcePerBirth - (maintenanceDemand < region.resourcePool ? maintenanceDemand : region.resourcePool), 0n, 2n ** 63n - 1n);
    region.nutrientPool = clamp(region.nutrientPool - births * nutrientPerBirth, 0n, 2n ** 63n - 1n);
    population.abundance = population.abundance + births - deaths;
    population.energyStore = population.energyStore + births;

    diagnostics.push(Object.freeze({ populationId: population.id, births, deaths, abundance: population.abundance }));
  }

  for (const edge of state.interactions) {
    if (edge.kind === 'ASSOCIATION_ONLY' || edge.intensityPpm === 0n) continue;
    const source = populations.get(edge.sourcePopulationId);
    const target = populations.get(edge.targetPopulationId);
    if (!source || !target || source.abundance === 0n || target.abundance === 0n) continue;

    const encounterBase = source.abundance < target.abundance ? source.abundance : target.abundance;
    const pressure = encounterBase * edge.intensityPpm / PPM;
    if (edge.kind === 'PREDATION' || edge.kind === 'PARASITISM') {
      const removed = clamp(pressure, 0n, target.abundance);
      target.abundance -= removed;
      source.energyStore += removed * edge.assimilationPpm / PPM;
    } else if (edge.kind === 'COMPETITION') {
      const sourceLoss = clamp(pressure / 2n, 0n, source.abundance);
      const targetLoss = clamp(pressure - sourceLoss, 0n, target.abundance);
      source.abundance -= sourceLoss;
      target.abundance -= targetLoss;
    } else if (edge.kind === 'MUTUALISM') {
      source.energyStore += pressure * edge.assimilationPpm / PPM;
      target.energyStore += pressure * edge.assimilationPpm / PPM;
    } else if (edge.kind === 'RECYCLING') {
      const region = regionBudgets.get(target.regionId);
      if (region) region.nutrientPool += pressure;
    }
  }

  const next = createLifeState({
    eventKey: String(event.eventKey),
    lineages: state.lineages,
    populations: [...populations.values()],
    interactions: state.interactions,
    regions: Object.fromEntries(regionBudgets),
  });
  return Object.freeze({ state: next, diagnostics: Object.freeze(diagnostics) });
}

export function applyLineageEvent(state, event) {
  assert(state?.schema === 'ofu-v2x-08-life-state-1', 'invalid source state');
  assert(event?.eventKey, 'eventKey required');
  const lineages = [...state.lineages];
  const populations = [...state.populations];

  if (event.type === 'SPECIATION') {
    const parent = state.lineages.find((lineage) => lineage.id === event.parentLineageId);
    assert(parent, 'speciation parent missing');
    assert(event.criterionWitness?.satisfied === true, 'speciation requires explicit satisfied criterion witness');
    assert(state.lineages.length < LIFE_V2_LIMITS.maxLineages, 'lineage lifetime bound reached');
    const childId = event.childLineageId ?? deriveId('lineage', parent.id, event.eventKey, JSON.stringify(event.criterionWitness));
    assert(!state.lineages.some((lineage) => lineage.id === childId), 'child lineage already exists');
    const traits = parent.traits.map((trait) => ({ ...trait }));
    for (const delta of event.traitDeltasPpm ?? []) {
      const trait = traits.find((candidate) => candidate.key === delta.key);
      if (trait) trait.valuePpm = clamp(trait.valuePpm + BigInt(delta.deltaPpm), 0n, PPM);
    }
    lineages.push({
      ...parent,
      id: childId,
      parentId: parent.id,
      originEventKey: event.eventKey,
      extinctionEventKey: null,
      speciationWitness: Object.freeze({ ...event.criterionWitness }),
      traits,
      morphology: Object.freeze({ ...parent.morphology, ...(event.morphology ?? {}) }),
    });
    return createLifeState({ ...state, eventKey: event.eventKey, lineages, populations });
  }

  if (event.type === 'EXTINCTION') {
    const lineage = state.lineages.find((candidate) => candidate.id === event.lineageId);
    assert(lineage, 'extinction lineage missing');
    const total = state.populations.filter((population) => population.lineageId === lineage.id).reduce((sum, population) => sum + population.abundance, 0n);
    assert(total === 0n, 'formal extinction requires represented aggregate abundance exactly zero');
    const replaced = lineages.map((candidate) => candidate.id === lineage.id
      ? { ...candidate, extinctionEventKey: String(event.eventKey) }
      : candidate);
    return createLifeState({ ...state, eventKey: event.eventKey, lineages: replaced, populations });
  }

  throw new Error(`LIFE_V2_INVALID: unsupported lineage event ${event.type}`);
}

export function replayLife(initialState, events) {
  assert(Array.isArray(events), 'events array required');
  assert(events.length <= LIFE_V2_LIMITS.maxReplayEvents, 'replay event bound exceeded');
  let current = initialState;
  for (const event of events) {
    if (event.type === 'LIFE_ADVANCE') current = advanceEcology(current, event).state;
    else if (event.type === 'SPECIATION' || event.type === 'EXTINCTION') current = applyLineageEvent(current, event);
    else throw new Error(`LIFE_V2_INVALID: event type ${event.type} not admitted by life model`);
  }
  return current;
}

export function summarizeLifeState(state) {
  const activeLineages = state.lineages.filter((lineage) => lineage.extinctionEventKey == null).length;
  const totalAbundance = state.populations.reduce((sum, population) => sum + population.abundance, 0n);
  return Object.freeze({
    eventKey: state.eventKey,
    lineageCount: state.lineages.length,
    activeLineages,
    populationCount: state.populations.length,
    totalAbundance,
    authorityClass: state.authority.class,
  });
}
