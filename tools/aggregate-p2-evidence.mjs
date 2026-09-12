import fs from 'node:fs';
import path from 'node:path';
import {
  EVIDENCE_SCHEMA_VERSION,
  EVIDENCE_KINDS,
  EXPECTED_BROWSER_TARGETS,
  P2_UNICODE_PROFILE,
  evidenceIdentity,
  validateEvidence,
} from './p2-evidence-contract.mjs';

const root = path.resolve(process.argv[2] || 'collected');
const meta = JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json', 'utf8'));
const failures = [];
const EVIDENCE_LIMITS = Object.freeze({
  maxDepth: 12,
  maxEntries: 512,
  maxJsonFiles: 128,
  maxFileBytes: 1_048_576,
  maxTotalJsonBytes: 16_777_216,
});

function fail(code, message, source = null) {
  failures.push({code, message, ...(source ? {source} : {})});
}

function collectJsonEvidence(dir) {
  const files = [];
  let entries = 0;
  let jsonFiles = 0;
  let totalJsonBytes = 0;
  let halted = false;
  if (!fs.existsSync(dir)) return files;

  let rootStat;
  try {
    rootStat = fs.lstatSync(dir);
  } catch (error) {
    fail('EVIDENCE_IO_ERROR', `cannot stat evidence root: ${error.message}`, dir);
    return files;
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail('UNSAFE_EVIDENCE_ROOT', 'evidence root must be a real directory, not a link or special file', dir);
    return files;
  }

  function visit(current, depth) {
    if (halted) return;
    if (depth > EVIDENCE_LIMITS.maxDepth) {
      fail('RESOURCE_LIMIT', `evidence directory depth exceeds ${EVIDENCE_LIMITS.maxDepth}`, current);
      halted = true;
      return;
    }
    let children;
    try {
      children = fs.readdirSync(current, {withFileTypes: true});
    } catch (error) {
      fail('EVIDENCE_IO_ERROR', `cannot enumerate evidence directory: ${error.message}`, current);
      halted = true;
      return;
    }
    for (const entry of children) {
      if (halted) break;
      entries++;
      if (entries > EVIDENCE_LIMITS.maxEntries) {
        fail('RESOURCE_LIMIT', `evidence tree exceeds ${EVIDENCE_LIMITS.maxEntries} entries`, current);
        halted = true;
        break;
      }
      const file = path.join(current, entry.name);
      let stat;
      try {
        stat = fs.lstatSync(file);
      } catch (error) {
        fail('EVIDENCE_IO_ERROR', `cannot stat evidence path: ${error.message}`, file);
        continue;
      }
      if (stat.isSymbolicLink()) {
        fail('UNSAFE_EVIDENCE_PATH', 'symbolic links are forbidden in P2 evidence artifacts', file);
        continue;
      }
      if (stat.isDirectory()) {
        visit(file, depth + 1);
        continue;
      }
      if (!stat.isFile()) {
        fail('UNSAFE_EVIDENCE_PATH', 'non-regular files are forbidden in P2 evidence artifacts', file);
        continue;
      }
      if (path.extname(file).toLowerCase() !== '.json') continue;

      jsonFiles++;
      if (jsonFiles > EVIDENCE_LIMITS.maxJsonFiles) {
        fail('RESOURCE_LIMIT', `P2 evidence exceeds ${EVIDENCE_LIMITS.maxJsonFiles} JSON files`, file);
        halted = true;
        break;
      }
      if (stat.size > EVIDENCE_LIMITS.maxFileBytes) {
        fail('RESOURCE_LIMIT', `P2 evidence file exceeds ${EVIDENCE_LIMITS.maxFileBytes} bytes`, file);
        continue;
      }
      if (totalJsonBytes + stat.size > EVIDENCE_LIMITS.maxTotalJsonBytes) {
        fail('RESOURCE_LIMIT', `P2 JSON evidence exceeds ${EVIDENCE_LIMITS.maxTotalJsonBytes} total bytes`, file);
        halted = true;
        break;
      }
      totalJsonBytes += stat.size;
      files.push(file);
    }
  }

  visit(dir, 0);
  return files;
}

