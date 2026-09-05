import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=process.argv[2]||'evidence',files=[];
function walk(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())walk(file);
  else if(entry.name.endsWith('.json'))files.push(file);
 }
}
walk(root);
const rows=files.map(file=>JSON.parse(fs.readFileSync(file,'utf8'))).filter(value=>value.sourceCommit&&value.browser);
if(rows.length!==5)throw new Error('expected exactly five browser evidence records, got '+rows.length);

for(const row of rows){
 if(row.status!=='PASS'||row.unexpectedNetworkRequests!==0||row.pageErrors!==0)throw new Error('invalid browser evidence '+row.browser);
 if(row.canonicalWitness.p4Current!==row.canonicalWitness.p4Replay)throw new Error('P4 witness mismatch '+row.browser);
 if(row.canonicalWitness.p6State!=='INSUFFICIENT_ENVIRONMENT'||row.canonicalWitness.p6BiologyEstablished!==false)throw new Error('P6 preview honesty drift '+row.browser);
 if(row.telemetry?.raf?.measurement!=='MEASURED'||row.telemetry?.cpuTerrainBuild?.measurement!=='MEASURED'||row.telemetry?.startup?.measurement!=='MEASURED'||row.telemetry?.cacheCounts?.measurement!=='MEASURED')throw new Error('required measured telemetry missing '+row.browser);
 for(const key of ['steadyStateSurface','lodChurn','originRebasing','referenceFrameTransition','contextLossRecovery']){
  const metric=row.performanceRegimes?.[key];
  if(metric?.measurement!=='MEASURED'||metric.samples<20||metric.p50>metric.p95||metric.p95>metric.p99)throw new Error('invalid RAF evidence '+row.browser+' '+key);
 }
 if(row.backend==='webgl2'){
  if(!row.gpu||row.gpu.liveMeshes>row.gpu.maxMeshes||row.gpu.liveTrackedBytes>row.gpu.maxBytes)throw new Error('GPU bounds invalid '+row.browser);
  if(row.gpu.deletedBuffers===0||row.gpu.createdBuffers<=row.gpu.liveBuffers||row.gpu.lifecycleAccountingExact!==true)throw new Error('GPU lifecycle accounting invalid '+row.browser);
  if(row.telemetry.gpuUpload.measurement!=='MEASURED'||row.telemetry.rendererGpuBytes.measurement!=='DERIVED')throw new Error('GPU telemetry labeling invalid '+row.browser);
  if(!['PASS','NOT_MEASURABLE'].includes(row.contextRecovery?.status))throw new Error('context-loss evidence invalid '+row.browser);
 }else if(row.telemetry.gpuUpload.measurement!=='NOT MEASURABLE'||row.telemetry.rendererGpuBytes.measurement!=='NOT MEASURABLE')throw new Error('fallback GPU telemetry must be explicit '+row.browser);
 if(row.telemetry.physicalDriverVram?.measurement!=='NOT MEASURABLE')throw new Error('physical VRAM telemetry must not be fabricated');
}

const commits=new Set(rows.map(row=>row.sourceCommit)),artifacts=new Set(rows.map(row=>row.artifactSha256)),manifests=new Set(rows.map(row=>row.componentManifestHash)),witnesses=new Set(rows.map(row=>JSON.stringify(row.canonicalWitness)));
if(commits.size!==1||artifacts.size!==1||manifests.size!==1||witnesses.size!==1)throw new Error('cross-runtime exact-head/artifact/witness drift');
if(!rows.some(row=>row.platform==='darwin'&&row.arch==='arm64'&&row.browser==='webkit'))throw new Error('macOS ARM64 WebKit evidence missing');
if(!rows.some(row=>row.platform==='win32'&&row.browser==='chromium'))throw new Error('Windows Chromium evidence missing');
if(!rows.some(row=>row.platform==='linux'&&row.browser==='firefox'))throw new Error('Linux Firefox evidence missing');
if(!rows.some(row=>row.platform==='linux'&&row.browser==='webkit'))throw new Error('Linux WebKit evidence missing');
const chromium=rows.find(row=>row.platform==='linux'&&row.browser==='chromium');
if(!chromium||chromium.backend!=='webgl2'||chromium.visual.pixelCheck!=='MEASURED'||chromium.visual.nonBackgroundPixels<8)throw new Error('Linux Chromium WebGL2 visual seal missing');

