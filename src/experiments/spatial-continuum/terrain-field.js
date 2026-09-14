const hash=value=>{let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0};

const phase=(seed,salt)=>((hash(String(seed)+':'+salt)%1048576)/1048576)*Math.PI*2;
const parameterCache=new Map();
const parameters=seed=>{
  const key=String(seed);let value=parameterCache.get(key);if(value)return value;
  value=Object.freeze(['c0','c1','r','h0','h1','l0','l1','d0','d1'].map(salt=>phase(key,salt)));parameterCache.set(key,value);
  if(parameterCache.size>64)parameterCache.delete(parameterCache.keys().next().value);
  return value;
};
const sphereFeatureCache=new Map();
const sphereFeatures=seed=>{
  const key=String(seed);let value=sphereFeatureCache.get(key);if(value)return value;
  value=Object.freeze(Array.from({length:7},(_,index)=>{const longitude=phase(key,'crater-longitude-'+index),vertical=((hash(key+':crater-latitude-'+index)%1000001)/500000)-1,horizontal=Math.sqrt(Math.max(0,1-vertical*vertical));return Object.freeze({direction:Object.freeze([Math.cos(longitude)*horizontal,vertical,Math.sin(longitude)*horizontal]),scale:.62+(hash(key+':crater-scale-'+index)%650001)/1000000})}));sphereFeatureCache.set(key,value);if(sphereFeatureCache.size>64)sphereFeatureCache.delete(sphereFeatureCache.keys().next().value);return value;
};
const normalize=vector=>{const out=vector.map(Number),length=Math.hypot(...out);if(out.length!==3||out.some(value=>!Number.isFinite(value))||!(length>0))throw new TypeError('Terrain direction must be a finite non-zero 3-vector');return out.map(value=>value/length)};
const terrainProfile=(profile,radius)=>{const terrain=profile||{},structure=terrain.structuralWeights||{};return Object.freeze({grammarFamily:String(terrain.grammarFamily||'MIXED_LITHIC_PRESENTATION'),structuralWeights:Object.freeze({crater:Number(structure.crater??.42),ridge:Number(structure.ridge??.52),basin:Number(structure.basin??.38),fracture:Number(structure.fracture??.28),smooth:Number(structure.smooth??.34)}),planetaryWavelength:Number(terrain.planetaryWavelengthM)||radius*.24,macroWavelength:Number(terrain.macroWavelengthM)||76000,ridgeWavelength:Number(terrain.ridgeWavelengthM)||18000,highlandWavelength:Number(terrain.highlandWavelengthM)||2700,localWavelength:Number(terrain.localWavelengthM)||240,detailWavelength:Number(terrain.detailWavelengthM)||29,craterWavelength:Number(terrain.craterWavelengthM)||radius*.07,basinWavelength:Number(terrain.basinWavelengthM)||radius*.14,fractureWavelength:Number(terrain.fractureWavelengthM)||12000,planetaryAmplitude:Number(terrain.planetaryAmplitudeM)||760,macroAmplitude:Number(terrain.macroAmplitudeM)||820,ridgeAmplitude:Number(terrain.ridgeAmplitudeM)||430,highlandAmplitude:Number(terrain.highlandAmplitudeM)||96,localAmplitude:Number(terrain.localAmplitudeM)||8.5,detailAmplitude:Number(terrain.detailAmplitudeM)||.72,craterAmplitude:Number(terrain.craterAmplitudeM)||0,basinAmplitude:Number(terrain.basinAmplitudeM)||0,fractureAmplitude:Number(terrain.fractureAmplitudeM)||0})};
const bandWeight=(wavelength,minimumWavelengthM)=>Math.max(0,Math.min(1,(wavelength-minimumWavelengthM)/Math.max(1,wavelength*.45)));
const fade=value=>value*value*(3-2*value),lerp=(a,b,t)=>a+(b-a)*t;
const latticeValue=(x,y,z,seed)=>{let value=seed|0;value=Math.imul(value^(x|0),0x27d4eb2d);value=Math.imul(value^(y|0),0x165667b1);value=Math.imul(value^(z|0),0x1b873593);value=Math.imul(value^(value>>>15),0x85ebca6b);value=Math.imul(value^(value>>>13),0xc2b2ae35);return((value^(value>>>16))>>>0)/2147483648-1};
const valueNoise3=(direction,scale,seed)=>{const x=direction[0]*scale,y=direction[1]*scale,z=direction[2]*scale,x0=Math.floor(x),y0=Math.floor(y),z0=Math.floor(z),tx=fade(x-x0),ty=fade(y-y0),tz=fade(z-z0),corner=(dx,dy,dz)=>latticeValue(x0+dx,y0+dy,z0+dz,seed),x00=lerp(corner(0,0,0),corner(1,0,0),tx),x10=lerp(corner(0,1,0),corner(1,1,0),tx),x01=lerp(corner(0,0,1),corner(1,0,1),tx),x11=lerp(corner(0,1,1),corner(1,1,1),tx);return lerp(lerp(x00,x10,ty),lerp(x01,x11,ty),tz)};

