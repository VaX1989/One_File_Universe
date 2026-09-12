#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyFiles, loadGovernance } from './lib/control-plane.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const failures = [];
let checks = 0;
const check = (condition, message) => { checks += 1; if (!condition) failures.push(message); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const scope = json('config/governance/licensing-scope.json');
const contribution = json('config/governance/contribution-policy.json');
const provenance = json('config/governance/ip-provenance-policy.json');
const launch = json('config/governance/public-launch-gates.json');
const governance = loadGovernance();

check(scope.defaultLicense === 'GPL-3.0-only', 'licensing scope default must remain GPL-3.0-only');
check(scope.scopeResolution?.defaultAppliesUnlessExplicitOverride === true, 'default license must apply unless explicitly overridden');
check(scope.scopeResolution?.silentRelicensingForbidden === true, 'silent relicensing must be forbidden');
check(scope.openSourceCore?.permanentOpenSourceGuarantee === true, 'Open Source Core guarantee must remain explicit');
check(scope.openSourceCore?.commercialUseWithoutOFUFeeWhenCompliant === true, 'GPL-compliant commercial use must remain fee-free');
check(Array.isArray(scope.currentExplicitOverrides), 'licensing scope must declare explicit overrides array');
check(scope.currentExplicitOverrides.length === 0, 'this refinement must not silently activate a non-GPL path override');

const classes = new Map((scope.classes ?? []).map((entry) => [entry.id, entry]));
check(classes.get('INTEROPERABILITY_SPEC')?.status === 'CANDIDATE_NOT_ACTIVE', 'interoperability permissive boundary must remain inactive until explicit R5 activation');
check(classes.get('INTEROPERABILITY_SPEC')?.candidateLicense === 'Apache-2.0', 'interoperability candidate license mismatch');
check(classes.get('DOCUMENTATION')?.candidateLicense === 'CC-BY-SA-4.0', 'documentation candidate license mismatch');
check(classes.get('NETWORK_SERVER')?.candidateLicense === 'AGPL-3.0-only', 'network server candidate license mismatch');
check(classes.get('NETWORK_SERVER')?.status === 'FUTURE_SEPARATE_ADR_REQUIRED', 'AGPL server boundary must require a separate ADR');

check(scope.gplVersionPolicy?.currentExpression === 'GPL-3.0-only', 'GPL version policy mismatch');
check(scope.gplVersionPolicy?.automaticAdoptionOfFutureGPLVersions === false, 'future GPL versions must not become applicable silently');
check(scope.oneFileArtifact?.exactSourceIdentityRequired === true, 'one-file artifact must require exact source identity');
check(scope.oneFileArtifact?.licenseAndNoticeClosureRequired === true, 'one-file artifact must require license/notice closure');
check(scope.oneFileArtifact?.correspondingSourceStrategyRequiresLegalReview === true, 'Corresponding Source strategy must remain legal-review gated');

check(contribution.machineReadableLicensing?.scopeManifest === 'config/governance/licensing-scope.json', 'contribution policy must bind the licensing scope manifest');
check(contribution.machineReadableLicensing?.explicitOverrideRequired === true, 'license overrides must be explicit');
check(contribution.machineReadableLicensing?.silentRelicensingForbidden === true, 'contribution policy must forbid silent relicensing');
check(contribution.commercialLicensing?.strategy === 'GPL_OPEN_SOURCE_PLUS_OPTIONAL_COMMERCIAL_PROPRIETARY_PERMISSION', 'commercial licensing strategy mismatch');
check(contribution.artifactLicensing?.exactSourceIdentityRequired === true, 'artifact licensing must require exact source identity');

check(provenance.firstPartyMachineReadableLicensing?.strategy === 'NEW_MATERIAL_FIRST_PLUS_HISTORICAL_BACKFILL', 'SPDX/REUSE migration must allow new-material-first plus historical backfill');
check(provenance.firstPartyMachineReadableLicensing?.historicalBackfillRunsInParallel === true, 'historical license backfill should run in parallel');
check(provenance.reuse?.complianceClaim === false, 'REUSE compliance must not be claimed before evidence exists');

const gateIds = new Set((launch.gates ?? []).map((gate) => gate.id));
check(gateIds.has('artifact-license-source-provenance'), 'public launch gates must include artifact license/source provenance');

const classification = classifyFiles(['config/governance/licensing-scope.json'], governance);
check(classification.risk === 'R5', `licensing scope must classify as R5, got ${classification.risk}`);
check(classification.files[0]?.areas?.includes('community'), 'licensing scope must route to community ownership');

const adr = read('docs/adr/ADR-027-open-source-and-dual-licensing.md');
check(adr.includes('No future GPL version becomes applicable automatically'), 'ADR-027 must explain GPL-3.0-only migration policy');
check(adr.includes('This ADR does not relicense any current path to Apache-2.0'), 'ADR-027 must forbid implicit Apache activation');

const licensing = read('LICENSING.md');
check(licensing.includes('does not silently relicense existing paths'), 'LICENSING.md must state the no-silent-relicensing rule');
check(licensing.includes('The one-file artifact is a licensing surface'), 'LICENSING.md must treat the shipping artifact as a licensing surface');

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  suite: 'ofu-licensing-policy-selftest-1',
  checks,
  explicitOverrides: scope.currentExplicitOverrides.length,
  defaultLicense: scope.defaultLicense,
  failures
};
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
