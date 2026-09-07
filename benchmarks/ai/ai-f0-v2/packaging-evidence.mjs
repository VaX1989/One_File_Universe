const HEX64=/^[a-f0-9]{64}$/;const ROLES=['runtime-js','runtime-wasm','model','tokenizer'];
function exact(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
export function adjudicatePackagingEvidence(x){
  const keys=['artifactBytes','artifactSha256','rebuildSha256','embeddedRoles','networkSurfaceScanPassed','generatorTestsPassed','externalResourceReferences'];
  if(!exact(x,keys)||!Number.isSafeInteger(x.artifactBytes)||x.artifactBytes<=0||typeof x.artifactSha256!=='string'||!HEX64.test(x.artifactSha256)||typeof x.rebuildSha256!=='string'||!HEX64.test(x.rebuildSha256)||!Array.isArray(x.embeddedRoles)||typeof x.networkSurfaceScanPassed!=='boolean'||typeof x.generatorTestsPassed!=='boolean'||!Number.isSafeInteger(x.externalResourceReferences)||x.externalResourceReferences<0)throw new Error('PACKAGING_EVIDENCE_SCHEMA');
  const fail=reason=>Object.freeze({ok:false,reason,directFileRuntimeEvidence:false,shippingPromotion:false});
  if(x.artifactSha256!==x.rebuildSha256)return fail('PACKAGE_REBUILD_NOT_BYTE_IDENTICAL');
  const roles=[...x.embeddedRoles];if(roles.length!==ROLES.length||new Set(roles).size!==roles.length||ROLES.some(r=>!roles.includes(r)))return fail('PACKAGE_EMBEDDED_ROLE_SET_INCOMPLETE');
  if(!x.generatorTestsPassed)return fail('PACKAGE_GENERATOR_TESTS_REQUIRED');
  if(!x.networkSurfaceScanPassed)return fail('PACKAGE_NETWORK_SURFACE_SCAN_FAILED');
  if(x.externalResourceReferences!==0)return fail('PACKAGE_EXTERNAL_RESOURCE_REFERENCE');
  return Object.freeze({ok:true,reason:'DETERMINISTIC_ZERO_FETCH_PACKAGE_STRUCTURALLY_VERIFIED',artifactBytes:x.artifactBytes,artifactSha256:x.artifactSha256,directFileRuntimeEvidence:false,shippingPromotion:false});
}
