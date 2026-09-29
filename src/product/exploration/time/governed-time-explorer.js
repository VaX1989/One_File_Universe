import {
  W1_CONTRACTS,
  W1_OBSERVATION_KIND,
  createSavedObservation,
  parseW1Contract,
  serializeW1Contract
} from '../../contracts/w1-observation-contracts.js';

export const TIME_EXPLORER_VERSION=1;
export const TIME_REFERENCE_CONTRACT='ofu-prod-w2-time-reference-1';
export const TIME_PLAN_CONTRACT='ofu-prod-w2-time-plan-1';
export const TIME_PRODUCT_PROJECTION_CONTRACT='ofu-prod-w2-time-product-projection-1';
export const TIME_REFERENCE_AUTHORITY='REFERENCE_ONLY';
export const TIME_PRESENTATION_AUTHORITY='PRESENTATION_ONLY';
export const TIME_P4_AUTHORITY='CANONICAL_P4';
export const TIME_SUPPORT_MODE=Object.freeze({
  REFERENCE_ONLY:'REFERENCE_ONLY',
  EXACT_INTERVALS:'EXACT_INTERVALS'
});
export const TIME_MODEL_AUTHORITY=Object.freeze({
  CANONICAL:'CANONICAL',
  MODEL_DERIVED:'MODEL_DERIVED'
});
export const TIME_DEFAULT_LIMITS=Object.freeze({maxMaterializedReferences:16,maxSerializedReferenceBytes:65536});

const enc=new TextEncoder();
const U64_MAX=(1n<<64n)-1n;
const MODEL_AUTHORITIES=new Set(Object.values(TIME_MODEL_AUTHORITY));
const SUPPORT_MODES=new Set(Object.values(TIME_SUPPORT_MODE));

function fail(message){throw new Error('OFU Time Explorer: '+message)}
function plain(value){if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);return p===Object.prototype||p===null}
function exactKeys(value,expected,label){if(!plain(value))fail(label+' must be a plain object');const keys=Object.keys(value).sort(),want=[...expected].sort();if(keys.length!==want.length||keys.some((key,index)=>key!==want[index]))fail(label+' has missing or unsupported fields')}
function text(value,label,{nullable=false,maxBytes=512}={}){if(value===null&&nullable)return null;if(typeof value!=='string')fail(label+' must be text');const normalized=value.normalize('NFC');if(!normalized.length)fail(label+' must be non-empty');if(enc.encode(normalized).length>maxBytes)fail(label+' exceeds byte limit');return normalized}
function enumValue(value,allowed,label){const normalized=text(value,label);if(!allowed.has(normalized))fail(label+' is unsupported: '+normalized);return normalized}
function integerText(value,label,{positive=false}={}){let out;if(typeof value==='bigint')out=value.toString();else if(typeof value==='number'){if(!Number.isSafeInteger(value))fail(label+' number must be a safe integer');out=String(value)}else if(typeof value==='string')out=value;else fail(label+' must be an integer or decimal integer text');if(!/^(0|[1-9][0-9]*)$/.test(out))fail(label+' is not canonical unsigned decimal text');const n=BigInt(out);if(n>U64_MAX)fail(label+' exceeds u64 range');if(positive&&n===0n)fail(label+' must be positive');return out}
function boundedInteger(value,label,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of bounds');return value}
function clone(value){return value===null?null:JSON.parse(JSON.stringify(value))}
function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item)}return value}

function canonicalTime(value,label='canonical time'){
  exactKeys(value,['seconds','micros'],label);
  const seconds=integerText(value.seconds,label+'.seconds'),micros=integerText(value.micros,label+'.micros');
  if(BigInt(micros)>=1000000n)fail(label+'.micros out of range');
  return Object.freeze({seconds,micros});
}
function timeMicros(value){const t=canonicalTime(value);return BigInt(t.seconds)*1000000n+BigInt(t.micros)}
export function compareCanonicalTime(a,b){const av=timeMicros(a),bv=timeMicros(b);return av<bv?-1:av>bv?1:0}
function timeFromMicros(total,label='canonical time'){if(typeof total!=='bigint'||total<0n)fail(label+' is negative');const seconds=total/1000000n,micros=total%1000000n;if(seconds>U64_MAX)fail(label+' exceeds P4 u64 seconds');return Object.freeze({seconds:seconds.toString(),micros:micros.toString()})}
function sameTime(a,b){return compareCanonicalTime(a,b)===0}

