import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadComponents} from '../../../tools/extensions/components.mjs';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/materials/material-model.js','src/domains/v1/materials/reference-properties.js',
  'src/domains/v1/micro/microstructure.js','src/domains/v1/molecular/representative.js',
  'src/domains/v1/molecular/reference-mass.js','src/domains/v1/molecular/stoichiometric-reference.js',
  'src/domains/v1/molecular/electronic-reference.js','src/domains/v1/atomic/representative.js',
  'src/domains/v1/micro/pipeline.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const M=OFU.v1Materials,E=OFU.v1MolecularElectronicReference,P=OFU.v1MicroPipeline;
const water=M.source({sourceEntityId:'water-electronic-v11',parentEntityId:'location-v11',kind:'WATER',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION'});
function molecular(session){session.transitionTo('material');session.transitionTo('microstructure');return session.transitionTo('molecular').current;}
const waterSession=P.createSession(water,{sampleIndex:7,microFeatures:8,molecularUnits:6,atoms:32}),waterMolecular=molecular(waterSession);
assert.equal(waterMolecular.electronicReferenceContext.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(waterMolecular.electronicReferenceContext.resolvedUnits,waterMolecular.unitCount);assert.equal(waterMolecular.electronicReferenceContext.neutralReferenceOnly,true);assert.equal(waterMolecular.electronicReferenceContext.actualChargeStateAuthority,'UNKNOWN');assert.equal(waterMolecular.electronicReferenceContext.actualElectronCountClaim,false);assert.equal(waterMolecular.electronicReferenceContext.molecularOrbitalClaim,false);assert.equal(waterMolecular.electronicReferenceContext.wavefunctionClaim,false);assert.equal(waterMolecular.electronicReferenceContext.quantumDynamicsClaim,false);
for(const unit of waterMolecular.units){const r=unit.electronicReference;assert.equal(r.supported,true);assert.equal(r.formula,'H2O');assert.equal(r.formulaAtomCount,3);assert.equal(r.formulaNuclearChargeNumber,10);assert.equal(r.neutralElectronReferenceCount,10);assert.equal(r.actualElectronCount,null);assert.equal(r.actualChargeState,'UNKNOWN');assert.equal(r.chargeStateKnown,false);assert.equal(r.neutralityAssumption,true);assert.equal(r.nuclearChargeClosure,true);assert.equal(r.canonicalPromotion,false);assert.deepEqual(r.elements.map(x=>[x.symbol,x.count,x.atomicNumber,x.nuclearChargeContribution]),[['H',2,1,2],['O',1,8,8]]);}
const replay=molecular(P.createSession(water,{sampleIndex:7,microFeatures:8,molecularUnits:6,atoms:32}));assert.deepEqual(replay,waterMolecular);
const salt=M.source({sourceEntityId:'halite-electronic-v11',kind:'MINERAL',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION',components:[{id:'HALITE',ppm:1000000,formula:'NaCl'}]}),saltMolecular=molecular(P.createSession(salt,{sampleIndex:2,microFeatures:8,molecularUnits:4,atoms:32}));assert.ok(saltMolecular.units.length>0);assert.equal(saltMolecular.units[0].electronicReference.formulaNuclearChargeNumber,28);assert.equal(saltMolecular.units[0].electronicReference.neutralElectronReferenceCount,28);assert.equal(saltMolecular.units[0].electronicReference.actualElectronCount,null);
const unresolved=M.source({sourceEntityId:'air-electronic-unresolved-v11',kind:'ATMOSPHERE',provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION'}),unresolvedMolecular=molecular(P.createSession(unresolved,{microFeatures:8,molecularUnits:4,atoms:16}));assert.equal(unresolvedMolecular.unitCount,0);assert.equal(unresolvedMolecular.electronicReferenceContext.resolvedUnits,0);const unsupported=E.referenceForUnit({stoichiometry:{supported:false}});assert.equal(unsupported.supported,false);assert.equal(unsupported.reason,'STOICHIOMETRY_UNRESOLVED');assert.equal(unsupported.actualElectronCount,null);
assert.throws(()=>E.referenceForUnit({formula:'X',stoichiometry:{supported:true,totalAtomCount:1,elements:[{symbol:'X',count:1,atomicNumber:0}]}}),/atomic number/);
const ids=loadComponents().map(x=>x.id),electronicIndex=ids.indexOf('v1.micro.molecular-electronic-reference'),pipelineIndex=ids.indexOf('v1.micro.pipeline');assert.ok(electronicIndex>=0&&pipelineIndex>electronicIndex,'electronic reference must load before shipping micro pipeline');
const atomicState=waterSession.transitionTo('atomic');assert.equal(atomicState.current.sourceEntityId,water.sourceEntityId);assert.equal(waterSession.reconcile().status,'PASS');
console.log(JSON.stringify({status:'PASS',suite:'v1.1 molecular electronic reference',waterNuclearCharge:waterMolecular.units[0].electronicReference.formulaNuclearChargeNumber,haliteNuclearCharge:saltMolecular.units[0].electronicReference.formulaNuclearChargeNumber,pipelineConsumes:true,quantumDynamicsClaim:false}));
