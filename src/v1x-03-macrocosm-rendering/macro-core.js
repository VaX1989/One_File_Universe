(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-03-macro-core-1';
const CONTRACT='ofu-v1x-03-macro-frame-1';
const AUTHORITY='PRESENTATION_ONLY';
const SCALE_CONTRACT='ofu-wave-iv-scale-runtime-3';
const SELECTION_CONTRACT='ofu-wave-iv-selection-1';
const ALLOWED_AUTHORITIES=Object.freeze(new Set([
  'CANONICAL_PROVEN','DERIVED','MODEL_DERIVED_SIMULATION','PRESENTATION_ONLY','MEASURED_RUNTIME_EVIDENCE'
]));
const QUALITY=Object.freeze({
  low:Object.freeze({id:'low',maxInstances:512,maxPickCandidates:128,minPointPx:1.25,maxPointPx:12,minPickPx:18}),
  balanced:Object.freeze({id:'balanced',maxInstances:2048,maxPickCandidates:384,minPointPx:1.25,maxPointPx:18,minPickPx:20}),
  high:Object.freeze({id:'high',maxInstances:4096,maxPickCandidates:768,minPointPx:1.25,maxPointPx:24,minPickPx:22})
});
const KIND_DETAIL=Object.freeze({
  UNIVERSE:0,
  GALAXY:0,
  GALACTIC_REGION:.18,
  REGION:.18,
  STELLAR_NEIGHBORHOOD:.52,
  NEIGHBORHOOD:.52,
  SYSTEM:.72,
  STAR:.76
});
function fail(message){throw new Error('V1X-03: '+message)}
function finite(v,label){const n=Number(v);if(!Number.isFinite(n))fail(label+' must be finite');return n}
function positive(v,label){const n=finite(v,label);if(!(n>0))fail(label+' must be positive');return n}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function smoothstep(a,b,x){if(a===b)return x>=b?1:0;const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function vec3(v,label='vector'){
  if(Array.isArray(v)||ArrayBuffer.isView(v)){if(v.length<3)fail(label+' requires xyz');return Object.freeze([finite(v[0],label+'.x'),finite(v[1],label+'.y'),finite(v[2],label+'.z')])}
  if(v&&typeof v==='object')return Object.freeze([finite(v.x,label+'.x'),finite(v.y,label+'.y'),finite(v.z,label+'.z')]);
  fail(label+' requires xyz');
}
function add(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function mul(a,s){return[a[0]*s,a[1]*s,a[2]*s]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function length(a){return Math.hypot(a[0],a[1],a[2])}
function normalize(a,label='vector'){const l=length(a);if(!(l>1e-15))fail(label+' is degenerate');return[a[0]/l,a[1]/l,a[2]/l]}
function stable(value,seen=new Set()){
  if(value===null)return'null';const t=typeof value;
  if(t==='bigint')return JSON.stringify(value.toString()+'n');
  if(t==='number')return Number.isFinite(value)?String(Object.is(value,-0)?0:value):JSON.stringify(String(value));
  if(t==='boolean'||t==='string')return JSON.stringify(value);
  if(t==='undefined')return'"<undefined>"';
  if(t==='function')return'"<function>"';
  if(seen.has(value))fail('cyclic value cannot be hashed');seen.add(value);
  let out;
  if(Array.isArray(value)||ArrayBuffer.isView(value))out='['+Array.from(value,x=>stable(x,seen)).join(',')+']';
  else {const keys=Object.keys(value).sort();out='{'+keys.map(k=>JSON.stringify(k)+':'+stable(value[k],seen)).join(',')+'}'}
  seen.delete(value);return out;
}
function hash32(value){let h=2166136261>>>0;for(const c of stable(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return('00000000'+(h>>>0).toString(16)).slice(-8)}
function cameraSnapshot(input){
  if(!input||typeof input!=='object')fail('external camera snapshot required');
  const position=vec3(input.position,'camera.position'),target=vec3(input.target,'camera.target'),up=vec3(input.up||[0,1,0],'camera.up');
  const fovYRadians=finite(input.fovYRadians??input.fovY??Math.PI/3,'camera.fovYRadians');if(!(fovYRadians>.05&&fovYRadians<Math.PI-.05))fail('camera fov outside supported perspective range');
  const near=positive(input.near??.01,'camera.near'),far=positive(input.far??1e12,'camera.far');if(!(far>near))fail('camera far must exceed near');
  const forward=normalize(sub(target,position),'camera forward'),right=normalize(cross(forward,up),'camera right'),trueUp=normalize(cross(right,forward),'camera up');
  return Object.freeze({position,target,up:trueUp,forward,right,fovYRadians,near,far,contract:String(input.contract||input.version||'EXTERNAL_CAMERA_SNAPSHOT'),source:'EXTERNAL'});
}
function scaleSnapshot(input){
  if(!input||typeof input!=='object')fail('shared scale snapshot required');
  const contract=String(input.contract||input.version||'');if(contract&&contract!==SCALE_CONTRACT)fail('unsupported scale contract '+contract);
  const distance=positive(input.distanceIntentRadii,'scale.distanceIntentRadii'),anchors=input.anchors;
  if(!anchors||typeof anchors!=='object')fail('scale anchors required');
  const galaxy=positive(anchors.galaxy,'scale.anchors.galaxy'),region=positive(anchors.region,'scale.anchors.region'),neighborhood=positive(anchors.stellar_neighborhood??anchors.neighborhood,'scale.anchors.stellar_neighborhood');
  if(!(galaxy>region&&region>neighborhood))fail('macro scale anchors must descend galaxy > region > stellar_neighborhood');
  return Object.freeze({contract:contract||SCALE_CONTRACT,distanceIntentRadii:distance,semanticScale:String(input.semanticScale||'').toLowerCase(),anchors:Object.freeze({galaxy,region,stellar_neighborhood:neighborhood}),source:'EXTERNAL'});
}
function semanticDetail(scale){
  const far=scale.anchors.galaxy,near=scale.anchors.stellar_neighborhood,d=clamp(scale.distanceIntentRadii,near,far);
  return clamp((Math.log(far)-Math.log(d))/(Math.log(far)-Math.log(near)),0,1);
}
function qualityProfile(value){const id=String(value||'balanced').toLowerCase();const q=QUALITY[id];if(!q)fail('unknown quality profile '+id);return q}
function entityPosition(e){return vec3(e.position??e.worldPosition,'entity '+String(e.id||'?')+' position')}
function normalizeEntity(input,index){
  if(!input||typeof input!=='object')fail('entity '+index+' must be an object');
  const id=String(input.id??input.entityId??'');if(!id)fail('entity '+index+' id required');
  const authority=String(input.authority||'');if(!ALLOWED_AUTHORITIES.has(authority))fail('entity '+id+' uses ungoverned authority '+authority);
  const radius=positive(input.radius??input.boundingRadius??1,'entity '+id+' radius');
  const position=entityPosition(input),kind=String(input.kind||'GALAXY').toUpperCase();
  const selectable=input.selectable===true;if(selectable&&!input.selection)fail('selectable entity '+id+' must carry upstream selection payload');
  const priority=clamp(Number(input.presentation?.priority??input.priority??0)||0,-1e6,1e6);
  const minDetail=clamp(Number(input.presentation?.minDetail??KIND_DETAIL[kind]??.35),0,1);
  const maxDetail=clamp(Number(input.presentation?.maxDetail??1),0,1);if(maxDetail<minDetail)fail('entity '+id+' maxDetail precedes minDetail');
  return Object.freeze({
    id,kind,authority,position,radius,selectable,selection:input.selection||null,selected:input.selected===true,
    presentation:Object.freeze({priority,minDetail,maxDetail,morphologyClass:String(input.presentation?.morphologyClass||input.morphologyClass||'UNSPECIFIED'),opacity:clamp(Number(input.presentation?.opacity??1),0,1)}),
    source:input
  });
}
function sceneSnapshot(input){
  if(!input||typeof input!=='object'||!Array.isArray(input.entities))fail('3D spatial scene with entities[] required');
  if(input.dimension!==undefined&&Number(input.dimension)!==3)fail('spatial scene must be 3D');
  const entities=input.entities.map(normalizeEntity);const ids=new Set();for(const e of entities){if(ids.has(e.id))fail('duplicate entity id '+e.id);ids.add(e.id)}
  return Object.freeze({contract:String(input.contract||'UPSTREAM_SPATIAL_SCENE'),version:String(input.version||''),dimension:3,frameId:String(input.frameId||input.referenceFrameId||'EXTERNAL_FRAME'),entities:Object.freeze(entities),source:input});
}
function lodAlpha(entity,detail){
  const width=clamp(Number(entity.source.presentation?.blendWidth??.10),.01,.35),enter=smoothstep(entity.presentation.minDetail-width,entity.presentation.minDetail+width,detail),leave=1-smoothstep(entity.presentation.maxDetail-width,entity.presentation.maxDetail+width,detail);
  return clamp(enter*leave*entity.presentation.opacity,0,1);
}
function project(camera,viewport,position,radius,quality){
  const rel=sub(position,camera.position),vx=dot(rel,camera.right),vy=dot(rel,camera.up),vz=dot(rel,camera.forward),width=positive(viewport.width,'viewport.width'),height=positive(viewport.height,'viewport.height'),aspect=width/height,tanHalf=Math.tan(camera.fovYRadians/2);
  if(vz<=0)return Object.freeze({visible:false,reason:'BEHIND_CAMERA',viewZ:vz});
  const ndcX=vx/(vz*tanHalf*aspect),ndcY=vy/(vz*tanHalf),radiusNdc=Math.abs(radius/(vz*tanHalf)),margin=Math.min(.5,radiusNdc),depth=(vz-camera.near)/(camera.far-camera.near);
  if(vz+radius<camera.near||vz-radius>camera.far||Math.abs(ndcX)>1+margin||Math.abs(ndcY)>1+margin)return Object.freeze({visible:false,reason:'FRUSTUM',viewZ:vz,ndcX,ndcY,depth});
  const focalPx=height/(2*tanHalf),diameterPx=2*radius/vz*focalPx,pointPx=clamp(diameterPx,quality.minPointPx,quality.maxPointPx),screenX=(ndcX*.5+.5)*width,screenY=(.5-ndcY*.5)*height;
  return Object.freeze({visible:true,viewX:vx,viewY:vy,viewZ:vz,ndcX,ndcY,depth:clamp(depth,0,1),screenX,screenY,projectedDiameterPx:diameterPx,pointPx});
}
function compareCandidates(a,b){
  if(a.entity.selected!==b.entity.selected)return a.entity.selected?-1:1;
  if(a.entity.presentation.priority!==b.entity.presentation.priority)return b.entity.presentation.priority-a.entity.presentation.priority;
  if(a.alpha!==b.alpha)return b.alpha-a.alpha;
  if(a.projection.projectedDiameterPx!==b.projection.projectedDiameterPx)return b.projection.projectedDiameterPx-a.projection.projectedDiameterPx;
  if(a.projection.viewZ!==b.projection.viewZ)return a.projection.viewZ-b.projection.viewZ;
  return a.entity.id.localeCompare(b.entity.id);
}
function prepareFrame({scene,camera,scale,viewport,quality='balanced'}={}){
  const spatial=sceneSnapshot(scene),cam=cameraSnapshot(camera),sharedScale=scaleSnapshot(scale),q=qualityProfile(quality),vp=Object.freeze({width:positive(viewport?.width,'viewport.width'),height:positive(viewport?.height,'viewport.height'),devicePixelRatio:positive(viewport?.devicePixelRatio??1,'viewport.devicePixelRatio')}),detail=semanticDetail(sharedScale),candidates=[];
  let lodRejected=0,frustumRejected=0;
  for(const entity of spatial.entities){const alpha=lodAlpha(entity,detail);if(alpha<=.001){lodRejected++;continue}const projection=project(cam,vp,entity.position,entity.radius,q);if(!projection.visible){frustumRejected++;continue}candidates.push({entity,alpha,projection})}
  candidates.sort(compareCandidates);const accepted=candidates.slice(0,q.maxInstances),budgetRejected=Math.max(0,candidates.length-accepted.length),objects=accepted.map((c,index)=>Object.freeze({
    index,id:c.entity.id,kind:c.entity.kind,authority:c.entity.authority,worldPosition:c.entity.position,radius:c.entity.radius,alpha:c.alpha,projection:c.projection,selectable:c.entity.selectable,selection:c.entity.selection,selected:c.entity.selected,morphologyClass:c.entity.presentation.morphologyClass
  }));
  const pickable=objects.filter(x=>x.selectable).slice(0,q.maxPickCandidates),resources=Object.freeze({
    inputCount:spatial.entities.length,lodRejected,frustumRejected,budgetRejected,visibleCount:objects.length,pickableCount:pickable.length,maxInstances:q.maxInstances,maxPickCandidates:q.maxPickCandidates,drawCallsPlanned:objects.length?1:0,gpuVertexBytesPlanned:objects.length*32,cpuProjectionRecords:objects.length
  });
  const hash=hash32({frameId:spatial.frameId,camera:{position:cam.position,target:cam.target,fovYRadians:cam.fovYRadians,near:cam.near,far:cam.far},scale:{distanceIntentRadii:sharedScale.distanceIntentRadii,anchors:sharedScale.anchors},viewport:vp,quality:q.id,objects:objects.map(o=>({id:o.id,alpha:o.alpha,worldPosition:o.worldPosition,screenX:o.projection.screenX,screenY:o.projection.screenY,depth:o.projection.depth,selection:o.selection}))});
  return Object.freeze({version:VERSION,contract:CONTRACT,authority:AUTHORITY,canonicalPromotion:false,referenceFrameId:spatial.frameId,quality:q.id,semanticDetail:detail,camera:cam,scale:sharedScale,viewport:vp,objects:Object.freeze(objects),pickable:Object.freeze(pickable),resources,hash});
}
function screenRay(frame,x,y){
  x=finite(x,'pick.x');y=finite(y,'pick.y');const {camera:c,viewport:v}=frame,nx=2*x/v.width-1,ny=1-2*y/v.height,aspect=v.width/v.height,tanHalf=Math.tan(c.fovYRadians/2),dir=normalize(add(c.forward,add(mul(c.right,nx*tanHalf*aspect),mul(c.up,ny*tanHalf))),'pick ray');return Object.freeze({origin:c.position,direction:Object.freeze(dir)});
}
function raySphere(ray,center,radius){const oc=sub(ray.origin,center),b=dot(oc,ray.direction),c=dot(oc,oc)-radius*radius,d=b*b-c;if(d<0)return null;const s=Math.sqrt(d),t0=-b-s,t1=-b+s;if(t1<0)return null;return t0>=0?t0:t1}
function pick(frame,x,y){
  if(!frame||frame.contract!==CONTRACT)fail('prepared frame required for picking');const ray=screenRay(frame,x,y),q=qualityProfile(frame.quality),hits=[];
  for(const o of frame.pickable){const t=raySphere(ray,o.worldPosition,o.radius);if(t!==null){hits.push({object:o,t,mode:'WORLD_SPHERE'});continue}const dx=finite(x,'pick.x')-o.projection.screenX,dy=finite(y,'pick.y')-o.projection.screenY,screenRadius=Math.max(q.minPickPx,o.projection.pointPx*.65);if(dx*dx+dy*dy<=screenRadius*screenRadius)hits.push({object:o,t:o.projection.viewZ,mode:'PRESENTATION_HIT_ENVELOPE'})}
  hits.sort((a,b)=>a.t-b.t||a.object.id.localeCompare(b.object.id));if(!hits.length)return null;const h=hits[0];
  return Object.freeze({entityId:h.object.id,selection:h.object.selection,selectionContract:SELECTION_CONTRACT,hitMode:h.mode,authority:AUTHORITY,canonicalPromotion:false,frameHash:frame.hash});
}
function continuityWitness(argsA,argsB){const a=prepareFrame(argsA),b=prepareFrame(argsB),r=prepareFrame(argsA);return Object.freeze({contract:'ofu-v1x-03-reverse-continuity-witness-1',startHash:a.hash,forwardHash:b.hash,returnHash:r.hash,reversible:a.hash===r.hash,startDetail:a.semanticDetail,forwardDetail:b.semanticDetail,returnDetail:r.semanticDetail});}
const API=Object.freeze({VERSION,CONTRACT,AUTHORITY,SCALE_CONTRACT,SELECTION_CONTRACT,QUALITY,KIND_DETAIL,prepareFrame,pick,screenRay,continuityWitness,semanticDetail,hash32,stable});
O.v1x03MacroCore=API;
})(typeof globalThis!=='undefined'?globalThis:this);