// The body-fixed direction is the terrain address. Sampling the same direction
// always returns the same presentation-only elevation regardless of cube face,
// active LOD, selected landmark, or camera. Continuous 3D directional waves
// avoid the independent-face seams produced by per-tile 2D noise.
export function createPlanetaryTerrainSampler({radiusM,seed,minimumWavelengthM=0,profile=null}={}){
  const radius=Number(radiusM),cutoff=Math.max(0,Number(minimumWavelengthM)||0);if(!(radius>0)||!Number.isFinite(radius))throw new TypeError('Planetary terrain radius must be positive');
  const terrain=terrainProfile(profile,radius),structure=terrain.structuralWeights,weights=Object.freeze({planetary:bandWeight(terrain.planetaryWavelength,cutoff),macro:bandWeight(terrain.macroWavelength,cutoff),ridge:bandWeight(terrain.ridgeWavelength,cutoff),highland:bandWeight(terrain.highlandWavelength,cutoff),local:bandWeight(terrain.localWavelength,cutoff),detail:bandWeight(terrain.detailWavelength,cutoff),crater:bandWeight(terrain.craterWavelength,cutoff),basin:bandWeight(terrain.basinWavelength,cutoff),fracture:bandWeight(terrain.fractureWavelength,cutoff)}),base=hash(seed),layers=Object.freeze({planetary:base^0x9e3779b9,macro:base^0x243f6a88,ridge:base^0xb7e15162,highland:base^0xdeadbeef,local:base^0x85ebca6b,detail:base^0xc2b2ae35,basin:base^0x71f34ac5,fracture:base^0x4cf5ad43}),craters=structure.crater>0&&weights.crater>0?sphereFeatures(seed):Object.freeze([]),sample=(direction,wavelength,salt)=>valueNoise3(direction,radius/wavelength,salt);
  return bodyFixedUnit=>{
    const direction=normalize(bodyFixedUnit);let height=0;
    if(weights.planetary>0)height+=(sample(direction,terrain.planetaryWavelength,layers.planetary)*.72+sample(direction,terrain.planetaryWavelength*.43,layers.planetary^0x51ed270b)*.28)*terrain.planetaryAmplitude*weights.planetary*(.72+structure.smooth*.28);
    if(weights.macro>0)height+=sample(direction,terrain.macroWavelength,layers.macro)*terrain.macroAmplitude*weights.macro;
    if(weights.ridge>0)height+=(1-Math.abs(sample(direction,terrain.ridgeWavelength,layers.ridge))-.48)*terrain.ridgeAmplitude*weights.ridge*structure.ridge;
    if(weights.basin>0&&terrain.basinAmplitude>0){const basin=Math.max(0,.38-sample(direction,terrain.basinWavelength,layers.basin));height-=basin*basin*terrain.basinAmplitude*weights.basin*structure.basin}
    if(weights.crater>0&&terrain.craterAmplitude>0)for(const crater of craters){const chord=Math.sqrt(Math.max(0,2*(1-(direction[0]*crater.direction[0]+direction[1]*crater.direction[1]+direction[2]*crater.direction[2])))),normalizedDistance=chord/(terrain.craterWavelength/radius*crater.scale);if(normalizedDistance<1.28){const depression=normalizedDistance<.78?-((1-normalizedDistance/.78)**2):0,rim=Math.max(0,1-Math.abs(normalizedDistance-1)/.24)*.52;height+=(depression+rim)*terrain.craterAmplitude*weights.crater*structure.crater}}
    if(weights.fracture>0&&terrain.fractureAmplitude>0){const fracture=Math.abs(sample(direction,terrain.fractureWavelength,layers.fracture));if(fracture<.16)height-=(1-fracture/.16)*terrain.fractureAmplitude*weights.fracture*structure.fracture}
    if(weights.highland>0)height+=sample(direction,terrain.highlandWavelength,layers.highland)*terrain.highlandAmplitude*weights.highland;
    if(weights.local>0)height+=sample(direction,terrain.localWavelength,layers.local)*terrain.localAmplitude*weights.local;
    if(weights.detail>0)height+=sample(direction,terrain.detailWavelength,layers.detail)*terrain.detailAmplitude*weights.detail;
    return height;
  };
}

