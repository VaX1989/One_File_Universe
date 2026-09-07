import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_TARGETS = Object.freeze([
  ['linux', 'x64', 'chromium'],
  ['linux', 'x64', 'firefox'],
  ['linux', 'x64', 'webkit'],
  ['win32', 'x64', 'chromium'],
  ['darwin', 'arm64', 'webkit'],
]);

const LIMITS = Object.freeze({
  maxDepth: 8,
  maxEntries: 128,
  maxBrowserFiles: 16,
  maxFileBytes: 1_048_576,
  maxTotalBrowserBytes: 8_388_608,
});

const DEFAULT_TARGET_FIELDS = Object.freeze({platform: 'platform', arch: 'arch', browser: 'browser'});
const POLICIES = Object.freeze({
  p5: Object.freeze({
    targetFields: DEFAULT_TARGET_FIELDS,
    goldenCorpusVersion: 'golden-p5-corpus-v1',
    agreement: ['physicalDigest', 'terrainDigest', 'artifactSha256', 'artifactBytes'],
    fixed: Object.freeze({}),
  }),
  'p5-environment-v2': Object.freeze({
    targetFields: DEFAULT_TARGET_FIELDS,
    goldenCorpusVersion: 'golden-p5-environment-v2-corpus-v1',
    agreement: ['manifestHash', 'environmentDigest', 'physicalDigest', 'artifactSha256'],
    fixed: Object.freeze({earthAnchorMilliK: '254578'}),
  }),
  p6: Object.freeze({
    targetFields: Object.freeze({platform: 'hostPlatform', arch: 'hostArch', browser: 'browser'}),
    goldenCorpusVersion: null,
    agreement: ['manifestHash', 'biosphereId', 'lineageId', 'speciesId', 'stateDigest', 'artifactSha256', 'goldenCorpusDigest'],
    fixed: Object.freeze({
      realSafariVerified: false,
      artifactContainsConformanceAuthority: false,
      shippedConformanceConstructor: false,
      canonicalGenesisAvailable: false,
      persistentLineageTransitions: false,
      privateClock: false,
    }),
  }),
});

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function fail(code, message, source = null) {
  const error = new Error(message);
  error.code = code;
  error.source = source;
  throw error;
}

function targetKey(record, policy, source = null) {
  const {platform, arch, browser} = policy.targetFields;
  const values = [record[platform], record[arch], record[browser]];
  if (values.some(value => typeof value !== 'string' || value.length === 0)) {
    fail('MALFORMED_TARGET', 'browser evidence target fields must be non-empty strings', source);
  }
  return values.join('/');
}

function collectBrowserEvidence(root) {
  if (!fs.existsSync(root)) fail('MISSING_EVIDENCE_ROOT', 'browser evidence root does not exist', root);
  let rootStat;
  try {
    rootStat = fs.lstatSync(root);
  } catch (error) {
    fail('EVIDENCE_IO_ERROR', `cannot stat browser evidence root: ${error.message}`, root);
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail('UNSAFE_EVIDENCE_ROOT', 'browser evidence root must be a real directory', root);
  }

  const files = [];
  let entries = 0;
  let totalBrowserBytes = 0;

  function visit(current, depth) {
    if (depth > LIMITS.maxDepth) fail('RESOURCE_LIMIT', `browser evidence depth exceeds ${LIMITS.maxDepth}`, current);
    let children;
    try {
      children = fs.readdirSync(current, {withFileTypes: true});
    } catch (error) {
      fail('EVIDENCE_IO_ERROR', `cannot enumerate browser evidence: ${error.message}`, current);
    }
    for (const entry of children) {
      entries++;
      if (entries > LIMITS.maxEntries) fail('RESOURCE_LIMIT', `browser evidence tree exceeds ${LIMITS.maxEntries} entries`, current);
      const candidate = path.join(current, entry.name);
      let stat;
      try {
        stat = fs.lstatSync(candidate);
      } catch (error) {
        fail('EVIDENCE_IO_ERROR', `cannot stat browser evidence path: ${error.message}`, candidate);
      }
      if (stat.isSymbolicLink()) fail('UNSAFE_EVIDENCE_PATH', 'symbolic links are forbidden in browser evidence artifacts', candidate);
      if (stat.isDirectory()) {
        visit(candidate, depth + 1);
        continue;
      }
      if (!stat.isFile()) fail('UNSAFE_EVIDENCE_PATH', 'non-regular files are forbidden in browser evidence artifacts', candidate);
      if (!entry.name.startsWith('browser-') || !entry.name.endsWith('.json')) continue;
      if (stat.size > LIMITS.maxFileBytes) fail('RESOURCE_LIMIT', `browser evidence file exceeds ${LIMITS.maxFileBytes} bytes`, candidate);
      if (files.length + 1 > LIMITS.maxBrowserFiles) fail('RESOURCE_LIMIT', `browser evidence exceeds ${LIMITS.maxBrowserFiles} files`, candidate);
      if (totalBrowserBytes + stat.size > LIMITS.maxTotalBrowserBytes) {
        fail('RESOURCE_LIMIT', `browser evidence exceeds ${LIMITS.maxTotalBrowserBytes} total bytes`, candidate);
      }
      totalBrowserBytes += stat.size;
      files.push(candidate);
    }
  }

  visit(root, 0);
  return files;
}

