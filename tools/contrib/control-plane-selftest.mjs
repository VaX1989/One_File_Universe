#!/usr/bin/env node
import { classifyFiles, loadGovernance } from './lib/control-plane.mjs';

const governance = loadGovernance();
const failures = [];
let checks = 0;
const check = (condition, message) => { checks += 1; if (!condition) failures.push(message); };

const cases = [
  { path: 'LICENSE', risk: 'R5', areas: ['community'] },
  { path: 'docs/adr/ADR-027-open-source-and-dual-licensing.md', risk: 'R5', areas: ['core'] },
  { path: 'docs/adr/ADR-999-example-architecture.md', risk: 'R4', areas: ['core'] },
  { path: 'docs/community/CONTRIBUTOR_RIGHTS.md', risk: 'R5', areas: ['community'] },
  { path: 'docs/community/FOUNDING_CORPUS.md', risk: 'R5', areas: ['community'] },
  { path: 'config/governance/founding-corpus.json', risk: 'R5', areas: ['community'] },
  { path: 'config/governance/contribution-units/example-domain.json', risk: 'R4', areas: ['community'] },
  { path: 'config/governance/scientific-model-card.schema.json', risk: 'R4', areas: ['community'] },
  { path: 'docs/community/SUPPLY_CHAIN_SECURITY.md', risk: 'R4', areas: ['community'] },
  { path: 'MAINTAINERS.md', risk: 'R4', areas: ['community'] },
  { path: 'CODE_OF_CONDUCT.md', risk: 'R3', areas: ['community'] },
  { path: 'src/kernel/canonical.js', risk: 'R4', areas: ['core'] },
  { path: 'src/runtime/scheduler.js', risk: 'R3', areas: ['runtime'] },
  { path: 'src/rendering/renderer.js', risk: 'R2', areas: ['rendering'] },
  { path: 'data/provenance/catalog.json', risk: 'R4', areas: ['science-review'] },
  { path: '.github/workflows/contributor-control-plane.yml', risk: 'R4', areas: ['security'] },
  { path: '.github/ISSUE_TEMPLATE/bug.yml', risk: 'R0', areas: ['community'] },
  { path: 'package.json', risk: 'R4', areas: ['build'] }
];

for (const testCase of cases) {
  const result = classifyFiles([testCase.path], governance);
  const actual = result.files[0];
  check(result.risk === testCase.risk, `${testCase.path}: expected risk ${testCase.risk}, got ${result.risk}`);
  for (const area of testCase.areas) check(actual.areas.includes(area), `${testCase.path}: expected area ${area}`);
}

const unknown = classifyFiles(['future/unregistered/new-system.xyz'], governance);
check(unknown.risk === governance.risk.defaultRisk, 'unknown path must receive default risk');
check(unknown.files[0].areas.length === 0, 'unknown path must remain unrouted so PR context can fail closed');
check(governance.areas.routingPolicy?.unroutedChangedPath === 'FAIL', 'unrouted changed-path policy must be FAIL');

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  suite: 'ofu-contributor-control-plane-selftest-2',
  checks,
  syntheticCases: cases.length + 1,
  failures
};
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
