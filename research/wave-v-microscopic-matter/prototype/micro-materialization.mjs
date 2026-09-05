import { createHash } from 'node:crypto';

export const MATERIALIZATION_TIERS = Object.freeze({
  COLD: { maxDepth: 0, maxNodes: 1 },
  WARM: { maxDepth: 2, maxNodes: 64 },
  HOT: { maxDepth: 4, maxNodes: 4096 },
  IMMEDIATE: { maxDepth: 6, maxNodes: 16384 }
});

export function requestKey(request) {
  const normalized = {
    entityId: request.entityId,
    regimeId: request.regimeId,
    localAddress: request.localAddress ?? '',
    epoch: request.epoch ?? 'static',
    fidelity: request.fidelity ?? 'APPROXIMATE'
  };
  return createHash('sha256').update('OFU-WVE-MATERIALIZE-v0\0').update(JSON.stringify(normalized)).digest('hex');
}

export function deterministicResearchPayload(request) {
  const key = requestKey(request);
  return Object.freeze({
    key,
    entityId: request.entityId,
    regimeId: request.regimeId,
    localAddress: request.localAddress ?? '',
    epoch: request.epoch ?? 'static',
    researchScalar: parseInt(key.slice(0, 12), 16) / 0xFFFFFFFFFFFF
  });
}

export class MaterializationStore {
  constructor({ tier = 'WARM' } = {}) {
    const limits = MATERIALIZATION_TIERS[tier];
    if (!limits) throw new TypeError('unknown materialization tier');
    this.tier = tier;
    this.limits = limits;
    this.cache = new Map();
  }

  materialize(request, provider = deterministicResearchPayload) {
    const depth = request.depth ?? 0;
    if (!Number.isInteger(depth) || depth < 0 || depth > this.limits.maxDepth) throw new RangeError('materialization depth exceeds tier budget');
    const key = requestKey(request);
    if (this.cache.has(key)) return this.cache.get(key);
    const value = Object.freeze(provider(request));
    this.cache.set(key, value);
    if (this.cache.size > this.limits.maxNodes) {
      const keys = [...this.cache.keys()].sort();
      while (keys.length > this.limits.maxNodes) this.cache.delete(keys.shift());
    }
    return value;
  }

  snapshotKeys() {
    return [...this.cache.keys()].sort();
  }
}
