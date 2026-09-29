import { CONTINUUM_STOPS } from './constants.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)));
const mix=(a,b,t)=>a+(b-a)*t;
const mix3=(a,b,t)=>a.map((value,index)=>mix(value,b[index],t));
const normalize=value=>{const length=Math.hypot(...value);return length>0?value.map(item=>item/length):[0,0,1]};
const logMix=(a,b,t)=>Math.exp(mix(Math.log(a),Math.log(b),t));

const PROFILES=Object.freeze([
  Object.freeze({target:'universe',coverage:.68,fov:.72,direction:'UNIVERSE'}),
  Object.freeze({target:'galaxy',coverage:.72,fov:.68,direction:'GALAXY'}),
  Object.freeze({target:'region',coverage:.78,fov:.66,direction:'REGION'}),
  Object.freeze({target:'neighborhood',coverage:.70,fov:.66,direction:'NEIGHBORHOOD'}),
  Object.freeze({target:'system',coverage:.50,fov:.66,direction:'SYSTEM'}),
  Object.freeze({target:'body',coverage:.58,fov:.64,direction:'ORBIT'}),
  Object.freeze({target:'body',coverage:.82,fov:.61,direction:'APPROACH'}),
  Object.freeze({target:'body',coverage:.90,fov:.60,direction:'SURFACE'}),
  Object.freeze({target:'regional',coverage:1.15,fov:.62,direction:'LOCAL'}),
  Object.freeze({target:'local',coverage:1.25,fov:.66,direction:'LOCAL'}),
  Object.freeze({target:'human',coverage:1.82,fov:.74,direction:'HUMAN'}),
  Object.freeze({target:'sample',coverage:.96,fov:.58,direction:'CONTEXT'}),
  Object.freeze({target:'micro',coverage:1.08,fov:.56,direction:'CONTEXT'}),
  Object.freeze({target:'molecular',coverage:.96,fov:.54,direction:'CONTEXT'}),
  Object.freeze({target:'atomic',coverage:1.12,fov:.52,direction:'CONTEXT'})
]);

export function distanceForProjectedCoverage(radius,fov,coverage){
  const r=Number(radius), angle=clamp(Number(fov)*Number(coverage)/2,.02,1.42);
  if(!(r>0)||!Number.isFinite(r))throw new TypeError('Camera target radius must be positive');
  return r/Math.sin(angle);
}

function directionFor(kind,target,yaw,pitch,frames){
  const surface=target.surfaceFrameId&&frames.get(target.surfaceFrameId)?target.surfaceFrameId:null;
  const east=surface?frames.directionToRoot([1,0,0],surface):[1,0,0], up=surface?frames.directionToRoot([0,1,0],surface):[0,1,0], north=surface?frames.directionToRoot([0,0,1],surface):[0,0,1];
  let base=kind==='UNIVERSE'?[.16,.18,1]:kind==='GALAXY'?[.1,.3,1]:kind==='REGION'?[.2,.18,1]:kind==='NEIGHBORHOOD'?[.08,.1,1]:kind==='SYSTEM'?[.2,.26,1]:kind==='ORBIT'?mix3(up,mix3(east,north,.62),.46):kind==='APPROACH'?mix3(up,north,.24):kind==='SURFACE'?mix3(up,north,.08):kind==='LOCAL'?mix3(up,north,.32):kind==='CONTEXT'?mix3(up,north,.92):[0,0,1];
  base=normalize(base);
  if(kind==='HUMAN')return base;
  const horizontal=normalize([base[0],0,base[2]]), angle=Math.atan2(horizontal[0],horizontal[2])+yaw, elevation=Math.asin(clamp(base[1],-1,1))+pitch*.45;
  return normalize([Math.sin(angle)*Math.cos(elevation),Math.sin(elevation),Math.cos(angle)*Math.cos(elevation)]);
}

function origin(target){return Object.freeze({frameId:target.frameId,point:Object.freeze([...(target.point||[0,0,0])]),targetId:target.id});}

