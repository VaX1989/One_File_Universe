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

function largestRemainderShares(items, totalUnits) {
  const units = asInt(totalUnits, 'share totalUnits');
  const totalWeight = sumBigInt(items.map((item) => item.weight));
  if (totalWeight === 0n) {
    assert(units === 0n, 'cannot distribute positive units across zero total weight');
    return new Map(items.map((item) => [item.id, 0n]));
  }

  const shares = items.map((item) => {
    const scaled = item.weight * units;
    return {
      id: item.id,
      tieKey: String(item.tieKey ?? item.id),
      share: scaled / totalWeight,
      remainder: scaled % totalWeight,
    };
  });
  const assigned = sumBigInt(shares.map((entry) => entry.share));
  const residual = units - assigned;
  assert(residual >= 0n && residual <= BigInt(shares.length), 'largest-remainder residual out of bounds');

  if (residual > 0n) {
    const ranked = [...shares].sort((a, b) => {
      if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
      const byTieKey = a.tieKey.localeCompare(b.tieKey);
      if (byTieKey !== 0) return byTieKey;
      return String(a.id).localeCompare(String(b.id));
    });
    for (let index = 0; index < Number(residual); index += 1) ranked[index].share += 1n;
  }

  return new Map(shares.map((entry) => [entry.id, entry.share]));
}

function proportionalAllocations(requests, capacity) {
  const totalDemand = sumBigInt(requests.map((request) => request.demand));
  const boundedCapacity = clamp(capacity, 0n, totalDemand);
  if (totalDemand === 0n) return new Map(requests.map((request) => [request.id, 0n]));
  if (boundedCapacity === totalDemand) return new Map(requests.map((request) => [request.id, request.demand]));
  return largestRemainderShares(
    requests.map((request) => ({ id: request.id, tieKey: request.tieKey, weight: request.demand })),
    boundedCapacity,
  );
}

function lifecycleStageCounts(population) {
  return largestRemainderShares([
    { id: 'juvenile', tieKey: '0-juvenile', weight: population.lifecycleStagePpm.juvenile },
    { id: 'mature', tieKey: '1-mature', weight: population.lifecycleStagePpm.mature },
    { id: 'senescent', tieKey: '2-senescent', weight: population.lifecycleStagePpm.senescent },
  ], population.abundance);
}

function lifecycleStagePpmFromCounts(counts, priorStagePpm) {
  const total = counts.juvenile + counts.mature + counts.senescent;
  if (total === 0n) return Object.freeze({ ...priorStagePpm });
  const ppm = largestRemainderShares([
    { id: 'juvenile', tieKey: '0-juvenile', weight: counts.juvenile },
    { id: 'mature', tieKey: '1-mature', weight: counts.mature },
    { id: 'senescent', tieKey: '2-senescent', weight: counts.senescent },
  ], PPM);
  return Object.freeze({
    juvenile: ppm.get('juvenile') ?? 0n,
    mature: ppm.get('mature') ?? 0n,
    senescent: ppm.get('senescent') ?? 0n,
  });
}

