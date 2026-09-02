// P6 BIOSPHERE & EVOLUTION RESEARCH — NON-CANONICAL
// This module consumes a versioned P5 environmental research snapshot and binds
// all stable identities/random draws to P2. It does not own planetary truth or time.

export const P6_MODEL_VERSION='p6-biosphere-research-v0.1';
export const P5_ENVIRONMENT_VERSION='p6-environment-research-v0.2';
export const P6_EVIDENCE=Object.freeze({
  productivity:{evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'STYLIZED',note:'Causal bounded energy/productivity proxy; not an Earth NPP model.'},
  trophicTransfer:{evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE',note:'Energy must decrease through trophic levels; transfer efficiency is stylized.'},
  nicheAssembly:{evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED',note:'Environmental functional-space grammar, not a biome lookup table.'},
  morphology:{evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED',note:'Functional trait constraints, explicitly not an alien morphology prediction.'},
  heredity:{evidenceClass:'HYPOTHETICAL',modelFidelity:'METAPHORICAL',note:'Compact heritable generative code, not molecular genetics.'},
  evolution:{evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'STYLIZED',note:'Directional pressure/turnover abstraction; P4 would own accepted history.'},
  semanticLod:{evidenceClass:'FORMAL',modelFidelity:'FORMAL',note:'Executable consistency contract between committed macro facts and late refinement.'}
});

const MAX_U32=0xffffffff;
const ppm=(x)=>Math.max(0,Math.min(1000000,Math.round(x)));
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const q=(x,scale=1000)=>Math.round(Number(x)*scale);
const hex=(bytes)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');

function assertObject(v,name){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error(`${name} must be an object`)}
function assertFinite(v,name){if(!Number.isFinite(Number(v)))throw new Error(`${name} must be finite`);return Number(v)}
function assertInt(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new Error(`${name} outside range`);return v}
function idBytes(v,name){if(!(v instanceof Uint8Array)||v.length!==32)throw new Error(`${name} must be a 32-byte P2 identity`);return v}
function freezeArray(a){return Object.freeze(a.map(x=>Object.freeze(x)))}

export function adaptP5EnvironmentV02(input){
  assertObject(input,'environment');
  if(input.version!==P5_ENVIRONMENT_VERSION)throw new Error('unsupported P5->P6 environmental contract');
  if(input.authority!=='P5_RESEARCH_DRAFT')throw new Error('environment authority must remain P5_RESEARCH_DRAFT');
  idBytes(input.planetId,'planetId');
  for(const k of ['energy','temperature','atmosphere','solvent','geology','terrain','radiation'])assertObject(input[k],k);
  const baselineInsolationPpm=assertInt(Number(input.energy.baselineInsolationPpm),'baselineInsolationPpm',0,Number.MAX_SAFE_INTEGER);
  const meanK=assertFinite(input.temperature.meanK,'temperature.meanK');
  const minSeasonalK=assertFinite(input.temperature.minSeasonalK,'temperature.minSeasonalK');
  const maxSeasonalK=assertFinite(input.temperature.maxSeasonalK,'temperature.maxSeasonalK');
  const highLatitudeSeasonalityK=assertFinite(input.temperature.highLatitudeSeasonalityK,'temperature.highLatitudeSeasonalityK');
  const pressurePa=input.atmosphere.pressurePa===null?null:assertFinite(input.atmosphere.pressurePa,'atmosphere.pressurePa');
  const columnEquivalentPressurePa=assertFinite(input.atmosphere.columnEquivalentPressurePa,'atmosphere.columnEquivalentPressurePa');
  const oceanFractionPpm=assertInt(Number(input.terrain.oceanFractionPpm),'terrain.oceanFractionPpm',0,1000000);
  const reliefScaleM=assertInt(Number(input.terrain.reliefScaleM),'terrain.reliefScaleM',0,100000000);
  const activityProxy=assertFinite(input.geology.activityProxy,'geology.activityProxy');
  const xuvFractionProxy=assertFinite(input.radiation.xuvFractionProxy,'radiation.xuvFractionProxy');
  return Object.freeze({
    adapterVersion:'p6-p5-environment-adapter-v0.1',
    sourceVersion:input.version,
    sourceAuthority:input.authority,
    planetId:input.planetId,
    environmentalEpochRef:input.environmentalEpochRef??null,
    spatialRef:input.spatialRef??null,
    energy:Object.freeze({baselineInsolationPpm}),
    temperature:Object.freeze({meanK:q(meanK),minSeasonalK:q(minSeasonalK),maxSeasonalK:q(maxSeasonalK),highLatitudeSeasonalityK:q(highLatitudeSeasonalityK)}),
    atmosphere:Object.freeze({pressurePa:pressurePa===null?null:Math.round(pressurePa),columnEquivalentPressurePa:Math.round(columnEquivalentPressurePa),pressureInterpretation:String(input.atmosphere.pressureInterpretation),heavyGasRetentionPpm:ppm(assertFinite(input.atmosphere.heavyGasRetentionProxy,'heavyGasRetentionProxy')*1e6),xuvEscapeKgS:q(assertFinite(input.atmosphere.xuvEscapeKgS,'xuvEscapeKgS'),1000)}),
    solvent:Object.freeze({surfaceWaterRegime:String(input.solvent.surfaceWaterRegime),deepWaterRegime:String(input.solvent.deepWaterRegime)}),
    geology:Object.freeze({activityPpm:ppm(activityProxy/1.5*1e6),regimeProxy:String(input.geology.regimeProxy)}),
    terrain:Object.freeze({oceanFractionPpm,reliefScaleM}),
    radiation:Object.freeze({xuvFractionPpb:Math.max(0,Math.round(xuvFractionProxy*1e9))}),
    authority:Object.freeze({p5Owned:true,p6MustNotReroll:true,spatialContractAvailable:input.spatialRef!=null,epochContractAvailable:input.environmentalEpochRef!=null})
  });
}

export function createP2BiosphereBindings({p2,masterSeed,semanticManifestHash,universeIdentity}){
  if(!p2||typeof p2.derive!=='function'||typeof p2.entityIdentity!=='function'||typeof p2.address!=='function')throw new Error('P2 canonical API required');
  idBytes(masterSeed,'masterSeed');idBytes(semanticManifestHash,'semanticManifestHash');idBytes(universeIdentity,'universeIdentity');
  function address(planetId,kind,index=0n,extra=null){
    idBytes(planetId,'planetId');
    const segments=[{kind:'namespace',value:'p6'},{kind:'bytes',value:planetId},{kind:'namespace',value:kind},{kind:'u64',value:BigInt(index)}];
    if(extra!==null)segments.push({kind:'namespace',value:String(extra)});
    return p2.address(segments);
  }
  function drawU32(planetId,kind,index,property,counter=0n){
    const bytes=p2.derive({masterSeed,semanticManifestHash,domain:'ofu.p6.biosphere.research',addressBytes:address(planetId,kind,index),property,counter});
    return (((bytes[0]<<24)>>>0)+(bytes[1]<<16)+(bytes[2]<<8)+bytes[3])>>>0;
  }
  function entity(namespace,stableKey){return p2.entityIdentity(universeIdentity,namespace,stableKey)}
  return Object.freeze({address,drawU32,entity});
}

function temperatureSuitability(env){
  const k=env.temperature.meanK/1000;
  // Broad research envelope deliberately wider than terrestrial surface biology.
  if(k<150||k>500)return 0;
  const centerPenalty=Math.abs(k-288)/212;
  return ppm((1-centerPenalty)*1e6);
}
function waterSuitability(env){
  const r=env.solvent.surfaceWaterRegime;
  if(r==='LIQUID_SURFACE_CAPABLE')return 1000000;
  if(r==='SURFACE_ICE_CAPABLE')return 420000;
  if(r==='SUPERCRITICAL_FLUID_CAPABLE')return 70000;
  if(r==='HOT_STEAM_VAPOR'||r==='STEAM_VAPOR_DOMINATED')return 100000;
  if(r==='LOW_PRESSURE_ICE_OR_VAPOR'||r==='LOW_PRESSURE_VAPOR')return 80000;
  if(r==='TRACE_OR_ABSENT')return 30000;
  if(r==='NO_DEFINED_SOLID_SURFACE')return 180000;
  return 50000;
}
function pressureSuitability(env){
  const p=env.atmosphere.pressurePa??env.atmosphere.columnEquivalentPressurePa;
  if(!Number.isFinite(p)||p<=0)return 60000;
  const log=Math.log10(Math.max(1,p));
  return ppm((1-Math.min(1,Math.abs(log-5)/7))*1e6);
}
function radiationSuitability(env){return ppm(1e6/(1+env.radiation.xuvFractionPpb/100000));}
function seasonalSuitability(env){const amp=Math.max(0,env.temperature.highLatitudeSeasonalityK/1000);return ppm(1e6/(1+amp/120));}
function insolationSuitability(env){const s=env.energy.baselineInsolationPpm;return ppm(1e6*(s/(s+350000)));}

export function productivityBudget(env){
  const factors=Object.freeze({
    insolationPpm:insolationSuitability(env),
    temperaturePpm:temperatureSuitability(env),
    waterPpm:waterSuitability(env),
    pressurePpm:pressureSuitability(env),
    radiationPpm:radiationSuitability(env),
    seasonalityPpm:seasonalSuitability(env)
  });
  let product=1000000n;
  for(const v of Object.values(factors))product=product*BigInt(v)/1000000n;
  const availableEnergyU=Number(product)*1000;
  const primaryProductivityU=Math.floor(availableEnergyU*0.42);
  const sustainableBiomassU=Math.floor(primaryProductivityU*8);
  return Object.freeze({model:'P6_CAUSAL_ENERGY_PROXY_V0_1',factors,availableEnergyU,primaryProductivityU,sustainableBiomassU,interpretation:'dimensionless bounded research units; not watts or kgC'});
}

function thermalRegime(env){const k=env.temperature.meanK/1000;return k<240?'COLD':k>340?'HOT':'TEMPERATE_BROAD'}
function mediumOptions(env){const out=[];if(env.terrain.oceanFractionPpm>0&&['LIQUID_SURFACE_CAPABLE','SURFACE_ICE_CAPABLE'].includes(env.solvent.surfaceWaterRegime))out.push('AQUATIC');if(env.terrain.oceanFractionPpm<980000&&env.atmosphere.pressurePa!==null)out.push('SURFACE');if(env.solvent.surfaceWaterRegime==='NO_DEFINED_SOLID_SURFACE')out.push('ATMOSPHERIC');if(out.length===0)out.push('SUBSURFACE');return out}
function productivityClass(p){return p<5000000?'TRACE':p<50000000?'LOW':p<180000000?'MODERATE':'HIGH'}

function trophicBudget(productivity,draw){
  const primary=productivity.primaryProductivityU;
  const eff1=70000+(draw%80001); // 7–15%
  const eff2=65000+((draw>>>7)%65001); // 6.5–13%
  const herb=Math.floor(primary*eff1/1e6);
  const pred=Math.floor(herb*eff2/1e6);
  const detrital=Math.floor(primary*0.12);
  const levels=[
    {level:0,role:'PRIMARY_PRODUCER',energyCeilingU:primary,transferEfficiencyPpm:1000000},
    {level:1,role:'PRIMARY_CONSUMER',energyCeilingU:herb,transferEfficiencyPpm:eff1},
    {level:2,role:'HIGHER_CONSUMER',energyCeilingU:pred,transferEfficiencyPpm:eff2},
    {level:1,role:'DETRITAL_LOOP',energyCeilingU:detrital,transferEfficiencyPpm:120000}
  ];
  return freezeArray(levels.filter(x=>x.energyCeilingU>0));
}

export function generateBiosphereMacro(env,bindings){
  if(env.adapterVersion!=='p6-p5-environment-adapter-v0.1')throw new Error('P5 environment adapter output required');
  const p=productivityBudget(env),planetId=env.planetId;
  const rootDraw=bindings.drawU32(planetId,'biosphere',0n,'macro.root');
  const media=mediumOptions(env);
  const preferredMedium=media[rootDraw%media.length];
  const trophic=trophicBudget(p,bindings.drawU32(planetId,'biosphere',0n,'macro.trophic'));
  const richnessBase=Math.max(0,Math.floor(Math.log10(1+p.primaryProductivityU)*3)-8);
  const lineageCount=clamp(richnessBase+(rootDraw%4),p.primaryProductivityU===0?0:1,32);
  const nicheCount=clamp(lineageCount*2+media.length+(bindings.drawU32(planetId,'biosphere',0n,'macro.niches')%4),lineageCount,96);
  const disturbancePressurePpm=ppm(env.geology.activityPpm*0.55+Math.min(450000,env.temperature.highLatitudeSeasonalityK*60));
  const turnoverPressurePpm=ppm(disturbancePressurePpm*0.7+(1000000-p.factors.waterPpm)*0.3);
  const id=bindings.entity('p6.biosphere',{planetId,modelVersion:P6_MODEL_VERSION});
  return Object.freeze({
    modelVersion:P6_MODEL_VERSION,
    biosphereId:id,
    planetId,
    sourceEnvironmentVersion:env.sourceVersion,
    environmentalEpochRef:env.environmentalEpochRef,
    commitments:Object.freeze({preferredMedium,viableMedia:Object.freeze(media),thermalRegime:thermalRegime(env),productivityClass:productivityClass(p.primaryProductivityU),lineageCount,nicheCount,maxTrophicLevel:trophic.reduce((m,x)=>Math.max(m,x.level),0)}),
    productivity:p,
    trophic,
    evolutionPressure:Object.freeze({disturbancePressurePpm,turnoverPressurePpm}),
    semanticLod:Object.freeze({level:'MACRO',persistentCandidates:Object.freeze(['biosphereId','major lineage commitments','accepted speciation/extinction/regime events']),derived:Object.freeze(['unobserved organism instances','cosmetic geometry','short-lived local noise'])}),
    authority:Object.freeze({identity:'P2',environment:'P5_RESEARCH_DRAFT',canonicalTime:'P4_ONLY',privateClock:false})
  });
}

function lineageCommitment(env,macro,bindings,index){
  const draw=bindings.drawU32(env.planetId,'lineage',BigInt(index),'lineage.commitment');
  const medium=macro.commitments.viableMedia[draw%macro.commitments.viableMedia.length];
  const trophicRole=macro.trophic[draw%macro.trophic.length].role;
  const thermalToleranceMilliK=12000+(draw%28001);
  const energySharePpm=Math.max(1000,Math.floor(1000000/macro.commitments.lineageCount));
  const lineageId=bindings.entity('p6.lineage',{biosphereId:macro.biosphereId,index:BigInt(index)});
  return Object.freeze({lineageId,index,medium,thermalRegime:macro.commitments.thermalRegime,trophicRole,thermalToleranceMilliK,energySharePpm,heritableCode:Object.freeze({locomotionMode:medium==='AQUATIC'?'FLUID_PROPULSION':medium==='ATMOSPHERIC'?'BUOYANT_OR_AERODYNAMIC':medium==='SURFACE'?'SURFACE_CONTACT':'POROUS_MEDIA',metabolismBand:macro.commitments.productivityClass,reproductionStrategy:(draw&1)?'DISPERSED_PROPAGULE':'LOCAL_BUDDING',sensoryPriority:(draw&2)?'CHEMICAL_GRADIENT':'RADIATIVE_OR_MECHANICAL'})});
}

export function materializeMeso(env,macro,bindings,{lineageIndexes=null,speciesPerLineage=2}={}){
  const indexes=lineageIndexes??Array.from({length:macro.commitments.lineageCount},(_,i)=>i);
  const lineages=[],species=[];
  for(const i of indexes){
    if(!Number.isSafeInteger(i)||i<0||i>=macro.commitments.lineageCount)throw new Error('lineage index outside macro commitment');
    const l=lineageCommitment(env,macro,bindings,i);lineages.push(l);
    for(let s=0;s<speciesPerLineage;s++){
      const d=bindings.drawU32(env.planetId,'species',BigInt(i*4096+s),'species.refinement');
      const speciesId=bindings.entity('p6.species',{lineageId:l.lineageId,ordinal:BigInt(s)});
      const demand=Math.max(1,Math.floor(macro.productivity.primaryProductivityU*l.energySharePpm/1e6/speciesPerLineage));
      species.push(Object.freeze({speciesId,lineageId:l.lineageId,ordinal:s,medium:l.medium,thermalRegime:l.thermalRegime,trophicRole:l.trophicRole,energyDemandCeilingU:demand,traits:Object.freeze({...l.heritableCode,bodyScalePermille:250+(d%3751),thermalToleranceMilliK:l.thermalToleranceMilliK+((d>>>8)%4001)-2000,armorInvestmentPpm:l.trophicRole==='HIGHER_CONSUMER'?100000+(d%300001):d%150001})}));
    }
  }
  return Object.freeze({level:'MESO',lineages:Object.freeze(lineages),species:Object.freeze(species)});
}

export function materializeIndividual(env,macro,species,bindings,ordinal=0){
  if(species.medium!==macro.commitments.preferredMedium&&!macro.commitments.viableMedia.includes(species.medium))throw new Error('species violates macro medium commitment');
  if(species.thermalRegime!==macro.commitments.thermalRegime)throw new Error('species violates macro thermal commitment');
  const key=BigInt(ordinal),draw=bindings.drawU32(env.planetId,'individual',key,'individual.materialization');
  const individualId=bindings.entity('p6.individual.materialized',{speciesId:species.speciesId,ordinal:key});
  const energyDemandU=Math.max(1,Math.floor(species.energyDemandCeilingU*(350000+(draw%550001))/1e6));
  const morphology=Object.freeze({medium:species.medium,locomotionMode:species.traits.locomotionMode,bodyScalePermille:Math.max(100,Math.round(species.traits.bodyScalePermille*(850000+((draw>>>5)%300001))/1e6)),supportInvestmentPpm:species.medium==='SURFACE'?180000+((draw>>>11)%420001):60000+((draw>>>11)%220001),sensoryPriority:species.traits.sensoryPriority});
  return Object.freeze({level:'MICRO',individualId,speciesId:species.speciesId,lineageId:species.lineageId,ordinal,medium:species.medium,thermalRegime:species.thermalRegime,trophicRole:species.trophicRole,energyDemandU,morphology,persistent:false});
}

export function assertRefinementInvariant(macro,meso,micro=null){
  const validMedia=new Set(macro.commitments.viableMedia);
  for(const l of meso.lineages){if(!validMedia.has(l.medium))return false;if(l.thermalRegime!==macro.commitments.thermalRegime)return false;}
  for(const s of meso.species){if(!validMedia.has(s.medium))return false;if(s.thermalRegime!==macro.commitments.thermalRegime)return false;if(s.energyDemandCeilingU>macro.productivity.primaryProductivityU)return false;}
  if(micro){if(!validMedia.has(micro.medium)||micro.thermalRegime!==macro.commitments.thermalRegime)return false;const s=meso.species.find(x=>hex(x.speciesId)===hex(micro.speciesId));if(!s||micro.energyDemandU>s.energyDemandCeilingU)return false;}
  return true;
}

export function p4BiologicalTransitionDraft(){
  return Object.freeze({
    status:'RESEARCH_DRAFT_NON_CANONICAL',
    requiresProtocol:'ofu-p4-temporal-v1',
    proposedContract:'ofu.p6.biological-transition@0.1.0-research',
    compatibility:'exact-if-promoted',
    eventFamilies:Object.freeze(['p6.speciation@1','p6.extinction@1','p6.population.range-shift@1','p6.population.change@1','p6.ecosystem.regime-change@1','p6.adaptation.commit@1','p6.biosphere.collapse@1','p6.biosphere.recovery@1']),
    rule:'P6 supplies biological reducer semantics only; P4 owns event identity, accepted ordering, replay, checkpoints, compaction, lineage and archives.',
    privateClock:false,
    privateEventLog:false
  });
}

export function renderingProjection(macro,meso){
  return Object.freeze({presentationOnly:true,productivityClass:macro.commitments.productivityClass,viableMedia:macro.commitments.viableMedia,nicheCount:macro.commitments.nicheCount,maxTrophicLevel:macro.commitments.maxTrophicLevel,lineageIds:Object.freeze(meso.lineages.map(x=>x.lineageId)),speciesDistributionHint:Object.freeze(meso.species.map(s=>Object.freeze({speciesId:s.speciesId,medium:s.medium,trophicRole:s.trophicRole})))})
}
