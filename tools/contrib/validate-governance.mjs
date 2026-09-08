#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeownersText } from './lib/control-plane.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const errors = [];
let checks = 0;
const rel = (p) => path.join(ROOT, p);
const check = (condition, message) => { checks += 1; if (!condition) errors.push(message); };
const read = (p) => fs.readFileSync(rel(p), 'utf8');
const json = (p) => JSON.parse(read(p));

const required = [
  'LICENSE','LICENSING.md','COMMERCIAL_LICENSING.md','TRADEMARKS.md','THIRD_PARTY_POLICY.md',
  'GOVERNANCE.md','MAINTAINERS.md','CODE_OF_CONDUCT.md','CONTRIBUTING.md','CITATION.cff','SECURITY.md',
  '.github/CODEOWNERS','.github/PULL_REQUEST_TEMPLATE.md','.github/SUPPORT.md','.github/workflows/contributor-control-plane.yml',
  'docs/community/START_HERE.md','docs/community/OFU_WAY.md','docs/community/CONTRIBUTOR_RIGHTS.md',
  'docs/community/RFC_PROCESS.md','docs/community/CONTRIBUTION_UNITS.md','docs/community/PUBLIC_LAUNCH_READINESS.md',
  'docs/community/IP_PROVENANCE.md','docs/community/SUPPLY_CHAIN_SECURITY.md','docs/community/GOVERNANCE_MATURITY.md','data/provenance/README.md',
  'docs/adr/ADR-027-open-source-and-dual-licensing.md','docs/adr/ADR-028-community-scale-governance-and-serial-integration-lease.md',
  'config/governance/areas.json','config/governance/ownership.json','config/governance/risk-policy.json',
  'config/governance/contribution-policy.json','config/governance/scientific-model-card.schema.json',
  'config/governance/contribution-unit.schema.json','config/governance/public-launch-gates.json',
  'config/governance/ip-provenance.schema.json','config/governance/ip-provenance-policy.json',
  'config/governance/supply-chain-policy.json','config/governance/community-resilience.json'
];
for (const p of required) check(fs.existsSync(rel(p)), `missing required governance file: ${p}`);

const license = read('LICENSE');
check(license.includes('GNU GENERAL PUBLIC LICENSE'), 'LICENSE is not recognizable as GNU GPL');
check(license.includes('Version 3, 29 June 2007'), 'LICENSE does not identify GPL version 3');
check(license.includes('END OF TERMS AND CONDITIONS'), 'LICENSE appears incomplete');

const pkg = json('package.json');
check(pkg.license === 'GPL-3.0-only', `package.json license must be GPL-3.0-only, got ${pkg.license ?? 'missing'}`);
for (const script of ['contrib:doctor','contrib:classify','contrib:explain','contrib:pr-context','governance:codeowners','launch:readiness','test:open-source-governance']) check(typeof pkg.scripts?.[script] === 'string', `package.json missing script: ${script}`);

