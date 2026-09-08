(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const __modules=Object.create(null);
__modules["model.js"]=(()=>{
'use strict';
const PPM = 1_000_000n;
const MAX_INT = 2n ** 63n - 1n;

const LIFE_V2_AUTHORITY = Object.freeze({
  class: 'MODEL_DERIVED_SIMULATION',
  abiogenesisStatus: 'NOT_MODELED',
  canonicalAlienBiology: false,
  persistentIndividualIdentity: false,
  temporalAuthority: 'P4_EXTERNAL_EVENT_ORDER',
});

const LIFE_V2_LIMITS = Object.freeze({
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

function createLifeState(input) {
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

function advanceEcology(state, event) {
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

function applyLineageEvent(state, event) {
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

function replayLife(initialState, events) {
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

function summarizeLifeState(state) {
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
return Object.freeze({LIFE_V2_AUTHORITY,LIFE_V2_LIMITS,createLifeState,advanceEcology,applyLineageEvent,replayLife,summarizeLifeState});
})();
__modules["embodiment.js"]=(()=>{
'use strict';
const { LIFE_V2_LIMITS } = __modules["model.js"];

const PPM = 1_000_000n;

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

function behaviorDescriptor(lineage, region) {
  const mobilityPpm = traitValue(lineage, 'mobility');
  const opportunityPpm = region.opportunityPpm;
  const disturbancePenaltyPpm = PPM - region.disturbancePpm;
  const activityOpportunityPpm = mobilityPpm * opportunityPpm / PPM * disturbancePenaltyPpm / PPM;
  const behaviorClass = activityOpportunityPpm >= 650_000n
    ? 'HIGH_LOCAL_ACTIVITY_OPPORTUNITY'
    : activityOpportunityPpm >= 250_000n
      ? 'MODERATE_LOCAL_ACTIVITY_OPPORTUNITY'
      : 'LOW_LOCAL_ACTIVITY_OPPORTUNITY';
  return Object.freeze({
    behaviorClass,
    activityOpportunityPpm,
    mobilityTraitPpm: mobilityPpm,
    environmentalOpportunityPpm: opportunityPpm,
    disturbancePenaltyPpm,
    feedingMode: lineage.morphology.feedingMode,
    locomotionMode: lineage.morphology.locomotionMode,
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    cognitionClaimed: false,
    empiricalEthologyClaimed: false,
    limitation: 'Activity opportunity is a bounded model response to explicit trait and regional context, not an empirical prediction of behavior or cognition.',
  });
}

function representativeLifecycle(population, seed) {
  const roll = BigInt(deterministicHash(`${seed}|lifecycle`)) % PPM;
  const juvenileBoundary = population.lifecycleStagePpm.juvenile;
  const matureBoundary = juvenileBoundary + population.lifecycleStagePpm.mature;
  const stage = roll < juvenileBoundary
    ? 'JUVENILE'
    : roll < matureBoundary
      ? 'MATURE'
      : 'SENESCENT';
  return Object.freeze({
    stage,
    sourcePopulationStagePpm: population.lifecycleStagePpm,
    representativeOnly: true,
    persistentIndividualFact: false,
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    limitation: 'Lifecycle stage is a deterministic representative draw from aggregate stage composition, not persistent individual history.',
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

function materializeLocalOrganisms(state, request) {
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
  const lineageById = new Map(state.lineages.map((lineage) => [lineage.id, lineage]));
  const morphologyByLineageId = new Map();
  const samples = [];

  for (const { population, quota } of quotas) {
    if (quota === 0) continue;
    const lineage = lineageById.get(population.lineageId);
    assert(lineage, `lineage ${population.lineageId} missing`);
    const region = state.regions[population.regionId];
    assert(region, `region ${population.regionId} missing`);
    let morphology = morphologyByLineageId.get(lineage.id);
    if (!morphology) {
      morphology = morphologyDescriptor(lineage);
      morphologyByLineageId.set(lineage.id, morphology);
    }
    const behavior = behaviorDescriptor(lineage, region);
    const motionAmplitude = Number(behavior.activityOpportunityPpm) / 1_000_000;

    for (let index = 0; index < quota; index += 1) {
      const sampleId = `sample:${population.id}:${state.eventKey}:${index}`;
      const seed = `${sampleId}|${viewportKey}`;
      const lifecycle = representativeLifecycle(population, seed);
      samples.push(Object.freeze({
        id: sampleId,
        populationId: population.id,
        lineageId: population.lineageId,
        regionId: population.regionId,
        persistent: false,
        individualIdentityPromoted: false,
        representativeOfAggregate: true,
        aggregateAbundance: population.abundance,
        lifecycle,
        behavior,
        position: Object.freeze({
          x: unitFromHash(`${seed}|x`) * 2 - 1,
          y: unitFromHash(`${seed}|y`) * 2 - 1,
          z: unitFromHash(`${seed}|z`) * 2 - 1,
        }),
        orientationTurns: unitFromHash(`${seed}|orientation`),
        morphology,
        presentation: Object.freeze({
          motionPhase: unitFromHash(`${seed}|motion`),
          motionAmplitude,
          activityCue: lifecycle.stage === 'JUVENILE'
            ? 'DEVELOPMENTAL_ACTIVITY_PRESENTATION'
            : lifecycle.stage === 'SENESCENT'
              ? 'REDUCED_ACTIVITY_PRESENTATION'
              : behavior.behaviorClass === 'LOW_LOCAL_ACTIVITY_OPPORTUNITY'
                ? 'LOW_ACTIVITY_PRESENTATION'
                : 'BASELINE_ACTIVITY_PRESENTATION',
          authorityClass: 'PRESENTATION_ONLY',
        }),
      }));
    }
  }

  assert(samples.length <= cap, 'materialized sample count exceeded cap');
  return Object.freeze(samples);
}

function projectSelectionToAggregate(sample, state) {
  assert(sample?.representativeOfAggregate === true, 'representative sample required');
  const population = state.populations.find((candidate) => candidate.id === sample.populationId);
  assert(population, 'sample population not present in aggregate state');
  return Object.freeze({
    selectionKind: 'MODELED_POPULATION',
    populationId: population.id,
    lineageId: population.lineageId,
    regionId: population.regionId,
    sampleId: sample.id,
    representativeLifecycleStage: sample.lifecycle?.stage ?? null,
    modeledBehaviorClass: sample.behavior?.behaviorClass ?? null,
    sampleIsPersistentIndividual: false,
    inferenceGuard: 'LOCAL_SAMPLE_MUST_NOT_INFER_GLOBAL_ABUNDANCE',
  });
}
return Object.freeze({materializeLocalOrganisms,projectSelectionToAggregate});
})();
__modules["renderer.js"]=(()=>{
'use strict';
function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_RENDER_INVALID: ${message}`);
}

function boundedNumber(value, name, min, max) {
  const numeric = Number(value);
  assert(Number.isFinite(numeric), `${name} must be finite`);
  assert(numeric >= min && numeric <= max, `${name} out of bounds`);
  return numeric;
}

function boundedDescriptorCount(value) {
  const numeric = Number(value);
  assert(Number.isFinite(numeric) && numeric >= 0, 'maxDescriptors must be a non-negative finite number');
  return Math.max(0, Math.min(Math.floor(numeric), 128));
}

function buildOrganismRenderDescriptors(samples, options = {}) {
  assert(Array.isArray(samples), 'samples array required');
  const maxDescriptors = boundedDescriptorCount(options.maxDescriptors ?? 128);
  const quality = String(options.quality ?? 'BALANCED');
  assert(['LOW', 'BALANCED', 'HIGH'].includes(quality), 'unsupported quality profile');
  const segmentBudget = quality === 'LOW' ? 3 : quality === 'BALANCED' ? 5 : 8;

  return Object.freeze(samples.slice(0, maxDescriptors).map((sample) => {
    assert(sample?.morphology?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'semantic morphology descriptor required');
    assert(sample?.lifecycle?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'representative lifecycle descriptor required');
    assert(sample.lifecycle.representativeOnly === true && sample.lifecycle.persistentIndividualFact === false, 'representative lifecycle semantics required');
    assert(['JUVENILE', 'MATURE', 'SENESCENT'].includes(sample.lifecycle.stage), 'unsupported representative lifecycle stage');
    assert(sample?.behavior?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'modeled behavior opportunity descriptor required');
    assert(sample.behavior.cognitionClaimed === false && sample.behavior.empiricalEthologyClaimed === false, 'behavior claim guards required');
    assert(typeof sample.behavior.activityOpportunityPpm === 'bigint' && sample.behavior.activityOpportunityPpm >= 0n && sample.behavior.activityOpportunityPpm <= 1_000_000n, 'activity opportunity ppm out of bounds');
    assert(sample?.presentation?.authorityClass === 'PRESENTATION_ONLY', 'presentation-only motion descriptor required');
    assert(sample?.representativeOfAggregate === true, 'representative aggregate sample required');
    assert(String(sample.id ?? '').length > 0, 'sample id required');
    assert(String(sample.populationId ?? '').length > 0, 'population id required');
    assert(String(sample.lineageId ?? '').length > 0, 'lineage id required');
    assert(typeof sample.aggregateAbundance === 'bigint' && sample.aggregateAbundance >= 0n, 'aggregate abundance evidence must be a non-negative bigint');

    const position = Object.freeze({
      x: boundedNumber(sample.position?.x, 'position.x', -1, 1),
      y: boundedNumber(sample.position?.y, 'position.y', -1, 1),
      z: boundedNumber(sample.position?.z, 'position.z', -1, 1),
    });
    const orientationTurns = boundedNumber(sample.orientationTurns, 'orientationTurns', 0, 1);
    const motionPhase = boundedNumber(sample.presentation.motionPhase ?? 0, 'motionPhase', 0, 1);
    const baseMotionAmplitude = boundedNumber(sample.presentation.motionAmplitude ?? 0, 'motionAmplitude', 0, 1);
    const modeledActivityAmplitude = Number(sample.behavior.activityOpportunityPpm) / 1_000_000;
    assert(Math.abs(baseMotionAmplitude - modeledActivityAmplitude) <= Number.EPSILON * 4, 'presentation motion amplitude must remain bound to modeled activity opportunity');
    const baseSizeScale = sample.morphology.sizeBand === 'TINY' ? 0.35 : sample.morphology.sizeBand === 'LARGE' ? 1.35 : 0.8;
    const lifecycleScale = sample.lifecycle.stage === 'JUVENILE' ? 0.65 : sample.lifecycle.stage === 'SENESCENT' ? 0.9 : 1;
    const lifecycleMotionScale = sample.lifecycle.stage === 'SENESCENT' ? 0.65 : sample.lifecycle.stage === 'JUVENILE' ? 0.85 : 1;
    const sizeScale = baseSizeScale * lifecycleScale;
    const defenseScale = sample.morphology.defenseBand === 'HIGH' ? 1 : sample.morphology.defenseBand === 'MODERATE' ? 0.65 : 0.3;
    const motionAmplitude = baseMotionAmplitude * lifecycleMotionScale;

    return Object.freeze({
      id: `render:${sample.id}`,
      sampleId: sample.id,
      populationId: sample.populationId,
      lineageId: sample.lineageId,
      primitiveFamily: sample.morphology.semanticBodyPlan === 'MOBILE_ARTICULATED'
        ? 'CHAINED_ELLIPSOIDS'
        : sample.morphology.semanticBodyPlan === 'SESSILE_CAPTURE_SURFACE'
          ? 'BRANCHED_RADIAL_PATCHES'
          : 'MODULAR_LOBES',
      segmentBudget,
      sizeScale,
      defenseScale,
      position,
      orientationTurns,
      motion: Object.freeze({
        phase: motionPhase,
        amplitude: motionAmplitude,
        activityCue: String(sample.presentation.activityCue ?? 'BASELINE_ACTIVITY_PRESENTATION'),
        authorityClass: 'PRESENTATION_ONLY',
      }),
      visualGrammar: Object.freeze({
        symmetry: sample.morphology.symmetry,
        supportMode: sample.morphology.supportMode,
        locomotionMode: sample.morphology.locomotionMode,
        feedingMode: sample.morphology.feedingMode,
        representativeLifecycleStage: sample.lifecycle.stage,
        modeledBehaviorClass: sample.behavior.behaviorClass,
      }),
      authorityClass: 'PRESENTATION_ONLY',
      evidenceLink: Object.freeze({
        populationId: sample.populationId,
        aggregateAbundance: sample.aggregateAbundance,
        representativeLifecycleStage: sample.lifecycle.stage,
        modeledBehaviorClass: sample.behavior.behaviorClass,
        activityOpportunityPpm: sample.behavior.activityOpportunityPpm,
        representativeOnly: true,
      }),
      limitations: Object.freeze([
        'Geometry is a deterministic presentation of semantic modeled traits.',
        'Rendered body plan and lifecycle scaling are not empirical predictions of alien anatomy or ontogeny.',
        'Motion responds to bounded modeled activity opportunity but remains presentation-only and does not establish physiology, cognition, or empirical ethology.',
      ]),
    });
  }));
}

function cullOrganismRenderDescriptors(descriptors, visibility) {
  assert(Array.isArray(descriptors), 'descriptor array required');
  const isVisible = typeof visibility === 'function' ? visibility : () => true;
  return Object.freeze(descriptors.filter((descriptor) => isVisible(descriptor.position, descriptor)));
}
return Object.freeze({buildOrganismRenderDescriptors,cullOrganismRenderDescriptors});
})();
__modules["evolution.js"]=(()=>{
'use strict';
const PPM = 1_000_000n;

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_EVOLUTION_INVALID: ${message}`);
}

function asPpm(value, name) {
  const out = typeof value === 'bigint' ? value : BigInt(value);
  assert(out >= 0n && out <= PPM, `${name} out of ppm bounds`);
  return out;
}

function asSignedPpm(value, name) {
  const out = typeof value === 'bigint' ? value : BigInt(value);
  assert(out >= -PPM && out <= PPM, `${name} out of signed ppm bounds`);
  return out;
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function abs(value) {
  return value < 0n ? -value : value;
}

function hash32(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function requireState(state) {
  assert(state?.schema === 'ofu-v2x-08-life-state-1', 'valid life state required');
  return state;
}

function requireLineage(state, lineageId) {
  const lineage = state.lineages.find((candidate) => candidate.id === String(lineageId));
  assert(lineage, `lineage ${lineageId} missing`);
  assert(lineage.extinctionEventKey == null, `lineage ${lineageId} is formally extinct`);
  return lineage;
}

function validateVariationProposalAgainstState(state, proposal) {
  assert(proposal?.schema === 'ofu-v2x-08-trait-variation-proposal-1', 'variation proposal required');
  assert(proposal.eventKey, 'proposal eventKey required');
  const lineage = requireLineage(state, proposal.lineageId);
  const trait = lineage.traits.find((candidate) => candidate.key === String(proposal.traitKey));
  assert(trait, `proposal trait ${proposal.traitKey} missing from current lineage`);
  const prior = asPpm(proposal.priorValuePpm, 'proposal priorValuePpm');
  const delta = asSignedPpm(proposal.deltaPpm, 'proposal deltaPpm');
  const resulting = asPpm(proposal.resultingValuePpm, 'proposal resultingValuePpm');
  assert(prior === trait.valuePpm, 'proposal prior value is stale or tampered relative to current lineage state');
  assert(resulting === clamp(prior + delta, 0n, PPM), 'proposal resulting value is inconsistent with prior value and delta');
  assert(proposal.authorityClass === 'MODEL_DERIVED_SIMULATION', 'proposal authority class mismatch');
  assert(proposal.status === 'PROPOSAL_ONLY', 'proposal status mismatch');
  return Object.freeze({ lineage, trait, prior, delta, resulting });
}

const LIFE_V2_EVOLUTION_DESCRIPTOR = Object.freeze({
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  mutationSemantics: 'STYLIZED_DETERMINISTIC_VARIATION_PROPOSAL',
  selectionSemantics: 'PROFILE_BOUND_CRITERION_WITNESS',
  eventAdmission: 'NONE_P4_REMAINS_AUTHORITY',
  universalSpeciesThreshold: false,
  universalMutationRate: false,
  molecularGeneticsModeled: false,
});

function proposeTraitVariation(state, request) {
  requireState(state);
  assert(request?.eventKey, 'external eventKey required');
  const lineage = requireLineage(state, request.lineageId);
  const allowedKeys = request.allowedTraitKeys == null
    ? null
    : new Set(request.allowedTraitKeys.map(String));
  const candidates = lineage.traits
    .filter((trait) => allowedKeys == null || allowedKeys.has(trait.key))
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key));
  assert(candidates.length > 0, 'at least one eligible modeled trait required');

  const maxAbsoluteDeltaPpm = asPpm(request.maxAbsoluteDeltaPpm ?? 25_000, 'maxAbsoluteDeltaPpm');
  assert(maxAbsoluteDeltaPpm > 0n, 'maxAbsoluteDeltaPpm must be positive');

  const selector = hash32(`${request.eventKey}|${lineage.id}|trait-selector`);
  const trait = candidates[selector % candidates.length];
  const magnitudeSeed = hash32(`${request.eventKey}|${lineage.id}|${trait.key}|magnitude`);
  const magnitude = 1n + BigInt(magnitudeSeed) % maxAbsoluteDeltaPpm;
  const signSeed = hash32(`${request.eventKey}|${lineage.id}|${trait.key}|sign`);
  const signedDelta = (signSeed & 1) === 0 ? magnitude : -magnitude;
  const resultingValue = clamp(trait.valuePpm + signedDelta, 0n, PPM);
  const appliedDelta = resultingValue - trait.valuePpm;

  return Object.freeze({
    schema: 'ofu-v2x-08-trait-variation-proposal-1',
    lineageId: lineage.id,
    eventKey: String(request.eventKey),
    traitKey: trait.key,
    priorValuePpm: trait.valuePpm.toString(),
    deltaPpm: appliedDelta.toString(),
    resultingValuePpm: resultingValue.toString(),
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    status: 'PROPOSAL_ONLY',
    limitations: Object.freeze([
      'Variation is a deterministic stylized proposal, not molecular genetics.',
      'The proposal does not admit an event or alter persistent state.',
      'No universal mutation rate or distribution is asserted.',
    ]),
  });
}

function evaluateSelectionCriterion(state, proposal, request) {
  requireState(state);
  const validated = validateVariationProposalAgainstState(state, proposal);
  const lineage = validated.lineage;
  const regionId = String(request?.regionId ?? '');
  const region = state.regions[regionId];
  assert(region, `region ${regionId} missing`);
  assert(state.populations.some((population) => population.lineageId === lineage.id && population.regionId === regionId && population.abundance > 0n), 'lineage must have represented abundance in evaluation region');

  const criterion = request?.criterion ?? {};
  assert(criterion.profileId, 'criterion profileId required');
  assert(String(criterion.traitKey) === proposal.traitKey, 'criterion trait must match proposal trait');
  const targetPpm = asPpm(criterion.targetPpm, 'criterion targetPpm');
  const minimumImprovementPpm = asPpm(criterion.minimumImprovementPpm ?? 1, 'criterion minimumImprovementPpm');
  const minimumOpportunityPpm = asPpm(criterion.minimumOpportunityPpm ?? 0, 'criterion minimumOpportunityPpm');
  const beforeDistance = abs(validated.prior - targetPpm);
  const afterDistance = abs(validated.resulting - targetPpm);
  const improvement = beforeDistance > afterDistance ? beforeDistance - afterDistance : 0n;
  const satisfied = improvement >= minimumImprovementPpm && region.opportunityPpm >= minimumOpportunityPpm;

  return Object.freeze({
    schema: 'ofu-v2x-08-selection-witness-1',
    satisfied,
    kind: 'PROFILE_BOUND_SELECTION_WITNESS',
    profileId: String(criterion.profileId),
    proposalEventKey: String(proposal.eventKey),
    lineageId: lineage.id,
    regionId,
    traitKey: proposal.traitKey,
    proposalPriorValuePpm: validated.prior.toString(),
    proposalDeltaPpm: validated.delta.toString(),
    proposalResultingValuePpm: validated.resulting.toString(),
    targetPpm: targetPpm.toString(),
    beforeDistancePpm: beforeDistance.toString(),
    afterDistancePpm: afterDistance.toString(),
    improvementPpm: improvement.toString(),
    opportunityPpm: region.opportunityPpm.toString(),
    minimumOpportunityPpm: minimumOpportunityPpm.toString(),
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    limitations: Object.freeze([
      'Criterion thresholds are profile inputs, not universal fitness or species laws.',
      'Satisfied means only that this explicit modeled criterion was met.',
      'The witness does not itself create a lineage or admit a temporal event.',
    ]),
  });
}

function buildSpeciationProposal(proposal, witness, request = {}) {
  assert(proposal?.schema === 'ofu-v2x-08-trait-variation-proposal-1', 'variation proposal required');
  assert(witness?.schema === 'ofu-v2x-08-selection-witness-1', 'selection witness required');
  assert(witness.satisfied === true, 'satisfied selection witness required');
  assert(witness.authorityClass === 'MODEL_DERIVED_SIMULATION', 'witness authority class mismatch');
  assert(witness.lineageId === proposal.lineageId, 'witness/proposal lineage mismatch');
  assert(witness.traitKey === proposal.traitKey, 'witness/proposal trait mismatch');
  assert(witness.proposalEventKey === proposal.eventKey, 'witness/proposal event mismatch');
  assert(String(witness.proposalPriorValuePpm) === String(proposal.priorValuePpm), 'witness/proposal prior value mismatch');
  assert(String(witness.proposalDeltaPpm) === String(proposal.deltaPpm), 'witness/proposal delta mismatch');
  assert(String(witness.proposalResultingValuePpm) === String(proposal.resultingValuePpm), 'witness/proposal resulting value mismatch');
  assert(request.eventKey, 'external eventKey required');

  return Object.freeze({
    type: 'SPECIATION',
    eventKey: String(request.eventKey),
    parentLineageId: proposal.lineageId,
    ...(request.childLineageId == null ? {} : { childLineageId: String(request.childLineageId) }),
    criterionWitness: Object.freeze({
      satisfied: true,
      kind: witness.kind,
      profileId: witness.profileId,
      proposalEventKey: witness.proposalEventKey,
      regionId: witness.regionId,
      traitKey: witness.traitKey,
      proposalPriorValuePpm: witness.proposalPriorValuePpm,
      proposalDeltaPpm: witness.proposalDeltaPpm,
      proposalResultingValuePpm: witness.proposalResultingValuePpm,
      targetPpm: witness.targetPpm,
      beforeDistancePpm: witness.beforeDistancePpm,
      afterDistancePpm: witness.afterDistancePpm,
      improvementPpm: witness.improvementPpm,
      authorityClass: witness.authorityClass,
    }),
    traitDeltasPpm: Object.freeze([{ key: proposal.traitKey, deltaPpm: proposal.deltaPpm }]),
    ...(request.morphology == null ? {} : { morphology: Object.freeze({ ...request.morphology }) }),
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    status: 'EVENT_PROPOSAL_REQUIRES_EXTERNAL_P4_ADMISSION',
  });
}
return Object.freeze({LIFE_V2_EVOLUTION_DESCRIPTOR,proposeTraitVariation,evaluateSelectionCriterion,buildSpeciationProposal});
})();
__modules["succession.js"]=(()=>{
'use strict';
const { LIFE_V2_LIMITS, createLifeState, advanceEcology, applyLineageEvent } = __modules["model.js"];

const PPM = 1_000_000n;

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_SUCCESSION_INVALID: ${message}`);
}

function asInt(value, name, min = 0n, max = 2n ** 63n - 1n) {
  const out = typeof value === 'bigint' ? value : BigInt(value);
  assert(out >= min && out <= max, `${name} out of bounds`);
  return out;
}

function hash32(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function populationIdFor(lineageId, regionId) {
  const material = `${lineageId}|${regionId}|aggregate-population-v1`;
  return `pop-${hash32(material).toString(16).padStart(8, '0')}`;
}

function requireState(state) {
  assert(state?.schema === 'ofu-v2x-08-life-state-1', 'valid life state required');
  return state;
}

function weightedLifecycle(source, sourceCount, target, targetCount) {
  const total = sourceCount + targetCount;
  assert(total > 0n, 'weighted lifecycle requires represented abundance');
  const juvenile = (source.lifecycleStagePpm.juvenile * sourceCount + target.lifecycleStagePpm.juvenile * targetCount) / total;
  const mature = (source.lifecycleStagePpm.mature * sourceCount + target.lifecycleStagePpm.mature * targetCount) / total;
  const senescent = PPM - juvenile - mature;
  return Object.freeze({ juvenile, mature, senescent });
}

const LIFE_V2_SUCCESSION_DESCRIPTOR = Object.freeze({
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  dispersalSemantics: 'AGGREGATE_CONSERVATIVE_TRANSFER',
  colonizationSemantics: 'REQUIRES_EXISTING_REPRESENTED_SOURCE_LIFE',
  successionSemantics: 'PROFILE_BOUND_DESCRIPTOR',
  environmentMutation: false,
  temporalAuthority: 'P4_EXTERNAL_EVENT_ORDER',
});

function applyDispersal(state, event) {
  requireState(state);
  assert(event?.type === 'LIFE_DISPERSAL', 'expected LIFE_DISPERSAL event');
  assert(event.eventKey, 'external eventKey required');
  const sourceId = String(event.sourcePopulationId ?? '');
  const targetRegionId = String(event.targetRegionId ?? '');
  const source = state.populations.find((population) => population.id === sourceId);
  assert(source, `source population ${sourceId} missing`);
  assert(state.regions[targetRegionId], `target region ${targetRegionId} missing`);
  assert(source.regionId !== targetRegionId, 'source and target regions must differ');
  const lineage = state.lineages.find((candidate) => candidate.id === source.lineageId);
  assert(lineage && lineage.extinctionEventKey == null, 'cannot disperse a formally extinct lineage');
  assert(event.count != null, 'dispersal count required');
  const count = asInt(event.count, 'dispersal count', 1n);
  assert(count <= source.abundance, 'dispersal count exceeds represented source abundance');

  const targetMatches = state.populations.filter((population) => population.lineageId === source.lineageId && population.regionId === targetRegionId);
  assert(targetMatches.length <= 1, 'multiple target aggregates for same lineage/region are ambiguous');
  const target = targetMatches[0] ?? null;
  if (!target) assert(state.populations.length < LIFE_V2_LIMITS.maxPopulations, 'population lifetime bound reached');

  const energyTransfer = source.abundance === count
    ? source.energyStore
    : source.energyStore * count / source.abundance;
  const nutrientTransfer = source.abundance === count
    ? source.nutrientStore
    : source.nutrientStore * count / source.abundance;

  const populations = state.populations.map((population) => population.id === source.id
    ? {
        ...population,
        abundance: population.abundance - count,
        energyStore: population.energyStore - energyTransfer,
        nutrientStore: population.nutrientStore - nutrientTransfer,
      }
    : { ...population });

  let targetPopulationId;
  if (target) {
    targetPopulationId = target.id;
    const targetIndex = populations.findIndex((population) => population.id === target.id);
    const targetCopy = populations[targetIndex];
    const priorTargetAbundance = targetCopy.abundance;
    populations[targetIndex] = {
      ...targetCopy,
      abundance: priorTargetAbundance + count,
      energyStore: targetCopy.energyStore + energyTransfer,
      nutrientStore: targetCopy.nutrientStore + nutrientTransfer,
      lifecycleStagePpm: weightedLifecycle(source, count, targetCopy, priorTargetAbundance),
    };
  } else {
    targetPopulationId = populationIdFor(source.lineageId, targetRegionId);
    assert(!populations.some((population) => population.id === targetPopulationId), 'derived target population id collision');
    populations.push({
      id: targetPopulationId,
      lineageId: source.lineageId,
      regionId: targetRegionId,
      abundance: count,
      energyStore: energyTransfer,
      nutrientStore: nutrientTransfer,
      lifecycleStagePpm: source.lifecycleStagePpm,
    });
  }

  const next = createLifeState({
    ...state,
    eventKey: String(event.eventKey),
    populations,
  });
  return Object.freeze({
    state: next,
    transfer: Object.freeze({
      eventKey: String(event.eventKey),
      sourceStateEventKey: state.eventKey,
      sourcePopulationId: source.id,
      targetPopulationId,
      lineageId: source.lineageId,
      count,
      energyTransfer,
      nutrientTransfer,
      sourceRegionId: source.regionId,
      targetRegionId,
      authorityClass: 'MODEL_DERIVED_SIMULATION',
      causationClaimedBeyondTransfer: false,
    }),
  });
}

function describeSuccession(state, regionId, profile) {
  requireState(state);
  const id = String(regionId);
  assert(state.regions[id], `region ${id} missing`);
  assert(profile?.profileId, 'succession profileId required');
  const pioneerMaxAbundance = asInt(profile.pioneerMaxAbundance, 'pioneerMaxAbundance');
  const establishedMinLineages = asInt(profile.establishedMinLineages, 'establishedMinLineages', 1n, BigInt(LIFE_V2_LIMITS.maxLineages));
  const networkedMinInteractions = asInt(profile.networkedMinInteractions, 'networkedMinInteractions', 0n, BigInt(LIFE_V2_LIMITS.maxInteractions));

  const populations = state.populations.filter((population) => population.regionId === id && population.abundance > 0n);
  const totalAbundance = populations.reduce((sum, population) => sum + population.abundance, 0n);
  const lineageIds = new Set(populations.map((population) => population.lineageId));
  const populationIds = new Set(populations.map((population) => population.id));
  const interactionCount = state.interactions.filter((edge) => populationIds.has(edge.sourcePopulationId) && populationIds.has(edge.targetPopulationId) && edge.kind !== 'ASSOCIATION_ONLY').length;

  let stage = 'NO_REPRESENTED_LIFE';
  if (totalAbundance > 0n) {
    if (totalAbundance <= pioneerMaxAbundance || BigInt(lineageIds.size) < establishedMinLineages) stage = 'PIONEER';
    else if (BigInt(interactionCount) >= networkedMinInteractions) stage = 'NETWORKED';
    else stage = 'ESTABLISHED';
  }

  return Object.freeze({
    schema: 'ofu-v2x-08-succession-descriptor-1',
    eventKey: state.eventKey,
    regionId: id,
    profileId: String(profile.profileId),
    stage,
    totalAbundance,
    representedLineages: lineageIds.size,
    causalInteractionCount: interactionCount,
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    limitations: Object.freeze([
      'Succession stage is a profile-bound model descriptor, not a universal ecological law.',
      'NO_REPRESENTED_LIFE means no life in this represented state, not proof that life is impossible.',
      'Planetary environment remains upstream and is not mutated by this descriptor.',
    ]),
  });
}

function compareRecovery(beforeState, afterState, regionId) {
  requireState(beforeState);
  requireState(afterState);
  const id = String(regionId);
  assert(beforeState.regions[id], `before-state region ${id} missing`);
  assert(afterState.regions[id], `after-state region ${id} missing`);
  const aggregate = (state) => {
    const populations = state.populations.filter((population) => population.regionId === id && population.abundance > 0n);
    return {
      abundance: populations.reduce((sum, population) => sum + population.abundance, 0n),
      lineages: new Set(populations.map((population) => population.lineageId)).size,
    };
  };
  const before = aggregate(beforeState);
  const after = aggregate(afterState);
  const abundanceDelta = after.abundance - before.abundance;
  const lineageDelta = after.lineages - before.lineages;
  return Object.freeze({
    regionId: id,
    beforeEventKey: beforeState.eventKey,
    afterEventKey: afterState.eventKey,
    abundanceDelta,
    lineageDelta,
    direction: abundanceDelta > 0n ? 'INCREASED_REPRESENTED_ABUNDANCE' : abundanceDelta < 0n ? 'DECREASED_REPRESENTED_ABUNDANCE' : 'UNCHANGED_REPRESENTED_ABUNDANCE',
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    causationClaimed: false,
    stabilityClaimed: false,
  });
}

function replayLifeTransitions(initialState, events) {
  requireState(initialState);
  assert(Array.isArray(events), 'events array required');
  assert(events.length <= LIFE_V2_LIMITS.maxReplayEvents, 'replay event bound exceeded');
  let current = initialState;
  for (const event of events) {
    if (event.type === 'LIFE_ADVANCE') current = advanceEcology(current, event).state;
    else if (event.type === 'SPECIATION' || event.type === 'EXTINCTION') current = applyLineageEvent(current, event);
    else if (event.type === 'LIFE_DISPERSAL') current = applyDispersal(current, event).state;
    else throw new Error(`LIFE_V2_SUCCESSION_INVALID: event type ${event.type} not handled`);
  }
  return current;
}
return Object.freeze({LIFE_V2_SUCCESSION_DESCRIPTOR,applyDispersal,describeSuccession,compareRecovery,replayLifeTransitions});
})();
__modules["provider.js"]=(()=>{
'use strict';
const { advanceEcology, summarizeLifeState } = __modules["model.js"];
const { materializeLocalOrganisms } = __modules["embodiment.js"];
const { proposeTraitVariation, evaluateSelectionCriterion, buildSpeciationProposal } = __modules["evolution.js"];
const { applyDispersal, describeSuccession, compareRecovery } = __modules["succession.js"];

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

const LIFE_V2_PROVIDER_DESCRIPTOR = Object.freeze({
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

function createLifeProvider({ getState }) {
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
return Object.freeze({LIFE_V2_PROVIDER_DESCRIPTOR,createLifeProvider});
})();
__modules["viewport-bridge.js"]=(()=>{
'use strict';
const MAX_VIEWPORT_ORGANISMS = 128;
const QUALITY = new Set(['LOW', 'BALANCED', 'HIGH']);

function invariant(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_VIEWPORT_INVALID: ${message}`);
}

function token(value, name, max = 256) {
  const out = String(value ?? '');
  invariant(out.length > 0 && out.length <= max, `${name} required`);
  return out;
}

function boundedCount(value, fallback = 32) {
  const numeric = value == null ? fallback : Number(value);
  invariant(Number.isFinite(numeric) && numeric >= 0, 'maxSamples must be a non-negative finite number');
  return Math.min(MAX_VIEWPORT_ORGANISMS, Math.floor(numeric));
}

function stableValue(value, seen = new Set()) {
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    invariant(Number.isFinite(value), 'fingerprint values must be finite');
    return Object.is(value, -0) ? 0 : value;
  }
  invariant(typeof value === 'object', 'unsupported fingerprint value');
  invariant(!seen.has(value), 'cyclic fingerprint value');
  seen.add(value);
  let out;
  if (Array.isArray(value)) out = value.map((entry) => stableValue(entry, seen));
  else {
    out = {};
    for (const key of Object.keys(value).sort()) out[key] = stableValue(value[key], seen);
  }
  seen.delete(value);
  return out;
}

function hash32(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function fingerprintLifeViewport(value) {
  return hash32(JSON.stringify(stableValue(value))).toString(16).padStart(8, '0');
}

const LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR = Object.freeze({
  id: 'ofu.v2x-08.life-viewport-bridge',
  version: '2.0.0',
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  maxViewportOrganisms: MAX_VIEWPORT_ORGANISMS,
  additiveOnly: true,
  ownsCentralSelection: false,
  ownsCameraOrScale: false,
  ownsSceneComposition: false,
  ownsPrimaryRenderer: false,
  ownsPersistenceReplay: false,
  capabilities: Object.freeze([
    'LIFE_VIEWPORT_PACKET',
    'LIFE_VIEWPORT_ABSENCE_REASON',
    'LIFE_SELECTION_TARGETS',
    'LIFE_REVISIT_TOKEN',
    'LIFE_V2X07_LOCAL_SPACE_HOOK',
    'LIFE_V2X13_RENDER_PACKET_HOOK',
  ]),
});

function validateDescriptor(sample, descriptor) {
  invariant(descriptor && typeof descriptor === 'object', 'renderer descriptor required');
  invariant(descriptor.authorityClass === 'PRESENTATION_ONLY', 'render descriptor must remain PRESENTATION_ONLY');
  invariant(descriptor.sampleId === sample.id, 'render descriptor sample identity mismatch');
  invariant(descriptor.populationId === sample.populationId, 'render descriptor population identity mismatch');
  invariant(descriptor.lineageId === sample.lineageId, 'render descriptor lineage identity mismatch');
  invariant(descriptor.primitiveFamily !== 'GENERIC_ELLIPSE', 'generic ellipse fallback is forbidden when rich morphology is available');
  invariant(descriptor.evidenceLink?.representativeOnly === true, 'render descriptor must preserve representative-only evidence guard');
}

function buildSelectionTarget(sample, descriptor) {
  return Object.freeze({
    selectionKind: 'MODELED_POPULATION_REPRESENTATIVE',
    targetId: `life:${sample.id}`,
    sampleId: sample.id,
    populationId: sample.populationId,
    lineageId: sample.lineageId,
    regionId: sample.regionId,
    renderDescriptorId: descriptor.id,
    persistentIndividual: false,
    individualIdentityPromoted: false,
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    selectionAuthorityClaimed: false,
  });
}

function requestFromToken(revisitToken) {
  invariant(revisitToken?.schema === 'ofu-v2x-08-life-revisit-token-1', 'valid revisit token required');
  return {
    regionId: revisitToken.regionId,
    viewportKey: revisitToken.viewportKey,
    maxSamples: revisitToken.maxSamples,
    quality: revisitToken.quality,
  };
}

function createLifeViewportBridge({ provider, renderDescriptors, getEventKey }) {
  invariant(provider && typeof provider === 'object', 'provider required');
  invariant(typeof provider.summary === 'function', 'provider.summary required');
  invariant(typeof provider.inspectRegion === 'function', 'provider.inspectRegion required');
  invariant(typeof provider.localSamples === 'function', 'provider.localSamples required');
  invariant(typeof renderDescriptors === 'function', 'renderDescriptors function required');
  invariant(typeof getEventKey === 'function', 'getEventKey function required');

  function buildViewportPacket(request = {}) {
    const regionId = token(request.regionId, 'regionId');
    const viewportKey = token(request.viewportKey ?? `life:${regionId}`, 'viewportKey');
    const maxSamples = boundedCount(request.maxSamples, 32);
    const quality = String(request.quality ?? 'BALANCED');
    invariant(QUALITY.has(quality), 'unsupported quality profile');

    const sourceEventKey = token(getEventKey(), 'source event key');
    const summary = provider.summary();
    const region = provider.inspectRegion(regionId);
    const samples = region == null || maxSamples === 0
      ? []
      : provider.localSamples({ regionId, viewportKey, maxSamples });
    invariant(Array.isArray(samples), 'provider localSamples must return an array');
    invariant(samples.length <= maxSamples && samples.length <= MAX_VIEWPORT_ORGANISMS, 'provider exceeded viewport sample bound');
    invariant(samples.every((sample) => sample?.representativeOfAggregate === true), 'viewport samples must be aggregate representatives');
    invariant(samples.every((sample) => sample?.persistent === false && sample?.individualIdentityPromoted === false), 'viewport samples must not become persistent individuals');

    const descriptors = renderDescriptors(samples, { quality, maxDescriptors: maxSamples });
    invariant(Array.isArray(descriptors), 'renderer must return an array');
    invariant(descriptors.length === samples.length, 'renderer/sample cardinality mismatch');
    invariant(descriptors.length <= MAX_VIEWPORT_ORGANISMS, 'renderer exceeded viewport descriptor bound');
    for (let index = 0; index < descriptors.length; index += 1) validateDescriptor(samples[index], descriptors[index]);

    const selectionTargets = Object.freeze(samples.map((sample, index) => buildSelectionTarget(sample, descriptors[index])));
    const presence = samples.length > 0 ? 'VISIBLE_MODELED_LIFE' : 'ABSENT_IN_REPRESENTED_REGION';
    const absenceReason = samples.length > 0
      ? null
      : region == null
        ? 'REGION_NOT_REPRESENTED_BY_LIFE_MODEL'
        : (region.totalRepresentedAbundance ?? 0n) === 0n
          ? 'NO_REPRESENTED_ABUNDANCE'
          : maxSamples === 0
            ? 'VIEWPORT_SAMPLE_BUDGET_ZERO'
            : 'NO_LOCAL_SAMPLES_AFTER_BOUNDED_MATERIALIZATION';

    const packetCore = {
      schema: 'ofu-v2x-08-life-viewport-packet-1',
      sourceEventKey,
      regionId,
      viewportKey,
      maxSamples,
      quality,
      presence,
      absenceReason,
      summary,
      region,
      samples,
      renderDescriptors: descriptors,
      selectionTargets,
      authority: {
        ecology: 'MODEL_DERIVED_SIMULATION',
        morphology: 'MODEL_DERIVED_SIMULATION',
        behaviorOpportunity: 'MODEL_DERIVED_SIMULATION',
        renderGeometry: 'PRESENTATION_ONLY',
        temporalAdmission: 'EXTERNAL_P4_OR_GOVERNED_GAMEPLAY',
      },
      claimGuards: {
        canonicalAlienBiology: false,
        persistentIndividualIdentity: false,
        globalAbundanceFromLocalSamples: false,
        empiricalEthology: false,
        cognitionInference: false,
      },
      convergenceHooks: {
        localSpace: {
          owner: 'V2X-07_OR_CONVERGENCE',
          operation: 'MAP_NORMALIZED_LOCAL_POSITION',
          sourceDomain: 'NORMALIZED_LOCAL_CUBE',
          mutatesCameraAuthority: false,
        },
        primaryRenderer: {
          owner: 'V2X-13_OR_CONVERGENCE',
          packetFamily: 'LIFE_ORGANISM_DESCRIPTOR_SET',
          mutatesPrimaryRendererAuthority: false,
        },
        selection: {
          owner: 'CONVERGENCE_OWNER',
          operation: 'REGISTER_ADDITIVE_SELECTION_TARGETS',
          mutatesSelectionAuthority: false,
        },
        persistence: {
          owner: 'CONVERGENCE_OWNER',
          operation: 'PERSIST_REVISIT_TOKEN_WITH_GOVERNED_STATE',
          mutatesPersistenceReplayAuthority: false,
        },
      },
      limitations: [
        'Absence means no represented life in this bounded model/region, not proof that life is impossible.',
        'Organism samples are deterministic representatives of aggregate modeled populations, never persistent individual facts.',
        'Geometry and motion are presentation-only projections of bounded model-derived descriptors.',
      ],
    };
    const packetFingerprint = fingerprintLifeViewport(packetCore);
    const revisitToken = Object.freeze({
      schema: 'ofu-v2x-08-life-revisit-token-1',
      sourceEventKey,
      regionId,
      viewportKey,
      maxSamples,
      quality,
      packetFingerprint,
      authorityClass: 'MODEL_DERIVED_SIMULATION',
      persistencePerformed: false,
    });
    return Object.freeze({ ...packetCore, packetFingerprint, revisitToken });
  }

  function revisit(revisitToken) {
    const request = requestFromToken(revisitToken);
    const currentEventKey = token(getEventKey(), 'current event key');
    if (currentEventKey !== revisitToken.sourceEventKey) {
      return Object.freeze({
        status: 'STATE_RESOLUTION_REQUIRED',
        sourceEventKey: revisitToken.sourceEventKey,
        currentEventKey,
        regionId: revisitToken.regionId,
        packetFingerprint: revisitToken.packetFingerprint,
        persistenceAuthorityClaimed: false,
      });
    }
    const packet = buildViewportPacket(request);
    if (packet.packetFingerprint !== revisitToken.packetFingerprint) {
      return Object.freeze({
        status: 'STATE_RESOLUTION_REQUIRED',
        reason: 'STATE_FINGERPRINT_MISMATCH',
        sourceEventKey: revisitToken.sourceEventKey,
        currentEventKey,
        regionId: revisitToken.regionId,
        packetFingerprint: revisitToken.packetFingerprint,
        currentPacketFingerprint: packet.packetFingerprint,
        persistenceAuthorityClaimed: false,
      });
    }
    return Object.freeze({ status: 'REVISITED_EXACT', packet });
  }

  function reachabilityWitness() {
    return Object.freeze({
      schema: 'ofu-v2x-08-life-reachability-hook-1',
      runtimeExport: 'createLifeShippingAdapter',
      sourceChain: Object.freeze([
        'src/v2x-08-life-ecology-evolution-embodiment/model.js',
        'src/v2x-08-life-ecology-evolution-embodiment/provider.js',
        'src/v2x-08-life-ecology-evolution-embodiment/embodiment.js',
        'src/v2x-08-life-ecology-evolution-embodiment/renderer.js',
        'src/v2x-08-life-ecology-evolution-embodiment/viewport-bridge.js',
        'src/v2x-08-life-ecology-evolution-embodiment/shipping-adapter.js',
        'src/v2x-08-life-ecology-evolution-embodiment/shipping-bundle.mjs',
      ]),
      centralManifestHook: 'ADD_LIFE_SHIPPING_ADAPTER_WITHOUT_REPLACING_CENTRAL_AUTHORITIES',
      livingConsumerHook: 'REGISTER packet.selectionTargets + map renderDescriptors through V2X-07/V2X-13 additive seams',
      exactArtifactEvidenceStatus: 'LANE_BUNDLE_AND_ONE_FILE_INJECTION_PROVEN__CENTRAL_MANIFEST_AND_LIVING_WIRING_REQUIRED',
      authorityClass: 'MEASURED_RUNTIME_EVIDENCE',
    });
  }

  return Object.freeze({ descriptor: LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR, buildViewportPacket, revisit, reachabilityWitness });
}
return Object.freeze({fingerprintLifeViewport,LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR,createLifeViewportBridge});
})();
__modules["shipping-adapter.js"]=(()=>{
'use strict';
const { createLifeProvider, LIFE_V2_PROVIDER_DESCRIPTOR } = __modules["provider.js"];
const { buildOrganismRenderDescriptors } = __modules["renderer.js"];
const { createLifeViewportBridge, LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR } = __modules["viewport-bridge.js"];

function invariant(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_SHIPPING_INVALID: ${message}`);
}

const LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR = Object.freeze({
  id: 'ofu.v2x-08.life-shipping-adapter',
  version: '2.0.0',
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  providerId: LIFE_V2_PROVIDER_DESCRIPTOR.id,
  viewportBridgeId: LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR.id,
  additiveOnly: true,
  centralAuthorityOverrides: Object.freeze([]),
  runtimeExports: Object.freeze([
    'modelProvider',
    'viewport',
    'buildViewportPacket',
    'revisit',
    'reachabilityWitness',
  ]),
});

function createLifeShippingAdapter({ getState }) {
  invariant(typeof getState === 'function', 'getState function required');
  const checkedGetState = () => {
    const state = getState();
    invariant(state?.schema === 'ofu-v2x-08-life-state-1', 'valid V2X-08 life state required');
    return state;
  };
  const modelProvider = createLifeProvider({ getState: checkedGetState });
  const viewport = createLifeViewportBridge({
    provider: modelProvider,
    renderDescriptors: buildOrganismRenderDescriptors,
    getEventKey: () => checkedGetState().eventKey,
  });

  return Object.freeze({
    descriptor: LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR,
    modelProvider,
    viewport,
    buildViewportPacket: viewport.buildViewportPacket,
    revisit: viewport.revisit,
    reachabilityWitness: viewport.reachabilityWitness,
  });
}
return Object.freeze({LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR,createLifeShippingAdapter});
})();
const model=__modules['model.js'];
const renderer=__modules['renderer.js'];
const bridge=__modules['viewport-bridge.js'];
const shipping=__modules['shipping-adapter.js'];
const api=Object.freeze({
  VERSION:'ofu-v2x-08-life-shipping-runtime-2',
  authorityClass:'MODEL_DERIVED_SIMULATION',
  createLifeState:model.createLifeState,
  advanceEcology:model.advanceEcology,
  applyLineageEvent:model.applyLineageEvent,
  summarizeLifeState:model.summarizeLifeState,
  buildOrganismRenderDescriptors:renderer.buildOrganismRenderDescriptors,
  createLifeViewportBridge:bridge.createLifeViewportBridge,
  fingerprintLifeViewport:bridge.fingerprintLifeViewport,
  createLifeShippingAdapter:shipping.createLifeShippingAdapter,
  descriptor:shipping.LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR,
});
Object.defineProperty(O,'v2x08LifeV2',{value:api,enumerable:true,configurable:false,writable:false});
})(typeof globalThis!=='undefined'?globalThis:this);
