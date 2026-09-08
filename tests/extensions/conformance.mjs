import assert from 'node:assert/strict';
import {loadConformance,providerCatalogsForConformance,validateConformance,validateCoverage} from '../../tools/extensions/conformance.mjs';
import {loadComponents} from '../../tools/extensions/components.mjs';
const tests=loadConformance();
const plan=loadComponents();
const catalogs=providerCatalogsForConformance(plan);
let cases=0;validateCoverage(catalogs,tests);cases++;
const input=tests.map(({sourceSha256,...t})=>t),base=input[0];
for(const bad of [[...input,base],[{...base,command:['sh','tests/extensions/contracts.mjs']}],[{...base,command:['node','tests/../bad.mjs']}],[{...base,tier:'PRETEND_PASS'}],[{...base,timeoutMs:0}]]){assert.throws(()=>validateConformance(bad));cases++;}
assert.throws(()=>validateCoverage(catalogs,tests.filter(t=>t.id!=='px.product')));cases++;
const modified=structuredClone(catalogs);const mandatoryCatalog=modified.find(c=>c.providers.some(p=>p.mandatory));assert.ok(mandatoryCatalog);const mandatoryProvider=mandatoryCatalog.providers.find(p=>p.mandatory);mandatoryProvider.evidence=mandatoryProvider.evidence.filter(e=>e.tier!=='RELEASE');assert.throws(()=>validateCoverage(modified,tests));cases++;
const activeCatalogComponents=plan.filter(c=>c.id.startsWith('px.providers.'));
const frontierCatalogComponents=plan.filter(c=>c.id.startsWith('v2x.frontier.providers.'));
assert.ok(activeCatalogComponents.length>0,'active shipping catalogs must remain present');cases++;
assert.ok(frontierCatalogComponents.length>0,'frontier catalogs must remain independently testable');cases++;
console.log(JSON.stringify({status:'PASS',suite:'px-conformance',cases,catalogs:catalogs.length,activeCatalogs:activeCatalogComponents.length,frontierCatalogs:frontierCatalogComponents.length}));
