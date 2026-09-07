import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
globalThis.OFU={};
for(const f of [
 'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js','src/domains/v1/microscopic.js',
 'src/domains/v1/materials/material-model.js','src/domains/v1/materials/reference-properties.js','src/domains/v1/micro/source-adapters.js','src/domains/v1/micro/microstructure.js',
 'src/domains/v1/molecular/representative.js','src/domains/v1/molecular/reference-mass.js','src/domains/v1/molecular/stoichiometric-reference.js','src/domains/v1/molecular/electronic-reference.js',
 'src/domains/v1/atomic/representative.js','src/domains/v1/micro/pipeline.js','src/domains/v1/micro/matter-continuity-v2.js','src/rendering/microscopic/matter-continuity-provider.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const O=globalThis.OFU,C=O.v2x12MatterContinuity,M=O.v1Materials,R=O.v1MaterialReference,Render=O.v2x12MicroscopicPresentation;
let cases=0;const ok=(x,m)=>{assert.ok(x,m);cases++;};
assert.throws(()=>C.sourceRecord({sourceId:'bad',dataset:'fixture',version:'1',licenseId:'UNKNOWN',method:'XRD',accessedOn:'2026-09-07',citation:'fixture',authorityClass:'SOURCE_BACKED_EXPERIMENTAL_STRUCTURE'}),/license|source-backed/i);cases++;
const source=C.sourceRecord({sourceId:'fixture-quartz-structure',dataset:'V2X-12 conformance fixture',version:'1',licenseId:'CC0-1.0',method:'DECLARED_EXPERIMENTAL_STRUCTURE_FIXTURE',accessedOn:'2026-09-07',citation:'Repository-local conformance fixture; not bundled external scientific data.',authorityClass:'SOURCE_BACKED_EXPERIMENTAL_STRUCTURE',bundledData:false});
ok(source.provenanceDigest.length===64,'provenance digest');
const quartzSource=M.source({sourceEntityId:'v2x12-quartz',kind:'MINERAL',provider:'v2x12-test',components:[{id:'SILICA',ppm:1000000,formula:'SiO2'}],latticeMotif:'SILICA_NETWORK'}),quartz=M.materialize(quartzSource),profile=R.profile(quartz),silica=profile.components.find(c=>c.componentId==='SILICA');
assert.equal(profile.reference.sourceId,'CIAAW-SAW-2024');assert.equal(silica.referenceMass.lowerQ9,'60082060000');assert.equal(silica.referenceMass.upperQ9,'60085540000');cases+=3;
const failClosed=C.journey(quartzSource);assert.equal(failClosed.continuity.status,'FAIL_CLOSED');assert.equal(C.reconcile(failClosed).status,'FAIL');cases+=2;
assert.throws(()=>C.mixtureDescriptor(quartz,{basis:'MATERIAL_COMPONENT_PPM',entries:[{id:'SILICA',fractionPpm:1000000}]}),/mixture|ppm/i);cases++;
assert.throws(()=>C.mixtureDescriptor(quartz,{basis:'SOURCE_DECLARED_MOLE_FRACTION_PPM',authority:'SOURCE_BACKED',entries:[{id:'SILICA',fractionPpm:1000000}]}),/provenance|source-backed/i);cases++;
const mixture={basis:'SOURCE_DECLARED_MOLE_FRACTION_PPM',authority:'SOURCE_BACKED',sourceRecord:source,entries:[{id:'SILICA',fractionPpm:900000,formula:'SiO2'}]};
assert.throws(()=>C.reactionNetworkDescriptor({authority:'MODEL_DERIVED_SIMULATION',species:['A','B'],reactions:[{id:'bad-rate',reactants:[{speciesId:'A',coefficient:1}],products:[{speciesId:'B',coefficient:1}],rateConstant:42}]}),/kinetics|thermodynamics/i);cases++;
const reactions={authority:'MODEL_DERIVED_SIMULATION',species:['A','B'],reactions:[{id:'topology-only',reactants:[{speciesId:'A',coefficient:1}],products:[{speciesId:'B',coefficient:1}],reversible:true}]};
const atomicStructure={sourceEntityId:'v2x12-quartz',sourceRecord:source,coordinateFrame:'cartesian-structure-frame',inputUnit:'angstrom',roundingPolicy:'CALLER_NORMALIZED_TO_INTEGER_FM_HALF_EVEN',transform:'IDENTITY_DECLARED',sites:[{siteId:'Si1',element:'Si',positionFm:[0,0,0],occupancyPpm:1000000},{siteId:'O1',element:'O',positionFm:[160000,0,0],occupancyPpm:1000000}]};
assert.throws(()=>C.atomicStructureRecord({...atomicStructure,sites:[{element:'Si',positionFm:[0.5,0,0]}]}),/positionFm|integer/i);cases++;
const journey=C.journey(quartzSource,{materialSourceRecord:source,microstructure:{authority:'SOURCE_BACKED',sourceRecord:source,phases:[{id:'QUARTZ_PHASE',fractionPpm:1000000,phaseClass:'CRYSTALLINE'}],defects:[],interfaces:[]},mixture,reactionNetwork:reactions,bonding:{authority:'MODEL_DERIVED_SIMULATION',descriptors:[{componentId:'SILICA',geometryClass:'NETWORK',coordinationClass:'TETRAHEDRAL',bonds:[{a:'Si','b':'O',bondClass:'NETWORK'}]}]},atomicStructure});
assert.equal(C.reconcile(journey).status,'PASS');assert.equal(journey.mixture.derivedFromMaterialComponentPpm,false);assert.equal(journey.mixture.unresolvedFractionPpm,100000);assert.equal(journey.reactionNetwork.kinetics,'NOT_SIMULATED');assert.equal(journey.reactionNetwork.thermodynamics,'NOT_SOLVED');assert.equal(journey.atomicSourceStructure.coordinateAuthority,'SOURCE_BACKED_ATOMIC_COORDINATE');assert.equal(journey.atomicSourceStructure.sourceCoordinatesPreservedAsIntegerFm,true);assert.equal(journey.quantumBoundary.classicalElectronOrbitClaim,false);assert.equal(journey.quantumBoundary.wavefunctionClaim,false);assert.equal(journey.quantumBoundary.quantumDynamicsClaim,false);cases+=10;
const view=Render.present(journey,{regime:'ATOMIC',maxNodes:32});assert.equal(view.nodeCount,2);assert.equal(view.authority,'PRESENTATION_ONLY');assert.equal(view.resourceWitness.measuredGpuEvidence,false);assert.equal(Render.providerDescriptor().sharedCameraAuthority,false);assert.equal(Render.providerDescriptor().sharedScaleAuthority,false);cases+=5;
console.log(JSON.stringify({status:'PASS',suite:'v2x12-authority-provenance',cases}));
