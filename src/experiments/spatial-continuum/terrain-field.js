const hash=value=>{let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0};

const phase=(seed,salt)=>((hash(String(seed)+':'+salt)%1048576)/1048576)*Math.PI*2;
const parameterCache=new Map();
const parameters=seed=>{
  const key=String(seed);let value=parameterCache.get(key);if(value)return value;
  value=Object.freeze(['c0','c1','r','h0','h1','l0','l1','d0','d1'].map(salt=>phase(key,salt)));parameterCache.set(key,value);
  if(parameterCache.size>64)parameterCache.delete(parameterCache.keys().next().value);
  return value;
};

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
