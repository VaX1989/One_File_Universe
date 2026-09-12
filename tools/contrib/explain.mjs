#!/usr/bin/env node
import { classifyFiles, loadGovernance, ownersForAreas, riskDefinition } from './lib/control-plane.mjs';

const files = process.argv.slice(2).filter((arg) => arg !== '--');
if (!files.length) {
  console.error('Usage: npm run contrib:explain -- <path> [path...]');
  process.exit(2);
}

const governance = loadGovernance();
const classified = classifyFiles(files, governance);
const explained = classified.files.map((entry) => ({
  ...entry,
  owners: ownersForAreas(entry.areas, governance),
  areaDetails: entry.areas.map((id) => {
    const area = governance.areas.areas.find((candidate) => candidate.id === id);
    return { id, critical: area?.critical ?? false, authority: area?.authority ?? [], description: area?.description ?? '' };
  })
}));

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'ofu-contribution-explain-1',
  highestRisk: classified.risk,
  riskDefinition: riskDefinition(classified.risk, governance),
  files: explained
}, null, 2));
