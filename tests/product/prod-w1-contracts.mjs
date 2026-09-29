import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  W1_AUTHORITY,W1_CONTRACTS,W1_FINGERPRINT_STATUS,W1_OBSERVATION_KIND,W1_MAX_SERIALIZED_BYTES,
  createCanonicalEntityRef,createP4StateRef,createReturnRef,createScientificFingerprint,
  createScientificFingerprintRef,createSavedObservation,parseW1Contract,serializeW1Contract
} from '../../src/product/contracts/w1-observation-contracts.js';

const h=n=>n.toString(16).padStart(64,'0');
const subjectA=createCanonicalEntityRef({
  universeId:'ofu:test-universe',entityKind:'Planet',canonicalId:h(1),
  canonicalKey:{siteZ:0n,galaxyX:48n,orbitSlot:0n,siteX:61n,siteY:0n,sectorZ:0n,galaxyZ:-1n,sectorX:0n,galaxyY:-50n,sectorY:0n}
});
const subjectB=createCanonicalEntityRef({
  universeId:'ofu:test-universe',entityKind:'PLANET',canonicalId:h(1),
  canonicalKey:{galaxyY:'-50',orbitSlot:'0',galaxyZ:'-1',galaxyX:'48',siteX:'61',siteY:'0',siteZ:'0',sectorX:'0',sectorY:'0',sectorZ:'0'}
});
assert.equal(serializeW1Contract(subjectA),serializeW1Contract(subjectB),'canonical key order/BigInt transport must be stable');
assert.equal(subjectA.entityKind,'PLANET');
assert.equal(subjectA.canonicalKey.galaxyY,'-50');

const temporal=createP4StateRef({
  universeIdentity:h(2),lineageId:h(3),stateDigest:h(4),checkpointId:h(5),
  frontier:{eventId:h(6),seconds:123n,micros:456789n}
});
assert.equal(temporal.protocol,'ofu-p4-temporal-v1');
assert.equal(temporal.frontier.seconds,'123');
assert.throws(()=>createP4StateRef({universeIdentity:h(2),lineageId:h(3),stateDigest:h(4),frontier:{eventId:h(6),seconds:0,micros:1000000}}),/micros out of range/);
assert.throws(()=>createP4StateRef({universeIdentity:h(2),lineageId:h(3),stateDigest:h(4),frontier:{eventId:h(6),seconds:(1n<<64n),micros:0}}),/exceeds u64 range/);

const fingerprint=createScientificFingerprint({
  subject:subjectA,status:W1_FINGERPRINT_STATUS.PRESENT,
  scientificStateContract:'ofu-r6-world-scientific-state-1',
  scientificModelVersion:'p3-astronomy-1+p5-planet-physical-1+ofu-v1-planetology-causal-1',
  generatorVersion:'ofu-spatial-continuum-generator-r6-1',
  scientificHashes:{planet:h(10),context:h(11),surface:null,sample:null},
  authorityByDomain:{surface:W1_AUTHORITY.UNKNOWN,identity:W1_AUTHORITY.CANONICAL,environment:W1_AUTHORITY.MODEL_DERIVED,astronomy:W1_AUTHORITY.CANONICAL,physicalPlanet:W1_AUTHORITY.MODEL_DERIVED,sample:W1_AUTHORITY.UNKNOWN},
  limitations:['exact local mineralogy unavailable','surface context not sampled']
});
assert.equal(fingerprint.authorityByDomain.identity,W1_AUTHORITY.CANONICAL);
assert.equal(fingerprint.authorityByDomain.environment,W1_AUTHORITY.MODEL_DERIVED);
assert.equal(fingerprint.authorityByDomain.surface,W1_AUTHORITY.UNKNOWN);
assert.equal(fingerprint.scientificHashes.context,h(11));
assert.ok(!('representationVersion' in fingerprint),'presentation version must not enter scientific fingerprint v1');

const unknown=createScientificFingerprint({
  subject:subjectA,status:W1_FINGERPRINT_STATUS.UNKNOWN,
  scientificStateContract:'ofu-r6-world-scientific-state-1',scientificModelVersion:null,generatorVersion:null,
  scientificHashes:{planet:null,context:null,surface:null,sample:null},
  authorityByDomain:{identity:W1_AUTHORITY.CANONICAL,environment:W1_AUTHORITY.UNKNOWN},
  limitations:['scientific context unavailable']
});
assert.equal(unknown.status,'UNKNOWN');
assert.throws(()=>createScientificFingerprint({...unknown,scientificHashes:{planet:null,context:h(12),surface:null,sample:null}}),/UNKNOWN fingerprint must not assert scientific hashes/);

