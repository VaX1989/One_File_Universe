#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const failures = [];
const notes = [];

if (!/^24\.20\./.test(process.versions.node)) failures.push(`Node 24.20.x required; running ${process.versions.node}`);
else notes.push(`Node ${process.versions.node}: OK`);

for (const file of ['LICENSE','CONTRIBUTING.md','docs/CONSTITUTION.md','config/governance/areas.json','config/governance/risk-policy.json']) {
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`missing ${file}`);
}

try {
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (path.resolve(gitRoot) !== ROOT) failures.push(`git root mismatch: ${gitRoot}`);
  else notes.push('Git repository root: OK');
} catch {
  failures.push('git repository could not be inspected');
}

try {
  const validation = execFileSync(process.execPath, [path.join(ROOT, 'tools/contrib/validate-governance.mjs')], { cwd: ROOT, encoding: 'utf8' }).trim();
  notes.push(`Governance validation: ${validation}`);
} catch (error) {
  failures.push(`governance validation failed: ${String(error.stdout || error.message).trim()}`);
}

console.log('One File Universe contributor doctor');
for (const note of notes) console.log(`  ${note}`);
if (failures.length) {
  for (const failure of failures) console.error(`  ERROR: ${failure}`);
  process.exit(1);
}
console.log('  Ready for contribution work.');
