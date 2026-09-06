import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const context=vm.createContext({console,performance,Float32Array,ArrayBuffer,Math,Object,String,Number,Error,TypeError,Set});
vm.runInContext(fs.readFileSync(path.join(root,'src/v1x-03-macrocosm-rendering/macro-core.js'),'utf8'),context,{filename:'macro-core.js'});
const C=context.OFU.v1x03MacroCore;
const camera={contract:'EXTERNAL_CAMERA_RESOURCE_FIXTURE',position:[0,0,-1000],target:[0,0,1200],up:[0,1,0],fovYRadians:Math.PI/3,near:1,far:10000};
const scale={contract:'ofu-wave-iv-scale-runtime-3',distanceIntentRadii:100,anchors:{galaxy:1000,region:100,stellar_neighborhood:10}};
const viewport={width:1280,height:720,devicePixelRatio:1};
function scene(count){return {contract:'RESOURCE_FIXTURE_3D',dimension:3,frameId:'RESOURCE_FIXTURE',entities:Array.from({length:count},(_,i)=>({id:'fixture:'+i,kind:i%5?'GALAXY':'GALACTIC_REGION',authority:'PRESENTATION_ONLY',position:[((i%80)-40)*11,(Math.floor(i/80)%40-20)*9,500+Math.floor(i/320)*27],radius:6+(i%7),presentation:{minDetail:i%5?0:.18,priority:i%97===0?1:0}}))}}
function quantile(values,q){const a=[...values].sort((x,y)=>x-y);const i=Math.min(a.length-1,Math.max(0,Math.ceil(q*a.length)-1));return a[i]}
function measure(count,quality){const s=scene(count);for(let i=0;i<5;i++)C.prepareFrame({scene:s,camera,scale,viewport,quality});const before=process.memoryUsage();const samples=[];let last;for(let i=0;i<25;i++){const t0=process.hrtime.bigint();last=C.prepareFrame({scene:s,camera,scale,viewport,quality});const t1=process.hrtime.bigint();samples.push(Number(t1-t0)/1e6)}const after=process.memoryUsage();return {inputCount:count,quality,iterations:samples.length,minMs:Math.min(...samples),medianMs:quantile(samples,.5),p95Ms:quantile(samples,.95),maxMs:Math.max(...samples),heapUsedDeltaBytes:after.heapUsed-before.heapUsed,rssDeltaBytes:after.rss-before.rss,frameHash:last.hash,counters:last.resources}}
const result={status:'PASS',contract:'ofu-v1x-03-resource-evidence-1',authority:'MEASURED_RUNTIME_EVIDENCE',canonicalPromotion:false,scope:'NODE_CPU_FRAME_PREPARATION_ONLY',environment:{node:process.version,platform:process.platform,arch:process.arch,cpuModel:os.cpus()[0]?.model||'UNKNOWN',logicalCpuCount:os.cpus().length},limitations:['Does not measure browser GPU time or GPU memory.','Node process memory deltas include runtime allocator noise.','Synthetic fixture coordinates are PRESENTATION_ONLY and are not astronomy facts.'],measurements:[measure(128,'low'),measure(1200,'balanced'),measure(5000,'balanced'),measure(5000,'high')]};
const outDir=path.join(root,'reports/v1x-03-macrocosm-rendering');fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'resource-evidence.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
