import {
  AUTHORITY as BASE_AUTHORITY,
  SPECIES_STATE_CONTRACT,
  SPECIES_REGISTRY,
  GAS_MIXING_ASSUMPTION,
  U64_MAX,
  validateVolatileSpeciesState,
  speciesDefinition,
  atmosphereGasComposition,
  waterVaporSaturationAssessment
} from './environment-next-research.mjs';

export const CONTRACT_ID='ofu-p5-environment-next-frontier-research-v3';
export const AUTHORITY='P5_RESEARCH_DRAFT';
export const BASE_CONTRACT='ofu-p5-environment-next-research-v2';
export const VOLATILE_TRANSFER_CONTRACT='ofu-p5-volatile-transfer-research-v1';
export const P6_READINESS_CONTRACT='ofu-p5-p6-environment-readiness-research-v1';
export const MAX_TRANSFER_STEPS_PER_QUERY=4096;
export const RESERVOIRS=Object.freeze(['atmosphereTg','condensedSurfaceTg','subsurfaceInteriorTg','lostTg']);
export const RETAINED_RESERVOIRS=Object.freeze(['atmosphereTg','condensedSurfaceTg','subsurfaceInteriorTg']);
export const PROCESS_CLASSES=Object.freeze(['INTERNAL_REPARTITION_WITNESS','LOSS_TO_LOST_RESERVOIR_WITNESS']);
export const EVIDENCE_CLASSES=Object.freeze(['ESTABLISHED','EMPIRICALLY_CONSTRAINED','HYPOTHETICAL','SPECULATIVE','FICTIONAL']);
export const FIDELITIES=Object.freeze(['FORMAL','HIGH_FIDELITY','APPROXIMATE','STYLIZED','METAPHORICAL']);

const EVIDENCE=Object.freeze({
  transferKernel:Object.freeze({
    authority:AUTHORITY,
    evidenceClass:'ESTABLISHED',
    fidelity:'FORMAL',
    provenance:'mass-conserving bounded state-transition algebra',
    dependencies:Object.freeze([SPECIES_STATE_CONTRACT]),
    failureSemantics:'REJECT_INVALID_OR_NON_CONSERVING_TRANSFER',
    claimLimit:'transition witnesses are externally supplied facts/hypotheses; this kernel supplies no rates, causes, genesis or occurrence prior'
  }),
  mixtureSummary:Object.freeze({
    authority:AUTHORITY,
    evidenceClass:'ESTABLISHED',
    fidelity:'FORMAL',
    provenance:'species-resolved supplied state plus bounded reference molecular-weight registry',
    dependencies:Object.freeze([SPECIES_STATE_CONTRACT,'ofu-p5-volatile-species-registry-research-v1']),
    failureSemantics:'UNKNOWN_WHEN_COMPOSITION_OR_MIXING_ASSUMPTION_IS_UNRESOLVED',
    claimLimit:'global ideal-well-mixed bookkeeping only; not a non-ideal equation of state or vertical atmospheric profile'
  }),
  p6Readiness:Object.freeze({
    authority:AUTHORITY,
    evidenceClass:'ESTABLISHED',
    fidelity:'FORMAL',
    provenance:'explicit dependency/abstention contract',
    dependencies:Object.freeze([BASE_CONTRACT,'ofu-p4-temporal-v1']),
    failureSemantics:'INSUFFICIENT_ENVIRONMENT_OR_UNSUPPORTED_FIELD_REMAINS_EXPLICIT',
    claimLimit:'readiness witness cannot authorize abiogenesis or a canonical biosphere'
  })
});

