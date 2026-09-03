import fs from 'node:fs';
import assert from 'node:assert/strict';
import {conformanceFixture,loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),P=O.p2,B=O.p6Biosphere,T=O.p4,h=P.hex,golden=JSON.parse(fs.readFileSync('tests/p6/golden-p6-biosphere-v1.json','utf8'));
assert.equal(golden.corpusId,'golden-p6-biosphere-v1');
assert.equal(golden.authority,'P6_CONFORMANCE_ONLY');
assert.equal(h(O.sha256.digest(P.encode(golden.vectors))),golden.corpusDigest);

const seed=Uint8Array.from({length:32},(_,index)=>index+1),universeIdentity=Uint8Array.from({length:32},(_,index)=>255-index),planetId=Uint8Array.from({length:32},(_,index)=>(index*3)&255);
const binding=B.bindings({masterSeed:seed,canonicalUniverseIdentity:universeIdentity}),fixture=conformanceFixture(B,binding,planetId),vectors=golden.vectors;
assert.equal(h(B.manifestHash()),vectors.manifestHash);
assert.equal(h(fixture.ids.biosphereId),vectors.biosphereId);
assert.equal(h(fixture.ids.lineageId),vectors.lineageId);
assert.equal(h(fixture.ids.speciesId),vectors.speciesId);
assert.equal(fixture.budget.primaryProductivityCeilingU.toString(),vectors.primaryProductivityCeilingU);
assert.equal(fixture.budget.sustainableBiomassCeilingU.toString(),vectors.sustainableBiomassCeilingU);
assert.equal(B.transferCeilings(fixture.budget.primaryProductivityCeilingU,[100000n])[1].energyCeilingU.toString(),vectors.trophic100kLevel1U);
assert.equal(B.ELIGIBILITY_CONTRACT,vectors.eligibilityContract);
assert.equal(B.IDENTITY_POLICY,vectors.identityPolicy);
assert.equal(B.NUMERIC_CONTRACT,vectors.numericContract);
assert.equal(B.TRANSITION_ID+'@'+B.TRANSITION_VERSION,vectors.transitionContract);
assert.equal(B.TRANSITION_SCOPE,vectors.transitionScope);
assert.equal(h(T.transitionContractDigest(B.TRANSITION_CONTRACT.descriptor)),vectors.transitionDigest);
assert.equal(vectors.canonicalGenesisAvailable,false);
assert.equal(vectors.persistentLineageTransitions,false);
assert.throws(()=>B.renderingProjection(fixture.macro),/canonical eligibility witness/);
console.log('P6 Golden corpus v1: PASS',golden.corpusDigest);
