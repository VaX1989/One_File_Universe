import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

function execute(populate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofu-p1-evidence-'));
  try {
    populate(dir);
    const result = spawnSync(process.execPath, ['tools/aggregate-p1-evidence.mjs', dir], {encoding: 'utf8'});
    const aggregate = JSON.parse(fs.readFileSync('dist/p1-aggregate.json', 'utf8'));
    return {result, aggregate};
  } finally {
    fs.rmSync('dist/p1-aggregate.json', {force: true});
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

function requireFailure(name, populate, code) {
  const {result, aggregate} = execute(populate);
  assert.notEqual(result.status, 0, `${name}: aggregator must fail closed`);
  assert.equal(aggregate.status, 'FAIL', `${name}: aggregate status`);
  assert(aggregate.failureCodes.includes(code), `${name}: expected failure code ${code}; got ${aggregate.failureCodes.join(', ')}`);
}

requireFailure('oversized build manifest', dir => {
  fs.writeFileSync(path.join(dir, 'build-manifest.json'), ' '.repeat(1_048_577));
}, 'RESOURCE_LIMIT');

requireFailure('global entry budget', dir => {
  for (let i = 0; i < 513; i++) fs.writeFileSync(path.join(dir, `noise-${String(i).padStart(3, '0')}.txt`), 'x');
}, 'RESOURCE_LIMIT');

requireFailure('directory depth budget', dir => {
  let current = dir;
  for (let i = 0; i < 14; i++) {
    current = path.join(current, `depth-${i}`);
    fs.mkdirSync(current);
  }
  fs.writeFileSync(path.join(current, 'build-manifest.json'), '{}');
}, 'RESOURCE_LIMIT');

requireFailure('invalid evidence JSON', dir => {
  fs.writeFileSync(path.join(dir, 'build-manifest.json'), '{ definitely-not-json');
}, 'INVALID_JSON');

if (process.platform !== 'win32') {
  requireFailure('symlink evidence path', dir => {
    const target = path.join(dir, 'real-build.json');
    fs.writeFileSync(target, '{}');
    fs.symlinkSync(target, path.join(dir, 'build-manifest.json'));
  }, 'UNSAFE_EVIDENCE_PATH');
}

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'p1-evidence-aggregator-resource-bounds',
  maxFileBytes: 1_048_576,
  maxEntries: 512,
  maxDepth: 12,
  symlinkCase: process.platform === 'win32' ? 'NOT_EXECUTED_ON_WINDOWS' : 'PASS',
}));
