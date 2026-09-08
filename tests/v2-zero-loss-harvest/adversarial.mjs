import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validateLedgerObject } from '../../tools/v2-zero-loss-harvest-validate.mjs';

const source = JSON.parse(fs.readFileSync('docs/parallel/v2.0-00-zero-loss-harvest/ZERO_LOSS_HARVEST_LEDGER.json', 'utf8'));
const clone = () => structuredClone(source);
const mustReject = (mutate, pattern) => {
  const candidate = clone();
  mutate(candidate);
  assert.throws(() => validateLedgerObject(candidate), pattern);
};

assert.doesNotThrow(() => validateLedgerObject(clone()));

mustReject(x => { x.branchHarvest[1].lane = 'V2X-01'; }, /duplicate V2X lane record/);
mustReject(x => { x.branchHarvest.find(v => v.lane === 'V2X-14').integrationDisposition = 'ALREADY_HARVESTED_IN_BASE'; }, /unique history requires explicit safe disposition/);
mustReject(x => { x.branchHarvest.find(v => v.lane === 'V2X-15').shippingPromotionPerformed = true; }, /shipping promotion must remain false/);
mustReject(x => { x.researchAuthority.v2x15.canonicalPromotionPerformed = true; }, /canonical promotion falsely claimed/);
mustReject(x => { x.authorityBoundary.ownedPaths.push('.github/workflows/harvest.yml'); }, /crosses central boundary/);
mustReject(x => { x.verticalFalsification[0].status = 'COMPLETE'; }, /may not claim COMPLETE/);
mustReject(x => { x.verticalFalsification[0].blockers = []; }, /blocker statement required/);
mustReject(x => { x.verticalFalsification.find(v => v.id === 'V2X-10-INDIVIDUALS').observations.retainedMemoryPersistence = true; }, /memory persistence falsely promoted/);
mustReject(x => { x.authorizedBase.tree = '0'.repeat(40); }, /authorized base tree changed/);

console.log('V2 zero-loss harvest adversarial falsification: PASS');
