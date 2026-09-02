import fs from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const type={chromium,firefox,webkit}[browserName];
if(!type)throw new Error('P3 browser: unsupported '+browserName);
const browser=await type.launch({headless:true});
const page=await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
const result=await page.evaluate(()=>{
  const A=OFU.p3Astronomy,P=OFU.p2;
  const ctx={masterSeed:Uint8Array.from({length:32},(_,i)=>i),semanticManifestHash:A.semanticManifestHash()};
  const hex=P.hex,digest=x=>hex(A.digestFact(x));
  const region=A.resolveRegion(ctx,{x:0n,y:0n,z:0n});
  const galaxies=[];
  for(let i=0;i<20000&&galaxies.length<16;i++){
    const key={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
    const g=A.resolveGalaxy(ctx,key);if(g.status==='PRESENT')galaxies.push({key,g});
  }
  if(galaxies.length<8)throw new Error('representative galaxy sample not found');
  let chosen=null;
  for(const item of galaxies){
    const base={galaxyX:item.key.x,galaxyY:item.key.y,galaxyZ:item.key.z};
    const s0=A.resolveSector(ctx,{...base,x:0n,y:0n,z:0n});
    const sm=A.resolveSector(ctx,{...base,x:-1n,y:0n,z:0n});
    const sp=A.resolveSector(ctx,{...base,x:1n,y:0n,z:0n});
    if(s0.status==='PRESENT'&&sm.status==='PRESENT'&&sp.status==='PRESENT'){chosen={item,base};break;}
  }
  if(!chosen)throw new Error('adjacent-sector representative not found');
  const {item,base}=chosen;
  let system=null,key=null,planet=null,planetKey=null,moon=null,moonKey=null;
  for(let i=0n;i<80000n;i++){
    const k={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:i%512n,siteY:(i/512n)%512n,siteZ:(i/(512n*512n))%512n};
    const q=A.resolveSystem(ctx,k);if(q.status!=='PRESENT')continue;
    if(!system){system=q;key=k;}
    if(!planet&&q.facts.planetCount>0n){const pk={...k,orbitSlot:0n};const p=A.resolvePlanet(ctx,pk);if(p.status==='PRESENT'){planet=p;planetKey=pk;}}
    if(q.facts.planetCount>0n&&!moon){
      for(let slot=0n;slot<q.facts.planetCount;slot++){
        const pk={...k,orbitSlot:slot};const p=A.resolvePlanet(ctx,pk);if(p.status!=='PRESENT'||p.facts.moonCount===0n)continue;
        for(let sat=0n;sat<p.facts.moonCount;sat++){
          const mk={...pk,satelliteSlot:sat};const m=A.resolveMoon(ctx,mk);if(m.status==='PRESENT'){moon=m;moonKey=mk;if(!planet){planet=p;planetKey=pk;}break;}
        }
        if(moon)break;
      }
    }
    if(system&&planet&&moon)break;
  }
  if(!system||!planet||!moon)throw new Error('canonical system/planet/moon sample not found');
  const star=A.resolveStar(ctx,{...key,componentIndex:0n});
  const corpus=[region,...galaxies.slice(0,4).map(x=>A.resolveGalaxy(ctx,x.key)),system,star,planet,moon].map(x=>A.canonicalEnvelope(x));
  const corpusDigest=hex(OFU.sha256.digest(P.encode(corpus)));
  const serializeKey=k=>Object.fromEntries(Object.entries(k).map(([n,v])=>[n,String(v)]));
  return {region:digest(region),galaxy:digest(item.g),system:digest(system),planet:digest(planet),moon:digest(moon),manifestHash:hex(ctx.semanticManifestHash),corpusDigest,records:corpus.length,key:serializeKey(key),planetKey:serializeKey(planetKey),moonKey:serializeKey(moonKey)};
});
const vector=JSON.parse(fs.readFileSync('tests/vectors/golden-p3-corpus-v1.json','utf8'));
if(vector.expectedDigest&&result.corpusDigest!==vector.expectedDigest)throw new Error('P3 browser Golden corpus digest drift');
if(vector.browserRegionDigest&&result.region!==vector.browserRegionDigest)throw new Error('P3 browser Region digest drift');
if(vector.browserSystemDigest&&result.system!==vector.browserSystemDigest)throw new Error('P3 browser System digest drift');
const evidence={phase:'P3',status:'PASS',sourceSha:process.env.OFU_SOURCE_SHA||null,browser:browserName,platform:process.platform,arch:process.arch,...result};
fs.mkdirSync('dist/evidence',{recursive:true});fs.writeFileSync(`dist/evidence/p3-browser-${process.platform}-${browserName}.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
await browser.close();
