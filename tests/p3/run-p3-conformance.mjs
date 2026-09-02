import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';

const FILES=['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js'];
for(const file of FILES){globalThis.OFU=globalThis.OFU||{};vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});}
const P=OFU.p2,A=OFU.p3Astronomy;
const masterSeed=Uint8Array.from({length:32},(_,i)=>i);
const ctx={masterSeed,semanticManifestHash:A.semanticManifestHash()};
const ctx2={masterSeed:Uint8Array.from({length:32},(_,i)=>(i+1)&255),semanticManifestHash:A.semanticManifestHash()};
const hex=P.hex, enc=x=>P.encode(x), digest=x=>hex(A.digestFact(x));
assert.equal(A.VERSION,'p3-astronomy-1');assert.equal(A.SCHEMA_VERSION,1);assert.equal(A.BASELINE_EPOCH,'P4_T0');
assert.equal(A.MANIFEST.generatorSuite,'p3-universe-skeleton');

const region=A.resolveRegion(ctx,{x:0n,y:0n,z:0n});
assert.equal(region.status,'PRESENT');assert.equal(region.schemaVersion,1);assert.equal(region.baselineEpoch,'P4_T0');
assert.equal(digest(region),digest(A.resolveRegion(ctx,{x:0n,y:0n,z:0n})));
assert.notEqual(hex(region.id),hex(A.resolveRegion(ctx2,{x:0n,y:0n,z:0n}).id));

