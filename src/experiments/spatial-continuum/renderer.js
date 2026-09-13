import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import '@babylonjs/core/Culling/ray.js';
import '@babylonjs/core/Meshes/thinInstanceMesh.js';
import { perceptualLod, projectedSpanPixels } from './lod.js';

const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const smooth=value=>{const t=clamp01(value);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const hash=value=>{let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0};
const randomFactory=seed=>{let value=hash(seed)||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296}};
const color=(hex)=>Color3.FromHexString(hex);

function alphaMaterial(scene,name,hex,{emissive=null,alpha=1,disableLighting=false}={}){
  const material=new StandardMaterial(name,scene);material.diffuseColor=color(hex);material.specularColor=new Color3(.12,.16,.2);material.alpha=alpha;material.disableLighting=disableLighting;material.metadata={baseAlpha:alpha};
  if(emissive)material.emissiveColor=color(emissive);return material;
}

function setLayer(layer,value){
  const alpha=clamp01(value);layer.root.setEnabled(alpha>.001);
  for(const material of layer.materials){material.alpha=alpha*(material.metadata?.baseAlpha??1);material.needDepthPrePass=alpha<.999;}
}

function textureForPlanet(scene,seed){
  const texture=new DynamicTexture('planet-surface',{width:512,height:256},scene,false,Texture.BILINEAR_SAMPLINGMODE),ctx=texture.getContext(),rnd=randomFactory(seed);
  const gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#88bfd2');gradient.addColorStop(.24,'#276a87');gradient.addColorStop(.52,'#123d59');gradient.addColorStop(.78,'#235d75');gradient.addColorStop(1,'#c6d8d5');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  for(let i=0;i<34;i++){
    const x=rnd()*512,y=rnd()*256,rx=16+rnd()*80,ry=7+rnd()*35,rotation=rnd()*Math.PI;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const land=ctx.createRadialGradient(-rx*.2,-ry*.2,2,0,0,rx);land.addColorStop(0,rnd()>.45?'#d5b57b':'#7fa16d');land.addColorStop(.62,rnd()>.35?'#6c7e56':'#9b7752');land.addColorStop(1,'rgba(40,64,53,0)');ctx.fillStyle=land;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  for(let i=0;i<96;i++){ctx.fillStyle=`rgba(238,246,242,${.025+rnd()*.09})`;ctx.beginPath();ctx.ellipse(rnd()*512,rnd()*256,6+rnd()*28,1+rnd()*5,rnd()*Math.PI,0,Math.PI*2);ctx.fill()}
  texture.update(false);return texture;
}

function createStarfield(scene,seed){
  const root=new TransformNode('spatial-starfield-root',scene),rnd=randomFactory(seed+'sky'),materials=['#e9f0ff','#9fd7ff','#ffd8ad'].map((hex,index)=>alphaMaterial(scene,'starfield-material-'+index,hex,{emissive:hex,disableLighting:true,alpha:index?0.78:0.56}));
  for(let group=0;group<materials.length;group++){const mesh=MeshBuilder.CreateSphere('spatial-starfield-'+group,{diameter:1,segments:4},scene),matrices=[];mesh.material=materials[group];mesh.parent=root;mesh.isPickable=false;for(let i=group;i<690;i+=materials.length){const radius=95+rnd()*150,y=2*rnd()-1,theta=rnd()*Math.PI*2,planar=Math.sqrt(1-y*y),scale=.3+rnd()**4*1.7;Matrix.Compose(new Vector3(scale,scale,scale),Quaternion.Identity(),new Vector3(radius*planar*Math.cos(theta),radius*y,radius*planar*Math.sin(theta))).copyToArray(matrices,matrices.length)}mesh.thinInstanceSetBuffer('matrix',Float32Array.from(matrices),16,true)}return{root,materials};
}

function terrainHeight(x,z,seed){
  const phase=(hash(seed)%1000)/1000*Math.PI*2;
  const ridges=Math.sin(x*.43+phase)*Math.cos(z*.31-phase)*.65+Math.sin((x+z)*.16)*.72;
  const peak=4.2*Math.exp(-((x+4.3)**2+(z+3.2)**2)/13);
  const caldera=-1.7*Math.exp(-((x-3.8)**2+(z+2.4)**2)/5.5);
  const canyon=-1.15*Math.exp(-((x+z*.35-1.5)**2)/1.2);
  return ridges+peak+caldera+canyon;
}