const evidence = [];
for (const file of collectJsonEvidence(root)) {
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail('INVALID_JSON', `invalid JSON evidence: ${error.message}`, file);
    continue;
  }
  const declared = doc && typeof doc === 'object' && (
    'evidenceSchemaVersion' in doc || 'evidenceKind' in doc || doc.phase === 'P2'
  );
  if (!declared) {
    fail('UNTYPED_EVIDENCE', 'JSON in P2 artifact lacks a typed evidence envelope', file);
    continue;
  }
  const problems = validateEvidence(doc);
  if (problems.length) {
    for (const message of problems) fail('MALFORMED_EVIDENCE', message, file);
    continue;
  }
  if (doc.status !== 'PASS') fail('INPUT_STATUS_FAILURE', 'input evidence is not PASS', file);
  evidence.push({file, doc});
}

const browsers = evidence.filter(x => x.doc.evidenceKind === EVIDENCE_KINDS.browser);
const nodeOracle = evidence.filter(x => x.doc.evidenceKind === EVIDENCE_KINDS.nodeOracle);
const benchmarks = evidence.filter(x => x.doc.evidenceKind === EVIDENCE_KINDS.benchmark);
const builds = evidence.filter(x => x.doc.evidenceKind === EVIDENCE_KINDS.build);
const repro = evidence.filter(x => x.doc.evidenceKind === EVIDENCE_KINDS.reproducibleBuild);
if (nodeOracle.length !== 1) fail('NODE_ORACLE_CARDINALITY', 'expected exactly one p2-node-oracle evidence record');
if (benchmarks.length !== 1) fail('BENCHMARK_CARDINALITY', 'expected exactly one p2-benchmark evidence record');
if (builds.length !== 1) fail('BUILD_CARDINALITY', 'expected exactly one p2-build-manifest evidence record');
if (repro.length !== 1) fail('REPRODUCIBLE_BUILD_CARDINALITY', 'expected exactly one p2-reproducible-build evidence record');

const commits = new Set(evidence.map(x => x.doc.sourceCommit));
if (commits.size !== 1) fail('SOURCE_COMMIT_DISAGREEMENT', 'evidence records do not share one exact source commit');
const sourceCommit = commits.size === 1 ? [...commits][0] : null;
if (process.env.OFU_SOURCE_SHA && sourceCommit !== process.env.OFU_SOURCE_SHA) {
  fail('SOURCE_COMMIT_MISMATCH', `evidence source commit ${sourceCommit} does not match expected ${process.env.OFU_SOURCE_SHA}`);
}

const byTarget = new Map();
for (const item of browsers) {
  const key = evidenceIdentity(item.doc);
  const prior = byTarget.get(key);
  if (prior) fail(JSON.stringify(prior.doc) === JSON.stringify(item.doc) ? 'DUPLICATE_TARGET' : 'CONFLICTING_TARGET', `duplicate browser target ${key}`, item.file);
  else byTarget.set(key, item);
}
for (const target of EXPECTED_BROWSER_TARGETS) {
  const key = `${target.platform}/${target.arch}/${target.browser}`;
  if (!byTarget.has(key)) fail('MISSING_TARGET', `missing declared browser target ${key}`);
}
for (const [key, item] of byTarget) {
  if (!EXPECTED_BROWSER_TARGETS.some(target => key === `${target.platform}/${target.arch}/${target.browser}`)) {
    fail('UNEXPECTED_TARGET', `unexpected browser target ${key}`, item.file);
  }
  const record = item.doc;
  if (record.target.protocol !== 'file:') fail('DIRECT_OPEN_PROTOCOL', `browser target is not direct-open file: ${key}`, item.file);
  for (const field of ['kernelDigest', 'semanticManifestHash', 'universeIdentity', 'corpusDigest']) {
    if (record.canonical[field] !== meta[field]) fail('CANONICAL_MISMATCH', `${field} mismatch for ${key}`, item.file);
  }
  if (record.workerDigests.some(x => x !== meta.kernelDigest)) fail('WORKER_DIGEST_MISMATCH', `worker digest mismatch for ${key}`, item.file);
}

