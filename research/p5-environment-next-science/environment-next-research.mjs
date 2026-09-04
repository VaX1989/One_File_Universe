export const CONTRACT_ID='ofu-p5-environment-next-research-v2';
export const AUTHORITY='P5_RESEARCH_DRAFT';
export const CANONICAL_BASE_CONTRACT='ofu-p5-p6-environment-v2';
export const SPECIES_STATE_CONTRACT='ofu-p5-volatile-species-state-research-v2';
export const SPECIES_REGISTRY_ID='ofu-p5-volatile-species-registry-research-v1';
export const SPECIES_REGISTRY_SOURCE_PROFILE='NIST_SRD69_CIAAW_2024_REFERENCE_MASSES_RETRIEVED_2026-09-04';
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
function freeze(v){return Object.freeze(v)}
const REGISTRY_ROWS=[
 ['Ar','Ar',39948000n,'7440-37-1'],
 ['CH4','CH4',16042500n,'74-82-8'],
 ['CO','CO',28010100n,'630-08-0'],
 ['CO2','CO2',44009500n,'124-38-9'],
 ['H2','H2',2015880n,'1333-74-0'],
 ['H2O','H2O',18015300n,'7732-18-5'],
 ['H2S','H2S',34081000n,'7783-06-4'],
 ['He','He',4002602n,'7440-59-7'],
 ['N2','N2',28013400n,'7727-37-9'],
 ['NH3','NH3',17030500n,'7664-41-7'],
 ['O2','O2',31998800n,'7782-44-7'],
 ['SO2','SO2',64064000n,'7446-09-5']
];
export const SPECIES_REGISTRY=freeze(REGISTRY_ROWS.map(([speciesId,formula,molarMassNanoKgPerMol,casRegistryNumber])=>freeze({
 speciesId,formula,molarMassNanoKgPerMol,casRegistryNumber,
 sourceId:'NIST_CHEMISTRY_WEBBOOK_SRD69',
 sourceProfile:SPECIES_REGISTRY_SOURCE_PROFILE,
 massSemantics:'REFERENCE_MOLECULAR_WEIGHT_FOR_DETERMINISTIC_MIXTURE_BOOKKEEPING_NOT_EXACT_ISOTOPOLOGUE_MASS'
})));
const REGISTRY_BY_ID=new Map(SPECIES_REGISTRY.map(x=>[x.speciesId,x]));
export const STATE_ORIGIN_CLASSES=freeze(['AUTHORITATIVE_EXTERNAL_STATE','MODEL_HYPOTHESIS','RESEARCH_FIXTURE']);
const EVIDENCE=freeze({
 speciesRegistry:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'REFERENCE_DATA',validityDomain:'bounded chemical identity and reference molecular-weight registry; no abundance, genesis or occurrence prior',sources:freeze(['NIST_SRD69','CIAAW_STANDARD_ATOMIC_WEIGHTS_2024'])}),
 speciesBookkeeping:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',validityDomain:'explicit source-bound species-resolved volatile mass state; no genesis implied'}),
 columnPressure:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'global mean atmospheric column weight on a spherical planet'}),
 idealGasMixing:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'well-mixed ideal-gas atmosphere below compositional separation; explicit assumption required'}),
 waterSaturation:freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',validityDomain:'IAPWS-IF97 Region 4 pure-water vapor-liquid saturation boundary, 273.16 K through 647.096 K; mixed-gas water vapor uses Dalton ideal-gas partial pressure'}),
 surfaceTemperature:freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'no promoted mapping from radiative effective temperature to surface temperature without atmospheric opacity/composition and transport'}),
 xuvEscape:freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'research readiness only; no age-only universal XUV history or canonical escape rate'}),
 geology:freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE',validityDomain:'current bulk P5 inputs do not determine tectonic regime or geochemical energy'})
});
function fail(m){throw new Error('P5 next research: '+m)}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function positive(v,n){u64(v,n);if(v===0n)fail(n+' must be positive');return v}
function boundedText(v,n,max=128){if(typeof v!=='string'||v.length===0||v.length>max)fail(n+' must be non-empty bounded text');return v}
function strictKeys(obj,allowed,n){for(const k of Object.keys(obj))if(!allowed.includes(k))fail(n+' contains unsupported field '+k)}
export function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d===0n)fail('zero denominator');const neg=(n<0n)!==(d<0n);if(n<0n)n=-n;if(d<0n)d=-d;let q=n/d,r=n%d;const twice=2n*r;if(twice>d||(twice===d&&(q&1n)===1n))q++;return neg?-q:q}
function gcd(a,b){if(a<0n)a=-a;if(b<0n)b=-b;while(b){const t=a%b;a=b;b=t}return a||1n}
function ratAdd(a,b){let n=a.n*b.d+b.n*a.d,d=a.d*b.d;const g=gcd(n,d);return {n:n/g,d:d/g}}
function qmul(a,b){return roundHalfEvenRatio(a*b,Q)}
function qdiv(a,b){return roundHalfEvenRatio(a*Q,b)}
function isqrt(n){if(n<0n)fail('negative sqrt');if(n<2n)return n;let x=1n<<BigInt((n.toString(2).length+1)>>1);for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y}}
function roundedSqrtInteger(n){const r=isqrt(n),lo=n-r*r,hi=(r+1n)*(r+1n)-n;if(lo<hi)return r;if(lo>hi)return r+1n;return (r&1n)?r+1n:r}
function reservoir(x,prefix,extraAllowed=[]){
 if(!x||typeof x!=='object'||Array.isArray(x))fail(prefix+' reservoir required');
 strictKeys(x,['atmosphereTg','condensedSurfaceTg','subsurfaceInteriorTg','lostTg','totalTg',...extraAllowed],prefix);
 const atmosphereTg=u64(x.atmosphereTg,prefix+'.atmosphereTg'),condensedSurfaceTg=u64(x.condensedSurfaceTg,prefix+'.condensedSurfaceTg'),subsurfaceInteriorTg=u64(x.subsurfaceInteriorTg,prefix+'.subsurfaceInteriorTg'),lostTg=u64(x.lostTg,prefix+'.lostTg'),totalTg=u64(x.totalTg,prefix+'.totalTg');
 if(atmosphereTg+condensedSurfaceTg+subsurfaceInteriorTg+lostTg!==totalTg)fail(prefix+' conservation failure');
 return {atmosphereTg,condensedSurfaceTg,subsurfaceInteriorTg,lostTg,totalTg};
}
function zeroReservoir(){return {atmosphereTg:0n,condensedSurfaceTg:0n,subsurfaceInteriorTg:0n,lostTg:0n,totalTg:0n}}
function addReservoir(a,b){const out={};for(const k of Object.keys(a)){out[k]=a[k]+b[k];if(out[k]>U64_MAX)fail('aggregate volatile overflow')}return out}
export function speciesDefinition(speciesId){boundedText(speciesId,'speciesId',32);const d=REGISTRY_BY_ID.get(speciesId);if(!d)fail('speciesId not in bounded research registry: '+speciesId);return d}
function validateOrigin(origin,epistemicStatus){
 if(!origin||typeof origin!=='object'||Array.isArray(origin))fail('origin required');
 strictKeys(origin,['class','sourceId','sourceRevision'], 'origin');
 if(!STATE_ORIGIN_CLASSES.includes(origin.class))fail('unsupported origin.class');
 boundedText(origin.sourceId,'origin.sourceId');boundedText(origin.sourceRevision,'origin.sourceRevision');
 if(epistemicStatus==='KNOWN'&&origin.class!=='AUTHORITATIVE_EXTERNAL_STATE')fail('KNOWN state requires AUTHORITATIVE_EXTERNAL_STATE origin');
 if(epistemicStatus==='HYPOTHETICAL_MODEL_VALUE'&&!['MODEL_HYPOTHESIS','RESEARCH_FIXTURE'].includes(origin.class))fail('hypothetical state requires MODEL_HYPOTHESIS or RESEARCH_FIXTURE origin');
 return origin;
}
function derivedStatus(state){return state.epistemicStatus==='KNOWN'?'DERIVED':'HYPOTHETICAL_MODEL_VALUE'}
function combineDerivedStatus(...statuses){return statuses.includes('HYPOTHETICAL_MODEL_VALUE')?'HYPOTHETICAL_MODEL_VALUE':'DERIVED'}
export function validateVolatileSpeciesState(state){
 if(!state||typeof state!=='object'||Array.isArray(state)||state.contractId!==SPECIES_STATE_CONTRACT||state.authority!==AUTHORITY)fail('research species-state contract/authority mismatch');
 strictKeys(state,['contractId','authority','epistemicStatus','origin','provenance','compositionCompleteness','species','unresolved'],'state');
 if(!['KNOWN','HYPOTHETICAL_MODEL_VALUE'].includes(state.epistemicStatus))fail('species state epistemicStatus must be KNOWN or HYPOTHETICAL_MODEL_VALUE');
 validateOrigin(state.origin,state.epistemicStatus);boundedText(state.provenance,'provenance',256);
 if(!['COMPLETE','PARTIAL'].includes(state.compositionCompleteness))fail('compositionCompleteness must be COMPLETE or PARTIAL');
 if(!Array.isArray(state.species)||state.species.length>SPECIES_REGISTRY.length)fail('species must be bounded array within registry size');
 let aggregate=zeroReservoir(),previous=null;
 for(const s of state.species){
  if(!s||typeof s!=='object'||Array.isArray(s))fail('species entry required');
  strictKeys(s,['speciesId','atmosphereTg','condensedSurfaceTg','subsurfaceInteriorTg','lostTg','totalTg'],'species');
  const definition=speciesDefinition(s.speciesId);
  if(previous!==null&&previous>=s.speciesId)fail('species must be strictly sorted by speciesId with no duplicates');
  previous=s.speciesId;
  aggregate=addReservoir(aggregate,reservoir(s,s.speciesId,['speciesId']));
  if(definition.molarMassNanoKgPerMol<=0n)fail('registry molar mass invalid');
 }
 const unresolved=reservoir(state.unresolved||zeroReservoir(),'unresolved');
 if(state.compositionCompleteness==='COMPLETE'&&unresolved.totalTg!==0n)fail('COMPLETE composition requires zero unresolved mass');
 if(state.compositionCompleteness==='PARTIAL'&&unresolved.totalTg===0n)fail('PARTIAL composition requires explicit non-zero unresolved mass');
 aggregate=addReservoir(aggregate,unresolved);
 return freeze({aggregate:freeze(aggregate),unresolved:freeze(unresolved),epistemicStatus:state.epistemicStatus,origin:freeze({...state.origin}),registryId:SPECIES_REGISTRY_ID,evidence:EVIDENCE.speciesBookkeeping});
}
export function globalSurfaceColumnPressurePa(gravityMicroMs2,meanRadiusM,atmosphericMassTg){
 const g=u64(gravityMicroMs2,'gravityMicroMs2'),r=positive(meanRadiusM,'meanRadiusM'),m=u64(atmosphericMassTg,'atmosphericMassTg');if(m===0n)return 0n;
 const p=roundHalfEvenRatio(m*KG_PER_TG*g*PI_DEN,4n*PI_NUM*r*r*MICRO);if(p<0n||p>U64_MAX)fail('pressure overflow');return p;
}
export function atmosphereGasComposition(state,gravityMicroMs2,meanRadiusM,mixingAssumption){
 const validated=validateVolatileSpeciesState(state),totalPressurePa=globalSurfaceColumnPressurePa(gravityMicroMs2,meanRadiusM,validated.aggregate.atmosphereTg);
 if(state.compositionCompleteness!=='COMPLETE')return freeze({epistemicStatus:'UNKNOWN',reason:'UNRESOLVED_ATMOSPHERIC_COMPOSITION',totalPressurePa,registryId:SPECIES_REGISTRY_ID,evidence:EVIDENCE.idealGasMixing});
 if(mixingAssumption!==GAS_MIXING_ASSUMPTION)return freeze({epistemicStatus:'UNKNOWN',reason:'NO_SUPPORTED_GAS_MIXING_ASSUMPTION',totalPressurePa,registryId:SPECIES_REGISTRY_ID,evidence:EVIDENCE.idealGasMixing});
 let totalAmount={n:0n,d:1n};const active=[];
 for(const s of state.species){if(s.atmosphereTg===0n)continue;const d=speciesDefinition(s.speciesId),a={n:s.atmosphereTg,d:d.molarMassNanoKgPerMol};totalAmount=ratAdd(totalAmount,a);active.push({s,d,a});}
 const epistemicStatus=derivedStatus(state);
 if(totalAmount.n===0n)return freeze({epistemicStatus,totalPressurePa,components:freeze([]),registryId:SPECIES_REGISTRY_ID,evidence:EVIDENCE.idealGasMixing});
 const components=active.map(({s,d,a})=>{const num=a.n*totalAmount.d,den=a.d*totalAmount.n;return freeze({speciesId:s.speciesId,molarMassNanoKgPerMol:d.molarMassNanoKgPerMol,moleFractionPpm:roundHalfEvenRatio(num*PPM,den),partialPressurePa:roundHalfEvenRatio(totalPressurePa*num,den)});});
 return freeze({epistemicStatus,totalPressurePa,components:freeze(components),registryId:SPECIES_REGISTRY_ID,evidence:EVIDENCE.idealGasMixing});
}
export function waterInventory(state){
 validateVolatileSpeciesState(state);const h=state.species.find(s=>s.speciesId==='H2O');
 if(!h){
  if(state.compositionCompleteness==='PARTIAL')return freeze({epistemicStatus:'UNKNOWN',reason:'UNRESOLVED_COMPOSITION_MAY_CONTAIN_H2O',water:null});
  return freeze({epistemicStatus:derivedStatus(state),reason:'COMPLETE_SUPPLIED_STATE_CONTAINS_NO_H2O',water:freeze(zeroReservoir())});
 }
 return freeze({epistemicStatus:state.epistemicStatus,quantitySemantics:state.compositionCompleteness==='COMPLETE'?'EXACT_WITHIN_SUPPLIED_STATE':'LOWER_BOUND_ONLY',water:freeze(reservoir(h,'H2O',['speciesId'])),reason:state.compositionCompleteness==='COMPLETE'?'SPECIES_RESOLVED':'UNRESOLVED_MASS_MAY_INCLUDE_ADDITIONAL_H2O'});
}
export function iapwsIf97SaturationPressurePa(surfaceTemperatureMilliK){
 const t=u64(surfaceTemperatureMilliK,'surfaceTemperatureMilliK');if(t<273160n||t>647096n)fail('IAPWS vapor-liquid saturation research domain is 273.160..647.096 K');
 const tq=roundHalfEvenRatio(t*Q,1000n),theta=tq+qdiv(IF97.n9,tq-IF97.n10),theta2=qmul(theta,theta);
 const A=theta2+qmul(IF97.n1,theta)+IF97.n2,B=qmul(IF97.n3,theta2)+qmul(IF97.n4,theta)+IF97.n5,C=qmul(IF97.n6,theta2)+qmul(IF97.n7,theta)+IF97.n8;
 const disc=qmul(B,B)-4n*qmul(A,C);if(disc<=0n)fail('IAPWS discriminant out of domain');const root=roundedSqrtInteger(disc*Q),beta=qdiv(2n*C,-B+root),b2=qmul(beta,beta),b4=qmul(b2,b2);return roundHalfEvenRatio(b4*1000000n,Q);
}
function validateSurfaceTemperatureState(x){
 if(!x||typeof x!=='object'||Array.isArray(x))fail('surfaceTemperatureState required');
 strictKeys(x,['milliK','epistemicStatus','authority','provenance'],'surfaceTemperatureState');
 const milliK=u64(x.milliK,'surfaceTemperatureState.milliK');
 if(!['KNOWN','HYPOTHETICAL_MODEL_VALUE'].includes(x.epistemicStatus))fail('surfaceTemperatureState epistemicStatus unsupported');
 boundedText(x.authority,'surfaceTemperatureState.authority');boundedText(x.provenance,'surfaceTemperatureState.provenance',256);
 return {milliK,epistemicStatus:x.epistemicStatus,authority:x.authority,provenance:x.provenance};
}
export function waterVaporSaturationAssessment(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('water saturation input map required');
 strictKeys(input,['state','gravityMicroMs2','meanRadiusM','surfaceTemperatureState','mixingAssumption'],'waterSaturationInput');
 const {state,gravityMicroMs2,meanRadiusM,surfaceTemperatureState=null,mixingAssumption=null}=input;
 const inventory=waterInventory(state);
 if(state.compositionCompleteness==='PARTIAL')return freeze({epistemicStatus:'UNKNOWN',regime:'WATER_INVENTORY_NOT_COMPLETE',evidence:EVIDENCE.waterSaturation});
 const resolvedWater=state.species.find(s=>s.speciesId==='H2O');
 if(!resolvedWater)return freeze({epistemicStatus:derivedStatus(state),regime:'NO_RESOLVED_WATER',evidence:EVIDENCE.waterSaturation});
 if(surfaceTemperatureState===null)return freeze({epistemicStatus:'UNKNOWN',regime:'SURFACE_TEMPERATURE_NOT_ESTABLISHED',evidence:EVIDENCE.surfaceTemperature});
 const temp=validateSurfaceTemperatureState(surfaceTemperatureState);
 const gases=atmosphereGasComposition(state,gravityMicroMs2,meanRadiusM,mixingAssumption);
 if(gases.epistemicStatus==='UNKNOWN')return freeze({epistemicStatus:'UNKNOWN',regime:'WATER_PARTIAL_PRESSURE_NOT_ESTABLISHED',evidence:EVIDENCE.waterSaturation});
 const waterGas=gases.components.find(x=>x.speciesId==='H2O'),t=temp.milliK;
 const epistemicStatus=combineDerivedStatus(state.epistemicStatus,temp.epistemicStatus);
 if(!waterGas)return freeze({epistemicStatus,regime:'NO_ATMOSPHERIC_H2O_IN_COMPLETE_STATE',evidence:EVIDENCE.waterSaturation});
 if(t<273160n)return freeze({epistemicStatus:'UNSUPPORTED',regime:'SOLID_VAPOR_BOUNDARY_NOT_IMPLEMENTED',waterPartialPressurePa:waterGas.partialPressurePa,evidence:EVIDENCE.waterSaturation});
 if(t>647096n)return freeze({epistemicStatus,regime:'ABOVE_PURE_WATER_CRITICAL_TEMPERATURE_NO_LIQUID_VAPOR_BOUNDARY',waterPartialPressurePa:waterGas.partialPressurePa,evidence:EVIDENCE.waterSaturation});
 const saturationPressurePa=iapwsIf97SaturationPressurePa(t),delta=waterGas.partialPressurePa-saturationPressurePa,abs=delta<0n?-delta:delta;
 const relation=abs<=2n?'BOUNDARY_ROUNDING_SENSITIVE':delta<0n?'SUBSATURATED_VAPOR':'SUPERSATURATED_CONDENSATION_FAVORED';
 return freeze({epistemicStatus,regime:relation,waterPartialPressurePa:waterGas.partialPressurePa,saturationPressurePa,deltaPa:delta,claimLimit:'SATURATION_TENDENCY_NOT_OCEAN_COVERAGE_OR_SURFACE_PHASE_MAP',evidence:EVIDENCE.waterSaturation});
}
export function surfaceTemperatureAssessment(){return freeze({epistemicStatus:'UNSUPPORTED',reason:'NO_PROMOTED_GREENHOUSE_OPACITY_COMPOSITION_OR_HEAT_REDISTRIBUTION_MODEL',surfaceTemperatureMilliK:null,evidence:EVIDENCE.surfaceTemperature})}
export function xuvEscapeAssessment(upstream={}){const required=['stellarRotationHistory','xuvHistory','upperAtmosphereComposition','absorptionRadiusLaw','heatingEfficiencyLaw','p4AcceptedHistory'];const missing=required.filter(k=>upstream[k]==null);return freeze({epistemicStatus:'UNSUPPORTED',reason:missing.length?'MISSING_ESCAPE_CAUSAL_INPUTS':'ENERGY_LIMITED_DIAGNOSTIC_NOT_PROMOTED_AS_UNIVERSAL_ESCAPE_LAW',missing:freeze(missing),escapeRateTgPerStep:null,evidence:EVIDENCE.xuvEscape})}
export function geochemicalEnergyAssessment(){return freeze({epistemicStatus:'UNSUPPORTED',reason:'BULK_MASS_RADIUS_COMPOSITION_DO_NOT_ESTABLISH_TECTONICS_REDOX_FLUID_ROCK_FLUX_OR_BIOAVAILABLE_NUTRIENTS',energy:null,evidence:EVIDENCE.geology})}
export const evidence=EVIDENCE;
