export const CONTRACT_ID='ofu-p5-environment-next-research-v1';
export const AUTHORITY='P5_RESEARCH_DRAFT';
export const CANONICAL_BASE_CONTRACT='ofu-p5-p6-environment-v2';
export const SPECIES_STATE_CONTRACT='ofu-p5-volatile-species-state-research-v1';
export const GAS_MIXING_ASSUMPTION='IDEAL_WELL_MIXED_DALTON';
export const U64_MAX=(1n<<64n)-1n;
const KG_PER_TG=1000000000n, MICRO=1000000n, PPM=1000000n;
const PI_NUM=355n, PI_DEN=113n;
const Q=100000000000000n;
const IF97={
 n1:116705214527670000n,n2:-72421316703206000000n,n3:-1707384694009200n,
 n4:1202082470247000000n,n5:-323255503223330000000n,n6:1491510861353000n,
 n7:-482326573615910000n,n8:40511340542057000000n,n9:-23855557567849n,
 n10:65017534844798000n
};
const EVIDENCE=Object.freeze({
 speciesBookkeeping:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',validityDomain:'explicit P5/P4-established species-resolved volatile mass state; no genesis implied'}),
 columnPressure:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'global mean atmospheric column weight on a spherical planet'}),
 idealGasMixing:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'well-mixed ideal-gas atmosphere below compositional separation; explicit assumption required'}),
 waterSaturation:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'IAPWS-IF97 Region 4 pure-water vapor-liquid saturation boundary, 273.16 K through 647.096 K; mixed-gas water vapor uses Dalton ideal-gas partial pressure'}),
 surfaceTemperature:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'no promoted mapping from radiative effective temperature to surface temperature without atmospheric opacity/composition and transport'}),
 xuvEscape:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'research readiness only; no age-only universal XUV history or canonical escape rate'}),
 geology:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'current bulk P5 inputs do not determine tectonic regime or geochemical energy'})
});
function fail(m){throw new Error('P5 next research: '+m)}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function positive(v,n){u64(v,n);if(v===0n)fail(n+' must be positive');return v}
export function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d===0n)fail('zero denominator');const neg=(n<0n)!==(d<0n);if(n<0n)n=-n;if(d<0n)d=-d;let q=n/d,r=n%d;const twice=2n*r;if(twice>d||(twice===d&&(q&1n)===1n))q++;return neg?-q:q}
function gcd(a,b){if(a<0n)a=-a;if(b<0n)b=-b;while(b){const t=a%b;a=b;b=t}return a||1n}
function ratAdd(a,b){let n=a.n*b.d+b.n*a.d,d=a.d*b.d;const g=gcd(n,d);return {n:n/g,d:d/g}}
function qmul(a,b){return roundHalfEvenRatio(a*b,Q)}
function qdiv(a,b){return roundHalfEvenRatio(a*Q,b)}
function isqrt(n){if(n<0n)fail('negative sqrt');if(n<2n)return n;let x=1n<<BigInt((n.toString(2).length+1)>>1);for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y}}
function roundedSqrtInteger(n){const r=isqrt(n),lo=n-r*r,hi=(r+1n)*(r+1n)-n;if(lo<hi)return r;if(lo>hi)return r+1n;return (r&1n)?r+1n:r}
function reservoir(x,prefix){if(!x||typeof x!=='object')fail(prefix+' reservoir required');const atmosphereTg=u64(x.atmosphereTg,prefix+'.atmosphereTg'),condensedSurfaceTg=u64(x.condensedSurfaceTg,prefix+'.condensedSurfaceTg'),subsurfaceInteriorTg=u64(x.subsurfaceInteriorTg,prefix+'.subsurfaceInteriorTg'),lostTg=u64(x.lostTg,prefix+'.lostTg'),totalTg=u64(x.totalTg,prefix+'.totalTg');if(atmosphereTg+condensedSurfaceTg+subsurfaceInteriorTg+lostTg!==totalTg)fail(prefix+' conservation failure');return {atmosphereTg,condensedSurfaceTg,subsurfaceInteriorTg,lostTg,totalTg}}
function zeroReservoir(){return {atmosphereTg:0n,condensedSurfaceTg:0n,subsurfaceInteriorTg:0n,lostTg:0n,totalTg:0n}}
function addReservoir(a,b){const out={};for(const k of Object.keys(a)){out[k]=a[k]+b[k];if(out[k]>U64_MAX)fail('aggregate volatile overflow')}return out}
export function validateVolatileSpeciesState(state){
 if(!state||state.contractId!==SPECIES_STATE_CONTRACT||state.authority!==AUTHORITY)fail('research species-state contract/authority mismatch');
 if(!['COMPLETE','PARTIAL'].includes(state.compositionCompleteness))fail('compositionCompleteness must be COMPLETE or PARTIAL');
 if(typeof state.provenance!=='string'||!state.provenance)fail('provenance required');
 if(!Array.isArray(state.species)||state.species.length>32)fail('species must be bounded array <=32');
 const seen=new Set();let aggregate=zeroReservoir();
 for(const s of state.species){if(!s||typeof s.speciesId!=='string'||!/^[A-Z0-9][A-Z0-9_.+-]{0,31}$/.test(s.speciesId))fail('invalid speciesId');if(seen.has(s.speciesId))fail('duplicate speciesId');seen.add(s.speciesId);positive(s.molarMassNanoKgPerMol,s.speciesId+'.molarMassNanoKgPerMol');aggregate=addReservoir(aggregate,reservoir(s,s.speciesId));}
 const unresolved=reservoir(state.unresolved||zeroReservoir(),'unresolved');
 if(state.compositionCompleteness==='COMPLETE'&&unresolved.totalTg!==0n)fail('COMPLETE composition requires zero unresolved mass');
 aggregate=addReservoir(aggregate,unresolved);return Object.freeze({aggregate:Object.freeze(aggregate),unresolved:Object.freeze(unresolved),evidence:EVIDENCE.speciesBookkeeping});
}
export function globalSurfaceColumnPressurePa(gravityMicroMs2,meanRadiusM,atmosphericMassTg){
 const g=u64(gravityMicroMs2,'gravityMicroMs2'),r=positive(meanRadiusM,'meanRadiusM'),m=u64(atmosphericMassTg,'atmosphericMassTg');if(m===0n)return 0n;
 const p=roundHalfEvenRatio(m*KG_PER_TG*g*PI_DEN,4n*PI_NUM*r*r*MICRO);if(p<0n||p>U64_MAX)fail('pressure overflow');return p;
}
export function atmosphereGasComposition(state,gravityMicroMs2,meanRadiusM,mixingAssumption){
 const validated=validateVolatileSpeciesState(state),totalPressurePa=globalSurfaceColumnPressurePa(gravityMicroMs2,meanRadiusM,validated.aggregate.atmosphereTg);
 if(state.compositionCompleteness!=='COMPLETE')return Object.freeze({epistemicStatus:'UNKNOWN',reason:'UNRESOLVED_ATMOSPHERIC_COMPOSITION',totalPressurePa,evidence:EVIDENCE.idealGasMixing});
 if(mixingAssumption!==GAS_MIXING_ASSUMPTION)return Object.freeze({epistemicStatus:'UNKNOWN',reason:'NO_SUPPORTED_GAS_MIXING_ASSUMPTION',totalPressurePa,evidence:EVIDENCE.idealGasMixing});
 let totalAmount={n:0n,d:1n};const active=[];
 for(const s of state.species){if(s.atmosphereTg===0n)continue;const a={n:s.atmosphereTg,d:s.molarMassNanoKgPerMol};totalAmount=ratAdd(totalAmount,a);active.push({s,a});}
 if(totalAmount.n===0n)return Object.freeze({epistemicStatus:'DERIVED',totalPressurePa,components:Object.freeze([]),evidence:EVIDENCE.idealGasMixing});
 const components=active.map(({s,a})=>{const num=a.n*totalAmount.d,den=a.d*totalAmount.n;return Object.freeze({speciesId:s.speciesId,moleFractionPpm:roundHalfEvenRatio(num*PPM,den),partialPressurePa:roundHalfEvenRatio(totalPressurePa*num,den)});});
 return Object.freeze({epistemicStatus:'DERIVED',totalPressurePa,components:Object.freeze(components),evidence:EVIDENCE.idealGasMixing});
}
export function waterInventory(state){validateVolatileSpeciesState(state);const h=state.species.find(s=>s.speciesId==='H2O');if(!h)return Object.freeze({epistemicStatus:state.compositionCompleteness==='COMPLETE'?'KNOWN_ZERO':'UNKNOWN',reason:state.compositionCompleteness==='COMPLETE'?'COMPLETE_STATE_CONTAINS_NO_H2O':'UNRESOLVED_COMPOSITION_MAY_CONTAIN_H2O',water:null});return Object.freeze({epistemicStatus:state.compositionCompleteness==='COMPLETE'?'KNOWN':'LOWER_BOUND_ONLY',water:Object.freeze(reservoir(h,'H2O')),reason:state.compositionCompleteness==='COMPLETE'?'SPECIES_RESOLVED':'UNRESOLVED_MASS_MAY_INCLUDE_ADDITIONAL_H2O'});}
export function iapwsIf97SaturationPressurePa(surfaceTemperatureMilliK){
 const t=u64(surfaceTemperatureMilliK,'surfaceTemperatureMilliK');if(t<273160n||t>647096n)fail('IAPWS vapor-liquid saturation research domain is 273.160..647.096 K');
 const tq=roundHalfEvenRatio(t*Q,1000n),theta=tq+qdiv(IF97.n9,tq-IF97.n10),theta2=qmul(theta,theta);
 const A=theta2+qmul(IF97.n1,theta)+IF97.n2,B=qmul(IF97.n3,theta2)+qmul(IF97.n4,theta)+IF97.n5,C=qmul(IF97.n6,theta2)+qmul(IF97.n7,theta)+IF97.n8;
 const disc=qmul(B,B)-4n*qmul(A,C);if(disc<=0n)fail('IAPWS discriminant out of domain');const root=roundedSqrtInteger(disc*Q),beta=qdiv(2n*C,-B+root),b2=qmul(beta,beta),b4=qmul(b2,b2);return roundHalfEvenRatio(b4*1000000n,Q);
}
export function waterVaporSaturationAssessment({state,gravityMicroMs2,meanRadiusM,surfaceTemperatureMilliK=null,mixingAssumption=null}){
 const inventory=waterInventory(state);if(inventory.epistemicStatus==='KNOWN_ZERO')return Object.freeze({epistemicStatus:'DERIVED',regime:'NO_RESOLVED_WATER',evidence:EVIDENCE.waterSaturation});if(inventory.epistemicStatus==='UNKNOWN'||inventory.epistemicStatus==='LOWER_BOUND_ONLY')return Object.freeze({epistemicStatus:'UNKNOWN',regime:'WATER_INVENTORY_NOT_COMPLETE',evidence:EVIDENCE.waterSaturation});
 if(surfaceTemperatureMilliK===null)return Object.freeze({epistemicStatus:'UNKNOWN',regime:'SURFACE_TEMPERATURE_NOT_ESTABLISHED',evidence:EVIDENCE.surfaceTemperature});
 const gases=atmosphereGasComposition(state,gravityMicroMs2,meanRadiusM,mixingAssumption);if(gases.epistemicStatus!=='DERIVED')return Object.freeze({epistemicStatus:'UNKNOWN',regime:'WATER_PARTIAL_PRESSURE_NOT_ESTABLISHED',evidence:EVIDENCE.waterSaturation});
 const waterGas=gases.components.find(x=>x.speciesId==='H2O'),t=u64(surfaceTemperatureMilliK,'surfaceTemperatureMilliK');if(!waterGas)return Object.freeze({epistemicStatus:'DERIVED',regime:'NO_ATMOSPHERIC_H2O_IN_COMPLETE_STATE',evidence:EVIDENCE.waterSaturation});
 if(t<273160n)return Object.freeze({epistemicStatus:'UNSUPPORTED',regime:'SOLID_VAPOR_BOUNDARY_NOT_IMPLEMENTED',waterPartialPressurePa:waterGas.partialPressurePa,evidence:EVIDENCE.waterSaturation});
 if(t>647096n)return Object.freeze({epistemicStatus:'DERIVED',regime:'ABOVE_PURE_WATER_CRITICAL_TEMPERATURE_NO_LIQUID_VAPOR_BOUNDARY',waterPartialPressurePa:waterGas.partialPressurePa,evidence:EVIDENCE.waterSaturation});
 const saturationPressurePa=iapwsIf97SaturationPressurePa(t),delta=waterGas.partialPressurePa-saturationPressurePa,abs=delta<0n?-delta:delta;
 const relation=abs<=2n?'BOUNDARY_ROUNDING_SENSITIVE':delta<0n?'SUBSATURATED_VAPOR':'SUPERSATURATED_CONDENSATION_FAVORED';
 return Object.freeze({epistemicStatus:'DERIVED',regime:relation,waterPartialPressurePa:waterGas.partialPressurePa,saturationPressurePa,deltaPa:delta,claimLimit:'SATURATION_TENDENCY_NOT_OCEAN_COVERAGE_OR_SURFACE_PHASE_MAP',evidence:EVIDENCE.waterSaturation});
}
export function surfaceTemperatureAssessment(){return Object.freeze({epistemicStatus:'UNSUPPORTED',reason:'NO_PROMOTED_GREENHOUSE_OPACITY_COMPOSITION_OR_HEAT_REDISTRIBUTION_MODEL',surfaceTemperatureMilliK:null,evidence:EVIDENCE.surfaceTemperature});}
export function xuvEscapeAssessment(upstream={}){const required=['stellarRotationHistory','xuvHistory','upperAtmosphereComposition','absorptionRadiusLaw','heatingEfficiencyLaw','p4AcceptedHistory'];const missing=required.filter(k=>upstream[k]==null);return Object.freeze({epistemicStatus:'UNSUPPORTED',reason:missing.length?'MISSING_ESCAPE_CAUSAL_INPUTS':'ENERGY_LIMITED_DIAGNOSTIC_NOT_PROMOTED_AS_UNIVERSAL_ESCAPE_LAW',missing:Object.freeze(missing),escapeRateTgPerStep:null,evidence:EVIDENCE.xuvEscape});}
export function geochemicalEnergyAssessment(){return Object.freeze({epistemicStatus:'UNSUPPORTED',reason:'BULK_MASS_RADIUS_COMPOSITION_DO_NOT_ESTABLISH_TECTONICS_REDOX_FLUID_ROCK_FLUX_OR_BIOAVAILABLE_NUTRIENTS',energy:null,evidence:EVIDENCE.geology});}
export const evidence=EVIDENCE;
