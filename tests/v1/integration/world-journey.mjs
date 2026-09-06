import assert from 'node:assert/strict';
import {load,DEFAULT_KEY} from './runtime-helper.mjs';
const {O,runtime:r}=load();let cases=0;const ok=(v,m)=>{assert.ok(v,m);cases++;};
const roots=r.snapshot().rows,galaxies=new Set(),systems=new Set(),worlds=new Set(),classes=new Set();
ok(roots.length>=3,'multiple actual P3 galaxies are directly available');
for(const galaxy of roots.filter(g=>g.entityId!==r.seedGraph.galaxy.entityId).slice(0,2)){
 r.enterGalaxy(galaxy);galaxies.add(galaxy.canonicalId);let regions=r.snapshot().rows;
 for(let i=0;!regions.length&&i<4;i++){r.nextWindow();regions=r.snapshot().rows;}
 ok(regions.length>0,'non-bootstrap galaxy exposes actual stellar regions');r.enterRegion(regions[0]);r.enterNeighborhood();let rows=r.snapshot().rows;
 for(let i=0;rows.length<3&&i<8;i++){if(r.snapshot().page.nextCursor!==null)r.nextPage();else r.nextWindow();rows=[...rows,...r.snapshot().rows].filter((n,j,a)=>a.findIndex(x=>x.entityId===n.entityId)===j);}
 ok(rows.length>=2,'non-bootstrap region exposes multiple actual P3 systems');
 for(const system of rows.slice(0,3)){
  r.enterSystem(system);systems.add(system.canonicalId);const planets=r.snapshot().rows.filter(n=>n.kind==='planet');
  for(const planet of planets.slice(0,2)){
   r.enterBody(planet);const s=r.snapshot();worlds.add(s.world.planetIdentity);classes.add(s.world.planetology.bulkPriorClass);
   ok(s.world.planetIdentity===planet.canonicalId,'selected P3 planet is the modeled world identity');
   if(!['GAS_GIANT','ICE_GIANT'].includes(s.world.planetology.bulkPriorClass)){
    r.approach();r.at(12345678,-45678901,{stage:'GLOBAL_SURFACE'});for(const stage of ['REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'])r.scale(stage);
    const here=r.snapshot().point;ok(here.latMicroDeg===12345678&&here.lonMicroDeg===-45678901,'arbitrary supported descent preserves location');
    r.selectObject(r.snapshot().local.objects[0].entityId);r.enterMicro();for(let i=0;i<3;i++)r.deeper();for(let i=0;i<4;i++)r.back();
    ok(r.snapshot().point.locationIdentity===here.locationIdentity,'non-bootstrap micro return exact');
   }else{assert.throws(()=>r.at(0,0));cases++;r.inspectAtmosphere();ok(r.snapshot().local.objects.every(o=>o.kind==='ATMOSPHERE'),'gas-world atmosphere is not a fabricated solid surface');}
   r.scale('SYSTEM');ok(r.snapshot().system.canonicalId===system.canonicalId,'outward traversal retains stellar system');
  }
 }
 r.scale('GALAXY');ok(r.snapshot().galaxy.canonicalId===galaxy.canonicalId,'outward traversal retains non-bootstrap galaxy');
}
ok(galaxies.size>=2&&systems.size>=4&&worlds.size>=4,'alternative branches cover multiple galaxies/systems/worlds');
ok(classes.size>=2,'world classes differ');
r.enterKey({...DEFAULT_KEY,siteY:2n,siteZ:3n,orbitSlot:2n});const living=r.snapshot().world;const sites=living.surveySites||[];let water=null;
for(const site of sites){const p=site.point||site,s=O.v1WorldContext.sample(living.planetology,p);if(s.hydrology.surfaceLiquid){water=p;break;}}
if(!water)for(let lat=-60000000;lat<=60000000&&!water;lat+=20000000)for(let lon=-180000000;lon<180000000;lon+=30000000){const p=O.v1WorldContext.location(living.planetIdentity,lat,lon);if(O.v1WorldContext.sample(living.planetology,p).hydrology.surfaceLiquid){water=p;break;}}
ok(water,'actual hydrology exposes liquid-water location');r.at(water.latMicroDeg,water.lonMicroDeg,{stage:'HUMAN'});const waterObject=r.snapshot().local.objects.find(o=>o.kind==='WATER');ok(waterObject,'actual water object');r.selectObject(waterObject.entityId);r.enterMicro();for(let i=0;i<3;i++)r.deeper();
ok(r.snapshot().micro.current.atomCount>0&&r.snapshot().micro.current.atomCount<=96,'source-context model H2O has bounded atomic representation');
ok(r.snapshot().micro.current.exactBulkInventoryClaim!==true,'H2O representation does not enumerate ocean inventory');
for(let i=0;i<80;i++)r.at(water.latMicroDeg+i,water.lonMicroDeg,{stage:'HUMAN'});
ok(r.snapshot().historyDepth<=64&&r.snapshot().traversal.indexedNodes<=256,'bounded navigation histories and node index');
ok(r.snapshot().discoveryCacheEntries<=12,'bounded discovery cache');
console.log(JSON.stringify({status:'PASS',suite:'wave-a-world-journey',cases,galaxies:galaxies.size,systems:systems.size,worlds:worlds.size,worldClasses:[...classes].sort(),waterSource:waterObject.entityId,browserEvidence:false}));
