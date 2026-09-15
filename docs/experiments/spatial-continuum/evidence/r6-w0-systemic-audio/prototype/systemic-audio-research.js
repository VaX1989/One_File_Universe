(function(root){
'use strict';

const VERSION='ofu-r6j-systemic-audio-research-1';
const AUTHORITY='PRESENTATION_ONLY';
const MAX_VOICES=6;
const CATEGORIES=Object.freeze(['environmental','sonification','presentation']);
const CATEGORY_DEFAULTS=Object.freeze({
  environmental:Object.freeze({muted:false,volume:0.7}),
  sonification:Object.freeze({muted:false,volume:0.55}),
  presentation:Object.freeze({muted:false,volume:0.5})
});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):min));
const finite=value=>Number.isFinite(Number(value));
const freeze=value=>Object.freeze(value);
const round6=value=>Math.round(Number(value)*1e6)/1e6;

function categoryControls(input){
  const source=input&&typeof input==='object'?input:{};
  const result={};
  for(const category of CATEGORIES){
    const item=source[category]&&typeof source[category]==='object'?source[category]:{};
    result[category]=freeze({
      muted:item.muted===true,
      volume:round6(clamp(item.volume===undefined?CATEGORY_DEFAULTS[category].volume:item.volume,0,1))
    });
  }
  return freeze(result);
}

function normalizePreferences(input){
  const source=input&&typeof input==='object'?input:{};
  return freeze({
    enabled:source.enabled!==false,
    masterMuted:source.masterMuted===true,
    masterVolume:round6(clamp(source.masterVolume===undefined?0.7:source.masterVolume,0,1)),
    reducedSensory:source.reducedSensory===true,
    categories:categoryControls(source.categories)
  });
}

function normalizeCapability(input){
  const source=input&&typeof input==='object'?input:{};
  const requested=Math.floor(clamp(source.maxVoices===undefined?MAX_VOICES:source.maxVoices,0,MAX_VOICES));
  const updateHz=Math.floor(clamp(source.updateHz===undefined?30:source.updateHz,5,60));
  return freeze({
    audioSupported:source.audioSupported!==false,
    maxVoices:requested,
    updateHz,
    quality:requested>=5?'FULL':requested>=2?'REDUCED':requested>=1?'MINIMAL':'SILENT'
  });
}

function normalizeContext(input){
  const source=input&&typeof input==='object'?input:{};
  const sub=name=>source[name]&&typeof source[name]==='object'?source[name]:{};
  const medium=sub('medium'),environment=sub('environment'),micro=sub('micro'),presentation=sub('presentation');
  return freeze({
    contextId:String(source.contextId||'unidentified-context'),
    regime:String(source.regime||'unknown'),
    medium:freeze({
      kind:String(medium.kind||'UNKNOWN'),
      supportsAcousticPropagation:medium.supportsAcousticPropagation===true,
      vacuum:medium.vacuum===true,
      densityNormalized:finite(medium.densityNormalized)?round6(clamp(medium.densityNormalized,0,1)):null,
      authority:String(medium.authority||'UNRESOLVED')
    }),
    environment:freeze({
      windIntensity:finite(environment.windIntensity)?round6(clamp(environment.windIntensity,0,1)):null,
      weatherIntensity:finite(environment.weatherIntensity)?round6(clamp(environment.weatherIntensity,0,1)):null,
      terrainRoughness:finite(environment.terrainRoughness)?round6(clamp(environment.terrainRoughness,0,1)):null,
      materialHardness:finite(environment.materialHardness)?round6(clamp(environment.materialHardness,0,1)):null,
      authority:String(environment.authority||'UNRESOLVED')
    }),
    micro:freeze({
      active:micro.active===true,
      densityNormalized:finite(micro.densityNormalized)?round6(clamp(micro.densityNormalized,0,1)):null,
      energyNormalized:finite(micro.energyNormalized)?round6(clamp(micro.energyNormalized,0,1)):null,
      variationNormalized:finite(micro.variationNormalized)?round6(clamp(micro.variationNormalized,0,1)):null,
      authority:String(micro.authority||'UNRESOLVED')
    }),
    presentation:freeze({
      travelIntensity:finite(presentation.travelIntensity)?round6(clamp(presentation.travelIntensity,0,1)):null,
      statusIntensity:finite(presentation.statusIntensity)?round6(clamp(presentation.statusIntensity,0,1)):null
    })
  });
}

function layer({id,category,source,frequencyHz,gain,priority,diegetic,claim,nonAudioAlternative}){
  return freeze({
    id,
    category,
    source:freeze({...source}),
    frequencyHz:round6(clamp(frequencyHz,20,18000)),
    gain:round6(clamp(gain,0,0.3)),
    priority:Math.floor(clamp(priority,0,100)),
    diegetic:diegetic===true,
    authority:AUTHORITY,
    literalPhysicalEvidence:false,
    claim,
    nonAudioAlternative:String(nonAudioAlternative)
  });
}

