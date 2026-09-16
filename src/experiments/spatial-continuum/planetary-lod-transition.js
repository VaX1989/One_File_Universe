import {
  CUBE_EDGES,
  CUBE_FACES,
  cubeFaceUvToDirection,
  cubeSphereTileEdgeNeighbor,
  cubeSphereTileUvBounds
} from './planetary-topology.js';

const CONTRACT = 'ofu-r6-w0-planetary-lod-continuity-1';
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const smooth = value => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => Number(a) + (Number(b) - Number(a)) * Number(t);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angularDistance = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
const freeze = value => Object.freeze(value);

export const PLANETARY_LOD_CONTINUITY_CONTRACT = CONTRACT;

function edgeUv(bounds, edge, t) {
  const value = clamp01(t);
  if (edge === 'WEST') return [bounds.minU, mix(bounds.minV, bounds.maxV, value)];
  if (edge === 'EAST') return [bounds.maxU, mix(bounds.minV, bounds.maxV, value)];
  if (edge === 'SOUTH') return [mix(bounds.minU, bounds.maxU, value), bounds.minV];
  if (edge === 'NORTH') return [mix(bounds.minU, bounds.maxU, value), bounds.maxV];
  throw new RangeError('Unknown cube-sphere edge: ' + edge);
}

function directionToFaceUv(face, direction) {
  const [x, y, z] = direction, key = String(face).toUpperCase();
  if (key === 'PX') return [-z / x, y / x];
  if (key === 'NX') return [z / -x, y / -x];
  if (key === 'PY') return [x / y, -z / y];
  if (key === 'NY') return [x / -y, z / -y];
  if (key === 'PZ') return [x / z, y / z];
  if (key === 'NZ') return [-x / -z, y / -z];
  throw new RangeError('Unknown cube-sphere face: ' + face);
}

function edgeParameter(bounds, edge, direction) {
  const [u, v] = directionToFaceUv(bounds.face, direction);
  if (edge === 'WEST' || edge === 'EAST') return (v - bounds.minV) / (bounds.maxV - bounds.minV);
  return (u - bounds.minU) / (bounds.maxU - bounds.minU);
}

export function planetaryPatchEdgeDirections(tile, edge, segments = 12) {
  const count = Number(segments), direction = String(edge).toUpperCase(), bounds = cubeSphereTileUvBounds(tile);
  if (!CUBE_EDGES.includes(direction) || !Number.isInteger(count) || count < 1 || count > 128) throw new TypeError('Invalid planetary patch edge sampling inputs');
  return freeze(Array.from({ length: count + 1 }, (_, index) => {
    const [u, v] = edgeUv(bounds, direction, index / count);
    return cubeFaceUvToDirection(bounds.face, u, v);
  }));
}

function edgeProbeDirections(tile, edge) {
  const bounds = cubeSphereTileUvBounds(tile);
  return [0, .25, .5, .75, 1].map(t => {
    const [u, v] = edgeUv(bounds, edge, t);
    return cubeFaceUvToDirection(bounds.face, u, v);
  });
}

function edgesTouch(tileA, edgeA, tileB, edgeB, toleranceRad = 2e-8) {
  const a = edgeProbeDirections(tileA, edgeA), b = edgeProbeDirections(tileB, edgeB);
  let matches = 0;
  for (const first of a) if (b.some(second => angularDistance(first, second) <= toleranceRad)) matches++;
  return matches >= 2;
}

function patchKey(tile) {
  return `${tile.face}:${tile.level}:${tile.x}:${tile.y}`;
}

function touchingEdge(tileA, edgeA, tileB) {
  for (const edgeB of CUBE_EDGES) if (edgesTouch(tileA, edgeA, tileB, edgeB)) return edgeB;
  return null;
}

function touchingRelations(index, patch, edge) {
  const neighbor = cubeSphereTileEdgeNeighbor(patch, edge), candidates = [];
  const exact = index.get(neighbor.id);
  if (exact) candidates.push(exact);
  if (neighbor.level > 0) {
    const parent = { face: neighbor.face, level: neighbor.level - 1, x: Math.floor(neighbor.x / 2), y: Math.floor(neighbor.y / 2) }, coarse = index.get(patchKey(parent));
    if (coarse) candidates.push(coarse);
  }
  if (neighbor.level < 26) {
    for (const dx of [0, 1]) for (const dy of [0, 1]) {
      const child = { face: neighbor.face, level: neighbor.level + 1, x: neighbor.x * 2 + dx, y: neighbor.y * 2 + dy }, fine = index.get(patchKey(child));
      if (fine) candidates.push(fine);
    }
  }
  const unique = [...new Map(candidates.map(candidate => [candidate.id, candidate])).values()], relations = [];
  for (const candidate of unique) {
    const candidateEdge = touchingEdge(patch, edge, candidate);
    if (candidateEdge) relations.push({ patch: candidate, edge: candidateEdge });
  }
  return relations.sort((a, b) => a.patch.id.localeCompare(b.patch.id));
}