const galaxies=[];
for(let i=0;i<20000&&galaxies.length<16;i++){
  const key={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
  const g=A.resolveGalaxy(ctx,key);if(g.status==='PRESENT')galaxies.push({key,g});
}
assert(galaxies.length>=8);
const ordered=galaxies.map(x=>digest(A.resolveGalaxy(ctx,x.key)));
const reversed=[...galaxies].reverse().map(x=>digest(A.resolveGalaxy(ctx,x.key))).reverse();
assert.deepEqual(ordered,reversed,'query order must not affect canonical facts');

let chosen=null;
for(const item of galaxies){
  const base={galaxyX:item.key.x,galaxyY:item.key.y,galaxyZ:item.key.z};
  const s0=A.resolveSector(ctx,{...base,x:0n,y:0n,z:0n});
  const sm=A.resolveSector(ctx,{...base,x:-1n,y:0n,z:0n});
  const sp=A.resolveSector(ctx,{...base,x:1n,y:0n,z:0n});
  if(s0.status==='PRESENT'&&sm.status==='PRESENT'&&sp.status==='PRESENT'){chosen={item,base,s0};break;}
}
assert(chosen,'need a galaxy with three adjacent present sectors');
const {item,base,s0}=chosen;
const boundaryKeys=[
  {...base,sectorX:-1n,sectorY:0n,sectorZ:0n,siteX:511n,siteY:0n,siteZ:0n},
  {...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:0n,siteY:0n,siteZ:0n},
  {...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:511n,siteY:0n,siteZ:0n},
  {...base,sectorX:1n,sectorY:0n,sectorZ:0n,siteX:0n,siteY:0n,siteZ:0n}
];
const expectedAbs=[-1n,0n,511n,512n];
for(let i=0;i<boundaryKeys.length;i++){
  const q=A.resolveSystem(ctx,boundaryKeys[i]);
  assert.equal(A.diagnostics.absoluteSystemSite(boundaryKeys[i].sectorX,boundaryKeys[i].siteX),expectedAbs[i]);
  const expected=P.address([{kind:'namespace',value:'astronomy.system.v1'},{kind:'bytes',value:item.g.id},{kind:'i64',value:expectedAbs[i]},{kind:'i64',value:0n},{kind:'i64',value:0n}]);
  assert.equal(hex(q.address),hex(expected),'actual resolver address must be normalized across sector boundaries');
}
assert.notEqual(hex(A.resolveSystem(ctx,boundaryKeys[0]).address),hex(A.resolveSystem(ctx,boundaryKeys[1]).address));

let system=null,systemKey=null;
for(let i=0n;i<20000n;i++){
  const k={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:i%512n,siteY:(i/512n)%512n,siteZ:0n};
  const q=A.resolveSystem(ctx,k);if(q.status==='PRESENT'){system=q;systemKey=k;break;}
}
assert(system,'representative present system required');
assert.equal(system.facts.baselineAgeMyr>=10n,true);assert.equal(system.facts.normalizedAbsoluteSite.x,systemKey.siteX);
const sm=A.resolveWithMetrics('system',ctx,systemKey);assert(sm.metrics.maxDepth<=2);assert(sm.metrics.deriveCalls<=60);
const star=A.resolveStar(ctx,{...systemKey,componentIndex:0n});assert.equal(star.status,'PRESENT');
assert('baselineLuminosityMilliSolar' in star.facts);assert(!('luminosityMilliSolar' in star.facts));

let planet=null,planetKey=null;
if(system.facts.planetCount>0n){planetKey={...systemKey,orbitSlot:0n};planet=A.resolvePlanet(ctx,planetKey);assert.equal(planet.status,'PRESENT');
  assert('baselineMassMilliEarth' in planet.facts);assert('bulkPriorClass' in planet.facts);assert(!('radiusMilliEarth' in planet.facts));assert(!('compositionClass' in planet.facts));assert(!('equilibriumTempK' in planet.facts));
  const snap=A.planetaryInputSnapshot(ctx,planetKey);assert.equal(snap.contractId,'ofu-p3-p5-planetary-input-v1');assert.equal(hex(snap.planetId),hex(planet.id));assert(!('radiusMilliEarth' in snap.formation));
  const pm=A.resolveWithMetrics('planet',ctx,planetKey);assert(pm.metrics.maxDepth<=3);assert(pm.metrics.deriveCalls<=70);
}

let state=0x5eed1234>>>0;const next=()=>state=(Math.imul(state,1664525)+1013904223)>>>0;
let low=0,high=0,lm=0,smul=0,hm=0,ls=0,hs=0;const N=50000;
for(let i=0;i<N;i++){
  const m=A.diagnostics.samplePrimaryMassMilliSolar(next());if(m<500n)low++;if(m>=8000n)high++;
  const q=next();if(A.diagnostics.multiplicityComponentCount(300n,q)>1n)lm++;if(A.diagnostics.multiplicityComponentCount(1000n,q)>1n)smul++;if(A.diagnostics.multiplicityComponentCount(10000n,q)>1n)hm++;
  const mq=next();if(A.diagnostics.chooseMorphology(8500n,32768n,mq)==='SPHEROID')ls++;if(A.diagnostics.chooseMorphology(11300n,32768n,mq)==='SPHEROID')hs++;
}
assert(low/N>0.70&&low/N<0.82);assert(high/N<0.02);assert(lm<smul&&smul<hm);assert(ls<hs);

const ds=[];for(let x=-256;x<=256;x++)ds.push(Number(A.environmentDensityQ16(ctx,BigInt(x),17n,-9n)));
let adjacent=0,distant=0;for(let i=0;i<256;i++){adjacent+=Math.abs(ds[i+1]-ds[i]);distant+=Math.abs(ds[i+257]-ds[i]);}
assert(adjacent<distant,'density field must exhibit positive local spatial autocorrelation');
for(const x of [-224,-192,-160,-128,-96,-64,-32,0,32,64,96,128,160,192,224]){
  const a=Number(A.environmentDensityQ16(ctx,BigInt(x-1),17n,-9n));const b=Number(A.environmentDensityQ16(ctx,BigInt(x),17n,-9n));assert(Math.abs(a-b)<5000,'density interpolation boundary jump too large');
}

if(planet){
  const workerPath=fileURLToPath(new URL('./p3-canonical-worker.mjs',import.meta.url));
  const workerData={files:FILES,seed:Array.from(ctx.masterSeed),semanticManifestHash:Array.from(ctx.semanticManifestHash),kind:'planet',key:Object.fromEntries(Object.entries(planetKey).map(([k,v])=>[k,String(v)]))};
  const wr=await new Promise((resolve,reject)=>{const w=new Worker(workerPath,{workerData});w.once('message',resolve);w.once('error',reject);});
  assert.equal(wr.digest,digest(planet));
}

const corpus=[region,...galaxies.slice(0,4).map(x=>A.resolveGalaxy(ctx,x.key)),system,star,...(planet?[planet]:[])].map(x=>A.canonicalEnvelope(x));
const corpusDigest=hex(OFU.sha256.digest(enc(corpus)));
const vector=JSON.parse(fs.readFileSync('tests/vectors/golden-p3-corpus-v1.json','utf8'));
if(vector.expectedDigest)assert.equal(corpusDigest,vector.expectedDigest,'Golden P3 corpus digest drift');
console.log(JSON.stringify({phase:'P3',status:'PASS',schemaVersion:1,modelVersion:A.VERSION,manifestHash:hex(ctx.semanticManifestHash),corpusDigest,records:corpus.length,systemMetrics:sm.metrics,statistics:{N,lowMassFraction:low/N,massiveFraction:high/N,lowMultiplicity:lm/N,solarMultiplicity:smul/N,highMultiplicity:hm/N,lowSpheroid:ls/N,highSpheroid:hs/N,adjacentDensityMeanDelta:adjacent/256,distantDensityMeanDelta:distant/256}},null,2));
