import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const ORDER=Object.freeze(['STELLAR_FORCING','ATMOSPHERE_RETENTION','INTERIOR_GEODYNAMICS','SURFACE_VOLATILES']);
const trace=Object.freeze({local:Object.freeze({processes:Object.freeze([
  Object.freeze({id:ORDER[0],influenceSharePpm:400000}),Object.freeze({id:ORDER[1],influenceSharePpm:200000}),
  Object.freeze({id:ORDER[2],influenceSharePpm:250000}),Object.freeze({id:ORDER[3],influenceSharePpm:150000})
])})});
const environment=Object.freeze({temperatureCompatibilityPpm:850000,nutrientAvailabilityPpm:720000,freeEnergyAvailabilityPpm:780000,disturbancePpm:120000});
const populations=Object.freeze([
  Object.freeze({populationId:'a'.repeat(64),lineageId:'1'.repeat(64),role:'PRIMARY_PRODUCER',localDensityPpm:700000}),
  Object.freeze({populationId:'b'.repeat(64),lineageId:'2'.repeat(64),role:'CHEMOTROPH',localDensityPpm:420000}),
  Object.freeze({populationId:'c'.repeat(64),lineageId:'3'.repeat(64),role:'PREDATOR',localDensityPpm:180000})
]);
const context=Object.freeze({planetaryCausality:trace,life:Object.freeze({environment,local:Object.freeze({populations})})});
OFU.v1PlanetaryCausalityTrace=Object.freeze({ORDER});
OFU.v1WorldContext=Object.freeze({localContext(){return context;}});
vm.runInThisContext(fs.readFileSync('src/domains/v1/ecology/causal-niche.js','utf8'),{filename:'src/domains/v1/ecology/causal-niche.js'});
const E=OFU.v1EcologyCausalNiche,a=E.profileFromContext(context),b=E.profileFromContext(context);
assert.deepEqual(a,b);assert.equal(a.supported,true);assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.canonicalP6Unchanged,true);
assert.equal(a.populationCount,3);assert.ok(a.populationCount<=E.MAX_POPULATIONS);
for(const p of a.profiles){assert.equal(p.drivers.reduce((n,x)=>n+x.sharePpm,0),1000000);assert.equal(p.canonicalBiologyClaim,false);assert.equal(p.fitnessMeasurement,false);assert.ok(p.modeledSupportPpm>=0&&p.modeledSupportPpm<=1000000);}
assert.equal(a.profiles[0].dominantDriver,'STELLAR_FORCING');
assert.equal(a.profiles[1].dominantDriver,'INTERIOR_GEODYNAMICS');
assert.notEqual(a.profiles[0].modeledSupportPpm,a.profiles[2].modeledSupportPpm);
const many=E.profileFromContext({...context,life:{environment,local:{populations:Array.from({length:20},(_,i)=>({populationId:String(i).padStart(64,'0'),role:'CONSUMER',localDensityPpm:i*40000}))}}});
assert.equal(many.populationCount,12);assert.equal(many.profiles.length,12);
const none=E.profileFromContext({planetaryCausality:trace,life:{environment,local:{populations:[]}}});assert.equal(none.supported,false);assert.equal(none.reason,'NO_MODELED_LOCAL_POPULATIONS');assert.deepEqual(none.profiles,[]);
const missing=E.profileFromContext({life:{environment,local:{populations}}});assert.equal(missing.supported,false);assert.equal(missing.reason,'NO_PLANETARY_CAUSAL_TRACE');
const wrapped=OFU.v1WorldContext.localContext({},{});assert.equal(wrapped.planetaryCausality,trace);assert.equal(wrapped.ecologyCausality.supported,true);assert.equal(wrapped.ecologyCausality.profiles.length,3);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 ecology causal niche',version:E.VERSION,populations:a.populationCount,bounded:many.populationCount,authority:a.authority.class}));
