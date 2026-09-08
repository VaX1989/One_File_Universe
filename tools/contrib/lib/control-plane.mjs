#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../../..');
export const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function globRegex(glob) {
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

export const matches = (file, pattern) => globRegex(pattern).test(file);

export function loadGovernance() {
  return {
    areas: readJson('config/governance/areas.json'),
    ownership: readJson('config/governance/ownership.json'),
    risk: readJson('config/governance/risk-policy.json')
  };
}

export function classifyFiles(files, governance = loadGovernance()) {
  const { risk, areas } = governance;
  const scoreByRisk = new Map((risk.levels ?? []).map((entry) => [entry.id, entry.score]));
  let selectedRisk = null;
  let selectedScore = Number.NEGATIVE_INFINITY;
  const fileResults = [];

  for (const file of files) {
    let fileRisk = risk.defaultRisk;
    let fileScore = scoreByRisk.get(fileRisk) ?? 3;
    const matchedRules = [];
    for (const rule of risk.rules ?? []) {
      if ((rule.patterns ?? []).some((pattern) => matches(file, pattern))) {
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
    fileResults.push({ file, risk: fileRisk, score: fileScore, areas: matchedAreas, matchedRules });
    if (fileScore > selectedScore) {
      selectedRisk = fileRisk;
      selectedScore = fileScore;
    }
  }

  if (selectedRisk === null) {
    selectedRisk = risk.defaultRisk;
    selectedScore = scoreByRisk.get(selectedRisk) ?? 3;
  }

  return { risk: selectedRisk, score: selectedScore, files: fileResults };
}

export function riskDefinition(riskId, governance = loadGovernance()) {
  return (governance.risk.levels ?? []).find((entry) => entry.id === riskId) ?? null;
}

export function ownersForAreas(areaIds, governance = loadGovernance()) {
  const owners = new Set();
  for (const areaId of areaIds) {
    for (const owner of governance.ownership.areaOwners?.[areaId]?.owners ?? []) owners.add(owner);
  }
  if (!owners.size && governance.ownership.bootstrapOwner) owners.add(governance.ownership.bootstrapOwner);
  return [...owners].sort();
}

export function codeownersText(governance = loadGovernance()) {
  const { areas, ownership } = governance;
  const header = [
    '# GENERATED from config/governance/areas.json and ownership.json.',
    '# Do not hand-edit without updating the machine-readable source of truth.',
    ''
  ];
  if (ownership.status === 'BOOTSTRAP_PERSONAL_REPOSITORY') {
    const owner = `@${ownership.bootstrapOwner}`;
    return [...header,
      `* ${owner}`,
      `/.github/CODEOWNERS ${owner}`,
      `/config/governance/** ${owner}`,
      `/GOVERNANCE.md ${owner}`,
      `/LICENSE ${owner}`,
      `/LICENSING.md ${owner}`,
      ''
    ].join('\n');
  }

  const lines = [...header];
  for (const area of areas.areas ?? []) {
    const owners = (ownership.areaOwners?.[area.id]?.owners ?? []).map((owner) => `@${owner}`);
    if (!owners.length) continue;
    for (const pattern of area.paths ?? []) lines.push(`${pattern} ${owners.join(' ')}`);
  }
  const bootstrap = ownership.bootstrapOwner ? `@${ownership.bootstrapOwner}` : null;
  if (bootstrap) lines.push(`/.github/CODEOWNERS ${bootstrap}`);
  lines.push('');
  return lines.join('\n');
}