function freeze(v){return Object.freeze(v)}
function fail(m){throw new Error('P5 environment-next frontier v3: '+m)}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function text(v,n,max=256){if(typeof v!=='string'||v.length===0||v.length>max)fail(n+' must be non-empty bounded text');return v}
function exact(o,keys,n){if(!o||typeof o!=='object'||Array.isArray(o))fail(n+' must be map');const a=Object.keys(o).sort(),b=[...keys].sort();if(a.length!==b.length||a.some((x,i)=>x!==b[i]))fail(n+' fields invalid');return o}
function origin(o,status){exact(o,['class','sourceId','sourceRevision'],'origin');if(!['AUTHORITATIVE_EXTERNAL_STATE','MODEL_HYPOTHESIS','RESEARCH_FIXTURE'].includes(o.class))fail('origin.class unsupported');text(o.sourceId,'origin.sourceId',128);text(o.sourceRevision,'origin.sourceRevision',128);if(status==='KNOWN'&&o.class!=='AUTHORITATIVE_EXTERNAL_STATE')fail('KNOWN transition requires AUTHORITATIVE_EXTERNAL_STATE origin');if(status==='HYPOTHETICAL_MODEL_VALUE'&&!['MODEL_HYPOTHESIS','RESEARCH_FIXTURE'].includes(o.class))fail('hypothetical transition requires model/fixture origin');return o}
function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d===0n)fail('zero denominator');const neg=(n<0n)!==(d<0n);if(n<0n)n=-n;if(d<0n)d=-d;let q=n/d,r=n%d;const t=2n*r;if(t>d||(t===d&&(q&1n)===1n))q++;return neg?-q:q}
function gcd(a,b){if(a<0n)a=-a;if(b<0n)b=-b;while(b){const t=a%b;a=b;b=t}return a||1n}
function ratAdd(a,b){let n=a.n*b.d+b.n*a.d,d=a.d*b.d;const g=gcd(n,d);return {n:n/g,d:d/g}}
function stateStatus(a,b){return a==='HYPOTHETICAL_MODEL_VALUE'||b==='HYPOTHETICAL_MODEL_VALUE'?'HYPOTHETICAL_MODEL_VALUE':'KNOWN'}
function cloneReservoirEntry(s){return {speciesId:s.speciesId,atmosphereTg:s.atmosphereTg,condensedSurfaceTg:s.condensedSurfaceTg,subsurfaceInteriorTg:s.subsurfaceInteriorTg,lostTg:s.lostTg,totalTg:s.totalTg}}
function cloneUnresolved(u){return {atmosphereTg:u.atmosphereTg,condensedSurfaceTg:u.condensedSurfaceTg,subsurfaceInteriorTg:u.subsurfaceInteriorTg,lostTg:u.lostTg,totalTg:u.totalTg}}

export function validateVolatileTransfer(t){
  exact(t,['contractId','authority','epistemicStatus','origin','provenance','speciesId','fromReservoir','toReservoir','massTg','processClass','dependencies'],'volatile transfer');
  if(t.contractId!==VOLATILE_TRANSFER_CONTRACT||t.authority!==AUTHORITY)fail('transfer contract/authority mismatch');
  if(!['KNOWN','HYPOTHETICAL_MODEL_VALUE'].includes(t.epistemicStatus))fail('transfer epistemicStatus unsupported');
  origin(t.origin,t.epistemicStatus);text(t.provenance,'transfer.provenance');speciesDefinition(t.speciesId);
  if(!RESERVOIRS.includes(t.fromReservoir)||!RESERVOIRS.includes(t.toReservoir)||t.fromReservoir===t.toReservoir)fail('transfer reservoirs invalid');
  if(t.fromReservoir==='lostTg')fail('lost reservoir is terminal in this contract; reaccretion requires a separately versioned external-input model');
  const mass=u64(t.massTg,'transfer.massTg');if(mass===0n)fail('zero-mass transfer is not a state transition');
  if(!PROCESS_CLASSES.includes(t.processClass))fail('processClass unsupported');
  if(t.processClass==='INTERNAL_REPARTITION_WITNESS'&&(!RETAINED_RESERVOIRS.includes(t.fromReservoir)||!RETAINED_RESERVOIRS.includes(t.toReservoir)))fail('internal repartition must stay within retained reservoirs');
  if(t.processClass==='LOSS_TO_LOST_RESERVOIR_WITNESS'&&t.toReservoir!=='lostTg')fail('loss witness must terminate in lostTg');
  if(!Array.isArray(t.dependencies)||t.dependencies.length===0||t.dependencies.length>16)fail('dependencies must be bounded non-empty array');
  for(const d of t.dependencies)text(d,'transfer dependency',128);
  return t;
}

