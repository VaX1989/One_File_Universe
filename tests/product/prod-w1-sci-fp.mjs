import assert from 'node:assert/strict';
import {
  W1_AUTHORITY,
  W1_FINGERPRINT_STATUS,
  createCanonicalEntityRef,
  parseW1Contract
} from '../../src/product/contracts/w1-observation-contracts.js';
import {createWorldScientificState} from '../../src/experiments/spatial-continuum/scientific-state.js';
import {
  SCIENTIFIC_FINGERPRINT_PROVIDER,
  projectScientificFingerprint,
  projectScientificProvenance
} from '../../src/product/w1/scientific-fingerprint.js';

const canonicalId='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const universeId='universe-fixture';
const canonicalKey={galaxyX:1n,galaxyY:2n,galaxyZ:3n,sectorX:4n,sectorY:5n,sectorZ:6n,siteX:7n,siteY:8n,siteZ:9n,orbitSlot:2n};
const runtime={ctx:{masterSeed:Uint8Array.from({length:32},(_,index)=>index)},universe:{universeId}};
const system={entityId:'system-fixture',metadata:{facts:{baselineAgeMyr:4500n,baselineMetallicityMilliDex:0n,baselinePrimaryMassMilliSolar:1000n,protoplanetarySolidBudgetPermille:800n,planetCount:3n,planetArchitecture:'ORDERED'}}};
const body={entityId:canonicalId,canonicalId,canonicalKey,metadata:{facts:{bulkPriorClass:'TERRESTRIAL',baselineMassMilliEarth:1000n,baselineSemiMajorAxisMicroAu:1000000n,baselineEccentricityPpm:20000n,baselineInclinationMilliDeg:0n,baselineInsolationPpm:1000000n,moonCount:1n}}};
const physical={physical:{meanRadiusM:6371000n,surfaceGravityMicroMs2:9810000n,meanDensityKgM3:5514n,composition:{model:'TEST',coreMassFractionPermille:320n,coreFractionPpm:320000n,mantleFractionPpm:680000n}}};
const modeledWorld={planetology:{
  formation:{temperatureIndexPpm:400000,ageMyr:4500},
  composition:{metalPpm:320000,silicatePpm:560000,volatilePpm:120000,sumPpm:1000000},
  interior:{coreFractionPpm:320000,heatIndexPpm:600000,geodynamicRegime:'TEST_SCENARIO'},
  volatiles:{initialInventoryUnits:120000,interiorUnits:20000,surfaceCondensedUnits:30000,atmosphereUnits:1000,lostUnits:70000,conserved:true},
  atmosphere:{inventoryUnits:1000,modelPressureProxy:1,canonicalPressure:false},
  climate:{model:'TEST',stellarFluxPpm:1000000,bondAlbedoPpm:300000,effectiveTemperatureMilliK:250000,greenhouseDeltaMilliK:38000,surfaceTemperatureMilliK:288000,temperatureAuthority:'MODEL_DERIVED',measured:false},
  hydrosphere:{liquidSurfaceEligible:false,waterAreaPpm:0,iceFractionPpm:0,canonicalOceanClaim:false},
  surfaceProcesses:{tectonicActivityPpm:600000,erosionPotentialPpm:220000,impactRetentionPpm:540000}
}};
const point={locationIdentity:'surface-fixture',latMicroDeg:12345,lonMicroDeg:-54321};
const sample={entityId:'sample-fixture',kind:'ROCK'};
const source={phase:'SOLID',structure:'POLYCRYSTALLINE',chemistryAuthority:'MODEL_DERIVED',components:[{id:'SILICA'}]};
const subject=createCanonicalEntityRef({universeId,entityKind:'planet',canonicalId,canonicalKey});
const worldState=createWorldScientificState({runtime,system,body,physical,modeledWorld,point,sample,source});

assert.equal(SCIENTIFIC_FINGERPRINT_PROVIDER.authority,W1_AUTHORITY.ANALYSIS_ONLY);
assert.equal(SCIENTIFIC_FINGERPRINT_PROVIDER.canonicalPromotion,false);
assert.equal(SCIENTIFIC_FINGERPRINT_PROVIDER.mutatesScientificState,false);

