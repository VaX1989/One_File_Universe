import assert from 'node:assert/strict';
import { createMaterializationCache } from '../../src/experiments/spatial-continuum/materialization-cache.js';
import { GENERATOR_VERSION, REPRESENTATION_VERSION, SCIENTIFIC_MODEL_VERSION, deriveChildSeed, deriveSeedLineage, entityProvenance, hashGenerativeState, representationStateHash, rootSeed, scientificStateHash, sha256Hex, stableGenerativeString } from '../../src/experiments/spatial-continuum/generative-contract.js';

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
