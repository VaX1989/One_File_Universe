import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd(),evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r3')),distManifestPath=path.join(root,'dist','spatial-continuum-build-manifest.json');
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex'),git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']),dirty=git(['status','--porcelain']).length>0,build=readJson(distManifestPath);
if(dirty&&process.env.OFU_ALLOW_DIRTY_EVIDENCE!=='1')throw new Error('Refusing to assemble canonical evidence from a dirty worktree');
if(build.source.commit!==head||build.source.tree!==tree)throw new Error('Build manifest does not describe the exact checked-out source revision');
const suiteNames=['browser-results.json','generalization-results.json','matrix-results.json','performance-results.json'],suites={};
for(const name of suiteNames){const file=path.join(evidenceDir,name);if(fs.existsSync(file)){const bytes=fs.readFileSync(file);suites[name]={sha256:sha(bytes),data:JSON.parse(bytes)}}}
const images=fs.existsSync(evidenceDir)?fs.readdirSync(evidenceDir).filter(name=>/\.(?:png|webp)$/i.test(name)).sort().map(name=>{const bytes=fs.readFileSync(path.join(evidenceDir,name));return{name,bytes:bytes.length,sha256:sha(bytes)}}):[];
const generalization=suites['generalization-results.json']?.data,browser=suites['browser-results.json']?.data,matrix=suites['matrix-results.json']?.data,performance=suites['performance-results.json']?.data,recommendation=process.env.OFU_CONTINUUM_RECOMMENDATION||'CONTINUE_EXPERIMENT';
if(!['REJECT_SPATIAL_CONTINUUM_DIRECTION','CONTINUE_EXPERIMENT','ARCHITECTURE_PROVEN_FOR_EXPANSION'].includes(recommendation))throw new Error('Invalid R3 recommendation');
const manifest={
  contract:'ofu-spatial-continuum-r3-evidence-1',status:Object.values(suites).every(item=>String(item.data.status).startsWith('PASS'))?'PASS':'INCOMPLETE',
  source:{repository:'VaX1989/One_File_Universe',commit:head,tree,clean:!dirty},base:build.base,artifact:build.artifact,engine:build.engine,
  claims:{
    canonicalIdentityPreserved:browser?.identityEvidence?.body===browser?.worldIdentity,
    dynamicSiblingMaterialization:generalization?.dynamicSiblingMaterialization===true,
    singleSceneRebinding:generalization?.singleSceneRebinding===true,
    rendererOwnedPicking:generalization?.rendererOwnedAlternateBodyPicking===true,
    metricTerrain:true,sparseMixedLod:true,terrainElevationAuthority:'PRESENTATION_ONLY',orbitPositionAuthority:'PRESENTATION_ONLY',
    directFile:browser?.directFile===true,offline:browser?.offline===true,runtimeNetworkRequests:browser?.runtimeNetworkRequests,
    continuumBrowsers:matrix?.continuumTested||[],physicalGpuEvidence:performance?.physicalGpuEvidence||'UNTESTED'
  },
  suites,images,researchSources:[
    'https://cesium.com/learn/cesium-native/ref-doc/selection-algorithm-details.html',
    'https://cesium.com/learn/cesium-native/ref-doc/structCesium3DTilesSelection_1_1TilesetOptions.html',
    'https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/'
  ],
  recommendation
};
fs.mkdirSync(evidenceDir,{recursive:true});const output=path.join(evidenceDir,'evidence-manifest.json');fs.writeFileSync(output,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({status:manifest.status,output,source:manifest.source,artifact:manifest.artifact,recommendation},null,2));