function cornerDirection(tile, corner) {
  const bounds = cubeSphereTileUvBounds(tile), u = corner.includes('E') ? bounds.maxU : bounds.minU, v = corner.includes('N') ? bounds.maxV : bounds.minV;
  return cubeFaceUvToDirection(bounds.face, u, v);
}

const cornerKey = direction => direction.map(value => Math.round(value * 1e10)).join(':');

function buildFineToCoarseRules(finePatch, fineEdge, coarsePatch, coarseEdge, segments) {
  const fineDirections = planetaryPatchEdgeDirections(finePatch, fineEdge, segments), coarseBounds = cubeSphereTileUvBounds(coarsePatch), rules = [];
  for (let index = 0; index <= segments; index++) {
    const coarseT = Math.max(0, Math.min(1, edgeParameter(coarseBounds, coarseEdge, fineDirections[index]))), position = coarseT * segments, lower = Math.min(segments - 1, Math.max(0, Math.floor(position + 1e-10))), alpha = Math.max(0, Math.min(1, position - lower)), aligned = Math.min(Math.abs(alpha), Math.abs(1 - alpha)) <= 1e-8;
    if (!aligned) rules.push(freeze({ vertexIndex: index, coarsePatchId: coarsePatch.id, coarseEdge, coarseSegmentIndex: lower, coarseSegmentAlpha: alpha, mode: 'LERP_COARSE_EDGE' }));
  }
  return freeze(rules);
}

export function geomorphWeightForPatch(patch, { lowerPressure = .32, upperPressure = .92 } = {}) {
  const low = Math.max(0, Number(lowerPressure) || .32), high = Math.max(low + 1e-6, Number(upperPressure) || .92), pressure = Number(patch?.refinementPressure);
  return Number.isFinite(pressure) ? smooth((pressure - low) / (high - low)) : 1;
}

export function buildPlanetarySeamTopology(plan, { segments = 12 } = {}) {
  if (!plan || !Array.isArray(plan.patches) || !plan.bounded || !plan.neighborConstrained) throw new TypeError('A bounded neighbor-constrained planetary plan is required');
  const count = Number(segments);
  if (!Number.isInteger(count) || count < 2 || count > 128 || count % 2 !== 0) throw new TypeError('Seam stitching requires an even segment count in [2,128]');
  const patches = [...plan.patches], index = new Map(patches.map(patch => [patch.id, patch])), edgeConstraints = [], crossFace = [], mixed = [], openEdges = [];
  for (const patch of patches) for (const edge of CUBE_EDGES) {
    const neighbors = touchingRelations(index, patch, edge);
    if (!neighbors.length) {
      const entry = freeze({ patchId: patch.id, edge, mode: 'CULLED_BOUNDARY', neighbors: freeze([]), stitchVertices: freeze([]), crossFace: false, levelDelta: null });
      edgeConstraints.push(entry); openEdges.push(entry); continue;
    }
    const descriptors = [], stitchVertices = [];
    for (const relation of neighbors) {
      const levelDelta = Number(patch.level) - Number(relation.patch.level), isCrossFace = patch.face !== relation.patch.face;
      descriptors.push(freeze({ patchId: relation.patch.id, edge: relation.edge, levelDelta, crossFace: isCrossFace }));
      if (isCrossFace) crossFace.push(`${patch.id}:${edge}->${relation.patch.id}:${relation.edge}`);
      if (levelDelta > 0) stitchVertices.push(...buildFineToCoarseRules(patch, edge, relation.patch, relation.edge, count));
      if (levelDelta !== 0) mixed.push(`${patch.id}:${edge}->${relation.patch.id}:${relation.edge}:${levelDelta}`);
    }
    const maxDelta = Math.max(...descriptors.map(item => Math.abs(item.levelDelta))), mode = descriptors.some(item => item.levelDelta > 0) ? 'FINE_TO_COARSE_STITCH' : descriptors.some(item => item.levelDelta < 0) ? 'COARSE_WITH_FINE_NEIGHBORS' : 'MATCHED_EDGE';
    edgeConstraints.push(freeze({ patchId: patch.id, edge, mode, neighbors: freeze(descriptors), stitchVertices: freeze(stitchVertices), crossFace: descriptors.some(item => item.crossFace), levelDelta: maxDelta }));
  }
  const cornerMembership = new Map(), corners = ['SW', 'SE', 'NW', 'NE'];
  for (const patch of patches) for (const corner of corners) {
    const direction = cornerDirection(patch, corner), key = cornerKey(direction), members = cornerMembership.get(key) || [];
    members.push({ patchId: patch.id, corner, direction }); cornerMembership.set(key, members);
  }
  const cornerConstraints = [...cornerMembership.entries()].filter(([, members]) => members.length > 1).map(([key, members]) => {
    const ordered = members.sort((a, b) => a.patchId.localeCompare(b.patchId) || a.corner.localeCompare(b.corner)), owner = ordered[0];
    return freeze({ key, ownerPatchId: owner.patchId, canonicalDirection: freeze([...owner.direction]), members: freeze(ordered.map(member => freeze({ patchId: member.patchId, corner: member.corner }))), mode: 'CANONICAL_DIRECTION_CORNER_SNAP' });
  }).sort((a, b) => a.key.localeCompare(b.key));
  const morphWeights = freeze(Object.fromEntries(patches.map(patch => [patch.id, geomorphWeightForPatch(patch)])));
  return freeze({ contract: CONTRACT, planContract: plan.contract, segmentCount: count, patchCount: patches.length, edgeConstraintCount: edgeConstraints.length, crossFaceRelationCount: new Set(crossFace).size, mixedLodRelationCount: new Set(mixed).size, openEdgeCount: openEdges.length, maximumLevelDelta: Math.max(0, ...edgeConstraints.filter(item => item.levelDelta != null).map(item => item.levelDelta)), edgeConstraints: freeze(edgeConstraints), cornerConstraints: freeze(cornerConstraints), morphWeights, crackPolicy: 'FINE_EDGE_VERTICES_LERP_TO_COARSE_EDGE; SAME_LEVEL_EDGES_SHARE_BODY_FIXED_DIRECTIONS', cornerPolicy: 'SHARED_CANONICAL_BODY_FIXED_DIRECTION', authority: 'PRESENTATION_ONLY', canonicalGeographyMutation: false });
}

