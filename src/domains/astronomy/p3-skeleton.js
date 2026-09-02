(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2;
if(!P)throw new Error('OFU P3 astronomy prototype requires OFU.p2');

const VERSION='p3-astronomy-prototype-0';
const SCHEMA_VERSION=0;
const Q16=65535n;
const Q32=1n<<32n;
const REGION_SPAN_GALAXY_CELLS=32n;
const GALAXY_CELL_KPC=500n;
const SECTOR_SIZE_PC=256n;
const SYSTEM_SITE_AXIS=512n;
const SYSTEM_SITE_MILLIPARSEC=500n;
const MAX_SECTOR_COORD=1048575n;
const MAX_PLANETS=10n;
const MAX_MOONS=8n;

const DOMAIN=Object.freeze({
  region:'astronomy.region',
  field:'astronomy.region-field',
  galaxy:'astronomy.galaxy',
  sector:'astronomy.sector',
  system:'astronomy.system',
  star:'astronomy.star',
  planet:'astronomy.planet',
  moon:'astronomy.moon'
});

function fail(message){throw new Error('OFU P3 astronomy prototype: '+message)}
function bi(x,name){try{return BigInt(x)}catch{fail('invalid '+name)}}
function checkI64(x,name){x=bi(x,name);if(x<-(1n<<63n)||x>(1n<<63n)-1n)fail(name+' outside i64');return x}
function checkU64(x,name){x=bi(x,name);if(x<0n||x>(1n<<64n)-1n)fail(name+' outside u64');return x}
function clamp(x,lo,hi){return x<lo?lo:x>hi?hi:x}
function abs(x){return x<0n?-x:x}
function floorDiv(a,b){let q=a/b,r=a%b;if(r<0n){q-=1n;r+=b}return q}
function floorMod(a,b){let r=a%b;return r<0n?r+b:r}
function lerp(a,b,t,scale=Q16){return (a*(scale-t)+b*t+(scale>>1n))/scale}
function scaleU32(u,span){if(span<=0n)fail('invalid scale span');return (BigInt(u)*span)>>32n}
function rangeFromU32(u,min,max){min=bi(min,'range min');max=bi(max,'range max');if(max<min)fail('invalid range');return min+scaleU32(u,(max-min)+1n)}
function signedRangeFromU32(u,magnitude){const width=magnitude*2n+1n;return rangeFromU32(u,0n,width-1n)-magnitude}
function bytesEq(a,b){if(!(a instanceof Uint8Array)||!(b instanceof Uint8Array)||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true}
function readU32(b){return ((b[0]*0x1000000)+(b[1]<<16)+(b[2]<<8)+b[3])>>>0}
function noteNode(meter,depth){if(!meter)return;meter.dependencyNodes=(meter.dependencyNodes||0)+1;meter.maxDepth=Math.max(meter.maxDepth||0,depth)}
function noteDerive(meter,n=1){if(meter)meter.deriveCalls=(meter.deriveCalls||0)+n}
function freshMeter(){return {dependencyNodes:0,deriveCalls:0,maxDepth:0}}

function validateContext(ctx){
  if(!ctx||!(ctx.masterSeed instanceof Uint8Array)||ctx.masterSeed.length!==32)fail('masterSeed must be 32 bytes');
  if(!(ctx.semanticManifestHash instanceof Uint8Array)||ctx.semanticManifestHash.length!==32)fail('semanticManifestHash must be 32 bytes');
  return ctx;
}
function universeDigest(ctx){validateContext(ctx);return P.universeIdentity(ctx.masterSeed,ctx.semanticManifestHash).digest}
function deriveBytes(ctx,addressBytes,domain,property,counter=0n,meter){noteDerive(meter);return P.derive({masterSeed:ctx.masterSeed,semanticManifestHash:ctx.semanticManifestHash,domain,addressBytes,property,counter})}
function deriveU32(ctx,addressBytes,domain,property,counter=0n,meter){return readU32(deriveBytes(ctx,addressBytes,domain,property,counter,meter))}
function entityId(ctx,namespace,stableKey){return P.entityIdentity(universeDigest(ctx),namespace,stableKey)}
function digestFact(fact){return O.sha256.digest(P.encode(fact))}

function regionAddress(x,y,z){return P.address([{kind:'namespace',value:'astronomy.region.v1'},{kind:'i64',value:x},{kind:'i64',value:y},{kind:'i64',value:z}])}
function fieldAnchorAddress(scaleIndex,x,y,z){return P.address([{kind:'namespace',value:'astronomy.region-field.v1'},{kind:'u64',value:scaleIndex},{kind:'i64',value:x},{kind:'i64',value:y},{kind:'i64',value:z}])}
function galaxyAddress(x,y,z){return P.address([{kind:'namespace',value:'astronomy.galaxy.v1'},{kind:'i64',value:x},{kind:'i64',value:y},{kind:'i64',value:z}])}
function sectorAddress(galaxyId,x,y,z){return P.address([{kind:'namespace',value:'astronomy.sector.v1'},{kind:'bytes',value:galaxyId},{kind:'i64',value:x},{kind:'i64',value:y},{kind:'i64',value:z}])}
function systemAddress(galaxyId,x,y,z){return P.address([{kind:'namespace',value:'astronomy.system.v1'},{kind:'bytes',value:galaxyId},{kind:'i64',value:x},{kind:'i64',value:y},{kind:'i64',value:z}])}
function starAddress(systemId,index){return P.address([{kind:'namespace',value:'astronomy.star.v1'},{kind:'bytes',value:systemId},{kind:'u64',value:index}])}
function planetAddress(systemId,index){return P.address([{kind:'namespace',value:'astronomy.planet.v1'},{kind:'bytes',value:systemId},{kind:'u64',value:index}])}
function moonAddress(planetId,index){return P.address([{kind:'namespace',value:'astronomy.moon.v1'},{kind:'bytes',value:planetId},{kind:'u64',value:index}])}

function regionKey(x,y,z){return {x,y,z}}
function galaxyKey(x,y,z){return {siteCellX:x,siteCellY:y,siteCellZ:z}}
function sectorKey(galaxyId,x,y,z){return {galaxyId,x,y,z}}
function systemKey(galaxyId,localSiteX,localSiteY,localSiteZ){return {galaxyId,localSiteX,localSiteY,localSiteZ}}
function starKey(systemId,index){return {systemId,componentIndex:index}}
function planetKey(systemId,index){return {systemId,orbitSlot:index}}
function moonKey(planetId,index){return {planetId,satelliteSlot:index}}
function absoluteSystemSite(sectorCoord,siteCoord){return sectorCoord*SYSTEM_SITE_AXIS+siteCoord}

function fieldAnchorQ16(ctx,scaleIndex,x,y,z,meter){
  const a=fieldAnchorAddress(scaleIndex,x,y,z);
  return BigInt(deriveU32(ctx,a,DOMAIN.field,'density-anchor',0n,meter)&0xffff);
}
function fieldOctaveQ16(ctx,gx,gy,gz,scaleIndex,span,meter){
  const bx=floorDiv(gx,span),by=floorDiv(gy,span),bz=floorDiv(gz,span);
  const fx=(floorMod(gx,span)*Q16)/span,fy=(floorMod(gy,span)*Q16)/span,fz=(floorMod(gz,span)*Q16)/span;
  const v=[];
  for(let dz=0n;dz<=1n;dz++)for(let dy=0n;dy<=1n;dy++)for(let dx=0n;dx<=1n;dx++)v.push(fieldAnchorQ16(ctx,scaleIndex,bx+dx,by+dy,bz+dz,meter));
  const x00=lerp(v[0],v[1],fx),x10=lerp(v[2],v[3],fx),x01=lerp(v[4],v[5],fx),x11=lerp(v[6],v[7],fx);
  const y0=lerp(x00,x10,fy),y1=lerp(x01,x11,fy);
  return lerp(y0,y1,fz);
}
function environmentDensityQ16(ctx,gx,gy,gz,meter){
  const o0=fieldOctaveQ16(ctx,gx,gy,gz,0n,32n,meter);
  const o1=fieldOctaveQ16(ctx,gx,gy,gz,1n,128n,meter);
  const o2=fieldOctaveQ16(ctx,gx,gy,gz,2n,512n,meter);
  return (o0*4n+o1*2n+o2+3n)/7n;
}
function environmentClass(q){return q<17000n?'VOID':q<34000n?'FIELD':q<50000n?'FILAMENT':'NODE'}
function containingRegionCoords(gx,gy,gz){return {x:floorDiv(gx,REGION_SPAN_GALAXY_CELLS),y:floorDiv(gy,REGION_SPAN_GALAXY_CELLS),z:floorDiv(gz,REGION_SPAN_GALAXY_CELLS)}}

function resolveRegion(ctx,key,meter=freshMeter(),depth=0){
  validateContext(ctx);noteNode(meter,depth);
  const x=checkI64(key.x,'region x'),y=checkI64(key.y,'region y'),z=checkI64(key.z,'region z');
  const address=regionAddress(x,y,z),id=entityId(ctx,'astronomy.region',regionKey(x,y,z));
  const centerX=x*REGION_SPAN_GALAXY_CELLS+REGION_SPAN_GALAXY_CELLS/2n;
  const centerY=y*REGION_SPAN_GALAXY_CELLS+REGION_SPAN_GALAXY_CELLS/2n;
  const centerZ=z*REGION_SPAN_GALAXY_CELLS+REGION_SPAN_GALAXY_CELLS/2n;
  const densityQ16=environmentDensityQ16(ctx,centerX,centerY,centerZ,meter);
  const anchorQ16=fieldAnchorQ16(ctx,0n,x,y,z,meter);
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'REGION',id,address,key:regionKey(x,y,z),facts:{galaxyCellSpan:REGION_SPAN_GALAXY_CELLS,galaxyCellSizeKpc:GALAXY_CELL_KPC,densityQ16,anchorDensityQ16:anchorQ16,environmentClass:environmentClass(densityQ16)},relations:{}};
}

function sampleGalaxyMassMilliDex(u){
  const x=BigInt(u),total=1n<<32n;
  const cuts=[(total*52n)/100n,(total*88n)/100n,(total*985n)/1000n,total];
  const bins=[[7000n,9200n],[9200n,10300n],[10300n,11150n],[11150n,12000n]];
  let lo=0n;
  for(let i=0;i<cuts.length;i++){
    const hi=cuts[i];
    if(x<hi){
      const local=((x-lo)<<32n)/(hi-lo);
      return bins[i][0]+((local*(bins[i][1]-bins[i][0]+1n))>>32n);
    }
    lo=hi;
  }
  return 12000n;
}
function galaxyRadiusPc(massMilliDex,morphology){
  const knots=[[7000n,250n],[8000n,700n],[9000n,1800n],[10000n,4500n],[10800n,9000n],[11500n,20000n],[12000n,45000n]];
  let r=knots[0][1];
  for(let i=1;i<knots.length;i++){
    if(massMilliDex<=knots[i][0]){const [x0,y0]=knots[i-1],[x1,y1]=knots[i];r=y0+((massMilliDex-x0)*(y1-y0))/(x1-x0);break}
    r=knots[i][1];
  }
  if(morphology==='SPHEROID')r=(r*13n)/10n;
  if(morphology==='IRREGULAR')r=(r*8n)/10n;
  return clamp(r,200n,80000n);
}
function chooseMorphology(massMilliDex,densityQ16,u){
  const q=BigInt(u);
  let sph=massMilliDex<9000n?2500n:massMilliDex<10300n?8000n:massMilliDex<11000n?22000n:43000n;
  sph=clamp(sph+(densityQ16-32768n)/5n,1000n,60000n);
  const irr=massMilliDex<9000n?13000n:massMilliDex<10000n?5000n:1200n;
  const uq=(q*65536n)>>32n;
  return uq<sph?'SPHEROID':uq<sph+irr?'IRREGULAR':'DISK';
}
function resolveGalaxy(ctx,key,meter=freshMeter(),depth=0){
  validateContext(ctx);noteNode(meter,depth);
  const x=checkI64(key.x??key.siteCellX,'galaxy x'),y=checkI64(key.y??key.siteCellY,'galaxy y'),z=checkI64(key.z??key.siteCellZ,'galaxy z');
  const address=galaxyAddress(x,y,z),densityQ16=environmentDensityQ16(ctx,x,y,z,meter);
  const occupancyQ32=clamp(800000n+densityQ16*300n,300000n,26000000n);
  const draw=BigInt(deriveU32(ctx,address,DOMAIN.galaxy,'occupied',0n,meter));
  const regionCoords=containingRegionCoords(x,y,z);
  const regionId=entityId(ctx,'astronomy.region',regionKey(regionCoords.x,regionCoords.y,regionCoords.z));
  if(draw>=occupancyQ32)return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'GALAXY',key:galaxyKey(x,y,z),address,reason:'UNOCCUPIED_GALAXY_SITE',relations:{containedInRegion:regionId}};
  const id=entityId(ctx,'astronomy.galaxy',galaxyKey(x,y,z));
  const massMilliDex=sampleGalaxyMassMilliDex(deriveU32(ctx,address,DOMAIN.galaxy,'stellar-mass-log10',0n,meter));
  const morphology=chooseMorphology(massMilliDex,densityQ16,deriveU32(ctx,address,DOMAIN.galaxy,'morphology',0n,meter));
  const radiusPc=galaxyRadiusPc(massMilliDex,morphology);
  const ageBase=morphology==='SPHEROID'?8500n:morphology==='DISK'?5500n:2500n;
  const ageJitter=rangeFromU32(deriveU32(ctx,address,DOMAIN.galaxy,'population-age',0n,meter),0n,4500n);
  const populationAgeMyr=clamp(ageBase+ageJitter+(densityQ16-32768n)/20n,300n,13800n);
  const metallicityMilliDex=clamp(-1250n+((massMilliDex-7000n)*360n)/1000n-(populationAgeMyr-5000n)/30n,-2200n,500n);
  const offsetPcX=signedRangeFromU32(deriveU32(ctx,address,DOMAIN.galaxy,'position-offset-x',0n,meter),220000n);
  const offsetPcY=signedRangeFromU32(deriveU32(ctx,address,DOMAIN.galaxy,'position-offset-y',0n,meter),220000n);
  const offsetPcZ=signedRangeFromU32(deriveU32(ctx,address,DOMAIN.galaxy,'position-offset-z',0n,meter),220000n);
  const inclinationMilliDeg=rangeFromU32(deriveU32(ctx,address,DOMAIN.galaxy,'orientation-inclination',0n,meter),0n,180000n);
  const positionAngleMilliDeg=rangeFromU32(deriveU32(ctx,address,DOMAIN.galaxy,'orientation-position-angle',0n,meter),0n,359999n);
  const starFormationActivityQ16=morphology==='SPHEROID'?clamp(9000n-(populationAgeMyr/3n),300n,9000n):morphology==='IRREGULAR'?clamp(50000n-populationAgeMyr,25000n,60000n):clamp(42000n-populationAgeMyr*2n,9000n,50000n);
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'GALAXY',id,address,key:galaxyKey(x,y,z),facts:{morphology,massLog10MilliDex:massMilliDex,characteristicRadiusPc:radiusPc,populationAgeMyr,metallicityMilliDex,starFormationActivityQ16,environmentDensityQ16:densityQ16,cellOffsetPc:{x:offsetPcX,y:offsetPcY,z:offsetPcZ},orientation:{inclinationMilliDeg,positionAngleMilliDeg}},relations:{containedInRegion:regionId}};
}

