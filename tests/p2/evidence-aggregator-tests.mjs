import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {
  EVIDENCE_KINDS as K,
  EXPECTED_BROWSER_TARGETS as T,
  P2_UNICODE_PROFILE as U,
} from '../../tools/p2-evidence-contract.mjs';

const m = JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json'));
const H = 'a'.repeat(64);
const C = '1'.repeat(40);
const can = () => ({
  corpusDigest: m.corpusDigest,
  kernelDigest: m.kernelDigest,
  semanticManifestHash: m.semanticManifestHash,
  universeIdentity: m.universeIdentity,
});
const uc = (browser = false) => ({
  profileVersion: U.version,
  unicodeVersion: U.unicodeVersion,
  rangeCount: U.rangeCount,
  rangeSha256: U.rangeSha256,
  ...(!browser ? {unicodeDataSha256: H} : {}),
  normalizationTestSha256: H,
  normalizationRows: 10,
  nfcAssertions: 50,
});
const browser = target => ({
  evidenceSchemaVersion: 1,
  phase: 'P2',
  evidenceKind: K.browser,
  producer: 'test-browser',
  sourceCommit: C,
  status: 'PASS',
  target: {
    ...target,
    browserVersion: '1',
    playwrightVersion: '1.62.1',
    nodeVersion: 'v24.20.0',
    protocol: 'file:',
  },
  canonical: can(),
  unicodeConformance: uc(true),
  workerDigests: [m.kernelDigest, m.kernelDigest, m.kernelDigest],
});
const docs = () => ({
  b: T.map(browser),
  n: {
    evidenceSchemaVersion: 1,
    phase: 'P2',
    evidenceKind: K.nodeOracle,
    producer: 'test-oracle',
    sourceCommit: C,
    status: 'PASS',
    nodeVersion: 'v24.20.0',
    pythonVersion: 'Python 3.13',
    platform: 'linux',
    arch: 'x64',
    oracleCases: 582,
    fuzzSeeds: ['a'],
    fuzzIterations: 1,
    canonical: can(),
    unicodeProfile: {
      version: U.version,
      unicodeVersion: U.unicodeVersion,
      rangeCount: U.rangeCount,
      rangeSha256: U.rangeSha256,
    },
    unicodeConformance: uc(false),
  },
  q: {
    evidenceSchemaVersion: 1,
    phase: 'P2',
    evidenceKind: K.benchmark,
    producer: 'test-benchmark',
    sourceCommit: C,
    status: 'PASS',
    nodeVersion: 'v24.20.0',
    pythonVersion: 'Python 3.13',
    platform: 'linux',
    arch: 'x64',
    results: [{name: 'x', iterations: 1, inputBytes: 1, outputBytes: 1, elapsedMs: 1, opsPerSecond: 1}],
  },
  u: {
    evidenceSchemaVersion: 1,
    phase: 'P2',
    evidenceKind: K.build,
    producer: 'test-build',
    sourceCommit: C,
    status: 'PASS',
    nodeVersion: 'v24.20.0',
    platform: 'linux',
    arch: 'x64',
    artifact: 'x.html',
    artifactSha256: H,
    artifactBytes: 1,
    componentManifestHash: H,
    canonical: can(),
  },
  r: {
    evidenceSchemaVersion: 1,
    phase: 'P2',
    evidenceKind: K.reproducibleBuild,
    producer: 'test-repro',
    sourceCommit: C,
    status: 'PASS',
    nodeVersion: 'v24.20.0',
    platform: 'linux',
    arch: 'x64',
    canonical: can(),
    cleanBuilds: [{artifactSha256: H, artifactBytes: 1}, {artifactSha256: H, artifactBytes: 1}],
    byteIdentical: true,
  },
});

function write(dir, name, value) {
  fs.writeFileSync(path.join(dir, name), JSON.stringify(value));
}

function run(mut = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofu-e-'));
  const values = docs();
  mut(values, dir);
  values.b.forEach((value, index) => write(dir, `b${index}.json`, value));
  write(dir, 'n.json', values.n);
  write(dir, 'q.json', values.q);
  write(dir, 'u.json', values.u);
  write(dir, 'r.json', values.r);
  const result = spawnSync(process.execPath, ['tools/aggregate-p2-evidence.mjs', dir], {
    encoding: 'utf8',
    env: {...process.env, OFU_SOURCE_SHA: C},
  });
  const output = JSON.parse(fs.readFileSync('dist/p2-aggregate.json'));
  fs.rmSync('dist/p2-aggregate.json', {force: true});
  fs.rmSync(dir, {recursive: true, force: true});
  return {z: result, o: output};
}

