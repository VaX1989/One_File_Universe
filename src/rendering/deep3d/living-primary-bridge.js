(function(root){
'use strict';
const O=root.OFU=root.OFU||{},L=O.v1LivingRenderer,S=O.v1x04SystemScene,A=O.deep3dSystemAdapter,G=O.deep3dWebGL2Backend;
if(!L||!S||!A||!G)throw new Error('Deep3D living primary bridge dependencies missing');
const VERSION='ofu-deep3d-living-primary-bridge-1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=v=>{const n=Math.hypot(v[0],v[1],v[2])||1;return v.map(x=>x/n)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function multiply4(a,b){const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out}
function cameraRelativeViewProjection(camera){
 const p=camera.position,t=camera.target,u=camera.up||[0,1,0],forward=norm([t[0]-p[0],t[1]-p[1],t[2]-p[2]]),right=norm(cross(forward,u)),up=norm(cross(right,forward)),f=1/Math.tan(camera.fovYRadians/2),near=camera.near,far=camera.far,aspect=camera.aspect;
 const view=[right[0],up[0],-forward[0],0,right[1],up[1],-forward[1],0,right[2],up[2],-forward[2],0,0,0,0,1];
 const projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0];
 return Object.freeze(multiply4(projection,view).map(Math.fround));
}
function sourceFromSnapshot(s){
 if(!s||s.stage!=='SYSTEM'||!s.system||!Array.isArray(s.rows))throw new TypeError('SYSTEM living snapshot required');
 return Object.freeze({system:Object.freeze({id:s.system.canonicalId,facts:s.system.metadata?.facts||{}}),stars:Object.freeze(s.rows.filter(n=>n.kind==='star').map(n=>Object.freeze({id:n.canonicalId||n.entityId,facts:n.metadata?.facts||{}}))),planets:Object.freeze(s.rows.filter(n=>n.kind==='planet').map(n=>Object.freeze({id:n.canonicalId||n.entityId,facts:n.metadata?.facts||{}})))});
}
function selectedEntityId(s){return s?.body?.canonicalId||s?.selectedCanonicalId||s?.selectedEntityId||s?.system?.canonicalId||null}
function install(){
 if(O.v1LivingRenderer?.DEEP3D_PRIMARY_BRIDGE===VERSION)return O.v1LivingRenderer;
 const legacy=O.v1LivingRenderer;if(!legacy||typeof legacy.create!=='function')throw new Error('living renderer create unavailable');
 function create(canvas,glCanvas,options={}){
  const base=legacy.create(canvas,glCanvas,options);let backend=null,lastSnapshot=null,lastWitness=null,lastError=null,lost=false,yaw=0,pitch=0,travelDistanceRadii=null,travelBand=null;
  const contextOptions={alpha:true,antialias:true,depth:true,premultipliedAlpha:true,preserveDrawingBuffer:false};
  function camera(){const rect=canvas.getBoundingClientRect(),width=Math.max(1,rect.width),height=Math.max(1,rect.height),anchor=O.waveIVScaleRuntime?.snapshot?.().anchors?.[travelBand]||null,ratio=anchor&&travelDistanceRadii?clamp(travelDistanceRadii/anchor,.45,2.4):1,d=28*2.8*ratio,cp=Math.cos(pitch),position=[Math.sin(yaw)*cp*d,Math.sin(pitch)*d,Math.cos(yaw)*cp*d];return Object.freeze({position,target:[0,0,0],up:[0,1,0],fovYRadians:Math.PI/3,aspect:width/height,near:.28,far:560})}
  function clearLegacyPixels(){const ctx=canvas.getContext('2d');if(!ctx)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore()}
  function ensureBackend(){if(backend&&!lost)return backend;const gl=glCanvas.getContext('webgl2',contextOptions);if(!gl)throw new Error('Deep3D primary SYSTEM requires WebGL2');backend=G.createBackend(gl,{canvas:glCanvas});lost=false;return backend}
  function releaseBackend(){if(backend){try{backend.dispose()}catch(_error){}backend=null}lost=false}
  function renderSystem(s){
   const c=camera(),raw=S.createScene(sourceFromSnapshot(s)),selection={entityId:String(selectedEntityId(s)||raw.systemCanonicalEntityId)},viewportClass=(O.v1LivingRenderer.resourceProfile?.().mobile?'mobile':'desktop'),scene=A.createRenderScene(raw,{frameId:'system',cameraPosition:c.position,cameraPolicyId:'v2x02.authoritative',viewportClass,semanticSelection:selection}),width=Math.max(1,canvas.width),height=Math.max(1,canvas.height);
   if(glCanvas.width!==width)glCanvas.width=width;if(glCanvas.height!==height)glCanvas.height=height;
   const frame={frameId:'deep3d:system',sceneId:scene.fingerprint,viewport:{width,height},camera:{frameId:'system',viewProjection:cameraRelativeViewProjection(c),position:[0,0,0]},clearColor:[.018,.035,.055,1],aaMode:'FXAA',fog:false,lighting:{direction:[-.42,.76,.49],color:[1,.94,.84],intensity:.92,ambient:.2}};
   lastWitness=ensureBackend().render(scene,frame);lastError=null;glCanvas.hidden=false;clearLegacyPixels();return lastWitness;
  }
  async function render(s){lastSnapshot=s;const result=await base.render(s);if(s?.stage==='SYSTEM'){try{renderSystem(s)}catch(error){lastError=String(error?.message||error);releaseBackend();glCanvas.hidden=true;throw error}}else if(backend){releaseBackend()}return result}
  function rotate(dx,dy){yaw+=Number(dx||0)*.006;pitch=clamp(pitch+Number(dy||0)*.004,-1.35,1.35);const result=base.rotate(dx,dy);if(lastSnapshot?.stage==='SYSTEM')queueMicrotask(()=>{try{renderSystem(lastSnapshot)}catch(error){lastError=String(error?.message||error);glCanvas.hidden=true}});return result}
  function setTravelDistance(distanceRadii,band){const d=Number(distanceRadii);if(Number.isFinite(d)&&d>0)travelDistanceRadii=d;if(band)travelBand=String(band);const result=base.setTravelDistance(distanceRadii,band);if(lastSnapshot?.stage==='SYSTEM')queueMicrotask(()=>{try{renderSystem(lastSnapshot)}catch(error){lastError=String(error?.message||error);glCanvas.hidden=true}});return result}
  function resize(){const result=base.resize();if(lastSnapshot?.stage==='SYSTEM')queueMicrotask(()=>{try{renderSystem(lastSnapshot)}catch(error){lastError=String(error?.message||error);glCanvas.hidden=true}});return result}
  function state(){const s=base.state();return {...s,deep3d:Object.freeze({version:VERSION,primaryScale:lastSnapshot?.stage==='SYSTEM'?'SYSTEM':null,primaryBackend:lastSnapshot?.stage==='SYSTEM'&&!lastError?'DEEP3D_WEBGL2_V2X13':null,legacyCanvasPixelsPrimary:false,canvasRole:lastSnapshot?.stage==='SYSTEM'?'INTERACTION_ACCESSIBILITY_OVERLAY':'LEGACY_OR_SCALE_SPECIALIST',lost,lastError,lastWitness,backend:backend?.snapshot?.()||null,cameraAuthority:'EXTERNAL_READ_ONLY',selectionAuthority:'EXTERNAL_READ_ONLY',scientificAuthority:false})}}
  function dispose(){releaseBackend();return base.dispose()}
  const onLost=e=>{if(lastSnapshot?.stage!=='SYSTEM')return;e?.preventDefault?.();lost=true;try{backend?.contextLost?.()}catch(_error){}glCanvas.hidden=true};
  const onRestored=()=>{if(lastSnapshot?.stage!=='SYSTEM')return;try{const gl=glCanvas.getContext('webgl2',contextOptions);if(backend&&gl)backend.contextRestored(gl);lost=false;renderSystem(lastSnapshot)}catch(error){lastError=String(error?.message||error);releaseBackend();glCanvas.hidden=true}};
  glCanvas.addEventListener?.('webglcontextlost',onLost,false);glCanvas.addEventListener?.('webglcontextrestored',onRestored,false);
  return Object.freeze({...base,render,rotate,setTravelDistance,resize,state,dispose});
 }
 O.v1LivingRenderer=Object.freeze({...legacy,create,DEEP3D_PRIMARY_BRIDGE:VERSION});return O.v1LivingRenderer;
}
O.deep3dLivingPrimaryBridge=Object.freeze({VERSION,cameraRelativeViewProjection,sourceFromSnapshot,selectedEntityId,install});install();
})(typeof globalThis!=='undefined'?globalThis:this);
