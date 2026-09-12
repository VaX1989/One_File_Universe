(function(root){
'use strict';
const O=root.OFU=root.OFU||{},P=O.deep3dRenderPackets,S=O.spatialAddress,V=O.v1x04SystemScene;
if(!P||!S||!V)throw new Error('Deep3D system adapter dependencies missing');
const VERSION='ofu-deep3d-system-adapter-2',AUTHORITY='PRESENTATION_ONLY';
const f=(v,l)=>{const n=Number(v);if(!Number.isFinite(n))throw new TypeError(l+' must be finite');return n};
const v3=(v,l)=>{if(!Array.isArray(v)||v.length!==3)throw new TypeError(l+' vec3 required');return v.map((x,i)=>f(x,l+'['+i+']'))};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const flatten=points=>points.reduce((acc,p)=>acc.concat(v3(p,'point')),[]);
const blend=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const BODY=Object.freeze({
  STAR:Object.freeze({radius:2.6,baseColor:Object.freeze([1,.68,.22]),emissive:Object.freeze([.72,.24,.025]),lit:false}),
  PLANET:Object.freeze({radius:.9,baseColor:Object.freeze([.28,.52,.82]),emissive:Object.freeze([0,0,0]),lit:true})
});
const ICOSAHEDRON_FACES=Object.freeze([
 [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
 [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
]);
const normalize=p=>{const d=Math.hypot(p[0],p[1],p[2]);if(!(d>0))throw new Error('icosphere zero-length vertex');return [p[0]/d,p[1]/d,p[2]/d]};
function makeIcosphere(subdivisions){
 const s=Math.max(0,Math.min(3,Math.trunc(f(subdivisions,'subdivisions')))),t=(1+Math.sqrt(5))/2;
 const vertices=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(normalize);
 let faces=ICOSAHEDRON_FACES.map(face=>face.slice());
 for(let level=0;level<s;level++){
   const cache=new Map,next=[];
   const midpoint=(a,b)=>{const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+':'+hi;if(cache.has(key))return cache.get(key);const p=normalize([(vertices[a][0]+vertices[b][0])*.5,(vertices[a][1]+vertices[b][1])*.5,(vertices[a][2]+vertices[b][2])*.5]),index=vertices.length;vertices.push(p);cache.set(key,index);return index};
   for(const face of faces){const a=face[0],b=face[1],c=face[2],ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);next.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca])}
   faces=next;
 }
 return Object.freeze({subdivisions:s,vertices:Object.freeze(vertices.map(p=>Object.freeze(p))),indices:Object.freeze(faces.reduce((acc,face)=>acc.concat(face),[]))});
}
const ICOSPHERES=Object.freeze({1:makeIcosphere(1),2:makeIcosphere(2)});
function address(frameId,systemId){return S.create({frameId,hierarchy:['galaxy',frameId],nativeKey:{systemCanonicalEntityId:systemId},local:[0,0,0],unit:'FRAME_NATIVE',parentFrameId:'galaxy',transformRevision:'v1x04-system-scene-1'})}
function bodyPacket(node,origin,addr,{selected=false,lodLevel=2}={}){
 const cue=BODY[node.kind]||BODY.PLANET,mesh=ICOSPHERES[lodLevel]||ICOSPHERES[2],center=sub(v3(node.transitionPosition3d,'node.transitionPosition3d'),origin),positions=[];
 for(const normal of mesh.vertices)positions.push([center[0]+normal[0]*cue.radius,center[1]+normal[1]*cue.radius,center[2]+normal[2]*cue.radius]);
 const baseColor=selected?blend(cue.baseColor,[1,.91,.56],.38):Array.from(cue.baseColor),emissive=selected?blend(cue.emissive,[.34,.22,.055],.62):Array.from(cue.emissive),vertexCount=mesh.vertices.length,indexCount=mesh.indices.length,geometryBytes=(vertexCount*3*4*2)+(indexCount*4);
 return P.createPacket({packetId:'system:body:'+node.canonicalEntityId,family:'MESH',entityId:node.canonicalEntityId,representationId:'deep3d-icosphere-body-1',lodKey:String(mesh.subdivisions),spatialAddress:addr,provenance:'PRESENTATION_ONLY',semanticState:{kind:node.kind,parentCanonicalEntityId:node.parentCanonicalEntityId||null,systemCanonicalEntityId:node.systemCanonicalEntityId||null,sourceFactsAuthority:node.sourceFactsAuthority||null,currentOrbitalPhaseAuthority:node.currentOrbitalPhaseAuthority||null,geometryAuthority:node.geometryAuthority||AUTHORITY,selected},geometry:{domain:'SYSTEM',coordinateSpace:'CAMERA_RELATIVE_FLOAT32',positions:flatten(positions),normals:flatten(mesh.vertices),indices:Array.from(mesh.indices),lit:cue.lit,lodLevel:mesh.subdivisions,lodTransition:0,depthTest:true,depthWrite:true},material:{baseColor,emissive,roughness:node.kind==='STAR'?.24:.68,metallic:0,opacity:1,selectionGlow:selected?.72:0},lighting:{model:cue.lit?'DIRECTIONAL_AMBIENT':'EMISSIVE',keyDirection:[-.42,.76,.49],keyIntensity:cue.lit?.92:0,ambientIntensity:cue.lit?.2:1,authority:'PRESENTATION_ONLY'},picking:{entityId:node.canonicalEntityId,selectionAuthority:node.selectionAuthority||'UPSTREAM_SELECTION_CONTRACT'},resources:{vertices:vertexCount,indices:indexCount,cpuBytes:geometryBytes,gpuBytes:geometryBytes},claims:{physicalRadius:false,physicalLighting:false,currentOrbitalPhase:false,canonicalIdentityPreserved:true,selectionIdentityPreserved:true}})}
function orbitPacket(orbit,origin,addr){const points=orbit.vertices.map(p=>sub(v3(p,'orbit vertex'),origin));return P.createPacket({packetId:'system:orbit:'+orbit.canonicalEntityId,family:'CURVE',entityId:orbit.canonicalEntityId,representationId:'deep3d-orbit-curve-1',lodKey:String(points.length),spatialAddress:addr,provenance:'PRESENTATION_ONLY',semanticState:{orbitCenter:orbit.orbitCenter||null,geometryAuthority:orbit.geometryAuthority||AUTHORITY,currentOrbitalPhaseAuthority:orbit.currentOrbitalPhaseAuthority||null},geometry:{domain:'SYSTEM',coordinateSpace:'CAMERA_RELATIVE_FLOAT32',positions:flatten(points),curveTopology:'LINE_STRIP',lit:false,lodLevel:0,lodTransition:0,depthTest:true,depthWrite:false},material:{baseColor:[.42,.48,.58],emissive:[.035,.035,.05],roughness:1,metallic:0,opacity:.68},picking:{entityId:orbit.canonicalEntityId,selectionAuthority:'UPSTREAM_SELECTION_CONTRACT'},resources:{vertices:points.length,cpuBytes:points.length*12,gpuBytes:points.length*12},claims:{metricOrbitDistance:false,currentOrbitalPhase:false,canonicalIdentityPreserved:true}})}
function createRenderScene(systemScene,{frameId='system',cameraPosition=[0,0,0],cameraPolicyId='v2x02.authoritative',viewportClass='desktop',semanticSelection=null}={}){
 if(!V.validatePrimary3DRepresentation(systemScene))throw new Error('valid V1X-04 true-3D system scene required');
 const origin=v3(cameraPosition,'cameraPosition'),addr=address(String(frameId),systemScene.systemCanonicalEntityId),packets=[],selection=semanticSelection||{entityId:systemScene.systemCanonicalEntityId},selectedId=selection&&selection.entityId!=null?String(selection.entityId):null,lodLevel=String(viewportClass).toLowerCase().includes('mobile')?1:2;
 for(const orbit of systemScene.orbits)packets.push(orbitPacket(orbit,origin,addr));
 for(const node of systemScene.nodes)packets.push(bodyPacket(node,origin,addr,{selected:selectedId===String(node.canonicalEntityId),lodLevel}));
 return P.createScene({frameId:String(frameId),cameraPolicyId,viewportClass,packets,semanticSelection:selection});
}
O.deep3dSystemAdapter=Object.freeze({VERSION,AUTHORITY,makeIcosphere,createRenderScene,claims:Object.freeze({sourceScene:'V1X04_TRUE_3D',bodyGeometry:'DETERMINISTIC_ICOSPHERE',physicalBodyRadius:false,physicalLighting:false,metricOrbitDistance:false,currentOrbitalPhase:false,canonicalIdentityPreserved:true,selectionIdentityPreserved:true,cameraAuthority:false})});
})(typeof globalThis!=='undefined'?globalThis:this);
