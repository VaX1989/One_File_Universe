import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const tuples=['darwin/arm64/webkit','linux/x64/chromium','linux/x64/firefox','linux/x64/webkit','win32/x64/chromium'];
const hash=v=>assert.match(v,/^[a-f0-9]{64}$/);
export function validatePXEvidence(rows,build,source){
 assert.equal(build.px?.version,'ofu-px-product-1');assert.equal(build.px.scope,'FULL_WAVE_IV_PRODUCT');assert.equal(build.sourceCommit,source);
 hash(build.componentCompositionSha256);hash(build.px.registryDigest);hash(build.artifactSha256);
 assert.equal(build.componentCompositionSha256,createHash('sha256').update(JSON.stringify(build.additiveComponents)).digest('hex'));
 assert.equal(rows.length,5,'five distinct PX platform proofs required');assert.deepEqual(rows.map(r=>[r.platform,r.arch,r.browser].join('/')).sort(),tuples);
 const required=build.px.registryManifest.providers.filter(p=>p.mandatory||p.kind==='scene').map(p=>p.id).sort();
 const callable=build.px.registryManifest.providers.filter(p=>['domain','model','query','inspector','persistence','representation','test'].includes(p.kind)&&p.mandatory).map(p=>p.id).sort();
 const bands=build.px.regimes.map(r=>r.id);
 for(const r of rows){
  assert.equal(r.schema,'ofu-px-browser-evidence-1');assert.equal(r.status,'PASS');assert.equal(r.sourceSha,source);assert.equal(r.artifactSha256,build.artifactSha256);assert.equal(r.componentCompositionSha256,build.componentCompositionSha256);
  assert.equal(r.capability?.webgl2,true);assert.equal(r.directFile,true);assert.equal(r.offline,true);assert.equal(r.unexpectedNetworkRequests,0);assert.equal(r.pageErrors,0);assert.equal(r.physicalAndroid,'NOT_VERIFIED');assert.equal(r.physicalIOS,'NOT_VERIFIED');
  assert.equal(r.registry?.sealed,true);assert.equal(r.registry?.bindingsSealed,true);assert.equal(r.registry.manifestDigest,build.px.registryDigest);
  assert.equal(r.registry.entries,build.px.registryManifest.providers.length);assert.equal(new Set(r.registry.bound).size,r.registry.bound.length);for(const id of required)assert(r.registry.bound.includes(id),'mandatory bound provider '+id);
  assert.deepEqual([...r.providerChecks].sort(),callable);assert.equal(r.canonicalBefore,r.canonicalAfter);assert.equal(r.p4Before,r.p4After);hash(r.canonicalBefore);hash(r.p4Before);
  assert(r.metrics?.renderCalls>0&&r.metrics.reconciliations>=30&&r.metrics.refinements>0&&r.metrics.projections>0,'actual bidirectional seam execution required');
  assert(r.workingSet.cacheEntries<=16&&r.workingSet.witnessCount<=32);assert(r.workingSet.resources.entries>0&&r.workingSet.resources.totalDecodedBytes<=67108864);
  assert(Array.isArray(r.journeys)&&r.journeys.length>=27);for(const band of bands)assert(r.journeys.some(j=>j.scale===band),'missing traversal '+band);
  for(const j of r.journeys){hash(j.witness);if(['regional_surface','local_surface','human'].includes(j.scale))assert.equal(j.backend,'webgl2-local-surface');if(['orbit','approach','global_surface'].includes(j.scale))assert.equal(j.backend,'webgl2');}
 }
 return {status:'PASS',version:'ofu-px-production-seal-1',sourceSha:source,artifactSha256:build.artifactSha256,componentCompositionSha256:build.componentCompositionSha256,registryDigest:build.px.registryDigest,browserMatrix:tuples};
}