function sectorFromGalaxy(ctx,galaxy,gx,gy,gz,x,y,z,meter,depth){
  noteNode(meter,depth);
  if(galaxy.status!=='PRESENT')return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'SECTOR',key:{galaxyX:gx,galaxyY:gy,galaxyZ:gz,x,y,z},reason:'PARENT_GALAXY_ABSENT',relations:{}};
  const address=sectorAddress(galaxy.id,x,y,z),id=entityId(ctx,'astronomy.sector',sectorKey(galaxy.id,x,y,z));
  const px=x*SECTOR_SIZE_PC,py=y*SECTOR_SIZE_PC,pz=z*SECTOR_SIZE_PC;
  const distancePc=P.isqrt(px*px+py*py+pz*pz);
  const radius=galaxy.facts.characteristicRadiusPc;
  const diskThickness=clamp(radius/8n,512n,8000n);
  let inside=distancePc<=radius;
  if(galaxy.facts.morphology==='DISK'&&abs(pz)>diskThickness)inside=false;
  if(!inside)return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'SECTOR',id,address,key:{galaxyX:gx,galaxyY:gy,galaxyZ:gz,x,y,z},reason:'OUTSIDE_GALAXY_ENVELOPE',relations:{memberOfGalaxy:galaxy.id}};
  const radialQ16=radius===0n?0n:clamp(Q16-(distancePc*Q16)/radius,0n,Q16);
  const verticalQ16=galaxy.facts.morphology==='DISK'?clamp(Q16-(abs(pz)*Q16)/diskThickness,0n,Q16):Q16;
  let localDensityQ16=(radialQ16*verticalQ16)/Q16;
  if(galaxy.facts.morphology==='SPHEROID')localDensityQ16=clamp((localDensityQ16*5n)/4n,0n,Q16);
  if(galaxy.facts.morphology==='IRREGULAR')localDensityQ16=clamp((localDensityQ16*4n)/5n,0n,Q16);
  const systemOccupancyQ32=clamp(2500000n+localDensityQ16*1700n,500000n,130000000n);
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'SECTOR',id,address,key:{galaxyX:gx,galaxyY:gy,galaxyZ:gz,x,y,z},facts:{sectorSizePc:SECTOR_SIZE_PC,systemSiteAxis:SYSTEM_SITE_AXIS,systemSiteResolutionMilliParsec:SYSTEM_SITE_MILLIPARSEC,distanceFromGalaxyCenterPc:distancePc,localStellarDensityQ16:localDensityQ16,systemOccupancyQ32,computationalPartition:true},relations:{memberOfGalaxy:galaxy.id}};
}
function resolveSector(ctx,key,meter=freshMeter(),depth=0){
  validateContext(ctx);noteNode(meter,depth);
  const gx=checkI64(key.galaxyX,'sector galaxyX'),gy=checkI64(key.galaxyY,'sector galaxyY'),gz=checkI64(key.galaxyZ,'sector galaxyZ');
  const x=checkI64(key.x,'sector x'),y=checkI64(key.y,'sector y'),z=checkI64(key.z,'sector z');
  if(abs(x)>MAX_SECTOR_COORD||abs(y)>MAX_SECTOR_COORD||abs(z)>MAX_SECTOR_COORD)fail('sector coordinate bound');
  const galaxy=resolveGalaxy(ctx,{x:gx,y:gy,z:gz},meter,depth+1);
  return sectorFromGalaxy(ctx,galaxy,gx,gy,gz,x,y,z,meter,depth+1);
}

