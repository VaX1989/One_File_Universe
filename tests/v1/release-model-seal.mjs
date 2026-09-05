import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {loadComponents} from '../../tools/extensions/components.mjs';
const catalog=JSON.parse(fs.readFileSync('config/extensions/v1.json','utf8')),plan=loadComponents(),ids=catalog.providers.map(p=>p.id).sort();let cases=0;
assert.equal(catalog.schema,'ofu-provider-catalog-1');assert.equal(catalog.canonicalAdmissions.length,0);cases+=2;
assert.deepEqual(catalog.owners.map(o=>o.id),['v1']);assert(catalog.owners[0].authorities.includes('MODEL_DERIVED_SIMULATION'));cases+=2;
for(const p of catalog.providers){assert.equal(p.owner,'v1');assert.equal(p.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(p.lifecycle,'SHIPPING');assert.equal(p.mandatory,true);assert.deepEqual(p.evidence.map(e=>e.tier),['FAST_LOCAL','INTEGRATION','RELEASE']);assert(p.authority.sources.length>=1);assert(p.authority.limitations.length>=1);cases+=7;}
const components=plan.filter(c=>c.owner==='v1'),componentIds=new Set(components.map(c=>c.id));for(const id of ['px.providers.v1','v1.models.common','v1.models.astronomy','v1.models.planetology','v1.models.biology','v1.models.civilization','v1.models.microscopic','v1.models.world','v1.providers.bindings'])assert(componentIds.has(id));cases+=9;
const binding=plan.find(c=>c.id==='v1.providers.bindings');assert(binding.dependencies.includes('ofu.extensions.product-bindings')&&binding.dependencies.includes('v1.models.world'));cases++;
const providerCatalog=plan.find(c=>c.id==='px.providers.v1');assert.equal(providerCatalog.authority,'MODEL_DERIVED_SIMULATION');cases++;
for(const forbidden of ['CANONICAL_PROVEN'])assert(!JSON.stringify(catalog).includes('"class":"'+forbidden+'"'));cases++;
const digest=crypto.createHash('sha256').update(JSON.stringify({providers:ids,components:components.map(c=>({id:c.id,sha:c.sourceSha256})),catalog})).digest('hex');
console.log(JSON.stringify({status:'PASS',suite:'v1-release-model-seal',cases,providerCount:ids.length,componentCount:components.length,digest,canonicalAdmissions:0,physicalDevices:'NOT_VERIFIED',gpuEvidence:false}));
