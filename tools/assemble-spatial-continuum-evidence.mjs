import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r4'));
const distManifestPath=path.join(root,'dist','spatial-continuum-build-manifest.json');
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const head=git(['rev-parse','HEAD']);
const tree=git(['rev-parse','HEAD^{tree}']);
const dirty=git(['status','--porcelain']).length>0;
const build=readJson(distManifestPath);
if(dirty&&process.env.OFU_ALLOW_DIRTY_EVIDENCE!=='1')throw new Error('Refusing to assemble canonical evidence from a dirty worktree');
if(build.source.commit!==head||build.source.tree!==tree)throw new Error('Build manifest does not describe the exact checked-out source revision');

const suitePaths=['open-universe.json','open-generalization.json','matrix-results.json','performance-results.json','accessibility-mobile-context.json','visual-sequence/visual-sequence.json'];
const suites={};
for(const relative of suitePaths){
  const file=path.join(evidenceDir,relative);
  if(fs.existsSync(file)){const bytes=fs.readFileSync(file);suites[relative]={sha256:sha(bytes),data:JSON.parse(bytes)}}
}
const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const file=path.join(directory,entry.name);return entry.isDirectory()?walk(file):[file]});
const images=fs.existsSync(evidenceDir)?walk(evidenceDir).filter(file=>/\.(?:png|webp)$/i.test(file)).sort().map(file=>{const bytes=fs.readFileSync(file);return{name:path.relative(evidenceDir,file).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)}}):[];
const open=suites['open-universe.json']?.data;
const generalization=suites['open-generalization.json']?.data;
const matrix=suites['matrix-results.json']?.data;
const performance=suites['performance-results.json']?.data;
const accessibility=suites['accessibility-mobile-context.json']?.data;
const visual=suites['visual-sequence/visual-sequence.json']?.data;
const recommendation=process.env.OFU_CONTINUUM_RECOMMENDATION||'CONTINUE_EXPERIMENT';
if(!['OPEN_UNIVERSE_DIRECTION_REJECTED','CONTINUE_EXPERIMENT','OPEN_UNIVERSE_ARCHITECTURE_PROVEN'].includes(recommendation))throw new Error('Invalid R4 recommendation');
const manifest={
  contract:'ofu-spatial-continuum-r4-evidence-1',
  status:suitePaths.every(relative=>suites[relative]?.data?.status==='PASS')?'PASS':'INCOMPLETE',
  source:{repository:'VaX1989/One_File_Universe',commit:head,tree,clean:!dirty},base:build.base,artifact:build.artifact,engine:build.engine,
  claims:{
    freshUniverseEntry:open?.visibleGalaxies>1,visibleGalaxies:open?.visibleGalaxies,distinctGalaxyBranches:open?.distinctGalaxyBranches,
    distinctWorlds:generalization?.distinctWorlds,distinctSystems:generalization?.distinctSystems,
    lazyMaterialization:open?.cache?.bounded===true,rendererOwnedPicking:open?.rendererOwnedGalaxyPicking===true&&open?.rendererOwnedSurfacePicking===true&&open?.rendererOwnedLocalPicking===true,
    arbitrarySurfaceTargeting:!!open?.selectedSurface,planetaryTopology:open?.planetaryTopology,microVariation:open?.microVariation===true,
    boundedCache:generalization?.cache?.bounded===true,boundedHistory:open?.branchHistoryBounded===true,
    all15Landmarks:visual?.all15Landmarks===true,transitionInterruptionRecovered:visual?.interruptionRecovered===true,
    directFile:matrix?.results?.every?.(item=>item.directFile===true),offline:matrix?.results?.every?.(item=>item.offline===true),
    continuumBrowsers:matrix?.continuumTested||[],physicalGpuEvidence:performance?.physicalGpuEvidence||'UNTESTED',mobileAndAccessibility:accessibility?.status==='PASS'
  },
  suites,images,
  researchSources:[
    'https://cesium.com/learn/cesium-native/ref-doc/selection-algorithm-details.html',
    'https://cesium.com/downloads/cesiumjs/releases/b24/Documentation/TerrainMesh.html',
    'https://developer.nvidia.com/gpugems/gpugems2/part-i/geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry',
    'https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/'
  ],recommendation
};
fs.mkdirSync(evidenceDir,{recursive:true});
const output=path.join(evidenceDir,'evidence-manifest.json');
fs.writeFileSync(output,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:manifest.status,output,source:manifest.source,artifact:manifest.artifact,recommendation,images:images.length},null,2));
