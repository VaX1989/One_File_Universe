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

export function validatePXV1Evidence(rows,build,source){
 assert.equal(build.px?.version,'ofu-px-product-1');assert.equal(build.px.scope,'FULL_V1_WAVE_A_PRODUCT');assert.equal(build.sourceCommit,source);
 assert.equal(build.visualUniverse?.primarySceneProvider,'v1.scene.living-world');
 hash(build.componentCompositionSha256);hash(build.px.registryDigest);hash(build.artifactSha256);
 assert.equal(build.componentCompositionSha256,createHash('sha256').update(JSON.stringify(build.additiveComponents)).digest('hex'));
 assert.equal(rows.length,5,'five distinct v1 PX platform proofs required');assert.deepEqual(rows.map(r=>[r.platform,r.arch,r.browser].join('/')).sort(),tuples);
 const providers=build.px.registryManifest.providers;
 const required=providers.filter(p=>p.mandatory||p.kind==='scene').map(p=>p.id).sort();
 const callableKinds=['domain','model','query','inspector','persistence','representation','test'];
 const directPXCallable=providers.filter(p=>p.id.startsWith('px.')&&callableKinds.includes(p.kind)&&p.mandatory).map(p=>p.id).sort();
 const shippingCallable=providers.filter(p=>callableKinds.includes(p.kind)&&p.mandatory).map(p=>p.id).sort();
 const requiredStages=['APPROACH','GALAXY','GLOBAL_SURFACE','HUMAN','LOCAL_SURFACE','ORBIT','REGIONAL_SURFACE','SYSTEM'];
 const requiredViewports=['1280x800','390x844','844x390'];
 for(const r of rows){
  assert.equal(r.schema,'ofu-px-browser-evidence-2');assert.equal(r.status,'PASS');assert.equal(r.sourceSha,source);assert.equal(r.artifactSha256,build.artifactSha256);assert.equal(r.componentCompositionSha256,build.componentCompositionSha256);
  assert.equal(r.capability?.webgl2,true);assert.equal(r.directFile,true);assert.equal(r.offline,true);assert.equal(r.unexpectedNetworkRequests,0);assert.equal(r.pageErrors,0);assert.equal(r.physicalAndroid,'NOT_VERIFIED');assert.equal(r.physicalIOS,'NOT_VERIFIED');
  assert.equal(r.registry?.sealed,true);assert.equal(r.registry?.bindingsSealed,true);assert.equal(r.registry.manifestDigest,build.px.registryDigest);
  assert.equal(r.registry.entries,providers.length);assert.equal(new Set(r.registry.bound).size,r.registry.bound.length);for(const id of required)assert(r.registry.bound.includes(id),'mandatory bound provider '+id);for(const id of shippingCallable)assert(r.registry.bound.includes(id),'shipping callable provider not bound '+id);
  assert.deepEqual([...r.providerChecks].sort(),directPXCallable);assert.equal(r.canonicalBefore,r.canonicalAfter);assert.equal(r.p4Before,r.p4After);hash(r.canonicalBefore);hash(r.p4Before);
  assert(r.metrics?.renderCalls>0&&r.metrics.reconciliations>=30&&r.metrics.refinements>0&&r.metrics.projections>0,'actual bidirectional v1 seam execution required');
  assert(r.workingSet?.pxCacheEntries<=16&&r.workingSet?.pxWitnessCount<=32,'v1 PX working set exceeded');
  assert(r.workingSet?.livingHistoryDepth<=64&&r.workingSet?.livingDiscoveryCacheEntries<=12,'v1 Living working set exceeded');
  assert(r.workingSet?.resources?.entries>0&&r.workingSet.resources.totalDecodedBytes<=67108864,'v1 resource working set exceeded');
  assert(Array.isArray(r.journeys)&&r.journeys.length>=30,'v1 PX browser journeys incomplete');
  const seenViewports=new Set(r.journeys.map(j=>`${j.viewport?.width}x${j.viewport?.height}`));for(const viewport of requiredViewports)assert(seenViewports.has(viewport),'missing v1 viewport '+viewport);
  for(const viewport of requiredViewports){const [width,height]=viewport.split('x').map(Number),journeys=r.journeys.filter(j=>j.viewport?.width===width&&j.viewport?.height===height);for(const stage of requiredStages)assert(journeys.some(j=>j.stage===stage),'missing v1 traversal '+viewport+' '+stage);}
  for(const j of r.journeys){assert(requiredViewports.includes(`${j.viewport?.width}x${j.viewport?.height}`),'unexpected/unbounded v1 viewport evidence');assert(typeof j.stage==='string'&&j.stage.length>0,'v1 journey stage required');assert(Number.isInteger(j.cache)&&j.cache>=0&&j.cache<=12,'v1 journey cache bound exceeded');}
 }
 return {status:'PASS',version:'ofu-px-v1-production-seal-1',sourceSha:source,artifactSha256:build.artifactSha256,componentCompositionSha256:build.componentCompositionSha256,registryDigest:build.px.registryDigest,foregroundProvider:build.visualUniverse.primarySceneProvider,browserMatrix:tuples};
}
