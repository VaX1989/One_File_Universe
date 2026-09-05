import {performance} from 'node:perf_hooks';
import {resolve} from './wv-a-research-provider.mjs';
const N=20000,t0=performance.now();let checksum=0;
for(let i=0;i<N;i++){
  const r=resolve('SYSTEM_BIRTH',`bench-${i}`,{environmentQ:(i%100)/99,rNorm:(i%29)/14,zNorm:(i%7)/6});
  checksum+=r.primaryMassSolar+r.diskPrior.environmentPerturbationQ;
}
const ms=performance.now()-t0;
console.log(JSON.stringify({status:'NON_CERTIFYING_LOCAL_BENCHMARK',node:process.version,platform:process.platform,arch:process.arch,lookups:N,totalMs:ms,lookupsPerSecond:N/(ms/1000),checksum,maxDependencyDepth:4,maxDeriveCount:31},null,2));
