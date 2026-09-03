// P6 WAVE 2 BIOSPHERE & EVOLUTION RESEARCH — NON-CANONICAL
// Consumes the frozen canonical P5->P6 boundary without inventing missing environment.
// Rich ecology is available only through an explicitly P5_RESEARCH_DRAFT extension.

export const P6_MODEL_VERSION='p6-biosphere-research-v0.2';
export const P6_ADAPTER_VERSION='p6-p5-environment-adapter-v2';
export const P5_CANONICAL_ENV_CONTRACT='ofu-p5-p6-environment-v1';
export const P5_CANONICAL_ENV_VERSION=1n;
export const P5_CANONICAL_AUTHORITY='P5_CANONICAL_FROZEN';
export const P5_PHYSICAL_CONTRACT='ofu-p5-planet-physical-v1';
export const P5_MODEL_VERSION='p5-planet-physical-1';
export const P5_TERRAIN_VERSION='p5-cube-sphere-topology-1';
export const P5_RESEARCH_ENV_VERSION='p6-environment-research-v0.2';
export const P5_RESEARCH_AUTHORITY='P5_RESEARCH_DRAFT';
export const P6_IDENTITY_POLICY='P6_IDENTITY_MODEL_A_RESEARCH_V1';

export const P6_STATES=Object.freeze({
  SUPPORTED:'SUPPORTED',
  INSUFFICIENT_ENVIRONMENT:'INSUFFICIENT_ENVIRONMENT',
  UNSUPPORTED_ENVIRONMENT:'UNSUPPORTED_ENVIRONMENT',
  RESEARCH_EXTENSION_REQUIRED:'RESEARCH_EXTENSION_REQUIRED',
  RESEARCH_ONLY:'RESEARCH_ONLY'
});

