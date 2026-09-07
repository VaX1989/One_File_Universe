import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'collected');
const repo = process.cwd();
const failures = [];
const failureCodes = new Set();
const LIMITS = Object.freeze({
  maxDepth: 12,
  maxEntries: 512,
  maxEvidenceFiles: 64,
  maxFileBytes: 1_048_576,
  maxEvidenceBytes: 8_388_608,
});

function fail(code, message) {
  failureCodes.add(code);
  failures.push(`[${code}] ${message}`);
}

function collectEvidenceFiles(dir) {
  const files = [];
  let entries = 0;
  let evidenceFiles = 0;
  let evidenceBytes = 0;
  let halted = false;

  if (!fs.existsSync(dir)) return files;

  let rootStat;
  try {
    rootStat = fs.lstatSync(dir);
  } catch (error) {
    fail('EVIDENCE_IO_ERROR', `cannot stat evidence root: ${error.message}`);
    return files;
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail('UNSAFE_EVIDENCE_ROOT', 'evidence root must be a real directory');
    return files;
  }

  function visit(current, depth) {
    if (halted) return;
    if (depth > LIMITS.maxDepth) {
      fail('RESOURCE_LIMIT', `evidence directory depth exceeds ${LIMITS.maxDepth}: ${current}`);
      halted = true;
      return;
    }

    let children;
    try {
      children = fs.readdirSync(current, {withFileTypes: true});
    } catch (error) {
      fail('EVIDENCE_IO_ERROR', `cannot enumerate evidence directory ${current}: ${error.message}`);
      halted = true;
      return;
    }

    for (const entry of children) {
      if (halted) break;
      entries++;
      if (entries > LIMITS.maxEntries) {
        fail('RESOURCE_LIMIT', `evidence tree exceeds ${LIMITS.maxEntries} entries`);
        halted = true;
        break;
      }

      const candidate = path.join(current, entry.name);
      let stat;
      try {
        stat = fs.lstatSync(candidate);
      } catch (error) {
        fail('EVIDENCE_IO_ERROR', `cannot stat evidence path ${candidate}: ${error.message}`);
        continue;
      }

      if (stat.isSymbolicLink()) {
        fail('UNSAFE_EVIDENCE_PATH', `symbolic links are forbidden in P1 evidence artifacts: ${candidate}`);
        continue;
      }
      if (stat.isDirectory()) {
        visit(candidate, depth + 1);
        continue;
      }
      if (!stat.isFile()) {
        fail('UNSAFE_EVIDENCE_PATH', `non-regular files are forbidden in P1 evidence artifacts: ${candidate}`);
        continue;
      }

      const base = path.basename(candidate);
      const relevant = base === 'build-manifest.json' || (/^browser-.*\.json$/.test(base) && !/-strict\.json$/.test(base));
      if (!relevant) continue;

      evidenceFiles++;
      if (evidenceFiles > LIMITS.maxEvidenceFiles) {
        fail('RESOURCE_LIMIT', `P1 evidence exceeds ${LIMITS.maxEvidenceFiles} relevant files`);
        halted = true;
        break;
      }
      if (stat.size > LIMITS.maxFileBytes) {
        fail('RESOURCE_LIMIT', `P1 evidence file exceeds ${LIMITS.maxFileBytes} bytes: ${candidate}`);
        continue;
      }
      if (evidenceBytes + stat.size > LIMITS.maxEvidenceBytes) {
        fail('RESOURCE_LIMIT', `P1 evidence exceeds ${LIMITS.maxEvidenceBytes} cumulative bytes`);
        halted = true;
        break;
      }
      evidenceBytes += stat.size;
      files.push(candidate);
    }
  }

  visit(dir, 0);
  return files;
}

function readJson(file, kind) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail('INVALID_JSON', `invalid ${kind} JSON ${file}: ${error.message}`);
    return null;
  }
}

const files = collectEvidenceFiles(root);
const browserFiles = files.filter(file => /^browser-.*\.json$/.test(path.basename(file)) && !/-strict\.json$/.test(file));
const buildFiles = files.filter(file => path.basename(file) === 'build-manifest.json');
if (buildFiles.length < 1) fail('MISSING_BUILD_MANIFEST', 'missing build manifest artifact');

const builds = buildFiles.map(file => readJson(file, 'build manifest')).filter(Boolean);
const baseline = builds[0] || {};
const vectors = JSON.parse(fs.readFileSync(path.join(repo, 'tests/vectors/p1-kernel-vectors.json'), 'utf8'));
const reports = browserFiles.map(file => readJson(file, 'browser evidence')).filter(Boolean);

const requiredTargets = [
  ['linux', 'chromium'],
  ['linux', 'firefox'],
  ['linux', 'webkit'],
  ['win32', 'chromium'],
  ['darwin', 'webkit'],
];
const requiredTests = [
  'golden-vectors',
  'canonical-corpus',
  'query-order',
  'workers-1-2-n',
  'embedded-wasm',
  'renderer-authority-boundary',
  'save-roundtrip',
  'corrupted-save-fail-closed',
  'portable-save-contract',
];