export function deterministicPlanetaryTerrainHeightMeters(bodyFixedUnit,radiusM,seed,options={}){
  return createPlanetaryTerrainSampler({radiusM,seed,...options})(bodyFixedUnit);
}

export function surfaceDirectionFromLocalMeters(surfaceTarget,eastM,northM,radiusM){
  const radius=Number(radiusM),east=Number(eastM),north=Number(northM),up=normalize(surfaceTarget?.bodyFixedUnit||surfaceTarget?.tangent?.up||[]),eastAxis=normalize(surfaceTarget?.tangent?.east||[]),northAxis=normalize(surfaceTarget?.tangent?.north||[]);if(!(radius>0)||!Number.isFinite(radius)||!Number.isFinite(east)||!Number.isFinite(north))throw new TypeError('Surface terrain coordinates require a positive radius and finite local metres');
  return Object.freeze(normalize(up.map((value,index)=>value+(east*eastAxis[index]+north*northAxis[index])/radius)));
}

export function deterministicSurfaceTerrainHeightMeters(eastM,northM,{surfaceTarget,radiusM,seed,minimumWavelengthM=0,profile=null,relativeToTarget=true}={}){
  return createSurfaceTerrainSampler({surfaceTarget,radiusM,seed,minimumWavelengthM,profile,relativeToTarget})(eastM,northM);
}

export function createSurfaceTerrainSampler({surfaceTarget,radiusM,seed,minimumWavelengthM=0,profile=null,relativeToTarget=true}={}){
  const samplePlanet=createPlanetaryTerrainSampler({radiusM,seed,minimumWavelengthM,profile}),anchor=relativeToTarget?samplePlanet(surfaceTarget?.bodyFixedUnit):0;
  return (eastM,northM)=>samplePlanet(surfaceDirectionFromLocalMeters(surfaceTarget,eastM,northM,radiusM))-anchor;
}

// Presentation-only terrain sampled in a stable local east/north metre domain.
// Frequencies and amplitudes are physical, so changing camera scale or LOD cannot
// silently redefine the terrain. This is not measured elevation.
export function deterministicTerrainHeightMeters(eastM,northM,seed,{minimumWavelengthM=0,profile=null}={}){
  const east=Number(eastM),north=Number(northM);
  if(!Number.isFinite(east)||!Number.isFinite(north))throw new TypeError('Terrain coordinates must be finite physical metres');
  const terrain=profile||{},macroWavelength=Number(terrain.macroWavelengthM)||76000,ridgeWavelength=Number(terrain.ridgeWavelengthM)||18000,highlandWavelength=Number(terrain.highlandWavelengthM)||2700,localWavelength=Number(terrain.localWavelengthM)||240,detailWavelength=Number(terrain.detailWavelengthM)||29,macroAmplitude=Number(terrain.macroAmplitudeM)||820,ridgeAmplitude=Number(terrain.ridgeAmplitudeM)||430,highlandAmplitude=Number(terrain.highlandAmplitudeM)||96,localAmplitude=Number(terrain.localAmplitudeM)||8.5,detailAmplitude=Number(terrain.detailAmplitudeM)||.72,cutoff=Math.max(0,Number(minimumWavelengthM)||0),weight=wavelength=>Math.max(0,Math.min(1,(wavelength-cutoff)/Math.max(1,wavelength*.45))),[c0,c1,r,h0,h1,l0,l1,d0,d1]=parameters(seed),sample=(x,z)=>
    Math.sin(x/(macroWavelength*1.21)+c0)*Math.cos(z/macroWavelength-c1)*macroAmplitude*weight(macroWavelength)+
    (Math.abs(Math.sin((x+z*.42)/ridgeWavelength+r))*ridgeAmplitude-ridgeAmplitude*.37)*weight(ridgeWavelength)+
    Math.sin(x/(highlandWavelength*1.26)+h0)*Math.cos(z/highlandWavelength+h1)*highlandAmplitude*weight(highlandWavelength)+
    Math.sin((x+z)/(localWavelength*1.29)+l0)*Math.cos((x-z*.7)/localWavelength+l1)*localAmplitude*weight(localWavelength)+
    Math.sin(x/detailWavelength+d0)*Math.cos(z/(detailWavelength*1.28)+d1)*detailAmplitude*weight(detailWavelength);
  return sample(east,north)-sample(0,0);
}

// Compatibility name retained for the experiment's existing consumers. Its
// coordinates and result are now explicitly metres.
export function deterministicTerrainHeight(eastM,northM,seed,options){
  return deterministicTerrainHeightMeters(eastM,northM,seed,options);
}
