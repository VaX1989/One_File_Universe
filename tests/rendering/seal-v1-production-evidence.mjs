// V1 production aggregation seals the shipping Living scope while retaining separate frozen Foundation rendering evidence.
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validatePXV1Evidence} from '../../tools/extensions/seal.mjs';
import {assertExactRenderingBrowserMatrix,collectRenderingEvidence,readBoundedRegularFile} from '../../tools/ci/rendering-evidence-input.mjs';

const root=process.argv[2]||'evidence';
const evidence=collectRenderingEvidence(root),records=evidence.records,docs=records.map(record=>record.doc);
const rows=docs.filter(v=>v.sourceCommit&&v.browser&&v.performanceRegimes?.steadyStateSurface&&v.telemetry?.raf&&v.canonicalWitness);
assertExactRenderingBrowserMatrix(rows,'v1 foundation rendering browser evidence');
for(const row of rows){
 if(row.status!=='PASS'||row.unexpectedNetworkRequests!==0||row.pageErrors!==0)throw new Error('invalid foundation browser evidence '+row.browser);
 if(row.canonicalWitness.p4Current!==row.canonicalWitness.p4Replay)throw new Error('P4 witness mismatch '+row.browser);
 if(row.canonicalWitness.p6State!=='INSUFFICIENT_ENVIRONMENT'||row.canonicalWitness.p6BiologyEstablished!==false)throw new Error('P6 preview honesty drift '+row.browser);
 if(row.telemetry?.raf?.measurement!=='MEASURED'||row.telemetry?.cpuTerrainBuild?.measurement!=='MEASURED'||row.telemetry?.startup?.measurement!=='MEASURED'||row.telemetry?.cacheCounts?.measurement!=='MEASURED')throw new Error('required measured telemetry missing '+row.browser);
 for(const key of ['steadyStateSurface','lodChurn','originRebasing','referenceFrameTransition','contextLossRecovery']){const metric=row.performanceRegimes?.[key];if(metric?.measurement!=='MEASURED'||metric.samples<20||metric.p50>metric.p95||metric.p95>metric.p99)throw new Error('invalid RAF evidence '+row.browser+' '+key)}
 if(row.backend==='webgl2'){
  if(!row.gpu||row.gpu.liveMeshes>row.gpu.maxMeshes||row.gpu.liveTrackedBytes>row.gpu.maxBytes)throw new Error('GPU bounds invalid '+row.browser);
  if(row.gpu.deletedBuffers===0||row.gpu.createdBuffers<=row.gpu.liveBuffers||row.gpu.lifecycleAccountingExact!==true)throw new Error('GPU lifecycle accounting invalid '+row.browser);
  if(row.telemetry.gpuUpload.measurement!=='MEASURED'||row.telemetry.rendererGpuBytes.measurement!=='DERIVED')throw new Error('GPU telemetry labeling invalid '+row.browser);
  if(!['PASS','NOT_MEASURABLE'].includes(row.contextRecovery?.status))throw new Error('context-loss evidence invalid '+row.browser);
 }else if(row.telemetry.gpuUpload.measurement!=='NOT MEASURABLE'||row.telemetry.rendererGpuBytes.measurement!=='NOT MEASURABLE')throw new Error('fallback GPU telemetry must be explicit '+row.browser);
 if(row.telemetry.physicalDriverVram?.measurement!=='NOT MEASURABLE')throw new Error('physical VRAM telemetry must not be fabricated');
}
const commits=new Set(rows.map(r=>r.sourceCommit)),artifacts=new Set(rows.map(r=>r.artifactSha256)),manifests=new Set(rows.map(r=>r.componentManifestHash)),witnesses=new Set(rows.map(r=>JSON.stringify(r.canonicalWitness)));
if(commits.size!==1||artifacts.size!==1||manifests.size!==1||witnesses.size!==1)throw new Error('foundation cross-runtime exact-head/artifact/witness drift');
const tuple=r=>[r.platform,r.arch,r.browser].join('/');
const chromium=rows.find(r=>r.platform==='linux'&&r.arch==='x64'&&r.browser==='chromium');
if(!chromium||chromium.backend!=='webgl2'||chromium.visual.pixelCheck!=='MEASURED'||chromium.visual.nonBackgroundPixels<8)throw new Error('Linux Chromium WebGL2 foundation visual seal missing');