function semanticLayers(context){
  const layers=[];
  const mediumAllows=context.medium.supportsAcousticPropagation===true&&context.medium.vacuum!==true;
  const density=context.medium.densityNormalized==null?0.35:context.medium.densityNormalized;
  if(mediumAllows&&context.environment.windIntensity!=null&&context.environment.windIntensity>0){
    const value=context.environment.windIntensity;
    layers.push(layer({
      id:'environment.wind-context',category:'environmental',source:{field:'environment.windIntensity',value,authority:context.environment.authority},
      frequencyHz:120+260*value,gain:(0.025+0.075*value)*Math.max(0.15,density),priority:80,diegetic:true,
      claim:'Context-conditioned environmental presentation; not a recorded or physically simulated waveform.',
      nonAudioAlternative:'Wind-context indicator remains available visually/textually.'
    }));
  }
  if(mediumAllows&&context.environment.weatherIntensity!=null&&context.environment.weatherIntensity>0){
    const value=context.environment.weatherIntensity;
    layers.push(layer({
      id:'environment.weather-context',category:'environmental',source:{field:'environment.weatherIntensity',value,authority:context.environment.authority},
      frequencyHz:360+520*value,gain:0.02+0.06*value,priority:70,diegetic:true,
      claim:'Context-conditioned weather presentation; not meteorological measurement evidence or a literal captured sound.',
      nonAudioAlternative:'Weather-context indicator remains available visually/textually.'
    }));
  }
  if(context.micro.active&&context.micro.densityNormalized!=null&&context.micro.energyNormalized!=null&&context.micro.variationNormalized!=null){
    const d=context.micro.densityNormalized,e=context.micro.energyNormalized,v=context.micro.variationNormalized;
    layers.push(layer({
      id:'sonification.micro-model',category:'sonification',source:{fields:['micro.densityNormalized','micro.energyNormalized','micro.variationNormalized'],values:[d,e,v],authority:context.micro.authority},
      frequencyHz:220+520*d+180*e,gain:0.025+0.055*v,priority:60,diegetic:false,
      claim:'SONIFICATION_NOT_LITERAL_SOUND: maps supplied model/presentation values to audible parameters; no atomic or molecular process is asserted to be literally audible.',
      nonAudioAlternative:'The same density/energy/variation values remain inspectable numerically or visually.'
    }));
  }
  if(context.presentation.travelIntensity!=null&&context.presentation.travelIntensity>0){
    const value=context.presentation.travelIntensity;
    layers.push(layer({
      id:'presentation.travel-orientation',category:'presentation',source:{field:'presentation.travelIntensity',value,authority:AUTHORITY},
      frequencyHz:68+56*value,gain:0.018+0.04*value,priority:40,diegetic:false,
      claim:'Non-diegetic orientation cue. It may exist in vacuum because it is explicitly presentation, not propagated ambience.',
      nonAudioAlternative:'Scale/travel orientation remains available through non-audio UI.'
    }));
  }
  return freeze(layers.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)));
}

function applyPreferences(layers,preferences){
  return freeze(layers.map(item=>{
    const category=preferences.categories[item.category];
    const muted=!preferences.enabled||preferences.masterMuted||preferences.masterVolume===0||category.muted||category.volume===0;
    const reduced=preferences.reducedSensory?0.55:1;
    return freeze({...item,
      muted,
      effectiveGain:muted?0:round6(item.gain*preferences.masterVolume*category.volume*reduced)
    });
  }));
}

function deriveAudioPlan(contextInput,preferencesInput,capabilityInput){
  const context=normalizeContext(contextInput),preferences=normalizePreferences(preferencesInput),capability=normalizeCapability(capabilityInput);
  const semantics=semanticLayers(context),layers=applyPreferences(semantics,preferences);
  const candidates=layers.filter(item=>item.effectiveGain>0);
  const selected=capability.audioSupported?candidates.slice(0,capability.maxVoices):[];
  const silenceReason=!preferences.enabled?'user-disabled':preferences.masterMuted||preferences.masterVolume===0?'user-muted':!capability.audioSupported?'audio-unsupported':capability.maxVoices===0?'device-audio-budget-zero':selected.length===0?'no-supported-context-or-all-categories-muted':null;
  const semanticTruth=freeze(semantics.map(({id,category,source,diegetic,authority,literalPhysicalEvidence,claim,nonAudioAlternative})=>freeze({id,category,source,diegetic,authority,literalPhysicalEvidence,claim,nonAudioAlternative})));
  return freeze({
    contract:'ofu-r6j-systemic-audio-research-plan-1',version:VERSION,authority:AUTHORITY,researchOnly:true,
    context,preferences,capability,
    semanticTruth,
    layers,
    render:freeze({
      maxVoices:MAX_VOICES,
      selectedLayerIds:freeze(selected.map(item=>item.id)),
      voiceCount:selected.length,
      updateHz:capability.updateHz,
      quality:capability.quality,
      degraded:selected.length<candidates.length,
      networkAssetsRequired:0,
      audioBufferBytesRequired:0
    }),
    silenceReason,
    claims:freeze({
      literalSoundInVacuum:false,
      microIsLiteralAudibleAtomicSound:false,
      canonicalMutation:false,
      audioRequiredForEssentialStatus:false,
      adaptiveQualityChangesWorldTruth:false
    })
  });
}

