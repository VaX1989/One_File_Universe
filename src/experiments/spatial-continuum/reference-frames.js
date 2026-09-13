const finiteVector = (value, label) => {
  if (!Array.isArray(value) || value.length !== 3 || value.some(item => !Number.isFinite(Number(item)))) {
    throw new TypeError(label + ' must be a finite 3-vector');
  }
  return Object.freeze(value.map(Number));
};

const quaternion = value => {
  if (!Array.isArray(value) || value.length !== 4 || value.some(item => !Number.isFinite(Number(item)))) {
    throw new TypeError('orientation must be a finite quaternion');
  }
  const out=value.map(Number), length=Math.hypot(...out);
  if (!(length>0)) throw new TypeError('orientation quaternion must be nonzero');
  return Object.freeze(out.map(item=>item/length));
};

const rotate=(point,[x,y,z,w])=>{
  const [vx,vy,vz]=point;
  const ix=w*vx+y*vz-z*vy, iy=w*vy+z*vx-x*vz, iz=w*vz+x*vy-y*vx, iw=-x*vx-y*vy-z*vz;
  return [ix*w+iw*-x+iy*-z-iz*-y,iy*w+iw*-y+iz*-x-ix*-z,iz*w+iw*-z+ix*-y-iy*-x];
};
const multiplyQuaternion=([ax,ay,az,aw],[bx,by,bz,bw])=>[
  aw*bx+ax*bw+ay*bz-az*by,
  aw*by-ax*bz+ay*bw+az*bx,
  aw*bz+ax*by-ay*bx+az*bw,
  aw*bw-ax*bx-ay*by-az*bz
];

export function referenceFrame(spec) {
  if (!spec || typeof spec !== 'object') throw new TypeError('Reference frame specification is required');
  const id=String(spec.id||'').trim(), metersPerUnit=Number(spec.metersPerUnit);
  if (!id) throw new TypeError('Reference frame id is required');
  if (!(metersPerUnit>0) || !Number.isFinite(metersPerUnit)) throw new TypeError('metersPerUnit must be positive');
  return Object.freeze({
    id,
    parentId:spec.parentId==null?null:String(spec.parentId),
    originInParent:finiteVector(spec.originInParent||[0,0,0],'originInParent'),
    metersPerUnit,
    orientation:quaternion(spec.orientation||[0,0,0,1]),
    authority:String(spec.authority||'PRESENTATION_ONLY')
  });
}