function advanceLifecycleComposition(population, births, deaths, juvenileMaturationPpm, matureSenescencePpm) {
  const priorCounts = lifecycleStageCounts(population);
  const counts = {
    juvenile: (priorCounts.get('juvenile') ?? 0n) + births,
    mature: priorCounts.get('mature') ?? 0n,
    senescent: priorCounts.get('senescent') ?? 0n,
  };
  const postBirthTotal = counts.juvenile + counts.mature + counts.senescent;
  assert(postBirthTotal === population.abundance + births, 'lifecycle birth accounting mismatch');

  const deathShares = proportionalAllocations([
    { id: 'juvenile', tieKey: '0-juvenile', demand: counts.juvenile },
    { id: 'mature', tieKey: '1-mature', demand: counts.mature },
    { id: 'senescent', tieKey: '2-senescent', demand: counts.senescent },
  ], deaths);
  counts.juvenile -= deathShares.get('juvenile') ?? 0n;
  counts.mature -= deathShares.get('mature') ?? 0n;
  counts.senescent -= deathShares.get('senescent') ?? 0n;

  const matureBeforeTransition = counts.mature;
  const maturation = counts.juvenile * juvenileMaturationPpm / PPM;
  const senescence = matureBeforeTransition * matureSenescencePpm / PPM;
  counts.juvenile -= maturation;
  counts.mature = counts.mature + maturation - senescence;
  counts.senescent += senescence;

  const survivorTotal = counts.juvenile + counts.mature + counts.senescent;
  assert(survivorTotal === population.abundance + births - deaths, 'lifecycle survivor accounting mismatch');
  return lifecycleStagePpmFromCounts(counts, population.lifecycleStagePpm);
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
    assert(lineage.id && !lineageIds.has(String(lineage.id)), 'duplicate lineage id');
    lineageIds.add(String(lineage.id));
    const traits = sortedCopy(lineage.traits ?? [], (trait) => trait.key);
    assert(traits.length <= LIFE_V2_LIMITS.maxTraitsPerLineage, 'trait limit exceeded');
    const traitKeys = new Set();
    const normalizedTraits = traits.map((trait) => {
      const key = String(trait.key);
      assert(key && !traitKeys.has(key), `duplicate trait key ${key}`);
      traitKeys.add(key);
      return Object.freeze({ key, valuePpm: asPpm(trait.valuePpm, `trait ${trait.key}`) });
    });
    return Object.freeze({
      id: String(lineage.id),
      parentId: lineage.parentId == null ? null : String(lineage.parentId),
      originEventKey: String(lineage.originEventKey ?? 'fixture:seed'),
      extinctionEventKey: lineage.extinctionEventKey == null ? null : String(lineage.extinctionEventKey),
      speciationWitness: lineage.speciationWitness ?? null,
      traits: Object.freeze(normalizedTraits),
      morphology: Object.freeze({
        symmetry: String(lineage.morphology?.symmetry ?? 'RADIAL_OR_BILATERAL_UNRESOLVED'),
        supportMode: String(lineage.morphology?.supportMode ?? 'UNRESOLVED'),
        locomotionMode: String(lineage.morphology?.locomotionMode ?? 'UNRESOLVED'),
        feedingMode: String(lineage.morphology?.feedingMode ?? 'UNRESOLVED'),
      }),
    });
  });

  const lineageById = new Map(normalizedLineages.map((lineage) => [lineage.id, lineage]));
  for (const lineage of normalizedLineages) {
    if (lineage.parentId == null) continue;
    assert(lineage.parentId !== lineage.id, `lineage ${lineage.id} cannot parent itself`);
    assert(lineageById.has(lineage.parentId), `lineage ${lineage.id} parent missing`);
    const visited = new Set([lineage.id]);
    let cursor = lineage.parentId;
    while (cursor != null) {
      assert(!visited.has(cursor), `lineage parent cycle detected at ${cursor}`);
      visited.add(cursor);
      const parent = lineageById.get(cursor);
      assert(parent, `lineage ${cursor} parent missing`);
      cursor = parent.parentId;
    }
  }

  const populationIds = new Set();
  const aggregateKeys = new Set();
  const normalizedPopulations = populations.map((population) => {
    assert(population.id && !populationIds.has(String(population.id)), 'duplicate population id');
    populationIds.add(String(population.id));
    assert(lineageIds.has(String(population.lineageId)), 'population lineage missing');
    const lineageId = String(population.lineageId);
    const regionId = String(population.regionId);
    const aggregateKey = `${lineageId}\u0000${regionId}`;
    assert(!aggregateKeys.has(aggregateKey), `multiple population aggregates for lineage ${lineageId} in region ${regionId}`);
    aggregateKeys.add(aggregateKey);
    return Object.freeze({
      id: String(population.id),
      lineageId,
      regionId,
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

  const representedByLineage = new Map(normalizedLineages.map((lineage) => [lineage.id, 0n]));
  for (const population of normalizedPopulations) {
    representedByLineage.set(population.lineageId, (representedByLineage.get(population.lineageId) ?? 0n) + population.abundance);
  }
  for (const lineage of normalizedLineages) {
    if (lineage.extinctionEventKey != null) {
      assert((representedByLineage.get(lineage.id) ?? 0n) === 0n, `formally extinct lineage ${lineage.id} has represented abundance`);
    }
  }

  const interactionIds = new Set();
  const normalizedInteractions = interactions.map((edge) => {
    assert(edge.id && !interactionIds.has(String(edge.id)), 'duplicate interaction id');
    interactionIds.add(String(edge.id));
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

  for (const population of normalizedPopulations) {
    assert(Object.hasOwn(regions, population.regionId), `population ${population.id} region missing`);
  }

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
      'No universal alien biochemistry, morphology, behavior, lifecycle rate, or speciation threshold is asserted.',
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
  const juvenileMaturationPpm = asPpm(profile.juvenileMaturationPpm ?? 0, 'juvenileMaturationPpm');
  const matureSenescencePpm = asPpm(profile.matureSenescencePpm ?? 0, 'matureSenescencePpm');

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
        tieKey: population.lineageId,
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
        requests.map((request) => ({ id: request.id, tieKey: request.tieKey, demand: request.abundance })),
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
      requests.map((request) => ({ id: request.id, tieKey: request.tieKey, demand: request.requestedBirths })),
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
    mutable.lifecycleStagePpm = advanceLifecycleComposition(
      population,
      plan.births,
      plan.deaths,
      juvenileMaturationPpm,
      matureSenescencePpm,
    );
    diagnostics.push(Object.freeze({
      populationId: population.id,
      births: plan.births,
      deaths: plan.deaths,
      abundance: mutable.abundance,
      lifecycleStagePpm: mutable.lifecycleStagePpm,
    }));
  }

  const interactionSnapshot = new Map([...populations.entries()].map(([id, population]) => [id, { ...population }]));
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
    interactionPlans.push(Object.freeze({
      edge,
      pressure,
      sourceLoss,
      targetLoss,
      sourceClaimId: `${edge.id}:source-loss`,
      targetClaimId: `${edge.id}:target-loss`,
      sourceTieKey: `${edge.kind}|${source.lineageId}|${target.lineageId}|source`,
      targetTieKey: `${edge.kind}|${source.lineageId}|${target.lineageId}|target`,
    }));
  }

  const allocatedInteractionLoss = new Map();
  for (const [populationId, population] of interactionSnapshot.entries()) {
    const claims = [];
    for (const plan of interactionPlans) {
      if (plan.sourceLoss > 0n && plan.edge.sourcePopulationId === populationId) {
        claims.push({ id: plan.sourceClaimId, tieKey: plan.sourceTieKey, demand: plan.sourceLoss });
      }
      if (plan.targetLoss > 0n && plan.edge.targetPopulationId === populationId) {
        claims.push({ id: plan.targetClaimId, tieKey: plan.targetTieKey, demand: plan.targetLoss });
      }
    }
    const allocations = proportionalAllocations(claims, population.abundance);
    for (const [claimId, loss] of allocations.entries()) allocatedInteractionLoss.set(claimId, loss);
  }

  const interactionDeltas = new Map(state.populations.map((population) => [population.id, { abundanceLoss: 0n, energyGain: 0n }]));

  for (const plan of interactionPlans) {
    const { edge, pressure } = plan;
    const sourceDelta = interactionDeltas.get(edge.sourcePopulationId);
    const targetDelta = interactionDeltas.get(edge.targetPopulationId);
    if (!sourceDelta || !targetDelta) continue;

    if (edge.kind === 'PREDATION' || edge.kind === 'PARASITISM') {
      const removed = allocatedInteractionLoss.get(plan.targetClaimId) ?? 0n;
      targetDelta.abundanceLoss += removed;
      sourceDelta.energyGain += removed * edge.assimilationPpm / PPM;
    } else if (edge.kind === 'COMPETITION') {
      sourceDelta.abundanceLoss += allocatedInteractionLoss.get(plan.sourceClaimId) ?? 0n;
      targetDelta.abundanceLoss += allocatedInteractionLoss.get(plan.targetClaimId) ?? 0n;
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
    assert(parent.extinctionEventKey == null, 'cannot speciate from a formally extinct lineage');
    assert(event.criterionWitness?.satisfied === true, 'speciation requires explicit satisfied criterion witness');
    assert(state.lineages.length < LIFE_V2_LIMITS.maxLineages, 'lineage lifetime bound reached');
    const childId = event.childLineageId ?? deriveId('lineage', parent.id, event.eventKey, JSON.stringify(event.criterionWitness));
    assert(!state.lineages.some((lineage) => lineage.id === childId), 'child lineage already exists');
    const traits = parent.traits.map((trait) => ({ ...trait }));
    for (const delta of event.traitDeltasPpm ?? []) {
      const trait = traits.find((candidate) => candidate.key === delta.key);
      assert(trait, `trait delta target ${delta.key} missing from parent lineage`);
      trait.valuePpm = clamp(trait.valuePpm + BigInt(delta.deltaPpm), 0n, PPM);
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
    assert(lineage.extinctionEventKey == null, 'lineage already formally extinct');
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
