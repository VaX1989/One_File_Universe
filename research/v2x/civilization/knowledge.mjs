import { addSafe, assertRecord, boundedArray, identifier, mulDivFloor, nonNegativeInt, ppm, uniqueIds } from '../reference/bounded-math.mjs';
import { CIV_AUTHORITY, CIV_LIMITS } from './production.mjs';

export function validateTechnologyGraph(nodes) {
  boundedArray(nodes, 'nodes', CIV_LIMITS.technologies);
  const ids = uniqueIds(nodes, 'technology nodes');
  const indegree = new Map([...ids].map((id) => [id, 0]));
  const outgoing = new Map([...ids].map((id) => [id, []]));
  for (const n of nodes) {
    boundedArray(n.requires ?? [], `${n.id}.requires`, 16);
    if (new Set(n.requires ?? []).size !== (n.requires ?? []).length) throw new Error(`technology ${n.id} has duplicate dependencies`);
    boundedArray(n.materials ?? [], `${n.id}.materials`, 16);
    const materialIds = new Set();
    for (const r of n.materials ?? []) {
      assertRecord(r, `${n.id}.material`);
      const commodityId = identifier(r.commodityId, `${n.id}.material.commodityId`);
      if (materialIds.has(commodityId)) throw new Error(`technology ${n.id} has duplicate material ${commodityId}`);
      materialIds.add(commodityId);
      nonNegativeInt(r.minStock, 'minStock', CIV_LIMITS.maxStock);
    }
    for (const d of n.requires ?? []) {
      if (!ids.has(d)) throw new Error(`technology ${n.id} missing dependency ${d}`);
      indegree.set(n.id, indegree.get(n.id) + 1);
      outgoing.get(d).push(n.id);
    }
  }
  const q = [...ids].filter((id) => indegree.get(id) === 0).sort();
  let visited = 0;
  while (q.length) {
    const id = q.shift();
    visited += 1;
    for (const next of outgoing.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) {
        q.push(next);
        q.sort();
      }
    }
  }
  if (visited !== ids.size) throw new Error('technology dependency graph contains a cycle');
  return true;
}

export function evaluateTechnology(nodes, materialAvailability = {}) {
  validateTechnologyGraph(nodes);
  assertRecord(materialAvailability, 'materialAvailability');
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map();
  function active(id, stack = new Set()) {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) throw new Error('cycle');
    stack.add(id);
    const n = byId.get(id);
    let ok = ppm(n.knowledgePpm ?? 0) >= ppm(n.minKnowledgePpm ?? 1);
    for (const d of n.requires ?? []) ok = ok && active(d, stack);
    for (const r of n.materials ?? []) {
      ok = ok && nonNegativeInt(materialAvailability[r.commodityId] ?? 0, `available.${r.commodityId}`, CIV_LIMITS.maxStock) >= r.minStock;
    }
    stack.delete(id);
    memo.set(id, ok);
    return ok;
  }
  return Object.freeze({
    authority: CIV_AUTHORITY,
    active: Object.freeze(Object.fromEntries(nodes.map((n) => [n.id, active(n.id)]))),
    nonClaim: 'Technology activation is a dependency abstraction, not invention timing.'
  });
}

export function knowledgeTick(nodes, transmissions = []) {
  validateTechnologyGraph(nodes);
  boundedArray(transmissions, 'transmissions', 256);
  const ids = new Set(nodes.map((n) => n.id));
  const opening = new Map();
  const decay = new Map();
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  const pairs = new Set();
  for (const n of nodes) {
    opening.set(n.id, ppm(n.knowledgePpm ?? 0));
    decay.set(n.id, mulDivFloor(opening.get(n.id), ppm(n.decayPpm ?? 0), 1_000_000));
  }
  for (const e of transmissions) {
    assertRecord(e, 'transmission');
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) throw new Error('invalid transmission node');
    const pair = `${e.from}>${e.to}`;
    if (pairs.has(pair)) throw new Error(`duplicate transmission ${pair}`);
    pairs.add(pair);
    const copied = mulDivFloor(opening.get(e.from), ppm(e.transferPpm), 1_000_000);
    incoming.set(e.to, addSafe(incoming.get(e.to), copied, `incoming.${e.to}`));
  }
  return Object.freeze(nodes.map((n) => {
    const afterDecay = opening.get(n.id) - decay.get(n.id);
    const unconstrained = addSafe(afterDecay, incoming.get(n.id), `knowledge.${n.id}`);
    const knowledgePpm = Math.min(1_000_000, unconstrained);
    const saturationRejectedPpm = Math.max(0, unconstrained - 1_000_000);
    return Object.freeze({
      ...n,
      knowledgePpm,
      knowledgeEvidence: Object.freeze({ openingPpm: opening.get(n.id), decayPpm: decay.get(n.id), incomingCopiedPpm: incoming.get(n.id), saturationRejectedPpm }),
      informationConservationClaim: false,
      transmissionSemantics: 'NONCONSERVATIVE_INFORMATION_COPY_PROXY'
    });
  }));
}
