export const W1_PRODUCT_CONTRACTS_VERSION=1;
export const W1_MAX_SERIALIZED_BYTES=65536;

export const W1_CONTRACTS=Object.freeze({
  CANONICAL_ENTITY_REF:'ofu-r6-w1-canonical-entity-ref-1',
  P4_STATE_REF:'ofu-r6-w1-p4-state-ref-1',
  SCIENTIFIC_FINGERPRINT:'ofu-r6-w1-scientific-fingerprint-1',
  SCIENTIFIC_FINGERPRINT_REF:'ofu-r6-w1-scientific-fingerprint-ref-1',
  RETURN_REF:'ofu-r6-w1-return-ref-1',
  SAVED_OBSERVATION:'ofu-r6-w1-saved-observation-1'
});

export const W1_AUTHORITY=Object.freeze({
  CANONICAL:'CANONICAL',
  MODEL_DERIVED:'MODEL_DERIVED',
  ANALYSIS_ONLY:'ANALYSIS_ONLY',
  PRESENTATION_ONLY:'PRESENTATION_ONLY',
  UNKNOWN:'UNKNOWN'
});

export const W1_FINGERPRINT_STATUS=Object.freeze({PRESENT:'PRESENT',UNKNOWN:'UNKNOWN'});
export const W1_OBSERVATION_KIND=Object.freeze({PLACE:'PLACE',OBSERVATION:'OBSERVATION',SNAPSHOT:'SNAPSHOT'});
export const W1_P4_PROTOCOL='ofu-p4-temporal-v1';
export const W1_SELECTION_CONTRACT='ofu-wave-iv-selection-1';
export const W1_SCALE_CONTRACT='ofu-wave-iv-scale-runtime-3';

const enc=new TextEncoder();
const AUTHORITY_VALUES=new Set(Object.values(W1_AUTHORITY));
const HASH_KEYS=Object.freeze(['planet','context','surface','sample']);
const MAX_TEXT_BYTES=4096;
const MAX_KEY_FIELDS=64;
const MAX_AUTHORITY_DOMAINS=64;
const MAX_LIMITATIONS=64;
const U64_MAX=(1n<<64n)-1n;

function fail(message){throw new Error('OFU W1 contracts: '+message)}
function plain(value){if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);return p===Object.prototype||p===null}
function ownDataKeys(value,label){if(!plain(value))fail(label+' must be a plain object');const keys=[];for(const key of Reflect.ownKeys(value)){if(typeof key!=='string')fail(label+' contains symbol keys');const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!d.enumerable||!('value'in d))fail(label+' contains unsupported property descriptors');keys.push(key)}return keys}
function exactKeys(value,expected,label){const keys=ownDataKeys(value,label).sort(),want=[...expected].sort();if(keys.length!==want.length||keys.some((key,index)=>key!==want[index]))fail(label+' has missing or unsupported fields')}
function text(value,label,{nullable=false,maxBytes=MAX_TEXT_BYTES}={}){if(value===null&&nullable)return null;if(typeof value!=='string')fail(label+' must be text');const normalized=value.normalize('NFC');if(!normalized.length)fail(label+' must be non-empty');if(enc.encode(normalized).length>maxBytes)fail(label+' exceeds byte limit');return normalized}
function enumValue(value,allowed,label){const normalized=text(value,label);if(!allowed.has(normalized))fail(label+' is unsupported: '+normalized);return normalized}
function hex32(value,label,{nullable=false}={}){if(value===null&&nullable)return null;if(value instanceof Uint8Array){if(value.length!==32)fail(label+' must be 32 bytes');return Array.from(value,byte=>byte.toString(16).padStart(2,'0')).join('')}if(typeof value!=='string'||!/^[0-9a-fA-F]{64}$/.test(value))fail(label+' must be a 32-byte hex digest');return value.toLowerCase()}
function integerText(value,label,{signed=false}={}){let out;if(typeof value==='bigint')out=value.toString();else if(typeof value==='number'){if(!Number.isSafeInteger(value))fail(label+' number must be a safe integer');out=String(value)}else if(typeof value==='string')out=value;else fail(label+' must be an integer or decimal integer text');const pattern=signed?/^-?(0|[1-9][0-9]*)$/:/^(0|[1-9][0-9]*)$/;if(!pattern.test(out)||out==='-0')fail(label+' is not canonical decimal integer text');return out}
function u64Text(value,label){const out=integerText(value,label);if(BigInt(out)>U64_MAX)fail(label+' exceeds u64 range');return out}
function finitePositive(value,label,{nullable=false}={}){if(value===null&&nullable)return null;const n=Number(value);if(!Number.isFinite(n)||!(n>0))fail(label+' must be positive finite');return n}
function sortedUniqueTextList(value,label){if(!Array.isArray(value)||value.length>MAX_LIMITATIONS)fail(label+' must be a bounded array');const normalized=value.map((item,index)=>text(item,label+'['+index+']'));normalized.sort();for(let i=1;i<normalized.length;i++)if(normalized[i-1]===normalized[i])fail(label+' contains duplicates');return Object.freeze(normalized)}
function freezeRecord(entries){return Object.freeze(Object.fromEntries(entries))}

