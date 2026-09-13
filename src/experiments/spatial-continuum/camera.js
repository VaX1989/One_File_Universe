import { CONTINUUM_STOPS } from './constants.js';

const CAMERA_KEYS = Object.freeze([
  Object.freeze({position:[0,7,30], target:[0,0,0], fov:.66}),
  Object.freeze({position:[7,3.2,14], target:[0,0,0], fov:.64}),
  Object.freeze({position:[2.4,1.1,9.3], target:[0,0,0], fov:.61}),
  Object.freeze({position:[1.7,1.6,8.7], target:[0,0,.8], fov:.6}),
  Object.freeze({position:[7.5,8.5,13], target:[0,0,-1], fov:.62}),
  Object.freeze({position:[3.2,3.1,6.2], target:[0,.1,-1.4], fov:.66}),
  Object.freeze({position:[0,1.7,3.2], target:[0,1.25,-3], fov:.74}),
  Object.freeze({position:[0,1.2,12.5], target:[0,0,0], fov:.58}),
  Object.freeze({position:[0,.6,10.8], target:[0,0,0], fov:.56}),
  Object.freeze({position:[0,.3,10.5], target:[0,0,0], fov:.54}),
  Object.freeze({position:[0,.15,8], target:[0,0,0], fov:.52})
]);

const mix = (a,b,t) => a + (b-a)*t;
const mix3 = (a,b,t) => a.map((value,index) => mix(value,b[index],t));

export function createTargetAwareCamera({anchorId, focusId, aimId=focusId} = {}) {
  if (!anchorId || !focusId) throw new TypeError('Camera anchor and focus are required');
  let anchor = String(anchorId), focus = String(focusId), aim = String(aimId);
  let yaw = 0, pitch = 0, localPosition = [0,0,0], revision = 0;

  function pose(coordinate) {
    const value = Math.max(0, Math.min(CAMERA_KEYS.length-1, Number(coordinate)));
    const lo = Math.floor(value), hi = Math.ceil(value), t = value-lo;
    const a = CAMERA_KEYS[lo], b = CAMERA_KEYS[hi];
    let position = mix3(a.position,b.position,t), target = mix3(a.target,b.target,t);
    if (value < 5.7) {
      const dx=position[0]-target[0], dz=position[2]-target[2], radius=Math.hypot(dx,dz), angle=Math.atan2(dx,dz)+yaw;
      position=[target[0]+Math.sin(angle)*radius,position[1]+pitch*radius*.28,target[2]+Math.cos(angle)*radius];
    } else if (value < 6.7) {
      const blend=Math.max(0,Math.min(1,(value-5.7)/.5));
      const human=[localPosition[0],1.7+localPosition[1],3.2+localPosition[2]];
      const direction=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
      const humanTarget=human.map((component,index)=>component+direction[index]*6);
      position=mix3(position,human,blend);target=mix3(target,humanTarget,blend);
    }
    const lowerStop=CONTINUUM_STOPS[lo], upperStop=CONTINUUM_STOPS[hi];
    return Object.freeze({
      contract:'ofu-spatial-continuum-camera-pose-1',
      anchorId:anchor,
      focusId:focus,
      aimId:aim,
      frameId:t<.5?lowerStop.frameId:upperStop.frameId,
      frameHandoff:Object.freeze({from:lowerStop.frameId,to:upperStop.frameId,progress:t}),
      position:Object.freeze(position),
      target:Object.freeze(target),
      up:Object.freeze([0,1,0]),
      fov:mix(a.fov,b.fov,t),
      yaw,pitch,
      localPosition:Object.freeze([...localPosition]),
      revision,
      targetAware:true
    });
  }

  return Object.freeze({
    pose,
    orbit(dx,dy) { yaw += Number(dx); pitch=Math.max(-.72,Math.min(.72,pitch+Number(dy))); revision++; },
    moveLocal(forward,right,dt=1) {
      const amount=Math.max(0,Math.min(.1,Number(dt)))*5;
      const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);
      localPosition=[localPosition[0]+(fx*forward+rx*right)*amount,0,localPosition[2]+(fz*forward+rz*right)*amount];
      revision++;
      return Object.freeze([...localPosition]);
    },
    setFocus(id,{anchorId:nextAnchor=id,aimId:nextAim=id}={}) { focus=String(id);anchor=String(nextAnchor);aim=String(nextAim);revision++; },
    restore(snapshot) {
      if (!snapshot) throw new TypeError('Camera snapshot is required');
      anchor=String(snapshot.anchorId);focus=String(snapshot.focusId);aim=String(snapshot.aimId);
      yaw=Number(snapshot.yaw)||0;pitch=Number(snapshot.pitch)||0;localPosition=[...(snapshot.localPosition||[0,0,0])];revision++;
    },
    snapshot(coordinate=0) { return pose(coordinate); }
  });
}