function createRuntime(options={}){
  const rootObject=options.root||root;
  const contextFactory=typeof options.contextFactory==='function'?options.contextFactory:()=>{
    const Context=rootObject.AudioContext||rootObject.webkitAudioContext;
    if(typeof Context!=='function')throw new Error('AudioContext unavailable');
    return new Context({latencyHint:'interactive'});
  };
  let audioContext=null,master=null,voices=[],state='idle',lastPlan=deriveAudioPlan({}, {}, {}),contextCreations=0,peakVoices=0;
  const safe=(target,method)=>{try{return target&&typeof target[method]==='function'?target[method]():undefined;}catch{return undefined;}};
  const disconnect=node=>{try{node&&typeof node.disconnect==='function'&&node.disconnect();}catch{}};
  const setParam=(param,value,time)=>{if(!param)return;if(typeof param.setTargetAtTime==='function')param.setTargetAtTime(value,time||0,0.02);else param.value=value;};
  function teardownVoices(){for(const item of voices){safe(item.oscillator,'stop');disconnect(item.oscillator);disconnect(item.gain);}voices=[];disconnect(master);master=null;}
  function buildVoices(){
    teardownVoices();
    if(!audioContext||state!=='running'||lastPlan.render.voiceCount===0)return;
    master=audioContext.createGain();setParam(master.gain,1,audioContext.currentTime||0);master.connect(audioContext.destination);
    const selected=new Set(lastPlan.render.selectedLayerIds);
    for(const item of lastPlan.layers){
      if(!selected.has(item.id))continue;
      if(voices.length>=MAX_VOICES)break;
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
      oscillator.type=item.category==='environmental'?'triangle':item.category==='sonification'?'sine':'sine';
      setParam(oscillator.frequency,item.frequencyHz,audioContext.currentTime||0);setParam(gain.gain,item.effectiveGain,audioContext.currentTime||0);
      oscillator.connect(gain);gain.connect(master);oscillator.start();voices.push({id:item.id,oscillator,gain});
    }
    peakVoices=Math.max(peakVoices,voices.length);
    if(voices.length>MAX_VOICES)throw new Error('R6-J voice bound exceeded');
  }
  function apply(contextInput,preferencesInput,capabilityInput){
    if(state==='disposed')throw new Error('R6-J runtime disposed');
    lastPlan=deriveAudioPlan(contextInput,preferencesInput,capabilityInput);
    if(state==='running')buildVoices();
    return snapshot();
  }
  async function resume({userGesture=false}={}){
    if(state==='disposed')throw new Error('R6-J runtime disposed');
    if(userGesture!==true)return freeze({...snapshot(),resumeBlocked:'user-gesture-required'});
    if(!audioContext){
      try{audioContext=contextFactory();contextCreations++;}
      catch{state='unsupported';return snapshot();}
    }
    try{if(typeof audioContext.resume==='function')await audioContext.resume();}
    catch{state='unsupported';teardownVoices();return snapshot();}
    state='running';buildVoices();return snapshot();
  }
  async function suspend(){
    if(state==='disposed')return snapshot();
    teardownVoices();
    try{if(audioContext&&typeof audioContext.suspend==='function')await audioContext.suspend();}catch{}
    state=audioContext?'suspended':'idle';return snapshot();
  }
  async function dispose(){
    if(state==='disposed')return snapshot();
    teardownVoices();
    try{if(audioContext&&typeof audioContext.close==='function')await audioContext.close();}catch{}
    audioContext=null;state='disposed';return snapshot();
  }
  function snapshot(){
    return freeze({
      contract:'ofu-r6j-systemic-audio-research-runtime-1',version:VERSION,researchOnly:true,state,
      contextCount:audioContext?1:0,contextCreations,voiceCount:voices.length,peakVoices,maxVoices:MAX_VOICES,
      networkAssetsRequired:0,worldStateMutations:0,
      plan:freeze({voiceCount:lastPlan.render.voiceCount,silenceReason:lastPlan.silenceReason,quality:lastPlan.render.quality})
    });
  }
  return freeze({apply,resume,suspend,dispose,snapshot});
}

root.OFU_R6J_RESEARCH=freeze({VERSION,AUTHORITY,MAX_VOICES,CATEGORIES,deriveAudioPlan,createRuntime});
})(globalThis);
