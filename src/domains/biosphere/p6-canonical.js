(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2,P4=O.p4,P5E=O.p5EnvironmentV2;
if(!P||!P4||!P5E)throw new Error('OFU P6 v1 requires canonical P2, P4 and P5 Environment v2');
const VERSION='p6-biosphere-evolution-1',SCHEMA_VERSION=1n,CONTRACT_ID='ofu-p6-biosphere-v1';
const P5_ENV_CONTRACT='ofu-p5-p6-environment-v2',P5_ENV_VERSION=2n,P5_ENV_MODEL='p5-environment-2',P5_ENV_AUTHORITY='P5_CANONICAL';
const IDENTITY_POLICY='p6-biological-identity-model-a-v1',TRANSITION_ID='ofu.p6.biological-transition',TRANSITION_VERSION='1.0.0';
const NUMERIC_CONTRACT='p6-fixed-integer-1',EVIDENCE_POLICY='p6-scientific-evidence-1',LOD_PROFILE='p6-semantic-lod-1';
const U64_MAX=(1n<<64n)-1n,PPM=1000000n;
const STATES=Object.freeze({INSUFFICIENT_ENVIRONMENT:'INSUFFICIENT_ENVIRONMENT',UNSUPPORTED_ENVIRONMENT:'UNSUPPORTED_ENVIRONMENT',NO_BIOSPHERE:'NO_BIOSPHERE',BIOSPHERE_SUPPORTED:'BIOSPHERE_SUPPORTED'});
const ENERGY_SOURCES=Object.freeze({PHOTOTROPHIC:'PHOTOTROPHIC',CHEMOTROPHIC:'CHEMOTROPHIC',MIXED:'MIXED',UNKNOWN:'UNKNOWN'});
const EVIDENCE=Object.freeze({
 environmentAdapter:Object.freeze({evidenceClass:'FORMAL',fidelity:'EXACT_CONTRACT',validityDomain:P5_ENV_CONTRACT,unsupportedInputs:'unknown future contract/version/authority',extrapolationPolicy:'NONE'}),
 eligibility:Object.freeze({evidenceClass:'HYPOTHETICAL',fidelity:'CONSERVATIVE_FAIL_CLOSED',validityDomain:'P5 Environment v2 plus explicit conformance vectors',unsupportedInputs:'missing viable medium or usable energy',extrapolationPolicy:'NONE'}),
 energy:Object.freeze({evidenceClass:'FORMAL',fidelity:'BOUNDED_MODEL',validityDomain:'declared integer model units only',unsupportedInputs:'unquantified source energy',extrapolationPolicy:'NONE'}),
 trophic:Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'APPROXIMATE',validityDomain:'energy transfer ceiling',unsupportedInputs:'unquantified transfer efficiency',extrapolationPolicy:'EFFICIENCY_NEVER_EXCEEDS_INPUT'}),
 niche:Object.freeze({evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED',validityDomain:'functional niche descriptors',unsupportedInputs:'morphological prediction',extrapolationPolicy:'NONE'}),
 semanticLod:Object.freeze({evidenceClass:'FORMAL',fidelity:'INVARIANT',validityDomain:'MACRO_MESO_MICRO refinement',unsupportedInputs:'contradictory refinement',extrapolationPolicy:'REJECT'})
});
const MANIFEST=Object.freeze({
 semanticManifestVersion:1n,canonicalProtocolVersion:'ofu-cbv-1',canonicalAddressVersion:1n,unicodeProfileVersion:'ofu-unicode-15.1.0-v1',numericContractVersion:1n,
 generatorSuite:'p6-biosphere-evolution',generatorSuiteVersion:1n,
 subsystems:Object.freeze({biosphere:1n,ecology:1n,evolution:1n,semanticLod:1n}),domains:Object.freeze({biosphere:1n,ecology:1n,evolution:1n}),
 dependencies:Object.freeze({p2:'ofu-cbv-1',astronomy:'p3-astronomy-1',temporal:'ofu-p4-temporal-v1',planetPhysical:'ofu-p5-planet-physical-v1',planetEnvironment:P5_ENV_CONTRACT}),
 lawProfile:'p6-bounded-energy-trophic-v1',
 genesis:Object.freeze({schemaVersion:SCHEMA_VERSION,modelVersion:VERSION,contractId:CONTRACT_ID,identityPolicy:IDENTITY_POLICY,numericContract:NUMERIC_CONTRACT,evidencePolicy:EVIDENCE_POLICY,semanticLodProfile:LOD_PROFILE,transitionContract:TRANSITION_ID,transitionVersion:TRANSITION_VERSION})
});
P.validateSemanticManifest(MANIFEST);
function fail(m){throw new Error('OFU P6 v1: '+m)}
function hex(v){return P.hex(v)}
function bytes32(v,n){if(!(v instanceof Uint8Array)||v.length!==32)fail(n+' must be 32 bytes');return new Uint8Array(v)}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64 BigInt');return v}
function ppm(v,n){v=u64(v,n);if(v>PPM)fail(n+' exceeds 1,000,000 ppm');return v}
function mulPpmFloor(v,f,n){v=u64(v,n+' value');f=ppm(f,n+' factor');const r=v*f/PPM;if(r>U64_MAX)fail(n+' overflow');return r}
function manifestHash(){return P.semanticManifestHash(MANIFEST)}
function exactP5(){if(P5E.CONTRACT_ID!==P5_ENV_CONTRACT||P5E.SCHEMA_VERSION!==P5_ENV_VERSION||P5E.VERSION!==P5_ENV_MODEL||P5E.AUTHORITY!==P5_ENV_AUTHORITY)fail('runtime P5 Environment v2 dependency mismatch')}
function epistemic(x,status){return !!x&&typeof x==='object'&&x.epistemicStatus===status}
function classifyEnvironmentEvidence({unknown=[],unsupported=[],insolationKnown=false}){
 if(!Array.isArray(unknown)||!Array.isArray(unsupported))fail('environment evidence lists required');
 if(unknown.length>0||insolationKnown!==true)return STATES.INSUFFICIENT_ENVIRONMENT;
 if(unsupported.length>0)return STATES.UNSUPPORTED_ENVIRONMENT;
 return STATES.NO_BIOSPHERE;
}
function adaptEnvironment(input){
 exactP5();if(!input||typeof input!=='object')fail('P5 Environment v2 projection required');
 if(input.contractId!==P5_ENV_CONTRACT||input.version!==P5_ENV_VERSION||input.modelVersion!==P5_ENV_MODEL||input.authority!==P5_ENV_AUTHORITY)fail('unsupported P5 Environment contract/version/authority');
 const planetId=bytes32(input.planetId,'planetId');
 if(!Array.isArray(input.epistemicVocabulary)||!['KNOWN','DERIVED','HYPOTHETICAL_MODEL_VALUE','UNKNOWN','UNSUPPORTED'].every(x=>input.epistemicVocabulary.includes(x)))fail('P5 epistemic vocabulary mismatch');
 if(!input.temporal||input.temporal.canonicalTimeOwner!=='P4'||input.temporal.privateClock!==false)fail('P5 temporal authority mismatch');
 const unsupported=[];for(const [k,v] of [['waterPhase',input.waterPhase],['xuvEvolution',input.xuvEvolution],['atmosphericEscapeHistory',input.atmosphericEscapeHistory],['geologicalActivity',input.geologicalActivity],['geochemicalEnergyAvailability',input.geochemicalEnergyAvailability],['oceanAreaFraction',input.oceanAreaFraction]])if(epistemic(v,'UNSUPPORTED'))unsupported.push(k);
 const unknown=[];if(epistemic(input.atmosphere,'UNKNOWN'))unknown.push('atmosphere');if(epistemic(input.pressure,'UNKNOWN'))unknown.push('pressure');if(input.radiativeTier0&&epistemic(input.radiativeTier0.bondAlbedo,'UNKNOWN'))unknown.push('bondAlbedo');
 const insolationKnown=!!input.radiativeTier0&&epistemic(input.radiativeTier0.insolation,'KNOWN');
 const state=classifyEnvironmentEvidence({unknown,unsupported,insolationKnown});
 return Object.freeze({adapterVersion:'p6-p5-environment-v2-adapter-1',planetId,source:Object.freeze({contractId:input.contractId,version:input.version,modelVersion:input.modelVersion,authority:input.authority,semanticManifestHash:bytes32(input.semanticManifestHash,'P5 semanticManifestHash')}),state,unknown:Object.freeze(unknown),unsupported:Object.freeze(unsupported),canonicalInput:input});
}
function eligibility(env){
 if(!env||env.adapterVersion!=='p6-p5-environment-v2-adapter-1')fail('adapted canonical environment required');
 if(env.state===STATES.INSUFFICIENT_ENVIRONMENT)return Object.freeze({state:STATES.INSUFFICIENT_ENVIRONMENT,planetId:env.planetId,canGenerateBiosphere:false,reason:'CANONICAL_ENVIRONMENT_INSUFFICIENT',unknown:env.unknown,unsupported:env.unsupported,evidence:EVIDENCE.eligibility});
 if(env.state===STATES.UNSUPPORTED_ENVIRONMENT)return Object.freeze({state:STATES.UNSUPPORTED_ENVIRONMENT,planetId:env.planetId,canGenerateBiosphere:false,reason:'CANONICAL_ENVIRONMENT_OUTSIDE_P6_V1_SUPPORTED_DOMAIN',unknown:env.unknown,unsupported:env.unsupported,evidence:EVIDENCE.eligibility});
 return Object.freeze({state:STATES.NO_BIOSPHERE,planetId:env.planetId,canGenerateBiosphere:false,reason:'NO_CANONICAL_P6_GENESIS_TRIGGER',unknown:env.unknown,unsupported:env.unsupported,evidence:EVIDENCE.eligibility});
}
function normativeSupportedVector(v){
 if(!v||v.contractId!=='ofu-p6-normative-environment-vector-v1'||v.authority!=='P6_CONFORMANCE_ONLY'||v.version!==1n)fail('P6 normative conformance vector required');
 const planetId=bytes32(v.planetId,'normative planetId'),medium=String(v.viableMedium||'');if(!['LIQUID_MEDIUM','SURFACE','SUBSURFACE','ATMOSPHERIC'].includes(medium))fail('normative viable medium unsupported');
 const photo=u64(v.phototrophicUsableEnergyU,'phototrophic energy'),chem=v.chemotrophicUsableEnergyU===null?null:u64(v.chemotrophicUsableEnergyU,'chemotrophic energy');
 if(photo===0n&&(!chem||chem===0n))return Object.freeze({state:STATES.NO_BIOSPHERE,planetId,canGenerateBiosphere:false,medium,energySource:ENERGY_SOURCES.UNKNOWN,primaryProductivityCeilingU:0n,sustainableBiomassCeilingU:0n});
 const photoCapture=ppm(v.phototrophicCaptureEfficiencyPpm,'phototrophic capture efficiency'),chemCapture=chem===null?null:ppm(v.chemotrophicCaptureEfficiencyPpm,'chemotrophic capture efficiency');
 const ppPhoto=mulPpmFloor(photo,photoCapture,'phototrophic productivity'),ppChem=chem===null?0n:mulPpmFloor(chem,chemCapture,'chemotrophic productivity');const total=ppPhoto+ppChem;if(total>U64_MAX)fail('primary productivity overflow');
 const biomassFactor=ppm(v.biomassSupportEfficiencyPpm,'biomass support efficiency'),biomass=mulPpmFloor(total,biomassFactor,'biomass support');
 const source=ppPhoto>0n&&ppChem>0n?ENERGY_SOURCES.MIXED:ppChem>0n?ENERGY_SOURCES.CHEMOTROPHIC:ENERGY_SOURCES.PHOTOTROPHIC;
 return Object.freeze({state:STATES.BIOSPHERE_SUPPORTED,planetId,canGenerateBiosphere:true,medium,energySource:source,phototrophicPrimaryProductivityU:ppPhoto,chemotrophicPrimaryProductivityU:ppChem,primaryProductivityCeilingU:total,sustainableBiomassCeilingU:biomass,evidence:EVIDENCE.energy});
}
function bindings({masterSeed,canonicalUniverseIdentity}){
 const seed=bytes32(masterSeed,'masterSeed'),uid=bytes32(canonicalUniverseIdentity,'canonicalUniverseIdentity'),mh=manifestHash();
 function address(planetId,kind,index){return P.address([{kind:'namespace',value:'p6.canonical.v1'},{kind:'bytes',value:bytes32(planetId,'planetId')},{kind:'namespace',value:kind},{kind:'u64',value:u64(BigInt(index),'index')}])}
 function draw(planetId,kind,index,property){return P.derive({masterSeed:seed,semanticManifestHash:mh,domain:'ofu.p6.biosphere.v1',addressBytes:address(planetId,kind,index),property,counter:0n})}
 function entity(namespace,stableKey){return P.entityIdentity(uid,namespace,stableKey)}
 return Object.freeze({manifestHash:mh,canonicalUniverseIdentity:uid,address,draw,entity});
}
function idsForPlanet(b,planetId,{lineageOrdinal=0n,speciesOrdinal=0n}={}){planetId=bytes32(planetId,'planetId');lineageOrdinal=u64(lineageOrdinal,'lineageOrdinal');speciesOrdinal=u64(speciesOrdinal,'speciesOrdinal');const biosphereId=b.entity('p6.biosphere',{planetId,identityPolicy:IDENTITY_POLICY}),lineageId=b.entity('p6.lineage',{biosphereId,lineageOrdinal,identityPolicy:IDENTITY_POLICY}),speciesId=b.entity('p6.species',{lineageId,speciesOrdinal,identityPolicy:IDENTITY_POLICY});return Object.freeze({biosphereId,lineageId,speciesId})}
function transferCeilings(primaryU,efficienciesPpm){let current=u64(primaryU,'primary productivity');if(!Array.isArray(efficienciesPpm)||efficienciesPpm.length>8)fail('transfer efficiencies invalid');const out=[Object.freeze({level:0n,energyCeilingU:current,transferEfficiencyPpm:PPM})];for(let i=0;i<efficienciesPpm.length;i++){const e=ppm(efficienciesPpm[i],'transfer efficiency');current=mulPpmFloor(current,e,'trophic transfer');out.push(Object.freeze({level:BigInt(i+1),energyCeilingU:current,transferEfficiencyPpm:e}))}return Object.freeze(out)}
function macroFromSupported(s,b){if(!s||s.state!==STATES.BIOSPHERE_SUPPORTED||!s.canGenerateBiosphere)fail('supported environment required');const id=idsForPlanet(b,s.planetId);const d=b.draw(s.planetId,'biosphere',0n,'macro.transfer');const e1=70000n+BigInt(d[0])*200n,e2=50000n+BigInt(d[1])*150n;const trophic=transferCeilings(s.primaryProductivityCeilingU,[e1,e2]);return Object.freeze({level:'MACRO',planetId:new Uint8Array(s.planetId),biosphereId:id.biosphereId,identityPolicy:IDENTITY_POLICY,modelVersion:VERSION,semanticManifestHash:new Uint8Array(b.manifestHash),commitments:Object.freeze({viableMedium:s.medium,energySource:s.energySource,primaryProductivityCeilingU:s.primaryProductivityCeilingU,sustainableBiomassCeilingU:s.sustainableBiomassCeilingU,maxTrophicLevel:BigInt(trophic.length-1)}),trophic,evidence:Object.freeze({energy:EVIDENCE.energy,trophic:EVIDENCE.trophic,semanticLod:EVIDENCE.semanticLod})})}
function mesoRefine(macro,b,{lineageOrdinals=[0n],speciesPerLineage=2n}={}){if(!macro||macro.level!=='MACRO')fail('macro required');speciesPerLineage=u64(speciesPerLineage,'speciesPerLineage');if(speciesPerLineage>16n)fail('speciesPerLineage bound');const lineages=[],species=[];for(const raw of lineageOrdinals){const lo=u64(BigInt(raw),'lineage ordinal'),ids=idsForPlanet(b,macro.planetId,{lineageOrdinal:lo});lineages.push(Object.freeze({lineageId:ids.lineageId,biosphereId:macro.biosphereId,lineageOrdinal:lo,viableMedium:macro.commitments.viableMedium,energySource:macro.commitments.energySource,energyCeilingU:macro.commitments.primaryProductivityCeilingU}));for(let so=0n;so<speciesPerLineage;so++){const q=idsForPlanet(b,macro.planetId,{lineageOrdinal:lo,speciesOrdinal:so});species.push(Object.freeze({speciesId:q.speciesId,lineageId:q.lineageId,speciesOrdinal:so,viableMedium:macro.commitments.viableMedium,trophicRole:so%2n===0n?'PRIMARY_PRODUCER':'CONSUMER',energyCeilingU:so%2n===0n?macro.commitments.primaryProductivityCeilingU:macro.trophic[macro.trophic.length>1?1:0].energyCeilingU,evidence:EVIDENCE.niche}))}}return Object.freeze({level:'MESO',planetId:macro.planetId,biosphereId:macro.biosphereId,lineages:Object.freeze(lineages),species:Object.freeze(species)})}
function microRefine(macro,species,ordinal=0n){ordinal=u64(BigInt(ordinal),'micro ordinal');if(!species||species.viableMedium!==macro.commitments.viableMedium||species.energyCeilingU>macro.commitments.primaryProductivityCeilingU)fail('contradictory micro refinement');return Object.freeze({level:'MICRO',persistent:false,individualIdentityPromoted:false,planetId:macro.planetId,biosphereId:macro.biosphereId,lineageId:species.lineageId,speciesId:species.speciesId,ordinal,viableMedium:species.viableMedium,trophicRole:species.trophicRole,energyCeilingU:species.energyCeilingU})}
function assertLod(macro,meso,micro=null){if(!macro||!meso||hex(macro.planetId)!==hex(meso.planetId)||hex(macro.biosphereId)!==hex(meso.biosphereId))return false;for(const l of meso.lineages)if(l.viableMedium!==macro.commitments.viableMedium||l.energyCeilingU>macro.commitments.primaryProductivityCeilingU)return false;for(const s of meso.species)if(s.viableMedium!==macro.commitments.viableMedium||s.energyCeilingU>macro.commitments.primaryProductivityCeilingU)return false;if(micro&&(micro.viableMedium!==macro.commitments.viableMedium||micro.energyCeilingU>macro.commitments.primaryProductivityCeilingU))return false;return true}
function p6Entity(state,id){const k=hex(id);return state.entities[k]||(state.entities[k]=Object.create(null))}
function expectPayload(event,keys){const p=event.descriptor.payload;if(!p||typeof p!=='object'||Array.isArray(p))fail('biological event payload invalid');const got=Object.keys(p).sort(),want=[...keys].sort();if(got.length!==want.length||got.some((x,i)=>x!==want[i]))fail('biological event payload fields invalid');return p}
const reducers=new Map();
reducers.set('p6.biosphere.genesis@1',(state,event)=>{const p=expectPayload(event,['biosphereId','planetId','environmentState','modelVersion','manifestHash','identityPolicy']);const id=bytes32(p.biosphereId,'biosphereId');if(p.environmentState!==STATES.BIOSPHERE_SUPPORTED||p.modelVersion!==VERSION||p.identityPolicy!==IDENTITY_POLICY||hex(bytes32(p.manifestHash,'manifestHash'))!==hex(manifestHash()))fail('genesis contract mismatch');const e=p6Entity(state,id);if(e.kind&&e.kind!=='P6_BIOSPHERE')fail('entity kind collision');Object.assign(e,{kind:'P6_BIOSPHERE',status:'ACTIVE',biosphereId:id,planetId:bytes32(p.planetId,'planetId'),modelVersion:VERSION,manifestHash:bytes32(p.manifestHash,'manifestHash'),identityPolicy:IDENTITY_POLICY})});
reducers.set('p6.speciation@1',(state,event)=>{const p=expectPayload(event,['speciesId','lineageId','biosphereId']);const s=p6Entity(state,bytes32(p.speciesId,'speciesId'));if(s.kind)fail('species already exists');Object.assign(s,{kind:'P6_SPECIES',status:'EXTANT',speciesId:bytes32(p.speciesId,'speciesId'),lineageId:bytes32(p.lineageId,'lineageId'),biosphereId:bytes32(p.biosphereId,'biosphereId')})});
reducers.set('p6.extinction@1',(state,event)=>{const p=expectPayload(event,['speciesId']);const s=p6Entity(state,bytes32(p.speciesId,'speciesId'));if(s.kind!=='P6_SPECIES'||s.status!=='EXTANT')fail('extinction requires extant species');s.status='EXTINCT'});
const TRANSITION_CONTRACT=P4.createTransitionContract({contractId:TRANSITION_ID,semanticVersion:TRANSITION_VERSION,eventFamilies:['p6.biosphere.genesis@1','p6.speciation@1','p6.extinction@1'],reducers});
const OWNERSHIP=Object.freeze({privateClock:false,ownsOrdering:false,ownsEventIdentity:false,ownsReplay:false,ownsCheckpoints:false,ownsCompaction:false,ownsLineage:false});
function renderingProjection(x){if(!x)return Object.freeze({presentationOnly:true,state:STATES.INSUFFICIENT_ENVIRONMENT});if(x.state===STATES.INSUFFICIENT_ENVIRONMENT||x.state===STATES.UNSUPPORTED_ENVIRONMENT||x.state===STATES.NO_BIOSPHERE)return Object.freeze({presentationOnly:true,state:x.state,planetId:x.planetId||null,biologyEstablished:false});if(x.level!=='MACRO')fail('macro rendering projection required');return Object.freeze({presentationOnly:true,state:STATES.BIOSPHERE_SUPPORTED,planetId:x.planetId,biosphereId:x.biosphereId,biologyEstablished:true,viableMedium:x.commitments.viableMedium,energySource:x.commitments.energySource,maxTrophicLevel:x.commitments.maxTrophicLevel,primaryProductivityCeilingU:x.commitments.primaryProductivityCeilingU})}
O.p6Biosphere=Object.freeze({VERSION,SCHEMA_VERSION,CONTRACT_ID,P5_ENV_CONTRACT,P5_ENV_VERSION,P5_ENV_MODEL,P5_ENV_AUTHORITY,IDENTITY_POLICY,TRANSITION_ID,TRANSITION_VERSION,NUMERIC_CONTRACT,EVIDENCE_POLICY,LOD_PROFILE,U64_MAX,PPM,STATES,ENERGY_SOURCES,EVIDENCE,MANIFEST,OWNERSHIP,TRANSITION_CONTRACT,manifestHash,classifyEnvironmentEvidence,adaptEnvironment,eligibility,normativeSupportedVector,bindings,idsForPlanet,transferCeilings,macroFromSupported,mesoRefine,microRefine,assertLod,renderingProjection});
})(typeof globalThis!=='undefined'?globalThis:this);