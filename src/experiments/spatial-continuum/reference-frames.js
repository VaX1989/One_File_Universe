const finiteVector = (value, label) => {
  if (!Array.isArray(value) || value.length !== 3 || value.some(item => !Number.isFinite(Number(item)))) {
    throw new TypeError(label + ' must be a finite 3-vector');
  }
  return Object.freeze(value.map(Number));
};
const quaternion=value=>{if(!Array.isArray(value)||value.length!==4||value.some(item=>!Number.isFinite(Number(item))))throw new TypeError('orientation must be a finite quaternion');const out=value.map(Number),length=Math.hypot(...out);if(!(length>0))throw new TypeError('orientation quaternion must be nonzero');return Object.freeze(out.map(item=>item/length));};
const rotate=(point,[x,y,z,w])=>{const [vx,vy,vz]=point,ix=w*vx+y*vz-z*vy,iy=w*vy+z*vx-x*vz,iz=w*vz+x*vy-y*vx,iw=-x*vx-y*vy-z*vz;return[ix*w+iw*-x+iy*-z-iz*-y,iy*w+iw*-y+iz*-x-ix*-z,iz*w+iw*-z+ix*-y-iy*-x];};

export function referenceFrame(spec) {
  if (!spec || typeof spec !== 'object') throw new TypeError('Reference frame specification is required');
  const id = String(spec.id || '').trim();
  if (!id) throw new TypeError('Reference frame id is required');
  const metersPerUnit = Number(spec.metersPerUnit);
  if (!(metersPerUnit > 0) || !Number.isFinite(metersPerUnit)) throw new TypeError('metersPerUnit must be positive');
  return Object.freeze({
    id,
    parentId: spec.parentId == null ? null : String(spec.parentId),
    originInParent: finiteVector(spec.originInParent || [0,0,0], 'originInParent'),
    metersPerUnit,
    orientation: quaternion(spec.orientation || [0,0,0,1]),
    authority: String(spec.authority || 'PRESENTATION_ONLY')
  });
}

export function createReferenceFrameRegistry(specs) {
  const frames = new Map();
  for (const spec of specs) {
    const frame = referenceFrame(spec);
    if (frames.has(frame.id)) throw new Error('Duplicate reference frame: ' + frame.id);
    frames.set(frame.id, frame);
  }
  for (const frame of frames.values()) if (frame.parentId != null && !frames.has(frame.parentId)) {
    throw new Error('Missing parent frame: ' + frame.parentId);
  }
  const rootMeters = (point, frameId) => {
    let frame = frames.get(String(frameId));
    if (!frame) throw new Error('Unknown reference frame: ' + frameId);
    let out = finiteVector(point, 'point').map(value => value * frame.metersPerUnit);
    const seen = new Set();
    while (frame) {
      if (seen.has(frame.id)) throw new Error('Reference frame cycle at ' + frame.id);
      seen.add(frame.id);
      out = rotate(out,frame.orientation).map((value, axis) => value + frame.originInParent[axis] * (frame.parentId ? frames.get(frame.parentId).metersPerUnit : 1));
      frame = frame.parentId == null ? null : frames.get(frame.parentId);
    }
    return out;
  };
  const rootOriginMeters = frameId => rootMeters([0,0,0], frameId);
  return Object.freeze({
    get size() { return frames.size; },
    get(id) { return frames.get(String(id)) || null; },
    toRootMeters(point, frameId) { return Object.freeze(rootMeters(point, frameId)); },
    cameraRelativeFloat32(point, pointFrameId, cameraPoint, cameraFrameId) {
      const world = rootMeters(point, pointFrameId);
      const camera = rootMeters(cameraPoint, cameraFrameId);
      return Object.freeze(world.map((value, axis) => Math.fround(value - camera[axis])));
    },
    snapshot() {
      return Object.freeze({
        contract: 'ofu-spatial-continuum-reference-frames-1',
        frameCount: frames.size,
        frames: Object.freeze([...frames.values()]),
        roots: Object.freeze([...frames.values()].filter(frame => frame.parentId == null).map(frame => frame.id)),
        cpuPrecision: 'FLOAT64_HIERARCHICAL',
        gpuPrecision: 'CAMERA_RELATIVE_FLOAT32'
      });
    },
    rootOriginMeters
  });
}
