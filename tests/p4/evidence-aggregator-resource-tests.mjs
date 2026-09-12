import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

function execute(populate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofu-p4-evidence-'));
  try {
    populate(dir);
    const result = spawnSync(process.execPath, ['tools/aggregate-p4-evidence.mjs', dir], {
      encoding: 'utf8',
      env: {...process.env, OFU_SOURCE_SHA: '1'.repeat(40)},
    });
    const aggregate = JSON.parse(fs.readFileSync('dist/p4-aggregate.json', 'utf8'));
    return {result, aggregate};
  } finally {
    fs.rmSync('dist/p4-aggregate.json', {force: true});
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

function requireFailure(name, populate, code) {
  const {result, aggregate} = execute(populate);
  assert.notEqual(result.status, 0, `${name}: aggregator must fail closed`);
  assert.equal(aggregate.status, 'FAIL', `${name}: aggregate status`);
  assert(aggregate.failureCodes.includes(code), `${name}: expected ${code}; got ${aggregate.failureCodes.join(', ')}`);
}

requireFailure('oversized JSON evidence', dir => {
  fs.writeFileSync(path.join(dir, 'oversized.json'), ' '.repeat(1_048_577));
}, 'RESOURCE_LIMIT');

requireFailure('global artifact entry budget', dir => {
  for (let i = 0; i < 513; i++) fs.writeFileSync(path.join(dir, `noise-${String(i).padStart(3, '0')}.txt`), 'x');
}, 'RESOURCE_LIMIT');

requireFailure('directory depth budget', dir => {
  let current = dir;
  for (let i = 0; i < 14; i++) {
    current = path.join(current, `depth-${i}`);
    fs.mkdirSync(current);
  }
  fs.writeFileSync(path.join(current, 'evidence.json'), '{}');
}, 'RESOURCE_LIMIT');

requireFailure('invalid JSON evidence', dir => {
  fs.writeFileSync(path.join(dir, 'invalid.json'), '{ not-json');
}, 'INVALID_JSON');

if (process.platform !== 'win32') {
  requireFailure('symlink evidence path', dir => {
    const target = path.join(dir, 'real.json');
    fs.writeFileSync(target, '{}');
    fs.symlinkSync(target, path.join(dir, 'linked.json'));
  }, 'UNSAFE_EVIDENCE_PATH');
}

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'p4-evidence-aggregator-resource-bounds',
  maxDepth: 12,
  maxEntries: 512,
  maxFileBytes: 1_048_576,
  symlinkCase: process.platform === 'win32' ? 'NOT_EXECUTED_ON_WINDOWS' : 'PASS',
}));
