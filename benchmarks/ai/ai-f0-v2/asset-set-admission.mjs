const HEX64=/^[a-f0-9]{64}$/;const ROLES=['runtime-js','runtime-wasm','model','tokenizer'];
function exact(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
function asset(a){return exact(a,['role','id','bytes','sha256','license','redistributionReviewed'])&&ROLES.includes(a.role)&&typeof a.id==='string'&&/^[a-z0-9][a-z0-9._:/@-]{0,191}$/.test(a.id)&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&typeof a.sha256==='string'&&HEX64.test(a.sha256)&&typeof a.license==='string'&&a.license.length>0&&a.license.length<=256&&typeof a.redistributionReviewed==='boolean';}
export function adjudicateAssetSet(assets){
  if(!Array.isArray(assets)||assets.length!==ROLES.length)return Object.freeze({ok:false,reason:'ASSET_SET_CARDINALITY',shippingPromotion:false});
  if(!assets.every(asset))return Object.freeze({ok:false,reason:'ASSET_SCHEMA',shippingPromotion:false});
  const roles=new Map(),ids=new Set(),hashes=new Set();
  for(const a of assets){if(roles.has(a.role))return Object.freeze({ok:false,reason:'DUPLICATE_ASSET_ROLE',shippingPromotion:false});if(ids.has(a.id))return Object.freeze({ok:false,reason:'DUPLICATE_ASSET_ID',shippingPromotion:false});if(hashes.has(a.sha256))return Object.freeze({ok:false,reason:'DUPLICATE_ASSET_HASH',shippingPromotion:false});roles.set(a.role,a);ids.add(a.id);hashes.add(a.sha256);}
  for(const role of ROLES)if(!roles.has(role))return Object.freeze({ok:false,reason:'MISSING_ASSET_ROLE',role,shippingPromotion:false});
  for(const role of ROLES){const a=roles.get(role);if(!a.redistributionReviewed)return Object.freeze({ok:false,reason:'REDISTRIBUTION_REVIEW_REQUIRED',role,shippingPromotion:false});}
  const totalBytes=assets.reduce((n,a)=>n+a.bytes,0);if(!Number.isSafeInteger(totalBytes))return Object.freeze({ok:false,reason:'ASSET_TOTAL_OVERFLOW',shippingPromotion:false});
  return Object.freeze({ok:true,reason:'EXACT_COMPLETE_ASSET_SET_RESEARCH_ADMISSIBLE',roles:Object.freeze(ROLES.map(role=>Object.freeze({role,id:roles.get(role).id,bytes:roles.get(role).bytes,sha256:roles.get(role).sha256,license:roles.get(role).license}))),totalBytes,shippingPromotion:false});
}
