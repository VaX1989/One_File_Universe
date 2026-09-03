(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2,P4=O.p4,P5E=O.p5EnvironmentV2;
if(!P||!P4||!P5E)throw new Error('OFU P6 v1 requires canonical P2, P4 and P5 Environment v2');

const VERSION='p6-biosphere-evolution-1';
const SCHEMA_VERSION=1n;
const CONTRACT_ID='ofu-p6-biosphere-v1';
const P5_ENV_CONTRACT='ofu-p5-p6-environment-v2';
const P5_ENV_VERSION=2n;
const P5_ENV_MODEL='p5-environment-2';
const P5_ENV_AUTHORITY='P5_CANONICAL';
const IDENTITY_POLICY='p6-biological-identity-model-a-v1';
const ELIGIBILITY_CONTRACT='ofu-p6-environment-eligibility-witness-v1';
const ELIGIBILITY_VERSION=1n;
const ELIGIBILITY_SEMANTICS='p6-eligibility-semantics-1';
const TRANSITION_ID='ofu.p6.biological-transition';
const TRANSITION_VERSION='1.0.0';
const TRANSITION_SCOPE='GENESIS_GUARD_ONLY_NO_ACCEPTED_P5_V2_PATH';
const NUMERIC_CONTRACT='p6-fixed-integer-1';
const EVIDENCE_POLICY='p6-scientific-evidence-1';
const LOD_PROFILE='p6-semantic-lod-1';
const U64_MAX=(1n<<64n)-1n,PPM=1000000n;
const STATES=Object.freeze({
  INSUFFICIENT_ENVIRONMENT:'INSUFFICIENT_ENVIRONMENT',
  UNSUPPORTED_ENVIRONMENT:'UNSUPPORTED_ENVIRONMENT',
  NO_BIOSPHERE:'NO_BIOSPHERE',
  BIOSPHERE_SUPPORTED:'BIOSPHERE_SUPPORTED'
});
const ENERGY_SOURCES=Object.freeze({PHOTOTROPHIC:'PHOTOTROPHIC',CHEMOTROPHIC:'CHEMOTROPHIC',MIXED:'MIXED',UNKNOWN:'UNKNOWN'});
const EVIDENCE=Object.freeze({
  environmentAdapter:Object.freeze({evidenceClass:'FORMAL',fidelity:'EXACT_CONTRACT',validityDomain:P5_ENV_CONTRACT,unsupportedInputs:'unknown future contract/version/authority',extrapolationPolicy:'NONE'}),
  eligibility:Object.freeze({evidenceClass:'HYPOTHETICAL',fidelity:'CONSERVATIVE_FAIL_CLOSED',validityDomain:'exact canonical P5 Environment v2 projection only',unsupportedInputs:'missing viable medium or usable energy',extrapolationPolicy:'NONE'}),
  energy:Object.freeze({evidenceClass:'FORMAL',fidelity:'BOUNDED_MODEL',validityDomain:'declared integer model units only',unsupportedInputs:'unquantified source energy',extrapolationPolicy:'NONE'}),
  trophic:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'APPROXIMATE',validityDomain:'energy transfer ceiling',unsupportedInputs:'unquantified transfer efficiency',extrapolationPolicy:'EFFICIENCY_NEVER_EXCEEDS_INPUT'}),
  niche:Object.freeze({evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED',validityDomain:'functional niche descriptors',unsupportedInputs:'morphological prediction',extrapolationPolicy:'NONE'}),
  semanticLod:Object.freeze({evidenceClass:'FORMAL',fidelity:'INVARIANT',validityDomain:'MACRO_MESO_MICRO refinement',unsupportedInputs:'contradictory refinement',extrapolationPolicy:'REJECT'})
});
const MANIFEST=Object.freeze({
  semanticManifestVersion:1n,
  canonicalProtocolVersion:'ofu-cbv-1',
  canonicalAddressVersion:1n,
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1',
  numericContractVersion:1n,
  generatorSuite:'p6-biosphere-evolution',
  generatorSuiteVersion:1n,
  subsystems:Object.freeze({biosphere:1n,ecology:1n,evolution:1n,semanticLod:1n}),
  domains:Object.freeze({biosphere:1n,ecology:1n,evolution:1n}),
  dependencies:Object.freeze({p2:'ofu-cbv-1',astronomy:'p3-astronomy-1',temporal:'ofu-p4-temporal-v1',planetPhysical:'ofu-p5-planet-physical-v1',planetEnvironment:P5_ENV_CONTRACT}),
  lawProfile:'p6-bounded-energy-trophic-v1',
  genesis:Object.freeze({
    schemaVersion:SCHEMA_VERSION,
    modelVersion:VERSION,
    contractId:CONTRACT_ID,
    identityPolicy:IDENTITY_POLICY,
    numericContract:NUMERIC_CONTRACT,
    evidencePolicy:EVIDENCE_POLICY,
    semanticLodProfile:LOD_PROFILE,
    eligibilityWitnessContract:ELIGIBILITY_CONTRACT,
    eligibilitySemantics:ELIGIBILITY_SEMANTICS,
    transitionContract:TRANSITION_ID,
    transitionVersion:TRANSITION_VERSION,
    transitionScope:TRANSITION_SCOPE,
    persistentLineageTransitions:'DEFERRED'
  })
});
P.validateSemanticManifest(MANIFEST);

function fail(message){throw new Error('OFU P6 v1: '+message)}
function hex(value){return P.hex(value)}
function bytes32(value,name){if(!(value instanceof Uint8Array)||value.length!==32)fail(name+' must be 32 bytes');return new Uint8Array(value)}
function u64(value,name){if(typeof value!=='bigint'||value<0n||value>U64_MAX)fail(name+' must be u64 BigInt');return value}
function ppm(value,name){value=u64(value,name);if(value>PPM)fail(name+' exceeds 1,000,000 ppm');return value}
function sameBytes(a,b){return a instanceof Uint8Array&&b instanceof Uint8Array&&hex(a)===hex(b)}
function exactKeys(value,keys,name){
  if(!value||typeof value!=='object'||Array.isArray(value))fail(name+' must be a map');
  const got=Object.keys(value).sort(),want=[...keys].sort();
  if(got.length!==want.length||got.some((key,index)=>key!==want[index]))fail(name+' fields invalid');
  return value;
}
function canonicalEqual(a,b){return sameBytes(P.encode(a),P.encode(b))}
function digest(domain,value){return O.sha256.digest(P.encode({domain,value}))}
function mulPpmFloor(value,factor,name){value=u64(value,name+' value');factor=ppm(factor,name+' factor');const result=value*factor/PPM;if(result>U64_MAX)fail(name+' overflow');return result}
function manifestHash(){return P.semanticManifestHash(MANIFEST)}
function exactP5(){if(P5E.CONTRACT_ID!==P5_ENV_CONTRACT||P5E.SCHEMA_VERSION!==P5_ENV_VERSION||P5E.VERSION!==P5_ENV_MODEL||P5E.AUTHORITY!==P5_ENV_AUTHORITY)fail('runtime P5 Environment v2 dependency mismatch')}
function epistemic(value,status,authority=P5_ENV_AUTHORITY){return !!value&&typeof value==='object'&&value.epistemicStatus===status&&value.authority===authority}
function requireUnsupported(value,name){if(!epistemic(value,'UNSUPPORTED'))fail(name+' must remain explicit UNSUPPORTED under P5 Environment v2')}

function validateEnvironmentProjection(input){
  exactP5();
  exactKeys(input,['contractId','version','modelVersion','authority','baselineEpoch','planetId','semanticManifestHash','canonicalV1','epistemicVocabulary','atmosphere','pressure','radiativeTier0','waterPhase','xuvEvolution','atmosphericEscapeHistory','geologicalActivity','geochemicalEnergyAvailability','oceanAreaFraction','spatial','temporal','numeric','evidence'],'P5 Environment v2 projection');
  if(input.contractId!==P5_ENV_CONTRACT||input.version!==P5_ENV_VERSION||input.modelVersion!==P5_ENV_MODEL||input.authority!==P5_ENV_AUTHORITY)fail('unsupported P5 Environment contract/version/model/authority');
  if(input.baselineEpoch!=='P4_T0')fail('P5 Environment baseline epoch mismatch');
  bytes32(input.planetId,'planetId');
  if(!sameBytes(bytes32(input.semanticManifestHash,'P5 semanticManifestHash'),P5E.semanticManifestHash()))fail('P5 semantic manifest mismatch');
  const vocabulary=['KNOWN','DERIVED','HYPOTHETICAL_MODEL_VALUE','UNKNOWN','UNSUPPORTED'];
  if(!Array.isArray(input.epistemicVocabulary)||input.epistemicVocabulary.length!==vocabulary.length||input.epistemicVocabulary.some((value,index)=>value!==vocabulary[index]))fail('P5 epistemic vocabulary mismatch');
  if(!input.canonicalV1||input.canonicalV1.contractId!=='ofu-p5-p6-environment-v1'||input.canonicalV1.version!==1n||input.canonicalV1.status!=='PARTIAL')fail('frozen P5 v1 projection mismatch');
  if(!input.atmosphere||input.atmosphere.contractId!=='ofu-p5-atmosphere-state-v2'||input.atmosphere.version!==P5_ENV_VERSION||input.atmosphere.authority!==P5_ENV_AUTHORITY||input.atmosphere.epistemicStatus!=='UNKNOWN'||input.atmosphere.genesisPolicy!=='NO_CANONICAL_GENESIS')fail('P5 atmosphere witness mismatch');
  for(const key of ['totalVolatileMassTg','atmosphericRetainedMassTg','condensedSurfaceMassTg','subsurfaceInteriorMassTg','lostMassTg'])if(input.atmosphere[key]!==null)fail('unknown atmosphere cannot contain canonical mass');
  if(!epistemic(input.pressure,'UNKNOWN')||input.pressure.pressurePa!==null)fail('P5 pressure witness mismatch');
  const radiative=input.radiativeTier0;
  if(!radiative||radiative.law!==P5E.RADIATIVE_LAW||!epistemic(radiative.insolation,'KNOWN','P3_CANONICAL')||typeof radiative.insolation.valuePpm!=='bigint')fail('P5 radiative input witness mismatch');
  if(!epistemic(radiative.bondAlbedo,'UNKNOWN')||!epistemic(radiative.effectiveTemperature,'UNKNOWN'))fail('P5 radiative unknowns mismatch');
  requireUnsupported(radiative.surfaceTemperature,'surface temperature');
  requireUnsupported(radiative.greenhouseResponse,'greenhouse response');
  for(const [name,value] of [['water phase',input.waterPhase],['XUV evolution',input.xuvEvolution],['atmospheric escape history',input.atmosphericEscapeHistory],['geological activity',input.geologicalActivity],['geochemical energy',input.geochemicalEnergyAvailability],['ocean area fraction',input.oceanAreaFraction]])requireUnsupported(value,name);
  if(!input.temporal||input.temporal.canonicalTimeOwner!=='P4'||input.temporal.baselineEpoch!=='P4_T0'||input.temporal.privateClock!==false||input.temporal.endogenousAtmosphereLossTransitions!=='UNSUPPORTED')fail('P5 temporal authority mismatch');
  if(!input.spatial||input.spatial.regionalEnvironment!=='UNSUPPORTED'||input.spatial.independentGridCreated!==false)fail('P5 spatial authority mismatch');
  P.encode(input);
  return input;
}

function classifyEnvironmentEvidence({unknown=[],unsupported=[],insolationKnown=false}){
  if(!Array.isArray(unknown)||!Array.isArray(unsupported))fail('environment evidence lists required');
  if(unknown.length>0||insolationKnown!==true)return STATES.INSUFFICIENT_ENVIRONMENT;
  if(unsupported.length>0)return STATES.UNSUPPORTED_ENVIRONMENT;
  return STATES.NO_BIOSPHERE;
}
function adaptEnvironment(input){
  validateEnvironmentProjection(input);
  const unsupported=[];
  for(const [name,value] of [['waterPhase',input.waterPhase],['xuvEvolution',input.xuvEvolution],['atmosphericEscapeHistory',input.atmosphericEscapeHistory],['geologicalActivity',input.geologicalActivity],['geochemicalEnergyAvailability',input.geochemicalEnergyAvailability],['oceanAreaFraction',input.oceanAreaFraction]])if(epistemic(value,'UNSUPPORTED'))unsupported.push(name);
  const unknown=[];
  if(epistemic(input.atmosphere,'UNKNOWN'))unknown.push('atmosphere');
  if(epistemic(input.pressure,'UNKNOWN'))unknown.push('pressure');
  if(epistemic(input.radiativeTier0.bondAlbedo,'UNKNOWN'))unknown.push('bondAlbedo');
  const insolationKnown=epistemic(input.radiativeTier0.insolation,'KNOWN','P3_CANONICAL');
  const state=classifyEnvironmentEvidence({unknown,unsupported,insolationKnown});
  return Object.freeze({
    adapterVersion:'p6-p5-environment-v2-adapter-1',
    planetId:bytes32(input.planetId,'planetId'),
    source:Object.freeze({contractId:input.contractId,schemaVersion:input.version,modelVersion:input.modelVersion,authority:input.authority,semanticManifestHash:bytes32(input.semanticManifestHash,'P5 semanticManifestHash'),environmentDigest:P5E.environmentDigest(input)}),
    state,
    unknown:Object.freeze(unknown),
    unsupported:Object.freeze(unsupported)
  });
}
function eligibilityBody(env){
  exactKeys(env,['adapterVersion','planetId','source','state','unknown','unsupported'],'adapted environment');
  if(env.adapterVersion!=='p6-p5-environment-v2-adapter-1')fail('adapted canonical environment required');
  bytes32(env.planetId,'adapted planetId');
  exactKeys(env.source,['contractId','schemaVersion','modelVersion','authority','semanticManifestHash','environmentDigest'],'environment source');
  if(env.source.contractId!==P5_ENV_CONTRACT||env.source.schemaVersion!==P5_ENV_VERSION||env.source.modelVersion!==P5_ENV_MODEL||env.source.authority!==P5_ENV_AUTHORITY||!sameBytes(env.source.semanticManifestHash,P5E.semanticManifestHash()))fail('adapted environment source mismatch');
  bytes32(env.source.environmentDigest,'environmentDigest');
  let reason;
  if(env.state===STATES.INSUFFICIENT_ENVIRONMENT)reason='CANONICAL_ENVIRONMENT_INSUFFICIENT';
  else if(env.state===STATES.UNSUPPORTED_ENVIRONMENT)reason='CANONICAL_ENVIRONMENT_OUTSIDE_P6_V1_SUPPORTED_DOMAIN';
  else if(env.state===STATES.NO_BIOSPHERE)reason='NO_CANONICAL_P6_GENESIS_TRIGGER';
  else fail('P5 Environment v2 cannot authorize BIOSPHERE_SUPPORTED in P6 v1');
  return Object.freeze({contractId:ELIGIBILITY_CONTRACT,schemaVersion:ELIGIBILITY_VERSION,semanticsVersion:ELIGIBILITY_SEMANTICS,planetId:bytes32(env.planetId,'planetId'),source:env.source,state:env.state,canGenerateBiosphere:false,reason,unknown:env.unknown,unsupported:env.unsupported,identityPolicy:IDENTITY_POLICY,p6SemanticManifestHash:manifestHash()});
}
function eligibility(env){const body=eligibilityBody(env);return Object.freeze({...body,witnessDigest:digest('OFU-P6-ELIGIBILITY-WITNESS-v1',body)})}
function validateEligibilityWitness(witness){
  exactKeys(witness,['contractId','schemaVersion','semanticsVersion','planetId','source','state','canGenerateBiosphere','reason','unknown','unsupported','identityPolicy','p6SemanticManifestHash','witnessDigest'],'P6 eligibility witness');
  const body={...witness};delete body.witnessDigest;
  const expectedBody=eligibilityBody({adapterVersion:'p6-p5-environment-v2-adapter-1',planetId:body.planetId,source:body.source,state:body.state,unknown:body.unknown,unsupported:body.unsupported});
  if(!canonicalEqual(body,expectedBody)||!sameBytes(bytes32(witness.witnessDigest,'eligibility witness digest'),digest('OFU-P6-ELIGIBILITY-WITNESS-v1',expectedBody)))fail('eligibility witness mismatch');
  return witness;
}
function genesisEvidenceBundle(environmentProjection){const adapted=adaptEnvironment(environmentProjection),witness=eligibility(adapted);return Object.freeze({environmentProjection,environmentDigest:adapted.source.environmentDigest,eligibilityWitness:witness})}
function canonicalBaseline(environmentProjection){
  const bundle=genesisEvidenceBundle(environmentProjection);
  return Object.freeze({phase:'P6',contractId:CONTRACT_ID,schemaVersion:SCHEMA_VERSION,modelVersion:VERSION,manifestHash:manifestHash(),planetId:bytes32(environmentProjection.planetId,'planetId'),p5EnvironmentContract:P5_ENV_CONTRACT,p5EnvironmentVersion:P5_ENV_VERSION,p5EnvironmentModel:P5_ENV_MODEL,p5EnvironmentAuthority:P5_ENV_AUTHORITY,p5EnvironmentDigest:bundle.environmentDigest,eligibilityWitness:bundle.eligibilityWitness,identityPolicy:IDENTITY_POLICY,persistentBiologyEstablished:false,persistentLineageTransitions:'DEFERRED'});
}

function bindings({masterSeed,canonicalUniverseIdentity}){
  const seed=bytes32(masterSeed,'masterSeed'),uid=bytes32(canonicalUniverseIdentity,'canonicalUniverseIdentity'),mh=manifestHash();
  function address(planetId,kind,index){return P.address([{kind:'namespace',value:'p6.canonical.v1'},{kind:'bytes',value:bytes32(planetId,'planetId')},{kind:'namespace',value:kind},{kind:'u64',value:u64(BigInt(index),'index')}])}
  function draw(planetId,kind,index,property){return P.derive({masterSeed:seed,semanticManifestHash:mh,domain:'ofu.p6.biosphere.v1',addressBytes:address(planetId,kind,index),property,counter:0n})}
  function entity(namespace,stableKey){return P.entityIdentity(uid,namespace,stableKey)}
  return Object.freeze({manifestHash:mh,canonicalUniverseIdentity:uid,address,draw,entity});
}
function idsForPlanet(binding,planetId,{lineageOrdinal=0n,speciesOrdinal=0n}={}){
  planetId=bytes32(planetId,'planetId');lineageOrdinal=u64(lineageOrdinal,'lineageOrdinal');speciesOrdinal=u64(speciesOrdinal,'speciesOrdinal');
  const biosphereId=binding.entity('p6.biosphere',{planetId,identityPolicy:IDENTITY_POLICY});
  const lineageId=binding.entity('p6.lineage',{biosphereId,lineageOrdinal,identityPolicy:IDENTITY_POLICY});
  const speciesId=binding.entity('p6.species',{lineageId,speciesOrdinal,identityPolicy:IDENTITY_POLICY});
  return Object.freeze({biosphereId,lineageId,speciesId});
}
function expectedBiosphereId(universeIdentity,planetId){return P.entityIdentity(bytes32(universeIdentity,'canonicalUniverseIdentity'),'p6.biosphere',{planetId:bytes32(planetId,'planetId'),identityPolicy:IDENTITY_POLICY})}
function expectedLineageId(universeIdentity,biosphereId,lineageOrdinal){return P.entityIdentity(bytes32(universeIdentity,'canonicalUniverseIdentity'),'p6.lineage',{biosphereId:bytes32(biosphereId,'biosphereId'),lineageOrdinal:u64(lineageOrdinal,'lineageOrdinal'),identityPolicy:IDENTITY_POLICY})}
function expectedSpeciesId(universeIdentity,lineageId,speciesOrdinal){return P.entityIdentity(bytes32(universeIdentity,'canonicalUniverseIdentity'),'p6.species',{lineageId:bytes32(lineageId,'lineageId'),speciesOrdinal:u64(speciesOrdinal,'speciesOrdinal'),identityPolicy:IDENTITY_POLICY})}
function assertBiosphereId(universeIdentity,planetId,biosphereId){const expected=expectedBiosphereId(universeIdentity,planetId);if(!sameBytes(expected,bytes32(biosphereId,'biosphereId')))fail('forged biosphereId');return expected}
function assertLineageId(universeIdentity,biosphereId,lineageOrdinal,lineageId){const expected=expectedLineageId(universeIdentity,biosphereId,lineageOrdinal);if(!sameBytes(expected,bytes32(lineageId,'lineageId')))fail('forged lineageId');return expected}
function assertSpeciesId(universeIdentity,lineageId,speciesOrdinal,speciesId){const expected=expectedSpeciesId(universeIdentity,lineageId,speciesOrdinal);if(!sameBytes(expected,bytes32(speciesId,'speciesId')))fail('forged speciesId');return expected}

function energyBudget(input){
  exactKeys(input,['phototrophicUsableEnergyU','phototrophicCaptureEfficiencyPpm','chemotrophicUsableEnergyU','chemotrophicCaptureEfficiencyPpm','biomassSupportEfficiencyPpm'],'energy budget input');
  const photo=u64(input.phototrophicUsableEnergyU,'phototrophic energy'),chem=input.chemotrophicUsableEnergyU===null?null:u64(input.chemotrophicUsableEnergyU,'chemotrophic energy');
  const photoCapture=ppm(input.phototrophicCaptureEfficiencyPpm,'phototrophic capture efficiency'),chemCapture=chem===null?null:ppm(input.chemotrophicCaptureEfficiencyPpm,'chemotrophic capture efficiency');
  const ppPhoto=mulPpmFloor(photo,photoCapture,'phototrophic productivity'),ppChem=chem===null?0n:mulPpmFloor(chem,chemCapture,'chemotrophic productivity');
  const total=ppPhoto+ppChem;if(total>U64_MAX)fail('primary productivity overflow');
  const biomass=mulPpmFloor(total,ppm(input.biomassSupportEfficiencyPpm,'biomass support efficiency'),'biomass support');
  const source=ppPhoto>0n&&ppChem>0n?ENERGY_SOURCES.MIXED:ppChem>0n?ENERGY_SOURCES.CHEMOTROPHIC:ppPhoto>0n?ENERGY_SOURCES.PHOTOTROPHIC:ENERGY_SOURCES.UNKNOWN;
  return Object.freeze({modelOnly:true,canonicalBiologyEstablished:false,energySource:source,phototrophicPrimaryProductivityU:ppPhoto,chemotrophicPrimaryProductivityU:ppChem,primaryProductivityCeilingU:total,sustainableBiomassCeilingU:biomass,evidence:EVIDENCE.energy});
}
function transferCeilings(primaryU,efficienciesPpm){
  let current=u64(primaryU,'primary productivity');if(!Array.isArray(efficienciesPpm)||efficienciesPpm.length>8)fail('transfer efficiencies invalid');
  const out=[Object.freeze({level:0n,energyCeilingU:current,transferEfficiencyPpm:PPM})];
  for(let index=0;index<efficienciesPpm.length;index++){const efficiency=ppm(efficienciesPpm[index],'transfer efficiency');current=mulPpmFloor(current,efficiency,'trophic transfer');out.push(Object.freeze({level:BigInt(index+1),energyCeilingU:current,transferEfficiencyPpm:efficiency}))}
  return Object.freeze(out);
}
function assertLod(macro,meso,micro=null){
  if(!macro||!meso||macro.level!=='MACRO'||meso.level!=='MESO'||!sameBytes(macro.planetId,meso.planetId)||!sameBytes(macro.biosphereId,meso.biosphereId))return false;
  if(!macro.commitments||!Array.isArray(meso.lineages)||!Array.isArray(meso.species))return false;
  for(const lineage of meso.lineages)if(!sameBytes(lineage.biosphereId,macro.biosphereId)||lineage.viableMedium!==macro.commitments.viableMedium||lineage.energyCeilingU>macro.commitments.primaryProductivityCeilingU)return false;
  for(const species of meso.species)if(species.viableMedium!==macro.commitments.viableMedium||species.energyCeilingU>macro.commitments.primaryProductivityCeilingU)return false;
  if(micro&&(micro.persistent!==false||micro.individualIdentityPromoted!==false||micro.viableMedium!==macro.commitments.viableMedium||micro.energyCeilingU>macro.commitments.primaryProductivityCeilingU))return false;
  return true;
}

function expectPayload(event,keys){return exactKeys(event.descriptor.payload,keys,'biological event payload')}
function validateGenesisEvent(state,event){
  const payload=expectPayload(event,['biosphereId','planetId','environmentProjection','environmentDigest','eligibilityWitness','modelVersion','manifestHash','identityPolicy']);
  if(event.descriptor.targets.length!==1||!sameBytes(event.descriptor.targets[0],bytes32(payload.biosphereId,'biosphereId')))fail('genesis target mismatch');
  if(payload.modelVersion!==VERSION||payload.identityPolicy!==IDENTITY_POLICY||!sameBytes(bytes32(payload.manifestHash,'manifestHash'),manifestHash()))fail('genesis P6 contract mismatch');
  const bundle=genesisEvidenceBundle(payload.environmentProjection);
  if(!sameBytes(bytes32(payload.planetId,'planetId'),payload.environmentProjection.planetId))fail('genesis planet mismatch');
  if(!sameBytes(bytes32(payload.environmentDigest,'environmentDigest'),bundle.environmentDigest))fail('environment witness digest mismatch');
  validateEligibilityWitness(payload.eligibilityWitness);
  if(!canonicalEqual(payload.eligibilityWitness,bundle.eligibilityWitness))fail('eligibility witness is not bound to environment projection');
  if(!canonicalEqual(state.baseline,canonicalBaseline(payload.environmentProjection)))fail('genesis witness is not bound to P4 baseline');
  assertBiosphereId(state.universeIdentity,payload.planetId,payload.biosphereId);
  if(bundle.eligibilityWitness.state!==STATES.BIOSPHERE_SUPPORTED||bundle.eligibilityWitness.canGenerateBiosphere!==true)fail('canonical P5 Environment v2 does not authorize biosphere genesis');
  return payload;
}
function createGenesisPayload({canonicalUniverseIdentity,environmentProjection}){
  const bundle=genesisEvidenceBundle(environmentProjection);
  if(bundle.eligibilityWitness.state!==STATES.BIOSPHERE_SUPPORTED||bundle.eligibilityWitness.canGenerateBiosphere!==true)fail('canonical P5 Environment v2 does not authorize biosphere genesis');
  const biosphereId=expectedBiosphereId(canonicalUniverseIdentity,environmentProjection.planetId);
  return Object.freeze({biosphereId,planetId:bytes32(environmentProjection.planetId,'planetId'),environmentProjection,environmentDigest:bundle.environmentDigest,eligibilityWitness:bundle.eligibilityWitness,modelVersion:VERSION,manifestHash:manifestHash(),identityPolicy:IDENTITY_POLICY});
}
function p6Entity(state,id){const key=hex(id);return state.entities[key]||(state.entities[key]=Object.create(null))}
const reducers=new Map();
reducers.set('p6.biosphere.genesis@1',(state,event)=>{
  const payload=validateGenesisEvent(state,event),entity=p6Entity(state,payload.biosphereId);
  if(entity.kind)fail('biosphere already exists');
  Object.assign(entity,{kind:'P6_BIOSPHERE',status:'ACTIVE',biosphereId:bytes32(payload.biosphereId,'biosphereId'),planetId:bytes32(payload.planetId,'planetId'),modelVersion:VERSION,manifestHash:manifestHash(),identityPolicy:IDENTITY_POLICY,environmentDigest:bytes32(payload.environmentDigest,'environmentDigest'),eligibilityWitnessDigest:bytes32(payload.eligibilityWitness.witnessDigest,'eligibility witness digest')});
});
const TRANSITION_CONTRACT=P4.createTransitionContract({contractId:TRANSITION_ID,semanticVersion:TRANSITION_VERSION,eventFamilies:['p6.biosphere.genesis@1'],reducers});
const OWNERSHIP=Object.freeze({privateClock:false,ownsOrdering:false,ownsEventIdentity:false,ownsReplay:false,ownsCheckpoints:false,ownsCompaction:false,ownsLineage:false});

function renderingProjection(value){
  if(!value)return Object.freeze({presentationOnly:true,state:STATES.INSUFFICIENT_ENVIRONMENT,biologyEstablished:false});
  let witness=value;if(value.adapterVersion==='p6-p5-environment-v2-adapter-1')witness=eligibility(value);
  if(witness.contractId!==ELIGIBILITY_CONTRACT)fail('canonical eligibility witness required for rendering');
  validateEligibilityWitness(witness);
  if(witness.state===STATES.BIOSPHERE_SUPPORTED||witness.canGenerateBiosphere)fail('P6 v1 has no canonical positive biosphere rendering path');
  return Object.freeze({presentationOnly:true,state:witness.state,planetId:witness.planetId,biologyEstablished:false,environmentAuthority:witness.source.authority,environmentContract:witness.source.contractId,eligibilityWitnessDigest:witness.witnessDigest});
}

O.p6Biosphere=Object.freeze({
  VERSION,SCHEMA_VERSION,CONTRACT_ID,P5_ENV_CONTRACT,P5_ENV_VERSION,P5_ENV_MODEL,P5_ENV_AUTHORITY,IDENTITY_POLICY,
  ELIGIBILITY_CONTRACT,ELIGIBILITY_VERSION,ELIGIBILITY_SEMANTICS,TRANSITION_ID,TRANSITION_VERSION,TRANSITION_SCOPE,
  NUMERIC_CONTRACT,EVIDENCE_POLICY,LOD_PROFILE,U64_MAX,PPM,STATES,ENERGY_SOURCES,EVIDENCE,MANIFEST,OWNERSHIP,
  TRANSITION_CONTRACT,manifestHash,validateEnvironmentProjection,classifyEnvironmentEvidence,adaptEnvironment,eligibility,
  validateEligibilityWitness,genesisEvidenceBundle,canonicalBaseline,createGenesisPayload,validateGenesisEvent,bindings,
  idsForPlanet,expectedBiosphereId,expectedLineageId,expectedSpeciesId,assertBiosphereId,assertLineageId,assertSpeciesId,
  energyBudget,transferCeilings,assertLod,renderingProjection
});
})(typeof globalThis!=='undefined'?globalThis:this);
