import crypto from 'node:crypto';

export const CONTRACT_ID='ofu-wave-v-planetology-frontier-research-v1';
export const AUTHORITY='P5_RESEARCH_DRAFT';
export const VERSION=1;
export const STATUS='RESEARCH_ONLY_NON_CANONICAL';
export const U64_MAX=(1n<<64n)-1n;
const PI_NUM=355n,PI_DEN=113n,KG_PER_TG=1000000000n,MICRO=1000000n;
const SIGMA_NUM=5670374419n,SIGMA_DEN=100000000000000000n,MK4=1000n**4n;
const SOLAR=1361n,PPM=1000000n;

function fail(m){throw new Error('WV-B frontier: '+m)}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function nonneg(v,n){if(typeof v!=='bigint'||v<0n)fail(n+' must be non-negative BigInt');return v}
function roundHalfEven(n,d){n=BigInt(n);d=BigInt(d);if(d<=0n)fail('positive denominator required');const neg=n<0n;if(neg)n=-n;let q=n/d,r=n%d;const t=2n*r;if(t>d||(t===d&&(q&1n)))q++;return neg?-q:q}
function pow4(x){const y=x*x;return y*y}
function root4Floor(n){let lo=0n,hi=1n;while(pow4(hi)<=n)hi<<=1n;while(lo+1n<hi){const m=(lo+hi)>>1n;if(pow4(m)<=n)lo=m;else hi=m}return lo}
function root4Ratio(n,d){if(n===0n)return 0n;const q=root4Floor(n/d),m=2n*q+1n;return 16n*n>d*pow4(m)||(16n*n===d*pow4(m)&&(q&1n))?q+1n:q}
function exactKeys(o,keys,n){if(!o||typeof o!=='object'||Array.isArray(o))fail(n+' map required');const a=Object.keys(o).sort(),b=[...keys].sort();if(a.length!==b.length||a.some((x,i)=>x!==b[i]))fail(n+' fields invalid')}

export function radiativeEffectiveTemperatureMilliK(insolationPpm,bondAlbedoPpm){
  const s=u64(insolationPpm,'insolationPpm'),a=u64(bondAlbedoPpm,'bondAlbedoPpm');
  if(a>PPM)fail('Bond albedo outside 0..1');
  if(s===0n||a===PPM)return 0n;
  const n=SOLAR*s*(PPM-a)*SIGMA_DEN*MK4;
  const d=4n*PPM*PPM*SIGMA_NUM;
  return root4Ratio(n,d);
}

export function globalColumnPressurePa(atmosphereTg,gravityMicroMs2,radiusM){
  const m=u64(atmosphereTg,'atmosphereTg'),g=u64(gravityMicroMs2,'gravityMicroMs2'),r=u64(radiusM,'radiusM');
  if(r===0n)fail('radius must be positive');
  return roundHalfEven(m*KG_PER_TG*g*PI_DEN,4n*PI_NUM*r*r*MICRO);
}

export function energyLimitedEscapeUpperBoundKg({xuvFluxMilliWm2,radiusM,massKg,durationSeconds,efficiencyPpm=150000n}){
  const f=u64(xuvFluxMilliWm2,'xuvFluxMilliWm2'),r=u64(radiusM,'radiusM'),m=nonneg(massKg,'massKg'),t=nonneg(durationSeconds,'durationSeconds'),e=u64(efficiencyPpm,'efficiencyPpm');
  if(m===0n||r===0n||e>PPM)fail('escape input domain');
  const G_NUM=667430n,G_DEN=10000000000000000n;
  const n=e*PI_NUM*r*r*r*f*t*G_DEN;
  const d=PPM*PI_DEN*1000n*G_NUM*m;
  return roundHalfEven(n,d);
}

