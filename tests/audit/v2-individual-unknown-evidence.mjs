import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {materializeIndividual,retainIndividual} from '../../src/domains/v1/individuals/runtime.js';
vm.runInThisContext(fs.readFileSync('src/domains/v1/individuals/provider.js','utf8'));
const shipping=globalThis.OFU.v2x10Individuals;
let checks=0;
for(const [materialize,retain] of [[materializeIndividual,retainIndividual],[shipping.materialize,shipping.retain]]){
 const input={worldId:'science-test',settlementId:'unknown',birthOrdinal:5,currentYear:20};
 const unknown=materialize(input);
 for(const field of ['householdOrdinal','householdId','role','age']){assert.equal(unknown[field],null);checks++;}
 const retained=JSON.parse(JSON.stringify(retain(unknown)));
 const revisit=materialize({...input,retained});
 assert.equal(revisit.role,null);assert.equal(revisit.householdId,null);checks+=2;
 const modeled=materialize({...input,aggregate:{householdSizeEstimate:2,roles:['farmer']}});
 assert.equal(modeled.householdOrdinal,2);assert.equal(modeled.role,'farmer');checks+=2;
 const durable=materialize({...input,retained:JSON.parse(JSON.stringify(retain(modeled)))});
 assert.equal(durable.householdId,modeled.householdId);assert.equal(durable.role,'farmer');checks+=2;
}
console.log(JSON.stringify({status:'PASS',suite:'v2-individual-unknown-evidence',checks}));
