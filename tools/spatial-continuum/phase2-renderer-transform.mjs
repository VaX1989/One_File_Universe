const FORWARD_ANCHOR="bodyCamera=Vector3.TransformCoordinates(camera.position,inverseBody).normalize();lastPlanetaryLod=planetaryPatchPlan({cameraBodyFixedUnit:[bodyCamera.x,bodyCamera.y,bodyCamera.z],cameraAltitudeM:altitudeM,";
const FORWARD_REPLACEMENT="bodyCamera=Vector3.TransformCoordinates(camera.position,inverseBody).normalize(),bodyForward=Vector3.TransformNormal(camera.getForwardRay().direction,inverseBody).normalize();lastPlanetaryLod=planetaryPatchPlan({cameraBodyFixedUnit:[bodyCamera.x,bodyCamera.y,bodyCamera.z],cameraForwardBodyFixedUnit:[bodyForward.x,bodyForward.y,bodyForward.z],cameraAltitudeM:altitudeM,";
const HYSTERESIS_ANCHOR="viewportHeightPx:Math.max(1,size[1]),targetErrorPx:5,maxPatches:planetary.maxPatches";
const HYSTERESIS_REPLACEMENT="viewportHeightPx:Math.max(1,size[1]),viewportWidthPx:Math.max(1,size[0]),previousPatchIds:lastPlanetaryLod?.patches?.map(item=>item.id)||[],semanticSurfaceKey:activeWorld.surfaceId,targetErrorPx:5,maxPatches:planetary.maxPatches";

export function transformPhase2Renderer(source){
  let output=String(source);if(!output.includes(FORWARD_ANCHOR))throw new Error('R6/W0 Phase-2 renderer transform lost the planetary camera-forward anchor');output=output.replace(FORWARD_ANCHOR,FORWARD_REPLACEMENT);if(!output.includes(HYSTERESIS_ANCHOR))throw new Error('R6/W0 Phase-2 renderer transform lost the planetary hysteresis anchor');output=output.replace(HYSTERESIS_ANCHOR,HYSTERESIS_REPLACEMENT);return output;
}

export function phase2RendererTransformContract(){return Object.freeze({contract:'ofu-r6-w0-phase2-renderer-transform-1',changes:Object.freeze(['planetary camera-forward frustum culling','previous-patch hysteresis','semantic surface identity passed into planetary LOD']),authority:'PRESENTATION_ONLY',baseRendererRewritten:false})}