const areasDoc = json('config/governance/areas.json');
check(Array.isArray(areasDoc.areas) && areasDoc.areas.length >= 10, 'area catalog is unexpectedly small');
const areaIds = new Set();
for (const area of areasDoc.areas ?? []) {
  check(typeof area.id === 'string' && area.id.length > 0, 'area missing id');
  check(!areaIds.has(area.id), `duplicate area id: ${area.id}`);
  areaIds.add(area.id);
  check(Array.isArray(area.paths) && area.paths.length > 0, `area ${area.id} missing paths`);
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
for (const level of risk.levels ?? []) check(Array.isArray(level.requiredChecks) && level.requiredChecks.length > 0, `risk ${level.id} missing requiredChecks`);
for (const rule of risk.rules ?? []) {
  check(riskIds.has(rule.risk), `risk rule references unknown level: ${rule.risk}`);
  check(Array.isArray(rule.patterns) && rule.patterns.length > 0, `risk rule ${rule.risk} has no patterns`);
}

const contribution = json('config/governance/contribution-policy.json');
check(contribution.openSourceLicense === 'GPL-3.0-only', 'contribution policy license mismatch');
check(contribution.openSourceCoreGuarantee === true, 'permanent Open Source Core guarantee must remain explicit');
check(contribution.copyrightAssignmentRequired === false, 'policy must not silently require copyright assignment');
check(contribution.commercialLicensing?.openSourceCommercialUseAllowedWithoutFee === true, 'GPL commercial use must not be presented as fee-gated');
check(contribution.commercialLicensing?.automaticRevenueRoyaltyInOpenSourceLicense === false, 'Open Source license must not contain an automatic revenue royalty');
check(contribution.externalContributionRights?.commercialRelicensingAssumedFromPullRequest === false, 'commercial relicensing rights must never be inferred from a PR');
check(contribution.machineReadableLicensing?.reuseComplianceClaim === false, 'REUSE compliance must not be claimed before corpus migration is complete');
check(contribution.publicLaunch?.missingEvidenceFailsClosed === true, 'public launch evidence must fail closed');

check(read('.github/CODEOWNERS') === codeownersText(), 'CODEOWNERS drifted from machine-readable ownership');

const unitSchema = json('config/governance/contribution-unit.schema.json');
check(unitSchema.$schema?.includes('2020-12'), 'contribution-unit schema must declare JSON Schema 2020-12');
const unitFiles = fs.readdirSync(rel('config/governance/contribution-units')).filter((name) => name.endsWith('.json'));
check(unitFiles.length > 0, 'at least one contribution unit manifest is required');
const unitIds = new Set();
for (const name of unitFiles) {
  const unit = json(`config/governance/contribution-units/${name}`);
  check(unit.schemaVersion === 1, `unit ${name} schemaVersion must be 1`);
  check(typeof unit.id === 'string' && unit.id.length > 0, `unit ${name} missing id`);
  check(!unitIds.has(unit.id), `duplicate contribution unit id: ${unit.id}`);
  unitIds.add(unit.id);
  check(areaIds.has(unit.area), `unit ${unit.id} references unknown area ${unit.area}`);
  for (const field of ['authority','capabilities','dependencies','sourcePaths','testPaths']) check(Array.isArray(unit[field]), `unit ${unit.id} missing array ${field}`);
  check(['SHIPPING_REQUIRED','SHIPPING_OPTIONAL','NON_SHIPPING'].includes(unit.artifactReachability), `unit ${unit.id} has invalid artifactReachability`);
}

const launch = json('config/governance/public-launch-gates.json');
check(launch.targetRelease === '2.0.0', 'public launch target must currently be 2.0.0');
check(Array.isArray(launch.readyStatuses) && launch.readyStatuses.includes('PASS'), 'launch ledger must define PASS as ready');
check(Array.isArray(launch.gates) && launch.gates.length >= 10, 'public launch gate set is unexpectedly small');
const gateIds = new Set();
for (const gate of launch.gates ?? []) {
  check(!gateIds.has(gate.id), `duplicate launch gate: ${gate.id}`);
  gateIds.add(gate.id);
  check(typeof gate.status === 'string' && gate.status.length > 0, `launch gate ${gate.id} missing status`);
  check(Array.isArray(gate.evidence), `launch gate ${gate.id} missing evidence array`);
}

const provenance = json('config/governance/ip-provenance-policy.json');
check(provenance.newThirdPartyMaterialRequiresProvenanceRecordBeforeMerge === true, 'new third-party material must require provenance');
check(provenance.unknownLicenseFailsClosedForShippingEmbedding === true, 'unknown shipping license must fail closed');
check(provenance.reuse?.targetSpecification === '3.3', 'REUSE target must be specification 3.3');
check(provenance.reuse?.complianceClaim === false, 'must not claim REUSE compliance before migration completes');

const supply = json('config/governance/supply-chain-policy.json');
check(supply.githubActions?.pinThirdPartyActionsToFullCommitSha === true, 'Actions must be pinned to full SHAs');
check(supply.githubActions?.leastPrivilegePermissions === true, 'workflow permissions must be least privilege');
check(supply.githubActions?.pullRequestTargetForUntrustedCodeForbidden === true, 'pull_request_target with untrusted code must remain forbidden');
check(supply.build?.exactSourceIdentityRequired === true, 'exact source identity must remain required');

const resilience = json('config/governance/community-resilience.json');
const stages = new Set((resilience.stages ?? []).map((stage) => stage.id));
check(stages.has(resilience.currentStage), 'community resilience currentStage is unknown');
check(resilience.currentStage === 'BOOTSTRAP', 'bootstrap personal repository must not be falsely presented as mature before evidence changes');
check(resilience.currentEvidence?.activeIntegrationMaintainers === 1, 'bootstrap evidence must truthfully record one integration maintainer');
check(resilience.currentEvidence?.organizationTeamsOperational === false, 'organization teams must not be claimed operational yet');

const workflow = read('.github/workflows/contributor-control-plane.yml');
check(workflow.includes('permissions:\n  contents: read'), 'contributor workflow must use read-only contents permission');
check(workflow.includes('persist-credentials: false'), 'contributor workflow must not persist checkout credentials');
check(!workflow.includes('pull_request_target'), 'contributor workflow must not use pull_request_target');
check(workflow.includes('actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09'), 'checkout action is not pinned to expected immutable SHA');
check(workflow.includes('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444'), 'setup-node action is not pinned to expected immutable SHA');

const citation = read('CITATION.cff');
check(citation.includes('license: "GPL-3.0-only"'), 'CITATION.cff license mismatch');
check(citation.includes('VaX1989/One_File_Universe'), 'CITATION.cff repository mismatch');

const adrIndex = read('docs/adr/README.md');
check(adrIndex.includes('[027](ADR-027-open-source-and-dual-licensing.md)'), 'ADR-027 missing from index');
check(adrIndex.includes('[028](ADR-028-community-scale-governance-and-serial-integration-lease.md)'), 'ADR-028 missing from index');

const result = {
  status: errors.length === 0 ? 'PASS' : 'FAIL',
  suite: 'ofu-open-source-governance-2',
  checks,
  areas: areaIds.size,
  contributionUnits: unitIds.size,
  launchGates: gateIds.size,
  communityStage: resilience.currentStage,
  riskLevels: [...riskIds].sort(),
  errors
};
console.log(JSON.stringify(result));
if (errors.length) process.exit(1);