const IMF_BINS=Object.freeze([
  [1856717038n,80n,200n],
  [3267178615n,200n,500n],
  [3878184051n,500n,1000n],
  [4126603159n,1000n,2000n],
  [4268337072n,2000n,8000n],
  [4287664425n,8000n,20000n],
  [4294106875n,20000n,60000n],
  [4294967296n,60000n,120000n]
]);
function samplePrimaryMassMilliSolar(u){const x=BigInt(u);let lo=0n;for(const [cut,min,max] of IMF_BINS){if(x<cut){const local=cut===lo?0n:((x-lo)<<32n)/(cut-lo);return min+((local*(max-min+1n))>>32n)}lo=cut}return 120000n}
function multiplicityComponentCount(primaryMass,u){
  const q=BigInt(u),fraction=primaryMass<500n?1073741824n:primaryMass<1200n?1932735283n:primaryMass<3000n?2791728742n:primaryMass<8000n?3435973837n:4080218931n;
  if(q>=fraction)return 1n;
  if(primaryMass<1200n)return 2n;
  if(primaryMass<8000n)return q<(fraction*4n)/5n?2n:3n;
  return q<(fraction*11n)/20n?2n:q<(fraction*17n)/20n?3n:4n;
}
function planetCount(primaryMass,metallicity,components,u){
  let max=primaryMass<650n?8n:primaryMass<1600n?8n:primaryMass<4000n?6n:4n;
  if(components>1n)max-=1n;
  if(metallicity>100n&&primaryMass>=650n&&primaryMass<2000n)max+=1n;
  max=clamp(max,2n,MAX_PLANETS);
  const thresholds=[400000000n,900000000n,1500000000n,2200000000n,2900000000n,3450000000n,3850000000n,4130000000n,4294967296n];
  let c=0n;const q=BigInt(u);for(let i=0;i<thresholds.length&&c<max;i++){if(q<thresholds[i])return c;c++}return max;
}
function resolveSystem(ctx,key,meter=freshMeter(),depth=0){
  validateContext(ctx);noteNode(meter,depth);
  const gx=checkI64(key.galaxyX,'system galaxyX'),gy=checkI64(key.galaxyY,'system galaxyY'),gz=checkI64(key.galaxyZ,'system galaxyZ');
  const sx=checkI64(key.sectorX,'system sectorX'),sy=checkI64(key.sectorY,'system sectorY'),sz=checkI64(key.sectorZ,'system sectorZ');
  const x=checkU64(key.siteX,'system siteX'),y=checkU64(key.siteY,'system siteY'),z=checkU64(key.siteZ,'system siteZ');
  if(x>=SYSTEM_SITE_AXIS||y>=SYSTEM_SITE_AXIS||z>=SYSTEM_SITE_AXIS)fail('system site coordinate bound');
  const galaxy=resolveGalaxy(ctx,{x:gx,y:gy,z:gz},meter,depth+1);
  const sector=sectorFromGalaxy(ctx,galaxy,gx,gy,gz,sx,sy,sz,meter,depth+1);
  if(sector.status!=='PRESENT')return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'SYSTEM',key:{galaxyX:gx,galaxyY:gy,galaxyZ:gz,sectorX:sx,sectorY:sy,sectorZ:sz,siteX:x,siteY:y,siteZ:z},reason:'PARENT_SECTOR_ABSENT',relations:{}};
  const galaxyId=sector.relations.memberOfGalaxy;
  const localSiteX=absoluteSystemSite(sx,x),localSiteY=absoluteSystemSite(sy,y),localSiteZ=absoluteSystemSite(sz,z);
  const address=systemAddress(galaxyId,localSiteX,localSiteY,localSiteZ),draw=BigInt(deriveU32(ctx,address,DOMAIN.system,'occupied',0n,meter));
  if(draw>=sector.facts.systemOccupancyQ32)return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'SYSTEM',address,key:{galaxyX:gx,galaxyY:gy,galaxyZ:gz,sectorX:sx,sectorY:sy,sectorZ:sz,siteX:x,siteY:y,siteZ:z},reason:'UNOCCUPIED_SYSTEM_SITE',relations:{locatedInSector:sector.id,memberOfGalaxy:galaxyId}};
  const id=entityId(ctx,'astronomy.system',systemKey(galaxyId,localSiteX,localSiteY,localSiteZ));
  const primaryMassMilliSolar=samplePrimaryMassMilliSolar(deriveU32(ctx,address,DOMAIN.system,'primary-mass',0n,meter));
  const stellarComponentCount=multiplicityComponentCount(primaryMassMilliSolar,deriveU32(ctx,address,DOMAIN.system,'multiplicity',0n,meter));
  const ageFactor=rangeFromU32(deriveU32(ctx,address,DOMAIN.system,'age-factor',0n,meter),500n,1500n);
  const ageMyr=clamp((galaxy.facts.populationAgeMyr*ageFactor)/1000n,10n,13800n);
  const gradient=-((sector.facts.distanceFromGalaxyCenterPc*350n)/clamp(galaxy.facts.characteristicRadiusPc,1n,80000n));
  const metallicityMilliDex=clamp(galaxy.facts.metallicityMilliDex+gradient+signedRangeFromU32(deriveU32(ctx,address,DOMAIN.system,'metallicity-scatter',0n,meter),150n),-2500n,700n);
  const solidBudgetPermille=clamp(1000n+(metallicityMilliDex*2n)/3n+signedRangeFromU32(deriveU32(ctx,address,DOMAIN.system,'solid-budget',0n,meter),200n),100n,2500n);
  const planetCountValue=planetCount(primaryMassMilliSolar,metallicityMilliDex,stellarComponentCount,deriveU32(ctx,address,DOMAIN.system,'planet-count',0n,meter));
  const barycentricScaleMilliAu=stellarComponentCount===1n?0n:rangeFromU32(deriveU32(ctx,address,DOMAIN.system,'barycentric-scale',0n,meter),500n,200000n);
  const planetArchitecture=stellarComponentCount>1n&&deriveU32(ctx,address,DOMAIN.system,'planet-architecture',0n,meter)<1073741824?'CIRCUMBINARY':'PRIMARY_HOSTED';
  const localOffsetMilliPc={x:(localSiteX*SYSTEM_SITE_MILLIPARSEC)+rangeFromU32(deriveU32(ctx,address,DOMAIN.system,'site-jitter-x',0n,meter),0n,SYSTEM_SITE_MILLIPARSEC-1n),y:(localSiteY*SYSTEM_SITE_MILLIPARSEC)+rangeFromU32(deriveU32(ctx,address,DOMAIN.system,'site-jitter-y',0n,meter),0n,SYSTEM_SITE_MILLIPARSEC-1n),z:(localSiteZ*SYSTEM_SITE_MILLIPARSEC)+rangeFromU32(deriveU32(ctx,address,DOMAIN.system,'site-jitter-z',0n,meter),0n,SYSTEM_SITE_MILLIPARSEC-1n)};
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'SYSTEM',id,address,key:{galaxyX:gx,galaxyY:gy,galaxyZ:gz,sectorX:sx,sectorY:sy,sectorZ:sz,siteX:x,siteY:y,siteZ:z},facts:{stellarComponentCount,ageMyr,metallicityMilliDex,primaryMassMilliSolar,barycentricScaleMilliAu,protoplanetarySolidBudgetPermille:solidBudgetPermille,planetCount:planetCountValue,planetArchitecture,localSite:{x:localSiteX,y:localSiteY,z:localSiteZ},localOffsetMilliPc},relations:{locatedInSector:sector.id,memberOfGalaxy:galaxyId}};
}