function terrainMesh(scene,name,subdivisions,seed,size=34){
  const mesh=MeshBuilder.CreateGround(name,{width:size,height:size,subdivisions,updatable:false},scene),positions=mesh.getVerticesData(VertexBuffer.PositionKind),colors=[];
  for(let i=0;i<positions.length;i+=3){const x=positions[i],z=positions[i+2],height=terrainHeight(x,z,seed);positions[i+1]=height;const normalized=clamp01((height+2)/6),wet=height<-.28;const c=wet?[.08,.27,.34,1]:normalized>.72?[.72,.68,.56,1]:normalized>.42?[.28,.43,.33,1]:[.34,.29,.23,1];colors.push(...c)}
  const indices=mesh.getIndices(),normals=[];VertexData.ComputeNormals(positions,indices,normals);mesh.setVerticesData(VertexBuffer.PositionKind,positions);mesh.setVerticesData(VertexBuffer.NormalKind,normals);mesh.setVerticesData(VertexBuffer.ColorKind,colors);mesh.refreshBoundingInfo();return mesh;
}

function createTerrainLayer(scene,seed,subdivisions,name){
  const root=new TransformNode(name+'-root',scene),mesh=terrainMesh(scene,name,subdivisions,seed),material=alphaMaterial(scene,name+'-material','#ffffff');material.useVertexColors=true;material.specularColor=new Color3(.05,.07,.08);mesh.material=material;mesh.parent=root;return{root,mesh,materials:[material]};
}

function createSystem(scene,world){
  const root=new TransformNode('system-root',scene),materials=[],planetMeshes=[],selectedId=world.bodyId,rnd=randomFactory(world.systemId),planets=world.bodies.filter(body=>body.kind==='planet');
  const star=MeshBuilder.CreateSphere('canonical-host-star',{diameter:2.2,segments:32},scene),starMat=alphaMaterial(scene,'star-material','#ffd39a',{emissive:'#ffb862'});star.material=starMat;star.parent=root;star.metadata={canonicalId:world.systemId+':star',selectable:false};materials.push(starMat);
  const light=new PointLight('host-star-light',new Vector3(0,0,0),scene);light.diffuse=new Color3(1,.72,.48);light.intensity=135;light.range=90;light.parent=root;
  const sorted=planets.map((body,index)=>{const semimajor=Number(body.facts?.baselineSemiMajorAxisMicroAu||body.facts?.semiMajorAxisMicroAu||index+1);return{body,semimajor,index}}).sort((a,b)=>a.semimajor-b.semimajor),min=Math.min(...sorted.map(x=>x.semimajor)),max=Math.max(...sorted.map(x=>x.semimajor));
  let selectedOrbitX=10;
  for(const [order,row] of sorted.entries()){
    const orbitRadius=5+(max===min?order/(Math.max(1,sorted.length-1)):(row.semimajor-min)/(max-min))*13;
    const ring=MeshBuilder.CreateTorus('orbit-guide-'+order,{diameter:orbitRadius*2,thickness:.018,tessellation:96},scene),ringMat=alphaMaterial(scene,'orbit-guide-material-'+order,'#6f8fab',{emissive:'#36516a',alpha:.34,disableLighting:true});ring.material=ringMat;ring.parent=root;ring.scaling.z=.72+.18*rnd();materials.push(ringMat);
    const angle=order*2.11+.35,selected=row.body.id===selectedId,radius=selected?.8:.18+Math.min(.25,Math.cbrt(Number(row.body.facts?.baselineMassMilliEarth||1000)/1000)*.08),mesh=MeshBuilder.CreateSphere('canonical-planet-'+order,{diameter:2,segments:selected?48:20},scene),mat=alphaMaterial(scene,'planet-material-'+order,selected?'#4d94ad':['#b58b65','#8293a6','#7f6b93','#ba9b72'][order%4],{emissive:selected?'#071823':null});mesh.material=mat;mesh.position.set(Math.cos(angle)*orbitRadius,Math.sin(order*.7)*.32,Math.sin(angle)*orbitRadius*.8);mesh.scaling.setAll(radius);mesh.parent=root;mesh.metadata={canonicalId:row.body.id,selectable:selected,selected,baseScale:radius,body:row.body};materials.push(mat);planetMeshes.push(mesh);if(selected)selectedOrbitX=mesh.position.x;
  }
  const selected=planetMeshes.find(mesh=>mesh.metadata.selected);if(!selected)throw new Error('Selected canonical world is absent from its rendered system');
  selected.material.diffuseTexture=textureForPlanet(scene,world.bodyId);selected.material.diffuseTexture.uScale=-1;selected.material.specularColor=new Color3(.18,.28,.34);
  const atmosphere=MeshBuilder.CreateSphere('presentation-atmosphere',{diameter:2.08,segments:32},scene),atmosphereMat=alphaMaterial(scene,'atmosphere-material','#77cfff',{emissive:'#205774',alpha:.32,disableLighting:true});atmosphereMat.backFaceCulling=false;atmosphere.parent=selected;atmosphere.material=atmosphereMat;atmosphere.isPickable=false;materials.push(atmosphereMat);
  const clouds=MeshBuilder.CreateSphere('presentation-clouds',{diameter:2.025,segments:32},scene),cloudMat=alphaMaterial(scene,'cloud-material','#e7f4f1',{emissive:'#66818a',alpha:.16});cloudMat.backFaceCulling=false;clouds.parent=selected;clouds.material=cloudMat;clouds.isPickable=false;materials.push(cloudMat);
  const target=MeshBuilder.CreateTorus('retained-surface-target',{diameter:.3,thickness:.025,tessellation:48},scene),targetMat=alphaMaterial(scene,'retained-target-material','#f4c36f',{emissive:'#cc7d24',alpha:.9,disableLighting:true});target.position.set(0,0,1.035);target.rotation.x=Math.PI/2;target.parent=selected;target.material=targetMat;target.isPickable=false;materials.push(targetMat);
  return{root,materials,planetMeshes,selected,atmosphereMat,cloudMat,targetMat,light,selectedOrbitX};
}

