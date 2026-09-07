(function(root){
'use strict';
const O=root.OFU=root.OFU||{},A=O.v2x06SurfaceAddress;
if(!A)throw new Error('V2X-06 surface address required');
const VERSION='ofu-v2x-06-geography-1';
const AUTHORITY='MODEL_DERIVED_SIMULATION';
const PPM=1000000;
const MAX_FEATURES=48;
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function clamp(v,a,b){return Math.max(a,Math.min(b,Number(v)||0))}
function clampPpm(v){return Math.round(clamp(v,0,PPM))}
function clampSignedPpm(v){return Math.round(clamp(v,-PPM,PPM))}
function hash32(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0}
function rand(key,index){let x=(hash32(key)+Math.imul(index+1,0x9e3779b1))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296}
function unit(v){const n=Math.hypot(v[0],v[1],v[2]);if(!(n>1e-12))return[1,0,0];return[v[0]/n,v[1]/n,v[2]/n]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function seededUnit(key,index){const z=rand(key,index*3)*2-1,t=rand(key,index*3+1)*Math.PI*2,r=Math.sqrt(Math.max(0,1-z*z));return freeze([r*Math.cos(t),z,r*Math.sin(t)])}
function capWeight(p,center,radius){const d=clamp(dot(p,center),-1,1),angle=Math.acos(d),q=1-angle/Math.max(1e-6,radius);return q<=0?0:q*q*(3-2*q)}
function ridgeWeight(p,normal,width){const d=Math.abs(dot(p,normal)),q=1-d/Math.max(1e-6,width);return q<=0?0:q*q}
function harmonicField(p,key){let s=0,w=0;for(let i=0;i<7;i++){const axis=seededUnit(key+':harmonic',i),freq=1+(i%3),phase=rand(key+':phase',i)*Math.PI*2,term=Math.sin((dot(p,axis)*1.7+phase)*freq);const weight=1/(1+i*.42);s+=term*weight;w+=weight}return s/Math.max(1e-9,w)}
function featureSet(key,count,prefix,extra){const out=[];for(let i=0;i<count;i++)out.push(freeze({id:`${prefix}:${i}`,center:seededUnit(key+':'+prefix,i),strength:Math.round((.35+.65*rand(key+':'+prefix+':strength',i))*PPM),...extra(i)}));return freeze(out)}
function createModel(input={}){
 const planetIdentity=String(input.planetIdentity||'');if(!planetIdentity||planetIdentity.length>256)throw new TypeError('planetIdentity required');
 const planetClass=String(input.planetClass||'TERRESTRIAL').toUpperCase(),noSolidSurface=Boolean(input.noSolidSurface===true||['GAS_GIANT','ICE_GIANT','GIANT','NO_SOLID_SURFACE'].includes(planetClass));
 const waterAreaPpm=clampPpm(input.waterAreaPpm),iceAreaPpm=clampPpm(input.iceAreaPpm),tectonicActivityPpm=clampPpm(input.tectonicActivityPpm??350000),volcanicActivityPpm=clampPpm(input.volcanicActivityPpm??250000),impactActivityPpm=clampPpm(input.impactActivityPpm??120000),erosionActivityPpm=clampPpm(input.erosionActivityPpm??300000),aridityPpm=clampPpm(input.aridityPpm??300000);
 const sourceAuthority=String(input.sourceAuthority||AUTHORITY),sourceProvenance=freeze(Array.isArray(input.sourceProvenance)?input.sourceProvenance.slice(0,16).map(String):[]);
 const key=planetIdentity+'|'+planetClass;
 const plates=featureSet(key,10,'plate',i=>({axis:seededUnit(key+':plate-axis',i),bias:Math.round((rand(key+':plate-bias',i)*2-1)*PPM)}));
 const orogens=featureSet(key,8,'orogen',i=>({normal:unit(cross(seededUnit(key+':orogen-a',i),seededUnit(key+':orogen-b',i))),width:.035+.08*rand(key+':orogen-width',i),sign:rand(key+':orogen-sign',i)>.18?1:-1}));
 const basins=featureSet(key,8,'basin',i=>({radius:.16+.38*rand(key+':basin-radius',i)}));
 const hotspots=featureSet(key,5,'hotspot',i=>({radius:.025+.065*rand(key+':hotspot-radius',i)}));
 const impacts=featureSet(key,10,'impact',i=>({radius:.018+.075*rand(key+':impact-radius',i)}));
 const featureCount=plates.length+orogens.length+basins.length+hotspots.length+impacts.length;if(featureCount>MAX_FEATURES)throw new Error('surface feature bound exceeded');
 const seaLevelCuePpm=clampSignedPpm(-720000+Math.round(waterAreaPpm/PPM*1440000));
 function nearestPlate(p){let best=null,bestDot=-Infinity;for(const f of plates){const d=dot(p,f.center);if(d>bestDot){bestDot=d;best=f}}return{feature:best,score:bestDot}}
 function nearestBasin(p){let best=null,bestWeight=-1;for(const f of basins){const w=capWeight(p,f.center,f.radius);if(w>bestWeight){bestWeight=w;best=f}}return{feature:best,weight:bestWeight}}
 function rawAtUnit(vector){
  const p=unit(vector);if(noSolidSurface)return{unit:p,noSolidSurface:true,reliefCuePpm:0,seaLevelCuePpm,coastDeltaPpm:0,surfaceClass:'NO_SOLID_SURFACE',provinceClass:'NO_SOLID_SURFACE_REFERENCE',materialFamily:'NONE',plateIdentity:null,basinIdentity:null,orogenCuePpm:0,volcanicCuePpm:0,impactCuePpm:0,erosionCuePpm:0,cryosphereCuePpm:0,aridityCuePpm:aridityPpm};
  const base=harmonicField(p,key),plate=nearestPlate(p);let continental=base*.48+plate.feature.bias/PPM*.18+plate.score*.22;
  let orogen=0;for(const f of orogens){const w=ridgeWeight(p,f.normal,f.width);orogen+=w*(f.strength/PPM)*f.sign}
  orogen*=tectonicActivityPpm/PPM*.58;
  const basin=nearestBasin(p);let basinCue=0;for(const f of basins)basinCue-=capWeight(p,f.center,f.radius)*(f.strength/PPM)*.34;
  let volcanic=0;for(const f of hotspots)volcanic+=capWeight(p,f.center,f.radius)*(f.strength/PPM)*.62*(volcanicActivityPpm/PPM);
  let impact=0,impactAbs=0;for(const f of impacts){const c=clamp(dot(p,f.center),-1,1),angle=Math.acos(c),r=f.radius;if(angle<r*1.55){const x=angle/r,core=x<1?-(1-x*x)*.55:0,ring=Math.max(0,1-Math.abs(x-1.08)/.28)*.42,v=(core+ring)*(f.strength/PPM)*(impactActivityPpm/PPM);impact+=v;impactAbs=Math.max(impactAbs,Math.abs(v))}}
  const tectonicTexture=harmonicField(p,key+':detail')*(tectonicActivityPpm/PPM)*.12;
  const reliefNorm=clamp(continental+orogen+basinCue+volcanic+impact+tectonicTexture,-1,1),reliefCuePpm=clampSignedPpm(reliefNorm*PPM),coastDeltaPpm=clampSignedPpm(reliefCuePpm-seaLevelCuePpm),surfaceClass=coastDeltaPpm<=0?'LIQUID':'SOLID';
  let province='CRATONIC_OR_CONTINENTAL_PRESENTATION';if(surfaceClass==='LIQUID')province=basin.weight>.25?'BASIN_OCEANIC_PRESENTATION':'OCEANIC_PRESENTATION';else if(Math.abs(orogen)>.22)province=orogen>0?'OROGENIC_PRESENTATION':'RIFT_PRESENTATION';else if(volcanic>.16)province='VOLCANIC_PRESENTATION';else if(impactAbs>.11)province='IMPACT_PRESENTATION';else if(basin.weight>.45)province='BASIN_PRESENTATION';else if(reliefNorm>.52)province='PLATEAU_PRESENTATION';
  const latitude=Math.abs(A.unitToLatLon(p).latMicroDeg)/(90*A.MICRO_DEG),cryosphereCuePpm=clampPpm(iceAreaPpm*(.28+.72*latitude)),aridityCuePpm=clampPpm(aridityPpm*(1-.35*latitude)),erosionCuePpm=clampPpm(erosionActivityPpm*(.25+.75*(1-Math.min(1,Math.abs(coastDeltaPpm)/PPM))));
  let materialFamily;if(surfaceClass==='LIQUID')materialFamily=cryosphereCuePpm>700000?'ICE_COVERED_LIQUID_PRESENTATION':'LIQUID_SURFACE_PRESENTATION';else if(cryosphereCuePpm>650000)materialFamily='ICE_SNOW_SUBSTRATE_PRESENTATION';else if(province.includes('VOLCANIC'))materialFamily='VOLCANIC_ROCK_PRESENTATION';else if(province.includes('BASIN'))materialFamily='SEDIMENTARY_SUBSTRATE_PRESENTATION';else if(aridityCuePpm>650000)materialFamily='ARID_REGOLITH_PRESENTATION';else materialFamily='ROCK_REGOLITH_PRESENTATION';
  let landformAnalog='NONE';if(surfaceClass==='SOLID'&&cryosphereCuePpm>700000)landformAnalog='GLACIER_ANALOG_PRESENTATION';else if(surfaceClass==='SOLID'&&aridityCuePpm>720000&&Math.abs(orogen)<.18)landformAnalog='DUNE_FIELD_ANALOG_PRESENTATION';else if(surfaceClass==='SOLID'&&volcanic>.18)landformAnalog='VOLCANIC_CONE_ANALOG_PRESENTATION';
  return{unit:p,noSolidSurface:false,reliefCuePpm,seaLevelCuePpm,coastDeltaPpm,surfaceClass,provinceClass:province,materialFamily,plateIdentity:plate.feature.id,basinIdentity:basin.feature?.id||null,orogenCuePpm:clampSignedPpm(orogen*PPM),volcanicCuePpm:clampPpm(volcanic*PPM),impactCuePpm:clampPpm(impactAbs*PPM),erosionCuePpm,cryosphereCuePpm,aridityCuePpm,landformAnalog};
 }
 function sampleUnit(vector){const raw=rawAtUnit(vector),ll=A.unitToLatLon(raw.unit);return freeze({...raw,latMicroDeg:ll.latMicroDeg,lonMicroDeg:ll.lonMicroDeg,authority:AUTHORITY,sourceAuthority,claims:{reliefCueIsElevationMeasurement:false,provinceIsCanonicalGeology:false,shorelineCanonical:false,materialFamilyIsBiologyClaim:false}})}
 function sample(addressOrLatLon){let address;if(addressOrLatLon?.locationIdentity)address=addressOrLatLon;else address=A.locate(planetIdentity,addressOrLatLon?.latMicroDeg??0,addressOrLatLon?.lonMicroDeg??0,addressOrLatLon?.level??0);const s=sampleUnit(address.unit);return freeze({...s,locationIdentity:address.locationIdentity,patchIdentity:address.patchIdentity,level:address.level,planetIdentity});}
 function slopeCue(address){if(noSolidSurface)return freeze({slopePpm:0,roughnessPpm:0});const step=Math.max(500,Math.round(1000000/Math.max(1,2**Math.min(10,address.level||0)))),lat=address.latMicroDeg,lon=address.lonMicroDeg,c=sample(address).reliefCuePpm,n=sample(A.locate(planetIdentity,lat+step,lon,address.level)).reliefCuePpm,s=sample(A.locate(planetIdentity,lat-step,lon,address.level)).reliefCuePpm,e=sample(A.locate(planetIdentity,lat,lon+step,address.level)).reliefCuePpm,w=sample(A.locate(planetIdentity,lat,lon-step,address.level)).reliefCuePpm,dx=(e-w)/2,dy=(n-s)/2,slope=Math.hypot(dx,dy),rough=Math.max(Math.abs(n-c),Math.abs(s-c),Math.abs(e-c),Math.abs(w-c));return freeze({slopePpm:clampPpm(slope),roughnessPpm:clampPpm(rough),sampleStepMicroDeg:step})}
 function descriptor(){return freeze({version:VERSION,authority:AUTHORITY,planetIdentity,planetClass,sourceAuthority,sourceProvenance,inputs:{waterAreaPpm,iceAreaPpm,tectonicActivityPpm,volcanicActivityPpm,impactActivityPpm,erosionActivityPpm,aridityPpm},bounds:{featureCount,maxFeatures:MAX_FEATURES,plates:plates.length,orogens:orogens.length,basins:basins.length,hotspots:hotspots.length,impacts:impacts.length,globalEnumeration:false},surfaceSupport:noSolidSurface?'NO_SOLID_SURFACE':'SUPPORTED_MODEL_PRESENTATION',claims:{canonicalElevation:false,measuredGeology:false,exactOceanArea:false,plateTectonicsCanonical:false}})}
 return Object.freeze({VERSION,AUTHORITY,planetIdentity,planetClass,noSolidSurface,waterAreaPpm,iceAreaPpm,tectonicActivityPpm,volcanicActivityPpm,impactActivityPpm,erosionActivityPpm,aridityPpm,seaLevelCuePpm,features:freeze({plates,orogens,basins,hotspots,impacts}),sample,sampleUnit,rawAtUnit,slopeCue,descriptor});
}
O.v2x06Geography=Object.freeze({VERSION,AUTHORITY,PPM,MAX_FEATURES,createModel});
})(globalThis);
