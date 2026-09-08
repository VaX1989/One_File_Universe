#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { ROOT, classifyFiles, loadGovernance, ownersForAreas, riskDefinition } from './lib/control-plane.mjs';

const argv = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};
const base = valueAfter('--base') ?? process.env.OFU_BASE_SHA;
const head = valueAfter('--head') ?? process.env.OFU_SOURCE_SHA ?? 'HEAD';
if (!base) {
  console.error('Missing --base <sha> or OFU_BASE_SHA.');
  process.exit(2);
}

let files;
try {
  const output = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRT', `${base}...${head}`], { cwd: ROOT, encoding: 'utf8' });
  files = output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
} catch (error) {
  console.error(`Unable to compute PR diff: ${error.message}`);
  process.exit(2);
}

const governance = loadGovernance();
const classified = classifyFiles(files, governance);
const areas = [...new Set(classified.files.flatMap((entry) => entry.areas))].sort();
const owners = ownersForAreas(areas, governance);
const unroutedFiles = classified.files.filter((entry) => entry.areas.length === 0).map((entry) => entry.file);
const risk = riskDefinition(classified.risk, governance);

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'ofu-pr-context-1',
  base,
  head,
  changedFiles: files.length,
  risk: classified.risk,
  score: classified.score,
  minimumReview: risk?.minimumReview ?? null,
  requiredChecks: risk?.requiredChecks ?? [],
  areas,
  owners,
  unroutedFiles,
  files: classified.files
}, null, 2));