function createLocalDetail(scene,world,highTerrain){
  const root=new TransformNode('local-detail-root',scene),materials=[],rnd=randomFactory(world.sampleId),rockMat=alphaMaterial(scene,'rock-field-material','#756a5e'),accent=alphaMaterial(scene,'sample-rock-material','#c99b61',{emissive:'#2a1709'});materials.push(rockMat,accent);
  const sample=MeshBuilder.CreatePolyhedron('inspected-source-sample',{type:2,size:.48},scene);sample.position.set(0,terrainHeight(0,-2,world.bodyId)+1.35,-2);sample.rotation.set(.2,.6,.08);sample.material=accent;sample.parent=root;sample.metadata={canonicalId:world.sampleId,selectable:true,sample:true,baseScale:1};
  for(let i=0;i<34;i++){const rock=MeshBuilder.CreatePolyhedron('terrain-rock-'+i,{type:i%2?1:2,size:.12+rnd()*.22},scene),x=(rnd()-.5)*22,z=(rnd()-.5)*22;rock.position.set(x,terrainHeight(x,z,world.bodyId)+.14,z);rock.rotation.set(rnd()*2,rnd()*2,rnd()*2);rock.scaling.y=.5+rnd();rock.material=rockMat;rock.parent=root;rock.isPickable=false;}
  return{root,materials,sample,highTerrain};
}