export function applyVolatileTransfer(state,transfer){
  if(BASE_AUTHORITY!==AUTHORITY)fail('base research authority mismatch');
  validateVolatileSpeciesState(state);validateVolatileTransfer(transfer);
  const species=state.species.map(cloneReservoirEntry),idx=species.findIndex(s=>s.speciesId===transfer.speciesId);
  if(idx<0)fail('transfer species is absent from supplied state; this contract cannot create volatile mass or species');
  const row=species[idx],mass=transfer.massTg;
  if(row[transfer.fromReservoir]<mass)fail('transfer exceeds source reservoir');
  row[transfer.fromReservoir]-=mass;row[transfer.toReservoir]+=mass;
  if(row[transfer.toReservoir]>U64_MAX)fail('transfer destination overflow');
  const epistemicStatus=stateStatus(state.epistemicStatus,transfer.epistemicStatus);
  const out={
    contractId:SPECIES_STATE_CONTRACT,
    authority:AUTHORITY,
    epistemicStatus,
    origin:{...transfer.origin},
    provenance:'TRANSFER:'+transfer.origin.sourceId+'@'+transfer.origin.sourceRevision,
    compositionCompleteness:state.compositionCompleteness,
    species,
    unresolved:cloneUnresolved(state.unresolved)
  };
  validateVolatileSpeciesState(out);
  return freeze({
    state:freeze({...out,species:freeze(species.map(freeze)),unresolved:freeze(out.unresolved),origin:freeze(out.origin)}),
    transition:freeze({speciesId:transfer.speciesId,fromReservoir:transfer.fromReservoir,toReservoir:transfer.toReservoir,massTg:mass,processClass:transfer.processClass,epistemicStatus:transfer.epistemicStatus,dependencies:freeze([...transfer.dependencies])}),
    evidence:EVIDENCE.transferKernel,
    boundedness:freeze({retainedHistoryEntries:0,maxStateSpecies:SPECIES_REGISTRY.length,perQueryTransitionCost:'O(1)'})
  });
}

export function applyVolatileTransferSequence(state,transfers){
  validateVolatileSpeciesState(state);
  if(!Array.isArray(transfers)||transfers.length>MAX_TRANSFER_STEPS_PER_QUERY)fail('transfer sequence exceeds bounded per-query limit');
  let current=state,known=0n,hypothetical=0n;
  for(const t of transfers){const result=applyVolatileTransfer(current,t);current=result.state;if(t.epistemicStatus==='KNOWN')known++;else hypothetical++;}
  return freeze({state:current,appliedStepCount:BigInt(transfers.length),knownStepCount:known,hypotheticalStepCount:hypothetical,retainedHistoryEntries:0,maxStepCount:MAX_TRANSFER_STEPS_PER_QUERY,evidence:EVIDENCE.transferKernel});
}

export function atmosphericMixtureSummary(state,gravityMicroMs2,meanRadiusM,mixingAssumption=GAS_MIXING_ASSUMPTION){
  const validated=validateVolatileSpeciesState(state),gas=atmosphereGasComposition(state,gravityMicroMs2,meanRadiusM,mixingAssumption);
  if(gas.epistemicStatus==='UNKNOWN')return freeze({epistemicStatus:'UNKNOWN',reason:gas.reason,totalPressurePa:gas.totalPressurePa,meanMolarMassNanoKgPerMol:null,componentCount:null,evidence:EVIDENCE.mixtureSummary});
  let totalAmount={n:0n,d:1n},totalMass=0n,componentCount=0n;
  for(const s of state.species){if(s.atmosphereTg===0n)continue;const m=speciesDefinition(s.speciesId).molarMassNanoKgPerMol;totalAmount=ratAdd(totalAmount,{n:s.atmosphereTg,d:m});totalMass+=s.atmosphereTg;componentCount++;}
  if(totalMass===0n)return freeze({epistemicStatus:state.epistemicStatus==='KNOWN'?'DERIVED':'HYPOTHETICAL_MODEL_VALUE',reason:'NO_ATMOSPHERIC_MASS',totalPressurePa:0n,meanMolarMassNanoKgPerMol:null,componentCount:0n,evidence:EVIDENCE.mixtureSummary});
  const mean=roundHalfEvenRatio(totalMass*totalAmount.d,totalAmount.n);
  return freeze({epistemicStatus:state.epistemicStatus==='KNOWN'?'DERIVED':'HYPOTHETICAL_MODEL_VALUE',reason:'SPECIES_RESOLVED_IDEAL_MIXTURE',totalPressurePa:gas.totalPressurePa,meanMolarMassNanoKgPerMol:mean,componentCount,evidence:EVIDENCE.mixtureSummary,dependencies:freeze([validated.registryId,mixingAssumption])});
}

