(function(root){
'use strict';
const O=root.OFU=root.OFU||{},P=O.p2;
if(!P||!O.sha256)throw new Error('V2X-11 gameplay contracts require P2/SHA-256');
const VERSION='ofu-v2x-11-gameplay-contracts-1';
const AUTHORITY='MODEL_DERIVED_SIMULATION';
const enc=new TextEncoder();
const LIMITS=Object.freeze({
  proposalBytes:32768,parameterBytes:16384,parametersNodes:1024,
  targets:1,causes:32,resources:16,effects:64,dagNodes:128,dagEdges:256,
  queue:64,consequencesPerTarget:64,resourceUnits:1000000000,timeMicros:1000000000000
});
const ACTIONS=Object.freeze([
  'SURVEY','MEASURE','SAMPLE','DEPLOY_PROBE','DEPLOY_STATION',
  'RESOURCE_EXTRACT','ECOLOGY_INTERVENTION','ADVANCE_TIME'
]);
const ROUTES=Object.freeze({
  SURVEY:Object.freeze(['evidence']),
  MEASURE:Object.freeze(['evidence']),
  SAMPLE:Object.freeze(['material','evidence']),
  DEPLOY_PROBE:Object.freeze(['infrastructure','evidence']),
  DEPLOY_STATION:Object.freeze(['infrastructure','evidence']),
  RESOURCE_EXTRACT:Object.freeze(['material','civilization']),
  ECOLOGY_INTERVENTION:Object.freeze(['ecology','civilization']),
  ADVANCE_TIME:Object.freeze(['material','ecology','civilization'])
});
function fail(message){throw new Error('OFU V2X-11 gameplay contracts: '+message)}
function record(value,label){if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' must be record');return value}
function exact(value,required,optional=[],label='record'){
  record(value,label);const allow=new Set([...required,...optional]),keys=Reflect.ownKeys(value);
  if(keys.some(k=>typeof k!=='string'))fail(label+' contains symbol key');
  for(const k of keys)if(!allow.has(k))fail(label+' unknown field '+k);
  for(const k of required)if(!Object.prototype.hasOwnProperty.call(value,k))fail(label+' missing field '+k);
}
function text(value,label,max=160){if(typeof value!=='string')fail(label+' must be text');const v=value.normalize('NFC').trim();if(!v.length||v.length>max)fail(label+' invalid length');return v}
function integer(value,label,min=0,max=Number.MAX_SAFE_INTEGER){if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of range');return value}
function hex32(value,label,nullable=false){if(nullable&&value===null)return null;if(typeof value!=='string'||!/^[0-9a-f]{64}$/.test(value))fail(label+' must be lowercase 32-byte hex');return value}
function safe(value,label='value',maxBytes=LIMITS.parameterBytes){let bytes;try{bytes=P.encode(value)}catch(error){fail(label+' is not canonically encodable: '+String(error?.message||error))}if(bytes.length>maxBytes)fail(label+' exceeds byte bound');return P.decode(bytes)}
function digest(tag,value){const body=P.encode(value),prefix=enc.encode(tag+'\0'),all=new Uint8Array(prefix.length+body.length);all.set(prefix);all.set(body,prefix.length);return P.hex(O.sha256.digest(all))}
function normalizeKind(kind){const k=String(kind||'').toUpperCase();if(!ACTIONS.includes(k))fail('unsupported action '+k);return k}
function capability(input){exact(input,['id','version','authority'],[],'capability');const out={id:text(input.id,'capability.id',160),version:text(input.version,'capability.version',64),authority:text(input.authority,'capability.authority',64)};if(out.authority!==AUTHORITY&&out.authority!=='DERIVED')fail('capability authority mismatch');return Object.freeze(out)}
function resourceVector(input=[]){if(!Array.isArray(input)||input.length>LIMITS.resources)fail('resource vector invalid');const out=input.map((x,i)=>{exact(x,['resourceId','units'],[],'resource '+i);return{resourceId:text(x.resourceId,'resourceId',96),units:integer(x.units,'resource units',0,LIMITS.resourceUnits)}}).sort((a,b)=>a.resourceId.localeCompare(b.resourceId));for(let i=1;i<out.length;i++)if(out[i-1].resourceId===out[i].resourceId)fail('duplicate resource '+out[i].resourceId);return Object.freeze(out.map(Object.freeze))}
function cost(input={resources:[],timeMicros:0}){exact(input,['resources','timeMicros'],[],'cost');return Object.freeze({resources:resourceVector(input.resources),timeMicros:integer(input.timeMicros,'cost.timeMicros',0,LIMITS.timeMicros)})}
function causes(input=[]){if(!Array.isArray(input)||input.length>LIMITS.causes)fail('causes invalid');const out=input.map((x,i)=>hex32(x,'cause '+i)).sort();for(let i=1;i<out.length;i++)if(out[i-1]===out[i])fail('duplicate cause');return Object.freeze(out)}
function proposal(input){
  exact(input,['kind','actorId','targetId','operationKey','authority','capability','preconditionStateDigest','cost','parameters','causes'],[],'proposal');
  const material={contract:VERSION,version:'1.0.0',kind:normalizeKind(input.kind),actorId:text(input.actorId,'actorId',128),targetId:hex32(input.targetId,'targetId'),operationKey:text(input.operationKey,'operationKey',192),authority:text(input.authority,'authority',64),capability:capability(input.capability),preconditionStateDigest:hex32(input.preconditionStateDigest,'preconditionStateDigest',true),cost:cost(input.cost),parameters:safe(input.parameters,'parameters'),causes:causes(input.causes)};
  if(material.authority!==AUTHORITY)fail('proposal authority must be '+AUTHORITY);
  const proposalId=digest('OFU-V2X11-ACTION-PROPOSAL-v1',material),out={...material,proposalId};
  if(P.encode(out).length>LIMITS.proposalBytes)fail('proposal exceeds byte bound');return Object.freeze(out);
}
function validateProposal(input){exact(input,['contract','version','kind','actorId','targetId','operationKey','authority','capability','preconditionStateDigest','cost','parameters','causes','proposalId'],[],'proposal');if(input.contract!==VERSION||input.version!=='1.0.0')fail('proposal contract mismatch');const rebuilt=proposal({kind:input.kind,actorId:input.actorId,targetId:input.targetId,operationKey:input.operationKey,authority:input.authority,capability:input.capability,preconditionStateDigest:input.preconditionStateDigest,cost:input.cost,parameters:input.parameters,causes:input.causes});if(rebuilt.proposalId!==input.proposalId)fail('proposal digest mismatch');return rebuilt}
function effect(input){
  exact(input,['domain','kind','targetId','dependsOn','authority','payload'],[],'effect');
  const material={contract:VERSION,version:'1.0.0',domain:text(input.domain,'effect.domain',96),kind:text(input.kind,'effect.kind',128),targetId:hex32(input.targetId,'effect.targetId'),dependsOn:causes(input.dependsOn),authority:text(input.authority,'effect.authority',64),payload:safe(input.payload,'effect payload')};
  if(material.authority!==AUTHORITY&&material.authority!=='DERIVED')fail('effect authority mismatch');return Object.freeze({...material,effectId:digest('OFU-V2X11-EFFECT-v1',material)});
}
function receipt(input){
  exact(input,['proposalId','targetId','status','reason','eventId','stateDigest','elapsedMicros','resourceBalances','effects','authority','canonicalMutation'],[],'receipt');
  const statuses=['ADMITTED','REJECTED_CAPABILITY','REJECTED_TARGET','REJECTED_PRECONDITION','REJECTED_RESOURCE_BUDGET','REJECTED_TIME_BUDGET','REJECTED_AUTHORITY','UNSUPPORTED_DOMAIN_EFFECT','DEPENDENCY_BLOCKED'];
  const status=text(input.status,'receipt.status',64);if(!statuses.includes(status))fail('unknown receipt status');
  if(input.canonicalMutation!==false)fail('gameplay receipt cannot claim canonical mutation');
  const balances=resourceVector(input.resourceBalances),effects=Array.isArray(input.effects)?input.effects.map(x=>safe(x,'receipt effect',LIMITS.parameterBytes)):fail('receipt.effects invalid');if(effects.length>LIMITS.effects)fail('receipt effects bound');
  return Object.freeze({contract:VERSION,version:'1.0.0',proposalId:hex32(input.proposalId,'receipt.proposalId'),targetId:hex32(input.targetId,'receipt.targetId'),status,reason:input.reason===null?null:text(input.reason,'receipt.reason',256),eventId:input.eventId===null?null:hex32(input.eventId,'receipt.eventId'),stateDigest:input.stateDigest===null?null:hex32(input.stateDigest,'receipt.stateDigest'),elapsedMicros:integer(input.elapsedMicros,'receipt.elapsedMicros',0,LIMITS.timeMicros),resourceBalances:balances,effects:Object.freeze(effects),authority:text(input.authority,'receipt.authority',64),canonicalMutation:false});
}
O.v2x11GameplayContracts=Object.freeze({VERSION,AUTHORITY,LIMITS,ACTIONS,ROUTES,exact,text,integer,hex32,safe,digest,normalizeKind,capability,resourceVector,cost,causes,proposal,validateProposal,effect,receipt});
})(typeof globalThis!=='undefined'?globalThis:this);
