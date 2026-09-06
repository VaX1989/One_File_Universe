(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-02-spatial-universe-1';
const CONTRACT='ofu-v1x-02-spatial-consumer-1';
const AUTHORITY=Object.freeze({
  CANONICAL_PROVEN:'CANONICAL_PROVEN',
  DERIVED:'DERIVED',
  MODEL_DERIVED_SIMULATION:'MODEL_DERIVED_SIMULATION',
  PRESENTATION_ONLY:'PRESENTATION_ONLY',
  MEASURED_RUNTIME_EVIDENCE:'MEASURED_RUNTIME_EVIDENCE'
});
const CONTEXTS=Object.freeze(['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD']);
const MAX_ENTITIES=64;
const MAX_PROBES=96;
const DEFAULT_SEED='OFU-V1X02-SPATIAL-1';
const SOURCE_POSITION_AUTHORITIES=new Set([AUTHORITY.CANONICAL_PROVEN,AUTHORITY.DERIVED,AUTHORITY.MODEL_DERIVED_SIMULATION]);
const freeze=value=>{
  if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
  for(const key of Object.keys(value))freeze(value[key]);
  return Object.freeze(value);
};
function fail(message){throw new Error('V1X-02 spatial universe: '+message)}
function finite(value,label){const n=Number(value);if(!Number.isFinite(n))fail(label+' must be finite');return n}
function positive(value,label){const n=finite(value,label);if(n<=0)fail(label+' must be positive');return n}
function boundedInt(value,label,min,max){const n=Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)fail(label+' outside bounds');return n}
function text(value,label,max=512){if(typeof value!=='string'||value.length===0||value.length>max)fail(label+' must be non-empty bounded text');return value}
function context(value){const c=String(value||'').toUpperCase();if(!CONTEXTS.includes(c))fail('unsupported context '+c);return c}
function stableValue(value){
  if(value===null)return'null';
  const t=typeof value;
  if(t==='bigint')return'b:'+value.toString();
  if(t==='number'){if(!Number.isFinite(value))fail('non-finite identity value');return'n:'+String(Object.is(value,-0)?0:value)}
  if(t==='string')return's:'+value.length+':'+value;
  if(t==='boolean')return value?'t':'f';
  if(Array.isArray(value))return'['+value.map(stableValue).join(',')+']';
  if(t==='object')return'{'+Object.keys(value).sort().map(k=>stableValue(k)+':'+stableValue(value[k])).join(',')+'}';
  fail('unsupported identity value');
}
function stableIdentity(entity){
  if(!entity||typeof entity!=='object')fail('entity record required');
  for(const key of ['canonicalId','entityId','id'])if(typeof entity[key]==='string'&&entity[key])return key+':'+entity[key];
  if(entity.canonicalKey&&typeof entity.canonicalKey==='object')return'canonicalKey:'+stableValue(entity.canonicalKey);
  fail('stable canonical/entity identity or canonicalKey required');
}
function hash32(input){let h=2166136261>>>0;for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0}
function unit(seed,channel){return hash32(String(seed)+'\u0000'+String(channel))/4294967296}
function signed(seed,channel){return unit(seed,channel)*2-1}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function vec(value,label='vector'){if(!value||typeof value!=='object')fail(label+' required');return freeze({x:finite(value.x,label+'.x'),y:finite(value.y,label+'.y'),z:finite(value.z,label+'.z')})}
function add(a,b){return{x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}}
function sub(a,b){return{x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}}
function scale(a,s){return{x:a.x*s,y:a.y*s,z:a.z*s}}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z}
function length(a){return Math.hypot(a.x,a.y,a.z)}
function normalize(a,label){const l=length(a);if(!(l>1e-12))fail(label+' must be non-zero');return{x:a.x/l,y:a.y/l,z:a.z/l}}
function rotate(point,seed){
  const ax=(unit(seed,'rx')-.5)*Math.PI*2,ay=(unit(seed,'ry')-.5)*Math.PI*2,az=(unit(seed,'rz')-.5)*Math.PI*2;
  let{x,y,z}=point;
  let c=Math.cos(ax),s=Math.sin(ax),ny=y*c-z*s,nz=y*s+z*c;y=ny;z=nz;
  c=Math.cos(ay);s=Math.sin(ay);let nx=x*c+z*s;nz=-x*s+z*c;x=nx;z=nz;
  c=Math.cos(az);s=Math.sin(az);nx=x*c-y*s;ny=x*s+y*c;x=nx;y=ny;
  return{x,y,z};
}
function profile({context:contextValue,morphology='UNKNOWN',densityHint=.5}={}){
  const c=context(contextValue),m=String(morphology||'UNKNOWN').toUpperCase(),density=clamp(finite(densityHint,'densityHint'),0,1);
  let family='VOLUME',axes=[1,.88,.72],scaleUnits={UNIVERSE:1400,GALAXY:520,REGION:150,NEIGHBORHOOD:36}[c];
  if(/SPIRAL|DISK|DISC|BARRED/.test(m)){family='DISK';axes=[1,.92,.16]}
  else if(/ELLIPTICAL|SPHEROID/.test(m)){family='ELLIPSOID';axes=[1,.78,.61]}
  else if(/IRREGULAR|CLUMP/.test(m)){family='CLUMPED';axes=[1,.9,.68]}
  return freeze({context:c,morphology:m,family,densityHint:density,axes:Object.freeze(axes),scaleUnits,authority:AUTHORITY.PRESENTATION_ONLY,claims:Object.freeze({physicalDensity:false,physicalCoordinate:false,morphologyUsedAsPresentationHint:true})});
}
function localPoint(seed,p){
  const u0=unit(seed,'u0'),u1=unit(seed,'u1'),u2=unit(seed,'u2'),u3=unit(seed,'u3'),u4=unit(seed,'u4');
  let point;
  if(p.family==='DISK'){
    const radial=Math.pow(u0,.62+.82*p.densityHint),arms=2+(hash32(p.morphology)%3),theta=Math.PI*2*u1+radial*(2.2+arms*.63)+(u2-.5)*.24;
    point={x:Math.cos(theta)*radial*p.axes[0],y:Math.sin(theta)*radial*p.axes[1],z:(u3+u4-1)*p.axes[2]*(1-.28*p.densityHint)};
  }else{
    const z=2*u0-1,theta=Math.PI*2*u1,radial=Math.pow(u2,.34+.78*p.densityHint),ring=Math.sqrt(Math.max(0,1-z*z));
    point={x:ring*Math.cos(theta)*radial*p.axes[0],y:ring*Math.sin(theta)*radial*p.axes[1],z:z*radial*p.axes[2]};
    if(p.family==='CLUMPED'){
      const cluster=hash32(seed+'\u0000cluster')%5,phase=cluster/5*Math.PI*2,offset={x:Math.cos(phase)*.18,y:Math.sin(phase)*.16,z:signed(seed,'clusterZ')*.14};
      point=add(scale(point,.76),offset);
    }
  }
  return scale(point,p.scaleUnits);
}
function presentationPoint({context:contextValue,scopeId,identity,presentationSeed=DEFAULT_SEED,morphology='UNKNOWN',densityHint=.5}={}){
  const c=context(contextValue),scope=text(String(scopeId),'scopeId'),id=text(String(identity),'identity',2048),seed=text(String(presentationSeed),'presentationSeed');
  const p=profile({context:c,morphology,densityHint}),key=[seed,c,scope,id].join('|'),rotated=rotate(localPoint(key,p),seed+'|'+c+'|'+scope+'|orientation');
  return freeze({x:rotated.x,y:rotated.y,z:rotated.z,authority:AUTHORITY.PRESENTATION_ONLY,space:'V1X02_PRESENTATION_3D',source:'DETERMINISTIC_IDENTITY_HASHED_VOLUME',physicalCoordinateClaim:false});
}
function sourcePositionOf(input){
  if(input===null||input===undefined)return null;
  if(!input||typeof input!=='object')fail('sourcePosition must be a record');
  const authority=String(input.authority||'');if(!SOURCE_POSITION_AUTHORITIES.has(authority))fail('unsupported sourcePosition authority '+authority);
  const unitName=text(String(input.unit||'UNSPECIFIED'),'sourcePosition.unit',64),value=vec(input,'sourcePosition');
  return freeze({x:value.x,y:value.y,z:value.z,unit:unitName,authority,provenance:text(String(input.provenance||'EXTERNAL_SOURCE'),'sourcePosition.provenance',1024),physicalCoordinateClaim:authority===AUTHORITY.CANONICAL_PROVEN});
}
function placeEntity({context:contextValue,scopeId,entity,presentationSeed=DEFAULT_SEED,morphology,densityHint=.5,sourcePosition=null}={}){
  const identity=stableIdentity(entity),p=presentationPoint({context:contextValue,scopeId,identity,presentationSeed,morphology:morphology??entity?.metadata?.modelProfile?.morphology??entity?.facts?.morphology??'UNKNOWN',densityHint});
  return freeze({
    objectId:'v1x02:'+hash32(scopeId+'|'+identity).toString(16).padStart(8,'0')+':'+hash32(identity+'|object').toString(16).padStart(8,'0'),
    identity,
    canonicalId:typeof entity.canonicalId==='string'?entity.canonicalId:(typeof entity.id==='string'?entity.id:null),
    entityId:typeof entity.entityId==='string'?entity.entityId:null,
    canonicalKey:entity.canonicalKey?freeze({...entity.canonicalKey}):null,
    sourceAuthority:typeof entity.sourceAuthority==='string'?entity.sourceAuthority:null,
    authority:AUTHORITY.PRESENTATION_ONLY,
    position:p,
    sourcePosition:sourcePositionOf(sourcePosition??entity.sourcePosition??null),
    claims:freeze({positionIsPhysical:false,canonicalIdentityPreserved:true,sourcePositionDoesNotPromotePresentation:true})
  });
}
function projectEntities({context:contextValue,scopeId,entities,presentationSeed=DEFAULT_SEED,morphology='UNKNOWN',densityHint=.5,limit=MAX_ENTITIES}={}){
  const c=context(contextValue);text(String(scopeId),'scopeId');if(!Array.isArray(entities))fail('entities must be an array');const cap=boundedInt(limit,'limit',1,MAX_ENTITIES),seen=new Set(),stable=[];
  for(const entity of entities){const identity=stableIdentity(entity);if(seen.has(identity))fail('duplicate stable identity '+identity);seen.add(identity);stable.push({identity,entity})}
  stable.sort((a,b)=>a.identity<b.identity?-1:a.identity>b.identity?1:0);
  const objects=stable.slice(0,cap).map(({entity})=>placeEntity({context:c,scopeId,entity,presentationSeed,morphology,densityHint}));
  return freeze({version:VERSION,contract:CONTRACT,status:'READY',authority:AUTHORITY.PRESENTATION_ONLY,context:c,scopeId:String(scopeId),objects:Object.freeze(objects),bounds:freeze({requested:entities.length,materialized:objects.length,maxMaterialized:MAX_ENTITIES,bounded:true}),stability:freeze({identityKeyed:true,queryOrderIndependent:true,cacheResidencyIndependent:true,revisitStable:true})});
}
function sampleNeighborhood({context:contextValue,scopeId,anchorId,presentationSeed=DEFAULT_SEED,morphology='UNKNOWN',densityHint=.5,limit=24,radiusUnits=null}={}){
  const c=context(contextValue),scope=text(String(scopeId),'scopeId'),anchor=text(String(anchorId),'anchorId',2048),count=boundedInt(limit,'limit',1,MAX_PROBES),p=profile({context:c,morphology,densityHint}),radius=radiusUnits===null?p.scaleUnits*.24:positive(radiusUnits,'radiusUnits'),probes=[];
  for(let i=0;i<count;i++){
    const key=[presentationSeed,c,scope,anchor,'probe',i].join('|'),direction=normalize({x:signed(key,'x'),y:signed(key,'y'),z:signed(key,'z')},'probe direction'),distance=radius*(.08+.92*Math.pow(unit(key,'distance'),.72)),position=scale(direction,distance);
    probes.push(freeze({probeId:'v1x02-probe:'+hash32(key).toString(16).padStart(8,'0')+':'+i,ordinal:i,authority:AUTHORITY.PRESENTATION_ONLY,canonical:false,selectable:false,navigable:false,offset:freeze({...position,space:'V1X02_PRESENTATION_3D'}),claims:freeze({canonicalObject:false,physicalCoordinate:false,discoveryResult:false})}));
  }
  return freeze({version:VERSION,contract:CONTRACT,kind:'BOUNDED_PRESENTATION_NEIGHBORHOOD',context:c,scopeId:scope,anchorId:anchor,authority:AUTHORITY.PRESENTATION_ONLY,probes:Object.freeze(probes),bounds:freeze({materialized:probes.length,maxMaterialized:MAX_PROBES,enumeratesUniverse:false,enumeratesCanonicalPopulation:false}),semantics:freeze({purpose:'SPARSE_PRESENTATION_PROBE_PATTERN',canonicalDiscoveryAuthority:false})});
}
function frame(input){
  if(!input||typeof input!=='object')fail('camera frame required');
  const origin=vec(input.origin??input.position,'cameraFrame.origin'),right=normalize(vec(input.right,'cameraFrame.right'),'cameraFrame.right'),up=normalize(vec(input.up,'cameraFrame.up'),'cameraFrame.up'),forward=normalize(vec(input.forward,'cameraFrame.forward'),'cameraFrame.forward'),focalLength=positive(input.focalLength??1,'cameraFrame.focalLength'),near=positive(input.near??1e-4,'cameraFrame.near');
  if(Math.abs(dot(right,up))>.02||Math.abs(dot(right,forward))>.02||Math.abs(dot(up,forward))>.02)fail('camera frame axes must be near-orthogonal');
  return freeze({origin,right,up,forward,focalLength,near,authority:AUTHORITY.PRESENTATION_ONLY,owner:'EXTERNAL_CAMERA_FRAME'});
}
function projectPoint(pointValue,cameraFrame){
  const point=vec(pointValue,'point'),f=frame(cameraFrame),relative=sub(point,f.origin),depth=dot(relative,f.forward),cameraX=dot(relative,f.right),cameraY=dot(relative,f.up),visible=depth>f.near;
  return freeze({visible,depth,cameraX,cameraY,x:visible?cameraX*f.focalLength/depth:null,y:visible?cameraY*f.focalLength/depth:null,authority:AUTHORITY.PRESENTATION_ONLY,claims:freeze({physicalAngularCoordinate:false,cameraAuthorityOwnedHere:false})});
}
function representation({context:contextValue,scopeId,entities,cameraFrame=null,presentationSeed=DEFAULT_SEED,morphology='UNKNOWN',densityHint=.5,limit=MAX_ENTITIES}={}){
  const spatial=projectEntities({context:contextValue,scopeId,entities,presentationSeed,morphology,densityHint,limit}),objects=spatial.objects.map(object=>freeze({...object,view:cameraFrame?projectPoint(object.position,cameraFrame):null}));
  return freeze({...spatial,kind:'SPATIAL_3D_REPRESENTATION',objects:Object.freeze(objects),camera:freeze({consumedExternalFrame:cameraFrame!==null,ownsFrame:false}),consumerContract:CONTRACT});
}
function parallaxWitness(points,frameA,frameB){
  if(!Array.isArray(points)||points.length<3)fail('at least three points required for parallax witness');
  const samples=points.map((pointValue,index)=>{const point=pointValue?.position??pointValue,a=projectPoint(point,frameA),b=projectPoint(point,frameB);if(!a.visible||!b.visible)fail('parallax witness requires points visible in both frames');const shift=Math.hypot(b.x-a.x,b.y-a.y);return freeze({id:String(pointValue?.objectId??index),depthA:a.depth,depthB:b.depth,shift})});
  const depths=samples.map(s=>s.depthA),shifts=samples.map(s=>s.shift),depthSpread=Math.max(...depths)-Math.min(...depths),shiftSpread=Math.max(...shifts)-Math.min(...shifts),near=samples.reduce((a,b)=>a.depthA<b.depthA?a:b),far=samples.reduce((a,b)=>a.depthA>b.depthA?a:b);
  return freeze({version:VERSION,contract:'ofu-v1x-02-parallax-witness-1',authority:AUTHORITY.PRESENTATION_ONLY,samples:Object.freeze(samples),depthSpread,shiftSpread,nearShift:near.shift,farShift:far.shift,depthDependent:depthSpread>1e-6&&shiftSpread>1e-8&&near.shift>far.shift,claims:freeze({provesPhysicalDistance:false,provesThreeDimensionalPresentationResponse:true})});
}
const CONSUMER_CONTRACT=freeze({
  id:CONTRACT,
  version:1,
  provider:'OFU.v1x02SpatialUniverse',
  contexts:Object.freeze([...CONTEXTS]),
  coordinateSpace:'V1X02_PRESENTATION_3D',
  positionAuthority:AUTHORITY.PRESENTATION_ONLY,
  stableIdentityInputs:Object.freeze(['canonicalId','entityId','id','canonicalKey']),
  outputs:Object.freeze(['projectEntities','sampleNeighborhood','representation','projectPoint','parallaxWitness']),
  cameraFrame:Object.freeze({ownership:'EXTERNAL',requiredFields:Object.freeze(['origin|position','right','up','forward']),optionalFields:Object.freeze(['focalLength','near'])}),
  downstream:Object.freeze({V1X03:'consume projectEntities/representation for macrocosm placement',V1X04:'consume projectEntities/representation for stellar-system context placement'}),
  invariants:Object.freeze({canonicalIdentityPreserved:true,canonicalMutation:false,presentationCoordinatesPhysical:false,queryOrderIndependent:true,cacheResidencyIndependent:true,bounded:true})
});
O.v1x02SpatialUniverse=freeze({VERSION,CONTRACT,AUTHORITY,CONTEXTS,MAX_ENTITIES,MAX_PROBES,CONSUMER_CONTRACT,stableIdentity,profile,presentationPoint,placeEntity,projectEntities,sampleNeighborhood,projectPoint,representation,parallaxWitness});
})(typeof globalThis!=='undefined'?globalThis:this);
