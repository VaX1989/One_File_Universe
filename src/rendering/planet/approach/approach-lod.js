(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const AUTHORITY='PRESENTATION_ONLY';
const LEVELS=Object.freeze(['MARKER','BODY_DISC','GLOBE','GLOBE_DETAIL','DESCENT_SURFACE']);
const LIMITS=Object.freeze({maxFrames:257,minApparentRadiusPx:1,maxApparentRadiusPx:4096});
function finite(v,label){v=Number(v);if(!Number.isFinite(v))throw new TypeError(label+' must be finite');return v}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function levelForRatio(r){r=finite(r,'distanceRatio');if(r>1000)return 0;if(r>50)return 1;if(r>8)return 2;if(r>1.5)return 3;return 4}
function decorate(packet,{bodyCues=null,referenceRadiusPx=160}={}){if(!packet||!Array.isArray(packet.frames))throw new TypeError('approach packet required');if(packet.frames.length>LIMITS.maxFrames)throw new RangeError('approach LOD frame budget exceeded');referenceRadiusPx=finite(referenceRadiusPx,'referenceRadiusPx');if(!(referenceRadiusPx>0))throw new RangeError('referenceRadiusPx must be positive');let last=-1;const frames=packet.frames.map(frame=>{const levelIndex=levelForRatio(frame.distanceRatio);if(levelIndex<last)throw new Error('approach detail must be monotonic');last=levelIndex;const apparentRadiusPx=clamp(referenceRadiusPx/frame.distanceRatio,LIMITS.minApparentRadiusPx,LIMITS.maxApparentRadiusPx);return Object.freeze({...frame,lod:Object.freeze({level:LEVELS[levelIndex],levelIndex,apparentRadiusPx,showAtmosphere:Boolean(bodyCues?.atmosphere?.enabled)&&levelIndex>=2,showRings:Boolean(bodyCues?.rings?.enabled)&&levelIndex>=1,showTerminator:Boolean(bodyCues?.terminator?.enabled)&&levelIndex>=1,showSurfaceDetail:levelIndex>=3,authority:AUTHORITY})})});return Object.freeze({...packet,frames:Object.freeze(frames),lod:Object.freeze({authority:AUTHORITY,levels:LEVELS,monotonicDetail:true,bodyCueAuthority:bodyCues?.authority||null}),limitations:Object.freeze([...(packet.limitations||[]),'Apparent radius and LOD thresholds are bounded presentation policy, not physical angular diameter.'])})}
function validate(packet){if(!packet||!Array.isArray(packet.frames)||packet.frames.length<2)return false;let last=-1;let apparent=0;for(const frame of packet.frames){const lod=frame.lod;if(!lod||LEVELS[lod.levelIndex]!==lod.level||lod.levelIndex<last||lod.apparentRadiusPx+1e-12<apparent)return false;last=lod.levelIndex;apparent=lod.apparentRadiusPx}return true}
O.v2x04ApproachLod=Object.freeze({VERSION:'ofu-v2x-04-approach-lod-1',AUTHORITY,LEVELS,LIMITS,levelForRatio,decorate,validate});
})(typeof globalThis!=='undefined'?globalThis:this);
