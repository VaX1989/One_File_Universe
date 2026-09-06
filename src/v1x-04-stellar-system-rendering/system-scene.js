(function(root){
'use strict';
const O=root.OFU=root.OFU||{},M=O.v1x04SystemMath,R=O.v1x04OrbitPresentation;
if(!M||!R)throw new Error('V1X-04 system scene requires math and orbit presentation');
const AUTHORITY='PRESENTATION_ONLY';
const LIMITS=Object.freeze({maxStars:8,maxPlanets:10,orbitSegments:96,maxOrbitVertices:970,maxSceneNodes:20,maxDrawPackets:160,maxEstimatedBytes:1048576});
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const k of Object.keys(value))freeze(value[k]);return Object.freeze(value)}
function id(entity,label){if(!entity||entity.status==='ABSENT'||entity.status==='UNSUPPORTED'||!entity.id)throw new TypeError(label+' canonical id required');if(typeof entity.id==='string')return entity.id;if(entity.id instanceof Uint8Array)return Array.from(entity.id,b=>b.toString(16).padStart(2,'0')).join('');if(ArrayBuffer.isView(entity.id))return Array.from(new Uint8Array(entity.id.buffer,entity.id.byteOffset,entity.id.byteLength),b=>b.toString(16).padStart(2,'0')).join('');throw new TypeError(label+' canonical id must be string or bytes')}
function facts(entity){return entity?.facts||{}}
function mass(star){const m=Number(facts(star).baselineMassMilliSolar||1000);return Number.isFinite(m)&&m>0?m:1000}
function starScale(system){const au=Math.max(0,Number(facts(system).baselineBarycentricScaleMilliAu||0)/1000);return 5+9*Math.log1p(au)}
function starLayout(system,stars){
  const n=stars.length;if(n===1)return [Object.freeze([0,0,0])];
  const radius=starScale(system),raw=[];for(let i=0;i<n;i++){const a=2*Math.PI*i/n+.37,z=.24*radius*Math.sin((i+1)*1.61803398875);raw.push([radius*Math.cos(a),radius*.68*Math.sin(a),z])}
  const total=stars.reduce((s,x)=>s+mass(x),0),center=[0,0,0];for(let i=0;i<n;i++){const w=mass(stars[i])/total;center[0]+=raw[i][0]*w;center[1]+=raw[i][1]*w;center[2]+=raw[i][2]*w}
  return raw.map(p=>Object.freeze([p[0]-center[0],p[1]-center[1],p[2]-center[2]]));
}
function approachTransform(input){
  const a=input||{},progress=Math.max(0,Math.min(1,Number(a.progress??1))),origin=M.v3(a.systemOriginInParentFrame3d||[0,0,0],'approach.systemOriginInParentFrame3d'),smooth=progress*progress*(3-2*progress);
  return freeze({progress,systemOriginInParentFrame3d:origin,presentationScale:smooth,parentEntityId:a.parentEntityId==null?null:String(a.parentEntityId),referenceFrameId:a.referenceFrameId==null?null:String(a.referenceFrameId),scaleStateToken:a.scaleStateToken==null?null:String(a.scaleStateToken),authority:AUTHORITY,semanticScaleAuthority:'UPSTREAM_SCALE_RUNTIME'});
}
function resolveOrbitCenter(planet,stars,systemId){
  const center=String(facts(planet).orbitCenter||'UNKNOWN');
  if(center==='PRIMARY_STAR'&&stars[0])return freeze({kind:'STAR',canonicalEntityId:id(stars[0],'primary star'),status:'RESOLVED_P3_ENUM'});
  if(center==='SYSTEM_BARYCENTER')return freeze({kind:'SYSTEM_BARYCENTER',canonicalEntityId:systemId,status:'RESOLVED_P3_ENUM'});
  return freeze({kind:'UNRESOLVED',canonicalEntityId:systemId,status:'UNSUPPORTED_ORBIT_CENTER',raw:center});
}
function translate(points,center){return points.map(p=>M.add(p,center))}
function createScene(input,options={}){
  if(!input||!input.system||!Array.isArray(input.stars)||!Array.isArray(input.planets))throw new TypeError('system/stars/planets snapshot required');
  const systemId=id(input.system,'system'),stars=input.stars.filter(x=>x?.status!=='ABSENT'),planets=input.planets.filter(x=>x?.status!=='ABSENT'),declared=Number(facts(input.system).stellarComponentCount??stars.length);
  if(stars.length<1||stars.length>LIMITS.maxStars)throw new RangeError('star budget exceeded');if(planets.length>LIMITS.maxPlanets)throw new RangeError('planet budget exceeded');
  const segments=Math.trunc(Number(options.orbitSegments??LIMITS.orbitSegments));if((segments+1)*planets.length>LIMITS.maxOrbitVertices)throw new RangeError('orbit vertex budget exceeded');
  const approach=approachTransform(options.approach),starPositions=starLayout(input.system,stars),nodes=[],orbits=[];
  for(let i=0;i<stars.length;i++)nodes.push(freeze({kind:'STAR',canonicalEntityId:id(stars[i],'star'),parentCanonicalEntityId:systemId,position3d:starPositions[i],transitionPosition3d:M.transform(starPositions[i],approach.systemOriginInParentFrame3d,approach.presentationScale),selectable:true,selectionAuthority:'UPSTREAM_SELECTION_CONTRACT',geometryAuthority:AUTHORITY,sourceFactsAuthority:'CANONICAL_PROVEN'}));
  for(const planet of planets){
    const orbit=R.buildOrbit(planet,{segments}),centerInfo=resolveOrbitCenter(planet,stars,systemId),center=centerInfo.kind==='STAR'?starPositions[0]:[0,0,0],points=translate(orbit.vertices,center),anchor=M.add(orbit.presentationAnchor3d,center),planetId=id(planet,'planet');
    orbits.push(freeze({...orbit,canonicalEntityId:planetId,vertices:Object.freeze(points),orbitCenter:centerInfo}));
    nodes.push(freeze({kind:'PLANET',canonicalEntityId:planetId,parentCanonicalEntityId:centerInfo.canonicalEntityId,systemCanonicalEntityId:systemId,position3d:anchor,transitionPosition3d:M.transform(anchor,approach.systemOriginInParentFrame3d,approach.presentationScale),selectable:true,selectionAuthority:'UPSTREAM_SELECTION_CONTRACT',geometryAuthority:AUTHORITY,sourceFactsAuthority:'CANONICAL_PROVEN',currentOrbitalPhaseAuthority:R.PHASE,orbitCenter:centerInfo}));
  }
  const hierarchy=freeze({systemCanonicalEntityId:systemId,stellarComponentCountDeclared:Number.isFinite(declared)?declared:null,stellarComponentCountRendered:stars.length,planetCountDeclared:Number(facts(input.system).planetCount??planets.length),planetCountRendered:planets.length,multiplicityCoherent:Number.isFinite(declared)?declared===stars.length:null});
  const scene=freeze({version:'ofu-v1x-04-system-scene-1',authority:AUTHORITY,coordinateModel:'TRUE_3D_CARTESIAN_PRESENTATION_SPACE',systemCanonicalEntityId:systemId,approach,hierarchy,nodes:Object.freeze(nodes),orbits:Object.freeze(orbits),claims:freeze({canonicalCurrentOrbitalPhase:false,metricOrbitDistance:false,physicalNodeLongitude:false,physicalArgumentPeriapsis:false,identityPreserved:true}),limits:LIMITS});
  const bytes=new TextEncoder().encode(JSON.stringify(scene)).length;if(nodes.length>LIMITS.maxSceneNodes||bytes>LIMITS.maxEstimatedBytes)throw new RangeError('system scene resource budget exceeded');
  return freeze({...scene,resourceUsage:{sceneNodes:nodes.length,orbitVertices:orbits.reduce((s,o)=>s+o.vertices.length,0),estimatedBytes:bytes}});
}
function validatePrimary3DRepresentation(scene){
  if(!scene||scene.coordinateModel!=='TRUE_3D_CARTESIAN_PRESENTATION_SPACE')return false;if(!Array.isArray(scene.nodes)||!scene.nodes.length)return false;
  if(!scene.nodes.every(n=>Array.isArray(n.position3d)&&n.position3d.length===3&&n.position3d.every(Number.isFinite)))return false;if(!Array.isArray(scene.orbits))return false;
  for(const o of scene.orbits){if(!Array.isArray(o.vertices)||o.vertices.length<24||!o.vertices.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)))return false}return true;
}
O.v1x04SystemScene=Object.freeze({VERSION:'ofu-v1x-04-system-scene-1',AUTHORITY,LIMITS,approachTransform,createScene,validatePrimary3DRepresentation});
})(typeof globalThis!=='undefined'?globalThis:this);
