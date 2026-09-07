(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-living-audio-context-1',AUTHORITY='PRESENTATION_ONLY';
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));
function fromLiving(s={}){
 const p=s.world?.planetology||{},local=s.local||null,stage=String(s.stage||'UNKNOWN');
 const atmosphere=!!p.atmosphere&&!!local&&!['ORBIT','APPROACH'].includes(stage);
 const localLife=local?.life?.local?.populations||[];
 const civPresent=s.world?.civilization?.state==='MODELED_CIVILIZATION'&&Array.isArray(local?.objects)&&local.objects.some(x=>x?.kind==='SETTLEMENT');
 const lifePresent=s.world?.biology?.occupancy?.biosphereEstablished===true&&localLife.length>0;
 const micro=['TISSUE','CELL','MOLECULAR','ATOMIC'].includes(stage);
 return Object.freeze({regime:stage.toLowerCase(),domain:micro?'micro':local?'surface':'macro',medium:{supportsSound:atmosphere,audible:atmosphere,vacuum:!atmosphere&&['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT'].includes(stage),densityNormalized:atmosphere?0.7:0},motion:{travelIntensity:clamp(s.transition?.progress||0)},environment:{windIntensity:atmosphere?0.25:0,weatherIntensity:atmosphere&&local?.surface?.climate?0.2:0},life:{present:lifePresent,activity:lifePresent?clamp(localLife.length/8):0},civilization:{present:civPresent,activity:civPresent?0.45:0},micro:{activity:micro?0.5:0},authority:AUTHORITY});
}
O.v2x14LivingAudioContext=Object.freeze({VERSION,AUTHORITY,fromLiving});
})(globalThis);
