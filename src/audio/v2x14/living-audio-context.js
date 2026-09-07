(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-living-audio-context-4',AUTHORITY='PRESENTATION_ONLY';
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));
const MICRO=new Set(['MATERIAL','MICROSTRUCTURE','TISSUE','CELL','MOLECULAR','ATOMIC']),VACUUM=new Set(['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT']),SURFACE=new Set(['APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN']);
const REGIME=Object.freeze({REGION:'galactic_region',NEIGHBORHOOD:'stellar_neighborhood'}),regimeFor=stage=>REGIME[stage]||String(stage||'UNKNOWN').toLowerCase();
function fromLiving(s={}){
 const p=s.world?.planetology||{},local=s.local||null,stage=String(s.stage||'UNKNOWN'),atmosphere=p.atmosphere||{},micro=MICRO.has(stage),surface=SURFACE.has(stage),regime=regimeFor(stage);
 const pressure=Number(atmosphere.pressureProxyPpm),knownPressure=Number.isFinite(pressure),supportsSound=surface&&!!local&&knownPressure&&pressure>=12000;
 const localLife=Array.isArray(local?.life?.local?.populations)?local.life.local.populations:[],localObjects=Array.isArray(local?.objects)?local.objects:[];
 const modeledCiv=s.world?.civilization?.state==='MODELED_CIVILIZATION'&&localObjects.some(x=>x?.kind==='SETTLEMENT'),modeledLife=s.world?.biology?.occupancy?.biosphereEstablished===true&&localLife.length>0,civPresent=!micro&&modeledCiv,lifePresent=!micro&&modeledLife;
 const wind=Number(local?.surface?.climate?.windIntensityPpm),weather=Number(local?.surface?.climate?.precipitationPotentialPpm??p.climate?.precipitationPotentialPpm);
 return Object.freeze({regime,domain:micro?'micro':surface?'surface':'macro',medium:{supportsSound,audible:supportsSound,vacuum:VACUUM.has(stage),densityNormalized:supportsSound?clamp(pressure/1000000):0,knownPressure},motion:{travelIntensity:clamp(s.transition?.progress||0)},environment:{windIntensity:supportsSound&&Number.isFinite(wind)?clamp(wind/1000000):0,weatherIntensity:supportsSound&&Number.isFinite(weather)?clamp(weather/1000000):0},life:{present:lifePresent,activity:lifePresent?clamp(localLife.length/8):0,modeledInUnderlyingContext:modeledLife},civilization:{present:civPresent,activity:civPresent?clamp(localObjects.filter(x=>x?.kind==='SETTLEMENT').length/6):0,modeledInUnderlyingContext:modeledCiv},micro:{activity:micro?0.5:0},authority:AUTHORITY,claims:Object.freeze({scientificEvidence:false,literalVacuumSound:false,unknownAtmosphereAudible:false,microCrossDomainAudioSuppressed:true,plannerRegimeAligned:true,domainDerivedFromSemanticStage:true})});
}
O.v2x14LivingAudioContext=Object.freeze({VERSION,AUTHORITY,REGIME,regimeFor,fromLiving});
})(globalThis);
