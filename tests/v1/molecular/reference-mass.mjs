import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/materials/material-model.js','src/domains/v1/materials/reference-properties.js',
  'src/domains/v1/micro/microstructure.js','src/domains/v1/molecular/representative.js',
  'src/domains/v1/molecular/reference-mass.js','src/domains/v1/atomic/representative.js',
  'src/domains/v1/micro/pipeline.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const M=OFU.v1Materials,Micro=OFU.v1Microstructure,Mol=OFU.v1Molecular,P=OFU.v1MicroPipeline;
const source=M.source({sourceEntityId:'water-sample-v11',parentEntityId:'location-v11',kind:'WATER',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION'});
const material=M.materialize(source),micro=Micro.sample(material,{sampleIndex:3,maxFeatures:8}),a=Mol.represent(material,micro,{sampleIndex:3,maxUnits:6}),b=Mol.represent(material,micro,{sampleIndex:3,maxUnits:6});
assert.deepEqual(a,b);assert.equal(a.sourceEntityId,source.sourceEntityId);assert.equal(a.chemistryAuthority,M.CHEMISTRY.SOURCE_BACKED);
assert.equal(a.referenceMassContext.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.referenceMassContext.propertyAuthority,'DERIVED_FROM_SOURCE_BACKED_CHEMISTRY_AND_REFERENCE');
assert.equal(a.referenceMassContext.resolvedUnits,a.unitCount);assert.equal(a.referenceMassContext.totalUnits,a.unitCount);assert.equal(a.referenceMassContext.bulkMolarMassClaim,false);assert.equal(a.referenceMassContext.isotopeInventoryClaim,false);assert.equal(a.referenceMassContext.measuredWorldSample,false);assert.equal(a.referenceMassContext.canonicalPromotion,false);
assert.ok(a.units.length>0);for(const unit of a.units){assert.equal(unit.formula,'H2O');assert.equal(unit.referenceMass.supported,true);assert.equal(unit.referenceMass.lowerQ9,'18014710000');assert.equal(unit.referenceMass.upperQ9,'18015990000');assert.equal(unit.referenceMass.scaleQ9,1000000000);assert.equal(unit.referenceMass.unit,'u');assert.equal(unit.referenceSource,'CIAAW-SAW-2024');assert.equal(unit.isotopeSpecific,false);assert.equal(unit.referenceMassCanonicalClaim,false);}
const session=P.createSession(source,{sampleIndex:3,microFeatures:8,molecularUnits:6,atoms:32});session.transitionTo('material');session.transitionTo('microstructure');const molecularState=session.transitionTo('molecular');
assert.equal(molecularState.regime,'molecular');assert.equal(molecularState.current.referenceMassContext.resolvedUnits,molecularState.current.unitCount);assert.equal(molecularState.current.sourceEntityId,source.sourceEntityId);
const atomicState=session.transitionTo('atomic');assert.equal(atomicState.regime,'atomic');assert.equal(atomicState.current.sourceEntityId,source.sourceEntityId);assert.equal(atomicState.current.quantumBoundary.electronOrbitClaim,false);assert.equal(session.reconcile().status,'PASS');
const unknown=M.source({sourceEntityId:'air-unresolved-v11',kind:'ATMOSPHERE',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION'}),unknownMaterial=M.materialize(unknown),unknownMicro=Micro.sample(unknownMaterial,{maxFeatures:8}),unknownMolecular=Mol.represent(unknownMaterial,unknownMicro,{maxUnits:4});
assert.equal(unknownMolecular.unitCount,0);assert.equal(unknownMolecular.status,'INSUFFICIENT_CHEMISTRY_FOR_MOLECULAR_STRUCTURE');assert.equal(unknownMolecular.referenceMassContext.resolvedUnits,0);assert.equal(unknownMolecular.referenceMassContext.profileState,'CHEMISTRY_UNRESOLVED');
assert.equal(unknownMolecular.referenceMassContext.researchLineage.researchAuthorityPromoted,false);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 molecular reference mass',source:source.sourceEntityId,units:a.unitCount,waterLowerQ9:a.units[0].referenceMass.lowerQ9,waterUpperQ9:a.units[0].referenceMass.upperQ9}));
