(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-05-deep-planet-regime-core-1';
const AUTHORITY='MODEL_DERIVED_SIMULATION';
const PPM=1000000;
const LIMITS=Object.freeze({historySamples:64,climateCells:24,constituents:6,queryContexts:4,bytes:262144,operations:20000,queue:64});
const BULK=Object.freeze(['TERRESTRIAL','VOLATILE_RICH','ICE_GIANT','GAS_GIANT']);
const freeze=v=>{if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(Number.isFinite(Number(v))?Number(v):0)));
const safe=(v,a=Number.MIN_SAFE_INTEGER,b=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
function normalizePpm(values){
  if(!Array.isArray(values)||values.length===0||values.length>LIMITS.constituents)throw new RangeError('bounded ppm vector required');
  const clean=values.map(v=>Math.max(0,Math.round(Number.isFinite(Number(v))?Number(v):0))),sum=clean.reduce((a,b)=>a+b,0);
  if(sum<=0)return Object.freeze(clean.map(()=>0));
  const scaled=clean.map(v=>v*PPM/sum),base=scaled.map(Math.floor);let left=PPM-base.reduce((a,b)=>a+b,0);
  const rank=scaled.map((v,i)=>({i,r:v-base[i]})).sort((a,b)=>b.r-a.r||a.i-b.i);
  for(let i=0;i<left;i++)base[rank[i%rank.length].i]++;
  return Object.freeze(base);
}
function unsupported(worldIdentity,reason,extra={}){return freeze({version:VERSION,worldIdentity:worldIdentity||null,supported:false,status:'UNSUPPORTED',reason,...extra,authority:AUTHORITY,canonicalPromotion:false});}
function extract(planet){
  if(!planet||typeof planet!=='object')return unsupported(null,'PLANET_OBJECT_REQUIRED');
  const causal=planet.causal||planet.planetology?.causal||planet.planetology?.causalSystem||null;
  const inputs=causal?.inputs||null,formation=causal?.formation||null,composition=causal?.composition||null,gravity=causal?.gravity||null,interior=causal?.interior||null,atmosphere=causal?.atmosphere||null;
  const worldIdentity=planet.planetIdentity||planet.planetology?.planetIdentity||inputs?.planetIdentity||null;
  if(typeof worldIdentity!=='string'||!worldIdentity)return unsupported(null,'WORLD_IDENTITY_REQUIRED');
  if(!inputs||!formation||!composition||!gravity||!interior||!atmosphere)return unsupported(worldIdentity,'NO_COMPLETE_V1_CAUSAL_PLANETOLOGY_STATE');
  return freeze({version:VERSION,worldIdentity,supported:true,status:'PRESENT',causal,inputs,formation,composition,gravity,interior,atmosphere,sourceVolatileLedger:planet.volatileLedger||planet.planetology?.volatileLedger||null});
}
function classify(planet){
  const x=extract(planet);if(!x.supported)return x;
  const i=x.inputs,c=x.composition,a=x.atmosphere,f=x.formation;
  const mass=Number(i.massMilliEarth),radius=Number(i.radiusKm),bulk=String(i.bulkPriorClass||'UNKNOWN');
  if(!BULK.includes(bulk))return unsupported(x.worldIdentity,'UNSUPPORTED_BULK_PRIOR',{bulkPriorClass:bulk});
  if(!safe(mass,10,6356000)||!safe(radius,100,200000))return unsupported(x.worldIdentity,'OUTSIDE_V2X05_MASS_RADIUS_ENVELOPE',{massMilliEarth:safe(mass)?mass:null,radiusKm:safe(radius)?radius:null});
  const pressure=Number(a.pressureProxyPpm),light=Number(c.lightVolatilePpm),ice=Number(c.icePpm),initial=Number(a.initialInventoryUnits),condensed=Number(a.surfaceCondensedUnits),eq=Number(f.equilibriumTemperatureMilliK);
  if(![pressure,light,ice,initial,condensed,eq].every(Number.isSafeInteger)||pressure<0||light<0||ice<0||initial<=0||condensed<0)return unsupported(x.worldIdentity,'INVALID_V1_MODELED_STATE');
  const giant=bulk==='ICE_GIANT'||bulk==='GAS_GIANT';
  const subNeptune=!giant&&bulk==='VOLATILE_RICH'&&mass>=2000&&radius>=9000&&light>=220000;
  const airless=!giant&&!subNeptune&&(pressure<12000||String(a.compositionFamily)==='AIRLESS_OR_TRACE_EXOSPHERE');
  const condensedSharePpm=clamp(condensed*PPM/initial,0,PPM);
  const oceanCandidate=!giant&&!subNeptune&&!airless&&condensedSharePpm>=250000&&eq>=180000&&eq<=390000;
  let regime;
  if(bulk==='GAS_GIANT')regime='GAS_GIANT';
  else if(bulk==='ICE_GIANT')regime='ICE_GIANT';
  else if(subNeptune)regime='SUB_NEPTUNE';
  else if(airless)regime='AIRLESS_TERRESTRIAL';
  else if(oceanCandidate)regime='OCEAN_WORLD_CANDIDATE';
  else if(bulk==='VOLATILE_RICH')regime='VOLATILE_RICH_TERRESTRIAL';
  else regime='TERRESTRIAL_ATMOSPHERIC';
  const solidSurface=!['GAS_GIANT','ICE_GIANT','SUB_NEPTUNE'].includes(regime);
  return freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',regime,bulkPriorClass:bulk,massMilliEarth:mass,radiusKm:radius,
    surfaceSemantics:solidSurface?'SOLID_SURFACE_MODEL_AVAILABLE':'NO_RESOLVED_SOLID_SURFACE',solidSurfaceModel:solidSurface,
    atmosphereSemantics:airless?'TRACE_OR_COLLISIONLESS_ONLY':'MODELED_COLLISIONAL_OR_DEEP_ENVELOPE',pressureProxyPpm:pressure,condensedSharePpm,
    classificationBasis:'BOUNDED_V1_MODELED_STATE_HEURISTIC',observationalClassificationClaim:false,eosClaim:false,canonicalPromotion:false,
    authority:AUTHORITY,fidelity:freeze({regime:'deep-planet-reduced-order',validity:'Known V1 bulk priors inside explicit mass/radius bounds',resolution:'One modeled world',uncertainty:'Regime labels are deterministic model classifications, not observed planet taxonomy or EOS retrievals'})});
}
O.v2x05RegimeCore=Object.freeze({VERSION,AUTHORITY,PPM,LIMITS,BULK,freeze,clamp,safe,normalizePpm,unsupported,extract,classify});
})(typeof globalThis!=='undefined'?globalThis:this);