export function createTargetAwareCamera({anchorId,focusId,aimId=focusId,targets,frames}={}){
  if(!anchorId||!focusId)throw new TypeError('Camera anchor and focus are required');
  if(!targets||!frames)throw new TypeError('Camera spatial targets and reference frames are required');
  let anchor=String(anchorId),focus=String(focusId),aim=String(aimId),yaw=0,pitch=0,localPosition=[0,0,0],macroPosition=[0,0,0],revision=0;

  function solution(index){
    const profile=PROFILES[index],target=profile.target==='body'?(targets.bodies?.[focus]||targets.body):targets[profile.target];
    if(!target)throw new Error('Missing camera target: '+profile.target);
    const metresPerRenderUnit=target.radiusM/target.renderRadius, renderDistance=distanceForProjectedCoverage(target.renderRadius,profile.fov,profile.coverage), direction=directionFor(profile.direction,target,yaw,pitch,frames);
    if(profile.direction==='HUMAN'){
      const humanPitch=clamp(pitch-.18,-.82,.62),local=[localPosition[0],1.7+localPosition[1],3.2+localPosition[2]],localLook=normalize([Math.sin(yaw)*Math.cos(humanPitch),Math.sin(humanPitch),-Math.cos(yaw)*Math.cos(humanPitch)]),frameMetresPerUnit=frames.get(target.frameId)?.metersPerUnit||1,positionOffsetMeters=frames.directionToRoot(local,target.frameId).map(value=>value*frameMetresPerUnit),look=normalize(frames.directionToRoot(localLook,target.frameId)),targetOffsetMeters=positionOffsetMeters.map((value,axis)=>value+look[axis]*6*metresPerRenderUnit);
      return{profile,target,origin:origin(target),metresPerRenderUnit,renderDistance,positionOffsetMeters,targetOffsetMeters,up:target.up||[0,1,0],direction:look};
    }
    const offset=profile.direction==='UNIVERSE'?macroPosition:[0,0,0],positionOffsetMeters=direction.map((value,index)=>(value*renderDistance+offset[index])*metresPerRenderUnit),targetOffsetMeters=offset.map(value=>value*metresPerRenderUnit);
    return{profile,target,origin:origin(target),metresPerRenderUnit,renderDistance,positionOffsetMeters,targetOffsetMeters,up:target.up||[0,1,0],direction};
  }

  function pose(coordinate){
    const value=clamp(coordinate,0,PROFILES.length-1),lo=Math.floor(value),hi=Math.ceil(value),t=value-lo,a=solution(lo),b=solution(hi),metresPerRenderUnit=logMix(a.metresPerRenderUnit,b.metresPerRenderUnit,t),lowerStop=CONTINUUM_STOPS[lo],upperStop=CONTINUUM_STOPS[hi];
    const renderOrigin=Object.freeze({from:a.origin,to:b.origin,progress:t});
    const renderSolution=solution=>{
      const targetOrigin=frames.renderRelativeToHandoffFloat32(solution.target.point||[0,0,0],solution.target.frameId,renderOrigin,metresPerRenderUnit);
      return Object.freeze({
        position:Object.freeze(targetOrigin.map((value,axis)=>value+solution.positionOffsetMeters[axis]/metresPerRenderUnit)),
        target:Object.freeze(targetOrigin.map((value,axis)=>value+solution.targetOffsetMeters[axis]/metresPerRenderUnit))
      });
    };
    const renderedA=renderSolution(a),renderedB=renderSolution(b);
    return Object.freeze({
      contract:'ofu-spatial-continuum-camera-pose-3',anchorId:anchor,focusId:focus,aimId:aim,
      frameId:t<.5?a.origin.frameId:b.origin.frameId,
      frameHandoff:Object.freeze({from:a.origin.frameId,to:b.origin.frameId,progress:t}),
      renderOrigin,metresPerRenderUnit,
      position:Object.freeze(mix3(renderedA.position,renderedB.position,t)),target:Object.freeze(mix3(renderedA.target,renderedB.target,t)),up:Object.freeze(normalize(mix3(a.up,b.up,t))),
      fov:mix(a.profile.fov,b.profile.fov,t),yaw,pitch,localPosition:Object.freeze([...localPosition]),macroPosition:Object.freeze([...macroPosition]),revision,
      targetRadiusM:mix(a.target.radiusM,b.target.radiusM,t),targetDerived:true,hardCodedCartesianPose:false,
      derivation:Object.freeze({fromTargetId:a.target.id,toTargetId:b.target.id,fromRadiusM:a.target.radiusM,toRadiusM:b.target.radiusM,projectedCoverage:mix(a.profile.coverage,b.profile.coverage,t),metresPerRenderUnit}),
      semanticHandoff:Object.freeze({from:lowerStop.stage,to:upperStop.stage,progress:t})
    });
  }

  return Object.freeze({
    pose,
    orbit(dx,dy){yaw+=Number(dx);pitch=clamp(pitch+Number(dy),-.72,.72);revision++;},
    moveMacro(forward,right,vertical=0,dt=1){const amount=clamp(dt,0,.1)*26,fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);macroPosition=[macroPosition[0]+(fx*forward+rx*right)*amount,macroPosition[1]+Number(vertical)*amount,macroPosition[2]+(fz*forward+rz*right)*amount];revision++;return Object.freeze([...macroPosition])},
    translateMacro(delta){if(!Array.isArray(delta)||delta.length!==3)throw new TypeError('Macro translation requires a three-axis render-space delta');macroPosition=macroPosition.map((value,index)=>value+Number(delta[index]));revision++;return Object.freeze([...macroPosition])},
    rebaseMacro(delta){if(!Array.isArray(delta)||delta.length!==3)throw new TypeError('Macro rebase requires a three-axis render-space delta');macroPosition=macroPosition.map((value,index)=>value-Number(delta[index]));revision++;return Object.freeze([...macroPosition])},
    moveLocal(forward,right,dt=1){const amount=clamp(dt,0,.1)*5,fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);localPosition=[localPosition[0]+(fx*forward+rx*right)*amount,0,localPosition[2]+(fz*forward+rz*right)*amount];revision++;return Object.freeze([...localPosition]);},
    setFocus(id,{anchorId:nextAnchor=id,aimId:nextAim=id}={}){focus=String(id);anchor=String(nextAnchor);aim=String(nextAim);revision++;},
    restore(snapshot){if(!snapshot)throw new TypeError('Camera snapshot is required');anchor=String(snapshot.anchorId);focus=String(snapshot.focusId);aim=String(snapshot.aimId);yaw=Number(snapshot.yaw)||0;pitch=Number(snapshot.pitch)||0;localPosition=[...(snapshot.localPosition||[0,0,0])];macroPosition=[...(snapshot.macroPosition||[0,0,0])];revision++;},
    snapshot(coordinate=0){return pose(coordinate);}
  });
}
