import fs from 'node:fs';
import vm from 'node:vm';
export function load(files = []) {
  globalThis.OFU = {};
  for (const file of ['src/kernel/sha256.js', 'src/extensions/contracts.js', ...files]) vm.runInThisContext(fs.readFileSync(file, 'utf8'), {filename: file});
  return globalThis.OFU;
}
export const hash = 'a'.repeat(64);
export const budget = {entities: 256, bytes: 65536, operations: 10000, queue: 32};
export const fidelity = {regime: 'test', validity: 'bounded test domain', resolution: 'one item', uncertainty: 'not physical science'};
export function authority(kind = 'MODEL_DERIVED_SIMULATION') { return {class: kind, contract: 'test.contract', model: 'test.model', version: '1.0.0', sources: ['tests/extensions/helpers.mjs'], assumptions: ['synthetic fixture'], limitations: ['Not runtime evidence'], evidence: [{id: 'test.fixture', kind: kind === 'CANONICAL_PROVEN' ? 'PROMOTED_CONTRACT' : kind === 'MEASURED_RUNTIME_EVIDENCE' ? 'MEASUREMENT' : 'MODEL_TEST', digest: hash}]}; }
export function descriptor(id = 'test.provider', overrides = {}) { return {contract: 'ofu-px-contracts-1', id, version: '1.0.0', owner: 'test', kind: 'domain', authority: authority(), fidelity, lifecycle: 'SHIPPING', requires: [], claims: ['fixture.'+id], operations: ['INSPECT'], budget, evidence: [{id: 'test.fixture', tier: 'FAST_LOCAL'}, {id: 'test.integration', tier: 'INTEGRATION'}], mandatory: true, ...overrides}; }
export function selection() { return {contract: 'ofu-px-contracts-1', target: {universeId: hash, entityId: 'b'.repeat(64), parentId: null, kind: 'planet', address: ['universe', 'planet-1']}, context: [], time: {protocol: 'ofu-p4-temporal-v1', seconds: '0', micros: '0', lineageId: 'c'.repeat(64), historyDigest: 'd'.repeat(64)}, authority: authority()}; }
