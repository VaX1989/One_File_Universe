import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({});
for(const file of ['address','geography','hydrology'])vm.runInContext(fs.readFileSync('src/domains/v1/surface/'+file+'.js','utf8'),context);
const O=context.OFU,fields=['waterAreaPpm','iceAreaPpm','tectonicActivityPpm','volcanicActivityPpm','impactActivityPpm','erosionActivityPpm','aridityPpm'];
let checks=0;
for(const value of [undefined,null,'',false,NaN,Infinity]){
 const input={planetIdentity:'unknown-world',...Object.fromEntries(fields.map(k=>[k,value]))},model=O.v2x06Geography.createModel(input);
 for(const key of fields){assert.equal(model[key],null);assert.equal(model.descriptor().inputs[key],null);checks+=2;}
 assert.equal(model.AUTHORITY,'PRESENTATION_ONLY');assert.equal(model.presentationAssumptions.fields.length,7);checks+=2;
 const address=O.v2x06SurfaceAddress.locate('unknown-world',0,0,2),sample=model.sample(address),hydrology=O.v2x06Hydrology.createHydrology(model).sample(address);
 assert.equal(sample.authority,'PRESENTATION_ONLY');assert.equal(hydrology.authority,'PRESENTATION_ONLY');assert.equal(hydrology.presentationAssumptions.fields.length,7);checks+=3;
}
const zero=O.v2x06Geography.createModel({planetIdentity:'known-zero',...Object.fromEntries(fields.map(k=>[k,0]))});
assert.equal(zero.waterAreaPpm,0);assert.equal(zero.presentationAssumptions.fields.length,0);checks+=2;
console.log(JSON.stringify({status:'PASS',suite:'v2-surface-unknown-evidence',checks}));
