// P6 Biology v2 Wave IV frontier. RESEARCH ONLY. POST-GENESIS ONLY.
export const CONTRACT_ID='ofu-p6-biology-v2-frontier-research-wave4';
export const AUTHORITY='P6_RESEARCH_ONLY';
export const PRIOR_CONTRACT='ofu-p6-biology-v2-bounded-research';
export const P5_READINESS_CONTRACT='ofu-p5-p6-environment-readiness-research-v2';
export const SOURCE_RECORD_CONTRACT='ofu-scientific-source-record-v1';
export const PARAMETER_CONTRACT='ofu-p6-biological-parameter-authority-research-v1';
export const ENERGY_CONTRACT='ofu-p6-ecology-energy-budget-research-v2';
export const TRAIT_RESPONSE_CONTRACT='ofu-p6-trait-response-research-v1';
export const SPECIATION_ASSESSMENT_CONTRACT='ofu-p6-species-delimitation-assessment-research-v1';
export const POST_GENESIS_SEED_CONTRACT='ofu-p6-post-genesis-seed-research-v1';
export const POPULATION_BALANCE_CONTRACT='ofu-p6-population-balance-research-v1';
export const CHECKPOINT_CONTRACT='ofu-p6-research-checkpoint-v1';
export const PPM=1000000n;
export const U64_MAX=(1n<<64n)-1n;
export const I64_MIN=-(1n<<63n),I64_MAX=(1n<<63n)-1n;
export const LIMITS=Object.freeze({MAX_TROPHIC_TRANSFERS:8,MAX_PARAMETER_ASSUMPTIONS:16,MAX_VALIDITY_DEPENDENCIES:32,MAX_CHECKPOINT_LINEAGES:1024,MAX_CHECKPOINT_TRAITS_PER_LINEAGE:32,MAX_TEXT:512});
export const EVIDENCE_CLASSES=Object.freeze(['ESTABLISHED','EMPIRICALLY_CONSTRAINED','HYPOTHETICAL','SPECULATIVE','FICTIONAL']);
export const FIDELITIES=Object.freeze(['FORMAL','HIGH_FIDELITY','APPROXIMATE','STYLIZED','METAPHORICAL']);
export const PARAMETER_AUTHORITIES=Object.freeze(['SOURCE_BOUND_EXTERNAL','EMPIRICALLY_CONSTRAINED_MODEL','RESEARCH_FIXTURE']);
export const SEED_AUTHORITIES=Object.freeze(['EXTERNAL_POST_GENESIS_SEED','RESEARCH_FIXTURE_ONLY']);
const EVIDENCE=Object.freeze({
  parameterAuthority:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'parameter provenance and validity enforcement only; it does not validate parameter transferability'}),
  energyAccounting:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'energy conservation/allocation arithmetic only; capture, maintenance and trophic efficiencies remain externally governed biological parameters'}),
  trophicModel:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',claimLimit:'trophic transfer is ecologically established but no universal transfer efficiency is assumed'}),
  traitResponse:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',claimLimit:'Breeder-equation-family response requires explicit narrow-sense heritability and selection differential and is not a universal wild-population predictor'}),
  speciation:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',fidelity:'APPROXIMATE',claimLimit:'species delimitation requires an explicit criterion/witness; scalar trait distance alone never establishes speciation'}),
  populationBalance:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'bookkeeping of externally supplied demographic flows only; no endogenous growth-rate law'}),
  postGenesisSeed:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'authority separation only; no abiogenesis probability or event is inferred'})
});
function freeze(v){return Object.freeze(v)}
function fail(m){throw new Error('P6 Biology v2 Wave IV: '+m)}
function exact(o,keys,n){if(!o||typeof o!=='object'||Array.isArray(o))fail(n+' must be map');const a=Object.keys(o).sort(),b=[...keys].sort();if(a.length!==b.length||a.some((x,i)=>x!==b[i]))fail(n+' fields invalid');return o}
function text(v,n,max=LIMITS.MAX_TEXT){if(typeof v!=='string'||v.length===0||v.length>max||v!==v.normalize('NFC'))fail(n+' must be bounded NFC text');return v}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64');return v}
function i64(v,n){if(typeof v!=='bigint'||v<I64_MIN||v>I64_MAX)fail(n+' must be i64');return v}
function ppm(v,n){u64(v,n);if(v>PPM)fail(n+' must be 0..1e6 ppm');return v}
function enumValue(v,a,n){if(!a.includes(v))fail(n+' unsupported');return v}
function arrText(v,n,maxCount=LIMITS.MAX_PARAMETER_ASSUMPTIONS){if(!Array.isArray(v)||v.length>maxCount)fail(n+' must be bounded array');return freeze(v.map((x,i)=>text(x,n+'['+i+']',256)))}
function mulPpmHalfEven(value,factor){const n=value*factor,d=PPM,q=n/d,r=n%d,t=2n*r;return t>d||(t===d&&(q&1n)===1n)?q+1n:q}
function signedMulPpmHalfEven(value,factor){i64(value,'signed value');ppm(factor,'ppm factor');const neg=value<0n;let a=neg?-value:value;const r=mulPpmHalfEven(a,factor);return neg?-r:r}
function addU64(a,b,n){const x=u64(a,n+' lhs')+u64(b,n+' rhs');if(x>U64_MAX)fail(n+' overflow');return x}

