import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'collected');
const expectedSha = process.env.OFU_SOURCE_SHA || null;
const expectedP2 = '9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883';
const failures = [];
const failureCodes = new Set();
const LIMITS = Object.freeze({
  maxDepth: 12,
  maxEntries: 512,
  maxJsonFiles: 128,
  maxFileBytes: 1_048_576,
  maxTotalJsonBytes: 16_777_216,
});

function fail(code, message, source = null) {
  failureCodes.add(code);
  failures.push({code, message, ...(source ? {source} : {})});
}

function collectJsonFiles(dir) {
  const files = [];
  let entries = 0;
  let jsonFiles = 0;
  let totalJsonBytes = 0;
  let halted = false;

  if (!fs.existsSync(dir)) {
    fail('MISSING_EVIDENCE_ROOT', 'P4 evidence root does not exist', dir);
    return files;
  }

  let rootStat;
  try {
    rootStat = fs.lstatSync(dir);
  } catch (error) {
    fail('EVIDENCE_IO_ERROR', `cannot stat evidence root: ${error.message}`, dir);
    return files;
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail('UNSAFE_EVIDENCE_ROOT', 'evidence root must be a real directory', dir);
    return files;
  }

  function visit(current, depth) {
    if (halted) return;
    if (depth > LIMITS.maxDepth) {
      fail('RESOURCE_LIMIT', `evidence directory depth exceeds ${LIMITS.maxDepth}`, current);
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
      if (entries > LIMITS.maxEntries) {
        fail('RESOURCE_LIMIT', `evidence tree exceeds ${LIMITS.maxEntries} entries`, current);
        halted = true;
        break;
      }

      const candidate = path.join(current, entry.name);
      let stat;
      try {
        stat = fs.lstatSync(candidate);
      } catch (error) {
        fail('EVIDENCE_IO_ERROR', `cannot stat evidence path: ${error.message}`, candidate);
        continue;
      }
      if (stat.isSymbolicLink()) {
        fail('UNSAFE_EVIDENCE_PATH', 'symbolic links are forbidden in P4 evidence artifacts', candidate);
        continue;
      }
      if (stat.isDirectory()) {
        visit(candidate, depth + 1);
        continue;
      }
      if (!stat.isFile()) {
        fail('UNSAFE_EVIDENCE_PATH', 'non-regular files are forbidden in P4 evidence artifacts', candidate);
        continue;
      }
      if (path.extname(candidate).toLowerCase() !== '.json') continue;

      jsonFiles++;
      if (jsonFiles > LIMITS.maxJsonFiles) {
        fail('RESOURCE_LIMIT', `P4 evidence exceeds ${LIMITS.maxJsonFiles} JSON files`, candidate);
        halted = true;
        break;
      }
      if (stat.size > LIMITS.maxFileBytes) {
        fail('RESOURCE_LIMIT', `P4 evidence file exceeds ${LIMITS.maxFileBytes} bytes`, candidate);
        continue;
      }
      if (totalJsonBytes + stat.size > LIMITS.maxTotalJsonBytes) {
        fail('RESOURCE_LIMIT', `P4 JSON evidence exceeds ${LIMITS.maxTotalJsonBytes} total bytes`, candidate);
        halted = true;
        break;
      }
      totalJsonBytes += stat.size;
      files.push(candidate);
    }
  }

  visit(dir, 0);
  return files;
}

const allDocs = [];
for (const file of collectJsonFiles(root)) {
  try {
    allDocs.push({file, data: JSON.parse(fs.readFileSync(file, 'utf8'))});
  } catch (error) {
    fail('INVALID_JSON', `invalid JSON evidence: ${error.message}`, file);
  }
}
const docs = allDocs.filter(item => item.data && typeof item.data === 'object' && item.data.phase === 'P4');
if (!docs.length) fail('MISSING_P4_EVIDENCE', 'no P4 evidence found');

const node = docs.filter(item => item.data.evidenceKind === 'p4-node-replay');
const semantic = docs.filter(item => item.data.evidenceKind === 'p4-semantic-closure');
const performance = docs.filter(item => item.data.evidenceKind === 'p4-performance');
const browsers = docs.filter(item => item.data.evidenceKind === 'p4-browser-worker');
if (node.length !== 1) fail('NODE_CARDINALITY', 'expected exactly one p4-node-replay evidence file');
if (semantic.length !== 1) fail('SEMANTIC_CARDINALITY', 'expected exactly one p4-semantic-closure evidence file');
if (performance.length !== 1) fail('PERFORMANCE_CARDINALITY', 'expected exactly one p4-performance evidence file');