function planDescriptor(plan, surfaceKey, token, complete) {
  if (!plan || !Array.isArray(plan.patches) || !plan.bounded || !plan.neighborConstrained) return null;
  const ids = plan.patches.map(patch => String(patch.id)).sort();
  return freeze({ plan, signature: ids.join('|'), patchIds: freeze(ids), surfaceKey: String(surfaceKey || plan.semanticSurfaceKey || ''), transitionToken: String(token || ''), complete: complete === true });
}

export function createPlanetaryLodTransitionController({ morphDurationMs = 220, maxPatches = 96 } = {}) {
  const duration = Math.max(80, Number(morphDurationMs) || 220), patchLimit = Math.max(6, Math.floor(Number(maxPatches) || 96)), residentLimit = patchLimit * 2;
  let surfaceKey = '', lastComplete = null, pending = null, blend = null, epoch = 0, cancellations = 0, staleRejects = 0, identityResets = 0, commits = 0, lastOutput = null;
  const reset = nextKey => { surfaceKey = nextKey; lastComplete = null; pending = null; blend = null; epoch++; identityResets++; };
  function output(now) {
    const progress = blend ? smooth((Number(now) - blend.startedAt) / duration) : 1;
    if (blend && progress >= 1) { lastComplete = blend.target; pending = null; blend = null; commits++; }
    const source = blend?.source || lastComplete, target = blend?.target || null, blendProgress = blend ? smooth((Number(now) - blend.startedAt) / duration) : 1, sourceWeight = target ? 1 - blendProgress : source ? 1 : 0, targetWeight = target ? blendProgress : 0, residentIds = new Set([...(source?.patchIds || []), ...(target?.patchIds || [])]), coverageSafeWithoutBackstop = !!source || !!target?.complete, residentPatchCount = residentIds.size;
    if (residentPatchCount > residentLimit) throw new Error('Planetary LOD transition resident bound exceeded');
    lastOutput = freeze({ contract: CONTRACT, epoch, surfaceIdentityKey: surfaceKey || null, semanticIdentityDerivedFromTessellation: false, sourcePlanSignature: source?.signature || null, targetPlanSignature: target?.signature || pending?.signature || null, sourceWeight, targetWeight, morphing: !!target, blendProgress, retainedOldCoverage: !!source && !!target, coverageSafeWithoutBackstop, coarseBackstopRequired: !coverageSafeWithoutBackstop, residentPatchCount, residentPatchLimit: residentLimit, bounded: residentPatchCount <= residentLimit, metrics: freeze({ cancellations, staleRejects, identityResets, commits }) });
    return lastOutput;
  }
  return freeze({
    update({ plan, now = 0, surfaceIdentityKey = plan?.semanticSurfaceKey || '', transitionToken = '', activeTransitionToken = transitionToken, coverageComplete = true, cancelled = false } = {}) {
      const nextKey = String(surfaceIdentityKey || '');
      if (!nextKey) throw new TypeError('Planetary LOD transition requires a stable surface identity key');
      if (!surfaceKey) surfaceKey = nextKey; else if (surfaceKey !== nextKey) reset(nextKey);
      if (cancelled) { pending = null; blend = null; cancellations++; return output(now); }
      const candidate = planDescriptor(plan, nextKey, transitionToken, coverageComplete);
      if (candidate && candidate.transitionToken && activeTransitionToken && candidate.transitionToken !== String(activeTransitionToken)) { staleRejects++; pending = null; return output(now); }
      if (!candidate) return output(now);
      if (!candidate.complete) { pending = candidate; return output(now); }
      if (!lastComplete) { lastComplete = candidate; pending = null; return output(now); }
      if (candidate.signature !== lastComplete.signature) {
        if (!blend || blend.target.signature !== candidate.signature) blend = freeze({ source: lastComplete, target: candidate, startedAt: Number(now) || 0 });
        pending = candidate;
      }
      return output(now);
    },
    cancel(now = 0) { pending = null; blend = null; cancellations++; return output(now); },
    snapshot(now = 0) { return output(now); }
  });
}