function canonicalKey(value){const keys=ownDataKeys(value,'canonicalKey');if(!keys.length||keys.length>MAX_KEY_FIELDS)fail('canonicalKey field count invalid');keys.sort();const out=[];for(const key of keys){const normalizedKey=text(key,'canonicalKey field',{maxBytes:128});if(normalizedKey!==key)fail('canonicalKey field names must already be NFC');if(['__proto__','prototype','constructor'].includes(normalizedKey))fail('canonicalKey contains prototype-sensitive field');out.push([normalizedKey,integerText(value[key],'canonicalKey.'+normalizedKey,{signed:true})])}return freezeRecord(out)}
function authorityMap(value){const keys=ownDataKeys(value,'authorityByDomain');if(!keys.length||keys.length>MAX_AUTHORITY_DOMAINS)fail('authorityByDomain field count invalid');keys.sort();return freezeRecord(keys.map(key=>[text(key,'authority domain',{maxBytes:128}),enumValue(value[key],AUTHORITY_VALUES,'authorityByDomain.'+key)]))}
function hashSet(value,status){exactKeys(value,HASH_KEYS,'scientificHashes');const out={};for(const key of HASH_KEYS)out[key]=hex32(value[key],'scientificHashes.'+key,{nullable:true});if(status===W1_FINGERPRINT_STATUS.PRESENT&&!out.context)fail('PRESENT fingerprint requires scientificHashes.context');if(status===W1_FINGERPRINT_STATUS.UNKNOWN&&HASH_KEYS.some(key=>out[key]!==null))fail('UNKNOWN fingerprint must not assert scientific hashes');return Object.freeze(out)}

function normalizeCanonicalEntityRef(value){
  exactKeys(value,['schemaVersion','contract','universeId','entityKind','canonicalId','canonicalKey'],'canonical entity ref');
  if(value.schemaVersion!==W1_PRODUCT_CONTRACTS_VERSION)fail('unsupported canonical entity ref schema version');
  if(value.contract!==W1_CONTRACTS.CANONICAL_ENTITY_REF)fail('unsupported canonical entity ref contract');
  return Object.freeze({schemaVersion:1,contract:W1_CONTRACTS.CANONICAL_ENTITY_REF,universeId:text(value.universeId,'universeId'),entityKind:text(value.entityKind,'entityKind').toUpperCase(),canonicalId:hex32(value.canonicalId,'canonicalId'),canonicalKey:canonicalKey(value.canonicalKey)});
}

function normalizeP4StateRef(value){
  exactKeys(value,['schemaVersion','contract','protocol','universeIdentity','lineageId','stateDigest','checkpointId','frontier'],'P4 state ref');
  if(value.schemaVersion!==1)fail('unsupported P4 state ref schema version');
  if(value.contract!==W1_CONTRACTS.P4_STATE_REF)fail('unsupported P4 state ref contract');
  if(value.protocol!==W1_P4_PROTOCOL)fail('unsupported P4 protocol');
  let frontier=null;if(value.frontier!==null){exactKeys(value.frontier,['eventId','seconds','micros'],'P4 frontier');const micros=u64Text(value.frontier.micros,'P4 frontier micros');if(BigInt(micros)>=1000000n)fail('P4 frontier micros out of range');frontier=Object.freeze({eventId:hex32(value.frontier.eventId,'P4 frontier eventId'),seconds:u64Text(value.frontier.seconds,'P4 frontier seconds'),micros})}
  return Object.freeze({schemaVersion:1,contract:W1_CONTRACTS.P4_STATE_REF,protocol:W1_P4_PROTOCOL,universeIdentity:hex32(value.universeIdentity,'P4 universeIdentity'),lineageId:hex32(value.lineageId,'P4 lineageId'),stateDigest:hex32(value.stateDigest,'P4 stateDigest'),checkpointId:hex32(value.checkpointId,'P4 checkpointId',{nullable:true}),frontier});
}

