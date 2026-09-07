const PPM = 1_000_000n;
const MAX_INT = 2n ** 63n - 1n;

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

function asInt(value, name, min = 0n, max = MAX_INT) {
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

function boundedAdd(value, delta) {
  return clamp(value + delta, 0n, MAX_INT);
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

function sumBigInt(values) {
  let total = 0n;
  for (const value of values) total += value;
  return total;
}

function proportionalAllocations(requests, capacity) {
  const totalDemand = sumBigInt(requests.map((request) => request.demand));
  const boundedCapacity = clamp(capacity, 0n, totalDemand);
  if (totalDemand === 0n) return new Map(requests.map((request) => [request.id, 0n]));
  if (boundedCapacity === totalDemand) return new Map(requests.map((request) => [request.id, request.demand]));
  return new Map(requests.map((request) => [
    request.id,
    request.demand * boundedCapacity / totalDemand,
  ]));
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
  assert(event?.eventKey, 'eventKey required');
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

  const demographicPlans = new Map();
  const diagnostics = [];

  for (const [regionId, region] of regionBudgets.entries()) {
    const regionPopulations = state.populations.filter((population) => population.regionId === regionId && population.abundance > 0n);
    if (regionPopulations.length === 0) continue;

    const requests = regionPopulations.map((population) => {
      const lineage = lineages.get(population.lineageId);
      assert(lineage, `missing lineage ${population.lineageId}`);
      const fecundity = traitValue(lineage, 'fecundity', 500_000n);
      const resilience = traitValue(lineage, 'resilience', 500_000n);
      const effectiveBirthPpm = birthPpm * fecundity / PPM * region.opportunityPpm / PPM;
      const requestedBirths = population.abundance * effectiveBirthPpm / PPM;
      const disturbanceExposurePpm = region.disturbancePpm * (PPM - resilience) / PPM;
      const disturbanceDeaths = population.abundance * disturbanceExposurePpm / PPM * disturbanceMortalityPpm / PPM;
      const baselineDeaths = population.abundance * mortalityPpm / PPM;
      return {
        id: population.id,
        abundance: population.abundance,
        requestedBirths,
        disturbanceDeaths,
        baselineDeaths,
      };
    });

    const totalAbundance = sumBigInt(requests.map((request) => request.abundance));
    let maintenanceSupported;
    let maintenanceConsumed = 0n;
    if (maintenancePerIndividual === 0n) {
      maintenanceSupported = new Map(requests.map((request) => [request.id, request.abundance]));
    } else {
      const maintenanceCapacity = region.resourcePool / maintenancePerIndividual;
      maintenanceSupported = proportionalAllocations(
        requests.map((request) => ({ id: request.id, demand: request.abundance })),
        clamp(maintenanceCapacity, 0n, totalAbundance),
      );
      maintenanceConsumed = sumBigInt([...maintenanceSupported.values()]) * maintenancePerIndividual;
    }

    const resourceAfterMaintenance = clamp(region.resourcePool - maintenanceConsumed, 0n, MAX_INT);
    const totalRequestedBirths = sumBigInt(requests.map((request) => request.requestedBirths));
    const resourceBirthCapacity = resourceAfterMaintenance / resourcePerBirth;
    const nutrientBirthCapacity = region.nutrientPool / nutrientPerBirth;
    const birthCapacity = clamp(
      resourceBirthCapacity < nutrientBirthCapacity ? resourceBirthCapacity : nutrientBirthCapacity,
      0n,
      totalRequestedBirths,
    );
    const birthAllocations = proportionalAllocations(
      requests.map((request) => ({ id: request.id, demand: request.requestedBirths })),
      birthCapacity,
    );
    const totalBirths = sumBigInt([...birthAllocations.values()]);

    for (const request of requests) {
      const births = birthAllocations.get(request.id) ?? 0n;
      const supported = maintenanceSupported.get(request.id) ?? 0n;
      const starvationDeaths = clamp(request.abundance - supported, 0n, request.abundance);
      const deaths = clamp(
        request.baselineDeaths + request.disturbanceDeaths + starvationDeaths,
        0n,
        request.abundance + births,
      );
      demographicPlans.set(request.id, Object.freeze({ births, deaths }));
    }

    region.resourcePool = clamp(resourceAfterMaintenance - totalBirths * resourcePerBirth, 0n, MAX_INT);
    region.nutrientPool = clamp(region.nutrientPool - totalBirths * nutrientPerBirth, 0n, MAX_INT);
  }

  for (const population of state.populations) {
    if (population.abundance === 0n) continue;
    assert(regionBudgets.has(population.regionId), `missing region ${population.regionId}`);
    const mutable = populations.get(population.id);
    const plan = demographicPlans.get(population.id) ?? Object.freeze({ births: 0n, deaths: 0n });
    mutable.abundance = population.abundance + plan.births - plan.deaths;
    mutable.energyStore = boundedAdd(population.energyStore, plan.births);
    diagnostics.push(Object.freeze({
      populationId: population.id,
      births: plan.births,
      deaths: plan.deaths,
      abundance: mutable.abundance,
    }));
  }

  const interactionSnapshot = new Map([...populations.entries()].map(([id, population]) => [id, { ...population }]));
  const rawLossByPopulation = new Map(state.populations.map((population) => [population.id, 0n]));
  const interactionPlans = [];

  for (const edge of state.interactions) {
    if (edge.kind === 'ASSOCIATION_ONLY' || edge.intensityPpm === 0n) continue;
    const source = interactionSnapshot.get(edge.sourcePopulationId);
    const target = interactionSnapshot.get(edge.targetPopulationId);
    if (!source || !target || source.abundance === 0n || target.abundance === 0n) continue;

    const encounterBase = source.abundance < target.abundance ? source.abundance : target.abundance;
    const pressure = encounterBase * edge.intensityPpm / PPM;
    let sourceLoss = 0n;
    let targetLoss = 0n;
    if (edge.kind === 'PREDATION' || edge.kind === 'PARASITISM') {
      targetLoss = pressure;
    } else if (edge.kind === 'COMPETITION') {
      sourceLoss = pressure / 2n;
      targetLoss = pressure - sourceLoss;
    }
    if (sourceLoss > 0n) rawLossByPopulation.set(source.id, (rawLossByPopulation.get(source.id) ?? 0n) + sourceLoss);
    if (targetLoss > 0n) rawLossByPopulation.set(target.id, (rawLossByPopulation.get(target.id) ?? 0n) + targetLoss);
    interactionPlans.push(Object.freeze({ edge, pressure, sourceLoss, targetLoss }));
  }

  function scaledInteractionLoss(populationId, rawLoss) {
    if (rawLoss === 0n) return 0n;
    const population = interactionSnapshot.get(populationId);
    const totalRawLoss = rawLossByPopulation.get(populationId) ?? 0n;
    if (!population || totalRawLoss === 0n) return 0n;
    if (totalRawLoss <= population.abundance) return rawLoss;
    return rawLoss * population.abundance / totalRawLoss;
  }

  const interactionDeltas = new Map(state.populations.map((population) => [population.id, { abundanceLoss: 0n, energyGain: 0n }]));

  for (const plan of interactionPlans) {
    const { edge, pressure } = plan;
    const sourceDelta = interactionDeltas.get(edge.sourcePopulationId);
    const targetDelta = interactionDeltas.get(edge.targetPopulationId);
    if (!sourceDelta || !targetDelta) continue;

    if (edge.kind === 'PREDATION' || edge.kind === 'PARASITISM') {
      const removed = scaledInteractionLoss(edge.targetPopulationId, plan.targetLoss);
      targetDelta.abundanceLoss += removed;
      sourceDelta.energyGain += removed * edge.assimilationPpm / PPM;
    } else if (edge.kind === 'COMPETITION') {
      sourceDelta.abundanceLoss += scaledInteractionLoss(edge.sourcePopulationId, plan.sourceLoss);
      targetDelta.abundanceLoss += scaledInteractionLoss(edge.targetPopulationId, plan.targetLoss);
    } else if (edge.kind === 'MUTUALISM') {
      const gain = pressure * edge.assimilationPpm / PPM;
      sourceDelta.energyGain += gain;
      targetDelta.energyGain += gain;
    } else if (edge.kind === 'RECYCLING') {
      const target = interactionSnapshot.get(edge.targetPopulationId);
      const region = target ? regionBudgets.get(target.regionId) : null;
      if (region) region.nutrientPool = boundedAdd(region.nutrientPool, pressure);
    }
  }

  for (const [populationId, snapshot] of interactionSnapshot.entries()) {
    const delta = interactionDeltas.get(populationId) ?? { abundanceLoss: 0n, energyGain: 0n };
    const mutable = populations.get(populationId);
    mutable.abundance = clamp(snapshot.abundance - delta.abundanceLoss, 0n, MAX_INT);
    mutable.energyStore = boundedAdd(snapshot.energyStore, delta.energyGain);
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
