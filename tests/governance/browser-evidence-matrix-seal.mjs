import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const SOURCE = '1'.repeat(40);
const TARGETS = [
  ['linux', 'x64', 'chromium'],
  ['linux', 'x64', 'firefox'],
  ['linux', 'x64', 'webkit'],
  ['win32', 'x64', 'chromium'],
  ['darwin', 'arm64', 'webkit'],
];

function record(mode, [platform, arch, browser]) {
  const common = {
    status: 'PASS',
    sourceCommit: SOURCE,
    browser,
    platform,
    arch,
    unexpectedNetworkRequests: 0,
    physicalDigest: 'a'.repeat(64),
    artifactSha256: 'b'.repeat(64),
  };
  if (mode === 'p5') {
    return {
      ...common,
      goldenCorpusVersion: 'golden-p5-corpus-v1',
      terrainDigest: 'c'.repeat(64),
      artifactBytes: 123456,
    };
  }
  return {
    ...common,
    goldenCorpusVersion: 'golden-p5-environment-v2-corpus-v1',
    manifestHash: 'd'.repeat(64),
    environmentDigest: 'e'.repeat(64),
    earthAnchorMilliK: '254578',
  };
}

function writeMatrix(dir, mode) {
  const files = [];
  for (const [index, target] of TARGETS.entries()) {
    const file = path.join(dir, `browser-${index}-${target.join('-')}.json`);
    fs.writeFileSync(file, `${JSON.stringify(record(mode, target))}\n`);
    files.push(file);
  }
  return files;
}

function execute(mode, mutate = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofu-browser-evidence-'));
  try {
    const files = writeMatrix(dir, mode);
    if (mutate) mutate({dir, files});
    const result = spawnSync(process.execPath, [
      'tools/ci/verify-browser-evidence-matrix.mjs',
      '--mode', mode,
      '--root', dir,
      '--source-sha', SOURCE,
    ], {encoding: 'utf8'});
    return {result, dir};
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

function failureCode(result) {
  const line = result.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1);
  return line ? JSON.parse(line).code : null;
}

for (const mode of ['p5', 'p5-environment-v2']) {
  const {result} = execute(mode);
  assert.equal(result.status, 0, `${mode}: canonical five-target matrix must pass: ${result.stderr}`);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.status, 'PASS');
  assert.equal(report.targets.length, 5);
}

{
  const {result} = execute('p5', ({files}) => {
    const first = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    const last = JSON.parse(fs.readFileSync(files[4], 'utf8'));
    Object.assign(last, {platform: first.platform, arch: first.arch, browser: first.browser});
    fs.writeFileSync(files[4], `${JSON.stringify(last)}\n`);
  });
  assert.notEqual(result.status, 0, 'duplicate target must fail with count still equal to five');
  assert.equal(failureCode(result), 'DUPLICATE_TARGET');
}

{
  const {result} = execute('p5', ({files}) => {
    const value = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    value.sourceCommit = '2'.repeat(40);
    fs.writeFileSync(files[0], `${JSON.stringify(value)}\n`);
  });
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'SOURCE_SHA_MISMATCH');
}

{
  const {result} = execute('p5', ({files}) => fs.writeFileSync(files[0], '{ invalid-json'));
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'INVALID_JSON');
}

{
  const {result} = execute('p5', ({files}) => fs.writeFileSync(files[0], ' '.repeat(1_048_577)));
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'RESOURCE_LIMIT');
}

{
  const {result} = execute('p5', ({files}) => {
    const value = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    value.physicalDigest = 'f'.repeat(64);
    fs.writeFileSync(files[0], `${JSON.stringify(value)}\n`);
  });
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'CROSS_RUNTIME_DISAGREEMENT');
}

{
  const {result} = execute('p5', ({files}) => {
    const value = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    value.goldenCorpusVersion = 'wrong-corpus';
    fs.writeFileSync(files[0], `${JSON.stringify(value)}\n`);
  });
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'GOLDEN_CORPUS_MISMATCH');
}

{
  const {result} = execute('p5-environment-v2', ({files}) => {
    const value = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    value.earthAnchorMilliK = '254579';
    fs.writeFileSync(files[0], `${JSON.stringify(value)}\n`);
  });
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'FIXED_INVARIANT_MISMATCH');
}

{
  const {result} = execute('p5', ({dir}) => {
    for (let i = 0; i < 129; i++) fs.writeFileSync(path.join(dir, `noise-${i}.txt`), 'x');
  });
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'RESOURCE_LIMIT');
}

if (process.platform !== 'win32') {
  const {result} = execute('p5', ({dir, files}) => {
    fs.symlinkSync(files[0], path.join(dir, 'browser-linked.json'));
  });
  assert.notEqual(result.status, 0);
  assert.equal(failureCode(result), 'UNSAFE_EVIDENCE_PATH');
}

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'browser-evidence-matrix-seal',
  modes: ['p5', 'p5-environment-v2'],
  expectedTargets: TARGETS.map(parts => parts.join('/')),
  symlinkCase: process.platform === 'win32' ? 'NOT_EXECUTED_ON_WINDOWS' : 'PASS',
}));
