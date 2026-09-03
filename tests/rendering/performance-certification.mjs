import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {spawnSync} from 'node:child_process';

const browser=process.env.BROWSER||'chromium';
const dpr=Number(process.env.DPR||1);
const repeats=Math.max(1,Number(process.env.PERF_REPEATS||3));
const expectedBackend=process.env.EXPECTED_BACKEND||'';
const sourceSha=process.env.OFU_SOURCE_SHA||'';
const baseDir='dist/evidence/rendering-production';
const runDir='dist/evidence/browser-performance/runs';
fs.mkdirSync(runDir,{recursive:true});

function productionEvidencePath(){
  return path.join(baseDir,`browser-${process.platform}-${process.arch}-${browser}-dpr${dpr}.json`);
}
function q(a,p){
  const b=[...a].sort((x,y)=>x-y);
  return b[Math.min(b.length-1,Math.floor((b.length-1)*p))]??null;
}
const runs=[];
for(let i=0;i<repeats;i++){
  const r=spawnSync(process.execPath,['tests/rendering/browser-production.mjs'],{stdio:'inherit',env:{...process.env,BROWSER:browser,DPR:String(dpr)}});
  if(r.status!==0) process.exit(r.status??1);
  const p=productionEvidencePath();
  if(!fs.existsSync(p)) throw new Error(`missing production evidence ${p}`);
  const evidence=JSON.parse(fs.readFileSync(p,'utf8'));
  if(expectedBackend&&evidence.backend!==expectedBackend) throw new Error(`backend mismatch expected=${expectedBackend} actual=${evidence.backend}`);
  if(sourceSha&&evidence.sourceCommit!==sourceSha) throw new Error(`source SHA mismatch expected=${sourceSha} actual=${evidence.sourceCommit}`);
  runs.push(evidence);
  fs.copyFileSync(p,path.join(runDir,`run-${String(i+1).padStart(2,'0')}-${path.basename(p)}`));
}

const regimes=['steadyStateSurface','lodChurn','originRebasing','referenceFrameTransition','contextLossRecovery'];
const aggregate={};
for(const regime of regimes){
  const values=runs.map(r=>r.performanceRegimes?.[regime]||r.telemetry?.raf?.regimes?.[regime]).filter(Boolean);
  aggregate[regime]={
    runCount:values.length,
    p50AcrossRunP50:q(values.map(v=>v.p50),.5),
    p95AcrossRunP95:q(values.map(v=>v.p95),.95),
    p99AcrossRunP99:q(values.map(v=>v.p99),.99),
    maxObservedP99:Math.max(...values.map(v=>v.p99)),
    totalFramesOver100:values.reduce((s,v)=>s+(v.longFramesOver100||v.over100||0),0)
  };
}
const cold=runs.map(r=>r.performanceRegimes?.coldStartup?.durationMs??r.telemetry?.startup?.coldMs);
const warm=runs.map(r=>r.performanceRegimes?.warmStartup?.durationMs??r.telemetry?.startup?.warmMs);
const cpu=runs.map(r=>r.telemetry?.cpuTerrainBuild?.cumulativeMs).filter(Number.isFinite);
const submission=runs.map(r=>r.telemetry?.gpuUpload?.cpuSubmissionWallMs).filter(Number.isFinite);
const summary={
  status:'PASS',sourceCommit:sourceSha||runs[0]?.sourceCommit||null,browser,browserVersion:runs[0]?.browserVersion||null,
  playwrightVersion:runs[0]?.playwrightVersion||null,nodeVersion:process.version,platform:process.platform,arch:process.arch,osRelease:os.release(),
  headless:true,dpr,repeats,backend:runs[0]?.backend||null,expectedBackend:expectedBackend||null,
  startupMs:{cold:{min:Math.min(...cold),median:q(cold,.5),p95:q(cold,.95),max:Math.max(...cold)},warm:{min:Math.min(...warm),median:q(warm,.5),p95:q(warm,.95),max:Math.max(...warm)}},
  regimes:aggregate,
  cpuTerrainBuildCumulativeMs:cpu.length?{median:q(cpu,.5),p95:q(cpu,.95),max:Math.max(...cpu)}:{measurement:'NOT_MEASURABLE'},
  gpuSubmissionWallMs:submission.length?{median:q(submission,.5),p95:q(submission,.95),max:Math.max(...submission)}:{measurement:'NOT_MEASURABLE'},
  gpuTimer:runs.map(r=>r.gpuTimerQuery||r.telemetry?.gpuTimer||null),
  heap:runs.map(r=>r.telemetry?.heap||null),
  rendererTrackedGpuBytes:runs.map(r=>r.telemetry?.rendererGpuBytes||null),
  physicalDriverVram:{measurement:'NOT_MEASURABLE',reason:'NO_PORTABLE_BROWSER_API'},
  note:'Repeated CI characterization only. This is not real-device certification and does not establish normative SLOs.'
};
fs.mkdirSync('dist/evidence/browser-performance',{recursive:true});
const out=`dist/evidence/browser-performance/performance-${process.platform}-${process.arch}-${browser}-dpr${dpr}.json`;
fs.writeFileSync(out,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