// A foundation proof and a full-product proof are separate artifacts at one
// source commit. Never relabel the foundation hash as the shipping-product hash.
const uniqueFile=name=>{const matches=files.filter(f=>path.basename(f)===name);if(matches.length!==1)throw new Error('expected one '+name);return matches[0]};
const fullManifestPath=uniqueFile('rendering-build-manifest.json'),foundationManifestPath=uniqueFile('rendering-foundation-manifest.json');
const fullManifest=JSON.parse(fs.readFileSync(fullManifestPath,'utf8')),foundationManifest=JSON.parse(fs.readFileSync(foundationManifestPath,'utf8'));
const expectedSource=process.env.OFU_SOURCE_SHA;if(!expectedSource||expectedSource!==[...commits][0])throw new Error('seal source pin mismatch');
for(const [manifest,html] of [[fullManifest,path.join(path.dirname(fullManifestPath),'One_File_Universe.html')],[foundationManifest,path.join(path.dirname(foundationManifestPath),'One_File_Universe-foundation.html')]]){
 const bytes=fs.readFileSync(html),hash=createHash('sha256').update(bytes).digest('hex');
 if(manifest.sourceCommit!==expectedSource||manifest.artifactBytes!==bytes.length||manifest.artifactSha256!==hash||manifest.componentManifestHash!==[...manifests][0])throw new Error('artifact bytes/source/component pin mismatch');
}
if(foundationManifest.artifactSha256!==[...artifacts][0])throw new Error('foundation browser/artifact hash mismatch');
if(fullManifest.waveIVRuntime?.version!=='ofu-wave-iv-scale-runtime-3'||fullManifest.surfacePresentation?.coverageArchitecture!=='FRUSTUM_GROUND_FOOTPRINT_BOUNDED')throw new Error('full product composition missing');
const fullRows=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8'))).filter(v=>v.artifactScope==='FULL_WAVE_IV_PRODUCT');
const tuple=r=>[r.platform,r.arch,r.browser].join('/');
if(fullRows.length!==5||new Set(fullRows.map(tuple)).size!==5)throw new Error('expected five distinct full-product visual records');
for(const row of rows){
 const full=fullRows.find(v=>tuple(v)===tuple(row));
 if(!full||full.status!=='PASS'||full.exactSourceSha!==expectedSource||full.artifactSha256!==fullManifest.artifactSha256||full.canonicalWitnessNonInterference!==true)throw new Error('full-product exact-source visual evidence mismatch '+tuple(row));
 for(const [k,v] of Object.entries(row.canonicalWitness))if(full.canonicalWitness?.[k]!==v)throw new Error('full-product canonical witness mismatch '+k);
 if(!['PASS','NOT_MEASURABLE'].includes(full.surfaceContextRecovery?.status))throw new Error('surface context recovery evidence missing');
 if(full.surfaceContextRecovery.status==='PASS'&&(full.surfaceContextRecovery.framebuffer?.status!=='MEASURED'||full.surfaceContextRecovery.framebuffer.cpuHits<8||full.surfaceContextRecovery.framebuffer.cpuHitClear!==0))throw new Error('surface recovery framebuffer coverage invalid');
 if(full.physicalAndroid!=='NOT_VERIFIED')throw new Error('automated evidence cannot assert physical Android verification');
 if(full.legacyCloseProbes?.length!==3||full.repeatedNavigation?.length!==18)throw new Error('historical probes or repeated-navigation evidence incomplete');
 for(const viewport of ['desktop','mobile']){
  const frame=full[viewport];if(!frame?.orbit||!frame?.approach||!frame?.close?.local||frame.close.local.mode!=='LOCAL')throw new Error('renderer-specific visual evidence missing');
  if(row.browser==='chromium'){
   for(const name of ['orbit','approach'])if(frame[name].coverage?.applicable!==true||frame[name].coverage.guaranteedPixels<1||frame[name].coverage.clearGuaranteedPixels!==0)throw new Error('globe framebuffer coverage missing or invalid');
   const vao=frame.close.local.passState;if(vao?.status!=='MEASURED'||vao.error!==0||!vao.defaultArrayBound||vao.instanceAttributeEnabled!==false||vao.gpu?.vertexArrays?.liveArrays!==2||vao.gpu.vertexArrays.lifecycleAccountingExact!==true)throw new Error('surface GPU pass ownership evidence invalid');
   const local=frame.close.local.framebuffer;
   if(local?.status!=='MEASURED'||local.cpuHits<8||local.cpuHitClear!==0)throw new Error('independent surface framebuffer coverage missing or invalid');
  }
 }
}

console.log(JSON.stringify({
 status:'PASS',
 sourceCommit:[...commits][0],
 artifactSha256:fullManifest.artifactSha256,
 foundationArtifactSha256:[...artifacts][0],
 artifactScope:'FULL_WAVE_IV_PRODUCT_WITH_SEPARATE_FOUNDATION_REGRESSION',
 fullProductBrowsers:fullRows.map(v=>({browser:v.browser,platform:v.platform,arch:v.arch,desktopSurface:v.desktop.close.local.framebuffer.status,mobileSurface:v.mobile.close.local.framebuffer.status})),
 componentManifestHash:[...manifests][0],
 canonicalWitness:rows[0].canonicalWitness,
 timingPolicy:'MEASURED_EVIDENCE_NOT_CROSS_MACHINE_DETERMINISTIC_GATE',
 browsers:rows.map(row=>({browser:row.browser,platform:row.platform,arch:row.arch,backend:row.backend,dpr:row.dpr,gpu:row.gpu?{liveMeshes:row.gpu.liveMeshes,liveTrackedBytes:row.gpu.liveTrackedBytes,deletedBuffers:row.gpu.deletedBuffers,invalidatedBuffers:row.gpu.invalidatedBuffers}:null,steadyP50:row.performanceRegimes.steadyStateSurface.p50,steadyP95:row.performanceRegimes.steadyStateSurface.p95,steadyP99:row.performanceRegimes.steadyStateSurface.p99,longFramesOver100:row.performanceRegimes.steadyStateSurface.longFramesOver100}))
},null,2));