function normalizeFingerprintRef(value){
  exactKeys(value,['schemaVersion','contract','subjectCanonicalId','contextHash','scientificStateContract','scientificModelVersion'],'scientific fingerprint ref');
  if(value.schemaVersion!==1)fail('unsupported scientific fingerprint ref schema version');
  if(value.contract!==W1_CONTRACTS.SCIENTIFIC_FINGERPRINT_REF)fail('unsupported scientific fingerprint ref contract');
  return Object.freeze({schemaVersion:1,contract:W1_CONTRACTS.SCIENTIFIC_FINGERPRINT_REF,subjectCanonicalId:hex32(value.subjectCanonicalId,'fingerprint subjectCanonicalId'),contextHash:hex32(value.contextHash,'fingerprint contextHash'),scientificStateContract:text(value.scientificStateContract,'fingerprint scientificStateContract'),scientificModelVersion:text(value.scientificModelVersion,'fingerprint scientificModelVersion')});
}

function normalizeReturnRef(value){
  exactKeys(value,['schemaVersion','contract','authority','selectionContract','scaleContract','semanticScale','distanceIntentRadii'],'return ref');
  if(value.schemaVersion!==1)fail('unsupported return ref schema version');
  if(value.contract!==W1_CONTRACTS.RETURN_REF)fail('unsupported return ref contract');
  if(value.authority!==W1_AUTHORITY.PRESENTATION_ONLY)fail('return ref authority must remain PRESENTATION_ONLY');
  if(value.selectionContract!==W1_SELECTION_CONTRACT)fail('unsupported selection contract');
  if(value.scaleContract!==W1_SCALE_CONTRACT)fail('unsupported scale contract');
  return Object.freeze({schemaVersion:1,contract:W1_CONTRACTS.RETURN_REF,authority:W1_AUTHORITY.PRESENTATION_ONLY,selectionContract:W1_SELECTION_CONTRACT,scaleContract:W1_SCALE_CONTRACT,semanticScale:text(value.semanticScale,'return semanticScale',{nullable:true,maxBytes:128}),distanceIntentRadii:finitePositive(value.distanceIntentRadii,'return distanceIntentRadii',{nullable:true})});
}

function normalizeScientificFingerprint(value){
  exactKeys(value,['schemaVersion','contract','status','subject','scientificStateContract','scientificModelVersion','generatorVersion','scientificHashes','authorityByDomain','limitations'],'scientific fingerprint');
  if(value.schemaVersion!==1)fail('unsupported scientific fingerprint schema version');
  if(value.contract!==W1_CONTRACTS.SCIENTIFIC_FINGERPRINT)fail('unsupported scientific fingerprint contract');
  const status=enumValue(value.status,new Set(Object.values(W1_FINGERPRINT_STATUS)),'fingerprint status');
  const scientificModelVersion=text(value.scientificModelVersion,'scientificModelVersion',{nullable:status===W1_FINGERPRINT_STATUS.UNKNOWN});
  if(status===W1_FINGERPRINT_STATUS.PRESENT&&scientificModelVersion===null)fail('PRESENT fingerprint requires scientificModelVersion');
  return Object.freeze({schemaVersion:1,contract:W1_CONTRACTS.SCIENTIFIC_FINGERPRINT,status,subject:normalizeCanonicalEntityRef(value.subject),scientificStateContract:text(value.scientificStateContract,'scientificStateContract'),scientificModelVersion,generatorVersion:text(value.generatorVersion,'generatorVersion',{nullable:true}),scientificHashes:hashSet(value.scientificHashes,status),authorityByDomain:authorityMap(value.authorityByDomain),limitations:sortedUniqueTextList(value.limitations,'limitations')});
}

function normalizeSavedObservation(value){
  exactKeys(value,['schemaVersion','contract','kind','subject','temporalRef','scientificFingerprintRef','returnRef','label'],'saved observation');
  if(value.schemaVersion!==1)fail('unsupported saved observation schema version');
  if(value.contract!==W1_CONTRACTS.SAVED_OBSERVATION)fail('unsupported saved observation contract');
  const kind=enumValue(value.kind,new Set(Object.values(W1_OBSERVATION_KIND)),'saved observation kind'),subject=normalizeCanonicalEntityRef(value.subject),temporalRef=value.temporalRef===null?null:normalizeP4StateRef(value.temporalRef),scientificFingerprintRef=value.scientificFingerprintRef===null?null:normalizeFingerprintRef(value.scientificFingerprintRef);
  if(kind===W1_OBSERVATION_KIND.SNAPSHOT&&temporalRef===null)fail('SNAPSHOT bookmark requires a P4 temporalRef');
  if(scientificFingerprintRef&&scientificFingerprintRef.subjectCanonicalId!==subject.canonicalId)fail('scientific fingerprint ref subject mismatch');
  return Object.freeze({schemaVersion:1,contract:W1_CONTRACTS.SAVED_OBSERVATION,kind,subject,temporalRef,scientificFingerprintRef,returnRef:value.returnRef===null?null:normalizeReturnRef(value.returnRef),label:text(value.label,'saved observation label',{nullable:true,maxBytes:512})});
}

