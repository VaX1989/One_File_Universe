import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SHA40 = /^[0-9a-f]{40}$/;
const RELATIONS = new Set(['BEHIND', 'AHEAD', 'DIVERGED', 'IDENTICAL']);
const UNIQUE_DISPOSITIONS = new Set(['SEMANTIC_REVIEW_NO_BLIND_CHERRYPICK', 'RESEARCH_ONLY_PRESERVE']);
const EXPECTED_LANES = Array.from({ length: 16 }, (_, i) => `V2X-${String(i + 1).padStart(2, '0')}`);
const COMPLETION_STAGES = new Set([
  'SOURCE',
  'SHIPPING_MANIFEST',
  'ONE_FILE_HTML',
  'RUNTIME_EXPORT',
  'ACTUAL_CONSUMER',
  'LIVING_VIEWPORT_OR_USER_ACTION',
  'VISIBLE_OR_AUDIBLE_CONSEQUENCE',
  'PERSISTENCE_OR_REVISIT_WHEN_APPLICABLE',
  'EXACT_ARTIFACT_BROWSER_EVIDENCE'
]);

function fail(message) {
  throw new Error(`V2 zero-loss harvest: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function matchesPattern(file, pattern) {
  if (pattern.endsWith('/**')) return file.startsWith(pattern.slice(0, -3));
  if (pattern.includes('*')) {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(file);
  }
  return file === pattern;
}

export function validateLedgerObject(ledger) {
  assert(ledger && typeof ledger === 'object' && !Array.isArray(ledger), 'ledger object required');
  assert(ledger.schema === 'ofu-v2-zero-loss-harvest-ledger-1', 'unexpected schema');
  assert(ledger.version === '2026-09-08.1', 'unexpected ledger version');

  assert(ledger.authorizedBase?.sha === '2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7', 'authorized base SHA changed');
  assert(ledger.authorizedBase?.tree === '99e6b5ff6229d9c34d381e778c5689bf2367d256', 'authorized base tree changed');
  assert(ledger.authorizedBase?.parallelLaunchStatus === 'FULL', 'parallel launch is not FULL');
  assert(ledger.lane?.branch === 'parallel/v2.0-00-zero-loss-harvest-2026-09-07', 'lane branch changed');
  assert(ledger.centralIntegrationTarget?.policy === 'NO_DIRECT_WRITES_BY_THIS_LANE', 'central write policy weakened');

  assert(Array.isArray(ledger.completionLaw) && ledger.completionLaw.length === COMPLETION_STAGES.size, 'completion law must contain every stage exactly once');
  assert(new Set(ledger.completionLaw).size === ledger.completionLaw.length, 'completion law contains duplicates');
  for (const stage of ledger.completionLaw) assert(COMPLETION_STAGES.has(stage), `unknown completion stage ${stage}`);

  const boundary = ledger.authorityBoundary;
  assert(boundary?.precedence === 'DENY_BEFORE_ALLOW', 'authority precedence weakened');
  assert(boundary?.runtimeCompositionDecision === 'NO_NEW_RUNTIME_COMPONENT', 'unbound runtime composition introduced');
  assert(Array.isArray(boundary.centralOwnerOnlyPatterns) && boundary.centralOwnerOnlyPatterns.length > 0, 'central owner deny set required');
  assert(Array.isArray(boundary.ownedPaths) && boundary.ownedPaths.length > 0, 'owned paths required');
  assert(new Set(boundary.ownedPaths).size === boundary.ownedPaths.length, 'duplicate owned paths');
  for (const owned of boundary.ownedPaths) {
    assert(typeof owned === 'string' && owned.length > 0, 'invalid owned path');
    for (const denied of boundary.centralOwnerOnlyPatterns) {
      assert(!matchesPattern(owned, denied), `owned path crosses central boundary: ${owned} matches ${denied}`);
    }
  }

  assert(Array.isArray(ledger.branchHarvest) && ledger.branchHarvest.length === 16, 'exactly 16 V2X lane records required');
  const lanes = ledger.branchHarvest.map(entry => entry.lane);
  assert(new Set(lanes).size === 16, 'duplicate V2X lane record');
  assert(EXPECTED_LANES.every(id => lanes.includes(id)), 'V2X-01..V2X-16 coverage incomplete');

  for (const entry of ledger.branchHarvest) {
    assert(SHA40.test(entry.headSha), `${entry.lane} head SHA invalid`);
    if (entry.headTree !== undefined) assert(SHA40.test(entry.headTree), `${entry.lane} head tree invalid`);
    assert(RELATIONS.has(entry.relationToAuthorizedBase), `${entry.lane} relation invalid`);
    assert(Number.isInteger(entry.aheadBy) && entry.aheadBy >= 0, `${entry.lane} aheadBy invalid`);
    assert(Number.isInteger(entry.behindBy) && entry.behindBy >= 0, `${entry.lane} behindBy invalid`);
    assert(entry.uniqueHistory === (entry.aheadBy > 0), `${entry.lane} uniqueHistory must equal aheadBy>0`);
    if (entry.aheadBy === 0) {
      assert(entry.integrationDisposition === 'ALREADY_HARVESTED_IN_BASE', `${entry.lane} zero-ahead lane must be classified as already harvested`);
      assert(entry.relationToAuthorizedBase === 'BEHIND' || entry.relationToAuthorizedBase === 'IDENTICAL', `${entry.lane} zero-ahead relation inconsistent`);
    } else {
      assert(UNIQUE_DISPOSITIONS.has(entry.integrationDisposition), `${entry.lane} unique history requires explicit safe disposition`);
      assert(SHA40.test(entry.headTree || ''), `${entry.lane} unique history requires exact head tree`);
      assert(typeof entry.risk === 'string' && entry.risk.length > 0 || entry.integrationDisposition === 'RESEARCH_ONLY_PRESERVE', `${entry.lane} unique shipping history requires risk statement`);
    }
  }

  for (const researchLane of ['V2X-15', 'V2X-16']) {
    const entry = ledger.branchHarvest.find(item => item.lane === researchLane);
    assert(entry.authority === 'RESEARCH_ONLY', `${researchLane} authority escalation`);
    assert(entry.shippingPromotionPerformed === false, `${researchLane} shipping promotion must remain false`);
    assert(entry.integrationDisposition === 'RESEARCH_ONLY_PRESERVE', `${researchLane} research disposition changed`);
  }
  assert(ledger.researchAuthority?.v2x15?.authority === 'RESEARCH_ONLY', 'V2X-15 research authority changed');
  assert(ledger.researchAuthority?.v2x15?.canonicalPromotionPerformed === false, 'V2X-15 canonical promotion falsely claimed');
  assert(ledger.researchAuthority?.v2x16?.authority === 'RESEARCH_ONLY', 'V2X-16 research authority changed');
  assert(ledger.researchAuthority?.v2x16?.shippingPromotionPerformed === false, 'V2X-16 shipping promotion falsely claimed');

  assert(Array.isArray(ledger.verticalFalsification) && ledger.verticalFalsification.length >= 6, 'vertical falsification coverage too small');
  for (const vertical of ledger.verticalFalsification) {
    assert(typeof vertical.id === 'string' && vertical.id.length > 0, 'vertical id required');
    assert(vertical.status !== 'COMPLETE', `${vertical.id} may not claim COMPLETE while this lane lacks central authority`);
    assert(Array.isArray(vertical.missingCompletionStages) && vertical.missingCompletionStages.length > 0, `${vertical.id} missing stages required`);
    assert(Array.isArray(vertical.blockers) && vertical.blockers.length > 0, `${vertical.id} blocker statement required`);
    for (const stage of vertical.missingCompletionStages) {
      assert(COMPLETION_STAGES.has(stage), `${vertical.id} has unknown missing stage ${stage}`);
    }
  }

  const life = ledger.verticalFalsification.find(v => v.id === 'V2X-08-LIFE');
  assert(life?.observations?.richModuleBytes === 71209, 'V2X-08 rich-module byte evidence changed');
  assert(life?.observations?.directManifestFacadeBytes === 6397, 'V2X-08 manifest-facade byte evidence changed');
  assert(typeof life?.observations?.interpretation === 'string' && /does not prove/i.test(life.observations.interpretation), 'V2X-08 byte signal must remain explicitly non-probative');

  const individuals = ledger.verticalFalsification.find(v => v.id === 'V2X-10-INDIVIDUALS');
  assert(individuals?.observations?.identityPersistentAcrossRevisit === true, 'V2X-10 revisit identity evidence changed');
  assert(individuals?.observations?.retainedMemoryPersistence === false, 'V2X-10 memory persistence falsely promoted');
  assert(individuals?.observations?.mortalityAwareRefinement === false, 'V2X-10 mortality refinement falsely promoted');

  assert(Array.isArray(ledger.centralDependencies) && ledger.centralDependencies.length > 0, 'central dependencies required');
  for (const dependency of ledger.centralDependencies) {
    assert(dependency.required === true, `${dependency.id} required flag weakened`);
    assert(typeof dependency.owner === 'string' && dependency.owner.length > 0, `${dependency.id} owner required`);
    assert(typeof dependency.reason === 'string' && dependency.reason.length > 0, `${dependency.id} reason required`);
  }

  return {
    schema: ledger.schema,
    lanes: ledger.branchHarvest.length,
    uniqueHistoryLanes: ledger.branchHarvest.filter(x => x.uniqueHistory).map(x => x.lane),
    centralDependencies: ledger.centralDependencies.map(x => x.id)
  };
}

export function validateLedgerFile(file) {
  const bytes = fs.readFileSync(file);
  const ledger = JSON.parse(bytes);
  const summary = validateLedgerObject(ledger);
  return {
    ...summary,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const file = path.resolve(process.argv[2] || 'docs/parallel/v2.0-00-zero-loss-harvest/ZERO_LOSS_HARVEST_LEDGER.json');
  const result = validateLedgerFile(file);
  console.log('V2 zero-loss harvest validator: PASS');
  console.log(JSON.stringify(result));
}
