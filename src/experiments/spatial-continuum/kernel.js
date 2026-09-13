import { CONTINUUM_STOPS, MAX_SCALE_COORDINATE, stageForCoordinate, stopForStage } from './constants.js';
import { createTargetAwareCamera } from './camera.js';
import { createContinuousScale } from './scale-model.js';

export function createContinuumKernel({graph, frames, targets, initialStage='UNIVERSE', reducedMotion=false, transitionDurationMs=1050} = {}) {
  if (!graph || !frames || !targets) throw new TypeError('Spatial graph, reference frames, and camera targets are required');
  const scale=createContinuousScale({initial:initialStage,durationMs:transitionDurationMs,reducedMotion});
  let activeGraph=graph,activeFrames=frames,activeTargets=targets,camera=createTargetAwareCamera({anchorId:graph.focusId,focusId:graph.focusId,targets,frames});
  const history=[];
  let revision=0;

  const capture = now => {
    const sampled=scale.sample(now), pose=camera.pose(sampled.coordinate);
    return Object.freeze({coordinate:sampled.coordinate,stage:sampled.semanticStage,camera:pose,focusId:activeGraph.focusId});
  };
  const pushHistory = now => {
    const entry=capture(now), last=history.at(-1);
    if (!last || last.stage!==entry.stage || last.focusId!==entry.focusId) history.push(entry);
    if (history.length>64) history.shift();
  };
  function travelTo(stage, now=0, options={}) {
    const target=stopForStage(stage);
    if (options.push!==false) pushHistory(now);
    revision++;
    return scale.setStage(target.stage,now,{reducedMotion});
  }
  function travelBy(delta, now=0, options={}) {
    if (options.push===true) pushHistory(now);
    revision++;
    return scale.travelBy(Math.max(-1.25,Math.min(1.25,Number(delta))),now,{reducedMotion});
  }
  function back(now=0) {
    const entry=history.pop();
    if (!entry) return snapshot(now);
    if(activeGraph.get(entry.focusId)){activeGraph.setFocus(entry.focusId);camera.restore(entry.camera)}revision++;
    scale.setTarget(entry.coordinate,now,{reducedMotion});
    return snapshot(now);
  }
  function select(id, now=0, options={}) {
    if (options.push!==false) pushHistory(now);const node=activeGraph.setFocus(id);camera.setFocus(node.id,{anchorId:node.id,aimId:node.id});revision++;
    return snapshot(now);
  }
  function snapshot(now=0) {
    const scaleState=scale.sample(now), cameraState=camera.pose(scaleState.coordinate);
    return Object.freeze({
      contract:'ofu-spatial-continuum-kernel-1',
      revision,
      scale:scaleState,
      camera:cameraState,
      graph:activeGraph.snapshot(),
      frames:activeFrames.snapshot(),
      historyDepth:history.length,
      sameCanonicalFocus:cameraState.focusId===activeGraph.focusId,
      semanticStageDerivedFromScale:stageForCoordinate(scaleState.coordinate).stage,
      representationHandoff:scaleState.handoff,
      bounded:Object.freeze({history:history.length<=64,scale:scaleState.coordinate>=0&&scaleState.coordinate<=MAX_SCALE_COORDINATE})
    });
  }
  return Object.freeze({
    travelTo,travelBy,back,select,snapshot,
    rebind({graph:nextGraph,frames:nextFrames,targets:nextTargets},now=0){
      if(!nextGraph||!nextFrames||!nextTargets)throw new TypeError('Rebind requires spatial graph, frames, and targets');
      const prior=camera.pose(scale.sample(now).coordinate);activeGraph=nextGraph;activeFrames=nextFrames;activeTargets=nextTargets;camera=createTargetAwareCamera({anchorId:activeGraph.focusId,focusId:activeGraph.focusId,targets:activeTargets,frames:activeFrames});camera.restore({...prior,anchorId:activeGraph.focusId,focusId:activeGraph.focusId,aimId:activeGraph.focusId,localPosition:[0,0,0]});history.length=0;revision++;return snapshot(now);
    },
    orbit(dx,dy){camera.orbit(dx,dy);revision++;},
    moveLocal(forward,right,dt){camera.moveLocal(forward,right,dt);revision++;},
    settle(now=0){scale.settle(now);return snapshot(now);},
    stages:CONTINUUM_STOPS
  });
}
