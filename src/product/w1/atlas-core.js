import {
  W1_CONTRACTS,
  W1_OBSERVATION_KIND,
  parseW1Contract,
  serializeW1Contract
} from '../contracts/w1-observation-contracts.js';

export const ATLAS_CORE_VERSION=1;
export const ATLAS_INTERNAL_STATE_CONTRACT='ofu-prod-w1-atlas-core-internal-state-1';
export const ATLAS_INTERNAL_AUTHORITY='PRODUCT_LOCAL_STATE';
export const ATLAS_DEFAULT_LIMITS=Object.freeze({
  maxEntries:256,
  maxRoutes:64,
  maxRouteStops:64,
  maxSerializedBytes:524288
});

const enc=new TextEncoder();
const FNV64_OFFSET=14695981039346656037n;
const FNV64_PRIME=1099511628211n;
const FNV64_MASK=(1n<<64n)-1n;

function fail(message){throw new Error('OFU Atlas Core: '+message)}
function plain(value){if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);return p===Object.prototype||p===null}
function exactKeys(value,expected,label){
  if(!plain(value))fail(label+' must be a plain object');
  const keys=Object.keys(value).sort(),want=[...expected].sort();
  if(keys.length!==want.length||keys.some((key,index)=>key!==want[index]))fail(label+' has missing or unsupported fields');
}
function boundedInteger(value,label,min,max){
  if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of bounds');
  return value;
}
function text(value,label,{nullable=false,maxBytes=512}={}){
  if(value===null&&nullable)return null;
  if(typeof value!=='string')fail(label+' must be text');
  const normalized=value.normalize('NFC');
  if(!normalized.length)fail(label+' must be non-empty');
  if(enc.encode(normalized).length>maxBytes)fail(label+' exceeds byte limit');
  return normalized;
}
function idText(value,label){
  if(typeof value!=='string'||!/^[a-z0-9]+-[0-9a-f]{16}$/.test(value))fail(label+' is malformed');
  return value;
}
function fnv64(value){
  let hash=FNV64_OFFSET;
  for(const byte of enc.encode(value)){hash^=BigInt(byte);hash=(hash*FNV64_PRIME)&FNV64_MASK}
  return hash.toString(16).padStart(16,'0');
}
function contentId(prefix,value){return prefix+'-'+fnv64(prefix+'\u0000'+value)}
function normalizeLimits(input={}){
  exactKeys(input,['maxEntries','maxRoutes','maxRouteStops','maxSerializedBytes'].filter(key=>Object.hasOwn(input,key)),'atlas limits');
  return Object.freeze({
    maxEntries:boundedInteger(input.maxEntries??ATLAS_DEFAULT_LIMITS.maxEntries,'maxEntries',1,4096),
    maxRoutes:boundedInteger(input.maxRoutes??ATLAS_DEFAULT_LIMITS.maxRoutes,'maxRoutes',0,1024),
    maxRouteStops:boundedInteger(input.maxRouteStops??ATLAS_DEFAULT_LIMITS.maxRouteStops,'maxRouteStops',2,512),
    maxSerializedBytes:boundedInteger(input.maxSerializedBytes??ATLAS_DEFAULT_LIMITS.maxSerializedBytes,'maxSerializedBytes',1024,8*1024*1024)
  });
}
function canonicalObservation(value){
  const canonical=serializeW1Contract(value),observation=parseW1Contract(canonical);
  if(observation.contract!==W1_CONTRACTS.SAVED_OBSERVATION)fail('atlas entries must use the frozen W1 SavedObservation contract');
  return Object.freeze({canonical,observation});
}
function routeCanonical(label,entryIds){return JSON.stringify({label,entryIds})}