export function validateSourceRecord(source){
  exact(source,['contractId','sourceId','sourceVersion','locator','retrievedDate','sourceType','evidenceClass','fidelity','validityDomain','assumptions','uncertainty','units'],'source');
  if(source.contractId!==SOURCE_RECORD_CONTRACT)fail('source contract mismatch');text(source.sourceId,'sourceId',128);text(source.sourceVersion,'sourceVersion',128);text(source.locator,'locator',512);text(source.retrievedDate,'retrievedDate',32);text(source.sourceType,'sourceType',64);enumValue(source.evidenceClass,EVIDENCE_CLASSES,'source evidenceClass');enumValue(source.fidelity,FIDELITIES,'source fidelity');text(source.validityDomain,'source validityDomain',1024);arrText(source.assumptions,'source assumptions');text(source.uncertainty,'source uncertainty',512);text(source.units,'source units',128);return source;
}

export function validateParameter(parameter){
  exact(parameter,['contractId','parameterId','kind','authorityClass','evidenceClass','fidelity','valueLower','valueUpper','unit','source','validityDomain','assumptions','dependencies'],'parameter');
  if(parameter.contractId!==PARAMETER_CONTRACT)fail('parameter contract mismatch');text(parameter.parameterId,'parameterId',128);text(parameter.kind,'parameter kind',96);enumValue(parameter.authorityClass,PARAMETER_AUTHORITIES,'parameter authorityClass');enumValue(parameter.evidenceClass,EVIDENCE_CLASSES,'parameter evidenceClass');enumValue(parameter.fidelity,FIDELITIES,'parameter fidelity');
  const lo=i64(parameter.valueLower,'parameter valueLower'),hi=i64(parameter.valueUpper,'parameter valueUpper');if(lo>hi)fail('parameter interval reversed');text(parameter.unit,'parameter unit',64);validateSourceRecord(parameter.source);if(parameter.evidenceClass!==parameter.source.evidenceClass||parameter.fidelity!==parameter.source.fidelity)fail('parameter claim metadata must match source record');text(parameter.validityDomain,'parameter validityDomain',1024);const assumptions=arrText(parameter.assumptions,'parameter assumptions');const dependencies=arrText(parameter.dependencies,'parameter dependencies',LIMITS.MAX_VALIDITY_DEPENDENCIES);return freeze({...parameter,assumptions,dependencies});
}
function requirePpmParameter(p,kind){const x=validateParameter(p);if(x.kind!==kind||x.unit!=='PPM'||x.valueLower<0n||x.valueUpper>PPM)fail(kind+' must be a 0..1e6 PPM parameter');return x}

