import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGovernedTimeExplorer,TIME_P4_AUTHORITY,TIME_PRESENTATION_AUTHORITY,TIME_REFERENCE_AUTHORITY,TIME_SUPPORT_MODE} from '../../src/product/exploration/time/governed-time-explorer.js';

const h=n=>BigInt(n).toString(16).padStart(64,'0');
const subject=Object.freeze({schemaVersion:1,contract:'ofu-r6-w1-canonical-entity-ref-1',universeId:'time-universe',entityKind:'PLANET',canonicalId:h(1),canonicalKey:{orbitSlot:'2'}});
const returnRef=Object.freeze({schemaVersion:1,contract:'ofu-r6-w1-return-ref-1',authority:'PRESENTATION_ONLY',selectionContract:'ofu-wave-iv-selection-1',scaleContract:'ofu-wave-iv-scale-runtime-3',semanticScale:'APPROACH',distanceIntentRadii:1.25});
const fpRef=Object.freeze({schemaVersion:1,contract:'ofu-r6-w1-scientific-fingerprint-ref-1',subjectCanonicalId:subject.canonicalId,contextHash:h(9),scientificStateContract:'ofu-time-test-science-1',scientificModelVersion:'science-1'});
const makeP4=(seconds,digestSeed=seconds)=>Object.freeze({schemaVersion:1,contract:'ofu-r6-w1-p4-state-ref-1',protocol:'ofu-p4-temporal-v1',universeIdentity:h(2),lineageId:h(3),stateDigest:h(digestSeed+1000),checkpointId:null,frontier:{eventId:h(digestSeed+2000),seconds:String(seconds),micros:'0'}});

function createAtlas(){
  const entries=new Map([['obs-source',{id:'obs-source',observation:{schemaVersion:1,contract:'ofu-r6-w1-saved-observation-1',kind:'SNAPSHOT',subject,temporalRef:makeP4(100),scientificFingerprintRef:fpRef,returnRef,label:'Source'}}]]);
  let next=1;
  return {
    revisitPlan(id){const rec=entries.get(id);if(!rec)throw new Error('unknown atlas entry');const o=rec.observation;return Object.freeze({contract:'ofu-prod-w1-atlas-revisit-plan-1',authority:'REFERENCE_ONLY',atlasEntryId:rec.id,kind:o.kind,subject:o.subject,temporalRef:o.temporalRef,scientificFingerprintRef:o.scientificFingerprintRef,returnRef:o.returnRef,exactTemporalStateReference:o.temporalRef!==null,presentationHintOnly:o.returnRef!==null,mutatesWorld:false,mutatesSelection:false,mutatesCamera:false})},
    saveObservation(observation){const id='obs-saved-'+next++;const entry=Object.freeze({id,observation});entries.set(id,entry);return entry},
    entries
  };
}

const atlas=createAtlas();
const calls=[];
const pending=new Map();
const model=Object.freeze({contractId:'ofu.domain.time.test',semanticVersion:'1.0.0'});
const resolver=async ({targetTime})=>{
  const seconds=Number(targetTime.seconds);calls.push(seconds);
  if(seconds>=400){return await new Promise(resolve=>pending.set(seconds,resolve))}
  return {status:'RESOLVED',model,p4StateRef:makeP4(seconds)};
};
const domain={id:'planet-history',model,authority:'MODEL_DERIVED',supportMode:TIME_SUPPORT_MODE.EXACT_INTERVALS,intervals:[{start:{seconds:'0',micros:'0'},end:{seconds:'1000',micros:'0'}}],stepMicros:'1000000',epochs:[{id:'GENESIS',time:{seconds:'0',micros:'0'}},{id:'SOURCE',time:{seconds:'100',micros:'0'}}],resolveExact:resolver};
const explorer=createGovernedTimeExplorer({atlas,domains:[domain],limits:{maxMaterializedReferences:2,maxSerializedReferenceBytes:65536}});
assert.equal(explorer.authority,TIME_REFERENCE_AUTHORITY);
assert.equal(explorer.timeAuthority,TIME_P4_AUTHORITY);

