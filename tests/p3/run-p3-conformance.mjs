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
const inRange=(v,min,max,label)=>{assert.equal(typeof v,'bigint',label+' must be bigint');assert(v>=min&&v<=max,label+' out of range');};
const enumOf=(v,values,label)=>assert(values.includes(v),label+' invalid enum '+v);
assert.equal(A.VERSION,'p3-astronomy-1');assert.equal(A.SCHEMA_VERSION,1);assert.equal(A.BASELINE_EPOCH,'P4_T0');
assert.equal(A.MANIFEST.generatorSuite,'p3-universe-skeleton');

const region=A.resolveRegion(ctx,{x:0n,y:0n,z:0n});
assert.equal(region.status,'PRESENT');assert.equal(region.schemaVersion,1);assert.equal(region.baselineEpoch,'P4_T0');
inRange(region.facts.densityQ16,0n,65535n,'Region densityQ16');inRange(region.facts.anchorDensityQ16,0n,65535n,'Region anchorDensityQ16');
enumOf(region.facts.environmentClass,['VOID','FIELD','FILAMENT','NODE'],'Region environmentClass');
assert.equal(digest(region),digest(A.resolveRegion(ctx,{x:0n,y:0n,z:0n})));
assert.notEqual(hex(region.id),hex(A.resolveRegion(ctx2,{x:0n,y:0n,z:0n}).id));

const galaxies=[];
for(let i=0;i<20000&&galaxies.length<16;i++){
  const key={x:BigInt((i%100)-50),y:BigInt((Math.floor(i/100)%100)-50),z:BigInt(Math.floor(i/10000)-1)};
  const g=A.resolveGalaxy(ctx,key);if(g.status==='PRESENT')galaxies.push({key,g});
}
assert(galaxies.length>=8);
for(const {g} of galaxies){
  enumOf(g.facts.morphology,['DISK','SPHEROID','IRREGULAR'],'Galaxy morphology');
  inRange(g.facts.massLog10MilliDex,7000n,12000n,'Galaxy mass');inRange(g.facts.populationAgeMyr,300n,13800n,'Galaxy age');
  inRange(g.facts.metallicityMilliDex,-2200n,500n,'Galaxy metallicity');inRange(g.facts.starFormationActivityQ16,0n,65535n,'Galaxy SFR proxy');
}
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
assert.equal(s0.facts.computationalPartition,true);inRange(s0.facts.localStellarDensityQ16,0n,65535n,'Sector density');inRange(s0.facts.systemOccupancyQ32,500000n,130000000n,'Sector occupancy');
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