const STAR_KNOTS=Object.freeze([
  [80n,2400n,100n,1n,200000n],[200n,3200n,230n,8n,200000n],[500n,3800n,500n,60n,56000n],[1000n,5772n,1000n,1000n,10000n],[1500n,7000n,1400n,5000n,3600n],[2000n,8800n,1800n,16000n,1800n],[5000n,16000n,3000n,1000000n,180n],[10000n,25000n,5000n,10000000n,32n],[20000n,33000n,8000n,60000000n,7n],[60000n,43000n,15000n,800000000n,3n],[120000n,50000n,22000n,2000000000n,2n]
]);
function starProxyForMass(m){
  let row=STAR_KNOTS[0];
  for(let i=1;i<STAR_KNOTS.length;i++){
    if(m<=STAR_KNOTS[i][0]){const a=STAR_KNOTS[i-1],b=STAR_KNOTS[i],dx=b[0]-a[0],t=m-a[0];return {temperatureK:a[1]+(t*(b[1]-a[1]))/dx,radiusMilliSolar:a[2]+(t*(b[2]-a[2]))/dx,luminosityMilliSolar:a[3]+(t*(b[3]-a[3]))/dx,mainSequenceLifetimeMyr:a[4]+(t*(b[4]-a[4]))/dx}}row=STAR_KNOTS[i];
  }
  return {temperatureK:row[1],radiusMilliSolar:row[2],luminosityMilliSolar:row[3],mainSequenceLifetimeMyr:row[4]};
}
function companionMass(primary,index,u){if(index===0n)return primary;const qMin=primary>8000n?10000n:20000n;const qQ16=rangeFromU32(u,qMin,65000n);return clamp((primary*qQ16)/Q16,80n,primary)}
function starFromSystem(ctx,system,index,meter,depth){
  noteNode(meter,depth);
  if(index<0n||index>=system.facts.stellarComponentCount)return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'STAR',reason:'COMPONENT_INDEX_OUT_OF_RANGE',relations:{belongsToSystem:system.id}};
  const address=starAddress(system.id,index),id=entityId(ctx,'astronomy.star',starKey(system.id,index));
  const mass=companionMass(system.facts.primaryMassMilliSolar,index,deriveU32(ctx,address,DOMAIN.star,'mass-ratio',0n,meter));
  const base=starProxyForMass(mass),age=system.facts.ageMyr;
  let evolutionaryClass='MAIN_SEQUENCE',temperatureK=base.temperatureK,radiusMilliSolar=base.radiusMilliSolar,luminosityMilliSolar=base.luminosityMilliSolar;
  if(age>=base.mainSequenceLifetimeMyr){
    evolutionaryClass='REMNANT';
    if(mass<8000n){temperatureK=rangeFromU32(deriveU32(ctx,address,DOMAIN.star,'remnant-temperature',0n,meter),7000n,30000n);radiusMilliSolar=12n;luminosityMilliSolar=rangeFromU32(deriveU32(ctx,address,DOMAIN.star,'remnant-luminosity',0n,meter),1n,120n)}
    else{temperatureK=0n;radiusMilliSolar=1n;luminosityMilliSolar=0n}
  }else if(age*5n>=base.mainSequenceLifetimeMyr*4n){
    evolutionaryClass='EVOLVED';radiusMilliSolar=clamp(radiusMilliSolar*3n,1n,200000n);luminosityMilliSolar=clamp(luminosityMilliSolar*2n,0n,(1n<<63n)-1n);temperatureK=(temperatureK*4n)/5n;
  }
  temperatureK=clamp(temperatureK-(system.facts.metallicityMilliDex/20n),0n,60000n);
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'STAR',id,address,key:{componentIndex:index},facts:{massMilliSolar:mass,ageMyr:age,metallicityMilliDex:system.facts.metallicityMilliDex,evolutionaryClass,temperatureK,radiusMilliSolar,luminosityMilliSolar,mainSequenceLifetimeMyr:base.mainSequenceLifetimeMyr},relations:{belongsToSystem:system.id,memberOfGalaxy:system.relations.memberOfGalaxy}};
}
function resolveStar(ctx,key,meter=freshMeter(),depth=0){
  validateContext(ctx);noteNode(meter,depth);
  const system=resolveSystem(ctx,key,meter,depth+1);if(system.status!=='PRESENT')return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'STAR',reason:'PARENT_SYSTEM_ABSENT',relations:{}};
  const index=checkU64(key.componentIndex,'star componentIndex');return starFromSystem(ctx,system,index,meter,depth+1);
}