export const RESERVOIRS=Object.freeze(['coreTg','mantleTg','atmosphereTg','surfaceCondensedTg','lostTg']);
export function validateVolatileLedger(v){
  exactKeys(v,['initialInventoryTg','coreTg','mantleTg','atmosphereTg','surfaceCondensedTg','lostTg','epistemicStatus','provenance'],'volatile ledger');
  for(const k of ['initialInventoryTg',...RESERVOIRS])u64(v[k],k);
  const sum=RESERVOIRS.reduce((a,k)=>a+v[k],0n);
  if(sum!==v.initialInventoryTg)fail('volatile conservation failure');
  if(!['KNOWN_SOURCE_STATE','HYPOTHETICAL_MODEL_VALUE','RESEARCH_FIXTURE'].includes(v.epistemicStatus))fail('volatile epistemicStatus');
  if(typeof v.provenance!=='string'||!v.provenance)fail('volatile provenance');
  return Object.freeze({...v,accountedInventoryTg:sum});
}

export function transferVolatile(v,from,to,massTg){
  const input={...v};delete input.accountedInventoryTg;validateVolatileLedger(input);const x=u64(massTg,'massTg');
  if(!RESERVOIRS.includes(from)||!RESERVOIRS.includes(to)||from===to)fail('reservoir transition');
  if(from==='lostTg')fail('lost reservoir terminal; reaccretion needs separate model');
  if(input[from]<x)fail('transfer exceeds source');
  const out={...input,[from]:input[from]-x,[to]:input[to]+x};
  return validateVolatileLedger(out);
}

export function hydrosphereConstraint({waterSurfaceTg,basinCapacityTg,temperatureState,pressureState}){
  const w=u64(waterSurfaceTg,'waterSurfaceTg'),b=u64(basinCapacityTg,'basinCapacityTg');
  if(!temperatureState||!pressureState)return Object.freeze({status:'UNKNOWN',oceanAuthorized:false,reason:'TEMPERATURE_OR_PRESSURE_STATE_MISSING'});
  if(temperatureState.kind==='EFFECTIVE_RADIATIVE_TEMPERATURE')return Object.freeze({status:'INSUFFICIENT',oceanAuthorized:false,reason:'EFFECTIVE_TEMPERATURE_IS_NOT_SURFACE_TEMPERATURE'});
  if(temperatureState.epistemicStatus==='UNKNOWN'||pressureState.epistemicStatus==='UNKNOWN')return Object.freeze({status:'UNKNOWN',oceanAuthorized:false,reason:'ENVIRONMENT_STATE_UNKNOWN'});
  if(b===0n||w===0n)return Object.freeze({status:'DERIVED_BOUND',oceanAuthorized:false,waterAreaPpm:0n,reason:'NO_SURFACE_WATER_OR_BASIN_CAPACITY'});
  const areaPpm=w>=b?PPM:roundHalfEven(w*PPM,b);
  return Object.freeze({status:'DERIVED_BOUND',oceanAuthorized:false,waterAreaPpm:areaPpm,reason:'AREA_CAPACITY_BOUND_ONLY_NOT_OCEAN_EXISTENCE'});
}

function hash64(text){const h=crypto.createHash('sha256').update(text).digest();return h.readBigUInt64BE(0)}
function signedUnitBasis(seed){return Number(seed%2000000001n)-1000000000}
export function sparseGeographyCell({planetKey,level,x,y,parentWaterBudgetTg,parentReliefBasis=0}){
  if(typeof planetKey!=='string'||!planetKey)fail('planetKey');
  for(const [n,v] of Object.entries({level,x,y,parentReliefBasis}))if(!Number.isSafeInteger(v))fail(n+' integer required');
  if(level<0||level>30||x<0||y<0||x>=2**Math.min(level,30)||y>=2**Math.min(level,30))fail('surface address domain');
  const budget=u64(parentWaterBudgetTg,'parentWaterBudgetTg');
  const idx=(y%2)*2+(x%2),base=budget/4n,rem=budget%4n,share=base+(BigInt(idx)<rem?1n:0n);
  const h1=hash64(`${CONTRACT_ID}|${planetKey}|${level}|${x}|${y}|relief`);
  const h2=hash64(`${CONTRACT_ID}|${planetKey}|${level}|${x}|${y}|basin`);
  const scale=Math.max(1,Math.floor(1000000000/(level+1)));
  const relief=parentReliefBasis+Math.trunc(signedUnitBasis(h1)*scale/1000000000);
  const basin=signedUnitBasis(h2);
  return Object.freeze({planetKey,level,x,y,waterBudgetTg:share,reliefBasis:relief,basinBasis:basin,authority:AUTHORITY,physicalElevationAuthorized:false});
}

