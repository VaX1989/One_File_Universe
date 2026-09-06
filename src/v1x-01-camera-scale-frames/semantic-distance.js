(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-semantic-distance-1';
const AUTHORITY='PRESENTATION_ONLY';
const WAVE_IV_SCALE_CONTRACT='ofu-wave-iv-scale-runtime-3';
const LADDER=Object.freeze(['galaxy','galactic_region','stellar_neighborhood','system','orbit','approach','global_surface','regional_surface','local_surface','human']);
const DEFAULT_ANCHORS=Object.freeze({galaxy:1e12,galactic_region:2.5e9,stellar_neighborhood:1e7,system:180,orbit:4,approach:1.35,global_surface:1.02,regional_surface:1.006,local_surface:1.0007,human:1.00008});
const LN10=Math.log(10);
function finite(value,label='value'){const n=Number(value);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n;}
function positive(value,label='value'){const n=finite(value,label);if(n<=0)throw new RangeError(label+' must be positive');return n;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function normalizeBand(value){let b=String(value||'').toLowerCase();if(b==='neighborhood')b='stellar_neighborhood';if(b==='surface')b='global_surface';if(b==='close')b='human';if(!LADDER.includes(b))throw new Error('unsupported Wave IV semantic scale: '+b);return b;}
function normalizeAnchors(input=DEFAULT_ANCHORS){
 const out={};for(const band of LADDER)out[band]=positive(input[band],band+' anchor');
 for(let i=0;i<LADDER.length-1;i++)if(!(out[LADDER[i]]>out[LADDER[i+1]]))throw new Error('scale anchors must be strictly descending');
 return Object.freeze(out);
}
function createScaleModel({referenceRadiusM,anchors=DEFAULT_ANCHORS,hysteresisFraction=.07,minLogDistanceM=-18,maxLogDistanceM=30}={}){
 const radius=positive(referenceRadiusM,'referenceRadiusM'),A=normalizeAnchors(anchors),h=clamp(finite(hysteresisFraction,'hysteresisFraction'),0,.45),minLog=finite(minLogDistanceM,'minLogDistanceM'),maxLog=finite(maxLogDistanceM,'maxLogDistanceM');
 if(!(minLog<maxLog))throw new RangeError('distance log bounds inverted');
 const anchorDistanceM=Object.freeze(Object.fromEntries(LADDER.map(b=>[b,(A[b]-1)*radius])));
 if(Object.values(anchorDistanceM).some(v=>!Number.isFinite(v)||v<=0))throw new RangeError('anchors must remain above the reference surface');
 const anchorLogM=Object.freeze(Object.fromEntries(LADDER.map(b=>[b,Math.log10(anchorDistanceM[b])])));
 const boundaryLogM=Object.freeze(LADDER.slice(0,-1).map((band,i)=>{const boundaryRadii=Math.sqrt(A[band]*A[LADDER[i+1]]),distanceM=(boundaryRadii-1)*radius;if(!(distanceM>0))throw new RangeError('semantic boundary must remain above the reference surface');return Object.freeze({outer:band,inner:LADDER[i+1],boundaryRadii,logM:Math.log10(distanceM)});}));
 function clampLog(value){return clamp(finite(value,'logDistanceM'),minLog,maxLog);}
 function distanceM(logDistanceM){const v=10**clampLog(logDistanceM);if(!Number.isFinite(v)||v<=0)throw new RangeError('derived distance is not finite');return v;}
 function distanceRadii(logDistanceM){return 1+distanceM(logDistanceM)/radius;}
 function rawBand(logDistanceM){
  const log=clampLog(logDistanceM);let idx=LADDER.length-1;
  for(let i=0;i<boundaryLogM.length;i++)if(log>=boundaryLogM[i].logM){idx=i;break;}
  return LADDER[idx];
 }
 function deriveBand(logDistanceM,{previous=null}={}){
  const log=clampLog(logDistanceM),next=rawBand(log);if(previous==null)return next;
  const prev=normalizeBand(previous),pi=LADDER.indexOf(prev),ni=LADDER.indexOf(next);if(Math.abs(pi-ni)!==1)return next;
  const boundary=boundaryLogM[Math.min(pi,ni)].logM,dead=Math.log10(1+h);
  if(log>boundary-dead&&log<boundary+dead)return prev;
  return next;
 }
 function transitionPath(fromBand,toBand){
  const from=normalizeBand(fromBand),to=normalizeBand(toBand),a=LADDER.indexOf(from),b=LADDER.indexOf(to),step=Math.sign(b-a),out=[];if(!step)return Object.freeze(out);
  for(let i=a;i!==b;i+=step)out.push(Object.freeze({from:LADDER[i],to:LADDER[i+step],boundaryLogM:boundaryLogM[Math.min(i,i+step)].logM}));
  return Object.freeze(out);
 }
 function describe(logDistanceM,{previous=null}={}){
  const log=clampLog(logDistanceM),band=deriveBand(log,{previous});
  return Object.freeze({contract:VERSION,authority:AUTHORITY,distanceAuthorityKey:'logDistanceM',logDistanceM:log,distanceM:distanceM(log),distanceRadii:distanceRadii(log),semanticScale:band,waveIVCompatible:true,belowWaveIVHuman:log<boundaryLogM.at(-1).logM});
 }
 return Object.freeze({contract:VERSION,authority:AUTHORITY,waveIVContract:WAVE_IV_SCALE_CONTRACT,referenceRadiusM:radius,anchors:A,anchorDistanceM,anchorLogM,boundaryLogM,minLogDistanceM:minLog,maxLogDistanceM:maxLog,hysteresisFraction:h,clampLog,distanceM,distanceRadii,deriveBand,rawBand,transitionPath,describe});
}
function wheelDeltaLog10(deltaY,{sensitivity=.0042,maxAbsDelta=180}={}){return clamp(finite(deltaY,'wheel delta'),-positive(maxAbsDelta,'maxAbsDelta'),positive(maxAbsDelta,'maxAbsDelta'))*positive(sensitivity,'sensitivity')/LN10;}
function pinchDeltaLog10(ratio,{exponent=2.25}={}){const r=positive(ratio,'pinch ratio');return -positive(exponent,'pinch exponent')*Math.log(r)/LN10;}
function keyboardDeltaLog10(direction,{factor=1.42}={}){const d=Math.sign(finite(direction,'keyboard direction'));return d===0?0:d*Math.log10(positive(factor,'keyboard factor'));}
O.v1xSemanticDistance=Object.freeze({VERSION,AUTHORITY,WAVE_IV_SCALE_CONTRACT,LADDER,DEFAULT_ANCHORS,createScaleModel,wheelDeltaLog10,pinchDeltaLog10,keyboardDeltaLog10,normalizeBand});
})(typeof globalThis!=='undefined'?globalThis:this);