function orbitBaseMicroAu(system,primaryMass,u){
  let min=primaryMass<500n?12000n:primaryMass<1600n?25000n:primaryMass<4000n?45000n:90000n;
  let max=primaryMass<500n?50000n:primaryMass<1600n?90000n:primaryMass<4000n?160000n:300000n;
  if(system.facts.planetArchitecture==='CIRCUMBINARY'){min=clamp(system.facts.barycentricScaleMilliAu*5000n,180000n,1500000n);max=min*2n}
  return rangeFromU32(u,min,max);
}
function orbitForSlot(base,spacingQ16,index){let a=base;for(let i=0n;i<index;i++)a=(a*spacingQ16+32768n)/65536n;return a}
function planetClass(system,star,slot,u){
  const q=BigInt(u),metal=system.facts.metallicityMilliDex;
  let giantThreshold=120000000n+clamp(metal+500n,0n,1200n)*350000n+(slot*40000000n);
  giantThreshold=clamp(giantThreshold,50000000n,1000000000n);
  if(q<giantThreshold)return slot>=3n?'GAS_GIANT':'VOLATILE_RICH';
  if(slot>=4n&&q<giantThreshold+500000000n)return 'ICE_GIANT';
  if(star.facts.massMilliSolar<650n&&q<2800000000n)return 'TERRESTRIAL';
  return q<2500000000n?'TERRESTRIAL':'VOLATILE_RICH';
}
function massForPlanetClass(cls,u){
  if(cls==='TERRESTRIAL')return rangeFromU32(u,300n,8000n);
  if(cls==='VOLATILE_RICH')return rangeFromU32(u,5000n,30000n);
  if(cls==='ICE_GIANT')return rangeFromU32(u,15000n,60000n);
  return rangeFromU32(u,50000n,4000000n);
}
const RADIUS_TABLE=Object.freeze({
  TERRESTRIAL:[[300n,650n],[1000n,1000n],[2000n,1220n],[5000n,1600n],[8000n,1850n]],
  VOLATILE_RICH:[[5000n,1800n],[10000n,2600n],[20000n,3800n],[30000n,4800n]],
  ICE_GIANT:[[15000n,3500n],[30000n,4500n],[60000n,6500n]],
  GAS_GIANT:[[50000n,7000n],[100000n,9000n],[318000n,11200n],[1000000n,12000n],[4000000n,10500n]]
});
function interpTable(table,x){let row=table[0];for(let i=1;i<table.length;i++){if(x<=table[i][0]){const a=table[i-1],b=table[i];return a[1]+((x-a[0])*(b[1]-a[1]))/(b[0]-a[0])}row=table[i]}return row[1]}
function moonCountForPlanet(cls,orbitMicroAu,u){let max=cls==='TERRESTRIAL'?2n:cls==='VOLATILE_RICH'?4n:cls==='ICE_GIANT'?6n:8n;if(orbitMicroAu<100000n)max=max>1n?max-1n:max;const q=BigInt(u);const count=(q*(max+2n))>>32n;return clamp(count>0n?count-1n:0n,0n,max)}
function planetFromSystem(ctx,system,index,meter,depth){
  noteNode(meter,depth);
  if(index<0n||index>=system.facts.planetCount)return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'PLANET',reason:'PLANET_SLOT_OUT_OF_RANGE',relations:{belongsToSystem:system.id}};
  const primary=starFromSystem(ctx,system,0n,meter,depth+1);
  const address=planetAddress(system.id,index),id=entityId(ctx,'astronomy.planet',planetKey(system.id,index));
  const base=orbitBaseMicroAu(system,primary.facts.massMilliSolar,deriveU32(ctx,address,DOMAIN.planet,'orbit-base',0n,meter));
  const spacingQ16=rangeFromU32(deriveU32(ctx,system.address,DOMAIN.system,'planet-spacing',0n,meter),95000n,145000n);
  const semiMajorAxisMicroAu=orbitForSlot(base,spacingQ16,index);
  const eccentricityPpm=rangeFromU32(deriveU32(ctx,address,DOMAIN.planet,'eccentricity',0n,meter),0n,index<2n?120000n:240000n);
  const inclinationMilliDeg=rangeFromU32(deriveU32(ctx,address,DOMAIN.planet,'inclination',0n,meter),0n,5000n);
  const cls=planetClass(system,primary,index,deriveU32(ctx,address,DOMAIN.planet,'composition-class',0n,meter));
  const massMilliEarth=massForPlanetClass(cls,deriveU32(ctx,address,DOMAIN.planet,'mass',0n,meter));
  const radiusMilliEarth=interpTable(RADIUS_TABLE[cls],massMilliEarth);
  const denom=semiMajorAxisMicroAu*semiMajorAxisMicroAu;
  const insolationPpm=clamp((primary.facts.luminosityMilliSolar*1000000000000000n)/clamp(denom,1n,(1n<<63n)-1n),0n,1000000000000n);
  const fourthRootScaled=P.isqrt(P.isqrt(insolationPpm*10000n));
  const equilibriumTempK=clamp((278n*fourthRootScaled)/316n,3n,5000n);
  const moonCount=moonCountForPlanet(cls,semiMajorAxisMicroAu,deriveU32(ctx,address,DOMAIN.planet,'moon-count',0n,meter));
  const orbitCenter=system.facts.planetArchitecture==='CIRCUMBINARY'?'SYSTEM_BARYCENTER':'PRIMARY_STAR';
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'PLANET',id,address,key:{orbitSlot:index},facts:{semiMajorAxisMicroAu,eccentricityPpm,inclinationMilliDeg,massMilliEarth,radiusMilliEarth,compositionClass:cls,insolationPpm,equilibriumTempK,moonCount,orbitCenter},relations:{belongsToSystem:system.id,orbits:orbitCenter==='PRIMARY_STAR'?primary.id:system.id,memberOfGalaxy:system.relations.memberOfGalaxy}};
}
function resolvePlanet(ctx,key,meter=freshMeter(),depth=0){validateContext(ctx);noteNode(meter,depth);const system=resolveSystem(ctx,key,meter,depth+1);if(system.status!=='PRESENT')return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'PLANET',reason:'PARENT_SYSTEM_ABSENT',relations:{}};const index=checkU64(key.orbitSlot,'planet orbitSlot');return planetFromSystem(ctx,system,index,meter,depth+1)}

