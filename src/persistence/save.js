(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const MAX_SAVE_BYTES=1024*1024,SCHEMA=1,PROTOCOL='ofu-canonical-v1';
const LIMITS=Object.freeze({events:1024,depth:16,nodes:4096,arrayItems:1024,objectKeys:256,stringBytes:16384,keyBytes:256,eventTypeBytes:256});
const enc=new TextEncoder(),reservedKeys=new Set(['__proto__','prototype','constructor']);
function fail(message){throw new Error('portable save validation: '+message);}
function isRecord(v){if(!v||typeof v!=='object'||Array.isArray(v))return false;const p=Object.getPrototypeOf(v);return p===Object.prototype||p===null;}
function dataKeys(v,label){const own=Reflect.ownKeys(v),keys=[];for(const k of own){if(typeof k!=='string')fail(label+' contains symbol keys');const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!d.enumerable)fail(label+' contains non-enumerable fields');if(!('value'in d))fail(label+' contains accessor fields');keys.push(k);}return keys;}
function assertExactKeys(v,expected,label){if(!isRecord(v))fail(label+' must be an object');const actual=dataKeys(v,label).sort(),want=[...expected].sort();if(actual.length!==want.length||actual.some((k,i)=>k!==want[i]))fail(label+' has unsupported fields');}
function isWellFormedString(s){for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){if(i+1>=s.length)return false;const d=s.charCodeAt(++i);if(d<0xdc00||d>0xdfff)return false;}else if(c>=0xdc00&&c<=0xdfff)return false;}return true;}
function normalizeString(s,label,maxBytes=LIMITS.stringBytes){if(typeof s!=='string')fail(label+' must be a string');if(!isWellFormedString(s))fail(label+' contains invalid UTF-16');const n=s.normalize('NFC'),bytes=enc.encode(n).length;if(bytes>maxBytes)fail(label+' exceeds byte limit');return n;}
function normalizeData(value,state={seen:new WeakSet(),nodes:0},depth=0,path='event data'){
  if(depth>LIMITS.depth)fail(path+' exceeds nesting limit');
  state.nodes++;if(state.nodes>LIMITS.nodes)fail('event data exceeds node limit');
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='string')return normalizeString(value,path);
  if(typeof value==='number'){if(!Number.isSafeInteger(value))fail(path+' numbers must be safe integers');return Object.is(value,-0)?0:value;}
  if(typeof value==='bigint')fail(path+' BigInt is not supported in P1 portable event data');
  if(typeof value==='undefined'||typeof value==='function'||typeof value==='symbol')fail(path+' contains unsupported value type');
  if(Array.isArray(value)){
    if(value.length>LIMITS.arrayItems)fail(path+' array exceeds item limit');const own=Reflect.ownKeys(value);for(const k of own){if(typeof k!=='string')fail(path+' array contains symbol keys');if(k==='length')continue;if(!/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=value.length)fail(path+' array contains extra properties');const d=Object.getOwnPropertyDescriptor(value,k);if(!d||!d.enumerable||!('value'in d))fail(path+' array contains unsupported element descriptors');}if(Object.keys(value).length!==value.length)fail(path+' sparse arrays are not supported');
    if(state.seen.has(value))fail(path+' contains a cycle');state.seen.add(value);
    const out=Array.from(value,(x,i)=>normalizeData(x,state,depth+1,path+'['+i+']'));state.seen.delete(value);return out;
  }
  if(!isRecord(value))fail(path+' must contain only plain objects');
  if(state.seen.has(value))fail(path+' contains a cycle');state.seen.add(value);
  const keys=dataKeys(value,path);if(keys.length>LIMITS.objectKeys)fail(path+' object exceeds key limit');
  const pairs=[],normalizedSeen=new Set();
  for(const raw of keys){const key=normalizeString(raw,path+' key',LIMITS.keyBytes);if(reservedKeys.has(key))fail(path+' contains prototype-sensitive key');if(normalizedSeen.has(key))fail(path+' contains duplicate normalized key');normalizedSeen.add(key);pairs.push([key,raw]);}
  pairs.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);const out={};for(const [key,raw] of pairs)out[key]=normalizeData(value[raw],state,depth+1,path+'.'+key);state.seen.delete(value);return out;
}
function normalizeEvent(e,i){if(!isRecord(e))fail('event '+i+' must be an object');const allowed=['type','data','seq'],keys=dataKeys(e,'event '+i);for(const k of keys)if(!allowed.includes(k))fail('event '+i+' has unsupported fields');if('seq'in e&&e.seq!==i)fail('event '+i+' sequence mismatch');const type=normalizeString(e.type,'event '+i+' type',LIMITS.eventTypeBytes);if(!type.length)fail('event '+i+' type must not be empty');return {seq:i,type,data:'data'in e?normalizeData(e.data):null};}
function payload({masterSeed256,manifestHash,events=[]}){if(typeof masterSeed256!=='string'||!/^[0-9a-f]{64}$/i.test(masterSeed256))fail('invalid seed');if(typeof manifestHash!=='string'||!/^[0-9a-f]{64}$/i.test(manifestHash))fail('invalid manifest');if(!Array.isArray(events)||events.length>LIMITS.events)fail('invalid events');return {schemaVersion:SCHEMA,canonicalProtocolVersion:PROTOCOL,universeIdentity:{masterSeed256:masterSeed256.toLowerCase(),generatorManifestHash:manifestHash.toLowerCase()},events:events.map(normalizeEvent)};}
function stableJson(v){if(v===null)return'null';if(typeof v==='boolean')return v?'true':'false';if(typeof v==='number'){if(!Number.isSafeInteger(v))fail('non-safe number in save container');return String(v);}if(typeof v==='string')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stableJson).join(',')+']';if(!isRecord(v))fail('unsupported value in save container');return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableJson(v[k])).join(',')+'}';}
function exportPortable(input){const p=payload(input),digest=O.canonical.digestObject(p);return stableJson({format:'OFU-SAVE',schemaVersion:SCHEMA,payload:p,integrity:{algorithm:'SHA-256',digest}});}
function importPortable(text,expected={}){
  if(typeof text!=='string')fail('save must be text');if(enc.encode(text).length>MAX_SAVE_BYTES)fail('save exceeds limit');let c;try{c=JSON.parse(text);}catch{fail('malformed save');}
  assertExactKeys(c,['format','schemaVersion','payload','integrity'],'save container');if(c.format!=='OFU-SAVE')fail('unsupported save format');if(c.schemaVersion!==SCHEMA)fail('unsupported save version');
  assertExactKeys(c.payload,['schemaVersion','canonicalProtocolVersion','universeIdentity','events'],'save payload');if(c.payload.schemaVersion!==SCHEMA)fail('payload schema version mismatch');if(c.payload.canonicalProtocolVersion!==PROTOCOL)fail('unsupported canonical protocol version');
  assertExactKeys(c.payload.universeIdentity,['masterSeed256','generatorManifestHash'],'Universe Identity');
  if(!Array.isArray(c.payload.events)||c.payload.events.length>LIMITS.events)fail('invalid events');for(let i=0;i<c.payload.events.length;i++){assertExactKeys(c.payload.events[i],['seq','type','data'],'event '+i);if(c.payload.events[i].seq!==i)fail('event '+i+' sequence mismatch');}
  assertExactKeys(c.integrity,['algorithm','digest'],'integrity metadata');if(c.integrity.algorithm!=='SHA-256'||typeof c.integrity.digest!=='string'||!/^[0-9a-f]{64}$/.test(c.integrity.digest))fail('invalid integrity metadata');
  const p=payload({masterSeed256:c.payload.universeIdentity.masterSeed256,manifestHash:c.payload.universeIdentity.generatorManifestHash,events:c.payload.events});
  if(stableJson(c)!==text)fail('save serialization is not canonical');if(stableJson(c.payload)!==stableJson(p))fail('save payload is not normalized');if(O.canonical.digestObject(p)!==c.integrity.digest)fail('integrity mismatch');
  if(expected.manifestHash&&p.universeIdentity.generatorManifestHash!==String(expected.manifestHash).toLowerCase())fail('manifest mismatch');if(expected.masterSeed256&&p.universeIdentity.masterSeed256!==String(expected.masterSeed256).toLowerCase())fail('universe identity mismatch');return p;
}
function stateDigest(p){return O.canonical.digestObject(p);}
O.save={SCHEMA,PROTOCOL,MAX_SAVE_BYTES,LIMITS,payload,exportPortable,importPortable,stateDigest,normalizeData,stableJson};
})(typeof globalThis!=='undefined'?globalThis:this);