export const P6_EVIDENCE=Object.freeze({
  canonicalBoundary:{evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',note:'Exact consumption of frozen P5 v1 projection; no environmental inference.'},
  gravityConstraint:{evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL',note:'For equal mass and geometry, static weight scales monotonically with surface gravity; no organism shape is predicted.'},
  productivity:{evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'STYLIZED',note:'Research-only causal bounded productivity proxy; not an extraterrestrial NPP prediction.'},
  trophicTransfer:{evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',note:'Energy cannot increase through consumer transfers; efficiency values remain stylized.'},
  nicheAssembly:{evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED',note:'Functional-space grammar, not a biome lookup table.'},
  morphology:{evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED',note:'Research-only functional trait constraints, not predicted alien morphology.'},
  heredity:{evidenceClass:'HYPOTHETICAL',modelFidelity:'METAPHORICAL',note:'Compact heritable generative code, not molecular genetics.'},
  evolution:{evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'STYLIZED',note:'Directional pressure abstraction; P4 owns any accepted history.'},
  semanticLod:{evidenceClass:'FORMAL',modelFidelity:'FORMAL',note:'Executable consistency contract between macro commitments and later refinement.'}
});

export const P6_SEMANTIC_MANIFEST=Object.freeze({
  semanticManifestVersion:1n,
  canonicalProtocolVersion:'ofu-cbv-1',
  canonicalAddressVersion:1n,
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1',
  numericContractVersion:1n,
  generatorSuite:'p6-biosphere-research',
  generatorSuiteVersion:2n,
  subsystems:Object.freeze({biosphere:2n,ecology:2n,evolution:1n,semanticLod:2n}),
  domains:Object.freeze({biosphere:2n,ecology:2n,evolution:1n}),
  dependencies:Object.freeze({
    kernel:'p2',astronomy:'p3-astronomy-1',temporal:'ofu-p4-temporal-v1',
    planetPhysical:P5_PHYSICAL_CONTRACT,planetEnvironment:P5_CANONICAL_ENV_CONTRACT
  }),
  lawProfile:'p6-research-bounded-energy-lod-v2',
  genesis:Object.freeze({
    researchStatus:'NON_CANONICAL',environmentAdapter:P6_ADAPTER_VERSION,
    identityPolicy:P6_IDENTITY_POLICY,evidencePolicy:'p6-evidence-fidelity-v1'
  })
});

export const P6_NUMERIC_CANDIDATES=Object.freeze({
  suitabilityPpm:Object.freeze({storage:'u32',unit:'ppm',range:Object.freeze([0n,1000000n]),resolution:'1 ppm',rounding:'nearest ties-to-even on future fixed conversion',overflow:'reject',unsupported:'separate status'}),
  transferEfficiencyPpm:Object.freeze({storage:'u32',unit:'ppm',range:Object.freeze([0n,1000000n]),resolution:'1 ppm',rounding:'nearest ties-to-even',overflow:'reject',unsupported:'separate status'}),
  productivityBudgetU:Object.freeze({storage:'u64',unit:'research energy unit',range:Object.freeze([0n,18446744073709551615n]),resolution:'1 unit',rounding:'integer floor only after declared fixed multiplication',overflow:'reject',unsupported:'separate status'}),
  populationSummary:Object.freeze({storage:'u64-or-log10-milli research candidate',unit:'individuals or log10(individuals)*1000',range:'TBD_BY_CALIBRATION',resolution:'TBD_BY_CALIBRATION',rounding:'explicit per representation',overflow:'reject',unsupported:'separate status'}),
  environmentalSuitability:Object.freeze({storage:'u32',unit:'ppm',range:Object.freeze([0n,1000000n]),resolution:'1 ppm',rounding:'nearest ties-to-even',overflow:'reject',unsupported:'separate status'})
});

const ppm=(x)=>Math.max(0,Math.min(1000000,Math.round(x)));
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const q=(x,scale=1000)=>Math.round(Number(x)*scale);
const hex=(bytes)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
function assertObject(v,name){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error(`${name} must be an object`)}
function assertFinite(v,name){if(!Number.isFinite(Number(v)))throw new Error(`${name} must be finite`);return Number(v)}
function assertInt(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new Error(`${name} outside range`);return v}
function assertBigPositive(v,name){if(typeof v!=='bigint'||v<=0n)throw new Error(`${name} must be positive bigint`);return v}
function idBytes(v,name){if(!(v instanceof Uint8Array)||v.length!==32)throw new Error(`${name} must be a 32-byte P2 identity`);return new Uint8Array(v)}
function sameId(a,b){return a instanceof Uint8Array&&b instanceof Uint8Array&&hex(a)===hex(b)}
function freezeArray(a){return Object.freeze(a.map(x=>Object.freeze(x)))}

export function semanticManifestHash(p2){
  if(!p2||typeof p2.semanticManifestHash!=='function')throw new Error('P2 semantic manifest API required');
  return p2.semanticManifestHash(P6_SEMANTIC_MANIFEST);
}

// P5 v1 does not carry an authority field in the projection itself. This envelope records
// call-site provenance and proves the caller is using the expected frozen P5 runtime constants.
export function canonicalP5SourceEnvelope(p5,projection){
  if(!p5||p5.PHYSICAL_CONTRACT!==P5_PHYSICAL_CONTRACT||p5.P6_ENV_CONTRACT!==P5_CANONICAL_ENV_CONTRACT||p5.VERSION!==P5_MODEL_VERSION||p5.TERRAIN_TOPOLOGY_VERSION!==P5_TERRAIN_VERSION)throw new Error('unexpected canonical P5 runtime');
  return Object.freeze({
    authority:P5_CANONICAL_AUTHORITY,
    sourceModelVersion:p5.VERSION,
    sourcePhysicalContract:p5.PHYSICAL_CONTRACT,
    sourceTerrainTopologyVersion:p5.TERRAIN_TOPOLOGY_VERSION,
    projection
  });
}

export function adaptP5EnvironmentV1(envelope){
  assertObject(envelope,'canonical P5 source envelope');
  if(envelope.authority!==P5_CANONICAL_AUTHORITY)throw new Error('canonical P5 authority mismatch');
  if(envelope.sourceModelVersion!==P5_MODEL_VERSION||envelope.sourcePhysicalContract!==P5_PHYSICAL_CONTRACT||envelope.sourceTerrainTopologyVersion!==P5_TERRAIN_VERSION)throw new Error('canonical P5 provenance mismatch');
  const input=envelope.projection;assertObject(input,'P5 projection');
  if(input.contractId!==P5_CANONICAL_ENV_CONTRACT)throw new Error('unsupported canonical P5->P6 contract');
  if(input.version!==P5_CANONICAL_ENV_VERSION)throw new Error('unsupported canonical P5->P6 version');
  if(!['PARTIAL','UNSUPPORTED'].includes(input.status))throw new Error('unexpected canonical P5->P6 status');
  const planetId=input.planetId==null?null:idBytes(input.planetId,'planetId');
  if(input.status==='UNSUPPORTED')return Object.freeze({
    adapterVersion:P6_ADAPTER_VERSION,mode:'CANONICAL_UPSTREAM_MINIMUM',state:P6_STATES.UNSUPPORTED_ENVIRONMENT,
    planetId,source:Object.freeze({contractId:input.contractId,version:input.version,authority:envelope.authority,modelVersion:envelope.sourceModelVersion}),
    reason:String(input.reason||'P5_UNSUPPORTED'),provenance:Object.freeze({p5Owned:true,p6Reroll:false})
  });
  if(!planetId)throw new Error('PARTIAL P5 projection must preserve planet identity');
  assertBigPositive(input.meanRadiusM,'meanRadiusM');assertBigPositive(input.gravityMicroMs2,'gravityMicroMs2');assertBigPositive(input.meanDensityKgM3,'meanDensityKgM3');
  assertObject(input.terrain,'terrain');
  if(input.terrain.topologyVersion!==P5_TERRAIN_VERSION)throw new Error('canonical terrain topology mismatch');
  if(input.pressurePa!==null||input.temperatureEnvelopeK!==null)throw new Error('P5 v1 unsupported scalar fields changed without contract version');
  if(input.waterVolatileRegime!=='UNSUPPORTED'||input.radiationEscapeDiagnostics!=='UNSUPPORTED'||input.geologicalActivity!=='UNSUPPORTED'||input.terrain.physicalElevationScale!=='UNSUPPORTED'||input.terrain.oceanMacroConstraints!=='UNSUPPORTED')throw new Error('P5 v1 unsupported markers changed without contract version');
  return Object.freeze({
    adapterVersion:P6_ADAPTER_VERSION,mode:'CANONICAL_UPSTREAM_MINIMUM',state:P6_STATES.INSUFFICIENT_ENVIRONMENT,
    planetId,
    source:Object.freeze({contractId:input.contractId,version:input.version,authority:envelope.authority,modelVersion:envelope.sourceModelVersion,physicalContract:envelope.sourcePhysicalContract}),
    physical:Object.freeze({meanRadiusM:input.meanRadiusM,gravityMicroMs2:input.gravityMicroMs2,meanDensityKgM3:input.meanDensityKgM3,terrainTopologyVersion:input.terrain.topologyVersion}),
    unsupported:Object.freeze({pressurePa:null,temperatureEnvelopeK:null,waterVolatileRegime:'UNSUPPORTED',radiationEscapeDiagnostics:'UNSUPPORTED',physicalElevationScale:'UNSUPPORTED',oceanMacroConstraints:'UNSUPPORTED',geologicalActivity:'UNSUPPORTED'}),
    provenance:Object.freeze({p5Owned:true,p6Reroll:false,unsupportedPreserved:true})
  });
}

export function evaluateCanonicalMinimum(env){
  if(!env||env.adapterVersion!==P6_ADAPTER_VERSION||env.mode!=='CANONICAL_UPSTREAM_MINIMUM')throw new Error('canonical P6 environment adapter output required');
  if(env.state===P6_STATES.UNSUPPORTED_ENVIRONMENT)return Object.freeze({mode:env.mode,state:P6_STATES.UNSUPPORTED_ENVIRONMENT,planetId:env.planetId,canGenerateBiosphere:false,reason:env.reason});
  return Object.freeze({
    mode:env.mode,state:P6_STATES.INSUFFICIENT_ENVIRONMENT,planetId:env.planetId,canGenerateBiosphere:false,
    physicalConstraints:Object.freeze({
      meanRadiusM:env.physical.meanRadiusM,gravityMicroMs2:env.physical.gravityMicroMs2,meanDensityKgM3:env.physical.meanDensityKgM3,
      terrainTopologyVersion:env.physical.terrainTopologyVersion,
      gravityMorphologyConstraint:'FOR_EQUAL_MASS_AND_GEOMETRY_STATIC_WEIGHT_SCALES_MONOTONICALLY_WITH_SURFACE_GRAVITY'
    }),
    viability:Object.freeze({status:P6_STATES.INSUFFICIENT_ENVIRONMENT,reasons:Object.freeze(['TEMPERATURE_UNSUPPORTED','PRESSURE_UNSUPPORTED','VOLATILE_MEDIUM_UNSUPPORTED','RADIATION_ESCAPE_UNSUPPORTED','GEOLOGY_UNSUPPORTED'])}),
    energySources:Object.freeze({PHOTOTROPHIC:'UNSUPPORTED',CHEMOTROPHIC:'UNSUPPORTED',MIXED:'UNSUPPORTED',UNKNOWN:'CURRENT'}),
    nextState:P6_STATES.RESEARCH_EXTENSION_REQUIRED,evidence:P6_EVIDENCE.gravityConstraint
  });
}

export function adaptP5ResearchExtensionV02(input){
  assertObject(input,'P5 research extension');
  if(input.version!==P5_RESEARCH_ENV_VERSION)throw new Error('unsupported P5 research extension version');
  if(input.authority!==P5_RESEARCH_AUTHORITY)throw new Error('P5 research extension authority mismatch');
  const planetId=idBytes(input.planetId,'research extension planetId');
  for(const k of ['energy','temperature','atmosphere','solvent','geology','terrain','radiation'])assertObject(input[k],k);
  const baselineInsolationPpm=assertInt(Number(input.energy.baselineInsolationPpm),'baselineInsolationPpm',0,Number.MAX_SAFE_INTEGER);
  const meanK=assertFinite(input.temperature.meanK,'temperature.meanK');
  const minSeasonalK=assertFinite(input.temperature.minSeasonalK,'temperature.minSeasonalK');
  const maxSeasonalK=assertFinite(input.temperature.maxSeasonalK,'temperature.maxSeasonalK');
  const highLatitudeSeasonalityK=assertFinite(input.temperature.highLatitudeSeasonalityK,'temperature.highLatitudeSeasonalityK');
  const pressurePa=input.atmosphere.pressurePa===null?null:Math.round(assertFinite(input.atmosphere.pressurePa,'atmosphere.pressurePa'));
  const columnEquivalentPressurePa=Math.round(assertFinite(input.atmosphere.columnEquivalentPressurePa,'atmosphere.columnEquivalentPressurePa'));
  const oceanFractionPpm=assertInt(Number(input.terrain.oceanFractionPpm),'terrain.oceanFractionPpm',0,1000000);
  const reliefScaleM=assertInt(Number(input.terrain.reliefScaleM),'terrain.reliefScaleM',0,100000000);
  const activityProxy=assertFinite(input.geology.activityProxy,'geology.activityProxy');
  const xuvFractionProxy=assertFinite(input.radiation.xuvFractionProxy,'radiation.xuvFractionProxy');
  const chemistry=input.chemistry&&input.chemistry.usableChemicalEnergyProxyPpm!=null?Object.freeze({usableChemicalEnergyProxyPpm:assertInt(Number(input.chemistry.usableChemicalEnergyProxyPpm),'usableChemicalEnergyProxyPpm',0,1000000)}):null;
  return Object.freeze({
    adapterVersion:'p6-p5-research-extension-adapter-v2',sourceVersion:input.version,sourceAuthority:input.authority,planetId,
    environmentalEpochRef:input.environmentalEpochRef??null,spatialRef:input.spatialRef??null,
    energy:Object.freeze({baselineInsolationPpm}),
    temperature:Object.freeze({meanK:q(meanK),minSeasonalK:q(minSeasonalK),maxSeasonalK:q(maxSeasonalK),highLatitudeSeasonalityK:q(highLatitudeSeasonalityK)}),
    atmosphere:Object.freeze({pressurePa,columnEquivalentPressurePa,pressureInterpretation:String(input.atmosphere.pressureInterpretation),heavyGasRetentionPpm:ppm(assertFinite(input.atmosphere.heavyGasRetentionProxy,'heavyGasRetentionProxy')*1e6),xuvEscapeKgS:q(assertFinite(input.atmosphere.xuvEscapeKgS,'xuvEscapeKgS'),1000)}),
    solvent:Object.freeze({surfaceWaterRegime:String(input.solvent.surfaceWaterRegime),deepWaterRegime:String(input.solvent.deepWaterRegime)}),
    geology:Object.freeze({activityPpm:ppm(activityProxy/1.5*1e6),regimeProxy:String(input.geology.regimeProxy)}),
    terrain:Object.freeze({oceanFractionPpm,reliefScaleM}),radiation:Object.freeze({xuvFractionPpb:Math.max(0,Math.round(xuvFractionProxy*1e9))}),chemistry
  });
}

export function composeResearchEnvironment(canonicalEnv,researchExtension){
  if(!canonicalEnv||canonicalEnv.adapterVersion!==P6_ADAPTER_VERSION||canonicalEnv.state!==P6_STATES.INSUFFICIENT_ENVIRONMENT)throw new Error('canonical partial P5 environment required');
  if(!researchExtension||researchExtension.adapterVersion!=='p6-p5-research-extension-adapter-v2')throw new Error('adapted P5 research extension required');
  if(!sameId(canonicalEnv.planetId,researchExtension.planetId))throw new Error('research extension planet identity mismatch');
  return Object.freeze({
    adapterVersion:'p6-composed-environment-v2',mode:'RESEARCH_ENVIRONMENT_EXTENSION',state:P6_STATES.RESEARCH_ONLY,
    planetId:new Uint8Array(canonicalEnv.planetId),canonical:canonicalEnv,research:researchExtension,
    provenance:Object.freeze({canonicalAuthority:P5_CANONICAL_AUTHORITY,researchAuthority:P5_RESEARCH_AUTHORITY,canonicalFieldsOverrideResearch:true,p6Reroll:false})
  });
}

export function createP2BiosphereBindings({p2,masterSeed,p6SemanticManifestHash,canonicalUniverseIdentity}){
  if(!p2||typeof p2.derive!=='function'||typeof p2.entityIdentity!=='function'||typeof p2.address!=='function')throw new Error('P2 canonical API required');
  const seed=idBytes(masterSeed,'masterSeed'),mh=idBytes(p6SemanticManifestHash,'p6SemanticManifestHash'),uid=idBytes(canonicalUniverseIdentity,'canonicalUniverseIdentity');
  function address(planetId,kind,index=0n,extra=null){
    const pid=idBytes(planetId,'planetId');
    const segments=[{kind:'namespace',value:'p6.research.v2'},{kind:'bytes',value:pid},{kind:'namespace',value:kind},{kind:'u64',value:BigInt(index)}];
    if(extra!==null)segments.push({kind:'namespace',value:String(extra)});
    return p2.address(segments);
  }
  function drawU32(planetId,kind,index,property,counter=0n){
    const bytes=p2.derive({masterSeed:seed,semanticManifestHash:mh,domain:'ofu.p6.biosphere.research.v2',addressBytes:address(planetId,kind,index),property,counter});
    return (((bytes[0]<<24)>>>0)+(bytes[1]<<16)+(bytes[2]<<8)+bytes[3])>>>0;
  }
  function entity(namespace,stableKey){return p2.entityIdentity(uid,namespace,stableKey)}
  return Object.freeze({address,drawU32,entity,manifestHash:mh,canonicalUniverseIdentity:uid});
}

function temperatureSuitability(ext){const k=ext.temperature.meanK/1000;if(k<150||k>500)return 0;return ppm((1-Math.abs(k-288)/212)*1e6)}
function waterSuitability(ext){const r=ext.solvent.surfaceWaterRegime;if(r==='LIQUID_SURFACE_CAPABLE')return 1000000;if(r==='SURFACE_ICE_CAPABLE')return 420000;if(r==='SUPERCRITICAL_FLUID_CAPABLE')return 70000;if(r==='HOT_STEAM_VAPOR'||r==='STEAM_VAPOR_DOMINATED')return 100000;if(r==='LOW_PRESSURE_ICE_OR_VAPOR'||r==='LOW_PRESSURE_VAPOR')return 80000;if(r==='TRACE_OR_ABSENT')return 30000;if(r==='NO_DEFINED_SOLID_SURFACE')return 180000;return 50000}
function pressureSuitability(ext){const p=ext.atmosphere.pressurePa??ext.atmosphere.columnEquivalentPressurePa;if(!Number.isFinite(p)||p<=0)return 60000;const log=Math.log10(Math.max(1,p));return ppm((1-Math.min(1,Math.abs(log-5)/7))*1e6)}
function radiationSuitability(ext){return ppm(1e6/(1+ext.radiation.xuvFractionPpb/100000))}
function seasonalSuitability(ext){const amp=Math.max(0,ext.temperature.highLatitudeSeasonalityK/1000);return ppm(1e6/(1+amp/120))}
function insolationSuitability(ext){const s=ext.energy.baselineInsolationPpm;return ppm(1e6*(s/(s+350000)))}

export function productivityBudget(env){
  if(!env||env.mode!=='RESEARCH_ENVIRONMENT_EXTENSION'||env.state!==P6_STATES.RESEARCH_ONLY)throw new Error('research environment extension required for productivity research');
  const ext=env.research;
  const factors=Object.freeze({insolationPpm:insolationSuitability(ext),temperaturePpm:temperatureSuitability(ext),waterPpm:waterSuitability(ext),pressurePpm:pressureSuitability(ext),radiationPpm:radiationSuitability(ext),seasonalityPpm:seasonalSuitability(ext)});
  let product=1000000n;for(const v of Object.values(factors))product=product*BigInt(v)/1000000n;
  const phototrophicAvailableEnergyU=Number(product)*1000;
  const phototrophicPrimaryProductivityU=Math.floor(phototrophicAvailableEnergyU*0.42);
  const chem=ext.chemistry;
  const chemotrophicPrimaryProductivityU=chem?Math.floor(chem.usableChemicalEnergyProxyPpm*420):null;
  const primaryProductivityU=phototrophicPrimaryProductivityU+(chemotrophicPrimaryProductivityU??0);
  const sustainableBiomassU=Math.floor(primaryProductivityU*8);
  const energySources=Object.freeze({
    mode:chem?'MIXED':'PHOTOTROPHIC',
    PHOTOTROPHIC:Object.freeze({status:P6_STATES.RESEARCH_ONLY,availableEnergyU:phototrophicAvailableEnergyU,primaryProductivityU:phototrophicPrimaryProductivityU}),
    CHEMOTROPHIC:chem?Object.freeze({status:P6_STATES.RESEARCH_ONLY,primaryProductivityU:chemotrophicPrimaryProductivityU}):Object.freeze({status:P6_STATES.RESEARCH_EXTENSION_REQUIRED,primaryProductivityU:null}),
    MIXED:chem?P6_STATES.RESEARCH_ONLY:P6_STATES.RESEARCH_EXTENSION_REQUIRED,
    UNKNOWN:'SUPPORTED_AS_EPISTEMIC_STATE'
  });
  return Object.freeze({model:'P6_CAUSAL_ENERGY_PROXY_V0_2_RESEARCH',factors,energySources,primaryProductivityU,sustainableBiomassU,interpretation:'dimensionless bounded research units; not watts, biomass, or extraterrestrial prediction'});
}

function thermalRegime(ext){const k=ext.temperature.meanK/1000;return k<240?'COLD':k>340?'HOT':'TEMPERATE_BROAD'}
function mediumOptions(ext){const out=[];if(ext.terrain.oceanFractionPpm>0&&['LIQUID_SURFACE_CAPABLE','SURFACE_ICE_CAPABLE'].includes(ext.solvent.surfaceWaterRegime))out.push('AQUATIC');if(ext.terrain.oceanFractionPpm<980000&&ext.atmosphere.pressurePa!==null)out.push('SURFACE');if(ext.solvent.surfaceWaterRegime==='NO_DEFINED_SOLID_SURFACE')out.push('ATMOSPHERIC');if(out.length===0)out.push('SUBSURFACE');return out}
function productivityClass(p){return p<5000000?'TRACE':p<50000000?'LOW':p<180000000?'MODERATE':'HIGH'}
function trophicBudget(productivity,draw){
  const primary=productivity.primaryProductivityU,eff1=70000+(draw%80001),eff2=65000+((draw>>>7)%65001);
  const herb=Math.floor(primary*eff1/1e6),pred=Math.floor(herb*eff2/1e6),detrital=Math.floor(primary*0.12);
  return freezeArray([{level:0,role:'PRIMARY_PRODUCER',energyCeilingU:primary,transferEfficiencyPpm:1000000},{level:1,role:'PRIMARY_CONSUMER',energyCeilingU:herb,transferEfficiencyPpm:eff1},{level:2,role:'HIGHER_CONSUMER',energyCeilingU:pred,transferEfficiencyPpm:eff2},{level:1,role:'DETRITAL_LOOP',energyCeilingU:detrital,transferEfficiencyPpm:120000}].filter(x=>x.energyCeilingU>0));
}

export function generateBiosphereMacro(env,bindings){
  if(!env||env.mode!=='RESEARCH_ENVIRONMENT_EXTENSION'||env.state!==P6_STATES.RESEARCH_ONLY)throw new Error('rich biosphere generation requires explicit research environment extension');
  const ext=env.research,p=productivityBudget(env),planetId=env.planetId;
  const rootDraw=bindings.drawU32(planetId,'biosphere',0n,'macro.root'),media=mediumOptions(ext),preferredMedium=media[rootDraw%media.length];
  const trophic=trophicBudget(p,bindings.drawU32(planetId,'biosphere',0n,'macro.trophic'));
  const richnessBase=Math.max(0,Math.floor(Math.log10(1+p.primaryProductivityU)*3)-8);
  const lineageCount=clamp(richnessBase+(rootDraw%4),p.primaryProductivityU===0?0:1,32);
  const nicheCount=clamp(lineageCount*2+media.length+(bindings.drawU32(planetId,'biosphere',0n,'macro.niches')%4),lineageCount,96);
  const disturbancePressurePpm=ppm(ext.geology.activityPpm*0.55+Math.min(450000,ext.temperature.highLatitudeSeasonalityK*60));
  const turnoverPressurePpm=ppm(disturbancePressurePpm*0.7+(1000000-p.factors.waterPpm)*0.3);
  // Model A: semantic identity survives generator/model revision. Model/version lives in provenance and derivation semantics, not the stable key.
  const id=bindings.entity('p6.biosphere',{planetId,identityPolicy:P6_IDENTITY_POLICY});
  return Object.freeze({
    state:P6_STATES.RESEARCH_ONLY,modelVersion:P6_MODEL_VERSION,biosphereId:id,planetId:new Uint8Array(planetId),identityPolicy:P6_IDENTITY_POLICY,
    derivationManifestHash:new Uint8Array(bindings.manifestHash),sourceCanonicalEnvironmentContract:env.canonical.source.contractId,sourceResearchEnvironmentVersion:ext.sourceVersion,
    environmentalEpochRef:ext.environmentalEpochRef,
    commitments:Object.freeze({preferredMedium,viableMedia:Object.freeze(media),thermalRegime:thermalRegime(ext),productivityClass:productivityClass(p.primaryProductivityU),lineageCount,nicheCount,maxTrophicLevel:trophic.reduce((m,x)=>Math.max(m,x.level),0)}),
    productivity:p,trophic,evolutionPressure:Object.freeze({disturbancePressurePpm,turnoverPressurePpm}),
    semanticLod:Object.freeze({level:'MACRO',persistentCandidates:Object.freeze(['biosphereId','major lineage commitments','accepted P4 biological events']),derived:Object.freeze(['unobserved organism instances','cosmetic geometry','short-lived local noise'])}),
    authority:Object.freeze({identity:'P2_CANONICAL_UNIVERSE',canonicalEnvironment:'P5_CANONICAL_FROZEN',researchEnvironment:'P5_RESEARCH_DRAFT',canonicalTime:'P4_ONLY',privateClock:false,privateEventLog:false})
  });
}

function lineageCommitment(env,macro,bindings,index){
  const draw=bindings.drawU32(env.planetId,'lineage',BigInt(index),'lineage.commitment'),medium=macro.commitments.viableMedia[draw%macro.commitments.viableMedia.length],trophicRole=macro.trophic[draw%macro.trophic.length].role;
  const thermalToleranceMilliK=12000+(draw%28001),energySharePpm=macro.commitments.lineageCount===0?0:Math.max(1000,Math.floor(1000000/macro.commitments.lineageCount));
  const lineageId=bindings.entity('p6.lineage',{biosphereId:macro.biosphereId,lineageOrdinal:BigInt(index),identityPolicy:P6_IDENTITY_POLICY});
  return Object.freeze({lineageId,index,medium,thermalRegime:macro.commitments.thermalRegime,trophicRole,thermalToleranceMilliK,energySharePpm,heritableCode:Object.freeze({locomotionMode:medium==='AQUATIC'?'FLUID_PROPULSION':medium==='ATMOSPHERIC'?'BUOYANT_OR_AERODYNAMIC':medium==='SURFACE'?'SURFACE_CONTACT':'POROUS_MEDIA',metabolismBand:macro.commitments.productivityClass,reproductionStrategy:(draw&1)?'DISPERSED_PROPAGULE':'LOCAL_BUDDING',sensoryPriority:(draw&2)?'CHEMICAL_GRADIENT':'RADIATIVE_OR_MECHANICAL'})});
}

export function materializeMeso(env,macro,bindings,{lineageIndexes=null,speciesPerLineage=2}={}){
  if(macro.state!==P6_STATES.RESEARCH_ONLY)throw new Error('research macro state required');
  const indexes=lineageIndexes??Array.from({length:macro.commitments.lineageCount},(_,i)=>i),lineages=[],species=[];
  for(const i of indexes){
    if(!Number.isSafeInteger(i)||i<0||i>=macro.commitments.lineageCount)throw new Error('lineage index outside macro commitment');
    const l=lineageCommitment(env,macro,bindings,i);lineages.push(l);
    for(let s=0;s<speciesPerLineage;s++){
      const d=bindings.drawU32(env.planetId,'species',BigInt(i*4096+s),'species.refinement'),speciesId=bindings.entity('p6.species',{lineageId:l.lineageId,speciesOrdinal:BigInt(s),identityPolicy:P6_IDENTITY_POLICY});
      const demand=Math.max(1,Math.floor(macro.productivity.primaryProductivityU*l.energySharePpm/1e6/speciesPerLineage));
      species.push(Object.freeze({speciesId,lineageId:l.lineageId,ordinal:s,medium:l.medium,thermalRegime:l.thermalRegime,trophicRole:l.trophicRole,energyDemandCeilingU:demand,traits:Object.freeze({...l.heritableCode,bodyScalePermille:250+(d%3751),thermalToleranceMilliK:l.thermalToleranceMilliK+((d>>>8)%4001)-2000,armorInvestmentPpm:l.trophicRole==='HIGHER_CONSUMER'?100000+(d%300001):d%150001})}));
    }
  }
  return Object.freeze({level:'MESO',lineages:Object.freeze(lineages),species:Object.freeze(species)});
}

export function materializeIndividual(env,macro,species,bindings,ordinal=0){
  if(species.medium!==macro.commitments.preferredMedium&&!macro.commitments.viableMedia.includes(species.medium))throw new Error('species violates macro medium commitment');
  if(species.thermalRegime!==macro.commitments.thermalRegime)throw new Error('species violates macro thermal commitment');
  const key=BigInt(ordinal),draw=bindings.drawU32(env.planetId,'individual',key,'individual.materialization'),individualId=bindings.entity('p6.individual.materialized',{speciesId:species.speciesId,ordinal:key,identityPolicy:P6_IDENTITY_POLICY});
  const energyDemandU=Math.max(1,Math.floor(species.energyDemandCeilingU*(350000+(draw%550001))/1e6));
  const morphology=Object.freeze({medium:species.medium,locomotionMode:species.traits.locomotionMode,bodyScalePermille:Math.max(100,Math.round(species.traits.bodyScalePermille*(850000+((draw>>>5)%300001))/1e6)),supportInvestmentPpm:species.medium==='SURFACE'?180000+((draw>>>11)%420001):60000+((draw>>>11)%220001),sensoryPriority:species.traits.sensoryPriority});
  return Object.freeze({level:'MICRO',individualId,speciesId:species.speciesId,lineageId:species.lineageId,ordinal,medium:species.medium,thermalRegime:species.thermalRegime,trophicRole:species.trophicRole,energyDemandU,morphology,persistent:false});
}

export function assertRefinementInvariant(macro,meso,micro=null){
  const validMedia=new Set(macro.commitments.viableMedia),validRoles=new Set(macro.trophic.map(x=>x.role));
  for(const l of meso.lineages){if(!validMedia.has(l.medium)||l.thermalRegime!==macro.commitments.thermalRegime||!validRoles.has(l.trophicRole))return false}
  for(const s of meso.species){if(!validMedia.has(s.medium)||s.thermalRegime!==macro.commitments.thermalRegime||!validRoles.has(s.trophicRole)||s.energyDemandCeilingU>macro.productivity.primaryProductivityU)return false}
  if(micro){if(!validMedia.has(micro.medium)||micro.thermalRegime!==macro.commitments.thermalRegime||!validRoles.has(micro.trophicRole))return false;const s=meso.species.find(x=>hex(x.speciesId)===hex(micro.speciesId));if(!s||micro.energyDemandU>s.energyDemandCeilingU||micro.medium!==s.medium||micro.trophicRole!==s.trophicRole)return false}
  return true;
}

const P4_EVENT_FAMILIES=Object.freeze(['p6.speciation@1','p6.extinction@1','p6.population.range-shift@1','p6.population.change@1','p6.ecosystem.regime-change@1','p6.adaptation.commit@1','p6.biosphere.collapse@1','p6.biosphere.recovery@1']);
export function p4BiologicalReducerResearch(){
  return Object.freeze({
    status:'RESEARCH_DRAFT_NON_CANONICAL',version:'p6-biological-reducer-research-v0.2',requiresProtocol:'ofu-p4-temporal-v1',eventFamilies:P4_EVENT_FAMILIES,
    privateClock:false,privateEventLog:false,ownsOrdering:false,ownsEventIdentity:false,ownsReplay:false,ownsCheckpoints:false,ownsCompaction:false,ownsLineage:false,
    reduce(state,event){
      assertObject(event,'P4-owned biological event');if(!P4_EVENT_FAMILIES.includes(event.type))throw new Error('unsupported P6 biological event family');
      const prior=state&&typeof state==='object'?state:{};return Object.freeze({...prior,lastAcceptedP4EventType:event.type,reducedBy:'p6-biological-reducer-research-v0.2'});
    },
    rule:'P6 supplies biological reduction semantics only; P4 must supply accepted event identity, time/order, replay, checkpoints, compaction, lineage and archives.'
  });
}

export function renderingProjection(macro,meso){
  return Object.freeze({presentationOnly:true,state:macro.state,planetId:macro.planetId,productivityClass:macro.commitments.productivityClass,viableMedia:macro.commitments.viableMedia,nicheCount:macro.commitments.nicheCount,maxTrophicLevel:macro.commitments.maxTrophicLevel,lineageIds:Object.freeze(meso.lineages.map(x=>x.lineageId)),speciesDistributionHint:Object.freeze(meso.species.map(s=>Object.freeze({speciesId:s.speciesId,medium:s.medium,trophicRole:s.trophicRole})))})
}
