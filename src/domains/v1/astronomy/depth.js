(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,A=O.v1Astronomy;
if(!V||!A)throw new Error('v1 common and astronomy required for astronomy depth');
const VERSION='ofu-v11-astronomy-depth-1';
const SOURCE='research/v1x-15-astronomy-depth-2026-09-06';
const AUTH=V.authority('v1.astronomy.depth','1.0.0',[SOURCE],
  'Bounded deterministic stellar-population and stellar-evolution context layered over existing v1 modeled astronomy. Outputs are qualitative model priors and do not alter P3 canonical entities or claim survey calibration.',[
    'Population-mixture weights are uncalibrated qualitative priors, not fitted morphology or star-formation likelihoods.',
    'Simple main-sequence lifetime scaling is emitted only inside a deliberately narrow 0.5-3 solar-mass domain and is not an isochrone solver.',
    'Multiplicity depth only classifies already modeled companion periods/eccentricities and does not dynamically validate orbital stability.'
  ]);
const LIMIT=1000000,clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function normalize(labels,raw){
  const sum=raw.reduce((a,x)=>a+Math.max(0,x),0)||1;let used=0;
  const rows=raw.map((x,i)=>{const scaled=Math.max(0,x)*LIMIT,share=Math.floor(scaled/sum),rem=scaled-share*sum;used+=share;return{label:labels[i],sharePpm:share,rem,i};});
  const rank=[...rows].sort((a,b)=>b.rem-a.rem||a.i-b.i);for(let i=0;i<LIMIT-used;i++)rank[i%rank.length].sharePpm++;
  return Object.freeze(rows.sort((a,b)=>a.i-b.i).map(({label,sharePpm})=>Object.freeze({population:label,sharePpm})));
}
function stellarPopulationMix(galaxy){
  V.assert(galaxy&&typeof galaxy==='object','galaxy profile');
  const age=V.clamp(Math.round(galaxy.meanAgeMyr||0),0,13700),agePpm=clamp(age*LIMIT/13700),morph=String(galaxy.morphology||'UNKNOWN');
  const young=Math.max(1,LIMIT-agePpm+(morph==='IRREGULAR'?180000:morph==='DISK'?80000:0));
  const old=Math.max(1,agePpm+(morph==='SPHEROID'?220000:morph==='DISK'?50000:0));
  const mid=Math.max(1,600000-Math.abs(agePpm-500000));
  const weights=normalize(['YOUNG','INTERMEDIATE','OLD'],[young,mid,old]),dominant=weights.reduce((a,b)=>b.sharePpm>a.sharePpm?b:a,weights[0]);
  return V.freezeDeep({weights,dominantPopulation:dominant.population,authority:AUTH,calibrated:false,probability:false,observationalSelectionFunction:false});
}
function stellarEvolution(primary){
  V.assert(primary&&typeof primary==='object','stellar primary');
  const mass=Number(primary.massMilliSolar),age=Number(primary.ageMyr);
  if(!Number.isFinite(mass)||!Number.isFinite(age)||mass<500||mass>3000)return V.freezeDeep({supported:false,reason:'OUTSIDE_SIMPLE_LIFETIME_DOMAIN',validMassMilliSolar:[500,3000],authority:AUTH,canonicalStellarClaim:false});
  const m=mass/1000,lifetimeMyr=Math.max(250,Math.min(60000,Math.round(10000*Math.pow(m,-2.5)))),rawProgress=age/Math.max(1,lifetimeMyr),lifetimeFractionPpm=clamp(rawProgress*LIMIT);
  const phase=rawProgress>=1?'POST_SIMPLE_LIFETIME_PROXY':lifetimeFractionPpm<500000?'EARLY_MAIN_SEQUENCE_PROXY':'LATE_MAIN_SEQUENCE_PROXY';
  return V.freezeDeep({supported:true,lifetimeMyrProxy:lifetimeMyr,lifetimeFractionPpm,phase,model:'SIMPLE_MASS_POWER_LIFETIME_PROXY',fidelity:'LOW',isochroneSolved:false,rotationModeled:false,binaryEvolutionModeled:false,authority:AUTH,canonicalStellarClaim:false});
}
function multiplicityDepth(multiple){
  const companions=(multiple?.companions||[]).slice(0,3).map((c,i)=>{const p=Number(c.periodLogDaysMilli||0),regime=p<1300?'CLOSE':p<5000?'INTERMEDIATE':'WIDE';return Object.freeze({stellarObjectIdentity:c.stellarObjectIdentity||null,componentIndex:i+1,periodRegime:regime,massRatioPpm:clamp(c.massRatioPpm),eccentricityPpm:clamp(c.eccentricityPpm),hierarchyScreen:'NOT_DYNAMICALLY_VALIDATED',authority:AUTH});});
  return V.freezeDeep({componentCount:Number(multiple?.componentCount||1),companions:Object.freeze(companions),dynamicalStabilitySolved:false,binaryEvolutionSolved:false,authority:AUTH});
}
function enrichGalaxy(g){return V.freezeDeep({...g,stellarPopulationMix:stellarPopulationMix(g)});}
const previousGalaxyProfile=A.galaxyProfile,previousSystemBirthContext=A.systemBirthContext,previousDiscoverGalaxies=A.discoverGalaxies;
function galaxyProfile(input){return enrichGalaxy(previousGalaxyProfile(input));}
function systemBirthContext(input){const base=previousSystemBirthContext(input);return V.freezeDeep({...base,galaxy:enrichGalaxy(base.galaxy),stellarEvolution:stellarEvolution(base.primary),multiplicityDepth:multiplicityDepth(base.multiplicity),astronomyDepth:Object.freeze({version:VERSION,authority:AUTH,researchLineage:SOURCE,canonicalPromotion:false})});}
function discoverGalaxies(input){const base=previousDiscoverGalaxies(input);return V.freezeDeep({...base,galaxies:Object.freeze(base.galaxies.map(enrichGalaxy)),astronomyDepth:Object.freeze({version:VERSION,authority:AUTH,globalEnumeration:false})});}
O.v1Astronomy=Object.freeze({...A,galaxyProfile,systemBirthContext,discoverGalaxies});
O.v1AstronomyDepth=Object.freeze({VERSION,AUTHORITY:AUTH,LIMIT,stellarPopulationMix,stellarEvolution,multiplicityDepth});
})(globalThis);