function normalizeModel(value,label='time model'){
  exactKeys(value,['contractId','semanticVersion'],label);
  const contractId=text(value.contractId,label+'.contractId',{maxBytes:256}),semanticVersion=text(value.semanticVersion,label+'.semanticVersion',{maxBytes:64});
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(semanticVersion))fail(label+'.semanticVersion must be SemVer core');
  return Object.freeze({contractId,semanticVersion});
}
function sameModel(a,b){return a.contractId===b.contractId&&a.semanticVersion===b.semanticVersion}
function modelLabel(model){return model.contractId+'@'+model.semanticVersion}

function normalizeIntervals(value,supportMode){
  if(!Array.isArray(value)||value.length>64)fail('supported intervals must be a bounded array');
  const intervals=value.map((item,index)=>{exactKeys(item,['start','end'],'supported interval '+index);const start=canonicalTime(item.start,'supported interval '+index+'.start'),end=canonicalTime(item.end,'supported interval '+index+'.end');if(compareCanonicalTime(start,end)>0)fail('supported interval '+index+' is reversed');return{start,end}}).sort((a,b)=>compareCanonicalTime(a.start,b.start)||compareCanonicalTime(a.end,b.end));
  for(let i=1;i<intervals.length;i++)if(compareCanonicalTime(intervals[i-1].end,intervals[i].start)>=0)fail('supported intervals overlap');
  if(supportMode===TIME_SUPPORT_MODE.EXACT_INTERVALS&&!intervals.length)fail('EXACT_INTERVALS requires at least one interval');
  if(supportMode===TIME_SUPPORT_MODE.REFERENCE_ONLY&&intervals.length)fail('REFERENCE_ONLY cannot declare historical intervals');
  return Object.freeze(intervals.map(x=>Object.freeze(x)));
}
function timeSupported(domain,time){return domain.supportMode===TIME_SUPPORT_MODE.EXACT_INTERVALS&&domain.intervals.some(interval=>compareCanonicalTime(time,interval.start)>=0&&compareCanonicalTime(time,interval.end)<=0)}
function normalizeEpochs(value,domainIntervals,supportMode){
  if(!Array.isArray(value)||value.length>64)fail('epochs must be a bounded array');
  const epochs=value.map((item,index)=>{exactKeys(item,['id','time'],'epoch '+index);return{id:text(item.id,'epoch id',{maxBytes:128}),time:canonicalTime(item.time,'epoch '+index+'.time')}}).sort((a,b)=>a.id.localeCompare(b.id));
  for(let i=1;i<epochs.length;i++)if(epochs[i-1].id===epochs[i].id)fail('duplicate epoch id');
  if(supportMode===TIME_SUPPORT_MODE.REFERENCE_ONLY&&epochs.length)fail('REFERENCE_ONLY cannot declare historical epochs');
  if(supportMode===TIME_SUPPORT_MODE.EXACT_INTERVALS)for(const epoch of epochs)if(!domainIntervals.some(interval=>compareCanonicalTime(epoch.time,interval.start)>=0&&compareCanonicalTime(epoch.time,interval.end)<=0))fail('epoch '+epoch.id+' lies outside supported intervals');
  return Object.freeze(epochs.map(x=>Object.freeze(x)));
}
function normalizeDomain(value){
  exactKeys(value,['id','model','authority','supportMode','intervals','stepMicros','epochs','resolveExact'],'time domain');
  const id=text(value.id,'time domain id',{maxBytes:128}),model=normalizeModel(value.model),authority=enumValue(value.authority,MODEL_AUTHORITIES,'time model authority'),supportMode=enumValue(value.supportMode,SUPPORT_MODES,'time support mode'),intervals=normalizeIntervals(value.intervals,supportMode),stepMicros=value.stepMicros===null?null:integerText(value.stepMicros,'stepMicros',{positive:true}),epochs=normalizeEpochs(value.epochs,intervals,supportMode);
  if(supportMode===TIME_SUPPORT_MODE.EXACT_INTERVALS&&typeof value.resolveExact!=='function')fail('EXACT_INTERVALS requires resolveExact');
  if(supportMode===TIME_SUPPORT_MODE.REFERENCE_ONLY&&value.resolveExact!==null)fail('REFERENCE_ONLY resolveExact must be null');
  return Object.freeze({id,model,authority,supportMode,intervals,stepMicros,epochs,resolveExact:value.resolveExact});
}
function normalizeLimits(input={}){if(!plain(input))fail('limits must be a plain object');for(const key of Object.keys(input))if(!['maxMaterializedReferences','maxSerializedReferenceBytes'].includes(key))fail('limits has unsupported fields');return Object.freeze({maxMaterializedReferences:boundedInteger(input.maxMaterializedReferences??TIME_DEFAULT_LIMITS.maxMaterializedReferences,'maxMaterializedReferences',1,256),maxSerializedReferenceBytes:boundedInteger(input.maxSerializedReferenceBytes??TIME_DEFAULT_LIMITS.maxSerializedReferenceBytes,'maxSerializedReferenceBytes',1024,1024*1024)})}
function normalizeP4StateRef(value){const serialized=serializeW1Contract(value),normalized=parseW1Contract(serialized);if(normalized.contract!==W1_CONTRACTS.P4_STATE_REF)fail('reference is not a W1 P4 state ref');return normalized}
function referenceTime(p4StateRef){return p4StateRef.frontier===null?Object.freeze({seconds:'0',micros:'0'}):canonicalTime({seconds:p4StateRef.frontier.seconds,micros:p4StateRef.frontier.micros},'P4 frontier time')}
function normalizeSubject(value){if(!value||value.contract!==W1_CONTRACTS.CANONICAL_ENTITY_REF)fail('subject must be a W1 canonical entity ref');const wrapper=createSavedObservation({kind:W1_OBSERVATION_KIND.PLACE,subject:value,temporalRef:null,scientificFingerprintRef:null,returnRef:null,label:null});return wrapper.subject}
function normalizeProductContext(value,subject,p4StateRef){
  exactKeys(value,['atlasEntryId','atlasKind','returnRef','scientificFingerprintRef'],'product context');
  const atlasEntryId=text(value.atlasEntryId,'atlas entry id',{maxBytes:128}),atlasKind=enumValue(value.atlasKind,new Set(Object.values(W1_OBSERVATION_KIND)),'atlas kind');
  const validated=createSavedObservation({kind:W1_OBSERVATION_KIND.SNAPSHOT,subject,temporalRef:p4StateRef,scientificFingerprintRef:value.scientificFingerprintRef,returnRef:value.returnRef,label:null});
  return Object.freeze({atlasEntryId,atlasKind,returnRef:clone(validated.returnRef),scientificFingerprintRef:clone(validated.scientificFingerprintRef)});
}
function buildReference({domain,subject,p4StateRef,productContext}){
  const normalizedP4=normalizeP4StateRef(p4StateRef),time=referenceTime(normalizedP4),normalizedSubject=normalizeSubject(subject),ctx=normalizeProductContext(productContext,normalizedSubject,normalizedP4);
  return deepFreeze({schemaVersion:TIME_EXPLORER_VERSION,contract:TIME_REFERENCE_CONTRACT,authority:TIME_REFERENCE_AUTHORITY,timeAuthority:TIME_P4_AUTHORITY,domainId:domain.id,model:clone(domain.model),modelAuthority:domain.authority,universeIdentity:normalizedP4.universeIdentity,lineageId:normalizedP4.lineageId,subject:clone(normalizedSubject),canonicalTime:clone(time),p4StateRef:clone(normalizedP4),productContext:clone(ctx)});
}
function normalizeReference(value){
  exactKeys(value,['schemaVersion','contract','authority','timeAuthority','domainId','model','modelAuthority','universeIdentity','lineageId','subject','canonicalTime','p4StateRef','productContext'],'temporal reference');
  if(value.schemaVersion!==TIME_EXPLORER_VERSION||value.contract!==TIME_REFERENCE_CONTRACT)fail('unsupported temporal reference contract');
  if(value.authority!==TIME_REFERENCE_AUTHORITY||value.timeAuthority!==TIME_P4_AUTHORITY)fail('temporal reference authority mismatch');
  const domainId=text(value.domainId,'reference domainId',{maxBytes:128}),model=normalizeModel(value.model,'reference model'),modelAuthority=enumValue(value.modelAuthority,MODEL_AUTHORITIES,'reference model authority'),subject=normalizeSubject(value.subject),p4StateRef=normalizeP4StateRef(value.p4StateRef),canonical=canonicalTime(value.canonicalTime,'reference canonicalTime'),productContext=normalizeProductContext(value.productContext,subject,p4StateRef);
  if(p4StateRef.universeIdentity!==text(value.universeIdentity,'reference universeIdentity',{maxBytes:64}).toLowerCase())fail('temporal reference universe mismatch');
  if(p4StateRef.lineageId!==text(value.lineageId,'reference lineageId',{maxBytes:64}).toLowerCase())fail('temporal reference lineage mismatch');
  if(!sameTime(canonical,referenceTime(p4StateRef)))fail('temporal reference time/P4 frontier mismatch');
  return deepFreeze({schemaVersion:TIME_EXPLORER_VERSION,contract:TIME_REFERENCE_CONTRACT,authority:TIME_REFERENCE_AUTHORITY,timeAuthority:TIME_P4_AUTHORITY,domainId,model:clone(model),modelAuthority,universeIdentity:p4StateRef.universeIdentity,lineageId:p4StateRef.lineageId,subject:clone(subject),canonicalTime:clone(canonical),p4StateRef:clone(p4StateRef),productContext:clone(productContext)});
}
function buildPlan(reference,targetTime,resolution){
  const target=canonicalTime(targetTime,'target time'),direction=compareCanonicalTime(target,reference.canonicalTime)<0?'REVERSE':compareCanonicalTime(target,reference.canonicalTime)>0?'FORWARD':'SAME';
  return deepFreeze({schemaVersion:TIME_EXPLORER_VERSION,contract:TIME_PLAN_CONTRACT,authority:TIME_REFERENCE_AUTHORITY,timeAuthority:TIME_P4_AUTHORITY,domainId:reference.domainId,model:clone(reference.model),sourceReference:clone(reference),targetTime:clone(target),direction,resolution,canonicalMutation:false,cameraMutation:false,timelineAuthorityCreated:false});
}
function normalizePlan(value){
  exactKeys(value,['schemaVersion','contract','authority','timeAuthority','domainId','model','sourceReference','targetTime','direction','resolution','canonicalMutation','cameraMutation','timelineAuthorityCreated'],'temporal plan');
  if(value.schemaVersion!==TIME_EXPLORER_VERSION||value.contract!==TIME_PLAN_CONTRACT||value.authority!==TIME_REFERENCE_AUTHORITY||value.timeAuthority!==TIME_P4_AUTHORITY)fail('temporal plan contract mismatch');
  const sourceReference=normalizeReference(value.sourceReference),targetTime=canonicalTime(value.targetTime,'plan targetTime'),domainId=text(value.domainId,'plan domainId',{maxBytes:128}),model=normalizeModel(value.model,'plan model');
  if(domainId!==sourceReference.domainId||!sameModel(model,sourceReference.model))fail('temporal plan source binding mismatch');
  const expectedDirection=compareCanonicalTime(targetTime,sourceReference.canonicalTime)<0?'REVERSE':compareCanonicalTime(targetTime,sourceReference.canonicalTime)>0?'FORWARD':'SAME';
  if(value.direction!==expectedDirection)fail('temporal plan direction mismatch');
  if(!['REFERENCE_REUSE','DOMAIN_RESOLUTION'].includes(value.resolution))fail('temporal plan resolution unsupported');
  if(value.canonicalMutation!==false||value.cameraMutation!==false||value.timelineAuthorityCreated!==false)fail('temporal plan may not claim mutation authority');
  return buildPlan(sourceReference,targetTime,value.resolution);
}
function aborted(signal){return Boolean(signal&&signal.aborted)}

