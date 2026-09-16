import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { createSurfaceTerrainSampler } from './terrain-field.js';
import { createHumanPlaceGrammar } from './human-place-grammar.js';

const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const scaleDistance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.z-b.z));

function buildFarField(scene,world,terrainRoot){
  const root=new TransformNode('r6-w0-human-far-field-root',scene);root.parent=terrainRoot;const material=new StandardMaterial('r6-w0-human-far-field-material',scene);material.useVertexColors=true;material.specularColor=new Color3(.025,.035,.04);material.emissiveColor=new Color3(.035,.045,.04);material.backFaceCulling=false;material.alpha=.92;
  const heightAt=createSurfaceTerrainSampler({surfaceTarget:world.terrainTarget,radiusM:world.terrainTarget.radiusM,seed:world.terrainTarget.seed,profile:world.terrainTarget.profile}),regime=world.generative?.presentation?.regime||{},place=createHumanPlaceGrammar({seed:world.generative?.seeds?.local||world.bodyId,regime,terrainSampler:heightAt,cellSizeM:32}),palette=world.generative?.presentation?.terrainPalette||{},low=palette.low||[.25,.32,.28],mid=palette.mid||[.38,.48,.3],high=palette.high||[.68,.61,.52],rings=[180,420,860,1600],segments=64,positions=[],normals=[],colors=[],indices=[];
  for(let ring=0;ring<rings.length;ring++){const radius=rings[ring],fade=1-ring/(rings.length-1),tone=ring<2?mid:ring===2?low:high;for(let index=0;index<segments;index++){const angle=index/segments*Math.PI*2,east=Math.cos(angle)*radius,north=Math.sin(angle)*radius,height=heightAt(east,north),reliefCue=clamp01(.5+height/Math.max(120,world.terrainTarget.profile?.macroAmplitudeM||800));positions.push(east,height-.08,north);normals.push(0,1,0);colors.push(tone[0]*(.76+.24*reliefCue),tone[1]*(.76+.24*reliefCue),tone[2]*(.76+.24*reliefCue),.12+.68*fade)}}
  const at=(ring,index)=>ring*segments+(index+segments)%segments;for(let ring=0;ring<rings.length-1;ring++)for(let index=0;index<segments;index++){const next=(index+1)%segments,a=at(ring,index),b=at(ring,next),c=at(ring+1,index),d=at(ring+1,next);indices.push(a,c,b,b,c,d)}
  const mesh=new Mesh('r6-w0-human-far-field',scene),data=new VertexData();data.positions=positions;data.normals=normals;data.colors=colors;data.indices=indices;data.applyToMesh(mesh,true);mesh.material=material;mesh.parent=root;mesh.isPickable=false;mesh.hasVertexAlpha=true;mesh.metadata={authority:'PRESENTATION_ONLY',source:'SAME_BODY_FIXED_TERRAIN_FIELD',scientificLandformClaim:false,bodyId:world.bodyId,surfaceId:world.surfaceId,outerRadiusM:rings.at(-1),vertexCount:positions.length/3,bounded:true};return{root,mesh,material,place,heightAt};
}

export function createHumanRendererConvergence({base,getWorld}={}){
  if(!base?.scene||typeof getWorld!=='function')throw new TypeError('HUMAN convergence requires the existing renderer scene and world');const scene=base.scene;let farField=null,surfaceKey='',disposed=false,stableScaleCorrections=0,lastKey='';
  const disposeFarField=()=>{if(!farField)return;try{farField.root.dispose(false,true)}catch{}try{farField.material.dispose(true,true)}catch{}farField=null};
  const update=snapshot=>{
    if(disposed)return Object.freeze({changed:false});const world=getWorld(),humanWeight=Number(snapshot.representationHandoff?.weights?.HUMAN)||0,localWeight=Number(snapshot.representationHandoff?.weights?.LOCAL_SURFACE)||0,active=humanWeight>.001,key=`${world.bodyId}::${world.surfaceId}::${world.terrainTarget?.seed||''}`,terrainRoot=scene.getTransformNodeByName('terrain-patches-root');let changed=false;
    if(active&&terrainRoot&&key!==surfaceKey){disposeFarField();farField=buildFarField(scene,world,terrainRoot);surfaceKey=key;changed=true}
    if(farField){farField.root.setEnabled(active);const atmosphere=clamp01(world.generative?.presentation?.atmosphereStrength??.32),humanAlpha=clamp01(.58+.22*atmosphere);farField.material.alpha=active?humanAlpha:0}
    if(active){for(const mesh of scene.meshes.filter(item=>item.name.startsWith('selectable-local-object-')&&item.metadata?.baseScale)){const encoded=Number(mesh.metadata.baseScale)||1,physical=encoded/(mesh.metadata.sample?1.35:1),desired=physical*(mesh.metadata.sample?1.12:1);if(Math.abs(mesh.scaling.x-desired)>.0001||Math.abs(mesh.scaling.y-desired)>.0001||Math.abs(mesh.scaling.z-desired)>.0001){mesh.scaling.setAll(desired);stableScaleCorrections++;changed=true}}const rockMaterial=scene.getMaterialByName('rock-field-material');if(rockMaterial){rockMaterial.alpha=.76;rockMaterial.emissiveColor=new Color3(.025,.03,.022)}const localRoot=scene.getTransformNodeByName('local-detail-root');if(localRoot)localRoot.setEnabled(true)}
    const visualKey=[key,active,humanWeight.toFixed(4),localWeight.toFixed(4),farField?.material.alpha?.toFixed?.(4)||'0',stableScaleCorrections].join('|');changed=changed||visualKey!==lastKey;lastKey=visualKey;return Object.freeze({changed,active,stableScaleCorrections,farField:farField?Object.freeze({outerRadiusM:farField.mesh.metadata.outerRadiusM,vertexCount:farField.mesh.metadata.vertexCount,bounded:true,horizonReliefM:farField.place.horizon.reliefM,aerialPerspective:farField.place.aerialPerspective,authority:'PRESENTATION_ONLY'}):null})};
  const cancel=()=>{disposeFarField();surfaceKey='';lastKey='';return true};
  const snapshot=()=>Object.freeze({contract:'ofu-r6-w0-phase2-human-renderer-1',active:!!farField?.root.isEnabled(),stableWorldScale:true,stableScaleCorrections,farField:farField?Object.freeze({bodyId:farField.mesh.metadata.bodyId,surfaceId:farField.mesh.metadata.surfaceId,outerRadiusM:farField.mesh.metadata.outerRadiusM,vertexCount:farField.mesh.metadata.vertexCount,bounded:true,authority:'PRESENTATION_ONLY'}):null,selectedSampleScalePolicy:'BASE_PHYSICAL_SCALE_PLUS_1.12_SELECTION_CUE',depthBandPolicy:'DETAIL_HAZE_PRIORITY_NOT_WORLD_SCALE'});
  const dispose=()=>{if(disposed)return false;disposed=true;disposeFarField();return true};return Object.freeze({update,cancel,snapshot,dispose});
}