export function projectChildren(children,parentWaterBudgetTg){
  if(!Array.isArray(children)||children.length!==4)fail('exactly four children required');
  const target=u64(parentWaterBudgetTg,'parentWaterBudgetTg');
  const sum=children.reduce((a,c)=>a+u64(c.waterBudgetTg,'child waterBudgetTg'),0n);
  return Object.freeze({waterBudgetTg:sum,targetWaterBudgetTg:target,waterConserved:sum===target,meanReliefBasis:Math.round(children.reduce((a,c)=>a+c.reliefBasis,0)/4)});
}

export function climateEBM({latitudesDeg,initialTemperatureK,annualMeanFluxWm2,bondAlbedo,longwaveA,longwaveB,transportWm2K,heatCapacityJm2K,dtSeconds,steps}){
  const arrays=[latitudesDeg,initialTemperatureK,annualMeanFluxWm2];
  if(!arrays.every(Array.isArray)||latitudesDeg.length!==initialTemperatureK.length||latitudesDeg.length!==annualMeanFluxWm2.length||latitudesDeg.length<2)fail('EBM arrays');
  for(const n of [bondAlbedo,longwaveA,longwaveB,transportWm2K,heatCapacityJm2K,dtSeconds,steps])if(typeof n!=='number'||!Number.isFinite(n))fail('EBM numeric input');
  if(bondAlbedo<0||bondAlbedo>1||longwaveB<=0||heatCapacityJm2K<=0||dtSeconds<=0||!Number.isInteger(steps)||steps<1||steps>200000)fail('EBM domain');
  let T=initialTemperatureK.map(Number);let lastNet=new Array(T.length).fill(0);
  const weights=latitudesDeg.map(d=>Math.cos(d*Math.PI/180));const wsum=weights.reduce((a,b)=>a+b,0);
  for(let s=0;s<steps;s++){
    const mean=T.reduce((a,t,i)=>a+t*weights[i],0)/wsum;
    const next=T.map((t,i)=>{
      const absorbed=(1-bondAlbedo)*annualMeanFluxWm2[i];
      const olr=longwaveA+longwaveB*t;
      const transport=transportWm2K*(mean-t);
      const net=absorbed-olr+transport;lastNet[i]=net;
      return t+net*dtSeconds/heatCapacityJm2K;
    });
    T=next;
  }
  const mean=T.reduce((a,t,i)=>a+t*weights[i],0)/wsum;
  const closure=lastNet.reduce((a,n,i)=>a+n*weights[i],0)/wsum;
  return Object.freeze({epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',authority:AUTHORITY,model:'ZERO_D_COUPLED_LATITUDE_EBM_RESEARCH',surfaceTemperatureAuthorized:false,globalMeanTemperatureK:mean,finalTemperatureK:Object.freeze(T),topOfAtmosphereNetWm2:closure});
}

export function p6BoundaryWitness({volatileState,climateState,geochemistryEstablished=false,nutrientFluxEstablished=false}){
  const input={...volatileState};delete input.accountedInventoryTg;validateVolatileLedger(input);
  const insufficient=[];
  if(!climateState||climateState.surfaceTemperatureAuthorized!==true)insufficient.push('canonicalSurfaceTemperature');
  if(volatileState.epistemicStatus!=='KNOWN_SOURCE_STATE')insufficient.push('canonicalVolatileState');
  if(!geochemistryEstablished)insufficient.push('geochemicalEnergyRedox');
  if(!nutrientFluxEstablished)insufficient.push('nutrientFlux');
  return Object.freeze({status:'INSUFFICIENT_ENVIRONMENT',canAuthorizeBiology:false,insufficient:Object.freeze(insufficient),failureSemantics:'ABSTAIN_FAIL_CLOSED'});
}
