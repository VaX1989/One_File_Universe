import assert from 'node:assert/strict';import fs from 'node:fs';import {loadConformance,validateConformance,validateCoverage} from '../../tools/extensions/conformance.mjs';
const tests=loadConformance(),catalogs=fs.readdirSync('config/extensions').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('config/extensions/'+f,'utf8'))).filter(c=>c.schema==='ofu-provider-catalog-1');let cases=0;
validateCoverage(catalogs,tests);cases++;
const input=tests.map(({sourceSha256,...t})=>t),base=input[0];
for(const bad of [[...input,base],[{...base,command:['sh','tests/extensions/contracts.mjs']}],[{...base,command:['node','tests/../bad.mjs']}],[{...base,tier:'PRETEND_PASS'}],[{...base,timeoutMs:0}]]){assert.throws(()=>validateConformance(bad));cases++;}
assert.throws(()=>validateCoverage(catalogs,tests.filter(t=>t.id!=='px.product')));cases++;
const modified=structuredClone(catalogs);modified[0].providers[0].evidence=modified[0].providers[0].evidence.filter(e=>e.tier!=='RELEASE');assert.throws(()=>validateCoverage(modified,tests));cases++;
console.log(JSON.stringify({status:'PASS',suite:'px-conformance',cases}));