export function createCanonicalEntityRef({universeId,entityKind,canonicalId,canonicalKey:rawCanonicalKey}={}){return normalizeCanonicalEntityRef({schemaVersion:1,contract:W1_CONTRACTS.CANONICAL_ENTITY_REF,universeId,entityKind,canonicalId,canonicalKey:rawCanonicalKey})}
export function createP4StateRef({universeIdentity,lineageId,stateDigest,checkpointId=null,frontier=null}={}){return normalizeP4StateRef({schemaVersion:1,contract:W1_CONTRACTS.P4_STATE_REF,protocol:W1_P4_PROTOCOL,universeIdentity,lineageId,stateDigest,checkpointId,frontier})}
export function createScientificFingerprintRef({subjectCanonicalId,contextHash,scientificStateContract,scientificModelVersion}={}){return normalizeFingerprintRef({schemaVersion:1,contract:W1_CONTRACTS.SCIENTIFIC_FINGERPRINT_REF,subjectCanonicalId,contextHash,scientificStateContract,scientificModelVersion})}
export function createReturnRef({semanticScale=null,distanceIntentRadii=null}={}){return normalizeReturnRef({schemaVersion:1,contract:W1_CONTRACTS.RETURN_REF,authority:W1_AUTHORITY.PRESENTATION_ONLY,selectionContract:W1_SELECTION_CONTRACT,scaleContract:W1_SCALE_CONTRACT,semanticScale,distanceIntentRadii})}
export function createScientificFingerprint({status=W1_FINGERPRINT_STATUS.PRESENT,subject,scientificStateContract,scientificModelVersion=null,generatorVersion=null,scientificHashes={planet:null,context:null,surface:null,sample:null},authorityByDomain,limitations=[]}={}){return normalizeScientificFingerprint({schemaVersion:1,contract:W1_CONTRACTS.SCIENTIFIC_FINGERPRINT,status,subject,scientificStateContract,scientificModelVersion,generatorVersion,scientificHashes,authorityByDomain,limitations})}
export function createSavedObservation({kind=W1_OBSERVATION_KIND.OBSERVATION,subject,temporalRef=null,scientificFingerprintRef=null,returnRef=null,label=null}={}){return normalizeSavedObservation({schemaVersion:1,contract:W1_CONTRACTS.SAVED_OBSERVATION,kind,subject,temporalRef,scientificFingerprintRef,returnRef,label})}

function normalizeContractRecord(value){if(!plain(value))fail('contract record must be a plain object');switch(value.contract){case W1_CONTRACTS.CANONICAL_ENTITY_REF:return normalizeCanonicalEntityRef(value);case W1_CONTRACTS.P4_STATE_REF:return normalizeP4StateRef(value);case W1_CONTRACTS.SCIENTIFIC_FINGERPRINT:return normalizeScientificFingerprint(value);case W1_CONTRACTS.SCIENTIFIC_FINGERPRINT_REF:return normalizeFingerprintRef(value);case W1_CONTRACTS.RETURN_REF:return normalizeReturnRef(value);case W1_CONTRACTS.SAVED_OBSERVATION:return normalizeSavedObservation(value);default:fail('unsupported contract: '+String(value.contract))}}
export function serializeW1Contract(value){const output=JSON.stringify(normalizeContractRecord(value));if(enc.encode(output).length>W1_MAX_SERIALIZED_BYTES)fail('serialized contract exceeds byte limit');return output}
export function parseW1Contract(textValue){if(typeof textValue!=='string')fail('serialized contract must be text');if(enc.encode(textValue).length>W1_MAX_SERIALIZED_BYTES)fail('serialized contract exceeds byte limit');let parsed;try{parsed=JSON.parse(textValue)}catch{fail('malformed JSON')}const normalized=normalizeContractRecord(parsed),canonical=JSON.stringify(normalized);if(canonical!==textValue)fail('serialized contract is not canonical');return normalized}
