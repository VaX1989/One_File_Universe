import assert from 'node:assert/strict';
import {
  W1_OBSERVATION_KIND,
  createCanonicalEntityRef,
  createP4StateRef,
  createReturnRef,
  createScientificFingerprintRef,
  createSavedObservation
} from '../../src/product/contracts/w1-observation-contracts.js';
import {
  ATLAS_CORE_VERSION,
  ATLAS_INTERNAL_AUTHORITY,
  ATLAS_INTERNAL_STATE_CONTRACT,
  createAtlasCore
} from '../../src/product/w1/atlas-core.js';

const h=n=>n.toString(16).padStart(64,'0');
const subject=createCanonicalEntityRef({
  universeId:'atlas-universe',entityKind:'planet',canonicalId:h(1),
  canonicalKey:{galaxyX:1,galaxyY:2,galaxyZ:3,sectorX:4,sectorY:5,sectorZ:6,siteX:7,siteY:8,siteZ:9,orbitSlot:2}
});
const temporal=createP4StateRef({
  universeIdentity:h(2),lineageId:h(3),stateDigest:h(4),checkpointId:null,
  frontier:{eventId:h(5),seconds:123,micros:456}
});
const fpRef=createScientificFingerprintRef({
  subjectCanonicalId:subject.canonicalId,contextHash:h(6),
  scientificStateContract:'ofu-r6-world-scientific-state-1',
  scientificModelVersion:'model-v1'
});
const returnRef=createReturnRef({semanticScale:'APPROACH',distanceIntentRadii:1.4});

const place=createSavedObservation({kind:W1_OBSERVATION_KIND.PLACE,subject,label:'Home world',returnRef});
const observation=createSavedObservation({kind:W1_OBSERVATION_KIND.OBSERVATION,subject,label:'Atmospheric pass',scientificFingerprintRef:fpRef,returnRef});
const snapshot=createSavedObservation({kind:W1_OBSERVATION_KIND.SNAPSHOT,subject,label:'Exact temporal state',temporalRef:temporal,scientificFingerprintRef:fpRef,returnRef});

const atlas=createAtlasCore({limits:{maxEntries:8,maxRoutes:4,maxRouteStops:8,maxSerializedBytes:65536}});
assert.equal(atlas.version,ATLAS_CORE_VERSION);
assert.equal(atlas.authority,ATLAS_INTERNAL_AUTHORITY);

const p=atlas.saveObservation(place),o=atlas.saveObservation(observation),s=atlas.saveObservation(snapshot);
assert.match(p.id,/^obs-[0-9a-f]{16}$/);
assert.equal(atlas.saveObservation(place).id,p.id,'exact duplicate must deduplicate deterministically');
assert.equal(atlas.snapshot().entryCount,3);
assert.deepEqual(atlas.getEntry(s.id).observation,snapshot);

const route=atlas.createRoute({label:'Study route',entryIds:[p.id,o.id,s.id]});
assert.match(route.id,/^route-[0-9a-f]{16}$/);
assert.deepEqual(route.entryIds,[p.id,o.id,s.id]);
assert.equal(atlas.createRoute({label:'Study route',entryIds:[p.id,o.id,s.id]}).id,route.id,'route identity must be deterministic');
assert.equal(atlas.snapshot().routeCount,1);

assert.deepEqual(atlas.find({kind:'SNAPSHOT'}).map(x=>x.id),[s.id]);
assert.deepEqual(atlas.find({labelContains:'atmospheric'}).map(x=>x.id),[o.id]);
assert.deepEqual(atlas.find({subjectCanonicalId:subject.canonicalId}).length,3);

const plan=atlas.revisitPlan(s.id);
assert.equal(plan.authority,'REFERENCE_ONLY');
assert.equal(plan.exactTemporalStateReference,true);
assert.equal(plan.temporalRef.stateDigest,h(4));
assert.equal(plan.scientificFingerprintRef.contextHash,h(6));
assert.equal(plan.presentationHintOnly,true);
assert.equal(plan.returnRef.authority,'PRESENTATION_ONLY');
assert.equal(plan.mutatesWorld,false);
assert.equal(plan.mutatesSelection,false);
assert.equal(plan.mutatesCamera,false);

const placePlan=atlas.revisitPlan(p.id);
assert.equal(placePlan.exactTemporalStateReference,false);
assert.equal(placePlan.temporalRef,null);

assert.throws(()=>atlas.forgetObservation(o.id),/referenced by a route/);
assert.equal(atlas.forgetRoute(route.id),true);
assert.equal(atlas.forgetObservation(o.id),true);
assert.equal(atlas.snapshot().entryCount,2);
const route2=atlas.createRoute({label:'Return route',entryIds:[p.id,s.id]});

const exported=atlas.exportBundle();
const parsed=JSON.parse(exported);
assert.equal(parsed.contract,ATLAS_INTERNAL_STATE_CONTRACT);
assert.equal(parsed.authority,ATLAS_INTERNAL_AUTHORITY);
assert.deepEqual(parsed.entries.map(x=>x.id),[...parsed.entries.map(x=>x.id)].sort());
assert.deepEqual(parsed.routes.map(x=>x.id),[route2.id]);

const restored=createAtlasCore({limits:{maxEntries:8,maxRoutes:4,maxRouteStops:8,maxSerializedBytes:65536},initialBundle:exported});
assert.equal(restored.exportBundle(),exported,'canonical export/import must be byte stable');
assert.deepEqual(restored.revisitPlan(s.id),atlas.revisitPlan(s.id),'revisit plan must survive exact Atlas restore');
assert.deepEqual(restored.listEntries(),atlas.listEntries());
assert.deepEqual(restored.listRoutes(),atlas.listRoutes());

const future=JSON.parse(exported);future.schemaVersion=2;
assert.throws(()=>createAtlasCore({initialBundle:JSON.stringify(future)}),/unsupported atlas schema version/);
const extra=JSON.parse(exported);extra.rendererScene='scene-1';
assert.throws(()=>createAtlasCore({initialBundle:JSON.stringify(extra)}),/unsupported fields/);
const tampered=JSON.parse(exported);tampered.entries[0].id='obs-0000000000000000';
assert.throws(()=>createAtlasCore({initialBundle:JSON.stringify(tampered)}),/id\/content mismatch/);
assert.throws(()=>createAtlasCore({initialBundle:' '+exported}),/not canonical/);
const observationLeak={...place,rendererObjectId:'mesh-42'};
assert.throws(()=>createAtlasCore().saveObservation(observationLeak),/unsupported fields/);
assert.throws(()=>atlas.createRoute({entryIds:[p.id,'obs-0000000000000000']}),/unknown atlas entry/);

const tiny=createAtlasCore({limits:{maxEntries:1,maxRoutes:0,maxRouteStops:2,maxSerializedBytes:4096}});
tiny.saveObservation(place);
assert.throws(()=>tiny.saveObservation(snapshot),/entry capacity exceeded/);

console.log(JSON.stringify({
  schema:'ofu-prod-w1-atlas-core-test-v1',
  status:'PASS',
  entryCount:restored.snapshot().entryCount,
  routeCount:restored.snapshot().routeCount,
  snapshotEntryId:s.id,
  routeId:route2.id,
  exportedBytes:Buffer.byteLength(exported),
  exactTemporalReference:restored.revisitPlan(s.id).temporalRef.stateDigest
}));
