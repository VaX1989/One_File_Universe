(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2;if(!P)throw new Error('P4 requires frozen P2 kernel');
const E=new TextEncoder();
const VERSION='ofu-p4-temporal-v1';
const EVENT_SCHEMA=1n,CHECKPOINT_SCHEMA=1n,ARCHIVE_SCHEMA=1n;
const U64_MAX=(1n<<64n)-1n;
const MAX_EVENTS=100000;
const MAX_TARGETS=64;
const MAX_CAUSES=64;
const LOD=Object.freeze({COLD:0,WARM:1,HOT:2,IMMEDIATE:3});
function fail(m){throw new Error('OFU temporal: '+m)}
function isBytes(v,n){return v instanceof Uint8Array&&(n===undefined||v.length===n)}
function hex(b){return P.hex(b)}
function cmpBytes(a,b){for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];return a.length-b.length}
function equalBytes(a,b){return isBytes(a)&&isBytes(b)&&a.length===b.length&&cmpBytes(a,b)===0}
function shaDomain(tag,value){return O.sha256.digest(concat(E.encode(tag+'\0'),P.encode(value)))}
function concat(...parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function u64(v,name){if(typeof v==='number'){if(!Number.isSafeInteger(v))fail(name+' must be u64');v=BigInt(v)}if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(name+' must be u64');return v}
function text(v,name){if(typeof v!=='string'||!v.length)fail(name+' must be non-empty text');P.encode(v);return v.normalize('NFC')}
function exactKeys(o,allowed,name){if(!o||typeof o!=='object'||Array.isArray(o))fail(name+' must be map');const keys=Object.keys(o).sort(),want=[...allowed].sort();if(keys.length!==want.length||keys.some((k,i)=>k!==want[i]))fail(name+' has missing or unknown fields')}
function bytes32(v,name){if(!isBytes(v,32))fail(name+' must be 32 bytes');return new Uint8Array(v)}
function canonicalTime(t){exactKeys(t,['seconds','micros'],'time');const seconds=u64(t.seconds,'time.seconds'),micros=u64(t.micros,'time.micros');if(micros>=1000000n)fail('time.micros out of range');return{seconds,micros}}
function compareTime(a,b){return a.seconds<b.seconds?-1:a.seconds>b.seconds?1:a.micros<b.micros?-1:a.micros>b.micros?1:0}
function canonicalByteList(list,name,max){if(!Array.isArray(list)||list.length>max)fail(name+' invalid');const out=list.map((v,i)=>bytes32(v,name+'['+i+']'));out.sort(cmpBytes);for(let i=1;i<out.length;i++)if(cmpBytes(out[i-1],out[i])===0)fail(name+' contains duplicate');return out}
function eventDescriptor(input){
  exactKeys(input,['universeIdentity','lineageId','time','type','version','operationKey','targets','payload','causes','preconditionStateDigest'],'event');
  const d={
    eventSchemaVersion:EVENT_SCHEMA,
    temporalProtocolVersion:VERSION,
    universeIdentity:bytes32(input.universeIdentity,'universeIdentity'),
    lineageId:bytes32(input.lineageId,'lineageId'),
    time:canonicalTime(input.time),
    type:text(input.type,'event.type'),
    version:u64(input.version,'event.version'),
    operationKey:text(input.operationKey,'event.operationKey'),
    targets:canonicalByteList(input.targets,'event.targets',MAX_TARGETS),
    payload:input.payload,
    causes:canonicalByteList(input.causes,'event.causes',MAX_CAUSES),
    preconditionStateDigest:input.preconditionStateDigest===null?null:bytes32(input.preconditionStateDigest,'preconditionStateDigest')
  };
  if(d.version<1n)fail('event.version must be positive');P.encode(d.payload);return d;
}
function canonicalEvent(input){const descriptor=eventDescriptor(input);const id=shaDomain('OFU-P4-EVENT-v1',descriptor);return Object.freeze({id,descriptor})}
function compareEvents(a,b){const ta=a.descriptor.time,tb=b.descriptor.time,c=compareTime(ta,tb);return c||cmpBytes(a.id,b.id)}
function sortEvents(events){if(!Array.isArray(events)||events.length>MAX_EVENTS)fail('event collection invalid');const out=[...events];out.sort(compareEvents);for(let i=1;i<out.length;i++)if(equalBytes(out[i-1].id,out[i].id))out.splice(i--,1);return out}
function lineageId(universeIdentity,parentCheckpointId=null,branchKey='canonical'){return shaDomain('OFU-P4-LINEAGE-v1',{universeIdentity:bytes32(universeIdentity,'universeIdentity'),parentCheckpointId:parentCheckpointId===null?null:bytes32(parentCheckpointId,'parentCheckpointId'),branchKey:text(branchKey,'branchKey')})}
function emptyEntity(){return{fields:Object.create(null),counters:Object.create(null),sets:Object.create(null),relations:Object.create(null),tombstoned:false}}
function cloneValue(v){return P.decode(P.encode(v))}
function cloneState(state){return P.decode(P.encode(state))}
function entityKey(id){return hex(bytes32(id,'entity id'))}
function ensureEntity(state,id){const k=entityKey(id);if(!state.entities[k])state.entities[k]=emptyEntity();return state.entities[k]}
function requireSingleTarget(event){if(event.descriptor.targets.length!==1)fail(event.descriptor.type+' requires one target');return event.descriptor.targets[0]}
function requirePayloadMap(p,name){if(!p||typeof p!=='object'||Array.isArray(p))fail(name+' payload must be map');return p}
function builtinRegistry(){
  const r=new Map();
  r.set('core.field.set@1',(s,e)=>{const p=requirePayloadMap(e.descriptor.payload,'field.set');exactKeys(p,['field','value'],'field.set payload');const ent=ensureEntity(s,requireSingleTarget(e));ent.fields[text(p.field,'field')]=cloneValue(p.value)});
  r.set('core.counter.add@1',(s,e)=>{const p=requirePayloadMap(e.descriptor.payload,'counter.add');exactKeys(p,['counter','delta'],'counter.add payload');const ent=ensureEntity(s,requireSingleTarget(e)),k=text(p.counter,'counter'),d=BigInt(p.delta);ent.counters[k]=(ent.counters[k]||0n)+d;P.encode(ent.counters[k])});
  r.set('core.set.add@1',(s,e)=>{const p=requirePayloadMap(e.descriptor.payload,'set.add');exactKeys(p,['set','member'],'set.add payload');const ent=ensureEntity(s,requireSingleTarget(e)),k=text(p.set,'set'),m=hex(bytes32(p.member,'member'));ent.sets[k]=ent.sets[k]||Object.create(null);ent.sets[k][m]=true});
  r.set('core.set.remove@1',(s,e)=>{const p=requirePayloadMap(e.descriptor.payload,'set.remove');exactKeys(p,['set','member'],'set.remove payload');const ent=ensureEntity(s,requireSingleTarget(e)),k=text(p.set,'set'),m=hex(bytes32(p.member,'member'));if(ent.sets[k])delete ent.sets[k][m]});
  r.set('core.relation.set@1',(s,e)=>{const p=requirePayloadMap(e.descriptor.payload,'relation.set');exactKeys(p,['relation','target'],'relation.set payload');const ent=ensureEntity(s,requireSingleTarget(e)),k=text(p.relation,'relation');ent.relations[k]=p.target===null?null:hex(bytes32(p.target,'relation target'))});
  r.set('core.tombstone.set@1',(s,e)=>{const p=requirePayloadMap(e.descriptor.payload,'tombstone.set');exactKeys(p,['value'],'tombstone.set payload');if(typeof p.value!=='boolean')fail('tombstone value must be boolean');ensureEntity(s,requireSingleTarget(e)).tombstoned=p.value});
  return r;
}
function registryKey(event){return event.descriptor.type+'@'+event.descriptor.version.toString()}
function initialState(universeIdentity,lineage,baseline={}){P.encode(baseline);return{temporalProtocolVersion:VERSION,universeIdentity:bytes32(universeIdentity,'universeIdentity'),lineageId:bytes32(lineage,'lineageId'),baseline:cloneValue(baseline),entities:Object.create(null)}}
function applyEvent(state,event,registry){if(!equalBytes(state.universeIdentity,event.descriptor.universeIdentity))fail('event universe mismatch');if(!equalBytes(state.lineageId,event.descriptor.lineageId))fail('event lineage mismatch');const fn=registry.get(registryKey(event));if(!fn)fail('unsupported event type/version '+registryKey(event));fn(state,event);return state}
function stateDigest(state){return shaDomain('OFU-P4-STATE-v1',state)}
function replay({universeIdentity,lineage,baseline={},events=[],registry=builtinRegistry()}){const sorted=sortEvents(events),state=initialState(universeIdentity,lineage,baseline);for(const e of sorted)applyEvent(state,e,registry);return{state,digest:stateDigest(state),events:sorted}}
function eventRoot(events){return shaDomain('OFU-P4-EVENT-ROOT-v1',sortEvents(events).map(e=>e.id))}
function checkpoint({universeIdentity,lineage,baseline={},events=[],registry=builtinRegistry()}){const r=replay({universeIdentity,lineage,baseline,events,registry}),last=r.events.length?r.events[r.events.length-1]:null;const descriptor={checkpointSchemaVersion:CHECKPOINT_SCHEMA,temporalProtocolVersion:VERSION,universeIdentity:bytes32(universeIdentity,'universeIdentity'),lineageId:bytes32(lineage,'lineageId'),coveredEventCount:BigInt(r.events.length),coveredEventRoot:eventRoot(r.events),lastOrderKey:last?{time:last.descriptor.time,eventId:last.id}:null,state:r.state,stateDigest:r.digest};const id=shaDomain('OFU-P4-CHECKPOINT-v1',descriptor);return Object.freeze({id,descriptor})}
function replayFromCheckpoint({checkpoint:cp,events=[],registry=builtinRegistry()}){if(!cp||!cp.descriptor)fail('checkpoint missing');const d=cp.descriptor;if(d.checkpointSchemaVersion!==CHECKPOINT_SCHEMA||d.temporalProtocolVersion!==VERSION)fail('unsupported checkpoint version');if(!equalBytes(stateDigest(d.state),d.stateDigest))fail('checkpoint state digest mismatch');const state=cloneState(d.state),sorted=sortEvents(events);for(const e of sorted){if(!equalBytes(e.descriptor.universeIdentity,d.universeIdentity)||!equalBytes(e.descriptor.lineageId,d.lineageId))fail('checkpoint suffix lineage mismatch');if(d.lastOrderKey&&compareTime(e.descriptor.time,d.lastOrderKey.time)<0)fail('event predates checkpoint');applyEvent(state,e,registry)}return{state,digest:stateDigest(state),events:sorted}}
function compact({universeIdentity,lineage,baseline={},events=[],keepTail=128,registry=builtinRegistry()}){if(!Number.isInteger(keepTail)||keepTail<0)fail('keepTail invalid');const sorted=sortEvents(events),cut=Math.max(0,sorted.length-keepTail),prefix=sorted.slice(0,cut),suffix=sorted.slice(cut);const cp=checkpoint({universeIdentity,lineage,baseline,events:prefix,registry});return{checkpoint:cp,events:suffix,discardedEventCount:BigInt(prefix.length)}}
function eventRecord(e){return{id:e.id,descriptor:e.descriptor}}
function archivePayload({universeIdentity,lineage,baseline={},events=[],checkpoint:cp=null}){const sorted=sortEvents(events);return{archiveSchemaVersion:ARCHIVE_SCHEMA,temporalProtocolVersion:VERSION,universeIdentity:bytes32(universeIdentity,'universeIdentity'),lineageId:bytes32(lineage,'lineageId'),baseline:cloneValue(baseline),checkpoint:cp?{id:cp.id,descriptor:cp.descriptor}:null,events:sorted.map(eventRecord)}}
function exportArchive(input){const payload=archivePayload(input),integrity=shaDomain('OFU-P4-ARCHIVE-v1',payload);return P.encode({format:'OFU-P4-ARCHIVE',payload,integrity})}
function importArchive(bytes){const c=P.decode(bytes);exactKeys(c,['format','payload','integrity'],'archive container');if(c.format!=='OFU-P4-ARCHIVE')fail('unsupported archive format');const p=c.payload;if(p.archiveSchemaVersion!==ARCHIVE_SCHEMA||p.temporalProtocolVersion!==VERSION)fail('unsupported archive version');if(!equalBytes(shaDomain('OFU-P4-ARCHIVE-v1',p),c.integrity))fail('archive integrity mismatch');const events=p.events.map(r=>{exactKeys(r,['id','descriptor'],'event record');const e=canonicalEvent({universeIdentity:r.descriptor.universeIdentity,lineageId:r.descriptor.lineageId,time:r.descriptor.time,type:r.descriptor.type,version:r.descriptor.version,operationKey:r.descriptor.operationKey,targets:r.descriptor.targets,payload:r.descriptor.payload,causes:r.descriptor.causes,preconditionStateDigest:r.descriptor.preconditionStateDigest});if(!equalBytes(e.id,r.id))fail('event id mismatch');return e});let cp=null;if(p.checkpoint){cp={id:p.checkpoint.id,descriptor:p.checkpoint.descriptor};if(!equalBytes(shaDomain('OFU-P4-CHECKPOINT-v1',cp.descriptor),cp.id))fail('checkpoint id mismatch');if(!equalBytes(stateDigest(cp.descriptor.state),cp.descriptor.stateDigest))fail('checkpoint state digest mismatch')}return{universeIdentity:p.universeIdentity,lineage:p.lineageId,baseline:p.baseline,events,checkpoint:cp}}
function commit({world,command,registry=builtinRegistry()}){if(!world||!Array.isArray(world.events))fail('world invalid');const current=replay({universeIdentity:world.universeIdentity,lineage:world.lineage,baseline:world.baseline,events:world.events,registry});if(command.preconditionStateDigest!==null&&!equalBytes(command.preconditionStateDigest,current.digest))fail('precondition failed');const ev=canonicalEvent(command),exists=current.events.some(x=>equalBytes(x.id,ev.id));if(exists)return{world:{...world,events:current.events},event:ev,duplicate:true,state:current.state,digest:current.digest};const nextEvents=sortEvents([...current.events,ev]),next=replay({universeIdentity:world.universeIdentity,lineage:world.lineage,baseline:world.baseline,events:nextEvents,registry});return{world:{...world,events:nextEvents},event:ev,duplicate:false,state:next.state,digest:next.digest}}
function schedule(items){if(!Array.isArray(items))fail('scheduler items invalid');const normalized=items.map((x,i)=>{exactKeys(x,['id','tier','due'],'scheduler item '+i);const tier=text(x.tier,'scheduler tier');if(!(tier in LOD))fail('unknown scheduler tier');return{id:bytes32(x.id,'scheduler id'),tier,due:canonicalTime(x.due)}});normalized.sort((a,b)=>compareTime(a.due,b.due)||LOD[b.tier]-LOD[a.tier]||cmpBytes(a.id,b.id));return normalized}
O.p4=Object.freeze({VERSION,EVENT_SCHEMA,CHECKPOINT_SCHEMA,ARCHIVE_SCHEMA,LOD,canonicalTime,compareTime,lineageId,canonicalEvent,compareEvents,sortEvents,builtinRegistry,initialState,replay,stateDigest,eventRoot,checkpoint,replayFromCheckpoint,compact,exportArchive,importArchive,commit,schedule});
})(typeof globalThis!=='undefined'?globalThis:this);