function createMaterialLayer(scene,world){
  const root=new TransformNode('material-root',scene),materials=[],components=world.representations.material.components||[],rnd=randomFactory(world.sampleId+'material'),palette=world.sample.kind==='ICE'?['#8ed9e7','#bceef2','#73aebf']:['#b88b5a','#6ba6ad','#8075a5','#55606b'];
  for(const [index,component] of (components.length?components:[{id:'UNKNOWN',ppm:1000000}]).slice(0,4).entries()){const mat=alphaMaterial(scene,'material-component-mat-'+index,palette[index%palette.length],{emissive:world.sample.kind==='ICE'?'#173640':null,alpha:.82});mat.specularColor=new Color3(.65,.78,.82);materials.push(mat);const count=Math.max(3,Math.round(12*Number(component.ppm||0)/1e6));for(let i=0;i<count;i++){const mesh=MeshBuilder.CreatePolyhedron('material-volume-'+index+'-'+i,{type:2,size:.75+rnd()*.65},scene),angle=i/count*Math.PI*2+rnd()*.3,radius=.6+(i%3)*1.15;mesh.position.set(Math.cos(angle)*radius,(rnd()-.5)*2.4,Math.sin(angle)*radius*.65);mesh.rotation.set(rnd()*1.4,rnd()*2,rnd()*1.4);mesh.scaling.set(.7+rnd()*.5,.85+rnd()*.9,.7+rnd()*.5);mesh.material=mat;mesh.parent=root;mesh.isPickable=false;}}
  const frame=MeshBuilder.CreateTorus('material-source-tether',{diameter:9.2,thickness:.035,tessellation:96},scene),frameMat=alphaMaterial(scene,'material-frame-mat','#d6b779',{emissive:'#6f5428',alpha:.75,disableLighting:true});frame.rotation.x=Math.PI/2;frame.material=frameMat;frame.parent=root;materials.push(frameMat);return{root,materials};
}

function createMicrostructureLayer(scene,world){
  const root=new TransformNode('microstructure-root',scene),materials=[alphaMaterial(scene,'grain-a','#70a6a0'),alphaMaterial(scene,'grain-b','#bd8b68'),alphaMaterial(scene,'grain-c','#7c78a8')],rnd=randomFactory(world.sampleId+'grains');
  for(let group=0;group<3;group++){const mesh=MeshBuilder.CreatePolyhedron('presentation-grain-group-'+group,{type:2,size:1},scene),matrices=[];mesh.material=materials[group];mesh.parent=root;mesh.isPickable=false;for(let i=group;i<52;i+=3){const radius=1.5+rnd()*3.2,angle=rnd()*Math.PI*2,scale=.55+rnd()*.7,matrix=Matrix.Compose(new Vector3(scale,.5+rnd(),.5+rnd()),Quaternion.RotationYawPitchRoll(rnd()*3,rnd()*3,rnd()*3),new Vector3(Math.cos(angle)*radius+(rnd()-.5)*1.5,(rnd()-.5)*4,Math.sin(angle)*radius*.55));matrix.copyToArray(matrices,matrices.length)}mesh.thinInstanceSetBuffer('matrix',Float32Array.from(matrices),16,true);}
  return{root,materials};
}

function createMolecularLayer(scene,world){
  const root=new TransformNode('molecular-root',scene),materials=[alphaMaterial(scene,'site-oxygen','#d97d6b',{emissive:'#37110c'}),alphaMaterial(scene,'site-silicon','#76a8c3',{emissive:'#102c3b'}),alphaMaterial(scene,'bond-material','#9fb2bd',{emissive:'#273139'})],positions=[[-2.8,0,0],[-1.4,1.4,.4],[-1.2,-1.5,-.3],[0,0,0],[1.5,1.3,-.2],[1.5,-1.25,.4],[2.9,0,0],[0,2.4,.2],[0,-2.35,-.2]],meshes=[];
  const sphereAt=(position,index)=>{const mesh=MeshBuilder.CreateSphere('contextual-molecular-site-'+index,{diameter:index%3===0?1.1:.72,segments:24},scene);mesh.position.set(...position);mesh.material=materials[index%3===0?1:0];mesh.parent=root;mesh.isPickable=false;meshes.push(mesh);};positions.forEach(sphereAt);
  const bond=(a,b,index)=>{const start=new Vector3(...a),end=new Vector3(...b),delta=end.subtract(start),length=delta.length(),mesh=MeshBuilder.CreateCylinder('contextual-bond-'+index,{height:length,diameter:.13,tessellation:12},scene);mesh.position=start.add(end).scale(.5);mesh.rotationQuaternion=new Quaternion();Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly,delta.normalize(),mesh.rotationQuaternion);mesh.material=materials[2];mesh.parent=root;mesh.isPickable=false;};
  [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[3,7],[3,8]].forEach(([a,b],index)=>bond(positions[a],positions[b],index));return{root,materials,meshes};
}

