#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const errors = [];
let checks = 0;

const rel = (p) => path.join(ROOT, p);
const check = (condition, message) => {
  checks += 1;
  if (!condition) errors.push(message);
};
const read = (p) => fs.readFileSync(rel(p), 'utf8');
const json = (p) => JSON.parse(read(p));

const required = [
  'LICENSE', 'LICENSING.md', 'COMMERCIAL_LICENSING.md', 'TRADEMARKS.md',
  'THIRD_PARTY_POLICY.md', 'GOVERNANCE.md', 'MAINTAINERS.md', 'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md', '.github/CODEOWNERS', '.github/PULL_REQUEST_TEMPLATE.md',
  'docs/community/START_HERE.md', 'docs/community/OFU_WAY.md',
  'docs/community/CONTRIBUTOR_RIGHTS.md', 'docs/community/RFC_PROCESS.md',
  'config/governance/areas.json', 'config/governance/ownership.json',
  'config/governance/risk-policy.json', 'config/governance/contribution-policy.json',
  'config/governance/scientific-model-card.schema.json'
];
for (const p of required) check(fs.existsSync(rel(p)), `missing required governance file: ${p}`);

if (fs.existsSync(rel('LICENSE'))) {
  const license = read('LICENSE');
  check(license.includes('GNU GENERAL PUBLIC LICENSE'), 'LICENSE is not recognizable as GNU GPL');
  check(license.includes('Version 3, 29 June 2007'), 'LICENSE does not identify GPL version 3');
  check(license.includes('END OF TERMS AND CONDITIONS'), 'LICENSE appears incomplete');
}

const pkg = json('package.json');
check(pkg.license === 'GPL-3.0-only', `package.json license must be GPL-3.0-only, got ${pkg.license ?? 'missing'}`);

const areasDoc = json('config/governance/areas.json');
check(Array.isArray(areasDoc.areas) && areasDoc.areas.length >= 10, 'area catalog is unexpectedly small');
const areaIds = new Set();
for (const area of areasDoc.areas ?? []) {
  check(typeof area.id === 'string' && area.id.length > 0, 'area missing id');
  check(!areaIds.has(area.id), `duplicate area id: ${area.id}`);
  areaIds.add(area.id);
  check(Array.isArray(area.paths), `area ${area.id} missing paths`);
  check(Array.isArray(area.authority), `area ${area.id} missing authority list`);
}

const ownership = json('config/governance/ownership.json');
check(ownership.integration?.model === 'SERIAL_INTEGRATION_LEASE', 'integration model must be SERIAL_INTEGRATION_LEASE');
check(ownership.integration?.maxActivePromotionLeases === 1, 'exactly one active promotion lease is required');
for (const [areaId, value] of Object.entries(ownership.areaOwners ?? {})) {
  check(areaIds.has(areaId), `ownership references unknown area: ${areaId}`);
  check(Array.isArray(value.owners) && value.owners.length > 0, `area ${areaId} has no bootstrap owner`);
}
for (const areaId of areaIds) check(Boolean(ownership.areaOwners?.[areaId]), `area has no ownership record: ${areaId}`);

const risk = json('config/governance/risk-policy.json');
const expectedRisks = ['R0','R1','R2','R3','R4','R5'];
const riskIds = new Set((risk.levels ?? []).map((entry) => entry.id));
for (const id of expectedRisks) check(riskIds.has(id), `missing risk level: ${id}`);
check(riskIds.has(risk.defaultRisk), `unknown default risk: ${risk.defaultRisk}`);
for (const rule of risk.rules ?? []) {
  check(riskIds.has(rule.risk), `risk rule references unknown level: ${rule.risk}`);
  check(Array.isArray(rule.patterns) && rule.patterns.length > 0, `risk rule ${rule.risk} has no patterns`);
}

const contribution = json('config/governance/contribution-policy.json');
check(contribution.openSourceLicense === 'GPL-3.0-only', 'contribution policy license mismatch');
check(contribution.openSourceCoreGuarantee === true, 'permanent Open Source Core guarantee must remain explicit');
check(contribution.copyrightAssignmentRequired === false, 'bootstrap policy must not silently require copyright assignment');
check(contribution.commercialLicensing?.openSourceCommercialUseAllowedWithoutFee === true, 'GPL commercial use must not be presented as fee-gated');
check(contribution.commercialLicensing?.automaticRevenueRoyaltyInOpenSourceLicense === false, 'Open Source license must not contain an automatic revenue royalty');
check(contribution.externalContributionRights?.commercialRelicensingAssumedFromPullRequest === false, 'commercial relicensing rights must never be inferred from a PR');

const codeowners = read('.github/CODEOWNERS');
check(codeowners.includes(`@${ownership.bootstrapOwner}`), 'CODEOWNERS does not contain bootstrap owner');

const result = {
  status: errors.length === 0 ? 'PASS' : 'FAIL',
  suite: 'ofu-open-source-governance-1',
  checks,
  areas: areaIds.size,
  riskLevels: [...riskIds].sort(),
  errors
};
console.log(JSON.stringify(result));
if (errors.length) process.exit(1);