export function planetaryLodIntegrationContract() {
  return freeze({ contract: CONTRACT, owner: 'R6-D', integrationOwner: 'CONTROL_CONVERGENCE', baseDependency: 'R6-B_EVIDENCE_APPROVED_HEAD', rendererPatchRequest: freeze(['consume edgeConstraints from buildPlanetarySeamTopology while constructing planetary patch vertices', 'for FINE_TO_COARSE_STITCH edges, replace listed fine-edge vertex positions with interpolation of the referenced coarse edge vertices before upload', 'crossfade complete old/new LOD plans using createPlanetaryLodTransitionController weights; never expose partially built target coverage', 'retain canonical sphere ray picking and existing body/surface identity; never derive semantic identity from tessellation', 'disable coarse backstop only when coverageSafeWithoutBackstop is true', 'pass camera forward vector into planetaryPatchPlan for conservative frustum culling and previous patch ids for refinement hysteresis']), preservedR6BContract: freeze(['retain last complete detailed terrain coverage while replacement builds', 'reject stale transition tokens', 'preserve exact body/surface identity']), authority: freeze({ terrainGeometry: 'PRESENTATION_ONLY', lodAndMorph: 'PRESENTATION_ONLY', surfaceIdentity: 'EXISTING_CANONICAL_OR_MODEL_DERIVED_AUTHORITY', canonicalGeographyMutation: false }) });
}

export function cubeCornerWitnesses(level = 5) {
  const depth = Math.max(0, Math.min(20, Math.floor(Number(level) || 5))), witnesses = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const length = Math.sqrt(3), direction = freeze([x / length, y / length, z / length]);
    witnesses.push(freeze({ key: `${x > 0 ? 'P' : 'N'}${y > 0 ? 'P' : 'N'}${z > 0 ? 'P' : 'N'}`, level: depth, direction }));
  }
  return freeze(witnesses.sort((a, b) => a.key.localeCompare(b.key)));
}

export function cubeFaceBoundaryWitnesses(level = 5) {
  const depth = Math.max(0, Math.min(20, Math.floor(Number(level) || 5))), side = 2 ** depth, mid = Math.floor(side / 2), witnesses = [];
  for (const face of CUBE_FACES) {
    for (const edge of CUBE_EDGES) {
      const tile = edge === 'WEST' ? { face, level: depth, x: 0, y: mid } : edge === 'EAST' ? { face, level: depth, x: side - 1, y: mid } : edge === 'SOUTH' ? { face, level: depth, x: mid, y: 0 } : { face, level: depth, x: mid, y: side - 1 };
      witnesses.push(freeze({ id: `${face}:${edge}:${depth}:${tile.x}:${tile.y}`, face, edge, tile: freeze(tile), directions: planetaryPatchEdgeDirections(tile, edge, 4) }));
    }
  }
  return freeze(witnesses);
}
