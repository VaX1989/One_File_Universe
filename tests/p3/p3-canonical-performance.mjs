import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';

for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js']){
  globalThis.OFU=globalThis.OFU||{};vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
const A=OFU.p3Astronomy;
const ctx={masterSeed:Uint8Array.from({length:32},(_,i)=>i),semanticManifestHash:A.semanticManifestHash()};
let g=null,gk=null;
for(let i=0;i<20000&&!g;i++){
  const k={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
  const q=A.resolveGalaxy(ctx,k);if(q.status==='PRESENT'){g=q;gk=k;}
}
if(!g)throw new Error('P3 performance: representative galaxy not found');
const base={galaxyX:gk.x,galaxyY:gk.y,galaxyZ:gk.z,sectorX:0n,sectorY:0n,sectorZ:0n};
let system=null,key=null;
for(let i=0n;i<30000n&&!system;i++){
  const k={...base,siteX:i%512n,siteY:(i/512n)%512n,siteZ:0n};const q=A.resolveSystem(ctx,k);if(q.status==='PRESENT'){system=q;key=k;}
}
if(!system)throw new Error('P3 performance: representative system not found');
let planetKey=null;
if(system.facts.planetCount>0n)planetKey={...key,orbitSlot:0n};
if(!planetKey){
  for(let i=0n;i<50000n&&!planetKey;i++){
    const k={...base,siteX:i%512n,siteY:(i/512n)%512n,siteZ:(i/(512n*512n))%512n};const q=A.resolveSystem(ctx,k);
    if(q.status==='PRESENT'&&q.facts.planetCount>0n)planetKey={...k,orbitSlot:0n};
  }
}
if(!planetKey)throw new Error('P3 performance: representative planet not found');
function bench(name,n,fn){const t0=performance.now();for(let i=0;i<n;i++)fn(i);return {name,iterations:n,totalMs:performance.now()-t0};}
const before=process.memoryUsage().heapUsed;
const cold=bench('random-galaxy',200,i=>A.resolveGalaxy(ctx,{x:BigInt(i-100),y:BigInt((i*17)%101-50),z:BigInt((i*31)%53-26)}));
const repeated=bench('repeated-system',500,()=>A.resolveSystem(ctx,key));
const planet=bench('repeated-planet',300,()=>A.resolvePlanet(ctx,planetKey));
const after=process.memoryUsage().heapUsed;
const systemMetrics=A.resolveWithMetrics('system',ctx,key).metrics;
const planetMetrics=A.resolveWithMetrics('planet',ctx,planetKey).metrics;
const result={phase:'P3',status:'PASS',sourceSha:process.env.OFU_SOURCE_SHA||null,modelVersion:A.VERSION,node:process.version,platform:process.platform,arch:process.arch,
  timing:{randomGalaxyMsPerQuery:cold.totalMs/cold.iterations,repeatedSystemMsPerQuery:repeated.totalMs/repeated.iterations,repeatedPlanetMsPerQuery:planet.totalMs/planet.iterations},
  workingSet:{heapBeforeBytes:before,heapAfterBytes:after,heapDeltaBytes:after-before},dependency:{system:systemMetrics,planet:planetMetrics}};
if(systemMetrics.maxDepth>2||systemMetrics.deriveCalls>60)throw new Error('P3 performance: System dependency budget regression');
if(planetMetrics.maxDepth>3||planetMetrics.deriveCalls>70)throw new Error('P3 performance: Planet dependency budget regression');
fs.mkdirSync('dist/evidence',{recursive:true});fs.writeFileSync('dist/evidence/p3-performance.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