const uniqueRecord=name=>{const matches=records.filter(record=>path.basename(record.file)===name);if(matches.length!==1)throw new Error('expected one '+name+', got '+matches.length);return matches[0]};
const fullManifestRecord=uniqueRecord('rendering-build-manifest.json'),foundationManifestRecord=uniqueRecord('rendering-foundation-manifest.json');
const fullManifest=fullManifestRecord.doc,foundationManifest=foundationManifestRecord.doc,fullManifestPath=fullManifestRecord.file,foundationManifestPath=foundationManifestRecord.file;
const expectedSource=process.env.OFU_SOURCE_SHA;
if(!expectedSource||expectedSource!==[...commits][0])throw new Error('seal source pin mismatch');
for(const [manifest,html] of [[fullManifest,path.join(path.dirname(fullManifestPath),'One_File_Universe.html')],[foundationManifest,path.join(path.dirname(foundationManifestPath),'One_File_Universe-foundation.html')]]){
 const bytes=readBoundedRegularFile(html),hash=createHash('sha256').update(bytes).digest('hex');
 if(manifest.sourceCommit!==expectedSource||manifest.artifactBytes!==bytes.length||manifest.artifactSha256!==hash||manifest.componentManifestHash!==[...manifests][0])throw new Error('artifact bytes/source/component pin mismatch');
}
if(foundationManifest.artifactSha256!==[...artifacts][0])throw new Error('foundation browser/artifact hash mismatch');
if(fullManifest.productVersion!=='2.0.0'||fullManifest.releaseLine!=='v2.0.0'||fullManifest.releaseStatus!=='STABLE_RELEASE'||fullManifest.candidateOnly!==false)throw new Error('v2.0.0 release identity missing');
if(fullManifest.worldConvergence?.developmentCandidate!==false||fullManifest.worldConvergence?.releaseVersionDeclared!==true)throw new Error('world convergence release identity drift');
if(fullManifest.visualUniverse?.primarySceneProvider!=='v1.scene.living-world')throw new Error('shipping Living foreground provider missing');
if(!Object.values(fullManifest.visualUniverse?.primaryPixelBackendPolicy||{}).length||!Object.values(fullManifest.visualUniverse.primaryPixelBackendPolicy).every(value=>String(value).includes('DEEP3D')))throw new Error('shipping Deep3D primary pixel topology missing');
if(fullManifest.visualUniverse?.semanticCanvasRole!=='INTERACTION_ACCESSIBILITY_AND_LABEL_OVERLAY_ONLY')throw new Error('shipping Canvas role is not constrained to semantic overlay duties');
if(fullManifest.runtime?.strictSingleFile!==true||fullManifest.runtime?.directFile!==true||fullManifest.runtime?.offline!==true||fullManifest.runtime?.networkRequired!==false)throw new Error('single-file/offline runtime contract drift');

const living=docs.filter(v=>v.schema==='ofu-v2-living-browser-evidence-1');
assertExactRenderingBrowserMatrix(living,'v1 Living product browser evidence');
for(const row of living){
 if(row.status!=='PASS'||row.suite!=='v1-browser-product'||row.sourceCommit!==expectedSource||row.artifactSha256!==fullManifest.artifactSha256||row.componentManifestHash!==fullManifest.componentManifestHash)throw new Error('Living exact-source/artifact evidence mismatch '+tuple(row));
 if(row.productVersion!=='2.0.0'||row.releaseLine!=='v2.0.0'||row.releaseStatus!=='STABLE_RELEASE'||row.historicalBaseline!==false||row.stableRelease!==true||row.foregroundProvider!=='v1.scene.living-world')throw new Error('Living release identity/foreground drift '+tuple(row));
 if(row.cases<84||row.directFile!==true||row.offline!==true||row.unexpectedNetworkRequests!==0||row.pageErrors!==0||row.physicalDevices!=='NOT_VERIFIED')throw new Error('Living product release journey incomplete '+tuple(row));
 if(!row.selected||row.discovery?.canonicalId!==row.selected||row.discovery?.navigationId===row.discovery?.canonicalId)throw new Error('Living canonical identity handoff invalid '+tuple(row));
 if(row.gestures?.wheel?.from!=='REGION'||row.gestures?.wheel?.in!=='NEIGHBORHOOD'||row.gestures?.wheel?.out!=='REGION'||row.gestures?.input?.activePointers!==0||row.gestures?.input?.pinchActive!==false||!(row.gestures?.input?.cancellations>0))throw new Error('Living wheel/pinch evidence incomplete '+tuple(row));
 if(row.micro?.regime!=='microstructure'||row.micro?.transitionTo!=='MICROSTRUCTURE'||!row.micro?.sourceEntityId)throw new Error('Living microscopic handoff invalid '+tuple(row));
 if(row.sessionScale?.returned!=='human'||row.sessionScale?.current!=='human'||row.mutatedScale?.livingStage!=='GALAXY'||row.restore?.livingStage!=='HUMAN'||row.restore?.legacyScale!=='human'||row.restore?.livingSpatialRestored!==true)throw new Error('Living save/restore scale evidence invalid '+tuple(row));
 const m=row.mobile;if(!m||m.scrollWidth>m.innerWidth+1||m.canvas?.width<=0||m.canvas?.height<=0||m.stage?.left<-1||m.stage?.right>m.innerWidth+1||m.minRailButtonHeight<44)throw new Error('Living mobile-width evidence invalid '+tuple(row));
}
if(new Set(living.map(r=>r.sourceCommit)).size!==1||new Set(living.map(r=>r.artifactSha256)).size!==1)throw new Error('Living cross-runtime source/artifact drift');

const pxEvidence=docs.filter(r=>r.schema==='ofu-px-browser-evidence-2');
const pxSeal=fullManifest.px?validatePXV1Evidence(pxEvidence,fullManifest,expectedSource):null;
console.log(JSON.stringify({status:'PASS',sourceCommit:expectedSource,artifactSha256:fullManifest.artifactSha256,foundationArtifactSha256:[...artifacts][0],artifactScope:'V2_LIVING_PRODUCT_WITH_SEPARATE_FOUNDATION_RENDERING_REGRESSION',foregroundProvider:fullManifest.visualUniverse.primarySceneProvider,releaseLine:fullManifest.releaseLine,pxSeal,foundationBrowsers:rows.map(r=>({browser:r.browser,platform:r.platform,arch:r.arch,backend:r.backend})),livingBrowsers:living.map(r=>({browser:r.browser,platform:r.platform,arch:r.arch,cases:r.cases,selected:r.selected})),componentManifestHash:[...manifests][0],canonicalWitness:rows[0].canonicalWitness,timingPolicy:'MEASURED_EVIDENCE_NOT_CROSS_MACHINE_DETERMINISTIC_GATE'},null,2));
