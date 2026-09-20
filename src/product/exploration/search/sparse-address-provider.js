import {SEARCH_STATE} from './bounded-search.js';

export const SPARSE_ADDRESS_SEARCH_PROVIDER_VERSION='ofu-prod-w2-sparse-address-provider-1';

function fail(message){throw new Error('OFU Sparse Address Search Provider: '+message)}
function value(v){return Object.freeze({state:SEARCH_STATE.VALUE,value:v})}
function unknown(){return Object.freeze({state:SEARCH_STATE.UNKNOWN,value:null})}
function exactIdentity(node){
  if(!node||typeof node!=='object'||!node.universeId||!node.canonicalId||!node.canonicalKey)fail('sparse discovery returned a node without exact canonical identity');
  return Object.freeze({universeId:String(node.universeId),entityKind:String(node.kind||'SYSTEM').toUpperCase(),canonicalId:String(node.canonicalId).toLowerCase(),canonicalKey:node.canonicalKey});
}

export function createNearbySystemSearchProvider({addressSpace,ctx,anchorSystem,radiusSites=8,maxProbes=512,id='ofu.product.w2.search.sparse-nearby-systems'}={}){
  if(!addressSpace||typeof addressSpace.discoverNearbySystems!=='function')fail('addressSpace.discoverNearbySystems is required');
  if(!anchorSystem||anchorSystem.kind!=='system')fail('anchorSystem must be an existing exact system node');
  if(!Number.isSafeInteger(radiusSites)||radiusSites<1||radiusSites>12)fail('radiusSites out of bounds');
  if(!Number.isSafeInteger(maxProbes)||maxProbes<1||maxProbes>65536)fail('maxProbes out of bounds');
  return Object.freeze({
    id,version:SPARSE_ADDRESS_SEARCH_PROVIDER_VERSION,authority:'ANALYSIS_ONLY',
    async discover({limit,signal}={}){
      if(signal?.aborted)return Object.freeze([]);
      const providerLimit=Math.min(limit,Number.isSafeInteger(addressSpace.MAX_RESULTS)?addressSpace.MAX_RESULTS:64);
      const page=addressSpace.discoverNearbySystems({ctx,system:anchorSystem,cursor:0,limit:providerLimit,maxProbes,radiusSites});
      if(!page||page.bounded!==true||!Array.isArray(page.systems))fail('sparse discovery must return a bounded system page');
      if(page.systems.length>providerLimit)fail('sparse discovery exceeded requested limit');
      return Object.freeze(page.systems.map(node=>Object.freeze({
        identity:exactIdentity(node),
        properties:Object.freeze({
          addressKind:value('SYSTEM'),
          sourceAuthority:value(String(node.sourceAuthority||'UNKNOWN')),
          noveltyPpm:unknown(),
          rarityPpm:unknown()
        }),
        fingerprint:null,
        provenance:Object.freeze({
          source:'V1_SPARSE_ADDRESS_SPACE',
          providerVersion:SPARSE_ADDRESS_SEARCH_PROVIDER_VERSION,
          discoveryContract:String(addressSpace.systemDiscoveryContract||'BOUNDED_SITE_WINDOW_V1'),
          anchorSystemId:String(anchorSystem.entityId||''),
          probes:Number(page.probes||0),
          maxProbes:Number(page.maxProbes||maxProbes),
          radiusSites:Number(page.radiusSites||radiusSites),
          bounded:true,
          wholeUniverseEnumeration:false,
          exactAddressReference:true,
          providerWindowTruncated:page.nextCursor!==null,
          nextCursorAvailable:page.nextCursor!==null
        }),
        atlasEntryId:null
      })));
    }
  });
}