const source=explorer.referenceFromAtlas({entryId:'obs-source',domainId:'planet-history',model});
assert.equal(source.canonicalTime.seconds,'100');
assert.equal(source.p4StateRef.stateDigest,makeP4(100).stateDigest);
assert.equal(source.productContext.atlasEntryId,'obs-source');
assert.equal(source.model.semanticVersion,'1.0.0');
assert.throws(()=>explorer.referenceFromAtlas({entryId:'obs-source',domainId:'planet-history',model:{contractId:model.contractId,semanticVersion:'2.0.0'}}),/requested time model version mismatch/,'Atlas exact state may not be silently rebound to a different domain-time model version');
const projection=explorer.productProjection(source);
assert.equal(projection.authority,TIME_PRESENTATION_AUTHORITY);
assert.equal(projection.timeLabel,'Canonical P4 time');
assert.equal(projection.animationClockLabel,'Presentation only');
const playback=explorer.playbackProjection({paused:false,rate:8});
assert.equal(playback.animationClockIsCanonical,false);
assert.equal(playback.changesCanonicalHistory,false);

const samePlan=explorer.planTo({reference:source,targetTime:{seconds:'100',micros:'0'}});
assert.equal(samePlan.resolution,'REFERENCE_REUSE');
assert.equal(samePlan.timelineAuthorityCreated,false);
assert.equal((await explorer.materialize(samePlan)).reference.p4StateRef.stateDigest,source.p4StateRef.stateDigest);
assert.deepEqual(calls,[],'same-time navigation must not invent historical resolution');

const reversePlan=explorer.planTo({reference:source,targetTime:{seconds:'50',micros:'0'}});
assert.equal(reversePlan.direction,'REVERSE');
const reverseFirst=await explorer.materialize(reversePlan);
assert.equal(reverseFirst.status,'RESOLVED');
assert.equal(reverseFirst.reference.canonicalTime.seconds,'50');
assert.equal(reverseFirst.reference.p4StateRef.stateDigest,makeP4(50).stateDigest);
const reverseCached=await explorer.materialize(reversePlan);
assert.equal(reverseCached.cacheHit,true);
assert.deepEqual(calls,[50]);

const stepped=explorer.planStep({reference:source,steps:1});
assert.equal(stepped.targetTime.seconds,'101');
assert.equal(stepped.direction,'FORWARD');
const epoch=explorer.planEpoch({reference:source,epochId:'GENESIS'});
assert.equal(epoch.direction,'REVERSE');
assert.equal(epoch.targetTime.seconds,'0');
assert.throws(()=>explorer.planTo({reference:source,targetTime:{seconds:'1001',micros:'0'}}),/historical interval unsupported/);
assert.throws(()=>explorer.planStep({reference:source,steps:-101}),/negative/);

const saved=explorer.saveAtlasSnapshot({reference:reverseFirst.reference,label:'Exact T=50'});
assert.equal(saved.entry.observation.kind,'SNAPSHOT');
assert.equal(saved.entry.observation.temporalRef.stateDigest,makeP4(50).stateDigest);
assert.equal(saved.entry.observation.subject.canonicalId,subject.canonicalId);
assert.ok(!/world|scene|camera/i.test(JSON.stringify(saved.entry.observation)),'Atlas snapshot must remain compact references, not a world/scene/camera copy');
assert.equal(explorer.parseReference(saved.serializedTemporalReference).p4StateRef.stateDigest,makeP4(50).stateDigest);
assert.equal(explorer.serializeReference(explorer.parseReference(saved.serializedTemporalReference)),saved.serializedTemporalReference,'temporal reference serialization must be byte stable');

const r200=await explorer.materialize(explorer.planTo({reference:source,targetTime:{seconds:'200',micros:'0'}}));
const r300=await explorer.materialize(explorer.planTo({reference:source,targetTime:{seconds:'300',micros:'0'}}));
assert.equal(explorer.snapshot().materializedReferenceCount,2,'reference materialization must remain bounded');
const reverseAfterEviction=await explorer.materialize(reversePlan);
assert.equal(reverseAfterEviction.cacheHit,false,'evicted exact reference must rematerialize');
assert.equal(explorer.serializeReference(reverseAfterEviction.reference),explorer.serializeReference(reverseFirst.reference),'eviction/rematerialization must reproduce the exact compact reference');
assert.deepEqual(calls,[50,200,300,50]);

const p400=explorer.materialize(explorer.planTo({reference:source,targetTime:{seconds:'400',micros:'0'}}));
const p500=explorer.materialize(explorer.planTo({reference:source,targetTime:{seconds:'500',micros:'0'}}));
pending.get(400)({status:'RESOLVED',model,p4StateRef:makeP4(400)});
assert.equal((await p400).status,'STALE_DROPPED','superseded temporal materialization must not be admitted');
pending.get(500)({status:'RESOLVED',model,p4StateRef:makeP4(500)});
assert.equal((await p500).reference.canonicalTime.seconds,'500');

