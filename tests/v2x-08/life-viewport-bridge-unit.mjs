import assert from 'node:assert/strict';
import { createLifeViewportBridge, fingerprintLifeViewport } from '../../src/v2x-08-life-ecology-evolution-embodiment/viewport-bridge.js';

let eventKey = 'p4:fixture:1';
let summaryEpoch = 0;
const samples = [
  { id:'sample:a', populationId:'pop:a', lineageId:'lin:a', regionId:'r1', representativeOfAggregate:true, persistent:false, individualIdentityPromoted:false },
  { id:'sample:b', populationId:'pop:b', lineageId:'lin:b', regionId:'r1', representativeOfAggregate:true, persistent:false, individualIdentityPromoted:false },
  { id:'sample:c', populationId:'pop:c', lineageId:'lin:c', regionId:'r1', representativeOfAggregate:true, persistent:false, individualIdentityPromoted:false },
];
const provider = {
  summary: () => ({ eventKey, summaryEpoch, totalAbundance: 30n, authorityClass:'MODEL_DERIVED_SIMULATION' }),
  inspectRegion: id => id === 'r1' ? ({ regionId:id, totalRepresentedAbundance:30n, populationIds:['pop:a','pop:b','pop:c'], authorityClass:'MODEL_DERIVED_SIMULATION' }) : id === 'empty' ? ({ regionId:id,totalRepresentedAbundance:0n,populationIds:[],authorityClass:'MODEL_DERIVED_SIMULATION' }) : null,
  localSamples: ({regionId,maxSamples}) => regionId === 'r1' ? samples.slice(0,maxSamples) : [],
};
const families = ['CHAINED_ELLIPSOIDS','BRANCHED_RADIAL_PATCHES','MODULAR_LOBES'];
const render = rows => rows.map((sample,index)=>({
  id:`render:${sample.id}`, sampleId:sample.id, populationId:sample.populationId, lineageId:sample.lineageId,
  primitiveFamily:families[index], authorityClass:'PRESENTATION_ONLY', evidenceLink:{representativeOnly:true},
}));
const bridge = createLifeViewportBridge({provider,renderDescriptors:render,getEventKey:()=>eventKey});
const packetA = bridge.buildViewportPacket({regionId:'r1',viewportKey:'local:r1',maxSamples:9999,quality:'HIGH'});
const packetB = bridge.buildViewportPacket({regionId:'r1',viewportKey:'local:r1',maxSamples:9999,quality:'HIGH'});
assert.deepEqual(packetA, packetB, 'identical state/request must produce deterministic viewport packet');
assert.equal(packetA.maxSamples,128,'adversarial sample request must clamp to hard bound');
assert.equal(packetA.presence,'VISIBLE_MODELED_LIFE');
assert.deepEqual(new Set(packetA.renderDescriptors.map(x=>x.primitiveFamily)),new Set(families),'rich morphology variation must survive to render packets');
assert.ok(packetA.selectionTargets.every(x=>x.persistentIndividual===false && x.selectionAuthorityClaimed===false));
assert.equal(packetA.convergenceHooks.primaryRenderer.mutatesPrimaryRendererAuthority,false);
assert.equal(packetA.convergenceHooks.localSpace.mutatesCameraAuthority,false);
assert.equal(packetA.revisitToken.persistencePerformed,false);
assert.match(packetA.packetFingerprint,/^[0-9a-f]{8}$/);
assert.equal(bridge.revisit(packetA.revisitToken).status,'REVISITED_EXACT');
summaryEpoch = 1;
const sameEventChanged = bridge.revisit(packetA.revisitToken);
assert.equal(sameEventChanged.status,'STATE_RESOLUTION_REQUIRED','same event identity with changed modeled packet must fail closed to state resolution');
assert.equal(sameEventChanged.reason,'STATE_FINGERPRINT_MISMATCH');
summaryEpoch = 0;

const empty = bridge.buildViewportPacket({regionId:'empty',viewportKey:'empty'});
assert.equal(empty.presence,'ABSENT_IN_REPRESENTED_REGION');
assert.equal(empty.absenceReason,'NO_REPRESENTED_ABUNDANCE');
assert.match(empty.limitations[0],/not proof that life is impossible/);

const missing = bridge.buildViewportPacket({regionId:'missing',viewportKey:'missing'});
assert.equal(missing.absenceReason,'REGION_NOT_REPRESENTED_BY_LIFE_MODEL');

const zeroBudget = bridge.buildViewportPacket({regionId:'r1',viewportKey:'zero',maxSamples:0});
assert.equal(zeroBudget.absenceReason,'VIEWPORT_SAMPLE_BUDGET_ZERO');

const oldToken = packetA.revisitToken;
eventKey = 'p4:fixture:2';
const changed = bridge.revisit(oldToken);
assert.equal(changed.status,'STATE_RESOLUTION_REQUIRED');
assert.equal(changed.persistenceAuthorityClaimed,false);

assert.throws(()=>createLifeViewportBridge({
  provider, getEventKey:()=>eventKey,
  renderDescriptors:rows=>rows.map(s=>({id:`render:${s.id}`,sampleId:s.id,populationId:s.populationId,lineageId:s.lineageId,primitiveFamily:'GENERIC_ELLIPSE',authorityClass:'PRESENTATION_ONLY',evidenceLink:{representativeOnly:true}})),
}).buildViewportPacket({regionId:'r1',viewportKey:'fallback'}),/generic ellipse fallback is forbidden/,'adversarial old-fallback renderer must be rejected');

assert.equal(fingerprintLifeViewport({b:2n,a:1}),fingerprintLifeViewport({a:1,b:2n}),'fingerprint must be key-order deterministic');
assert.equal(bridge.reachabilityWitness().exactArtifactEvidenceStatus,'LANE_BUNDLE_AND_ONE_FILE_INJECTION_PROVEN__CENTRAL_MANIFEST_AND_LIVING_WIRING_REQUIRED');
console.log('V2X-08 viewport bridge: PASS');
