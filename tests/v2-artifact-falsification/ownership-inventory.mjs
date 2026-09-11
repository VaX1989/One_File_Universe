import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {emittedComponent,loadComponents} from '../../tools/extensions/components.mjs';
import {bundleLifeShippingRuntime} from '../../src/v2x-08-life-ecology-evolution-embodiment/shipping-bundle.mjs';

const ROOT=process.cwd();
const MATRIX='docs/parallel/V2X_OWNERSHIP_MATRIX.json';
const ARTIFACT='dist/One_File_Universe.html';
const REPORT='dist/evidence/v2-exact-artifact-falsification/ownership-inventory.json';
const SOURCE_ROOT=/^(?:src|assets|data|config\/extensions)\//;
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const readText=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8').replace(/\r\n?/g,'\n');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean);
const globRegex=pattern=>{
  const marker='__DOUBLE_STAR__';
  const escaped=String(pattern)
    .replace(/[.+^${}()|[\]\\]/g,'\\$&')
    .replace(/\*\*/g,marker)
    .replace(/\*/g,'[^/]*')
    .replace(/\?/g,'[^/]')
    .replaceAll(marker,'.*');
  return new RegExp('^'+escaped+'$');
};

execFileSync(process.execPath,['tools/build-ofu-rendering-v09.mjs'],{cwd:ROOT,stdio:['ignore','pipe','inherit']});
const html=readText(ARTIFACT);
const matrix=JSON.parse(readText(MATRIX));
const plan=loadComponents(ROOT);
const bySource=new Map();
for(const component of plan){
  const list=bySource.get(component.source)||[];
  list.push(component);
  bySource.set(component.source,list);
}
const lifeBundlePath='src/v2x-08-life-ecology-evolution-embodiment/shipping-runtime.js';
const lifeBundleInputs=new Set(['model.js','embodiment.js','renderer.js','evolution.js','succession.js','provider.js','viewport-bridge.js','shipping-adapter.js'].map(name=>'src/v2x-08-life-ecology-evolution-embodiment/'+name));
const lifeBundleComponent=(bySource.get(lifeBundlePath)||[])[0]||null;
const lifeBundleValid=readText(lifeBundlePath).trimEnd()===bundleLifeShippingRuntime().replace(/\r\n?/g,'\n').trimEnd();
const lifeBundleEmitted=Boolean(lifeBundleComponent&&html.includes(emittedComponent(lifeBundleComponent)));

const ownersByPath=new Map();
for(const [laneId,lane] of Object.entries(matrix.lanes||{})){
  if(!/^V2X-(?:0[1-9]|1[0-6])$/.test(laneId))continue;
  for(const pattern of lane.allowedPatterns||[]){
    const matcher=globRegex(pattern);
    for(const rel of tracked){
      if(!SOURCE_ROOT.test(rel)||!matcher.test(rel))continue;
      if(!ownersByPath.has(rel))ownersByPath.set(rel,new Set());
      ownersByPath.get(rel).add(laneId);
    }
  }
}

const files=[];
for(const [rel,laneIds] of ownersByPath){
  const bytes=fs.readFileSync(path.join(ROOT,rel));
  const text=/\.(?:js|mjs|json|css|glsl|wgsl|html|txt)$/i.test(rel)?bytes.toString('utf8').replace(/\r\n?/g,'\n').trimEnd():null;
  const components=bySource.get(rel)||[];
  const manifested=components.length>0;
  const emitted=components.some(component=>html.includes(emittedComponent(component)));
  const directlyEmbedded=text?html.includes(text)||html.includes(text.replace(/<\/script/gi,'<\\/script')):false;
  const deterministicBundleInput=laneIds.has('V2X-08')&&lifeBundleInputs.has(rel)&&lifeBundleValid&&lifeBundleEmitted;
  files.push({
    path:rel,
    laneIds:[...laneIds].sort(),
    bytes:bytes.length,
    sha256:sha256(bytes),
    componentIds:components.map(component=>component.id),
    manifested,
    emitted,
    directlyEmbedded,
    deterministicBundleInput,
    bundledBy:deterministicBundleInput?lifeBundleComponent.id:null,
    shipped:emitted||directlyEmbedded||deterministicBundleInput
  });
}
files.sort((a,b)=>a.path.localeCompare(b.path));

const unshipped=files.filter(file=>!file.shipped);
const multiplyOwned=files.filter(file=>file.laneIds.length>1).map(file=>({path:file.path,laneIds:file.laneIds}));
const sourceComponentCollisions=files.filter(file=>file.componentIds.length>1).map(file=>({path:file.path,componentIds:file.componentIds}));
const hardFailures=[];
if(unshipped.length)hardFailures.push('OWNED_SOURCE_UNSHIPPED');
if(multiplyOwned.length)hardFailures.push('OWNED_SOURCE_MULTIPLE_LANE_AUTHORITY');
if(sourceComponentCollisions.length)hardFailures.push('SOURCE_REGISTERED_BY_MULTIPLE_SHIPPING_COMPONENTS');
const report={
  schema:'ofu-v2-exact-artifact-ownership-inventory-1',
  status:hardFailures.length?'FAIL':'PASS',
  sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),
  sourceTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:ROOT,encoding:'utf8'}).trim(),
  trackedFileCount:tracked.length,
  v2OwnedSourceCount:files.length,
  shippedSourceCount:files.length-unshipped.length,
  unshipped,
  multiplyOwned,
  sourceComponentCollisions,
  hardFailures,
  deterministicBundles:{lifeV2:{valid:lifeBundleValid,componentId:lifeBundleComponent?.id||null,artifactIncluded:lifeBundleEmitted,inputCount:lifeBundleInputs.size}},
  files
};
fs.mkdirSync(path.dirname(path.join(ROOT,REPORT)),{recursive:true});
fs.writeFileSync(path.join(ROOT,REPORT),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({schema:report.schema,status:report.status,sourceHead:report.sourceHead,sourceTree:report.sourceTree,v2OwnedSourceCount:report.v2OwnedSourceCount,shippedSourceCount:report.shippedSourceCount,unshippedCount:unshipped.length,multiplyOwnedCount:multiplyOwned.length,sourceComponentCollisionCount:sourceComponentCollisions.length,hardFailures,unshipped:unshipped.slice(0,64).map(file=>file.path),reportPath:REPORT}));
if(hardFailures.length)process.exitCode=1;
