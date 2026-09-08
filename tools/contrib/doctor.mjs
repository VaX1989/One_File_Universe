#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const failures = [];
const warnings = [];
const checks = [];
const jsonMode = process.argv.includes('--json');

function exec(command, args = []) {
  return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function pass(id, detail) {
  checks.push({ id, status: 'PASS', detail });
}
function warn(id, detail) {
  warnings.push({ id, detail });
  checks.push({ id, status: 'WARN', detail });
}
function fail(id, detail) {
  failures.push({ id, detail });
  checks.push({ id, status: 'FAIL', detail });
}

if (!/^24\.20\./.test(process.versions.node)) fail('node', `Node 24.20.x required; running ${process.versions.node}`);
else pass('node', `Node ${process.versions.node}`);

for (const file of ['LICENSE','CONTRIBUTING.md','docs/CONSTITUTION.md','config/governance/areas.json','config/governance/risk-policy.json','config/governance/contribution-policy.json']) {
  if (!fs.existsSync(path.join(ROOT, file))) fail(`file:${file}`, `Missing required file ${file}`);
}

try {
  const gitRoot = exec('git', ['rev-parse', '--show-toplevel']);
  if (path.resolve(gitRoot) !== ROOT) fail('git-root', `Git root mismatch: ${gitRoot}`);
  else pass('git-root', gitRoot);
  const gitVersion = exec('git', ['--version']);
  pass('git-version', gitVersion);
  const branch = exec('git', ['branch', '--show-current']);
  if (branch) pass('git-branch', branch);
  else warn('git-branch', 'Detached HEAD; valid for exact-SHA certification, unusual for normal contribution work');
  const changes = exec('git', ['status', '--porcelain']).split(/\r?\n/).filter(Boolean);
  if (changes.length) warn('working-tree', `${changes.length} uncommitted path(s); doctor does not require a clean tree`);
  else pass('working-tree', 'Clean');
} catch (error) {
  fail('git', `Git repository could not be inspected: ${String(error.stderr || error.message).trim()}`);
}

try {
  const py = exec('python3', ['-c', 'import sys; print(".".join(map(str, sys.version_info[:3])))']);
  if (/^3\.13\./.test(py)) pass('python', `Python ${py}`);
  else warn('python', `Python ${py}; canonical hosted oracle evidence currently uses Python 3.13.x`);
} catch {
  warn('python', 'python3 not found; some cross-runtime/oracle evidence cannot be reproduced locally');
}

for (const [id, script] of [
  ['governance', 'tools/contrib/validate-governance.mjs'],
  ['control-plane-selftest', 'tools/contrib/control-plane-selftest.mjs']
]) {
  try {
    const output = exec(process.execPath, [path.join(ROOT, script)]);
    pass(id, output);
  } catch (error) {
    fail(id, String(error.stdout || error.stderr || error.message).trim());
  }
}

try {
  const output = exec(process.execPath, [path.join(ROOT, 'tools/contrib/generate-codeowners.mjs'), '--check']);
  pass('codeowners', output);
} catch (error) {
  fail('codeowners', String(error.stdout || error.stderr || error.message).trim());
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  suite: 'ofu-contributor-doctor-2',
  root: ROOT,
  checks,
  warnings,
  failures,
  next: failures.length
    ? 'Resolve FAIL checks before treating the environment as contribution-ready.'
    : 'Use `npm run contrib:explain -- <path>` before editing an unfamiliar subsystem.'
};

if (jsonMode) console.log(JSON.stringify(result, null, 2));
else {
  console.log('One File Universe contributor doctor');
  for (const check of checks) console.log(`  ${check.status.padEnd(4)} ${check.id}: ${check.detail}`);
  console.log(`  RESULT: ${result.status}${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
  console.log(`  NEXT: ${result.next}`);
}
if (failures.length) process.exit(1);
