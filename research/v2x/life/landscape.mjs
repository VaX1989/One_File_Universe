import { addSafe, asciiCompare, assertRecord, boundedArray, mulDivFloor, nonNegativeInt, ppm, sumSafe, uniqueIds } from '../reference/bounded-math.mjs';
import { LIFE_AUTHORITY, LIFE_LIMITS } from './energetics.mjs';

function allocateCapacity(capacity, requests, label) {
  const ordered=[...requests].sort((a,b)=>asciiCompare(a.id,b.id));
  const total=sumSafe(ordered.map(x=>x.request),`${label}.totalRequest`),out=new Map();
  if(total<=capacity){for(const x of ordered)out.set(x.id,x.request);return out;}
  let used=0;
  for(const x of ordered){const value=mulDivFloor(capacity,x.request,total,`${label}.${x.id}`);out.set(x.id,value);used=addSafe(used,value,`${label}.used`);}
  let residual=capacity-used;
  for(const x of ordered){if(residual===0)break;const room=x.request-out.get(x.id);if(room>0){out.set(x.id,out.get(x.id)+1);residual-=1;}}
  return out;
}

export function routePropagules(network, propagules) {
  assertRecord(network, 'network'); boundedArray(network.patches, 'network.patches', LIFE_LIMITS.patches); boundedArray(network.edges, 'network.edges', LIFE_LIMITS.trophicLinks); boundedArray(propagules, 'propagules', LIFE_LIMITS.trophicLinks);
  const patchIds = uniqueIds(network.patches, 'network.patches'); const edgeIds = uniqueIds(network.edges, 'network.edges'); uniqueIds(propagules,'propagules'); const edgeById = new Map(network.edges.map((edge) => [edge.id, edge])); const edgeUse = new Map(network.edges.map((edge) => [edge.id, 0])); const arrivals = new Map([...patchIds].map((id) => [id, 0]));
  for (const edge of network.edges) { if (!patchIds.has(edge.from) || !patchIds.has(edge.to) || edge.from===edge.to) throw new Error(`edge ${edge.id} references invalid patch transition`); nonNegativeInt(edge.capacity, `${edge.id}.capacity`, 1_000_000_000); ppm(edge.survivalPpm, `${edge.id}.survivalPpm`); }
  const byEdge=new Map(network.edges.map(e=>[e.id,[]]));
  for(const movement of propagules){assertRecord(movement,'propagule movement');if(!edgeIds.has(movement.edgeId))throw new Error(`unknown edge ${movement.edgeId}`);byEdge.get(movement.edgeId).push({id:movement.id,request:nonNegativeInt(movement.count,'movement.count',1_000_000_000)});}
  const movementEvidence=[];
  for(const edgeId of [...edgeIds].sort(asciiCompare)){const edge=edgeById.get(edgeId),requests=byEdge.get(edgeId),allocation=allocateCapacity(edge.capacity,requests,`edge.${edgeId}`);let used=0;for(const item of [...requests].sort((a,b)=>asciiCompare(a.id,b.id))){const dispatched=allocation.get(item.id)??0,survived=mulDivFloor(dispatched,edge.survivalPpm,1_000_000,`survival.${edge.id}.${item.id}`);used=addSafe(used,dispatched,`edgeUse.${edge.id}`);arrivals.set(edge.to,addSafe(arrivals.get(edge.to),survived,`arrivals.${edge.to}`));movementEvidence.push(Object.freeze({movementId:item.id,edgeId,requested:item.request,dispatched,capacityRejected:item.request-dispatched,survived}));}edgeUse.set(edge.id,used);}
  return Object.freeze({ authority: LIFE_AUTHORITY, arrivals: Object.freeze(Object.fromEntries([...arrivals.entries()].sort(([a],[b])=>asciiCompare(a,b)))), edgeUse: Object.freeze(Object.fromEntries([...edgeUse.entries()].sort(([a],[b])=>asciiCompare(a,b)))), movements:Object.freeze(movementEvidence), allocationSemantics:'SIMULTANEOUS_PROPORTIONAL_PER_EDGE_WITH_ASCII_ID_RESIDUAL', permutationInvariantGivenUniqueIds:true, nonClaim: 'Dispersal attenuation is an explicit scenario parameter, not a universal biological law.' });
}

export function successionEligibility(patch, candidate) {
  assertRecord(patch, 'patch'); assertRecord(candidate, 'candidate'); const disturbanceAge = nonNegativeInt(patch.disturbanceAgeTicks, 'patch.disturbanceAgeTicks', 1_000_000_000); const minAge = nonNegativeInt(candidate.minDisturbanceAgeTicks ?? 0, 'candidate.minDisturbanceAgeTicks', 1_000_000_000); const resource = nonNegativeInt(patch.resourceIndex, 'patch.resourceIndex', 1_000_000); const minResource = nonNegativeInt(candidate.minResourceIndex ?? 0, 'candidate.minResourceIndex', 1_000_000);
  return Object.freeze({ authority: LIFE_AUTHORITY, eligible: disturbanceAge >= minAge && resource >= minResource, successionStageClaim: false, nonClaim: 'Eligibility does not impose a universal pioneer-to-climax sequence.' });
}
