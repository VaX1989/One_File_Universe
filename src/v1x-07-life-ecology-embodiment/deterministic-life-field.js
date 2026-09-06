(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-07-deterministic-life-field-1';
const AUTHORITY='PRESENTATION_ONLY';
const HARD_MAX_INSTANCES=1536;
const HARD_MAX_STERILE_MARKERS=48;
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const key of Object.keys(value))freeze(value[key]);return Object.freeze(value)}
function clamp(value,min,max){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min}
function ppm(value){return Math.floor(clamp(value,0,1000000))}
function stablePart(value){if(value===null)return'null';if(value===undefined)return'undefined';if(Array.isArray(value))return'['+value.map(stablePart).join(',')+']';if(typeof value==='object')return'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stablePart(value[k])).join(',')+'}';return String(value)}
function hash32(...parts){let h=2166136261>>>0;const text=parts.map(stablePart).join('|');for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;h^=h>>>13;h=Math.imul(h,0x85ebca6b)>>>0;}h^=h>>>16;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return h>>>0}
function hashHex(...parts){return hash32(...parts).toString(16).padStart(8,'0')}
function unitPpm(...parts){return hash32(...parts)%1000001}
function point(seed,index){return freeze({xPpm:unitPpm(VERSION,seed,index,'x'),yPpm:unitPpm(VERSION,seed,index,'y'),depthPpm:unitPpm(VERSION,seed,index,'depth')})}
function viewport(input){const v=input&&typeof input==='object'?input:{};const minXPpm=ppm(v.minXPpm??0),maxXPpm=ppm(v.maxXPpm??1000000),minYPpm=ppm(v.minYPpm??0),maxYPpm=ppm(v.maxYPpm??1000000);return freeze({minXPpm:Math.min(minXPpm,maxXPpm),maxXPpm:Math.max(minXPpm,maxXPpm),minYPpm:Math.min(minYPpm,maxYPpm),maxYPpm:Math.max(minYPpm,maxYPpm)})}
function visible(pointValue,viewportValue){return pointValue.xPpm>=viewportValue.minXPpm&&pointValue.xPpm<=viewportValue.maxXPpm&&pointValue.yPpm>=viewportValue.minYPpm&&pointValue.yPpm<=viewportValue.maxYPpm}
function instanceTarget(densityPpm,maxInstances,organismCount){const max=Math.max(0,Math.min(HARD_MAX_INSTANCES,Math.floor(Number(maxInstances)||0)));const count=Math.max(0,Math.floor(Number(organismCount)||0));const density=ppm(densityPpm);if(!max||!count||!density)return 0;return Math.min(max,Math.max(1,Math.floor(density*max/1000000)))}
const BIOME_GRAMMAR=Object.freeze({
 ABIOTIC:'ABIOTIC_SAMPLING_FIELD',
 AQUATIC_HIGH_PRODUCTIVITY:'LAYERED_FLUID_ECOLOGY_FIELD',
 TEMPERATE_SOLVENT_RICH:'DENSE_PATCH_ECOLOGY_FIELD',
 COLD_LIMITED:'SPARSE_CLUSTER_ECOLOGY_FIELD',
 RADIATION_STRESSED:'SHIELDED_PATCH_ECOLOGY_FIELD',
 DISTURBANCE_MOSAIC:'MOSAIC_ECOLOGY_FIELD',
 DRY_ENERGY_LIMITED:'DISPERSED_ECOLOGY_FIELD',
 MIXED_MODERATE_PRODUCTIVITY:'MIXED_PATCH_ECOLOGY_FIELD'
});
function biomeGrammar(biome){const source=String(biome||'UNKNOWN');return freeze({sourceBiome:source,grammar:BIOME_GRAMMAR[source]||'ABSTRACT_ECOLOGY_FIELD',authority:AUTHORITY,literalHabitatGeometry:false})}
const MOVEMENT=Object.freeze({SESSILE_OR_DRIFTING:90000,SLOW_ACTIVE:360000,HIGHLY_MOBILE:780000});
function behaviorEncoding(morphology){const movement=String(morphology?.movement||'UNKNOWN'),activityCycle=String(morphology?.activityCycle||'UNKNOWN');return freeze({sourceMovement:movement,sourceActivityCycle:activityCycle,motionAmplitudePpm:MOVEMENT[movement]??0,pulsePpm:activityCycle==='PERIODIC'?500000:activityCycle==='CONDITION_DRIVEN'?240000:0,authority:AUTHORITY,literalKinematics:false})}
const SIZE=Object.freeze({MICROSCOPIC:120000,SMALL:320000,MEDIUM:600000,LARGE:880000});
function sizeEncoding(morphology){const source=String(morphology?.sizeClass||'UNKNOWN');return freeze({sourceSizeClass:source,displayScalePpm:SIZE[source]??220000,authority:AUTHORITY,metricBodySizeClaim:false})}
function sterileMarkers(seed,maxMarkers=24){const count=Math.max(0,Math.min(HARD_MAX_STERILE_MARKERS,Math.floor(Number(maxMarkers)||0))),out=[];for(let i=0;i<count;i++)out.push(freeze({markerId:'abiotic-'+hashHex(seed,i),...point(seed,i),kind:'ABIOTIC_SAMPLING_GLYPH',authority:AUTHORITY,scientificMeasurement:false}));return freeze(out)}
O.v1x07LifeField=freeze({VERSION,AUTHORITY,HARD_MAX_INSTANCES,HARD_MAX_STERILE_MARKERS,freeze,clamp,ppm,hash32,hashHex,unitPpm,point,viewport,visible,instanceTarget,biomeGrammar,behaviorEncoding,sizeEncoding,sterileMarkers});
})(globalThis);
