import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const panel=fs.readFileSync('src/bootstrap/product/inspect-panel.html','utf8');
const source=fs.readFileSync('src/bootstrap/product/inspector-product.js','utf8');

assert.match(panel,/What the canonical model says|Understand what the canonical model says/);
assert.match(panel,/Environment/);
assert.match(panel,/Biology/);
assert.match(panel,/Evidence, limits & provenance/);
assert.match(panel,/Advanced details & canonical record/);
assert.match(panel,/Open Lab technical evidence/);
assert.ok(panel.indexOf('Entity Identity')>panel.indexOf('Advanced details & canonical record'),'raw identity must be progressively disclosed');
assert.ok(panel.indexOf('Canonical address query')>panel.indexOf('Advanced details & canonical record'),'raw query must be progressively disclosed');
assert.match(panel,/Unknown values remain unknown/);
assert.doesNotMatch(panel,/Unknown values.*(?:dead|sterile|lifeless|uninhabitable)/i);

const ids=[...panel.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Inspector panel must not contain duplicate IDs');
assert.equal((panel.match(/<details\b/g)||[]).length,(panel.match(/<\/details>/g)||[]).length,'details elements must be balanced');

const sandbox={globalThis:null,OFU:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setInterval(){},addEventListener(){}};
sandbox.globalThis=sandbox;
vm.runInNewContext(source,sandbox,{filename:'inspector-product.js'});
const api=sandbox.OFU.v08InspectorProduct;
assert.equal(api.seamVersion,2);
assert.equal(api.statusLabel('KNOWN'),'Known');
assert.equal(api.statusLabel('DERIVED'),'Derived');
assert.equal(api.statusLabel('UNKNOWN'),'Not established');
assert.equal(api.statusLabel('UNSUPPORTED'),'Outside current model');

assert.match(api.p6Copy.INSUFFICIENT_ENVIRONMENT.primary,/cannot currently make a canonical biosphere assessment/i);
assert.match(api.p6Copy.INSUFFICIENT_ENVIRONMENT.limit,/does not mean dead, sterile, lifeless, or uninhabitable/i);
assert.match(api.p6Copy.UNSUPPORTED_ENVIRONMENT.primary,/outside the semantics currently supported/i);
assert.match(api.p6Copy.UNSUPPORTED_ENVIRONMENT.limit,/Unsupported is distinct from absent or lifeless/i);
assert.match(api.p6Copy.NO_BIOSPHERE.primary,/no canonical biosphere is established/i);
assert.notEqual(api.p6Copy.INSUFFICIENT_ENVIRONMENT.primary,api.p6Copy.UNSUPPORTED_ENVIRONMENT.primary);

assert.match(api.unsupportedReason('P5_MASS_DOMAIN'),/mass lies outside the promoted domain/i);
assert.match(api.unsupportedReason('MASS_DOMAIN'),/mass lies outside the promoted domain/i);
assert.match(api.unsupportedReason('P5_BULK_PRIOR'),/bulk class/i);
assert.match(api.unsupportedReason('P3_ABSENT'),/No canonical target exists/i);

for(const forbidden of ['dead','sterile','lifeless','uninhabitable']){
  assert.ok(!api.unsupportedReason('P5_MASS_DOMAIN').toLowerCase().includes(forbidden),`unsupported target copy must not claim ${forbidden}`);
}

assert.match(source,/PENDING_TARGET_MATCH/,'stale-target guard must withhold downstream science');
assert.match(source,/ERROR:\|FAIL:\|ABSENT\|Input error:/,'failed query guard must hide stale selection presentation');
assert.match(source,/I\.type!==\'Planet\'/,'non-planet targets must not receive P5\/P6 planet interpretation');
assert.match(source,/O\.inspectorTest\?\.state\?\.current/,'Lane C must consume existing canonical inspector state');
assert.doesNotMatch(source,/resolvePlanet\s*\(/,'Lane C must not independently resolve canonical planets');
assert.doesNotMatch(source,/realizePhysicalPlanet\s*\(/,'Lane C must not independently create P5 authority');
assert.doesNotMatch(source,/environmentV2Projection\s*\(/,'Lane C must not independently create Environment authority');
assert.doesNotMatch(source,/\.eligibility\s*\(/,'Lane C must not independently create P6 authority');

console.log('v0.8 Inspector product lane: PASS');
