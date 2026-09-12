import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../../..');
globalThis.OFU={};
const load=rel=>vm.runInThisContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),{filename:rel});
for(const rel of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js','src/domains/v1/materials/material-model.js','src/domains/v1/materials/reference-properties.js'])load(rel);
const O=globalThis.OFU,M=O.v1Materials,R=O.v1MaterialReference,id=c=>c.repeat(64);
const water=M.source({sourceEntityId:id('a'),kind:'WATER',authority:'MODEL_DERIVED_SIMULATION',chemistryAuthority:M.CHEMISTRY.MODEL_DERIVED,
 components:[{id:'WATER_MODEL',formula:'H2O',ppm:1000000,authority:M.CHEMISTRY.MODEL_DERIVED}]});
const a=R.profile(water),b=R.profile(water);
assert.deepEqual(a,b);assert.equal(a.deterministic,true);assert.equal(a.bounded,true);assert.equal(a.canonicalClaim,false);assert.equal(a.materialTruthClaim,false);
assert.equal(a.propertyAuthority,'DERIVED_FROM_MODEL_CHEMISTRY_AND_SOURCE_BACKED_REFERENCE');assert.equal(a.state,'FORMULA_COMPONENTS_REFERENCE_RESOLVED');
assert.equal(a.resolvedFormulaPpm,1000000);assert.equal(a.unresolvedFormulaPpm,0);assert.deepEqual(a.distinctElements,['H','O']);
assert.equal(a.components[0].referenceMass.lowerQ9,'18014710000');assert.equal(a.components[0].referenceMass.upperQ9,'18015990000');
assert.equal(a.components[0].referenceMass.isotopeSpecific,false);assert.equal(a.reference.authority,'SOURCE_BACKED_REFERENCE');
const salt=M.source({sourceEntityId:id('b'),kind:'MINERAL',authority:'DERIVED',chemistryAuthority:M.CHEMISTRY.SOURCE_BACKED,
 components:[{id:'HALITE',formula:'NaCl',ppm:1000000,authority:M.CHEMISTRY.SOURCE_BACKED}]});
const saltProfile=R.profile(salt);assert.equal(saltProfile.propertyAuthority,'DERIVED_FROM_SOURCE_BACKED_CHEMISTRY_AND_REFERENCE');
assert.equal(saltProfile.components[0].referenceMass.lowerQ9,'58435769260');assert.equal(saltProfile.components[0].referenceMass.upperQ9,'58446769300');
const rock=M.source({sourceEntityId:id('c'),kind:'ROCK',authority:'MODEL_DERIVED_SIMULATION',chemistryAuthority:M.CHEMISTRY.MODEL_DERIVED,
 components:[{id:'SILICATE_FRACTION',ppm:600000},{id:'METAL_FRACTION',ppm:400000}]});
const unresolved=R.profile(rock);assert.equal(unresolved.state,'CHEMISTRY_UNRESOLVED');assert.equal(unresolved.resolvedFormulaPpm,0);assert.equal(unresolved.unresolvedFormulaPpm,1000000);
assert.ok(unresolved.components.every(x=>x.referenceMass.supported===false));assert.equal(unresolved.bulkMolarMassClaim,false);
const mixed=M.source({sourceEntityId:id('d'),kind:'SOIL',authority:'MODEL_DERIVED_SIMULATION',chemistryAuthority:M.CHEMISTRY.MODEL_DERIVED,
 components:[{id:'ICE_FILM',formula:'H2O',ppm:600000},{id:'UNRESOLVED_MATRIX',ppm:400000}]});
const partial=R.profile(mixed);assert.equal(partial.state,'PARTIALLY_REFERENCE_RESOLVED');assert.equal(partial.resolvedFormulaPpm,600000);assert.equal(partial.unresolvedFormulaPpm,400000);
assert.equal(partial.bulkMolarMassClaim,false);assert.ok(partial.limitations.some(x=>x.includes('no bulk mixture molar mass')));
const unsupported=R.formulaMassInterval({elements:{Xe:1}});assert.equal(unsupported.supported,false);assert.equal(unsupported.reason,'UNSUPPORTED_REFERENCE_ELEMENT');assert.equal(unsupported.element,'Xe');
O.v1WorldMaterials=Object.freeze({VERSION:'test-material-context',sourceFor(){return water;}});load('src/domains/v1/convergence/material-reference-context.js');
const enriched=O.v1WorldMaterials.sourceFor({},{},'sample');assert.equal(enriched.sourceEntityId,water.sourceEntityId);assert.equal(enriched.contract,water.contract);
assert.equal(enriched.referenceProperties.sourceEntityId,water.sourceEntityId);assert.equal(enriched.referenceProperties.components[0].referenceMass.lowerQ9,'18014710000');
console.log(JSON.stringify({status:'PASS',suite:'v1.1 material reference properties',version:R.VERSION,waterIntervalQ9:[a.components[0].referenceMass.lowerQ9,a.components[0].referenceMass.upperQ9],unresolvedPpm:unresolved.unresolvedFormulaPpm}));
