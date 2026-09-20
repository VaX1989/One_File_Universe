import {SEARCH_STATE} from './bounded-search.js';

export const ATLAS_SEARCH_PROVIDER_VERSION='ofu-prod-w2-atlas-search-provider-1';

function fail(message){throw new Error('OFU Atlas Search Provider: '+message)}
function value(v){return Object.freeze({state:SEARCH_STATE.VALUE,value:v})}
function unknown(){return Object.freeze({state:SEARCH_STATE.UNKNOWN,value:null})}
function fingerprintSummary(value){
  if(value===null||value===undefined)return null;
  const fp=value.fingerprint??value;
  if(!fp||typeof fp!=='object')fail('fingerprint resolver returned invalid value');
  return Object.freeze({
    status:fp.status,
    scientificStateContract:fp.scientificStateContract,
    scientificModelVersion:fp.scientificModelVersion,
    scientificHashes:fp.scientificHashes,
    authorityByDomain:fp.authorityByDomain
  });
}

export function createAtlasSearchProvider({atlas,fingerprintResolver=null,id='ofu.product.w2.search.atlas'}={}){
  if(!atlas||typeof atlas.listEntries!=='function'||typeof atlas.revisitPlan!=='function')fail('atlas must expose listEntries and revisitPlan');
  if(fingerprintResolver!==null&&typeof fingerprintResolver!=='function')fail('fingerprintResolver must be a function or null');
  return Object.freeze({
    id,
    version:ATLAS_SEARCH_PROVIDER_VERSION,
    authority:'ANALYSIS_ONLY',
    async discover({limit,signal}={}){
      if(!Number.isSafeInteger(limit)||limit<1)fail('bounded limit required');
      if(signal?.aborted)return Object.freeze([]);
      const entries=[...atlas.listEntries()].sort((a,b)=>a.id.localeCompare(b.id)).slice(0,limit),out=[];
      for(const entry of entries){
        if(signal?.aborted)break;
        const observation=entry.observation,ref=observation.scientificFingerprintRef;
        const fingerprint=ref&&fingerprintResolver?fingerprintSummary(await fingerprintResolver(ref,observation)):null;
        const revisitPlan=atlas.revisitPlan(entry.id);
        out.push(Object.freeze({
          identity:Object.freeze({universeId:observation.subject.universeId,entityKind:observation.subject.entityKind,canonicalId:observation.subject.canonicalId,canonicalKey:observation.subject.canonicalKey}),
          properties:Object.freeze({
            atlasKind:value(observation.kind),
            atlasLabel:observation.label===null?unknown():value(observation.label),
            hasExactTemporalState:value(revisitPlan.exactTemporalStateReference),
            hasScientificFingerprintRef:value(ref!==null),
            noveltyPpm:unknown(),
            rarityPpm:unknown()
          }),
          fingerprint,
          provenance:Object.freeze({
            source:'PERSONAL_ATLAS',
            sourceAuthority:'PRODUCT_LOCAL_STATE',
            atlasEntryId:entry.id,
            revisitPlan,
            exactSemanticReference:true,
            mutableWorldCopy:false
          }),
          atlasEntryId:entry.id
        }));
      }
      return Object.freeze(out);
    }
  });
}