function createAtomicLayer(scene,world){
  const root=new TransformNode('atomic-root',scene),nucleusMat=alphaMaterial(scene,'nucleus-material','#ffb064',{emissive:'#783513'}),cloudMat=alphaMaterial(scene,'probability-cloud-material','#6bbad8',{emissive:'#27617b',alpha:.16,disableLighting:true}),pointMat=alphaMaterial(scene,'probability-sample-material','#a4dded',{emissive:'#477d91',alpha:.48,disableLighting:true}),materials=[nucleusMat,cloudMat,pointMat],rnd=randomFactory(world.sampleId+'atomic');
  for(let i=0;i<12;i++){const sphere=MeshBuilder.CreateSphere('contextual-nucleon-'+i,{diameter:.58,segments:16},scene);sphere.position.set((rnd()-.5)*1.25,(rnd()-.5)*1.25,(rnd()-.5)*1.25);sphere.material=nucleusMat;sphere.parent=root;sphere.isPickable=false;}
  const cloud=MeshBuilder.CreateSphere('presentation-probability-density',{diameter:7.2,segments:48},scene);cloud.material=cloudMat;cloud.parent=root;cloud.isPickable=false;
  const point=MeshBuilder.CreateSphere('probability-samples',{diameter:.09,segments:8},scene),matrices=[];point.material=pointMat;point.parent=root;point.isPickable=false;
  for(let i=0;i<96;i++){const r=Math.max(1.7,Math.min(4.1,Math.abs((rnd()+rnd()+rnd())-1.5)*3.4+1.2)),theta=rnd()*Math.PI*2,phi=Math.acos(2*rnd()-1);Matrix.Translation(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta)).copyToArray(matrices,matrices.length)}point.thinInstanceSetBuffer('matrix',Float32Array.from(matrices),16,true);
  return{root,materials};
}

