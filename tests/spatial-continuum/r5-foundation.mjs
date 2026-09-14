import assert from 'node:assert/strict';
import { createMaterializationCache } from '../../src/experiments/spatial-continuum/materialization-cache.js';
import { GENERATOR_VERSION, REPRESENTATION_VERSION, SCIENTIFIC_MODEL_VERSION, deriveChildSeed, deriveSeedLineage, entityProvenance, hashGenerativeState, representationStateHash, rootSeed, scientificStateHash, sha256Hex, stableGenerativeString } from '../../src/experiments/spatial-continuum/generative-contract.js';
import { createWorldScientificState } from '../../src/experiments/spatial-continuum/scientific-state.js';

assert.equal(sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
assert.equal(stableGenerativeString({b:2,a:1n}),stableGenerativeString({a:1n,b:2}));
const universeSeed=rootSeed({masterSeed:Uint8Array.from({length:32},(_,index)=>index),universeId:'universe-a'}),addresses=Array.from({length:4096},(_,index)=>`galaxy:${Math.floor(index/64)}/system:${index}`),forward=addresses.map(canonicalAddress=>deriveChildSeed({parentSeed:universeSeed,canonicalAddress,domainTag:'system'})),reverse=[...addresses].reverse().map(canonicalAddress=>deriveChildSeed({parentSeed:universeSeed,canonicalAddress,domainTag:'system'})).reverse();
assert.deepEqual(forward,reverse,'child derivation must not depend on materialization order');
assert.equal(new Set(forward).size,addresses.length,'the bounded seed collision audit must find no collisions');
assert.notEqual(deriveChildSeed({parentSeed:universeSeed,canonicalAddress:addresses[0],domainTag:'science'}),deriveChildSeed({parentSeed:universeSeed,canonicalAddress:addresses[0],domainTag:'presentation'}),'domain separation must produce independent streams');
assert.notEqual(deriveChildSeed({parentSeed:universeSeed,canonicalAddress:addresses[0],domainTag:'science'}),deriveChildSeed({parentSeed:universeSeed,canonicalAddress:addresses[0],domainTag:'science',generatorVersion:'future-version'}),'generator-version changes must not silently preserve the same stream');
const lineage=deriveSeedLineage({root:universeSeed,segments:[{kind:'galaxy',id:'g'},{kind:'system',id:'s'},{kind:'planet',id:'p'}]});assert.equal(lineage.length,3);assert.equal(lineage[1].parentSeed,lineage[0].seed);
const scientific={planetId:'p',massMilliEarth:'2000',bulkPriorClass:'TERRESTRIAL'},scienceHash=scientificStateHash(scientific),alternatePresentation=representationStateHash({scientificHash:scienceHash,representationState:{palette:'amber'}}),otherPresentation=representationStateHash({scientificHash:scienceHash,representationState:{palette:'blue'}});assert.notEqual(alternatePresentation,otherPresentation);assert.equal(scienceHash,scientificStateHash(scientific),'representation changes must not affect scientific state identity');
const provenance=entityProvenance({canonicalId:'p',canonicalAddress:'u/g/s/p',parentId:'s',parentSeed:universeSeed,domainTag:'planet',scientificInputs:scientific,representationInputs:{palette:'amber'}});assert.equal(provenance.versions.generator,GENERATOR_VERSION);assert.equal(provenance.versions.scientificModel,SCIENTIFIC_MODEL_VERSION);assert.equal(provenance.versions.representation,REPRESENTATION_VERSION);assert.equal(provenance.orderIndependent,true);assert.equal(provenance.scientificInputHash,scienceHash);assert.equal(hashGenerativeState('revisit',JSON.parse(JSON.stringify(provenance))),hashGenerativeState('revisit',JSON.parse(JSON.stringify(provenance))));
const modelRuntime={ctx:{masterSeed:Uint8Array.from({length:32},(_,index)=>index)},universe:{universeId:'u'}},modelSystem={entityId:'s',metadata:{facts:{baselineAgeMyr:4500n,baselineMetallicityMilliDex:12n,baselinePrimaryMassMilliSolar:1000n,protoplanetarySolidBudgetPermille:800n,planetCount:4n,planetArchitecture:'ORDERED'}}},modelBody={entityId:'p',canonicalId:'p',canonicalKey:{galaxyX:1n,galaxyY:2n,galaxyZ:3n,sectorX:4n,sectorY:5n,sectorZ:6n,siteX:7n,siteY:8n,siteZ:9n,orbitSlot:2n},metadata:{facts:{bulkPriorClass:'TERRESTRIAL',baselineMassMilliEarth:2000n,baselineSemiMajorAxisMicroAu:900000n,baselineEccentricityPpm:20000n,baselineInclinationMilliDeg:300n,baselineInsolationPpm:1200000n,moonCount:1n}}},physicalPlanet={physical:{meanRadiusM:7100000n,surfaceGravityMicroMs2:11200000n,meanDensityKgM3:5600n,composition:{model:'TEST',coreMassFractionPermille:280n,coreFractionPpm:280000n,mantleFractionPpm:720000n}}},point={locationIdentity:'surface-p',latMicroDeg:123n,lonMicroDeg:456n},sample={entityId:'sample-p',kind:'ROCK'},source={phase:'SOLID',structure:'POLYCRYSTALLINE',chemistryAuthority:'MODEL_DERIVED_PLAUSIBLE_CHEMISTRY',components:[{id:'silicate'}]},worldState=createWorldScientificState({runtime:modelRuntime,system:modelSystem,body:modelBody,physical:physicalPlanet,point,sample,source}),worldRevisit=createWorldScientificState({runtime:modelRuntime,system:modelSystem,body:modelBody,physical:physicalPlanet,point,sample,source}),largerWorld=createWorldScientificState({runtime:modelRuntime,system:modelSystem,body:{...modelBody,entityId:'p2',canonicalId:'p2',canonicalKey:{...modelBody.canonicalKey,orbitSlot:3n},metadata:{facts:{...modelBody.metadata.facts,baselineMassMilliEarth:7000n}}},physical:{physical:{...physicalPlanet.physical,meanRadiusM:9600000n,surfaceGravityMicroMs2:18400000n}},point:{...point,locationIdentity:'surface-p2'},sample:{...sample,entityId:'sample-p2'},source});assert.deepEqual(worldState,worldRevisit,'the same scientific address must reconstruct byte-equivalent generative state');assert.notEqual(worldState.scientificHashes.planet,largerWorld.scientificHashes.planet);assert.notDeepEqual(worldState.presentation.terrain,largerWorld.presentation.terrain,'planet-conditioned terrain must react to physical state');assert.equal(worldState.causalTrace.scientificClaimsAdded,false);assert.ok(worldState.causalTrace.unknown.includes('exact molecular arrangement'));

const disposed=[];
const cache=createMaterializationCache({maxEntries:2,onDispose:(value,context)=>{disposed.push({...context,id:value.id});return value.dispose()}});
const context=id=>({id,dispose:()=>({disposed:true,resources:1,sessions:id==='active'?1:0,representations:2})});
cache.materialize('world:active',()=>context('active'),{kind:'WORLD',pin:true});
cache.materialize('world:old',()=>context('old'),{kind:'WORLD'});
cache.setPinned(['world:active']);
cache.materialize('world:new',()=>context('new'),{kind:'WORLD'});

assert.equal(cache.has('world:active'),true,'the active world must survive cache pressure');
assert.equal(cache.has('world:old'),false,'the least-recent inactive world must be evicted');
assert.equal(disposed.length,1);
assert.deepEqual(disposed[0],{key:'world:old',kind:'WORLD',reason:'LRU_EVICTION',id:'old'});
let snapshot=cache.snapshot();
assert.deepEqual(snapshot.pinned,['world:active']);
assert.equal(snapshot.metrics.evictions,1);
assert.equal(snapshot.metrics.disposalCallbacks,1);
assert.equal(snapshot.metrics.disposedResources,1);
assert.equal(snapshot.metrics.disposedSessions,0);
assert.equal(snapshot.metrics.releasedRepresentations,2);
assert.equal(snapshot.disposalHistory[0].reason,'LRU_EVICTION');

cache.clear();
snapshot=cache.snapshot();
assert.equal(snapshot.size,0);
assert.equal(snapshot.metrics.disposals,3);
assert.equal(snapshot.metrics.disposalCallbacks,3);
assert.equal(snapshot.metrics.disposedSessions,1);
assert.equal(snapshot.metrics.releasedRepresentations,6);

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r5-foundation',generatorVersion:GENERATOR_VERSION,scientificModelVersion:SCIENTIFIC_MODEL_VERSION,representationVersion:REPRESENTATION_VERSION,seedContract:'HASH(generatorVersion,parentSeed,canonicalAddress,domainTag)',orderIndependent:true,collisionAudit:{sampleSize:addresses.length,collisions:addresses.length-new Set(forward).size},cache:snapshot.metrics},null,2));
