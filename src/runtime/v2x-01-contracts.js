(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts;
if(!C)throw new Error('V2X-01 requires PX contracts');
const VERSION='ofu-v2x01-runtime-contracts-4';
const ADAPTIVE_POLICY_VERSION='ofu-v2x01-adaptive-materialization-policy-1';
const STATES=Object.freeze(['COLD','WARM','HOT','IMMEDIATE']);
const STATE_RANK=Object.freeze({COLD:0,WARM:1,HOT:2,IMMEDIATE:3});
const STATE_STARVATION_BOUND=8;
const TASK_CLASSES=Object.freeze(['INTERACTION','RENDER_PREP','REFINE','HISTORY_RECONCILE','PREFETCH']);
const EVIDENCE_STATES=Object.freeze(['MEASURED_RUNTIME_EVIDENCE','ESTIMATED','UNKNOWN']);
const HARD=Object.freeze({
  active:16,
  queue:Math.min(4096,C.LIMITS.queue),
  cacheEntries:4096,
  materializations:4096,
  cpuEstimateBytes:536870912,
  heapBytes:536870912,
  gpuEstimateBytes:1073741824,
  entities:C.LIMITS.entities,
  operations:C.LIMITS.operations,
  syncFallbackOperations:65536,
  transferBytes:67108864,
  taskBytes:262144
});
const DEFAULTS=Object.freeze({
  active:4,queue:128,cacheEntries:512,materializations:512,
  cpuEstimateBytes:67108864,heapBytes:134217728,gpuEstimateBytes:134217728,
  entities:16384,operations:262144,syncFallbackOperations:8192,transferBytes:8388608,taskBytes:65536
});
const CLASS_WEIGHTS=Object.freeze({INTERACTION:8,RENDER_PREP:4,REFINE:2,HISTORY_RECONCILE:1,PREFETCH:1});
const ADAPTIVE=Object.freeze({
  relevanceMaxPpm:1000000,
  warmEnterPpm:125000,
  warmExitPpm:75000,
  hotEnterPpm:500000,
  hotExitPpm:350000,
  visibleFloorPpm:250000
});
function integer(value,label,min,max){C.assert(Number.isSafeInteger(value)&&value>=min&&value<=max,'BUDGET',label);return value;}
function ppm(value,label){return integer(value,label,0,ADAPTIVE.relevanceMaxPpm);}
function state(value){C.assert(STATES.includes(value),'LIFECYCLE','unknown materialization state '+value);return value;}
function taskClass(value){C.assert(TASK_CLASSES.includes(value),'SCHEDULER','unknown task class '+value);return value;}
function workloadDomain(value='default'){return C.token(value,'workload domain');}
function evidenceState(value){C.assert(EVIDENCE_STATES.includes(value),'EVIDENCE','unknown runtime evidence state '+value);return value;}
function identity(input){const v=C.data(input,{bytes:4096,nodes:128});C.keys(v,['providerId','entityId','representationId']);C.token(v.providerId,'provider id');C.hash(v.entityId,'entity id');C.token(v.representationId,'representation id');return v;}
function durable(input){const v=C.data(input,{bytes:16384,nodes:512});C.keys(v,['identity','commitmentDigest','historyDigest']);identity(v.identity);C.hash(v.commitmentDigest,'commitment digest');C.hash(v.historyDigest,'history digest');return v;}
function lineage(input){const v=C.data(input,{bytes:8192,nodes:256});C.keys(v,['modelVersion','representationVersion','commitmentDigest','historyDigest']);C.version(v.modelVersion);C.version(v.representationVersion);C.hash(v.commitmentDigest,'commitment digest');C.hash(v.historyDigest,'history digest');return v;}
function budgets(input={}){C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','runtime budgets');C.keys(input,[],Object.keys(DEFAULTS));const out={};for(const key of Object.keys(DEFAULTS)){out[key]=integer(input[key]??DEFAULTS[key],key,1,HARD[key]);}C.assert(out.active<=out.queue,'BUDGET','active must not exceed queue');return Object.freeze(out);}
function estimate(input){C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','resource estimate');C.keys(input,['cpuEstimateBytes','gpuEstimateBytes','entities','operations','transferBytes']);return Object.freeze({
  cpuEstimateBytes:integer(input.cpuEstimateBytes,'cpu estimate bytes',0,HARD.cpuEstimateBytes),
  gpuEstimateBytes:integer(input.gpuEstimateBytes,'gpu estimate bytes',0,HARD.gpuEstimateBytes),
  entities:integer(input.entities,'entities',0,HARD.entities),
  operations:integer(input.operations,'operations',0,HARD.operations),
  transferBytes:integer(input.transferBytes,'transfer bytes',0,HARD.transferBytes)
});}
function materializationSignals(input){
  C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','materialization signals');
  C.keys(input,['visible','selected','scaleRelevancePpm','causalRelevancePpm'],['previousState']);
  C.assert(typeof input.visible==='boolean','SCHEMA','visible');C.assert(typeof input.selected==='boolean','SCHEMA','selected');
  return Object.freeze({visible:input.visible,selected:input.selected,scaleRelevancePpm:ppm(input.scaleRelevancePpm,'scale relevance ppm'),causalRelevancePpm:ppm(input.causalRelevancePpm,'causal relevance ppm'),previousState:state(input.previousState??'COLD')});
}
function adaptiveState(input){
  const s=materializationSignals(input),scorePpm=Math.max(s.scaleRelevancePpm,s.causalRelevancePpm,s.visible?ADAPTIVE.visibleFloorPpm:0);
  let next='COLD',reason='IRRELEVANT';
  if(s.selected){next='IMMEDIATE';reason='SELECTED';}
  else if(scorePpm>=ADAPTIVE.hotEnterPpm){next='HOT';reason=s.causalRelevancePpm>=ADAPTIVE.hotEnterPpm?'CAUSAL_RELEVANCE':s.scaleRelevancePpm>=ADAPTIVE.hotEnterPpm?'SCALE_RELEVANCE':'VISIBLE';}
  else if(s.previousState==='HOT'&&scorePpm>=ADAPTIVE.hotExitPpm){next='HOT';reason='HOT_HYSTERESIS';}
  else if(scorePpm>=ADAPTIVE.warmEnterPpm){next='WARM';reason=s.visible?'VISIBLE':s.causalRelevancePpm>=ADAPTIVE.warmEnterPpm?'CAUSAL_RELEVANCE':'SCALE_RELEVANCE';}
  else if(s.previousState==='WARM'&&scorePpm>=ADAPTIVE.warmExitPpm){next='WARM';reason='WARM_HYSTERESIS';}
  return Object.freeze({policyVersion:ADAPTIVE_POLICY_VERSION,state:next,reason,scorePpm,signals:s});
}
function compareStates(a,b){return STATE_RANK[state(a)]-STATE_RANK[state(b)];}
function logicalIdentityKey(input){const v=identity(input);return v.providerId+'|'+v.entityId+'|'+v.representationId;}
O.v2x01Contracts=Object.freeze({VERSION,ADAPTIVE_POLICY_VERSION,STATES,STATE_RANK,STATE_STARVATION_BOUND,TASK_CLASSES,EVIDENCE_STATES,HARD,DEFAULTS,CLASS_WEIGHTS,ADAPTIVE,integer,ppm,state,taskClass,workloadDomain,evidenceState,identity,durable,lineage,budgets,estimate,materializationSignals,adaptiveState,compareStates,logicalIdentityKey});
})(globalThis);