export function createContinuumRenderer(canvas,world,{onContextChange=()=>{}}={}){
  const engine=new Engine(canvas,false,{preserveDrawingBuffer:false,stencil:false,disableWebGL2Support:false,premultipliedAlpha:false,powerPreference:'high-performance'},false),scene=new Scene(engine);scene.clearColor=new Color4(.002,.006,.018,1);scene.ambientColor=new Color3(.08,.1,.14);
  const camera=new FreeCamera('continuum-camera',new Vector3(0,10,48),scene);camera.minZ=.015;camera.maxZ=1200;camera.fov=.66;camera.inputs.clear();scene.activeCamera=camera;
  const hemi=new HemisphericLight('ambient-key',new Vector3(.2,1,.1),scene);hemi.intensity=.55;hemi.diffuse=new Color3(.55,.7,.82);hemi.groundColor=new Color3(.05,.035,.025);
  const sun=new DirectionalLight('terrain-sun',new Vector3(-.45,-.82,.38),scene);sun.intensity=1.6;sun.diffuse=new Color3(1,.82,.62);
  const starfield=createStarfield(scene,world.systemId),system=createSystem(scene,world),terrainCoarse=createTerrainLayer(scene,world.bodyId,24,'terrain-coarse'),terrainMedium=createTerrainLayer(scene,world.bodyId,48,'terrain-medium'),terrainHigh=createTerrainLayer(scene,world.bodyId,80,'terrain-high'),local=createLocalDetail(scene,world,terrainHigh),material=createMaterialLayer(scene,world),micro=createMicrostructureLayer(scene,world),molecular=createMolecularLayer(scene,world),atomic=createAtomicLayer(scene,world);
  terrainMedium.root.position.y=.003;terrainHigh.root.position.y=.006;
  const layers={terrainCoarse,terrainMedium,terrainHigh,local,material,micro,molecular,atomic};
  let disposed=false,lastSnapshot=null,lastRenderKey=null,lastLod=null,hovered=null,contextLosses=0,contextRestores=0,lastResize=[0,0],lastScaling=0,readinessScheduled=false,readyResolved=false,resolveReady;const ready=new Promise(resolve=>{resolveReady=resolve}),finishReady=()=>{if(!readyResolved){readyResolved=true;resolveReady(true)}};
  const onLost=()=>{contextLosses++;lastRenderKey=null;onContextChange('lost')},onRestored=()=>{contextRestores++;lastRenderKey=null;onContextChange('restored')};canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);

  function update(snapshot){
    if(disposed)return;lastSnapshot=snapshot;const coordinate=snapshot.scale.coordinate,weights=snapshot.representationHandoff.weights,pose=snapshot.camera,rect=canvas.getBoundingClientRect(),size=[Math.round(rect.width),Math.round(rect.height)],settledScaling=Math.max(1,Math.min(1.5,Math.sqrt(Math.max(1,size[0]*size[1])/600000))),scaling=snapshot.scale.moving?Math.max(2.15,settledScaling):settledScaling;if(size[0]!==lastResize[0]||size[1]!==lastResize[1]||Math.abs(scaling-lastScaling)>.01){lastResize=size;lastScaling=scaling;engine.setHardwareScalingLevel(scaling);engine.resize();lastRenderKey=null}const renderKey=[snapshot.revision,coordinate.toFixed(5),pose.revision,size[0],size[1],scaling.toFixed(2)].join(':');if(renderKey===lastRenderKey)return;lastRenderKey=renderKey;
    camera.position.set(...pose.position);camera.setTarget(new Vector3(...pose.target));camera.upVector.set(...pose.up);camera.fov=pose.fov;
    const systemWeight=weights.SYSTEM||0,orbitWeight=weights.ORBIT||0,approachWeight=weights.APPROACH||0,globalWeight=weights.GLOBAL_SURFACE||0,regionalWeight=weights.REGIONAL_SURFACE||0,localWeight=weights.LOCAL_SURFACE||0,humanWeight=weights.HUMAN||0,materialWeight=weights.MATERIAL||0,microWeight=weights.MICROSTRUCTURE||0,molecularWeight=weights.MOLECULAR||0,atomicWeight=weights.ATOMIC||0;
    const recenter=smooth(coordinate),selectedScale=mix(system.selected.metadata.baseScale,3,Math.min(1,coordinate));system.root.position.x=-system.selected.position.x*recenter;system.root.position.z=-system.selected.position.z*recenter;system.selected.scaling.setAll(selectedScale);
    for(const mesh of system.planetMeshes){const isSelected=mesh===system.selected,alpha=isSelected?Math.max(systemWeight,orbitWeight,approachWeight,globalWeight):systemWeight;mesh.material.alpha=alpha;mesh.setEnabled(alpha>.001)}
    for(const materialItem of system.materials){if(system.planetMeshes.some(mesh=>mesh.material===materialItem)||materialItem===system.atmosphereMat||materialItem===system.cloudMat||materialItem===system.targetMat)continue;materialItem.alpha=systemWeight*(materialItem.metadata?.baseAlpha??1)}
    system.atmosphereMat.alpha=Math.max(orbitWeight*.22,approachWeight*.36,globalWeight*.28);system.cloudMat.alpha=Math.max(orbitWeight*.1,approachWeight*.2,globalWeight*.16);
    system.targetMat.alpha=Math.max(approachWeight*.18,globalWeight*.9);
    system.light.intensity=135*Math.max(systemWeight,orbitWeight,approachWeight,globalWeight*.14);
    const terrainDistance=Math.max(.1,Vector3.Distance(camera.position,terrainHigh.mesh.getBoundingInfo().boundingSphere.centerWorld)),terrainSpan=projectedSpanPixels({worldSpan:34,cameraDistance:terrainDistance,verticalFovRadians:camera.fov,viewportHeightPx:Math.max(1,size[1])});lastLod=perceptualLod({projectedSpanPx:terrainSpan,targetErrorPx:96});
    setLayer(terrainCoarse,regionalWeight*.7*lastLod.weights.coarse);setLayer(terrainMedium,(regionalWeight+localWeight*.25)*lastLod.weights.medium);setLayer(terrainHigh,(localWeight+humanWeight)*lastLod.weights.high);setLayer(local,localWeight*.45+humanWeight);
    setLayer(material,materialWeight);setLayer(micro,microWeight);setLayer(molecular,molecularWeight);setLayer(atomic,atomicWeight);
    const spaceAlpha=1-smooth(clamp01((coordinate-2.7)/1.2));setLayer(starfield,spaceAlpha);const surfaceSky=smooth(clamp01((coordinate-3.1)/.8))*(1-smooth(clamp01((coordinate-6.25)/.55)));scene.clearColor.set(mix(.002,.025,surfaceSky),mix(.006,.075,surfaceSky),mix(.018,.12,surfaceSky),1);
    scene.render();if(scene.isReady())finishReady();else if(!readinessScheduled){readinessScheduled=true;scene.executeWhenReady(()=>{readinessScheduled=false;lastRenderKey=null;if(lastSnapshot&&!disposed)update(lastSnapshot);finishReady()})}
  }

  function pick(clientX,clientY){
    const rect=canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top,result=scene.pick(x,y,mesh=>mesh?.metadata?.selectable===true&&mesh.isEnabled()&&mesh.isVisible&&mesh.isPickable,false,camera);
    if(!result?.hit||!result.pickedMesh?.metadata?.canonicalId)return null;
    return Object.freeze({id:result.pickedMesh.metadata.canonicalId,mesh:result.pickedMesh,point:result.pickedPoint?Object.freeze([result.pickedPoint.x,result.pickedPoint.y,result.pickedPoint.z]):null,distance:result.distance});
  }
  function hover(clientX,clientY){
    const hit=pick(clientX,clientY),next=hit?.mesh||null;if(hovered&&hovered!==next){hovered.scaling.scaleInPlace(1/1.08);lastRenderKey=null}if(next&&hovered!==next){next.scaling.scaleInPlace(1.08);lastRenderKey=null}hovered=next;canvas.style.cursor=next?'pointer':'grab';return hit;
  }
  function snapshot(){
    const instruments=engine.getCaps(),rect=canvas.getBoundingClientRect(),viewport=camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight());
    const targetMetrics=mesh=>{mesh.computeWorldMatrix(true);const center=mesh.getBoundingInfo().boundingSphere.centerWorld,radius=mesh.getBoundingInfo().boundingSphere.radiusWorld,projected=Vector3.Project(center,Matrix.IdentityReadOnly,scene.getTransformMatrix(),viewport),distance=Vector3.Distance(camera.position,center),diameter=distance>0?2*radius/distance*(rect.height/(2*Math.tan(camera.fov/2))):null;return Object.freeze({clientX:rect.left+projected.x/Math.max(1,engine.getRenderWidth())*rect.width,clientY:rect.top+projected.y/Math.max(1,engine.getRenderHeight())*rect.height,diameterCssPx:diameter,distance,visible:mesh.isEnabled()&&mesh.isVisible&&mesh.visibility>0})};
    return Object.freeze({contract:'ofu-spatial-continuum-renderer-1',engine:'Babylon.js',engineVersion:'9.26.0',backend:engine.webGLVersion===2?'WEBGL2':'WEBGL1',webglVersion:engine.webGLVersion,sceneReady:readyResolved,meshCount:scene.meshes.length,materialCount:scene.materials.length,textureCount:scene.textures.length,activeMeshes:scene.getActiveMeshes().length,drawCalls:engine._drawCalls?.current??null,contextLosses,contextRestores,disposed,lastStage:lastSnapshot?.scale?.semanticStage||null,maxTextureSize:instruments.maxTextureSize,rendererOwnedPicking:true,sceneCount:1,cameraCount:scene.cameras.length,lod:lastLod,pickTargets:Object.freeze({body:targetMetrics(system.selected),sample:targetMetrics(local.sample)})});
  }
  function dispose(){if(disposed)return false;disposed=true;canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);scene.dispose();engine.dispose();return true}
  return Object.freeze({update,pick,hover,snapshot,dispose,ready,engine,scene,camera});
}
