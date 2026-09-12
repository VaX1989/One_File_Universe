import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateLedgerFile} from '../../tools/v2-zero-loss-harvest-validate.mjs';

const finalAudit=JSON.parse(fs.readFileSync('docs/parallel/V2_ZERO_LOSS_FINAL_AUDIT.json','utf8'));
const central=JSON.parse(fs.readFileSync('docs/parallel/V2_INTEGRATION_LEDGER.json','utf8'));
assert.equal(finalAudit.schema,'ofu-v2-zero-loss-final-audit-1');
assert.equal(finalAudit.status,'PASS');
assert.deepEqual(finalAudit.missing,[],'zero-loss audit cannot certify unexplained MISSING work');
assert.equal(finalAudit.sourceAuthorities.pr259Head,'7aa33657628a63569561dc97489c9699e8f8874d');
assert.equal(finalAudit.sourceAuthorities.pr267Head,'68d79fa5f98dad56acd44b4098680e5c96dc0613');
const allowed=new Set(finalAudit.allowedDispositions),families=finalAudit.families;
assert.equal(families.length,18,'V2X-01..16 plus PR259 harvest and PR267 cinematic families required');
assert.equal(new Set(families.map(row=>row.id)).size,families.length,'duplicate zero-loss family');
for(let n=1;n<=16;n++)assert(families.some(row=>row.id===`V2X-${String(n).padStart(2,'0')}`),`missing V2X-${String(n).padStart(2,'0')}`);
for(const row of families){
 assert(allowed.has(row.disposition),`invalid disposition ${row.id}`);
 assert.notEqual(row.disposition,'MISSING');
 if(row.shippingEligible)assert.notEqual(row.disposition,'INTENTIONALLY_EXCLUDED_WITH_AUTHORITY',`shipping-eligible family excluded: ${row.id}`);
 assert(Array.isArray(row.evidence)&&row.evidence.length>0,`evidence required: ${row.id}`);
 for(const file of row.evidence)assert(fs.existsSync(file),`missing executable/evidence path for ${row.id}: ${file}`);
}
const expected=new Map(central.laneDispositions.map(row=>[row.lane,row.disposition==='INTEGRATED'?'ADOPTED':row.disposition==='CENTRALLY_REIMPLEMENTED'?'SUPERSEDED':'INTENTIONALLY_EXCLUDED_WITH_AUTHORITY']));
for(const [id,disposition] of expected)assert.equal(families.find(row=>row.id===id)?.disposition,disposition,`central disposition mismatch: ${id}`);
const harvest=validateLedgerFile('docs/parallel/v2.0-00-zero-loss-harvest/ZERO_LOSS_HARVEST_LEDGER.json');
assert.equal(harvest.historicalLanes,16);assert.equal(harvest.currentLanes,16);
assert.equal(finalAudit.cinematicReconciliation.status,'RECONCILED');
assert.equal(finalAudit.cinematicReconciliation.timeoutChanges,'NONE');
assert(finalAudit.cinematicReconciliation.excludedObsoleteImplementationDetails.some(row=>row.path==='config/conformance/v11-living-wheel-normalization.json'));
console.log(JSON.stringify({status:'PASS',suite:'v2-zero-loss-final-audit',families:families.length,missing:0,pr259:'ADOPTED',pr267:'RECONCILED'}));
