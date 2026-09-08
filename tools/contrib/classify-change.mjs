#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

function globRegex(glob) {
  let source = '';
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === '*' && glob[i + 1] === '*') {
      source += '.*';
      i += 1;
    } else if (ch === '*') {
      source += '[^/]*';
    } else if ('\\.^$+?()[]{}|'.includes(ch)) {
      source += `\\${ch}`;
    } else {
      source += ch;
    }
  }
  return new RegExp(`^${source}$`);
}

const matches = (file, pattern) => globRegex(pattern).test(file);
const args = process.argv.slice(2).filter((arg) => arg !== '--');
let files = args;
if (!files.length) {
  try {
    const output = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD~1..HEAD'], { cwd: ROOT, encoding: 'utf8' });
    files = output.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  } catch {
    console.error('No file paths supplied and git diff could not be resolved.');
    process.exit(2);
  }
}

const risk = readJson('config/governance/risk-policy.json');
const areas = readJson('config/governance/areas.json');
const scoreByRisk = new Map(risk.levels.map((entry) => [entry.id, entry.score]));
let selectedRisk = risk.defaultRisk;
let selectedScore = scoreByRisk.get(selectedRisk) ?? 3;
const fileResults = [];

for (const file of files) {
  let fileRisk = risk.defaultRisk;
  let fileScore = scoreByRisk.get(fileRisk) ?? 3;
  const matchedRules = [];
  for (const rule of risk.rules) {
    if (rule.patterns.some((pattern) => matches(file, pattern))) {
      matchedRules.push(rule.risk);
      const score = scoreByRisk.get(rule.risk) ?? 0;
      if (score > fileScore || matchedRules.length === 1) {
        fileRisk = rule.risk;
        fileScore = score;
      }
    }
  }
  const matchedAreas = (areas.areas ?? [])
    .filter((area) => (area.paths ?? []).some((pattern) => matches(file, pattern)))
    .map((area) => area.id);
  fileResults.push({ file, risk: fileRisk, areas: matchedAreas, matchedRules });
  if (fileScore > selectedScore) {
    selectedRisk = fileRisk;
    selectedScore = fileScore;
  }
}

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'ofu-change-classifier-1',
  risk: selectedRisk,
  score: selectedScore,
  files: fileResults
}, null, 2));