function parseRecord(file) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail('INVALID_JSON', `invalid browser evidence JSON: ${error.message}`, file);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('MALFORMED_EVIDENCE', 'browser evidence must be a JSON object', file);
  }
  return parsed;
}

function verify({mode, root, sourceSha}) {
  const policy = POLICIES[mode];
  if (!policy) fail('INVALID_MODE', `unsupported browser evidence mode: ${mode}`);
  if (!/^[0-9a-f]{40}$/.test(sourceSha || '')) fail('INVALID_SOURCE_SHA', 'exact 40-hex source SHA is required');

  const files = collectBrowserEvidence(root);
  if (files.length !== EXPECTED_TARGETS.length) {
    fail('BROWSER_FILE_CARDINALITY', `expected exactly ${EXPECTED_TARGETS.length} browser evidence files, found ${files.length}`);
  }

  const records = files.map(file => ({file, data: parseRecord(file)}));
  const byTarget = new Map();
  for (const item of records) {
    const record = item.data;
    if (record.status !== 'PASS') fail('NON_PASS_INPUT', 'browser evidence status must be PASS', item.file);
    if (record.sourceCommit !== sourceSha) fail('SOURCE_SHA_MISMATCH', 'browser evidence sourceCommit does not match exact source SHA', item.file);
    if (policy.goldenCorpusVersion && record.goldenCorpusVersion !== policy.goldenCorpusVersion) {
      fail('GOLDEN_CORPUS_MISMATCH', 'browser evidence Golden corpus version mismatch', item.file);
    }
    if (record.unexpectedNetworkRequests !== 0) fail('NETWORK_INVARIANT', 'browser evidence reports unexpected network requests', item.file);
    const key = targetKey(record, policy, item.file);
    if (byTarget.has(key)) fail('DUPLICATE_TARGET', `duplicate browser evidence target ${key}`, item.file);
    byTarget.set(key, item);
  }

  const expectedKeys = new Set(EXPECTED_TARGETS.map(parts => parts.join('/')));
  for (const key of expectedKeys) {
    if (!byTarget.has(key)) fail('MISSING_TARGET', `missing browser evidence target ${key}`);
  }
  for (const [key, item] of byTarget) {
    if (!expectedKeys.has(key)) fail('UNEXPECTED_TARGET', `unexpected browser evidence target ${key}`, item.file);
  }

  for (const field of policy.agreement) {
    const values = records.map(item => item.data[field]);
    if (values.some(value => value === undefined || value === null)) fail('MISSING_FIELD', `browser evidence missing ${field}`);
    if (new Set(values.map(value => JSON.stringify(value))).size !== 1) {
      fail('CROSS_RUNTIME_DISAGREEMENT', `cross-runtime browser evidence disagrees on ${field}`);
    }
  }
  for (const [field, expected] of Object.entries(policy.fixed)) {
    for (const item of records) {
      if (item.data[field] !== expected) fail('FIXED_INVARIANT_MISMATCH', `browser evidence ${field} does not equal ${JSON.stringify(expected)}`, item.file);
    }
  }

  return {
    status: 'PASS',
    mode,
    sourceSha,
    targets: [...byTarget.keys()].sort(),
    agreement: Object.fromEntries(policy.agreement.map(field => [field, records[0].data[field]])),
    limits: LIMITS,
  };
}

try {
  const mode = option('--mode');
  const root = path.resolve(option('--root') || 'evidence');
  const sourceSha = option('--source-sha') || process.env.OFU_SOURCE_SHA || '';
  console.log(JSON.stringify(verify({mode, root, sourceSha})));
} catch (error) {
  console.error(JSON.stringify({
    status: 'FAIL',
    code: error.code || 'UNEXPECTED_FAILURE',
    message: error.message,
    ...(error.source ? {source: error.source} : {}),
  }));
  process.exit(1);
}
