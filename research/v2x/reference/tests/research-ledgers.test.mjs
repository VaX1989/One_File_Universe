import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { individualId } from '../../../../src/domains/v1/individuals/identity.js';
import { reconcileIndividuals } from '../../../../src/domains/v1/individuals/reconcile.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const researchRoot = resolve(here, '../../..');
const repoRoot = resolve(researchRoot, '..');
const read = (p) => JSON.parse(readFileSync(resolve(researchRoot, p), 'utf8'));
const readRepo = (p) => readFileSync(resolve(repoRoot, p), 'utf8');
const BASE_SHA = '2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7';
const BASE_TREE = '99e6b5ff6229d9c34d381e778c5689bf2367d256';

test('research DAG is acyclic and authenticated to the V2 parallel base', () => {
  const d = read('v2x/reference/RESEARCH_DAG.json');
  const m = new Map(d.nodes.map((n) => [n.id, n]));
  const visiting = new Set();
  const visited = new Set();
  assert.equal(d.baseSha, BASE_SHA);
  assert.equal(d.baseTree, BASE_TREE);
  assert.equal(d.authority, 'RESEARCH_ONLY');
  assert.equal(d.reconciliationPolicy, 'FORWARD_RECONCILE_TO_AUTHORIZED_V2_BASE_NO_FORCE_NO_RESET');
  assert.equal(m.size, d.nodes.length);
  function walk(id) {
    if (visiting.has(id)) throw new Error(`cycle ${id}`);
    if (visited.has(id)) return;
    assert.ok(m.has(id), `missing node ${id}`);
    visiting.add(id);
    for (const dep of m.get(id).dependsOn ?? []) walk(dep);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of m.keys()) walk(id);
  assert.equal(visited.size, m.size);
  assert.match(d.artifactLaw, /RESEARCH_ONLY/);
  assert.match(d.artifactLaw, /exact-artifact browser evidence/);
});

test('promotion packets are bounded, path-real, dispositioned and convergence-hooked where mature', () => {
  const p = read('v2x/reference/HARVEST_PACKETS.json');
  assert.equal(p.version, '2026-09-08.1');
  assert.equal(p.base.sha, BASE_SHA);
  assert.equal(p.base.tree, BASE_TREE);
  assert.ok(p.packets.length >= 10);
  const ids = new Set();
  for (const x of p.packets) {
    assert.match(x.id, /^[A-Z0-9_]+_PACKET$/);
    assert.equal(ids.has(x.id), false, `duplicate packet ${x.id}`);
    ids.add(x.id);
    for (const path of x.paths) assert.equal(existsSync(resolve(researchRoot, path.replace(/^research\//, ''))), true, `${x.id} missing ${path}`);
    assert.ok(x.researchGuarantees.length > 0);
    assert.ok(x.promotionNeeds.length > 0);
    assert.ok(x.disposition, `${x.id} missing disposition`);
    if (x.disposition.startsWith('PROMOTION_CANDIDATE')) assert.ok(x.convergenceHook, `${x.id} mature candidate lacks convergence hook`);
  }
  assert.equal(p.packets.find((x) => x.id === 'BOUNDED_DEMOGRAPHY_KINSHIP_PACKET').disposition, 'CORE_ANTI_SPOOF_PRINCIPLES_ALREADY_HARVESTED_IN_BASE');
  assert.equal(p.packets.find((x) => x.id === 'EVOLUTION_WITNESS_PACKET').convergenceHook.targetBlobAtBase, '7654160594e86087358de5076a08d8aeb0852f14');
});

test('V2 base already contains the V2X-10 anti-spoof repair rather than the old delimiter fallback', () => {
  assert.throws(() => individualId({ worldId: 'a|b', settlementId: 'c', birthOrdinal: 7 }), /reserved delimiter\/control characters/);
  const valid = { worldId: 'world', settlementId: 'settlement', birthOrdinal: 0, role: 'resident' };
  const person = { ...valid, id: individualId(valid) };
  assert.equal(reconcileIndividuals({ aggregate: { population: 1, nextBirthOrdinal: 1 }, people: [person] }).status, 'PASS');
  assert.equal(reconcileIndividuals({ aggregate: { population: 1, nextBirthOrdinal: 1 }, people: [{ ...person, id: 'person:forged' }] }).status, 'FAIL');
  const duplicateOrdinal = reconcileIndividuals({ aggregate: { population: 2, nextBirthOrdinal: 2 }, people: [person, { ...person, id: 'person:other' }] });
  assert.equal(duplicateOrdinal.status, 'FAIL');
  assert.ok(duplicateOrdinal.defects.some((d) => d.startsWith('duplicate-ordinal:')));
});

test('V2X-08 promotion sentinel proves the research fingerprint is not a no-op duplicate of current shipping derivation', () => {
  const source = readRepo('src/v2x-08-life-ecology-evolution-embodiment/evolution.js');
  assert.match(source, /function hash32\(/);
  assert.match(source, /trait-selector/);
  assert.match(source, /\$\{request\.eventKey\}\|\$\{lineage\.id\}/);
  const packet = read('v2x/reference/HARVEST_PACKETS.json').packets.find((x) => x.id === 'EVOLUTION_WITNESS_PACKET');
  assert.match(packet.convergenceHook.oldFallbackSentinel, /Delimiter-concatenated/);
});

test('source ledger preserves provenance and non-support boundaries', () => {
  const l = read('v2x/reference/SOURCE_LEDGER.json');
  const ids = new Set();
  assert.equal(l.verification.result, 'PASS');
  assert.equal(l.verification.method, 'AUTHORITATIVE_PRIMARY_SOURCE_RECHECK');
  assert.equal(l.sources.length, 13);
  for (const s of l.sources) {
    assert.equal(ids.has(s.id), false);
    ids.add(s.id);
    assert.ok(s.authorityClass);
    assert.match(s.url, /^https:\/\//);
    assert.ok(s.supports);
    assert.ok(s.doesNotSupport);
  }
});

test('harvest ledger records rejection, research-only boundaries, promoted base work and new selective candidates', () => {
  const l = read('v2x/reference/HARVEST_LEDGER.json');
  const statuses = new Set(l.entries.map((e) => e.status));
  assert.equal(l.version, '2026-09-08.1');
  assert.equal(l.baseSha, BASE_SHA);
  assert.equal(l.baseTree, BASE_TREE);
  assert.ok(statuses.has('REJECTED'));
  assert.ok(statuses.has('DELIBERATELY_NOT_HARVESTED'));
  assert.ok(statuses.has('ALREADY_PROMOTED_IN_V2_BASE'));
  assert.ok(statuses.has('PROMOTION_CANDIDATE_SELECTIVE'));
  assert.ok(l.entries.some((e) => e.concept.includes('simultaneous conservative compartment transport')));
});
