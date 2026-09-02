import fs from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const type={chromium,firefox,webkit}[browserName];
if(!type)throw new Error('P3 browser: unsupported '+browserName);
const browser=await type.launch({headless:true});
const page=await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
const result=await page.evaluate(async()=>{
  const A=OFU.p3Astronomy,P=OFU.p2;
  const ctx={masterSeed:Uint8Array.from({length:32},(_,i)=>i),semanticManifestHash:A.semanticManifestHash()};
  const hex=P.hex,digest=x=>hex(A.digestFact(x));
  const region=A.resolveRegion(ctx,{x:0n,y:0n,z:0n});
  let galaxy=null,gk=null;
  for(let i=0;i<20000&&!galaxy;i++){
    const k={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
    const q=A.resolveGalaxy(ctx,k);if(q.status==='PRESENT'){galaxy=q;gk=k;}
  }
  if(!galaxy)throw new Error('representative galaxy not found');
  const base={galaxyX:gk.x,galaxyY:gk.y,galaxyZ:gk.z,sectorX:0n,sectorY:0n,sectorZ:0n};
  let system=null,key=null;
  for(let i=0n;i<30000n&&!system;i++){
    const k={...base,siteX:i%512n,siteY:(i/512n)%512n,siteZ:0n};const q=A.resolveSystem(ctx,k);if(q.status==='PRESENT'){system=q;key=k;}
  }
  if(!system)throw new Error('representative system not found');
  const direct={region:digest(region),galaxy:digest(galaxy),system:digest(system),manifestHash:hex(ctx.semanticManifestHash)};
  const source=['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js'].map(()=>null);
  return {...direct,key:Object.fromEntries(Object.entries(key).map(([k,v])=>[k,String(v)]))};
});
const vector=JSON.parse(fs.readFileSync('tests/vectors/golden-p3-corpus-v1.json','utf8'));
if(vector.browserRegionDigest&&result.region!==vector.browserRegionDigest)throw new Error('P3 browser Region digest drift');
if(vector.browserSystemDigest&&result.system!==vector.browserSystemDigest)throw new Error('P3 browser System digest drift');
const evidence={phase:'P3',status:'PASS',browser:browserName,platform:process.platform,arch:process.arch,...result};
fs.mkdirSync('dist/evidence',{recursive:true});fs.writeFileSync(`dist/evidence/p3-browser-${process.platform}-${browserName}.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
await browser.close();
