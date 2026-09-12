import {
  LIFE_V2_LIMITS,
  createLifeState,
  advanceEcology,
  applyLineageEvent,
} from './model.js';

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

export const LIFE_V2_SUCCESSION_DESCRIPTOR = Object.freeze({
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  dispersalSemantics: 'AGGREGATE_CONSERVATIVE_TRANSFER',
  colonizationSemantics: 'REQUIRES_EXISTING_REPRESENTED_SOURCE_LIFE',
  successionSemantics: 'PROFILE_BOUND_DESCRIPTOR',
  environmentMutation: false,
  temporalAuthority: 'P4_EXTERNAL_EVENT_ORDER',
});

export function applyDispersal(state, event) {
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

export function describeSuccession(state, regionId, profile) {
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

export function compareRecovery(beforeState, afterState, regionId) {
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

export function replayLifeTransitions(initialState, events) {
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
