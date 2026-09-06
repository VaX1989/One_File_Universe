(function(root){
'use strict';
const O=root.OFU=root.OFU||{},P=O.p2,T=O.p4,C=O.pxContracts,S=O.v1Session,R=O.waveIVScaleRuntime;
if(!P||!T||!C||!S||!R)throw new Error('V1X-12 temporal bridge prerequisites missing');
const VERSION='ofu-v1x-12-session-bridge-1',AUTHORITY='MODEL_DERIVED_SIMULATION';
function fail(message){throw new Error('OFU V1X-12 session bridge: '+message)}
function assertContracts(){
 if(T.VERSION!=='ofu-p4-temporal-v1')fail('P4 protocol mismatch');
 if(S.VERSION!=='ofu-v1-session-runtime-1'||S.FORMAT!=='OFU-V1-SESSION')fail('session contract mismatch');
 if(R.VERSION!=='ofu-wave-iv-scale-runtime-3'||R.SELECTION_CONTRACT!=='ofu-wave-iv-selection-1')fail('scale/selection contract mismatch');
 return true;
}
function targetIdFromValidated(validated){return P.hex(validated.body.selection.entityId)}
function jsonSafe(value){if(value===null||typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;if(typeof value==='bigint'){const n=Number(value);return Number.isSafeInteger(n)?n:value.toString();}if(value instanceof Uint8Array)return P.hex(value);if(Array.isArray(value))return value.map(jsonSafe);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value))out[key]=jsonSafe(value[key]);return out;}return String(value)}
function portableWitness(bytes,validated=S.validateBytes(bytes)){
 const checkpoint=validated.world.checkpoint;
 const selected=targetIdFromValidated(validated);
 return C.data({
  contract:VERSION,
  authority:AUTHORITY,
  canonicalMutation:false,
  canonicalP6Mutation:false,
  portableFormat:S.FORMAT,
  portableBytes:bytes.length,
  selectedTargetId:selected,
  spatialScale:validated.body.spatialScale,
  p4Protocol:T.VERSION,
  p4StateDigest:P.hex(validated.replayed.digest),
  p4TransitionDigest:P.hex(validated.body.p4TransitionDigest),
  checkpointPresent:checkpoint!==null,
  checkpointCoveredEventCount:checkpoint?checkpoint.descriptor.coveredEventCount.toString():'0',
  tailEventCount:validated.world.events.length,
  physicalDevices:'NOT_VERIFIED'
 });
}
function consequenceFromValidated(validated,targetId=targetIdFromValidated(validated)){
 if(typeof targetId!=='string'||!/^[0-9a-f]{64}$/.test(targetId))fail('target id must be 32-byte lowercase hex');
 const entity=validated.replayed.state.entities[targetId]||null;
 const last=entity?.fields?.['v1.intervention.last']||null;
 const count=entity?.counters?.['v1.intervention.count']||0n;
 return C.data({
  contract:VERSION,
  targetId,
  authority:AUTHORITY,
  source:'P4_REPLAYED_PLAYER_OVERLAY',
  stateDigest:P.hex(validated.replayed.digest),
  interventionCount:count.toString(),
  lastIntervention:last===null?null:{
   contract:last.contract,
   kind:last.kind,
   parameters:jsonSafe(last.parameters),
   authority:last.authority,
   canonicalMutation:last.canonicalMutation,
   canonicalP6Mutation:last.canonicalP6Mutation
  },
  canonicalMutation:false,
  canonicalP6Mutation:false
 });
}
function exportPortable(){assertContracts();return S.exportBytes()}
function inspectPortable(bytes){assertContracts();return portableWitness(bytes)}
function importPortable(bytes){assertContracts();const result=S.importBytes(bytes);return C.data({contract:VERSION,status:result.status,targetId:result.planetId,spatialScale:result.spatialScale,modelRegime:result.modelRegime,stateDigest:result.stateDigest,authority:AUTHORITY,canonicalP6Unchanged:result.canonicalP6Unchanged});}
function revisit(targetId=null){assertContracts();const bytes=S.exportBytes(),validated=S.validateBytes(bytes);return consequenceFromValidated(validated,targetId||targetIdFromValidated(validated))}
function bytesEqual(a,b){return a instanceof Uint8Array&&b instanceof Uint8Array&&a.length===b.length&&a.every((v,i)=>v===b[i])}
assertContracts();
O.v1x12TemporalBridge=Object.freeze({VERSION,AUTHORITY,assertContracts,exportPortable,inspectPortable,importPortable,revisit,bytesEqual});
})(typeof globalThis!=='undefined'?globalThis:this);