let system=null,systemKey=null,planet=null,planetKey=null,moon=null,moonKey=null;
for(let i=0n;i<80000n;i++){
  const k={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:i%512n,siteY:(i/512n)%512n,siteZ:(i/(512n*512n))%512n};
  const q=A.resolveSystem(ctx,k);if(q.status!=='PRESENT')continue;
  if(!system){system=q;systemKey=k;}
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
assert(system,'representative present system required');assert(planet,'canonical conformance requires a present planet');assert(moon,'canonical conformance requires a present moon');
inRange(system.facts.stellarComponentCount,1n,4n,'System component count');inRange(system.facts.baselineAgeMyr,10n,13800n,'System age');
inRange(system.facts.baselineMetallicityMilliDex,-2500n,700n,'System metallicity');inRange(system.facts.baselinePrimaryMassMilliSolar,80n,120000n,'System primary mass');
inRange(system.facts.planetCount,0n,10n,'System planet count');enumOf(system.facts.planetArchitecture,['PRIMARY_HOSTED','CIRCUMBINARY'],'System architecture');
assert.equal(system.facts.normalizedAbsoluteSite.x,A.diagnostics.absoluteSystemSite(systemKey.sectorX,systemKey.siteX));
const sm=A.resolveWithMetrics('system',ctx,systemKey);assert(sm.metrics.maxDepth<=2);assert(sm.metrics.deriveCalls<=60);
const star=A.resolveStar(ctx,{...systemKey,componentIndex:0n});assert.equal(star.status,'PRESENT');
inRange(star.facts.baselineMassMilliSolar,80n,120000n,'Star mass');inRange(star.facts.baselineAgeMyr,10n,13800n,'Star age');inRange(star.facts.baselineMetallicityMilliDex,-2500n,700n,'Star metallicity');
enumOf(star.facts.baselineEvolutionaryClass,['MAIN_SEQUENCE','EVOLVED','REMNANT'],'Star evolutionary class');
assert('baselineLuminosityMilliSolar' in star.facts);assert(!('luminosityMilliSolar' in star.facts));

assert.equal(planet.status,'PRESENT');inRange(planet.facts.baselineEccentricityPpm,0n,240000n,'Planet eccentricity');inRange(planet.facts.baselineInclinationMilliDeg,0n,5000n,'Planet inclination');
inRange(planet.facts.baselineMassMilliEarth,300n,4000000n,'Planet mass');inRange(planet.facts.baselineInsolationPpm,0n,1000000000000n,'Planet insolation');inRange(planet.facts.moonCount,0n,8n,'Planet moon count');
enumOf(planet.facts.bulkPriorClass,['TERRESTRIAL','VOLATILE_RICH','ICE_GIANT','GAS_GIANT'],'Planet bulk prior');enumOf(planet.facts.orbitCenter,['PRIMARY_STAR','SYSTEM_BARYCENTER'],'Planet orbit center');
assert(!('radiusMilliEarth' in planet.facts));assert(!('compositionClass' in planet.facts));assert(!('equilibriumTempK' in planet.facts));
const snap=A.planetaryInputSnapshot(ctx,planetKey);assert.equal(snap.contractId,'ofu-p3-p5-planetary-input-v1');assert.equal(hex(snap.planetId),hex(planet.id));assert(!('radiusMilliEarth' in snap.formation));
const pm=A.resolveWithMetrics('planet',ctx,planetKey);assert(pm.metrics.maxDepth<=3);assert(pm.metrics.deriveCalls<=70);

assert.equal(moon.status,'PRESENT');inRange(moon.facts.baselineOrbitalRadiusPlanetRadiiMilli,2500n,80000n,'Moon orbital radius');inRange(moon.facts.baselineMassMilliEarth,1n,200000n,'Moon mass');inRange(moon.facts.baselineInclinationMilliDeg,0n,30000n,'Moon inclination');
assert(!('radiusMilliEarth' in moon.facts),'P3 v1 must not freeze canonical physical moon radius');
assert.equal(hex(moon.relations.parentBody),hex(A.resolvePlanet(ctx,moonKey).id));
const mm=A.resolveWithMetrics('moon',ctx,moonKey);assert(mm.metrics.maxDepth<=4);assert(mm.metrics.deriveCalls<=90);

const absentPlanet=A.resolvePlanet(ctx,{...systemKey,orbitSlot:system.facts.planetCount});assert.equal(absentPlanet.status,'ABSENT');
const absentMoon=A.resolveMoon(ctx,{...planetKey,satelliteSlot:planet.facts.moonCount});assert.equal(absentMoon.status,'ABSENT');

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

const workerPath=fileURLToPath(new URL('./p3-canonical-worker.mjs',import.meta.url));
for(const [kind,key,entity] of [['planet',planetKey,planet],['moon',moonKey,moon]]){
  const workerData={files:FILES,seed:Array.from(ctx.masterSeed),semanticManifestHash:Array.from(ctx.semanticManifestHash),kind,key:Object.fromEntries(Object.entries(key).map(([k,v])=>[k,String(v)]))};
  const wr=await new Promise((resolve,reject)=>{const w=new Worker(workerPath,{workerData});w.once('message',resolve);w.once('error',reject);});
  assert.equal(wr.digest,digest(entity),kind+' Direct/Worker digest mismatch');
}

const corpus=[region,...galaxies.slice(0,4).map(x=>A.resolveGalaxy(ctx,x.key)),system,star,planet,moon].map(x=>A.canonicalEnvelope(x));
const corpusDigest=hex(OFU.sha256.digest(enc(corpus)));
const vector=JSON.parse(fs.readFileSync('tests/vectors/golden-p3-corpus-v1.json','utf8'));
if(vector.expectedDigest)assert.equal(corpusDigest,vector.expectedDigest,'Golden P3 corpus digest drift');
console.log(JSON.stringify({phase:'P3',status:'PASS',schemaVersion:1,modelVersion:A.VERSION,manifestHash:hex(ctx.semanticManifestHash),corpusDigest,records:corpus.length,systemMetrics:sm.metrics,planetMetrics:pm.metrics,moonMetrics:mm.metrics,statistics:{N,lowMassFraction:low/N,massiveFraction:high/N,lowMultiplicity:lm/N,solarMultiplicity:smul/N,highMultiplicity:hm/N,lowSpheroid:ls/N,highSpheroid:hs/N,adjacentDensityMeanDelta:adjacent/256,distantDensityMeanDelta:distant/256}},null,2));