for (const [platform, browser] of requiredTargets) {
  if (!reports.some(report => report.platform === platform && report.browser === browser)) {
    fail('MISSING_TARGET', `missing target ${platform}/${browser}`);
  }
}

for (const report of reports) {
  const tag = `${report.platform}/${report.arch}/${report.browser}`;
  for (const key of ['artifactSha256', 'artifactBytes', 'generatorManifestHash', 'goldenVectorsHash', 'componentManifestHash']) {
    if (report.build?.[key] !== baseline[key]) fail('BUILD_IDENTITY_MISMATCH', `${tag} ${key} mismatch`);
  }
  if (report.build?.expectedCorpusDigest !== vectors.corpusDigest || report.strict?.digest !== vectors.corpusDigest) {
    fail('CORPUS_DIGEST_MISMATCH', `${tag} corpus digest mismatch`);
  }
  if (!report.strictEnhancedEqual || report.enhancedDigest !== report.strict?.digest) {
    fail('STRICT_ENHANCED_MISMATCH', `${tag} Strict/Enhanced mismatch`);
  }
  if (
    report.repeatDigest !== report.strict?.digest ||
    report.workerUnavailableDigest !== report.strict?.digest ||
    report.workerHangDigest !== report.strict?.digest
  ) fail('DETERMINISM_MISMATCH', `${tag} repeat/worker digest mismatch`);
  if (
    report.strictResourceAudit?.unexpected?.length ||
    report.strictResourceAudit?.unexpectedDom?.length ||
    report.strictResourceAudit?.unexpectedPerformance?.length
  ) fail('UNEXPECTED_RUNTIME_RESOURCE', `${tag} loaded or referenced unexpected runtime resources`);
  if (!report.localSubresourceDetectorVerified) fail('SUBRESOURCE_CONTROL_MISSING', `${tag} local-subresource positive control failed`);
  if (!report.componentCorruptionRejected) fail('CORRUPTION_REJECTION_MISSING', `${tag} component-corruption rejection missing`);
  for (const test of requiredTests) {
    if (report.strict?.results?.find(result => result.name === test)?.status !== 'PASS') {
      fail('MANDATORY_TEST_FAILURE', `${tag} mandatory test not PASS: ${test}`);
    }
  }
  for (const field of ['browserVersion', 'playwrightVersion', 'nodeVersion', 'osRelease']) {
    if (!report[field]) fail('ENVIRONMENT_METADATA_MISSING', `${tag} missing environment field ${field}`);
  }
}

const artifactHashes = new Set(reports.map(report => report.build?.artifactSha256));
const artifactBytes = new Set(reports.map(report => report.build?.artifactBytes));
const manifestHashes = new Set(reports.map(report => report.build?.generatorManifestHash));
const goldenHashes = new Set(reports.map(report => report.build?.goldenVectorsHash));
const componentHashes = new Set(reports.map(report => report.build?.componentManifestHash));
const digests = new Set(reports.map(report => report.strict?.digest));
for (const [name, values] of [
  ['artifact SHA-256', artifactHashes],
  ['artifact bytes', artifactBytes],
  ['Generator Manifest', manifestHashes],
  ['Golden Vector', goldenHashes],
  ['Component Manifest', componentHashes],
  ['canonical corpus', digests],
]) {
  if (values.size !== 1) fail('CROSS_MATRIX_DISAGREEMENT', `cross-matrix ${name} disagreement`);
}

const aggregate = {
  phase: 'P1',
  status: failures.length ? 'FAIL' : 'PASS',
  evidenceState: failures.length ? 'FAIL' : 'CROSS_RUNTIME_VERIFIED',
  requiredTargetCount: requiredTargets.length,
  executedTargets: reports.map(report => ({
    platform: report.platform,
    arch: report.arch,
    browser: report.browser,
    browserVersion: report.browserVersion,
    nodeVersion: report.nodeVersion,
    playwrightVersion: report.playwrightVersion,
    runner: report.runner,
    osRelease: report.osRelease,
  })),
  artifactSha256: baseline.artifactSha256,
  artifactBytes: baseline.artifactBytes,
  generatorManifestHash: baseline.generatorManifestHash,
  goldenVectorsHash: baseline.goldenVectorsHash,
  componentManifestHash: baseline.componentManifestHash,
  canonicalCorpusDigest: vectors.corpusDigest,
  failureCodes: [...failureCodes].sort(),
  failures,
};
fs.mkdirSync('dist', {recursive: true});
fs.writeFileSync('dist/p1-aggregate.json', `${JSON.stringify(aggregate, null, 2)}\n`);
console.log(JSON.stringify(aggregate, null, 2));
if (failures.length) process.exit(1);