function surfaceTempState(x){if(x===null)return null;exact(x,['milliK','epistemicStatus','authority','provenance','evidenceClass','fidelity'],'surface temperature state');u64(x.milliK,'surface temperature milliK');if(!['KNOWN','HYPOTHETICAL_MODEL_VALUE'].includes(x.epistemicStatus))fail('surface temperature epistemicStatus unsupported');text(x.authority,'surface temperature authority',128);text(x.provenance,'surface temperature provenance');if(!EVIDENCE_CLASSES.includes(x.evidenceClass)||!FIDELITIES.includes(x.fidelity))fail('surface temperature evidence metadata unsupported');return x}

export function p6EnvironmentReadinessWitness({state,gravityMicroMs2,meanRadiusM,surfaceTemperatureState=null,mixingAssumption=GAS_MIXING_ASSUMPTION,acceptedP4History=false}){
  const validated=validateVolatileSpeciesState(state);const temp=surfaceTempState(surfaceTemperatureState);
  if(typeof acceptedP4History!=='boolean')fail('acceptedP4History must be boolean');
  const mixture=atmosphericMixtureSummary(state,gravityMicroMs2,meanRadiusM,mixingAssumption);
  let waterDiagnostic;
  if(temp===null)waterDiagnostic=freeze({epistemicStatus:'UNKNOWN',regime:'SURFACE_TEMPERATURE_NOT_ESTABLISHED'});
  else waterDiagnostic=waterVaporSaturationAssessment({state,gravityMicroMs2,meanRadiusM,surfaceTemperatureState:{milliK:temp.milliK,epistemicStatus:temp.epistemicStatus,authority:temp.authority,provenance:temp.provenance},mixingAssumption});
  const insufficient=[];
  if(state.compositionCompleteness!=='COMPLETE')insufficient.push('completeVolatileComposition');
  if(mixture.epistemicStatus==='UNKNOWN')insufficient.push('atmosphericMixture');
  if(temp===null)insufficient.push('surfaceTemperatureState');
  if(!acceptedP4History)insufficient.push('acceptedP4History');
  const unsupported=['canonicalVolatileStateProducer','viableBiologicalMediumState','usablePhototrophicOrChemotrophicEnergyState','nutrientRedoxValidityState','abiogenesisTrigger'];
  return freeze({
    contractId:P6_READINESS_CONTRACT,
    authority:AUTHORITY,
    sourceContract:BASE_CONTRACT,
    epistemicStatus:'INSUFFICIENT_ENVIRONMENT',
    canAuthorizeBiology:false,
    canonicalGenesisAvailable:false,
    persistentLineageTransitionsAuthorized:false,
    mandatoryForFuturePositiveEligibility:freeze(['canonicalVolatileStateProducer','acceptedP4History','completeVolatileComposition','surfaceTemperatureState','viableBiologicalMediumState','usablePhototrophicOrChemotrophicEnergyState','nutrientRedoxValidityState','separatelyAdjudicatedAbiogenesisOrPostGenesisFixtureAuthority']),
    optionalContextNotByItselfEligibility:freeze(['xuvEscapeHistory','geologicalActivity','oceanCoverage','regionalClimate']),
    insufficient:freeze(insufficient),
    unsupported:freeze(unsupported),
    diagnostics:freeze({mixture,waterSaturation:waterDiagnostic,volatileAggregate:validated.aggregate}),
    failureSemantics:'ABSTAIN_FAIL_CLOSED',
    evidence:EVIDENCE.p6Readiness
  });
}

export const evidence=EVIDENCE;
