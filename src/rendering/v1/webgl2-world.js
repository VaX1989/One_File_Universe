(function(root){
'use strict';
const O=root.OFU=root.OFU||{},VERSION='ofu-v1-world-webgl2-1',AUTHORITY='PRESENTATION_ONLY';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function resourceProfile({maxDpr=2,mobile=null,dpr=root.devicePixelRatio||1,viewportWidth=root.innerWidth||null}={}){
 const cap=Math.max(1,Number(maxDpr)||1),pixelRatio=Math.min(cap,Math.max(1,Number(dpr)||1));
 let isMobile;
 if(mobile===null||mobile===undefined){
  const width=Number(viewportWidth),narrow=Number.isFinite(width)&&width>0&&width<=700;
  const media=typeof root.matchMedia==='function'&&root.matchMedia('(max-width: 700px), (max-height: 520px) and (pointer: coarse)')?.matches;
  isMobile=Boolean(narrow||media);
 }else isMobile=Boolean(mobile);
 return freeze({mobile:isMobile,dpr:pixelRatio,memoryClass:'NORMAL',authority:'RUNTIME_ACCOUNTING',driverMemoryMeasured:false});
}
function pointAdmissionPlan(objects,limitObjects=Infinity){
 const rows=(Array.isArray(objects)?objects:[]).filter(o=>Number.isFinite(Number(o?.visual?.x)));
 const numericLimit=Number(limitObjects),cap=Number.isFinite(numericLimit)?Math.max(0,Math.floor(numericLimit)):rows.length;
 const admitted=rows.slice(0,cap);
 const selectedIndex=rows.findIndex(o=>o?.selectedPath===true||o?.selected===true);
 if(selectedIndex>=cap&&cap>0)admitted[cap-1]=rows[selectedIndex];
 const selectedPreserved=selectedIndex<0||(selectedIndex<cap)||(cap>0&&admitted.includes(rows[selectedIndex]));
 const cost=Object.freeze({bytes:admitted.length*32,objects:admitted.length,draws:admitted.length?1:0});
 return Object.freeze({rows:Object.freeze(admitted),totalObjects:rows.length,admittedObjects:admitted.length,culledObjects:Math.max(0,rows.length-admitted.length),selectedPreserved,cost});
}
function globeAdmissionCost(map){
 const mapBytes=map?.data?.byteLength??map?.data?.length??0;
 return Object.freeze({bytes:4096+Math.max(0,Math.floor(Number(mapBytes)||0)),objects:1,draws:1});
}
function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s)||'shader compile failed';gl.deleteShader(s);throw new Error(log)}return s}
function link(gl,vs,fs){const p=gl.createProgram();let a=null,b=null;try{a=compile(gl,gl.VERTEX_SHADER,vs);b=compile(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'program link failed');return p;}catch(error){gl.deleteProgram(p);throw error;}finally{if(a)gl.deleteShader(a);if(b)gl.deleteShader(b);}}
function create(canvas,{maxDpr=2,mobile=null}={}){
 if(!canvas?.getContext)throw new TypeError('canvas required');
 if(!O.v1WorldShaders)throw new Error('v1 world shaders required');
 let profile=resourceProfile({maxDpr,mobile}),budget=O.v1RenderBudget?.create(profile)||null,gl=null,point=null,globe=null,buffer=null,texture=null,textureKey=null,lost=false,last=null,frame=0,lastAdmission=null,surface=null,lastSurfaceKey=null;
 const metrics={frames:0,drawCalls:0,restores:0,resizes:0,profileChanges:0,resourceResets:0,admissionAttempts:0,admissionRejections:0,lodCulledObjects:0,maxLodCulledPerFrame:0,surfaceMapFallbacks:0,submittedObjects:0,surfacePlanChanges:0,surfaceConstraintEvents:0,maxSurfacePixels:0};
 function resetSharedResources(){
  if(!gl)return;
  if(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Uint8Array(0),gl.DYNAMIC_DRAW)}
  if(texture){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([80,100,120,255]));textureKey=null}
  metrics.resourceResets++;
 }
 function syncProfile(){
  const next=resourceProfile({maxDpr,mobile});
  if(next.mobile!==profile.mobile||next.dpr!==profile.dpr){
   budget?.clear('profile-change');
   profile=next;
   budget=O.v1RenderBudget?.create(profile)||null;
   resetSharedResources();
   metrics.profileChanges++;
  }
  return profile;
 }
 function admit(name,id,cost,priority){
  if(!budget)return Object.freeze({status:'UNMANAGED',name,id,cost});
  metrics.admissionAttempts++;
  const result=budget.request(name,id,cost,priority);
  if(result.status!=='ALLOCATED')metrics.admissionRejections++;
  return result;
 }
 function accepted(result){return result?.status==='ALLOCATED'||result?.status==='UNMANAGED'}
 function rememberAdmission(kind,result,details={}){lastAdmission=Object.freeze({kind,status:result?.status||'UNKNOWN',...details});return lastAdmission}
 function init(){
  gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false});
  if(!gl)throw new Error('WebGL2 unavailable');
  try{point=link(gl,O.v1WorldShaders.pointsVertex,O.v1WorldShaders.pointsFragment);globe=link(gl,O.v1WorldShaders.globeVertex,O.v1WorldShaders.globeFragment);}
  catch(error){if(point)gl.deleteProgram(point);if(globe)gl.deleteProgram(globe);point=globe=null;gl=null;throw error;}
  buffer=gl.createBuffer();texture=gl.createTexture();textureKey=null;
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([80,100,120,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);lost=false;
 }
 function resize(){
  const active=syncProfile(),cssWidth=Math.max(1,canvas.clientWidth||canvas.width||1),cssHeight=Math.max(1,canvas.clientHeight||canvas.height||1),plan=O.v1RenderBudget?.surfacePlan?.({cssWidth,cssHeight,dpr:active.dpr,mobile:active.mobile,maxDpr})||null,dpr=active.dpr,w=plan?.width??Math.max(1,Math.floor(cssWidth*dpr)),h=plan?.height??Math.max(1,Math.floor(cssHeight*dpr));
  surface=plan||Object.freeze({cssWidth,cssHeight,requestedDpr:dpr,effectiveDpr:dpr,width:w,height:h,pixels:w*h,pixelCeiling:null,maxDimension:null,constrained:false,modeledColorBytes:w*h*4,accounting:null});
  const key=[w,h,surface.effectiveDpr,surface.pixelCeiling].join(':');if(key!==lastSurfaceKey){metrics.surfacePlanChanges++;if(surface.constrained)metrics.surfaceConstraintEvents++;lastSurfaceKey=key;}metrics.maxSurfacePixels=Math.max(metrics.maxSurfacePixels,surface.pixels);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;metrics.resizes++}
  gl.viewport(0,0,w,h);
 }
 function drawPoints(scene){
  const plan=pointAdmissionPlan(scene.objects,budget?.limits?.COSMIC?.objects);
  if(!plan.totalObjects)return;
  metrics.lodCulledObjects+=plan.culledObjects;metrics.maxLodCulledPerFrame=Math.max(metrics.maxLodCulledPerFrame,plan.culledObjects);
  const admission=admit('COSMIC','shared-points-buffer',plan.cost,2);
  rememberAdmission('POINTS',admission,{scale:scene.scale,totalObjects:plan.totalObjects,admittedObjects:plan.admittedObjects,culledObjects:plan.culledObjects,selectedPreserved:plan.selectedPreserved,cost:plan.cost});
  if(!accepted(admission)||!plan.admittedObjects)return;
  const data=[];
  for(const o of plan.rows){const v=o.visual,c=v.color||[.72,.76,.84];data.push(Number(v.x),Number(v.y),Number(v.depth||.5),Number(c[0]),Number(c[1]),Number(c[2]),Number(v.opacity??1),Number(v.sizePx||v.radiusPx||10))}
  const a=new Float32Array(data);
  gl.useProgram(point);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW);
  for(const [name,size,offset] of [['a_position',3,0],['a_color',4,12],['a_size',1,28]]){const loc=gl.getAttribLocation(point,name);if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset)}}
  gl.drawArrays(gl.POINTS,0,plan.admittedObjects);metrics.drawCalls++;metrics.submittedObjects+=plan.admittedObjects;
 }
 function drawGlobe(scene){
  const o=scene.objects.find(x=>x.kind==='PLANET_GLOBE');if(!o)return;
  const v=o.visual,map=scene.surfaceTexture;
  if(map&&(map.width*map.height>16384||map.data.length!==map.width*map.height*4))throw new Error('Bounded world texture required');
  let activeMap=map||null,admission=admit('GLOBE','shared-globe-resource',globeAdmissionCost(activeMap),5);
  if(!accepted(admission)&&activeMap){metrics.surfaceMapFallbacks++;activeMap=null;admission=admit('GLOBE','shared-globe-resource',globeAdmissionCost(null),5)}
  rememberAdmission('GLOBE',admission,{scale:scene.scale,sourceId:scene.sourceId,surfaceMapRequested:!!map,surfaceMapAdmitted:!!activeMap,cost:globeAdmissionCost(activeMap)});
  if(!accepted(admission))return;
  gl.useProgram(globe);
  const set3=(n,x)=>gl.uniform3fv(gl.getUniformLocation(globe,n),new Float32Array(x)),set1=(n,x)=>gl.uniform1f(gl.getUniformLocation(globe,n),Number(x));
  set3('u_primary',v.primaryColor);set3('u_secondary',v.secondaryColor);set3('u_ocean',v.oceanColor);set3('u_ice',v.iceColor);set1('u_water',Number(v.waterAreaPpm||0)/1e6);set1('u_iceArea',Number(v.iceAreaPpm||0)/1e6);set1('u_atmosphere',v.atmosphereStrength||0);set1('u_relief',Number(v.reliefCuePpm||0)/1e6);set1('u_seed',v.seed||0);set1('u_aspect',canvas.width/canvas.height);set1('u_scale',scene.globeScale||.76);set1('u_yaw',scene.camera?.yaw||0);set1('u_pitch',scene.camera?.pitch||0);
  set1('u_hasSurfaceMap',activeMap?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(gl.getUniformLocation(globe,'u_surfaceMap'),0);
  if(activeMap&&textureKey!==activeMap.key){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,activeMap.width,activeMap.height,0,gl.RGBA,gl.UNSIGNED_BYTE,activeMap.data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textureKey=activeMap.key}
  gl.drawArrays(gl.TRIANGLES,0,6);metrics.drawCalls++;metrics.submittedObjects++;
 }
 function render(scene){
  if(lost)return{status:'CONTEXT_LOST'};
  if(!gl)init();last=scene;resize();metrics.frames++;frame++;
  gl.clearColor(.008,.014,.028,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  if(['PLANET','APPROACH'].includes(scene.scale))drawGlobe(scene);else drawPoints(scene);
  const error=gl.getError();if(error!==gl.NO_ERROR)throw new Error('WebGL draw error '+error);
  return{status:'RENDERED',frame,scale:scene.scale,authority:AUTHORITY,resourceProfile:profile,surface,admission:lastAdmission,measurements:{...metrics},budget:budget?.snapshot()||null};
 }
 function onLost(e){
  e?.preventDefault?.();lost=true;budget?.clear('context-lost');
  point=globe=buffer=texture=null;textureKey=null;gl=null;
 }
 function onRestored(){metrics.restores++;init();if(last)render(last)}
 canvas.addEventListener?.('webglcontextlost',onLost,false);canvas.addEventListener?.('webglcontextrestored',onRestored,false);
 function dispose(){canvas.removeEventListener?.('webglcontextlost',onLost,false);canvas.removeEventListener?.('webglcontextrestored',onRestored,false);budget?.clear('dispose');if(gl){if(point)gl.deleteProgram(point);if(globe)gl.deleteProgram(globe);if(buffer)gl.deleteBuffer(buffer);if(texture)gl.deleteTexture(texture)}gl=point=globe=buffer=texture=null;textureKey=null}
 function snapshot(){const live=!!(gl&&!lost);return Object.freeze({version:VERSION,authority:AUTHORITY,contextLost:lost,frame,allocatedPrograms:live?2:0,allocatedBuffers:live?1:0,allocatedTextures:live?1:0,resourceProfile:profile,surface,admission:lastAdmission,measurements:{...metrics},budget:budget?.snapshot()||null})}
 return Object.freeze({render,resize,dispose,snapshot});
}
O.v1WorldWebGL2=Object.freeze({VERSION,AUTHORITY,resourceProfile,pointAdmissionPlan,globeAdmissionCost,create});
})(globalThis);