const nodeData = node.length === 1 ? node[0].data : null;
const semanticData = semantic.length === 1 ? semantic[0].data : null;
const performanceData = performance.length === 1 ? performance[0].data : null;
if (nodeData && !nodeData.crossRuntime) fail('CROSS_RUNTIME_MISSING', 'node evidence missing crossRuntime corpus', node[0].file);
if (semanticData && (semanticData.metamorphicEvents < 2000 || semanticData.compactions < 2)) {
  fail('SEMANTIC_CLOSURE_INSUFFICIENT', 'semantic closure evidence is insufficient', semantic[0].file);
}
if (performanceData && (
  performanceData.live?.commits !== 1000 ||
  !(performanceData.live?.maxTail < 128) ||
  !(performanceData.live?.retainedTail < 128)
)) fail('BOUNDED_TAIL_INSUFFICIENT', 'performance evidence does not demonstrate bounded tail', performance[0].file);

const expectedTargets = [
  ['linux', 'x64', 'chromium'],
  ['linux', 'x64', 'firefox'],
  ['linux', 'x64', 'webkit'],
  ['win32', 'x64', 'chromium'],
  ['darwin', 'arm64', 'webkit'],
];

for (const item of docs) {
  if (item.data.status !== 'PASS') fail('NON_PASS_INPUT', 'non-PASS P4 evidence', item.file);
  if (expectedSha && item.data.sourceCommit !== expectedSha) fail('SOURCE_SHA_MISMATCH', 'source SHA mismatch', item.file);
  if (item.data.p2FinalCandidate !== expectedP2) fail('P2_PIN_MISMATCH', 'P2 pin mismatch', item.file);
}

for (const [platform, arch, browser] of expectedTargets) {
  const matching = browsers.filter(item => item.data.platform === platform && item.data.arch === arch && item.data.browser === browser);
  if (matching.length !== 1) fail('BROWSER_TARGET_CARDINALITY', `expected exactly one ${platform}/${arch}/${browser} evidence file`);
}

const canonical = browsers.map(item => JSON.stringify(item.data.canonical));
if (canonical.length && new Set(canonical).size !== 1) fail('BROWSER_CANONICAL_MISMATCH', 'browser cross-runtime canonical mismatch');
if (canonical.length && nodeData?.crossRuntime && canonical[0] !== JSON.stringify(nodeData.crossRuntime)) {
  fail('NODE_BROWSER_CANONICAL_MISMATCH', 'Node/browser shared canonical corpus mismatch');
}

const success = failures.length === 0;
const out = {
  evidenceSchemaVersion: 1,
  phase: 'P4',
  evidenceKind: 'p4-aggregate',
  sourceCommit: expectedSha || nodeData?.sourceCommit || null,
  p2FinalCandidate: expectedP2,
  status: success ? 'CROSS_RUNTIME_VERIFIED' : 'FAIL',
  evidenceState: success ? 'CROSS_RUNTIME_VERIFIED' : 'FAIL',
  targets: success ? [
    {platform: process.platform, arch: process.arch, runtime: 'node'},
    ...expectedTargets.map(([platform, arch, browser]) => ({platform, arch, browser})),
  ] : [],
  nodeGolden: nodeData?.golden || null,
  crossRuntimeCanonical: nodeData?.crossRuntime || null,
  propertyHistories: nodeData?.propertyHistories ?? null,
  propertyEvents: nodeData?.propertyEvents ?? null,
  semanticClosure: semanticData ? {
    metamorphicEvents: semanticData.metamorphicEvents,
    compactions: semanticData.compactions,
    maxTail: semanticData.maxTail,
    retainedTail: semanticData.retainedTail,
    continuationStartCount: semanticData.continuationStartCount,
    transitionContract: semanticData.transitionContract,
  } : null,
  performance: performanceData?.live || null,
  failureCodes: [...failureCodes].sort(),
  failures,
};

fs.mkdirSync('dist', {recursive: true});
fs.writeFileSync('dist/p4-aggregate.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out));
if (!success) process.exit(1);
