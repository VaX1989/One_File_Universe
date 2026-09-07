(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts;
if(!C)throw new Error('V2X-01 requires PX contracts');
const VERSION='ofu-v2x01-runtime-contracts-1';
const STATES=Object.freeze(['COLD','WARM','HOT','IMMEDIATE']);
const STATE_RANK=Object.freeze({COLD:0,WARM:1,HOT:2,IMMEDIATE:3});
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
  transferBytes:67108864,
  taskBytes:262144
});
const DEFAULTS=Object.freeze({
  active:4,queue:128,cacheEntries:512,materializations:512,
  cpuEstimateBytes:67108864,heapBytes:134217728,gpuEstimateBytes:134217728,
  entities:16384,operations:262144,transferBytes:8388608,taskBytes:65536
});
const CLASS_WEIGHTS=Object.freeze({INTERACTION:8,RENDER_PREP:4,REFINE:2,HISTORY_RECONCILE:1,PREFETCH:1});
function integer(value,label,min,max){C.assert(Number.isSafeInteger(value)&&value>=min&&value<=max,'BUDGET',label);return value;}
function state(value){C.assert(STATES.includes(value),'LIFECYCLE','unknown materialization state '+value);return value;}
function taskClass(value){C.assert(TASK_CLASSES.includes(value),'SCHEDULER','unknown task class '+value);return value;}
function evidenceState(value){C.assert(EVIDENCE_STATES.includes(value),'EVIDENCE','unknown runtime evidence state '+value);return value;}
function identity(input){const v=C.data(input,{bytes:4096,nodes:128});C.keys(v,['providerId','entityId','representationId']);C.token(v.providerId,'provider id');C.hash(v.entityId,'entity id');C.token(v.representationId,'representation id');return v;}
function durable(input){const v=C.data(input,{bytes:16384,nodes:512});C.keys(v,['identity','commitmentDigest','historyDigest']);identity(v.identity);C.hash(v.commitmentDigest,'commitment digest');C.hash(v.historyDigest,'history digest');return v;}
function lineage(input){const v=C.data(input,{bytes:8192,nodes:256});C.keys(v,['modelVersion','representationVersion','commitmentDigest','historyDigest']);C.version(v.modelVersion);C.version(v.representationVersion);C.hash(v.commitmentDigest,'commitment digest');C.hash(v.historyDigest,'history digest');return v;}
function budgets(input={}){C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','runtime budgets');const out={};for(const key of Object.keys(DEFAULTS)){out[key]=integer(input[key]??DEFAULTS[key],key,1,HARD[key]);}C.assert(out.active<=out.queue,'BUDGET','active must not exceed queue');return Object.freeze(out);}
function estimate(input){C.assert(input&&typeof input==='object'&&!Array.isArray(input),'SCHEMA','resource estimate');C.keys(input,['cpuEstimateBytes','gpuEstimateBytes','entities','operations','transferBytes']);return Object.freeze({
  cpuEstimateBytes:integer(input.cpuEstimateBytes,'cpu estimate bytes',0,HARD.cpuEstimateBytes),
  gpuEstimateBytes:integer(input.gpuEstimateBytes,'gpu estimate bytes',0,HARD.gpuEstimateBytes),
  entities:integer(input.entities,'entities',0,HARD.entities),
  operations:integer(input.operations,'operations',0,HARD.operations),
  transferBytes:integer(input.transferBytes,'transfer bytes',0,HARD.transferBytes)
});}
function compareStates(a,b){return STATE_RANK[state(a)]-STATE_RANK[state(b)];}
function logicalIdentityKey(input){const v=identity(input);return v.providerId+'|'+v.entityId+'|'+v.representationId;}
O.v2x01Contracts=Object.freeze({VERSION,STATES,STATE_RANK,TASK_CLASSES,EVIDENCE_STATES,HARD,DEFAULTS,CLASS_WEIGHTS,integer,state,taskClass,evidenceState,identity,durable,lineage,budgets,estimate,compareStates,logicalIdentityKey});
})(globalThis);