export function createReferenceFrameRegistry(specs) {
  const frames=new Map();
  for (const spec of specs) {
    const frame=referenceFrame(spec);
    if (frames.has(frame.id)) throw new Error('Duplicate reference frame: '+frame.id);
    frames.set(frame.id,frame);
  }
  for (const frame of frames.values()) if (frame.parentId!=null && !frames.has(frame.parentId)) {
    throw new Error('Missing parent frame: '+frame.parentId);
  }
  for (const start of frames.values()) {
    const seen=new Set(); let frame=start;
    while (frame) {
      if (seen.has(frame.id)) throw new Error('Reference frame cycle at '+frame.id);
      seen.add(frame.id); frame=frame.parentId==null?null:frames.get(frame.parentId);
    }
  }

  const chain=frameId=>{
    let frame=frames.get(String(frameId));
    if (!frame) throw new Error('Unknown reference frame: '+frameId);
    const out=[];
    while (frame) { out.push(frame); frame=frame.parentId==null?null:frames.get(frame.parentId); }
    return out;
  };

  const commonAncestor=(a,b)=>{
    const right=new Set(chain(b).map(frame=>frame.id));
    const ancestor=chain(a).find(frame=>right.has(frame.id));
    if (!ancestor) throw new Error('Reference frames do not share a root: '+a+' / '+b);
    return ancestor;
  };

  // Express a point as physical metres in ancestor-local axes. Stopping at the
  // lowest common ancestor avoids subtracting two universe-sized float64 values.
  const toAncestorMeters=(point,frameId,ancestorId)=>{
    let frame=frames.get(String(frameId));
    if (!frame) throw new Error('Unknown reference frame: '+frameId);
    let out=finiteVector(point,'point').map(value=>value*frame.metersPerUnit);
    while (frame.id!==ancestorId) {
      if (frame.parentId==null) throw new Error(ancestorId+' is not an ancestor of '+frameId);
      const parent=frames.get(frame.parentId);
      out=rotate(out,frame.orientation).map((value,axis)=>value+frame.originInParent[axis]*parent.metersPerUnit);
      frame=parent;
    }
    return out;
  };

  const vectorFromAncestorToRoot=(vector,ancestorId)=>{
    let frame=frames.get(String(ancestorId)), out=[...vector];
    while (frame) { out=rotate(out,frame.orientation); frame=frame.parentId==null?null:frames.get(frame.parentId); }
    return out;
  };

  const absoluteRootMeters=(point,frameId)=>{
    let frame=frames.get(String(frameId));
    if (!frame) throw new Error('Unknown reference frame: '+frameId);
    let out=finiteVector(point,'point').map(value=>value*frame.metersPerUnit);
    while (frame) {
      out=rotate(out,frame.orientation);
      if (frame.parentId!=null) {
        const parent=frames.get(frame.parentId);
        out=out.map((value,axis)=>value+frame.originInParent[axis]*parent.metersPerUnit);
        frame=parent;
      } else frame=null;
    }
    return out;
  };

  const relativeMeters=(point,pointFrameId,originPoint,originFrameId)=>{
    const ancestor=commonAncestor(pointFrameId,originFrameId);
    const a=toAncestorMeters(point,pointFrameId,ancestor.id), b=toAncestorMeters(originPoint,originFrameId,ancestor.id);
    return vectorFromAncestorToRoot(a.map((value,axis)=>value-b[axis]),ancestor.id);
  };

  const directionToRoot=(direction,frameId)=>{
    let out=finiteVector(direction,'direction'), frame=frames.get(String(frameId));
    if (!frame) throw new Error('Unknown reference frame: '+frameId);
    while (frame) { out=rotate(out,frame.orientation); frame=frame.parentId==null?null:frames.get(frame.parentId); }
    return out;
  };

  const orientationToRoot=frameId=>{
    let frame=frames.get(String(frameId)), out=[0,0,0,1];
    if (!frame) throw new Error('Unknown reference frame: '+frameId);
    while (frame) { out=multiplyQuaternion(frame.orientation,out); frame=frame.parentId==null?null:frames.get(frame.parentId); }
    return quaternion(out);
  };

  return Object.freeze({
    get size(){return frames.size;},
    get(id){return frames.get(String(id))||null;},
    toRootMeters(point,frameId){return Object.freeze(absoluteRootMeters(point,frameId));},
    rootOriginMeters(frameId){return Object.freeze(absoluteRootMeters([0,0,0],frameId));},
    relativeMeters(point,pointFrameId,originPoint,originFrameId){return Object.freeze(relativeMeters(point,pointFrameId,originPoint,originFrameId));},
    directionToRoot(direction,frameId){return Object.freeze(directionToRoot(direction,frameId));},
    orientationToRoot(frameId){return orientationToRoot(frameId);},
    cameraRelativeFloat32(point,pointFrameId,cameraPoint,cameraFrameId){
      return Object.freeze(relativeMeters(point,pointFrameId,cameraPoint,cameraFrameId).map(Math.fround));
    },
    renderRelativeFloat32(point,pointFrameId,originPoint,originFrameId,metersPerRenderUnit){
      const scale=Number(metersPerRenderUnit);
      if (!(scale>0) || !Number.isFinite(scale)) throw new TypeError('metersPerRenderUnit must be positive');
      return Object.freeze(relativeMeters(point,pointFrameId,originPoint,originFrameId).map(value=>Math.fround(value/scale)));
    },
    renderRelativeToHandoffFloat32(point,pointFrameId,originHandoff,metersPerRenderUnit){
      const scale=Number(metersPerRenderUnit), progress=Math.max(0,Math.min(1,Number(originHandoff?.progress)||0)), from=originHandoff?.from, to=originHandoff?.to;
      if (!(scale>0) || !Number.isFinite(scale)) throw new TypeError('metersPerRenderUnit must be positive');
      if (!from?.frameId || !to?.frameId) throw new TypeError('Render origin handoff is required');
      const a=relativeMeters(point,pointFrameId,from.point||[0,0,0],from.frameId), b=relativeMeters(point,pointFrameId,to.point||[0,0,0],to.frameId);
      return Object.freeze(a.map((value,axis)=>Math.fround((value+(b[axis]-value)*progress)/scale)));
    },
    snapshot(){
      return Object.freeze({
        contract:'ofu-spatial-continuum-reference-frames-2',frameCount:frames.size,
        frames:Object.freeze([...frames.values()]),roots:Object.freeze([...frames.values()].filter(frame=>frame.parentId==null).map(frame=>frame.id)),
        cpuPrecision:'FLOAT64_HIERARCHICAL',gpuPrecision:'LCA_RELATIVE_FLOAT32',lowestCommonAncestorRebasing:true
      });
    }
  });
}
