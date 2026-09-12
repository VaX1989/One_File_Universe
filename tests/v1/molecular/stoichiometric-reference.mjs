import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/materials/material-model.js','src/domains/v1/materials/reference-properties.js',
  'src/domains/v1/micro/microstructure.js','src/domains/v1/molecular/representative.js',
  'src/domains/v1/molecular/reference-mass.js','src/domains/v1/molecular/stoichiometric-reference.js',
  'src/domains/v1/atomic/representative.js','src/domains/v1/micro/pipeline.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const M=OFU.v1Materials,Micro=OFU.v1Microstructure,Mol=OFU.v1Molecular,S=OFU.v1MolecularStoichiometry,P=OFU.v1MicroPipeline;
const source=M.source({sourceEntityId:'water-stoichiometry-v11',parentEntityId:'location-v11',kind:'WATER',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION'});
const material=M.materialize(source),micro=Micro.sample(material,{sampleIndex:4,maxFeatures:8}),a=Mol.represent(material,micro,{sampleIndex:4,maxUnits:6}),b=Mol.represent(material,micro,{sampleIndex:4,maxUnits:6});
assert.deepEqual(a,b);assert.equal(a.sourceEntityId,source.sourceEntityId);assert.equal(a.stoichiometricReferenceContext.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.stoichiometricReferenceContext.resolvedUnits,a.unitCount);assert.equal(a.stoichiometricReferenceContext.totalUnits,a.unitCount);assert.equal(a.stoichiometricReferenceContext.formulaUnitOnly,true);assert.equal(a.stoichiometricReferenceContext.bulkCompositionClaim,false);assert.equal(a.stoichiometricReferenceContext.bulkMassFractionClaim,false);assert.equal(a.stoichiometricReferenceContext.isotopeInventoryClaim,false);assert.equal(a.stoichiometricReferenceContext.canonicalPromotion,false);
assert.ok(a.units.length>0);
for(const unit of a.units){
  assert.equal(unit.formula,'H2O');assert.equal(unit.referenceMass.supported,true);assert.equal(unit.stoichiometry.supported,true);assert.equal(unit.stoichiometry.totalAtomCount,3);assert.equal(unit.stoichiometry.elementCount,2);assert.equal(unit.stoichiometry.countFractionClosurePpm,1000000);assert.equal(unit.stoichiometry.referenceMassClosure,true);assert.equal(unit.stoichiometry.bulkCompositionClaim,false);assert.equal(unit.stoichiometry.measuredWorldSample,false);
  const H=unit.stoichiometry.elements.find(x=>x.symbol==='H'),O=unit.stoichiometry.elements.find(x=>x.symbol==='O');
  assert.deepEqual({count:H.count,countFractionPpm:H.countFractionPpm,atomicNumber:H.atomicNumber},{count:2,countFractionPpm:666667,atomicNumber:1});
  assert.deepEqual({count:O.count,countFractionPpm:O.countFractionPpm,atomicNumber:O.atomicNumber},{count:1,countFractionPpm:333333,atomicNumber:8});
  assert.equal(H.referenceMassContribution.lowerQ9,'2015680000');assert.equal(H.referenceMassContribution.upperQ9,'2016220000');
  assert.equal(O.referenceMassContribution.lowerQ9,'15999030000');assert.equal(O.referenceMassContribution.upperQ9,'15999770000');
  assert.equal(unit.stoichiometry.formulaReferenceMass.lowerQ9,unit.referenceMass.lowerQ9);assert.equal(unit.stoichiometry.formulaReferenceMass.upperQ9,unit.referenceMass.upperQ9);
}
assert.deepEqual(S.countShares({C:6,H:12,O:6}).map(x=>[x.symbol,x.count,x.countFractionPpm]),[['C',6,250000],['H',12,500000],['O',6,250000]]);
const session=P.createSession(source,{sampleIndex:4,microFeatures:8,molecularUnits:6,atoms:32});session.transitionTo('material');session.transitionTo('microstructure');const molecularState=session.transitionTo('molecular');
assert.equal(molecularState.current.stoichiometricReferenceContext.resolvedUnits,molecularState.current.unitCount);assert.equal(molecularState.current.units[0].stoichiometry.referenceMassClosure,true);assert.equal(molecularState.current.sourceEntityId,source.sourceEntityId);
const atomicState=session.transitionTo('atomic');assert.equal(atomicState.regime,'atomic');assert.equal(atomicState.current.sourceEntityId,source.sourceEntityId);assert.equal(session.reconcile().status,'PASS');
const unknown=M.source({sourceEntityId:'air-stoichiometry-unresolved-v11',kind:'ATMOSPHERE',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION'}),unknownMaterial=M.materialize(unknown),unknownMicro=Micro.sample(unknownMaterial,{maxFeatures:8}),unknownMolecular=Mol.represent(unknownMaterial,unknownMicro,{maxUnits:4});
assert.equal(unknownMolecular.unitCount,0);assert.equal(unknownMolecular.stoichiometricReferenceContext.resolvedUnits,0);assert.equal(unknownMolecular.stoichiometricReferenceContext.researchLineage.researchAuthorityPromoted,false);
assert.throws(()=>S.countShares({H:0}),/formula element count/);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 molecular stoichiometric reference',source:source.sourceEntityId,units:a.unitCount,waterAtoms:a.units[0].stoichiometry.totalAtomCount,countClosure:a.units[0].stoichiometry.countFractionClosurePpm,referenceMassClosure:a.units[0].stoichiometry.referenceMassClosure}));