const fpRef=createScientificFingerprintRef({subjectCanonicalId:subjectA.canonicalId,contextHash:fingerprint.scientificHashes.context,scientificStateContract:fingerprint.scientificStateContract,scientificModelVersion:fingerprint.scientificModelVersion});
const returnRef=createReturnRef({semanticScale:'approach',distanceIntentRadii:1.35});
assert.equal(returnRef.authority,W1_AUTHORITY.PRESENTATION_ONLY);
assert.ok(!('camera' in returnRef));
assert.ok(!('activeSceneProvider' in returnRef));

const saved=createSavedObservation({kind:W1_OBSERVATION_KIND.SNAPSHOT,subject:subjectA,temporalRef:temporal,scientificFingerprintRef:fpRef,returnRef,label:'Reference world'});
const savedText=serializeW1Contract(saved),roundTrip=parseW1Contract(savedText);
assert.deepEqual(roundTrip,saved,'saved observation must round-trip canonically');
assert.equal(savedText,serializeW1Contract(roundTrip),'saved observation serialization must be byte-stable');
assert.equal(saved.temporalRef.contract,W1_CONTRACTS.P4_STATE_REF,'snapshot authority must be a P4 reference, not copied mutable state');
assert.throws(()=>createSavedObservation({kind:W1_OBSERVATION_KIND.SNAPSHOT,subject:subjectA}),/requires a P4 temporalRef/);
const wrongFpRef=createScientificFingerprintRef({subjectCanonicalId:h(99),contextHash:fingerprint.scientificHashes.context,scientificStateContract:fingerprint.scientificStateContract,scientificModelVersion:fingerprint.scientificModelVersion});
assert.throws(()=>createSavedObservation({subject:subjectA,scientificFingerprintRef:wrongFpRef}),/subject mismatch/);

const future=JSON.parse(savedText);future.schemaVersion=2;assert.throws(()=>parseW1Contract(JSON.stringify(future)),/unsupported saved observation schema version/);
const extra=JSON.parse(savedText);extra.rendererObjectId='mesh-42';assert.throws(()=>parseW1Contract(JSON.stringify(extra)),/unsupported fields/);
const authorityDrift=JSON.parse(serializeW1Contract(returnRef));authorityDrift.authority='CANONICAL';assert.throws(()=>parseW1Contract(JSON.stringify(authorityDrift)),/return ref authority must remain PRESENTATION_ONLY/);
const presentationLeak=JSON.parse(serializeW1Contract(fingerprint));presentationLeak.representationVersion='r6-3';assert.throws(()=>parseW1Contract(JSON.stringify(presentationLeak)),/unsupported fields/);
assert.throws(()=>parseW1Contract('{bad'),/malformed JSON/);
assert.throws(()=>parseW1Contract(' '.repeat(W1_MAX_SERIALIZED_BYTES+1)),/exceeds byte limit/);
assert.throws(()=>parseW1Contract(' '+savedText),/not canonical/);
assert.throws(()=>createCanonicalEntityRef({universeId:'u',entityKind:'planet',canonicalId:'bad',canonicalKey:{orbitSlot:0}}),/32-byte hex digest/);
assert.throws(()=>createReturnRef({semanticScale:'approach',distanceIntentRadii:Infinity}),/positive finite/);

const analysisFingerprint=createScientificFingerprint({
  subject:subjectA,status:'PRESENT',scientificStateContract:'ofu-r6-world-scientific-state-1',scientificModelVersion:'model-1',
  scientificHashes:{planet:null,context:h(20),surface:null,sample:null},
  authorityByDomain:{analysisMetric:W1_AUTHORITY.ANALYSIS_ONLY,identity:W1_AUTHORITY.CANONICAL},limitations:[]
});
assert.equal(analysisFingerprint.authorityByDomain.analysisMetric,W1_AUTHORITY.ANALYSIS_ONLY,'analysis-only authority must remain explicit rather than promoted');

console.log('PROD-W1-CONTRACTS focused conformance: PASS');
console.log('savedObservationBytes='+Buffer.byteLength(savedText));
console.log('savedObservationSha256='+createHash('sha256').update(savedText).digest('hex'));
