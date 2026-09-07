(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-05-deep-planet-regime-core-2';
const AUTHORITY='MODEL_DERIVED_SIMULATION';
const PPM=1000000;
const LIMITS=Object.freeze({historySamples:64,climateCells:24,constituents:6,queryContexts:4,bytes:262144,operations:20000,queue:64,exactInventoryUnits:Number.MAX_SAFE_INTEGER});
const BULK=Object.freeze(['TERRESTRIAL','VOLATILE_RICH','ICE_GIANT','GAS_GIANT']);
function freeze(v,seen){
  if(!v||typeof v!=='object'||Object.isFrozen(v))return v;
  const memo=seen||new WeakSet();if(memo.has(v))return v;memo.add(v);
  for(const k of Object.keys(v))freeze(v[k],memo);
  return Object.freeze(v);
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(Number.isFinite(Number(v))?Number(v):0)));
const safe=(v,a=Number.MIN_SAFE_INTEGER,b=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
const nonNegativeFinite=v=>Number.isFinite(Number(v))&&Number(v)>=0;
function roundDivBigInt(numerator,denominator){
  if(typeof numerator!=='bigint'||typeof denominator!=='bigint'||denominator<=0n)throw new RangeError('positive bigint denominator required');
  const negative=numerator<0n,abs=negative?-numerator:numerator,offset=negative?(denominator-1n)/2n:denominator/2n,q=(abs+offset)/denominator,result=negative?-q:q;
  const number=Number(result);if(!Number.isSafeInteger(number))throw new RangeError('rounded bigint result outside safe integer domain');return number;
}
function mulDivRound(a,b,denominator){
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(denominator)||denominator<=0)throw new RangeError('safe integer mul/div operands required');
  const absA=Math.abs(a),absB=Math.abs(b);
  if(absA===0||absB===0)return 0;
  if(absA<=Math.floor(Number.MAX_SAFE_INTEGER/absB))return Math.round(a*b/denominator);
  return roundDivBigInt(BigInt(a)*BigInt(b),BigInt(denominator));
}
function ratioPpm(numerator,denominator,maxPpm=Number.MAX_SAFE_INTEGER){
  if(!safe(numerator,0)||!safe(denominator,1)||!safe(maxPpm,0))throw new RangeError('bounded non-negative ratio operands required');
  return Math.min(maxPpm,mulDivRound(numerator,PPM,denominator));
}
function normalizePpm(values){
  if(!Array.isArray(values)||values.length===0||values.length>LIMITS.constituents)throw new RangeError('bounded ppm vector required');
  if(!values.every(v=>nonNegativeFinite(v)&&Number.isSafeInteger(Number(v))))throw new RangeError('finite non-negative safe-integer ppm weights required');
  const clean=values.map(Number),numericSum=clean.reduce((a,b)=>a+b,0);
  if(numericSum===0)return Object.freeze(clean.map(()=>0));
  const numericFast=Number.isSafeInteger(numericSum)&&clean.every(v=>v===0||v<=Math.floor(Number.MAX_SAFE_INTEGER/PPM));
  const rows=numericFast?clean.map((v,i)=>{const numerator=v*PPM,q=Math.floor(numerator/numericSum);return {i,q,r:numerator-q*numericSum};}):(()=>{const sum=clean.reduce((a,b)=>a+BigInt(b),0n);return clean.map((v,i)=>{const numerator=BigInt(v)*BigInt(PPM);return {i,q:Number(numerator/sum),r:numerator%sum};});})();
  const base=rows.map(row=>row.q);let left=PPM-base.reduce((a,b)=>a+b,0);
  const rank=rows.slice().sort((a,b)=>a.r===b.r?a.i-b.i:(a.r>b.r?-1:1));
  for(let i=0;i<left;i++)base[rank[i%rank.length].i]++;
  return Object.freeze(base);
}
function unsupported(worldIdentity,reason,extra={}){return freeze({version:VERSION,worldIdentity:worldIdentity||null,supported:false,status:'UNSUPPORTED',reason,...extra,authority:AUTHORITY,canonicalPromotion:false});}
function identityFrom(planet,inputs){
  const raw=[planet?.planetIdentity,planet?.planetology?.planetIdentity,inputs?.planetIdentity].filter(v=>v!==undefined&&v!==null);
  if(raw.some(v=>typeof v!=='string'||v.length===0))return {supported:false,reason:'INVALID_WORLD_IDENTITY_FIELD',worldIdentity:null};
  const unique=[...new Set(raw)];
  if(unique.length===0)return {supported:false,reason:'WORLD_IDENTITY_REQUIRED',worldIdentity:null};
  if(unique.length>1)return {supported:false,reason:'WORLD_IDENTITY_MISMATCH',worldIdentity:unique[0],identities:Object.freeze(unique)};
  return {supported:true,worldIdentity:unique[0]};
}
function extract(planet){
  if(!planet||typeof planet!=='object')return unsupported(null,'PLANET_OBJECT_REQUIRED');
  const causal=planet.causal||planet.planetology?.causal||planet.planetology?.causalSystem||null;
  const inputs=causal?.inputs||null,formation=causal?.formation||null,composition=causal?.composition||null,gravity=causal?.gravity||null,interior=causal?.interior||null,atmosphere=causal?.atmosphere||null;
  const identity=identityFrom(planet,inputs);if(!identity.supported)return unsupported(identity.worldIdentity,identity.reason,identity.identities?{identities:identity.identities}:{});
  if(!inputs||!formation||!composition||!gravity||!interior||!atmosphere)return unsupported(identity.worldIdentity,'NO_COMPLETE_V1_CAUSAL_PLANETOLOGY_STATE');
  // Shallow-freeze only the lane-owned extraction wrapper. Upstream model objects remain untouched.
  return Object.freeze({version:VERSION,worldIdentity:identity.worldIdentity,supported:true,status:'PRESENT',causal,inputs,formation,composition,gravity,interior,atmosphere,sourceVolatileLedger:planet.volatileLedger||planet.planetology?.volatileLedger||null});
}
function validatePpmClosure(values){return values.every(v=>safe(v,0,PPM))&&values.reduce((a,b)=>a+b,0)===PPM;}
function classify(planet){
  const x=extract(planet);if(!x.supported)return x;
  const i=x.inputs,c=x.composition,a=x.atmosphere,f=x.formation,n=x.interior;
  const mass=Number(i.massMilliEarth),radius=Number(i.radiusKm),age=Number(i.ageMyr),bulk=String(i.bulkPriorClass||'UNKNOWN');
  if(!BULK.includes(bulk))return unsupported(x.worldIdentity,'UNSUPPORTED_BULK_PRIOR',{bulkPriorClass:bulk});
  if(!safe(mass,10,6356000)||!safe(radius,100,200000))return unsupported(x.worldIdentity,'OUTSIDE_V2X05_MASS_RADIUS_ENVELOPE',{massMilliEarth:safe(mass)?mass:null,radiusKm:safe(radius)?radius:null});
  if(!safe(age,0,20000))return unsupported(x.worldIdentity,'OUTSIDE_V2X05_AGE_ENVELOPE',{ageMyr:Number.isSafeInteger(age)?age:null});
  const composition=[Number(c.metalPpm),Number(c.silicatePpm),Number(c.icePpm),Number(c.lightVolatilePpm)];
  if(!validatePpmClosure(composition)||('sumPpm' in c&&Number(c.sumPpm)!==PPM))return unsupported(x.worldIdentity,'COMPOSITION_PPM_NOT_CLOSED',{compositionSumPpm:composition.every(Number.isSafeInteger)?composition.reduce((a,b)=>a+b,0):null});
  const layers=[Number(n.coreFractionPpm),Number(n.mantleFractionPpm),Number(n.crustFractionPpm)];
  if(!validatePpmClosure(layers))return unsupported(x.worldIdentity,'INTERIOR_LAYER_PPM_NOT_CLOSED',{interiorLayerSumPpm:layers.every(Number.isSafeInteger)?layers.reduce((a,b)=>a+b,0):null});
  const pressure=Number(a.pressureProxyPpm),light=Number(c.lightVolatilePpm),ice=Number(c.icePpm),initial=Number(a.initialInventoryUnits),condensed=Number(a.surfaceCondensedUnits),eq=Number(f.equilibriumTemperatureMilliK);
  if(!safe(pressure,0,12000000)||!safe(initial,1,LIMITS.exactInventoryUnits)||!safe(condensed,0,LIMITS.exactInventoryUnits)||!safe(eq,20000,3000000))return unsupported(x.worldIdentity,'INVALID_V1_MODELED_STATE');
  const giant=bulk==='ICE_GIANT'||bulk==='GAS_GIANT';
  const subNeptune=!giant&&bulk==='VOLATILE_RICH'&&mass>=2000&&radius>=9000&&light>=220000;
  const airless=!giant&&!subNeptune&&(pressure<12000||String(a.compositionFamily)==='AIRLESS_OR_TRACE_EXOSPHERE');
  const condensedSharePpm=clamp(ratioPpm(condensed,initial,PPM),0,PPM);
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
    integrity:freeze({identityConsistent:true,compositionClosurePpm:PPM,interiorLayerClosurePpm:PPM,sourceObjectsFrozen:false}),
    authority:AUTHORITY,fidelity:freeze({regime:'deep-planet-reduced-order',validity:'Known V1 bulk priors inside explicit mass/radius/age and exact modeled-state closure bounds',resolution:'One modeled world',uncertainty:'Regime labels are deterministic model classifications, not observed planet taxonomy or EOS retrievals'})});
}
O.v2x05RegimeCore=Object.freeze({VERSION,AUTHORITY,PPM,LIMITS,BULK,freeze,clamp,safe,roundDivBigInt,mulDivRound,ratioPpm,normalizePpm,unsupported,extract,validatePpmClosure,classify});
})(typeof globalThis!=='undefined'?globalThis:this);
