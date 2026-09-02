import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';

globalThis.OFU={};
for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js']) vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
const P=OFU.p2,A=OFU.p3AstronomyPrototype;
const manifest={semanticManifestVersion:1n,canonicalProtocolVersion:'ofu-cbv-1',canonicalAddressVersion:1n,unicodeProfileVersion:'ofu-unicode-15.1.0-v1',numericContractVersion:1n,generatorSuite:'p3-universe-skeleton-prototype',generatorSuiteVersion:1n,subsystems:{astronomy:1n},domains:{astronomy:1n},dependencies:{kernel:'p2'},lawProfile:'baseline-p3-prototype',genesis:{prototype:true}};
const ctx={masterSeed:Uint8Array.from({length:32},(_,i)=>i),semanticManifestHash:P.semanticManifestHash(manifest)};
function measure(label,count,fn){
  const before=process.memoryUsage().heapUsed,t0=performance.now();
  let checksum=0;
  for(let i=0;i<count;i++){const r=fn(i);checksum^=r.status==='PRESENT'?1:0;}
  const elapsedMs=performance.now()-t0,after=process.memoryUsage().heapUsed;
  return {label,count,elapsedMs:Number(elapsedMs.toFixed(3)),meanMicros:Number((elapsedMs*1000/count).toFixed(3)),heapDeltaBytes:after-before,checksum};
}
let galaxyKey=null,galaxy=null;
for(let i=0;i<20000&&!galaxy;i++){
  const x=BigInt((i%120)-60),y=BigInt((Math.floor(i/120)%120)-60),z=BigInt(Math.floor(i/(120*120))-1);
  const g=A.resolveGalaxy(ctx,{x,y,z});if(g.status==='PRESENT'){galaxy=g;galaxyKey={x,y,z};}
}
if(!galaxy) throw new Error('no benchmark galaxy found');
const g={galaxyX:galaxyKey.x,galaxyY:galaxyKey.y,galaxyZ:galaxyKey.z};
let systemKey=null;
for(let i=0n;i<10000n&&!systemKey;i++){
  const key={...g,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:i%512n,siteY:(i/512n)%512n,siteZ:0n};
  if(A.resolveSystem(ctx,key).status==='PRESENT')systemKey=key;
}
if(!systemKey) throw new Error('no benchmark system found');
const system=A.resolveSystem(ctx,systemKey);
const planetKey=system.facts.planetCount>0n?{...systemKey,orbitSlot:0n}:null;
const results=[];
results.push(measure('cold-single-system',1,()=>A.resolveSystem(ctx,systemKey)));
results.push(measure('repeat-same-system',100,()=>A.resolveSystem(ctx,systemKey)));
results.push(measure('random-galaxy-sites',128,i=>A.resolveGalaxy(ctx,{x:BigInt(i*7919-400000),y:BigInt(i*1543-80000),z:BigInt(i*313-16000)})));
results.push(measure('random-system-sites-same-sector',128,i=>A.resolveSystem(ctx,{...g,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:BigInt((i*73)%512),siteY:BigInt((i*151)%512),siteZ:BigInt((i*29)%512)})));
if(planetKey)results.push(measure('repeat-same-planet',100,()=>A.resolvePlanet(ctx,planetKey)));
const metrics={system:A.resolveWithMetrics('system',ctx,systemKey).metrics,planet:planetKey?A.resolveWithMetrics('planet',ctx,planetKey).metrics:null};
console.log(JSON.stringify({status:'PASS',prototype:true,canonicalFreeze:false,node:process.version,platform:process.platform,arch:process.arch,results,dependencyMetrics:metrics},null,2));