function neg(name, mut, codes) {
  const result = run(mut);
  assert.notEqual(result.z.status, 0, name);
  const have = new Set(result.o.failures.map(x => x.code));
  for (const code of codes) assert.ok(have.has(code), `${name} expected ${code}`);
}

let positive = run();
assert.equal(positive.z.status, 0);
assert.equal(positive.o.status, 'PASS');
assert.equal(positive.o.targets.length, 5);
assert.equal(positive.o.benchmark.evidenceKind, K.benchmark);

neg('missing', x => x.b.pop(), ['MISSING_TARGET']);
neg('conflict', (x, dir) => {
  const record = structuredClone(x.b[0]);
  record.canonical.kernelDigest = 'b'.repeat(64);
  write(dir, 'extra.json', record);
}, ['CONFLICTING_TARGET']);
neg('duplicate', (x, dir) => write(dir, 'extra.json', x.b[0]), ['DUPLICATE_TARGET']);
neg('schema', x => { x.b[0].evidenceSchemaVersion = 9; }, ['MALFORMED_EVIDENCE', 'MISSING_TARGET']);
neg('kind', x => { x.b[0].evidenceKind = 'wrong'; }, ['MALFORMED_EVIDENCE', 'MISSING_TARGET']);
neg('field', x => { delete x.b[0].canonical.kernelDigest; }, ['MALFORMED_EVIDENCE']);
neg('kernel', x => { x.b[0].canonical.kernelDigest = 'b'.repeat(64); }, ['CANONICAL_MISMATCH', 'CROSS_RUNTIME_DISAGREEMENT']);
neg('identity', x => { x.b[0].canonical.universeIdentity = 'b'.repeat(64); }, ['CANONICAL_MISMATCH']);
neg('manifest', x => { x.b[0].canonical.semanticManifestHash = 'b'.repeat(64); }, ['CANONICAL_MISMATCH']);
neg('unicode-hash', x => { x.b[0].unicodeConformance.rangeSha256 = 'b'.repeat(64); }, ['MALFORMED_EVIDENCE', 'MISSING_TARGET']);
neg('unicode-data', x => { delete x.n.unicodeConformance.unicodeDataSha256; }, ['MALFORMED_EVIDENCE']);
neg('protocol', x => { x.b[0].target.protocol = 'http:'; }, ['DIRECT_OPEN_PROTOCOL']);
neg('unexpected', x => { x.b[0].target.browser = 'edge'; }, ['MISSING_TARGET', 'UNEXPECTED_TARGET']);
neg('browserVersion', x => { delete x.b[0].target.browserVersion; }, ['MALFORMED_EVIDENCE']);
neg('untyped', (x, dir) => write(dir, 'junk.json', {platform: 'linux'}), ['UNTYPED_EVIDENCE']);
neg('commit', x => { x.b[0].sourceCommit = '2'.repeat(40); }, ['SOURCE_COMMIT_DISAGREEMENT']);
neg('repro', x => { x.r.cleanBuilds[1].artifactSha256 = 'b'.repeat(64); }, ['REPRODUCIBLE_BUILD_MISMATCH']);
neg('nested', (x, dir) => write(dir, 'aggregate.json', {
  evidenceSchemaVersion: 1,
  phase: 'P2',
  evidenceKind: K.aggregate,
  producer: 'x',
  sourceCommit: C,
  status: 'PASS',
}), ['MALFORMED_EVIDENCE']);

neg('oversized-json', (x, dir) => {
  fs.writeFileSync(path.join(dir, 'oversized.json'), ' '.repeat(1_048_577));
}, ['RESOURCE_LIMIT']);

neg('entry-budget', (x, dir) => {
  for (let i = 0; i < 513; i++) fs.writeFileSync(path.join(dir, `noise-${String(i).padStart(3, '0')}.txt`), 'x');
}, ['RESOURCE_LIMIT']);

neg('depth-budget', (x, dir) => {
  let current = dir;
  for (let i = 0; i < 14; i++) {
    current = path.join(current, `d${i}`);
    fs.mkdirSync(current);
  }
  fs.writeFileSync(path.join(current, 'deep.json'), '{}');
}, ['RESOURCE_LIMIT']);

if (process.platform !== 'win32') {
  neg('symlink-evidence', (x, dir) => {
    const real = path.join(dir, 'real-evidence.json');
    fs.writeFileSync(real, '{}');
    fs.symlinkSync(real, path.join(dir, 'linked-evidence.json'));
  }, ['UNSAFE_EVIDENCE_PATH']);
}

console.log('P2 typed evidence aggregator controls: PASS');
