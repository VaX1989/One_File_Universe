import { assertRecord, boundedArray, mulDivFloor, nonNegativeInt, ppm, uniqueIds } from '../reference/bounded-math.mjs';
import { LIFE_AUTHORITY, LIFE_LIMITS } from './energetics.mjs';

export function routePropagules(network, propagules) {
  assertRecord(network, 'network'); boundedArray(network.patches, 'network.patches', LIFE_LIMITS.patches); boundedArray(network.edges, 'network.edges', LIFE_LIMITS.trophicLinks); boundedArray(propagules, 'propagules', LIFE_LIMITS.trophicLinks);
  const patchIds = uniqueIds(network.patches, 'network.patches'); const edgeIds = uniqueIds(network.edges, 'network.edges'); const edgeById = new Map(network.edges.map((edge) => [edge.id, edge])); const edgeUse = new Map(network.edges.map((edge) => [edge.id, 0])); const arrivals = new Map([...patchIds].map((id) => [id, 0]));
  for (const edge of network.edges) { if (!patchIds.has(edge.from) || !patchIds.has(edge.to)) throw new Error(`edge ${edge.id} references unknown patch`); nonNegativeInt(edge.capacity, `${edge.id}.capacity`, 1_000_000_000); ppm(edge.survivalPpm, `${edge.id}.survivalPpm`); }
  for (const movement of [...propagules].sort((a, b) => `${a.edgeId}:${a.sourceId ?? ''}`.localeCompare(`${b.edgeId}:${b.sourceId ?? ''}`))) { assertRecord(movement, 'propagule movement'); if (!edgeIds.has(movement.edgeId)) throw new Error(`unknown edge ${movement.edgeId}`); const edge = edgeById.get(movement.edgeId); const requested = nonNegativeInt(movement.count, 'movement.count', 1_000_000_000); const remaining = Math.max(0, edge.capacity - edgeUse.get(edge.id)); const dispatched = Math.min(requested, remaining); edgeUse.set(edge.id, edgeUse.get(edge.id) + dispatched); const survived = mulDivFloor(dispatched, edge.survivalPpm, 1_000_000, `survival.${edge.id}`); arrivals.set(edge.to, arrivals.get(edge.to) + survived); }
  return Object.freeze({ authority: LIFE_AUTHORITY, arrivals: Object.freeze(Object.fromEntries([...arrivals.entries()].sort())), edgeUse: Object.freeze(Object.fromEntries([...edgeUse.entries()].sort())), nonClaim: 'Dispersal attenuation is an explicit scenario parameter, not a universal biological law.' });
}

export function successionEligibility(patch, candidate) {
  assertRecord(patch, 'patch'); assertRecord(candidate, 'candidate'); const disturbanceAge = nonNegativeInt(patch.disturbanceAgeTicks, 'patch.disturbanceAgeTicks', 1_000_000_000); const minAge = nonNegativeInt(candidate.minDisturbanceAgeTicks ?? 0, 'candidate.minDisturbanceAgeTicks', 1_000_000_000); const resource = nonNegativeInt(patch.resourceIndex, 'patch.resourceIndex', 1_000_000); const minResource = nonNegativeInt(candidate.minResourceIndex ?? 0, 'candidate.minResourceIndex', 1_000_000);
  return Object.freeze({ authority: LIFE_AUTHORITY, eligible: disturbanceAge >= minAge && resource >= minResource, successionStageClaim: false, nonClaim: 'Eligibility does not impose a universal pioneer-to-climax sequence.' });
}
