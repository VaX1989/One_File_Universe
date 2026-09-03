import fs from 'node:fs';
import assert from 'node:assert/strict';
import {conformanceFixture,findCanonicalTerrestrial,loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),P=O.p2,T=O.p4,E=O.p5EnvironmentV2,B=O.p6Biosphere,h=P.hex;
const real=findCanonicalTerrestrial(O),projection=E.environmentV2Projection(real.planet,real.topology),adapted=B.adaptEnvironment(projection),witness=B.eligibility(adapted);
const binding=B.bindings({masterSeed:real.masterSeed,canonicalUniverseIdentity:real.universeIdentity}),ids=B.idsForPlanet(binding,real.planet.planetId,{lineageOrdinal:2n,speciesOrdinal:3n});
const lineage=T.lineageId(real.universeIdentity,null,'p6-authority-adversarial'),baseline=B.canonicalBaseline(projection);

assert.equal(B.normativeSupportedVector,undefined);
assert.equal(B.macroFromSupported,undefined);
assert.equal(B.mesoRefine,undefined);
assert.equal(B.microRefine,undefined);
assert.equal(fs.readFileSync('src/domains/biosphere/p6-canonical.js','utf8').includes('P6_CONFORMANCE_ONLY'),false);

const conformance=conformanceFixture(B,binding,real.planet.planetId);
assert.equal(B.assertLod(conformance.macro,conformance.meso,conformance.micro),true);
assert.throws(()=>B.renderingProjection(conformance.macro),/canonical eligibility witness/);
assert.equal(B.renderingProjection(witness).biologyEstablished,false);
assert.equal(B.renderingProjection(witness).state,B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.throws(()=>B.createGenesisPayload({canonicalUniverseIdentity:real.universeIdentity,environmentProjection:projection}),/does not authorize/);

const bundle=B.genesisEvidenceBundle(projection);
const validNegativePayload={biosphereId:ids.biosphereId,planetId:real.planet.planetId,environmentProjection:projection,environmentDigest:bundle.environmentDigest,eligibilityWitness:bundle.eligibilityWitness,modelVersion:B.VERSION,manifestHash:B.manifestHash(),identityPolicy:B.IDENTITY_POLICY};
function eventFor(payload,type='p6.biosphere.genesis',target=payload.biosphereId){return T.canonicalEvent({universeIdentity:real.universeIdentity,lineageId:lineage,time:{seconds:1n,micros:0n},type,version:1n,operationKey:type,targets:[target],payload,causes:[],preconditionStateDigest:null})}
function rejected(payload,pattern,customBaseline=baseline){assert.throws(()=>T.replay({universeIdentity:real.universeIdentity,lineage,baseline:customBaseline,events:[eventFor(payload)],transition:B.TRANSITION_CONTRACT}),pattern)}

rejected(validNegativePayload,/does not authorize biosphere genesis/);
const bareLabel={biosphereId:ids.biosphereId,planetId:real.planet.planetId,environmentState:B.STATES.BIOSPHERE_SUPPORTED,modelVersion:B.VERSION,manifestHash:B.manifestHash(),identityPolicy:B.IDENTITY_POLICY};
rejected(bareLabel,/payload fields invalid/);
for(const [name,value,pattern] of [
  ['contractId','wrong-contract',/contract\/version\/model\/authority/],
  ['version',3n,/contract\/version\/model\/authority/],
  ['modelVersion','wrong-model',/contract\/version\/model\/authority/],
  ['authority','P6_FAKE',/contract\/version\/model\/authority/]
])rejected({...validNegativePayload,environmentProjection:{...projection,[name]:value}},pattern);

const wrongPlanet=new Uint8Array(real.planet.planetId);wrongPlanet[0]^=1;
rejected({...validNegativePayload,planetId:wrongPlanet},/genesis planet mismatch/);
const wrongManifest=new Uint8Array(projection.semanticManifestHash);wrongManifest[0]^=1;
rejected({...validNegativePayload,environmentProjection:{...projection,semanticManifestHash:wrongManifest}},/semantic manifest mismatch/);
const alteredInsolation={...projection.radiativeTier0,insolation:{...projection.radiativeTier0.insolation,valuePpm:projection.radiativeTier0.insolation.valuePpm+1n}};
rejected({...validNegativePayload,environmentProjection:{...projection,radiativeTier0:alteredInsolation}},/environment witness digest mismatch/);
const forgedEligibilityDigest=new Uint8Array(witness.witnessDigest);forgedEligibilityDigest[0]^=1;
rejected({...validNegativePayload,eligibilityWitness:{...witness,witnessDigest:forgedEligibilityDigest}},/eligibility witness mismatch/);
rejected({...validNegativePayload,eligibilityWitness:{...witness,state:B.STATES.BIOSPHERE_SUPPORTED,canGenerateBiosphere:true}},/cannot authorize BIOSPHERE_SUPPORTED/);
rejected(validNegativePayload,/not bound to P4 baseline/,{...baseline,p5EnvironmentDigest:new Uint8Array(32)});

const forgedBiosphere=new Uint8Array(ids.biosphereId);forgedBiosphere[0]^=1;
rejected({...validNegativePayload,biosphereId:forgedBiosphere},/forged biosphereId/);
assert.equal(h(B.assertBiosphereId(real.universeIdentity,real.planet.planetId,ids.biosphereId)),h(ids.biosphereId));
assert.equal(h(B.assertLineageId(real.universeIdentity,ids.biosphereId,2n,ids.lineageId)),h(ids.lineageId));
assert.equal(h(B.assertSpeciesId(real.universeIdentity,ids.lineageId,3n,ids.speciesId)),h(ids.speciesId));
const forgedLineage=new Uint8Array(ids.lineageId);forgedLineage[0]^=1;
const forgedSpecies=new Uint8Array(ids.speciesId);forgedSpecies[0]^=1;
assert.throws(()=>B.assertLineageId(real.universeIdentity,ids.biosphereId,2n,forgedLineage),/forged lineageId/);
assert.throws(()=>B.assertSpeciesId(real.universeIdentity,ids.lineageId,3n,forgedSpecies),/forged speciesId/);
assert.throws(()=>B.idsForPlanet(binding,real.planet.planetId,{lineageOrdinal:-1n}),/lineageOrdinal/);

const otherPlanet=new Uint8Array(real.planet.planetId);otherPlanet[31]^=1;
const otherIds=B.idsForPlanet(binding,otherPlanet,{lineageOrdinal:2n,speciesOrdinal:3n});
assert.notEqual(h(otherIds.biosphereId),h(ids.biosphereId));
assert.notEqual(h(otherIds.lineageId),h(ids.lineageId));
assert.notEqual(h(otherIds.speciesId),h(ids.speciesId));
const hypotheticalManifest={...B.MANIFEST,generatorSuiteVersion:2n,genesis:{...B.MANIFEST.genesis,modelVersion:'p6-biosphere-evolution-2'}};
P.validateSemanticManifest(hypotheticalManifest);
assert.notEqual(h(P.semanticManifestHash(hypotheticalManifest)),h(B.manifestHash()));
assert.equal(h(P.entityIdentity(real.universeIdentity,'p6.biosphere',{planetId:real.planet.planetId,identityPolicy:B.IDENTITY_POLICY})),h(ids.biosphereId));

for(const [type,payload,target] of [
  ['p6.speciation',{speciesId:ids.speciesId,lineageId:ids.lineageId,biosphereId:ids.biosphereId},ids.speciesId],
  ['p6.speciation',{speciesId:forgedSpecies,lineageId:ids.lineageId,biosphereId:ids.biosphereId},forgedSpecies],
  ['p6.speciation',{speciesId:ids.speciesId,lineageId:otherIds.lineageId,biosphereId:ids.biosphereId},ids.speciesId],
  ['p6.extinction',{speciesId:ids.speciesId},ids.speciesId]
])assert.throws(()=>T.replay({universeIdentity:real.universeIdentity,lineage,baseline,events:[eventFor(payload,type,target)],transition:B.TRANSITION_CONTRACT}),/unsupported event type\/version/);

const empty=T.replay({universeIdentity:real.universeIdentity,lineage,baseline,events:[],transition:B.TRANSITION_CONTRACT});
assert.deepEqual(Object.keys(empty.state.entities),[]);
const archive=T.exportArchive({universeIdentity:real.universeIdentity,lineage,baseline,events:[eventFor({...conformance.macro},'p6.biosphere.genesis',ids.biosphereId)],transition:B.TRANSITION_CONTRACT});
const imported=T.importArchive(archive,{transition:B.TRANSITION_CONTRACT});
assert.throws(()=>T.replayLiveWorld(imported,B.TRANSITION_CONTRACT));
console.log('P6 authority, witness and biological identity adversarial tests: PASS');