function resolveMoon(ctx,key,meter=freshMeter(),depth=0){
  validateContext(ctx);noteNode(meter,depth);
  const planet=resolvePlanet(ctx,key,meter,depth+1);if(planet.status!=='PRESENT')return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'MOON',reason:'PARENT_PLANET_ABSENT',relations:{}};
  const index=checkU64(key.satelliteSlot,'moon satelliteSlot');if(index>=planet.facts.moonCount)return {schemaVersion:SCHEMA_VERSION,status:'ABSENT',entityType:'MOON',reason:'MOON_SLOT_OUT_OF_RANGE',relations:{parentBody:planet.id}};
  const address=moonAddress(planet.id,index),id=entityId(ctx,'astronomy.moon',moonKey(planet.id,index));
  const orbitalRadiusPlanetRadiiMilli=rangeFromU32(deriveU32(ctx,address,DOMAIN.moon,'orbital-radius',0n,meter),2500n,80000n);
  const massFractionPpm=rangeFromU32(deriveU32(ctx,address,DOMAIN.moon,'mass-fraction',0n,meter),1n,planet.facts.compositionClass==='GAS_GIANT'?500n:20000n);
  const massMilliEarth=clamp((planet.facts.massMilliEarth*massFractionPpm)/1000000n,1n,200000n);
  const radiusMilliEarth=clamp(P.isqrt(massMilliEarth*1000n),50n,2500n);
  const inclinationMilliDeg=rangeFromU32(deriveU32(ctx,address,DOMAIN.moon,'inclination',0n,meter),0n,30000n);
  return {schemaVersion:SCHEMA_VERSION,status:'PRESENT',entityType:'MOON',id,address,key:{satelliteSlot:index},facts:{orbitalRadiusPlanetRadiiMilli,massMilliEarth,radiusMilliEarth,inclinationMilliDeg},relations:{parentBody:planet.id,orbits:planet.id,belongsToSystem:planet.relations.belongsToSystem}};
}

