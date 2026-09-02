import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';

for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js']){
  globalThis.OFU=globalThis.OFU||{};
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
const P=OFU.p2,A=OFU.p3AstronomyPrototype;
const PROTOTYPE_MANIFEST={
  semanticManifestVersion:1n,
  canonicalProtocolVersion:'ofu-cbv-1',
  canonicalAddressVersion:1n,
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1',
  numericContractVersion:1n,
  generatorSuite:'p3-universe-skeleton-prototype',
  generatorSuiteVersion:1n,
  subsystems:{astronomy:1n},
  domains:{astronomy:1n},
  dependencies:{kernel:'p2'},
  lawProfile:'baseline-p3-prototype',
  genesis:{prototype:true}
};
function context(seedOffset=0){
  const masterSeed=Uint8Array.from({length:32},(_,i)=>(i+seedOffset)&255);
  return {masterSeed,semanticManifestHash:P.semanticManifestHash(PROTOTYPE_MANIFEST)};
}
const ctx=context(),ctx2=context(1);
const hex=P.hex;
const canon=x=>hex(P.encode(x));
const factDigest=x=>hex(A.digestFact(A.canonicalEnvelope(x)));

assert.equal(A.VERSION,'p3-astronomy-prototype-0');
assert.equal(A.SCHEMA_VERSION,0);
assert.equal(A.diagnostics.nonCanonical,true);
assert.equal(hex(OFU.sha256.digest(new TextEncoder().encode('abc'))),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

assert.deepEqual(A.containingRegionCoords(31n,0n,0n),{x:0n,y:0n,z:0n});
assert.deepEqual(A.containingRegionCoords(32n,0n,0n),{x:1n,y:0n,z:0n});
assert.deepEqual(A.containingRegionCoords(-1n,0n,0n),{x:-1n,y:0n,z:0n});
assert.deepEqual(A.containingRegionCoords(-32n,0n,0n),{x:-1n,y:0n,z:0n});
assert.deepEqual(A.containingRegionCoords(-33n,0n,0n),{x:-2n,y:0n,z:0n});

const region=A.resolveRegion(ctx,{x:0n,y:0n,z:0n});
const regionAgain=A.resolveRegion(ctx,{x:0n,y:0n,z:0n});
const regionOtherUniverse=A.resolveRegion(ctx2,{x:0n,y:0n,z:0n});
assert.equal(region.status,'PRESENT');
assert.equal(canon(region),canon(regionAgain),'same address must produce identical RegionFacts');
assert.notEqual(hex(region.id),hex(regionOtherUniverse.id),'entity identity must be universe scoped by the P3 stable key');
assert(region.facts.densityQ16>=0n&&region.facts.densityQ16<=65535n);

const presentGalaxies=[];
for(let i=0;i<12000&&presentGalaxies.length<12;i++){
  const x=BigInt((i%80)-40),y=BigInt((Math.floor(i/80)%75)-37),z=BigInt(Math.floor(i/(80*75))-1);
  const galaxy=A.resolveGalaxy(ctx,{x,y,z});
  if(galaxy.status==='PRESENT')presentGalaxies.push({key:{x,y,z},galaxy});
}
assert(presentGalaxies.length>=8,'fixed sample should contain representative sparse galaxies');
const {key:galaxyKey,galaxy}=presentGalaxies[0];
assert.equal(canon(galaxy),canon(A.resolveGalaxy(ctx,galaxyKey)));
const owning=A.containingRegionCoords(galaxyKey.x,galaxyKey.y,galaxyKey.z);
assert.equal(hex(galaxy.relations.containedInRegion),hex(A.resolveRegion(ctx,owning).id));
assert(['DISK','SPHEROID','IRREGULAR'].includes(galaxy.facts.morphology));
assert(galaxy.facts.massLog10MilliDex>=7000n&&galaxy.facts.massLog10MilliDex<=12000n);
assert(galaxy.facts.characteristicRadiusPc>0n);
assert(galaxy.facts.populationAgeMyr>=300n&&galaxy.facts.populationAgeMyr<=13800n);

const orderA=presentGalaxies.map(x=>factDigest(A.resolveGalaxy(ctx,x.key)));
const orderB=[...presentGalaxies].reverse().map(x=>factDigest(A.resolveGalaxy(ctx,x.key))).reverse();
assert.deepEqual(orderA,orderB,'galaxy facts must be query-order independent');

const gcoords={galaxyX:galaxyKey.x,galaxyY:galaxyKey.y,galaxyZ:galaxyKey.z};
const sector=A.resolveSector(ctx,{...gcoords,x:0n,y:0n,z:0n});
assert.equal(sector.status,'PRESENT','galaxy center sector must be present');
assert.equal(sector.facts.computationalPartition,true);
assert.equal(hex(sector.relations.memberOfGalaxy),hex(galaxy.id));
assert(sector.facts.systemOccupancyQ32>=0n&&sector.facts.systemOccupancyQ32<=4294967296n);

let system=null,systemKey=null;
for(let i=0n;i<10000n;i++){
  const siteX=i%512n,siteY=(i/512n)%512n,siteZ=(i/(512n*512n))%512n;
  const candidate={...gcoords,sectorX:0n,sectorY:0n,sectorZ:0n,siteX,siteY,siteZ};
  const value=A.resolveSystem(ctx,candidate);
  if(value.status==='PRESENT'){system=value;systemKey=candidate;break;}
}
assert(system,'fixed sample should contain a present system in the central sector');
assert(system.facts.stellarComponentCount>=1n&&system.facts.stellarComponentCount<=4n);
assert(system.facts.planetCount>=0n&&system.facts.planetCount<=10n);
assert.deepEqual(system.facts.localSite,{x:systemKey.siteX,y:systemKey.siteY,z:systemKey.siteZ});
assert.equal(hex(system.relations.locatedInSector),hex(sector.id));

assert.equal(A.diagnostics.absoluteSystemSite(-1n,511n),-1n);
assert.equal(A.diagnostics.absoluteSystemSite(0n,0n),0n);
assert.equal(A.diagnostics.absoluteSystemSite(1n,0n),512n);

const star=A.resolveStar(ctx,{...systemKey,componentIndex:0n});
assert.equal(star.status,'PRESENT');
assert(star.facts.massMilliSolar>0n&&star.facts.radiusMilliSolar>0n&&star.facts.temperatureK>0n);
assert.equal(hex(star.relations.belongsToSystem),hex(system.id));
assert(['MAIN_SEQUENCE','EVOLVED','REMNANT'].includes(star.facts.evolutionaryClass));
assert.equal(A.resolveStar(ctx,{...systemKey,componentIndex:system.facts.stellarComponentCount}).status,'ABSENT');

let planet=null,planetKey=null;
if(system.facts.planetCount>0n){
  planetKey={...systemKey,orbitSlot:0n};
  planet=A.resolvePlanet(ctx,planetKey);
  assert.equal(planet.status,'PRESENT');
  assert(planet.facts.massMilliEarth>0n&&planet.facts.radiusMilliEarth>0n&&planet.facts.semiMajorAxisMicroAu>0n);
  assert(planet.facts.eccentricityPpm>=0n&&planet.facts.eccentricityPpm<=240000n);
  assert(planet.facts.moonCount>=0n&&planet.facts.moonCount<=8n);
  assert.equal(hex(planet.relations.belongsToSystem),hex(system.id));
  assert.equal(A.resolvePlanet(ctx,{...systemKey,orbitSlot:system.facts.planetCount}).status,'ABSENT');
  if(planet.facts.moonCount>0n){
    const moon=A.resolveMoon(ctx,{...systemKey,orbitSlot:0n,satelliteSlot:0n});
    assert.equal(moon.status,'PRESENT');
    assert(moon.facts.massMilliEarth>0n&&moon.facts.radiusMilliEarth>0n);
    assert.equal(hex(moon.relations.parentBody),hex(planet.id));
  }
}

const systemMetrics=A.resolveWithMetrics('system',ctx,systemKey);
assert.equal(factDigest(systemMetrics.result),factDigest(system));
assert(systemMetrics.metrics.maxDepth<=2,'direct SystemFacts resolution must have bounded dependency depth');
assert(systemMetrics.metrics.deriveCalls<=60,'direct SystemFacts resolution must use a bounded fixed-size derivation budget');
if(planet){
  const planetMetrics=A.resolveWithMetrics('planet',ctx,planetKey);
  assert.equal(factDigest(planetMetrics.result),factDigest(planet));
  assert(planetMetrics.metrics.maxDepth<=3,'direct PlanetFacts resolution must have bounded dependency depth');
  assert(planetMetrics.metrics.deriveCalls<=70,'direct PlanetFacts resolution must not enumerate sibling systems or planets');
  const input=A.planetaryInputContract(ctx,planetKey);
  assert.equal(input.contract,'p3-planetary-input-prototype-0');
  assert.equal(hex(input.planetId),hex(planet.id));
}

const before=factDigest(system);
const presentationContext={camera:{x:999,y:-7},lod:12,workerCount:7,observer:'diagnostic'};
void presentationContext;
assert.equal(before,factDigest(A.resolveSystem(ctx,systemKey)));

let state=0x5eed1234>>>0;
const next=()=>state=(Math.imul(state,1664525)+1013904223)>>>0;
let below500=0,above8000=0,lowMulti=0,solarMulti=0,highMulti=0,lowSph=0,highSph=0;
const N=50000;
for(let i=0;i<N;i++){
  const u=next(),m=A.diagnostics.samplePrimaryMassMilliSolar(u);
  if(m<500n)below500++;
  if(m>=8000n)above8000++;
  const q=next();
  if(A.diagnostics.multiplicityComponentCount(300n,q)>1n)lowMulti++;
  if(A.diagnostics.multiplicityComponentCount(1000n,q)>1n)solarMulti++;
  if(A.diagnostics.multiplicityComponentCount(10000n,q)>1n)highMulti++;
  const mq=next();
  if(A.diagnostics.chooseMorphology(8500n,32768n,mq)==='SPHEROID')lowSph++;
  if(A.diagnostics.chooseMorphology(11300n,32768n,mq)==='SPHEROID')highSph++;
  const gm=A.diagnostics.sampleGalaxyMassMilliDex(next());
  assert(gm>=7000n&&gm<=12000n);
}
assert(below500/N>0.70&&below500/N<0.82,'Kroupa-shaped IMF should remain low-mass dominated');
assert(above8000/N<0.02,'massive stars should remain rare in the prototype IMF');
assert(lowMulti<solarMulti&&solarMulti<highMulti,'multiplicity probability should rise with primary mass');
assert(lowSph<highSph,'spheroid probability should rise strongly with galaxy stellar-mass proxy');

let minDensity=65535n,maxDensity=0n;
for(let i=0;i<512;i++){
  const x=BigInt(i-256),y=BigInt((i*17)%97-48),z=BigInt((i*31)%53-26);
  const d=A.environmentDensityQ16(ctx,x,y,z);
  if(d<minDensity)minDensity=d;if(d>maxDensity)maxDensity=d;
}
assert(minDensity>=0n&&maxDensity<=65535n&&maxDensity-minDensity>5000n);

if(planet){
  const workerPath=fileURLToPath(new URL('./p3-worker-probe.mjs',import.meta.url));
  const workerData={
    files:['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js'],
    seed:Array.from(ctx.masterSeed),semanticManifestHash:Array.from(ctx.semanticManifestHash),kind:'planet',
    key:Object.fromEntries(Object.entries(planetKey).map(([k,v])=>[k,typeof v==='bigint'?String(v):v]))
  };
  const workerResult=await new Promise((resolve,reject)=>{const w=new Worker(workerPath,{workerData});w.once('message',resolve);w.once('error',reject);w.once('exit',code=>{if(code!==0)reject(new Error('worker exit '+code));});});
  assert.equal(workerResult.digest,factDigest(planet));
}

const summary={
  status:'PASS',phase:'P3',prototype:true,canonicalFreeze:false,
  version:A.VERSION,presentGalaxySample:presentGalaxies.length,
  representativeSystemDigest:factDigest(system),
  representativePlanetDigest:planet?factDigest(planet):null,
  systemMetrics:systemMetrics.metrics,
  statisticalDiagnostics:{sampleCount:N,below500Fraction:below500/N,above8000Fraction:above8000/N,lowMultiplicity:lowMulti/N,solarMultiplicity:solarMulti/N,highMultiplicity:highMulti/N,lowMassSpheroid:lowSph/N,highMassSpheroid:highSph/N},
  densityDiagnostic:{min:String(minDensity),max:String(maxDensity)}
};
console.log('P3 Universe Skeleton pre-freeze prototype: PASS');
console.log(JSON.stringify(summary,null,2));