const first=projectScientificFingerprint({subject,worldState});
const second=projectScientificFingerprint({subject,worldState});
assert.deepEqual(first,second,'fingerprint projection must be deterministic');
assert.equal(first.fingerprint.status,W1_FINGERPRINT_STATUS.PRESENT);
assert.equal(first.fingerprint.contract,'ofu-r6-w1-scientific-fingerprint-1');
assert.equal(first.fingerprint.subject.canonicalId,canonicalId);
assert.equal(first.fingerprint.scientificStateContract,'ofu-r6-world-scientific-state-1');
assert.equal(first.fingerprint.scientificModelVersion,worldState.versions.scientificModel);
assert.equal(first.fingerprint.generatorVersion,worldState.versions.generator);
assert.deepEqual(first.fingerprint.scientificHashes,worldState.scientificHashes);
assert.deepEqual(first.fingerprint.authorityByDomain,worldState.scientificState.authority);
assert.equal(first.fingerprintRef.contextHash,worldState.scientificHashes.context);
assert.equal(first.fingerprintRef.subjectCanonicalId,canonicalId);
assert.deepEqual(parseW1Contract(first.canonicalFingerprint),first.fingerprint);

assert.equal(first.provenance.authority,W1_AUTHORITY.ANALYSIS_ONLY);
assert.equal(first.provenance.scientificClaimsAdded,false);
assert.ok(first.provenance.edges.length>=4);
assert.ok(first.provenance.edges.every(edge=>edge.projectionAuthority===W1_AUTHORITY.ANALYSIS_ONLY&&edge.downstreamAuthority===W1_AUTHORITY.PRESENTATION_ONLY&&edge.scientificClaim===false));
assert.ok(first.provenance.unknown.includes('actual crater, tectonic, basin, or fracture placement'));

const presentationChanged=Object.freeze({...worldState,presentation:Object.freeze({different:true}),representationHash:'f'.repeat(64),planetRepresentationHash:'e'.repeat(64)});
const presentationProjection=projectScientificFingerprint({subject,worldState:presentationChanged});
assert.deepEqual(presentationProjection.fingerprint,first.fingerprint,'presentation-only changes must not change scientific fingerprint');
assert.deepEqual(presentationProjection.fingerprintRef,first.fingerprintRef,'presentation-only changes must not change fingerprint reference');

const unknown=projectScientificFingerprint({subject,worldState:null});
assert.equal(unknown.fingerprint.status,W1_FINGERPRINT_STATUS.UNKNOWN);
assert.equal(unknown.fingerprintRef,null);
assert.equal(unknown.fingerprint.scientificModelVersion,null);
assert.equal(unknown.fingerprint.generatorVersion,null);
assert.deepEqual(unknown.fingerprint.scientificHashes,{planet:null,context:null,surface:null,sample:null});
assert.equal(unknown.fingerprint.authorityByDomain.identity,W1_AUTHORITY.CANONICAL);
assert.equal(unknown.fingerprint.authorityByDomain.environment,W1_AUTHORITY.UNKNOWN);
assert.deepEqual(parseW1Contract(unknown.canonicalFingerprint),unknown.fingerprint);

const wrongSubject=createCanonicalEntityRef({universeId,entityKind:'planet',canonicalId:'f'.repeat(64),canonicalKey});
assert.throws(()=>projectScientificFingerprint({subject:wrongSubject,worldState}),/canonical identity/);
const wrongUniverse=createCanonicalEntityRef({universeId:'other-universe',entityKind:'planet',canonicalId,canonicalKey});
assert.throws(()=>projectScientificFingerprint({subject:wrongUniverse,worldState}),/subject universe/);
assert.throws(()=>projectScientificFingerprint({subject,worldState:{...worldState,contract:'unsupported'}}),/unsupported world state contract/);
assert.throws(()=>projectScientificProvenance({...worldState,versions:{...worldState.versions,scientificModel:'mismatch'}}),/scientific model version mismatch/);

console.log(JSON.stringify({
  schema:'ofu-prod-w1-sci-fp-test-v1',
  status:'PASS',
  provider:SCIENTIFIC_FINGERPRINT_PROVIDER.id,
  contextHash:first.fingerprint.scientificHashes.context,
  domainAuthority:first.fingerprint.authorityByDomain,
  causalEdges:first.provenance.edges.length,
  unknownCount:first.provenance.unknown.length,
  canonicalFingerprintBytes:Buffer.byteLength(first.canonicalFingerprint)
}));
