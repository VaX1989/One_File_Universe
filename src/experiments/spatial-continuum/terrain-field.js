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
export function deterministicTerrainHeightMeters(eastM,northM,seed,{minimumWavelengthM=0}={}){
  const east=Number(eastM),north=Number(northM);
  if(!Number.isFinite(east)||!Number.isFinite(north))throw new TypeError('Terrain coordinates must be finite physical metres');
  const cutoff=Math.max(0,Number(minimumWavelengthM)||0),weight=wavelength=>Math.max(0,Math.min(1,(wavelength-cutoff)/Math.max(1,wavelength*.45))),[c0,c1,r,h0,h1,l0,l1,d0,d1]=parameters(seed),sample=(x,z)=>
    Math.sin(x/92000+c0)*Math.cos(z/76000-c1)*820*weight(76000)+
    (Math.abs(Math.sin((x+z*.42)/18000+r))*430-160)*weight(18000)+
    Math.sin(x/3400+h0)*Math.cos(z/2700+h1)*96*weight(2700)+
    Math.sin((x+z)/310+l0)*Math.cos((x-z*.7)/240+l1)*8.5*weight(240)+
    Math.sin(x/29+d0)*Math.cos(z/37+d1)*.72*weight(29);
  return sample(east,north)-sample(0,0);
}

// Compatibility name retained for the experiment's existing consumers. Its
// coordinates and result are now explicitly metres.
export function deterministicTerrainHeight(eastM,northM,seed,options){
  return deterministicTerrainHeightMeters(eastM,northM,seed,options);
}
