(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const AUTHORITY='PRESENTATION_ONLY';
const LIMITS=Object.freeze({maxStars:8,minApparentRadiusPx:2,maxApparentRadiusPx:48,maxGlowRadiusPx:96});
function knownNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function temperatureCue(k){if(k===null||!(k>0))return Object.freeze({known:false,normalized:0.5,label:'UNKNOWN'});const normalized=clamp((Math.log10(k)-3.45)/(4.1-3.45),0,1);return Object.freeze({known:true,normalized,label:'MODEL_OR_CANONICAL_INPUT'})}
function radiusCue(milliSolar){if(milliSolar===null||!(milliSolar>0))return Object.freeze({known:false,apparentRadiusPx:6});return Object.freeze({known:true,apparentRadiusPx:clamp(4+8*Math.log1p(milliSolar/1000),LIMITS.minApparentRadiusPx,LIMITS.maxApparentRadiusPx)})}
function luminosityCue(milliSolar){if(milliSolar===null||!(milliSolar>0))return Object.freeze({known:false,glowRadiusPx:18,intensity:0.6});const l=milliSolar/1000;return Object.freeze({known:true,glowRadiusPx:clamp(14+18*Math.log1p(l),14,LIMITS.maxGlowRadiusPx),intensity:clamp(0.45+0.2*Math.log1p(l),0.45,1.4)})}
function describeStar(star){if(!star||!star.id)throw new TypeError('star envelope with id required');const f=star.facts||{},temperatureK=knownNumber(f.effectiveTemperatureK),radiusMilliSolar=knownNumber(f.radiusMilliSolar),luminosityMilliSolar=knownNumber(f.luminosityMilliSolar),t=temperatureCue(temperatureK),r=radiusCue(radiusMilliSolar),l=luminosityCue(luminosityMilliSolar);return Object.freeze({canonicalEntityId:String(star.id),authority:AUTHORITY,scientificEvidence:false,temperature:Object.freeze({sourceValueK:temperatureK,cue:t}),radius:Object.freeze({sourceValueMilliSolar:radiusMilliSolar,cue:r}),luminosity:Object.freeze({sourceValueMilliSolar:luminosityMilliSolar,cue:l}),fallbackUsed:!(t.known&&r.known&&l.known),limitations:Object.freeze(['Unknown stellar properties remain visually generic rather than inferred.','Glow is a bounded presentation cue, not measured radiative transfer.','This descriptor does not acquire illumination or camera authority.'])})}
function describeSystem(stars){if(!Array.isArray(stars))throw new TypeError('stars array required');if(stars.length>LIMITS.maxStars)throw new RangeError('stellar appearance budget exceeded');return Object.freeze({authority:AUTHORITY,stars:Object.freeze(stars.map(describeStar)),resourceUsage:Object.freeze({stars:stars.length,maxStars:LIMITS.maxStars})})}
O.v2x04StellarAppearance=Object.freeze({VERSION:'ofu-v2x-04-stellar-appearance-1',AUTHORITY,LIMITS,temperatureCue,radiusCue,luminosityCue,describeStar,describeSystem});
})(typeof globalThis!=='undefined'?globalThis:this);
