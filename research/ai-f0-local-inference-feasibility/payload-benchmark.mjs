import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url'; import {performance} from 'node:perf_hooks';
const file=fileURLToPath(import.meta.url), here=path.dirname(file);
function mem(){const m=process.memoryUsage();return {rss:m.rss,heapUsed:m.heapUsed,external:m.external,arrayBuffers:m.arrayBuffers};}
function elapsed(fn){const t=performance.now();const v=fn();return {ms:performance.now()-t,value:v};}
function pseudoRandom(n){const b=Buffer.allocUnsafe(n);let x=0x6d2b79f5;for(let i=0;i<n;i++){x^=x<<13;x^=x>>>17;x^=x<<5;b[i]=x&255;}return b;}
function bench(n){global.gc?.(); const start=mem(); const a=elapsed(()=>pseudoRandom(n)); const afterRaw=mem(); const b=elapsed(()=>a.value.toString('base64')); const afterB64=mem(); const c=elapsed(()=>Buffer.from(b.value,'base64')); const afterDecode=mem(); const g=elapsed(()=>gzipSync(a.value,{level:1})); const br=elapsed(()=>brotliCompressSync(a.value,{params:{[constants.BROTLI_PARAM_QUALITY]:1}})); const peakRss=Math.max(start.rss,afterRaw.rss,afterB64.rss,afterDecode.rss); return {bytes:n,generationMs:a.ms,base64Bytes:Buffer.byteLength(b.value),base64EncodeMs:b.ms,base64DecodeMs:c.ms,gzipBytes:g.value.length,gzipMs:g.ms,brotliBytes:br.value.length,brotliMs:br.ms,memory:{start,afterRaw,afterB64,afterDecode,peakRss,peakRssDelta:peakRss-start.rss}};}
if(process.argv[2]==='--one'){console.log(JSON.stringify(bench(Number(process.argv[3]))));process.exit(0);}
const models=JSON.parse(fs.readFileSync(path.join(here,'model-candidates.json'),'utf8')).candidates;
const sizes=[16*1024*1024,64*1024*1024];
const proxy=sizes.map(n=>{const r=spawnSync(process.execPath,['--expose-gc',file,'--one',String(n)],{encoding:'utf8',maxBuffer:1024*1024});if(r.status!==0)throw new Error(r.stderr||`child ${r.status}`);return JSON.parse(r.stdout);});
function kvBytesPerToken(a,bytesPerScalar=2){return 2*a.layers*a.kvHeads*a.headDim*bytesPerScalar;}
const candidateEstimates=models.map(m=>{const kv=kvBytesPerToken(m.architecture);return {id:m.id,modelPayloadBytes:m.modelPayloadBytes,tokenizerBytesApprox:m.tokenizerBytesApprox,runtimeBytes:m.runtimeBytes,base64EmbeddedModelBytes:Math.ceil(m.modelPayloadBytes/3)*4,base64EmbeddedKnownModelPlusTokenizerBytes:Math.ceil((m.modelPayloadBytes+m.tokenizerBytesApprox)/3)*4,kvBytesPerTokenFp16:kv,kvMiBAt512:kv*512/1048576,kvMiBAt2048:kv*2048/1048576,kvMiBAt8192:kv*8192/1048576};});
console.log(JSON.stringify({schema:'ofu-ai-f0-payload-benchmark-1',runtime:process.version,platform:`${process.platform}-${process.arch}`,note:'Compression/decode timings use deterministic high-entropy synthetic byte payloads in fresh child processes; they are not model inference measurements.',proxy,candidateEstimates},null,2));