export function createAtlasCore(options={}){
  if(!plain(options))fail('options must be a plain object');
  const allowed=new Set(['limits','initialBundle']);
  for(const key of Object.keys(options))if(!allowed.has(key))fail('unsupported option: '+key);
  const limits=normalizeLimits(options.limits||{}),entries=new Map(),routes=new Map();

  function entryView(record){return Object.freeze({id:record.id,observation:record.observation})}
  function routeView(record){return Object.freeze({id:record.id,label:record.label,entryIds:Object.freeze([...record.entryIds])})}

  function saveObservation(value){
    const normalized=canonicalObservation(value),id=contentId('obs',normalized.canonical),existing=entries.get(id);
    if(existing){
      if(existing.canonical!==normalized.canonical)fail('observation content-key collision');
      return entryView(existing);
    }
    if(entries.size>=limits.maxEntries)fail('entry capacity exceeded');
    const record=Object.freeze({id,canonical:normalized.canonical,observation:normalized.observation});
    entries.set(id,record);
    return entryView(record);
  }

  function getEntry(id){
    const record=entries.get(idText(id,'entry id'));
    return record?entryView(record):null;
  }

  function forgetObservation(id){
    const normalized=idText(id,'entry id');
    if(!entries.has(normalized))return false;
    for(const route of routes.values())if(route.entryIds.includes(normalized))fail('entry is referenced by a route');
    entries.delete(normalized);
    return true;
  }

  function createRoute({label=null,entryIds}={}){
    const normalizedLabel=label===null?null:text(label,'route label',{nullable:true});
    if(!Array.isArray(entryIds))fail('route entryIds must be an array');
    if(entryIds.length<2||entryIds.length>limits.maxRouteStops)fail('route stop count out of bounds');
    const stops=entryIds.map((id,index)=>{
      const normalized=idText(id,'route entry id['+index+']');
      if(!entries.has(normalized))fail('route references an unknown atlas entry');
      return normalized;
    });
    const canonical=routeCanonical(normalizedLabel,stops),id=contentId('route',canonical),existing=routes.get(id);
    if(existing){
      if(existing.canonical!==canonical)fail('route content-key collision');
      return routeView(existing);
    }
    if(routes.size>=limits.maxRoutes)fail('route capacity exceeded');
    const record=Object.freeze({id,label:normalizedLabel,entryIds:Object.freeze(stops),canonical});
    routes.set(id,record);
    return routeView(record);
  }

  function getRoute(id){
    const record=routes.get(idText(id,'route id'));
    return record?routeView(record):null;
  }

  function forgetRoute(id){return routes.delete(idText(id,'route id'))}

  function listEntries(){return Object.freeze([...entries.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(entryView))}
  function listRoutes(){return Object.freeze([...routes.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(routeView))}

  function find({kind=null,subjectCanonicalId=null,labelContains=null,limit=null}={}){
    const normalizedKind=kind===null?null:text(kind,'search kind',{nullable:true,maxBytes:64}).toUpperCase();
    if(normalizedKind!==null&&!Object.values(W1_OBSERVATION_KIND).includes(normalizedKind))fail('search kind is unsupported');
    const subject=subjectCanonicalId===null?null:text(subjectCanonicalId,'search canonical id',{nullable:true,maxBytes:64}).toLowerCase();
    if(subject!==null&&!/^[0-9a-f]{64}$/.test(subject))fail('search canonical id must be a 32-byte digest');
    const needle=labelContains===null?null:text(labelContains,'search label',{nullable:true,maxBytes:128}).toLowerCase();
    const max=limit===null?Math.min(32,limits.maxEntries):boundedInteger(limit,'search limit',1,limits.maxEntries);
    const result=[];
    for(const record of [...entries.values()].sort((a,b)=>a.id.localeCompare(b.id))){
      const observation=record.observation;
      if(normalizedKind!==null&&observation.kind!==normalizedKind)continue;
      if(subject!==null&&observation.subject.canonicalId!==subject)continue;
      if(needle!==null&&!String(observation.label||'').toLowerCase().includes(needle))continue;
      result.push(entryView(record));
      if(result.length>=max)break;
    }
    return Object.freeze(result);
  }

  function revisitPlan(id){
    const record=entries.get(idText(id,'entry id'));if(!record)fail('unknown atlas entry');
    const o=record.observation;
    return Object.freeze({
      contract:'ofu-prod-w1-atlas-revisit-plan-1',
      authority:'REFERENCE_ONLY',
      atlasEntryId:record.id,
      kind:o.kind,
      subject:o.subject,
      temporalRef:o.temporalRef,
      scientificFingerprintRef:o.scientificFingerprintRef,
      returnRef:o.returnRef,
      exactTemporalStateReference:o.temporalRef!==null,
      presentationHintOnly:o.returnRef!==null,
      mutatesWorld:false,
      mutatesSelection:false,
      mutatesCamera:false
    });
  }

  function bundleObject(){
    return {
      schemaVersion:ATLAS_CORE_VERSION,
      contract:ATLAS_INTERNAL_STATE_CONTRACT,
      authority:ATLAS_INTERNAL_AUTHORITY,
      entries:[...entries.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(record=>({id:record.id,observation:JSON.parse(record.canonical)})),
      routes:[...routes.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(record=>({id:record.id,label:record.label,entryIds:[...record.entryIds]}))
    };
  }
  function exportBundle(){
    const output=JSON.stringify(bundleObject());
    if(enc.encode(output).length>limits.maxSerializedBytes)fail('serialized atlas exceeds byte limit');
    return output;
  }
  function importBundle(serialized){
    if(entries.size||routes.size)fail('bundle import requires an empty atlas');
    if(typeof serialized!=='string')fail('atlas bundle must be text');
    if(enc.encode(serialized).length>limits.maxSerializedBytes)fail('serialized atlas exceeds byte limit');
    let raw;try{raw=JSON.parse(serialized)}catch{fail('malformed atlas JSON')}
    exactKeys(raw,['schemaVersion','contract','authority','entries','routes'],'atlas bundle');
    if(raw.schemaVersion!==ATLAS_CORE_VERSION)fail('unsupported atlas schema version');
    if(raw.contract!==ATLAS_INTERNAL_STATE_CONTRACT)fail('unsupported atlas state contract');
    if(raw.authority!==ATLAS_INTERNAL_AUTHORITY)fail('atlas state authority mismatch');
    if(!Array.isArray(raw.entries)||raw.entries.length>limits.maxEntries)fail('atlas entry count out of bounds');
    if(!Array.isArray(raw.routes)||raw.routes.length>limits.maxRoutes)fail('atlas route count out of bounds');
    for(const item of raw.entries){
      exactKeys(item,['id','observation'],'atlas entry');
      const saved=saveObservation(item.observation);
      if(saved.id!==item.id)fail('atlas entry id/content mismatch');
    }
    for(const item of raw.routes){
      exactKeys(item,['id','label','entryIds'],'atlas route');
      const route=createRoute({label:item.label,entryIds:item.entryIds});
      if(route.id!==item.id)fail('atlas route id/content mismatch');
    }
    const canonical=exportBundle();
    if(canonical!==serialized)fail('atlas bundle is not canonical');
    return snapshot();
  }
  function snapshot(){return Object.freeze({version:ATLAS_CORE_VERSION,entryCount:entries.size,routeCount:routes.size,limits,authority:ATLAS_INTERNAL_AUTHORITY})}

  if(options.initialBundle!==undefined&&options.initialBundle!==null)importBundle(options.initialBundle);
  return Object.freeze({
    version:ATLAS_CORE_VERSION,
    authority:ATLAS_INTERNAL_AUTHORITY,
    limits,
    saveObservation,getEntry,forgetObservation,
    createRoute,getRoute,forgetRoute,
    listEntries,listRoutes,find,revisitPlan,
    exportBundle,snapshot
  });
}
