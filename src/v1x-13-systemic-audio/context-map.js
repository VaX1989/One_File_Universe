(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x13-audio-context-1';
const AUTHORITY='PRESENTATION_ONLY';
const MAX_LAYERS=6;
const MACRO_REGIMES=new Set(['galaxy','galactic_region','stellar_neighborhood','system','orbit']);
const SURFACE_REGIMES=new Set(['global_surface','regional_surface','local_surface','human']);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:min));
const bool=value=>value===true;
const text=(value,fallback)=>typeof value==='string'&&value.length?value:fallback;
const cue=(id,description,mediumRule)=>Object.freeze({
  id,
  authority:AUTHORITY,
  literalPhysicalEvidence:false,
  navigationRequired:false,
  accessibilityRequired:false,
  description,
  mediumRule
});
const CUE_AUTHORITY=Object.freeze({
  orientation_sonification:cue('orientation_sonification','Non-diegetic scale/travel orientation sonification.','May be presented in vacuum because it is explicitly non-diegetic.'),
  atmospheric_motion_cue:cue('atmospheric_motion_cue','Qualitative atmospheric-motion presentation derived from supplied environment context.','Requires supplied audible-medium context; never treated as a measurement.'),
  surface_weather_cue:cue('surface_weather_cue','Qualitative surface weather texture derived from supplied environmental presentation context.','Requires supplied audible-medium context.'),
  biophony_cue:cue('biophony_cue','Qualitative life/ecology activity presentation.','Requires supplied audible-medium context and life-present flag.'),
  civilization_activity_cue:cue('civilization_activity_cue','Abstract civilization/activity presentation pulse.','Presentation-only; may be non-diegetic and does not prove population or events.'),
  micro_sonification:cue('micro_sonification','Abstract microscopic/material-state sonification.','Always non-diegetic; microscopic processes are not asserted to be literally audible.')
});
function controls(input){
  const c=input&&typeof input==='object'?input:{};
  return Object.freeze({
    enabled:c.enabled!==false,
    muted:bool(c.muted),
    volume:clamp(c.volume===undefined?0.65:Number(c.volume),0,1),
    reducedSensory:bool(c.reducedSensory)
  });
}
function medium(input,regime){
  const source=input&&typeof input==='object'?input:{};
  const supportsSound=bool(source.supportsSound)||bool(source.audible);
  const density=clamp(Number(source.densityNormalized),0,1);
  const vacuum=source.vacuum===true||(!supportsSound&&MACRO_REGIMES.has(regime));
  return Object.freeze({supportsSound:supportsSound&&!vacuum,density,vacuum});
}
function makeLayer(id,type,frequency,gain,activity,diegetic,notes){
  return Object.freeze({
    id,
    type,
    frequency:Math.round(clamp(frequency,20,18000)*1000)/1000,
    gain:Math.round(clamp(gain,0,0.35)*1000000)/1000000,
    activity:Math.round(clamp(activity,0,1)*1000000)/1000000,
    diegetic:diegetic===true,
    authority:AUTHORITY,
    literalPhysicalEvidence:false,
    notes
  });
}
function add(layers,layer){if(layer&&layers.length<MAX_LAYERS)layers.push(layer);}
function plan(contextInput,controlsInput){
  const context=contextInput&&typeof contextInput==='object'?contextInput:{};
  const c=controls(controlsInput);
  const regime=text(context.regime,'unknown');
  const domain=text(context.domain,'general');
  const m=medium(context.medium,regime);
  const motion=context.motion&&typeof context.motion==='object'?context.motion:{};
  const environment=context.environment&&typeof context.environment==='object'?context.environment:{};
  const life=context.life&&typeof context.life==='object'?context.life:{};
  const civilization=context.civilization&&typeof context.civilization==='object'?context.civilization:{};
  const micro=context.micro&&typeof context.micro==='object'?context.micro:{};
  const travel=clamp(Number(motion.travelIntensity),0,1);
  const wind=clamp(Number(environment.windIntensity),0,1);
  const weather=clamp(Number(environment.weatherIntensity),0,1);
  const lifeActivity=clamp(Number(life.activity),0,1);
  const civActivity=clamp(Number(civilization.activity),0,1);
  const microActivity=clamp(Number(micro.activity),0,1);
  const microMode=domain==='micro'||regime==='micro'||regime==='molecular'||regime==='atomic';
  const layers=[];
  let silenceReason=null;
  if(!c.enabled)silenceReason='user-disabled';
  else if(c.muted||c.volume===0)silenceReason='user-muted';
  if(!silenceReason){
    const reduced=c.reducedSensory;
    const orientationGain=(reduced?0.035:0.075)*(0.35+0.65*travel);
    if(MACRO_REGIMES.has(regime)||regime==='approach'||regime==='unknown'){
      add(layers,makeLayer('orientation_sonification','tone',72+44*travel,orientationGain,travel,false,'Non-diegetic orientation cue; not sound propagating through vacuum.'));
    }
    if(microMode){
      add(layers,makeLayer('micro_sonification','tone',310+620*microActivity,reduced?0.035:0.08,microActivity,false,'Abstract sonification only; no literal microscopic audibility claim.'));
    }
    if(m.supportsSound&&(regime==='approach'||SURFACE_REGIMES.has(regime))){
      const mediumStrength=Math.max(m.density,0.15);
      if(wind>0.01)add(layers,makeLayer('atmospheric_motion_cue','noise',130+270*wind,(reduced?0.035:0.09)*wind*mediumStrength,wind,true,'Qualitative presentation from supplied medium/wind context; not measured evidence.'));
      if(weather>0.01)add(layers,makeLayer('surface_weather_cue','noise',420+480*weather,(reduced?0.03:0.08)*weather*mediumStrength,weather,true,'Qualitative presentation from supplied weather context.'));
      if(bool(life.present)&&lifeActivity>0.01)add(layers,makeLayer('biophony_cue','tone',880+520*lifeActivity,(reduced?0.025:0.065)*lifeActivity,lifeActivity,true,'Qualitative ecological activity presentation, not a species or abundance measurement.'));
    }
    if(bool(civilization.present)&&civActivity>0.01&&!reduced){
      add(layers,makeLayer('civilization_activity_cue','pulse',118+94*civActivity,0.055*civActivity,civActivity,false,'Abstract activity cue; does not assert a specific event, population, technology, or acoustic source.'));
    }
  }
  const cues=Object.freeze(layers.map(layer=>CUE_AUTHORITY[layer.id]));
  return Object.freeze({
    schema:'ofu-v1x13-audio-plan-1',
    version:VERSION,
    authority:AUTHORITY,
    optional:true,
    navigationRequired:false,
    accessibilityRequired:false,
    deterministicWorldMutation:false,
    regime,
    domain,
    medium:m,
    controls:c,
    silenceReason,
    layers:Object.freeze(layers),
    cueAuthority:cues,
    claims:Object.freeze({soundInVacuumLiteral:false,scientificEvidence:false,maxLayers:MAX_LAYERS})
  });
}
O.systemicAudioContextV1=Object.freeze({VERSION,AUTHORITY,MAX_LAYERS,CUE_AUTHORITY,controls,plan});
})(globalThis);