const aborter=new AbortController();
const p600=explorer.materialize(explorer.planTo({reference:source,targetTime:{seconds:'600',micros:'0'}}),{signal:aborter.signal});
aborter.abort();
pending.get(600)({status:'RESOLVED',model,p4StateRef:makeP4(600)});
assert.equal((await p600).status,'CANCELLED');

const unsupportedDomain={id:'observation-only',model:{contractId:'ofu.domain.instant',semanticVersion:'1.0.0'},authority:'MODEL_DERIVED',supportMode:TIME_SUPPORT_MODE.REFERENCE_ONLY,intervals:[],stepMicros:null,epochs:[],resolveExact:null};
const referenceOnly=createGovernedTimeExplorer({atlas,domains:[unsupportedDomain]});
const instant=referenceOnly.referenceFromAtlas({entryId:'obs-source',domainId:'observation-only',model:unsupportedDomain.model});
assert.equal((await referenceOnly.materialize(referenceOnly.planTo({reference:instant,targetTime:instant.canonicalTime}))).status,'RESOLVED');
assert.throws(()=>referenceOnly.planTo({reference:instant,targetTime:{seconds:'99',micros:'0'}}),/historical interval unsupported/);

const resolverUnsupported=createGovernedTimeExplorer({atlas,domains:[{...domain,id:'unsupported-resolver',resolveExact:async ()=>({status:'UNSUPPORTED',reason:'domain model cannot reconstruct this governed instant'})}]});
const resolverUnsupportedSource=resolverUnsupported.referenceFromAtlas({entryId:'obs-source',domainId:'unsupported-resolver',model});
assert.equal((await resolverUnsupported.materialize(resolverUnsupported.planTo({reference:resolverUnsupportedSource,targetTime:{seconds:'10',micros:'0'}}))).status,'UNSUPPORTED','domain resolver may fail closed inside a declared broad interval');

const explorerV2=createGovernedTimeExplorer({atlas,domains:[{...domain,model:{contractId:model.contractId,semanticVersion:'2.0.0'}}]});
assert.throws(()=>explorerV2.parseReference(explorer.serializeReference(source)),/model version\/authority mismatch/,'saved temporal references must fail closed on model-version mismatch');

const mismatchExplorer=createGovernedTimeExplorer({atlas,domains:[{...domain,id:'mismatch',resolveExact:async ({targetTime})=>({status:'RESOLVED',model:{contractId:model.contractId,semanticVersion:'9.0.0'},p4StateRef:makeP4(Number(targetTime.seconds))})}]});
const mismatchSource=mismatchExplorer.referenceFromAtlas({entryId:'obs-source',domainId:'mismatch',model});
await assert.rejects(()=>mismatchExplorer.materialize(mismatchExplorer.planTo({reference:mismatchSource,targetTime:{seconds:'10',micros:'0'}})),/resolved time model version mismatch/);

const wrongTimeExplorer=createGovernedTimeExplorer({atlas,domains:[{...domain,id:'wrong-time',resolveExact:async ()=>({status:'RESOLVED',model,p4StateRef:makeP4(77)})}]});
const wrongTimeSource=wrongTimeExplorer.referenceFromAtlas({entryId:'obs-source',domainId:'wrong-time',model});
await assert.rejects(()=>wrongTimeExplorer.materialize(wrongTimeExplorer.planTo({reference:wrongTimeSource,targetTime:{seconds:'10',micros:'0'}})),/resolved P4 reference time mismatch/);

const sourceText=fs.readFileSync(new URL('../../src/product/exploration/time/governed-time-explorer.js',import.meta.url),'utf8');
for(const banned of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/navigator\./,/document\./,/window\./,/requestAnimationFrame/])assert.doesNotMatch(sourceText,banned,'time projection must remain host/network/renderer independent');

console.log(JSON.stringify({schema:'ofu-prod-w2-time-test-v1',status:'PASS',timeAuthority:explorer.timeAuthority,sourceTime:source.canonicalTime,reverseTime:reverseFirst.reference.canonicalTime,rematerializedDigest:reverseAfterEviction.reference.p4StateRef.stateDigest,cacheBound:explorer.limits.maxMaterializedReferences,resolverCalls:calls.length,staleCancellation:'PASS',modelMismatch:'REJECTED',unsupportedHistory:'REJECTED',networkCalls:0,cameraMutation:false,timelineAuthorityCreated:false}));