function resolveWithMetrics(kind,ctx,key){const meter=freshMeter();let result;if(kind==='region')result=resolveRegion(ctx,key,meter,0);else if(kind==='galaxy')result=resolveGalaxy(ctx,key,meter,0);else if(kind==='sector')result=resolveSector(ctx,key,meter,0);else if(kind==='system')result=resolveSystem(ctx,key,meter,0);else if(kind==='star')result=resolveStar(ctx,key,meter,0);else if(kind==='planet')result=resolvePlanet(ctx,key,meter,0);else if(kind==='moon')result=resolveMoon(ctx,key,meter,0);else fail('unknown entity kind');return {result,metrics:meter}}
function canonicalEnvelope(entity){if(!entity||entity.status!=='PRESENT')return entity;return {entityIdentity:entity.id,entityType:entity.entityType,canonicalFacts:entity.facts,relations:entity.relations,schemaVersion:entity.schemaVersion}}
function planetaryInputContract(ctx,key){
  const meter=freshMeter(),planet=resolvePlanet(ctx,key,meter,0);if(planet.status!=='PRESENT')return {status:'ABSENT',reason:planet.reason};
  const system=resolveSystem(ctx,key,meter,1),star=starFromSystem(ctx,system,0n,meter,2);
  return {contract:'p3-planetary-input-prototype-0',planetId:planet.id,systemAgeMyr:system.facts.ageMyr,systemMetallicityMilliDex:system.facts.metallicityMilliDex,stellar:{starId:star.id,massMilliSolar:star.facts.massMilliSolar,evolutionaryClass:star.facts.evolutionaryClass,temperatureK:star.facts.temperatureK,luminosityMilliSolar:star.facts.luminosityMilliSolar},orbit:{semiMajorAxisMicroAu:planet.facts.semiMajorAxisMicroAu,eccentricityPpm:planet.facts.eccentricityPpm,insolationPpm:planet.facts.insolationPpm,equilibriumTempK:planet.facts.equilibriumTempK},planet:{massMilliEarth:planet.facts.massMilliEarth,radiusMilliEarth:planet.facts.radiusMilliEarth,compositionClass:planet.facts.compositionClass},evidence:{status:'PROTOTYPE_NON_NORMATIVE'}};
}

const diagnostics=Object.freeze({nonCanonical:true,sampleGalaxyMassMilliDex,chooseMorphology,samplePrimaryMassMilliSolar,multiplicityComponentCount,planetCount,absoluteSystemSite});
O.p3AstronomyPrototype=Object.freeze({VERSION,SCHEMA_VERSION,DOMAIN,constants:Object.freeze({REGION_SPAN_GALAXY_CELLS,GALAXY_CELL_KPC,SECTOR_SIZE_PC,SYSTEM_SITE_AXIS,SYSTEM_SITE_MILLIPARSEC,MAX_PLANETS,MAX_MOONS}),resolveRegion,resolveGalaxy,resolveSector,resolveSystem,resolveStar,resolvePlanet,resolveMoon,resolveWithMetrics,canonicalEnvelope,planetaryInputContract,digestFact,environmentDensityQ16,containingRegionCoords,bytesEq,freshMeter,diagnostics});
})(typeof globalThis!=='undefined'?globalThis:this);