export function createGovernedTimeExplorer({atlas,domains,limits:limitInput={}}={}){
  if(!atlas||typeof atlas.revisitPlan!=='function'||typeof atlas.saveObservation!=='function')fail('Atlas core interface is required');
  if(!Array.isArray(domains)||!domains.length||domains.length>64)fail('domains must be a bounded non-empty array');
  const limits=normalizeLimits(limitInput),domainMap=new Map();
  for(const input of domains){const domain=normalizeDomain(input);if(domainMap.has(domain.id))fail('duplicate time domain: '+domain.id);domainMap.set(domain.id,domain)}
  const cache=new Map();let generation=0;
  function domain(id){const key=text(id,'domain id',{maxBytes:128}),found=domainMap.get(key);if(!found)fail('unsupported time domain: '+key);return found}
  function assertModelBinding(reference,d){if(reference.domainId!==d.id||!sameModel(reference.model,d.model)||reference.modelAuthority!==d.authority)fail('time model version/authority mismatch for '+reference.domainId)}
  function referenceFromAtlas({entryId,domainId,model:expectedModel}={}){
    const d=domain(domainId),requestedModel=normalizeModel(expectedModel,'requested time model');
    if(!sameModel(requestedModel,d.model))fail('requested time model version mismatch for '+d.id);
    const plan=atlas.revisitPlan(text(entryId,'atlas entry id',{maxBytes:128}));
    if(!plan||plan.contract!=='ofu-prod-w1-atlas-revisit-plan-1'||plan.authority!=='REFERENCE_ONLY')fail('Atlas revisit plan contract mismatch');
    if(plan.mutatesWorld!==false||plan.mutatesSelection!==false||plan.mutatesCamera!==false)fail('Atlas revisit plan violates reference-only boundary');
    if(!plan.exactTemporalStateReference||plan.temporalRef===null)fail('Atlas entry has no exact P4 temporal reference');
    return buildReference({domain:d,subject:plan.subject,p4StateRef:plan.temporalRef,productContext:{atlasEntryId:plan.atlasEntryId,atlasKind:plan.kind,returnRef:plan.returnRef,scientificFingerprintRef:plan.scientificFingerprintRef}});
  }
  function serializeReference(value){const reference=normalizeReference(value),output=JSON.stringify(reference);if(enc.encode(output).length>limits.maxSerializedReferenceBytes)fail('serialized temporal reference exceeds byte limit');return output}
  function parseReference(serialized){if(typeof serialized!=='string')fail('serialized temporal reference must be text');if(enc.encode(serialized).length>limits.maxSerializedReferenceBytes)fail('serialized temporal reference exceeds byte limit');let raw;try{raw=JSON.parse(serialized)}catch{fail('malformed temporal reference JSON')}const reference=normalizeReference(raw),canonical=JSON.stringify(reference);if(canonical!==serialized)fail('serialized temporal reference is not canonical');const d=domain(reference.domainId);assertModelBinding(reference,d);return reference}
  function planTo({reference,targetTime}={}){
    const ref=normalizeReference(reference),d=domain(ref.domainId);assertModelBinding(ref,d);const target=canonicalTime(targetTime,'target time');
    if(sameTime(target,ref.canonicalTime))return buildPlan(ref,target,'REFERENCE_REUSE');
    if(d.supportMode!==TIME_SUPPORT_MODE.EXACT_INTERVALS||!timeSupported(d,target))fail('historical interval unsupported for '+d.id);
    return buildPlan(ref,target,'DOMAIN_RESOLUTION');
  }
  function planStep({reference,steps=1}={}){
    const ref=normalizeReference(reference),d=domain(ref.domainId);assertModelBinding(ref,d);if(d.stepMicros===null)fail('domain has no governed step size');if(!Number.isSafeInteger(steps)||steps===0||Math.abs(steps)>1000000)fail('step count out of bounds');const target=timeMicros(ref.canonicalTime)+BigInt(steps)*BigInt(d.stepMicros);return planTo({reference:ref,targetTime:timeFromMicros(target,'stepped time')});
  }
  function planEpoch({reference,epochId}={}){
    const ref=normalizeReference(reference),d=domain(ref.domainId);assertModelBinding(ref,d);const id=text(epochId,'epoch id',{maxBytes:128}),epoch=d.epochs.find(item=>item.id===id);if(!epoch)fail('unsupported epoch: '+id);return planTo({reference:ref,targetTime:epoch.time});
  }
  function playbackProjection({paused=false,rate=1}={}){if(typeof paused!=='boolean')fail('paused must be boolean');const n=Number(rate);if(!Number.isFinite(n)||n<=0||n>64)fail('presentation playback rate out of bounds');return Object.freeze({contract:'ofu-prod-w2-time-playback-projection-1',authority:TIME_PRESENTATION_AUTHORITY,paused,rate:n,animationClockIsCanonical:false,changesCanonicalTime:false,changesCanonicalHistory:false})}
  function productProjection(reference){const ref=normalizeReference(reference),d=domain(ref.domainId);assertModelBinding(ref,d);return deepFreeze({contract:TIME_PRODUCT_PROJECTION_CONTRACT,authority:TIME_PRESENTATION_AUTHORITY,timeAuthority:TIME_P4_AUTHORITY,timeLabel:'Canonical P4 time',stateLabel:'Exact P4 state reference',modelLabel:modelLabel(d.model),modelAuthorityLabel:d.authority,historySupportLabel:d.supportMode===TIME_SUPPORT_MODE.EXACT_INTERVALS?'Governed exact intervals':'Saved reference only',animationClockLabel:'Presentation only',canonicalTime:clone(ref.canonicalTime),domainId:d.id})}
  function cacheKey(plan){return JSON.stringify({domainId:plan.domainId,model:plan.model,universeIdentity:plan.sourceReference.universeIdentity,lineageId:plan.sourceReference.lineageId,subjectCanonicalId:plan.sourceReference.subject.canonicalId,sourceStateDigest:plan.sourceReference.p4StateRef.stateDigest,targetTime:plan.targetTime})}
  function cachePut(key,reference){if(cache.has(key))cache.delete(key);cache.set(key,reference);while(cache.size>limits.maxMaterializedReferences)cache.delete(cache.keys().next().value)}
  function cacheGet(key){const value=cache.get(key);if(!value)return null;cache.delete(key);cache.set(key,value);return value}
  async function materialize(planInput,{signal=null}={}){
    const plan=normalizePlan(planInput),d=domain(plan.domainId);assertModelBinding(plan.sourceReference,d);const requestGeneration=++generation;if(aborted(signal))return Object.freeze({status:'CANCELLED',reference:null,cacheHit:false});const key=cacheKey(plan),cached=cacheGet(key);if(cached)return Object.freeze({status:'RESOLVED',reference:cached,cacheHit:true});
    if(plan.resolution==='REFERENCE_REUSE'){cachePut(key,plan.sourceReference);return Object.freeze({status:'RESOLVED',reference:plan.sourceReference,cacheHit:false})}
    if(d.supportMode!==TIME_SUPPORT_MODE.EXACT_INTERVALS||!timeSupported(d,plan.targetTime))return Object.freeze({status:'UNSUPPORTED',reference:null,cacheHit:false});
    let envelope;try{envelope=await d.resolveExact(Object.freeze({domainId:d.id,model:clone(d.model),modelAuthority:d.authority,universeIdentity:plan.sourceReference.universeIdentity,lineageId:plan.sourceReference.lineageId,subject:clone(plan.sourceReference.subject),sourceP4StateRef:clone(plan.sourceReference.p4StateRef),targetTime:clone(plan.targetTime),signal}))}catch(error){if(aborted(signal))return Object.freeze({status:'CANCELLED',reference:null,cacheHit:false});throw error}
    if(aborted(signal))return Object.freeze({status:'CANCELLED',reference:null,cacheHit:false});if(requestGeneration!==generation)return Object.freeze({status:'STALE_DROPPED',reference:null,cacheHit:false});
    if(!plain(envelope))fail('domain resolver result must be a plain object');
    if(envelope.status==='UNSUPPORTED'){exactKeys(envelope,['status','reason'],'unsupported domain resolver result');text(envelope.reason,'unsupported reason',{maxBytes:512});return Object.freeze({status:'UNSUPPORTED',reference:null,cacheHit:false})}
    exactKeys(envelope,['status','model','p4StateRef'],'resolved domain resolver result');if(envelope.status!=='RESOLVED')fail('domain resolver status unsupported');const resolvedModel=normalizeModel(envelope.model,'resolved model');if(!sameModel(resolvedModel,d.model))fail('resolved time model version mismatch');const p4StateRef=normalizeP4StateRef(envelope.p4StateRef);if(p4StateRef.universeIdentity!==plan.sourceReference.universeIdentity||p4StateRef.lineageId!==plan.sourceReference.lineageId)fail('resolved P4 reference universe/lineage mismatch');if(!sameTime(referenceTime(p4StateRef),plan.targetTime))fail('resolved P4 reference time mismatch');
    const reference=buildReference({domain:d,subject:plan.sourceReference.subject,p4StateRef,productContext:plan.sourceReference.productContext});cachePut(key,reference);return Object.freeze({status:'RESOLVED',reference,cacheHit:false});
  }
  function cancelActive(){generation++;return generation}
  function clearMaterializedReferences(){cache.clear()}
  function saveAtlasSnapshot({reference,label=null}={}){
    const ref=normalizeReference(reference),d=domain(ref.domainId);assertModelBinding(ref,d);
    const saved=createSavedObservation({kind:W1_OBSERVATION_KIND.SNAPSHOT,subject:ref.subject,temporalRef:ref.p4StateRef,scientificFingerprintRef:ref.productContext.scientificFingerprintRef,returnRef:ref.productContext.returnRef,label}),entry=atlas.saveObservation(saved);
    const temporalReference=buildReference({domain:d,subject:entry.observation.subject,p4StateRef:entry.observation.temporalRef,productContext:{atlasEntryId:entry.id,atlasKind:entry.observation.kind,returnRef:entry.observation.returnRef,scientificFingerprintRef:entry.observation.scientificFingerprintRef}});
    return Object.freeze({entry,temporalReference,serializedTemporalReference:serializeReference(temporalReference)});
  }
  function snapshot(){return Object.freeze({version:TIME_EXPLORER_VERSION,authority:TIME_REFERENCE_AUTHORITY,timeAuthority:TIME_P4_AUTHORITY,domainCount:domainMap.size,materializedReferenceCount:cache.size,limits,generation})}
  return Object.freeze({version:TIME_EXPLORER_VERSION,authority:TIME_REFERENCE_AUTHORITY,timeAuthority:TIME_P4_AUTHORITY,limits,referenceFromAtlas,serializeReference,parseReference,planTo,planStep,planEpoch,playbackProjection,productProjection,materialize,cancelActive,clearMaterializedReferences,saveAtlasSnapshot,snapshot});
}