export function ecologyEnergyBudgetV2(input){
  exact(input,['phototrophicUsableEnergyU','chemotrophicUsableEnergyU','phototrophicCaptureEfficiency','chemotrophicCaptureEfficiency','maintenanceFraction','trophicEfficiencies'],'ecology energy input');
  const photo=u64(input.phototrophicUsableEnergyU,'phototrophicUsableEnergyU');const chemo=input.chemotrophicUsableEnergyU===null?null:u64(input.chemotrophicUsableEnergyU,'chemotrophicUsableEnergyU');
  const pc=requirePpmParameter(input.phototrophicCaptureEfficiency,'PHOTOTROPHIC_CAPTURE_EFFICIENCY');
  let cc=null;if(chemo===null){if(input.chemotrophicCaptureEfficiency!==null)fail('chemotrophic efficiency cannot exist without chemotrophic energy')}else{if(input.chemotrophicCaptureEfficiency===null)fail('chemotrophic efficiency required');cc=requirePpmParameter(input.chemotrophicCaptureEfficiency,'CHEMOTROPHIC_CAPTURE_EFFICIENCY')}
  const maint=requirePpmParameter(input.maintenanceFraction,'MAINTENANCE_FRACTION');
  if(!Array.isArray(input.trophicEfficiencies)||input.trophicEfficiencies.length>LIMITS.MAX_TROPHIC_TRANSFERS)fail('trophic efficiency list exceeds bound');const te=input.trophicEfficiencies.map((p,i)=>requirePpmParameter(p,'TROPHIC_TRANSFER_EFFICIENCY_'+i));
  const photoLo=mulPpmHalfEven(photo,BigInt(pc.valueLower)),photoHi=mulPpmHalfEven(photo,BigInt(pc.valueUpper));const chemoLo=chemo===null?0n:mulPpmHalfEven(chemo,BigInt(cc.valueLower)),chemoHi=chemo===null?0n:mulPpmHalfEven(chemo,BigInt(cc.valueUpper));
  const primaryLo=addU64(photoLo,chemoLo,'primary lower'),primaryHi=addU64(photoHi,chemoHi,'primary upper');
  const maintenanceLo=mulPpmHalfEven(primaryLo,BigInt(maint.valueLower)),maintenanceHi=mulPpmHalfEven(primaryHi,BigInt(maint.valueUpper));
  const allocLo=mulPpmHalfEven(primaryLo,PPM-BigInt(maint.valueUpper)),allocHi=mulPpmHalfEven(primaryHi,PPM-BigInt(maint.valueLower));
  const trophic=[freeze({level:0n,energyLowerU:allocLo,energyUpperU:allocHi})];let lo=allocLo,hi=allocHi;
  for(let i=0;i<te.length;i++){lo=mulPpmHalfEven(lo,BigInt(te[i].valueLower));hi=mulPpmHalfEven(hi,BigInt(te[i].valueUpper));trophic.push(freeze({level:BigInt(i+1),energyLowerU:lo,energyUpperU:hi}))}
  return freeze({contractId:ENERGY_CONTRACT,authority:AUTHORITY,epistemicStatus:'BOUNDED_APPROXIMATION',primaryProductivityIntervalU:freeze([primaryLo,primaryHi]),maintenanceIntervalU:freeze([maintenanceLo,maintenanceHi]),allocatableEnergyIntervalU:freeze([allocLo,allocHi]),trophic:freeze(trophic),parameterIds:freeze([pc.parameterId,...(cc?[cc.parameterId]:[]),maint.parameterId,...te.map(x=>x.parameterId)]),silentDefaultsUsed:false,evidence:EVIDENCE.energyAccounting,modelEvidence:EVIDENCE.trophicModel});
}

export function traitResponseInterval(input){
  exact(input,['currentTraitPpm','narrowSenseHeritability','selectionDifferentialPpmLower','selectionDifferentialPpmUpper','modelClass'],'trait response input');
  if(input.modelClass!=='BREEDERS_EQUATION_RESEARCH')fail('unsupported trait-response model class');const current=ppm(input.currentTraitPpm,'currentTraitPpm');const h=requirePpmParameter(input.narrowSenseHeritability,'NARROW_SENSE_HERITABILITY');const sLo=i64(input.selectionDifferentialPpmLower,'selection differential lower'),sHi=i64(input.selectionDifferentialPpmUpper,'selection differential upper');if(sLo>sHi||sLo< -PPM||sHi>PPM)fail('selection differential interval invalid');
  const candidates=[signedMulPpmHalfEven(sLo,BigInt(h.valueLower)),signedMulPpmHalfEven(sLo,BigInt(h.valueUpper)),signedMulPpmHalfEven(sHi,BigInt(h.valueLower)),signedMulPpmHalfEven(sHi,BigInt(h.valueUpper))];const rLo=candidates.reduce((a,b)=>a<b?a:b),rHi=candidates.reduce((a,b)=>a>b?a:b);const outLo=BigInt(current)+rLo,outHi=BigInt(current)+rHi;if(outLo<0n||outHi>PPM)fail('trait response leaves bounded trait domain; no silent clamping permitted');
  return freeze({contractId:TRAIT_RESPONSE_CONTRACT,authority:AUTHORITY,epistemicStatus:'BOUNDED_APPROXIMATION',modelClass:input.modelClass,responseIntervalPpm:freeze([rLo,rHi]),projectedTraitIntervalPpm:freeze([outLo,outHi]),heritabilityParameterId:h.parameterId,evidence:EVIDENCE.traitResponse,claimLimit:'MODEL_CONDITIONAL_NOT_SCIENTIFIC_VALIDATION_OF_EXISTING_ADAPTATION_EVENT'});
}