const canonical = [...browsers, ...nodeOracle, ...builds, ...repro].map(x => x.doc.canonical).filter(Boolean);
for (const field of ['kernelDigest', 'semanticManifestHash', 'universeIdentity', 'corpusDigest']) {
  if (new Set(canonical.map(c => c[field])).size !== 1) fail('CROSS_RUNTIME_DISAGREEMENT', `cross-runtime ${field} disagreement`);
}
const unicode = [...browsers, ...nodeOracle].map(x => x.doc.unicodeConformance).filter(Boolean);
for (const field of ['rangeSha256', 'normalizationTestSha256', 'normalizationRows', 'nfcAssertions']) {
  if (new Set(unicode.map(u => u[field])).size !== 1) fail('UNICODE_CONFORMANCE_DISAGREEMENT', `cross-runtime Unicode ${field} disagreement`);
}
if (unicode.some(u => u.rangeSha256 !== P2_UNICODE_PROFILE.rangeSha256 || u.rangeCount !== P2_UNICODE_PROFILE.rangeCount)) {
  fail('UNICODE_PROFILE_MISMATCH', 'Unicode profile mismatch');
}
if (builds.length === 1) {
  const build = builds[0].doc;
  if (
    build.canonical.kernelDigest !== meta.kernelDigest ||
    build.canonical.semanticManifestHash !== meta.semanticManifestHash ||
    build.canonical.universeIdentity !== meta.universeIdentity ||
    build.canonical.corpusDigest !== meta.corpusDigest
  ) fail('BUILD_CANONICAL_MISMATCH', 'build manifest canonical pins do not match Golden Corpus', builds[0].file);
}
if (repro.length === 1) {
  const record = repro[0].doc;
  const hashes = new Set(record.cleanBuilds.map(x => x.artifactSha256));
  const sizes = new Set(record.cleanBuilds.map(x => x.artifactBytes));
  if (hashes.size !== 1 || sizes.size !== 1 || !record.byteIdentical) {
    fail('REPRODUCIBLE_BUILD_MISMATCH', 'two clean builds are not byte-identical', repro[0].file);
  }
  if (
    builds.length === 1 &&
    (record.cleanBuilds[0].artifactSha256 !== builds[0].doc.artifactSha256 || record.cleanBuilds[0].artifactBytes !== builds[0].doc.artifactBytes)
  ) fail('REPRODUCIBLE_BUILD_MISMATCH', 'reproducible-build evidence does not match build manifest', repro[0].file);
}

const out = {
  evidenceSchemaVersion: EVIDENCE_SCHEMA_VERSION,
  phase: 'P2',
  evidenceKind: EVIDENCE_KINDS.aggregate,
  producer: 'tools/aggregate-p2-evidence.mjs',
  sourceCommit,
  status: failures.length ? 'FAIL' : 'PASS',
  evidenceState: failures.length ? 'FAIL' : 'CROSS_RUNTIME_VERIFIED',
  canonical: {
    corpusDigest: meta.corpusDigest,
    kernelDigest: meta.kernelDigest,
    semanticManifestHash: meta.semanticManifestHash,
    universeIdentity: meta.universeIdentity,
  },
  unicodeProfile: P2_UNICODE_PROFILE,
  unicodeConformance: unicode[0] || null,
  expectedTargets: EXPECTED_BROWSER_TARGETS,
  targets: browsers.map(x => x.doc),
  nodeOracle: nodeOracle[0]?.doc || null,
  benchmark: benchmarks[0]?.doc || null,
  build: builds[0]?.doc || null,
  reproducibleBuild: repro[0]?.doc || null,
  failures,
};
fs.mkdirSync('dist', {recursive: true});
fs.writeFileSync('dist/p2-aggregate.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out, null, 2));
if (failures.length) process.exit(1);
