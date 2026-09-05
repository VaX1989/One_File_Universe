import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import crypto from 'node:crypto';
import {resolve,samplePrimaryMassSolar,systemBirthBoundary} from './wv-a-research-provider.mjs';
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const qs=Array.from({length:600},(_,i)=>({kind:i%3===0?'GALAXY':i%3===1?'LOCAL_POPULATION':'SYSTEM_BIRTH',key:`wva-${i}`,args:{environmentQ:(i%101)/100,rNorm:(i%37)/18,zNorm:(i%11)/10}}));
const a=qs.map(q=>[q.key,resolve(q.kind,q.key,q.args)]);
const b=[...qs].reverse().map(q=>[q.key,resolve(q.kind,q.key,q.args)]).reverse();
assert.deepEqual(a,b,'query order independence');
for(const q of qs.slice(0,50))assert.deepEqual(resolve(q.kind,q.key,q.args),resolve(q.kind,q.key,q.args),'repeat determinism');
const work=chunk=>new Promise((ok,fail)=>{const w=new Worker(new URL('./wv-a-worker.mjs',import.meta.url),{workerData:chunk});w.on('message',ok);w.on('error',fail)});
const [w1,w2]=await Promise.all([work(qs.filter((_,i)=>i%2===0)),work(qs.filter((_,i)=>i%2===1))]);
const map=new Map([...w1,...w2]);for(const [k,v] of a)assert.deepEqual(map.get(k),v,'worker independence');
let low=0,mid=0,high=0;for(let i=0;i<20000;i++){const m=samplePrimaryMassSolar(`imf-${i}`);if(m<0.5)low++;else if(m<8)mid++;else high++}
assert(low>mid*1.3);assert(high<mid*0.08);
let sx=0,sy=0,sxx=0,sxy=0,n=4000;for(let i=0;i<n;i++){const s=systemBirthBoundary(`disk-${i}`,(i%101)/100),x=Math.log10(s.primaryMassSolar),y=Math.log10(s.diskPrior.dustMassEarth);sx+=x;sy+=y;sxx+=x*x;sxy+=x*y}
const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);assert(slope>1.1&&slope<1.9);
console.log(JSON.stringify({status:'PASS',queries:qs.length,workerPartitions:2,imf:{low,mid,high},diskLogSlope:slope,maxDependencyDepth:4,maxDeriveCount:31,corpusDigest:digest(a.slice(0,64))},null,2));