export function speciationAssessment(input){
  exact(input,['lineageDivergenceWitness','delimitationCriterion','criterionSatisfied'],'speciation assessment input');
  text(input.lineageDivergenceWitness,'lineageDivergenceWitness',512);if(input.delimitationCriterion===null)return freeze({contractId:SPECIATION_ASSESSMENT_CONTRACT,authority:AUTHORITY,epistemicStatus:'NOT_ESTABLISHED',mayEmitSpeciationEvent:false,reason:'NO_EXPLICIT_SPECIES_DELIMITATION_CRITERION',evidence:EVIDENCE.speciation});
  const criterion=validateParameter(input.delimitationCriterion);if(criterion.kind!=='SPECIES_DELIMITATION_CRITERION')fail('wrong parameter kind for species delimitation');if(typeof input.criterionSatisfied!=='boolean')fail('criterionSatisfied must be boolean');
  return freeze({contractId:SPECIATION_ASSESSMENT_CONTRACT,authority:AUTHORITY,epistemicStatus:input.criterionSatisfied?'CRITERION_WITNESS_PRESENT':'CRITERION_NOT_SATISFIED',mayEmitSpeciationEvent:input.criterionSatisfied,criterionParameterId:criterion.parameterId,lineageDivergenceWitness:input.lineageDivergenceWitness,scalarTraitDistanceAloneSufficient:false,evidence:EVIDENCE.speciation,claimLimit:'EVENT_ELIGIBILITY_UNDER_EXPLICIT_RESEARCH_CRITERION_NOT_UNIVERSAL_TAXONOMIC_TRUTH'});
}

export function populationBalance(input){
  exact(input,['populationBeforeU','birthsU','deathsU','immigrationU','emigrationU'],'population balance');const before=u64(input.populationBeforeU,'populationBeforeU'),births=u64(input.birthsU,'birthsU'),deaths=u64(input.deathsU,'deathsU'),immigration=u64(input.immigrationU,'immigrationU'),emigration=u64(input.emigrationU,'emigrationU');const gains=addU64(births,immigration,'population gains'),losses=addU64(deaths,emigration,'population losses'),available=addU64(before,gains,'population before plus gains');if(losses>available)fail('population demographic loss exceeds available population');return freeze({contractId:POPULATION_BALANCE_CONTRACT,authority:AUTHORITY,populationAfterU:available-losses,netChangeI:BigInt(gains)-BigInt(losses),rateLaw:'NONE_EXTERNAL_FLOWS_ONLY',evidence:EVIDENCE.populationBalance});
}

export function validatePostGenesisSeed(seed){
  exact(seed,['contractId','authority','sourceId','sourceVersion','sourceDigestHex','planetIdHex','environmentEpochKey','p5ReadinessContract','p5ResearchPostGenesisEligible','canonicalGenesisClaim'],'post-genesis seed');if(seed.contractId!==POST_GENESIS_SEED_CONTRACT)fail('post-genesis seed contract mismatch');enumValue(seed.authority,SEED_AUTHORITIES,'seed authority');text(seed.sourceId,'seed sourceId',128);text(seed.sourceVersion,'seed sourceVersion',128);if(!/^[0-9a-f]{64}$/.test(seed.sourceDigestHex)||!/^[0-9a-f]{64}$/.test(seed.planetIdHex))fail('seed digests must be 32-byte lowercase hex');text(seed.environmentEpochKey,'environmentEpochKey',256);if(seed.p5ReadinessContract!==P5_READINESS_CONTRACT||seed.p5ResearchPostGenesisEligible!==true)fail('positive research seed requires explicit positive research-only P5 readiness v2');if(seed.canonicalGenesisClaim!==false)fail('post-genesis research seed cannot claim canonical genesis');return freeze({...seed,canonicalBiologyAuthority:false,abiogenesisInferred:false,evidence:EVIDENCE.postGenesisSeed});
}

export function validateResearchCheckpoint(cp){
  exact(cp,['contractId','biosphereIdHex','environmentEpochKey','lineageCount','activeLineageCount','maxTraitsObserved','stateDigestHex','p4EventCount'],'research checkpoint');if(cp.contractId!==CHECKPOINT_CONTRACT)fail('checkpoint contract mismatch');if(!/^[0-9a-f]{64}$/.test(cp.biosphereIdHex)||!/^[0-9a-f]{64}$/.test(cp.stateDigestHex))fail('checkpoint IDs/digests invalid');text(cp.environmentEpochKey,'environmentEpochKey',256);const total=u64(cp.lineageCount,'lineageCount'),active=u64(cp.activeLineageCount,'activeLineageCount'),traits=u64(cp.maxTraitsObserved,'maxTraitsObserved'),events=u64(cp.p4EventCount,'p4EventCount');if(total>BigInt(LIMITS.MAX_CHECKPOINT_LINEAGES)||active>256n||active>total||traits>BigInt(LIMITS.MAX_CHECKPOINT_TRAITS_PER_LINEAGE))fail('checkpoint boundedness violation');return freeze({...cp,lineageCount:total,activeLineageCount:active,maxTraitsObserved:traits,p4EventCount:events,persistenceOwner:'P4',privateP6HistoryEntries:0});
}

export const evidence=EVIDENCE;
export const abiogenesis=freeze({status:'NO_CANONICAL_GENESIS_MODEL',predictivePlanetaryTrigger:false,allowedPositiveResearchEntry:freeze(SEED_AUTHORITIES)});
