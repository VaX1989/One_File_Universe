const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export async function waitForSettledCamera(page,{timeoutMs=8000,distanceToleranceFraction=2e-5,directionToleranceRad=2e-5,stableFrames=4}={}){
 return await page.evaluate(async({timeoutMs,distanceToleranceFraction,directionToleranceRad,stableFrames})=>{
  const P=globalThis.__OFU_PLANET_PREVIEW__,C=globalThis.OFU?.planetRenderCore,F=globalThis.OFU?.planetFraming,N=globalThis.OFU?.v08ExploreNavigation;
  if(!P?.camera||!C||!F)throw new Error('settled-camera oracle requires active preview camera');
  const started=performance.now(),requestedDistance=P.camera.targetDistanceM,requestedDirection=[...P.camera.targetDirection];let consecutive=0,frames=0,last=null;
  const clampLocal=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  for(;;){
   await new Promise(resolve=>requestAnimationFrame(resolve));frames++;
   const snap=C.cameraSnapshot(P.camera),targetDistance=P.camera.targetDistanceM,targetDirection=P.camera.targetDirection,distanceError=Math.abs(snap.distanceM-targetDistance),distanceTolerance=Math.max(1,targetDistance*distanceToleranceFraction),directionError=Math.acos(clampLocal(dot(snap.direction,targetDirection),-1,1)),stable=distanceError<=distanceTolerance&&directionError<=directionToleranceRad&&!snap.penetratingPresentationGeometry;
   consecutive=stable?consecutive+1:0;last={snap,targetDistance,distanceError,distanceTolerance,directionError};
   if(consecutive>=stableFrames){
    const s=P.snapshot(),bounds=s.presentationBounds,viewport=s.viewport,aspect=viewport.cssWidth/Math.max(1,viewport.cssHeight),projection=bounds?F.projectedSphere({sphereRadiusM:bounds.maxRadiusM,distanceM:snap.distanceM,aspect,verticalFovDeg:F.VERTICAL_FOV_DEG}):null,clip=s.clip||C.dynamicClip(P.radius,snap.distanceM,bounds?.maxRadiusM||P.radius);
    return {requestedDistance,actualDistance:snap.distanceM,targetDistance,distanceError,directionError,settleFrames:frames,stableFrames:consecutive,settleDurationMs:performance.now()-started,scale:snap.scale,near:clip.near,far:clip.far,presentationMinRadius:bounds?.minRadiusM??null,presentationMaxRadius:bounds?.maxRadiusM??null,viewport,aspect,FOV:projection?{verticalDeg:projection.verticalFovDeg,horizontalDeg:projection.horizontalFovDeg}:null,productStage:N?.state?.stage||null,framing:N?.state?.framing||null,penetratingPresentationGeometry:snap.penetratingPresentationGeometry};
   }
   if(performance.now()-started>timeoutMs)throw new Error('camera did not settle within bounded timeout '+JSON.stringify({requestedDistance,actualDistance:last?.snap?.distanceM,targetDistance:last?.targetDistance,distanceError:last?.distanceError,directionError:last?.directionError,frames,timeoutMs}));
  }
 },{timeoutMs,distanceToleranceFraction,directionToleranceRad,stableFrames});
}

export async function projectionEvidence(page){
 return await page.evaluate(()=>{
  const P=__OFU_PLANET_PREVIEW__,F=OFU.planetFraming,N=OFU.v08ExploreNavigation,s=P.snapshot(),v=s.viewport,aspect=v.cssWidth/Math.max(1,v.cssHeight),projection=F.projectedSphere({sphereRadiusM:s.presentationBounds.maxRadiusM,distanceM:s.camera.distanceM,aspect,verticalFovDeg:F.VERTICAL_FOV_DEG});
  return {projectedBodyWidthFraction:projection.projectedBodyWidthFraction,projectedBodyHeightFraction:projection.projectedBodyHeightFraction,limitingOccupancy:projection.limitingOccupancy,fullLimbExpected:projection.fullLimbExpected,verticalFovDeg:projection.verticalFovDeg,horizontalFovDeg:projection.horizontalFovDeg,aspect,actualDistance:s.camera.distanceM,targetDistance:s.cameraTarget.distanceM,presentationRadiusM:s.presentationBounds.maxRadiusM,productStage:N?.state?.stage||null,viewport:v};
 });
}

export async function framebufferCoverage(page,{innerSphereNumericalContraction=0.999,clearTolerance=1,requireWebGL=false}={}){
 return await page.evaluate(({innerSphereNumericalContraction,clearTolerance,requireWebGL})=>{
  const P=__OFU_PLANET_PREVIEW__,C=OFU.planetRenderCore,F=OFU.planetFraming,G=OFU.planetWebGL2,canvas=document.getElementById('planet-view'),gl=canvas.getContext('webgl2');
  if(!gl){if(requireWebGL)throw new Error('WebGL2 framebuffer coverage oracle required but unavailable');return{applicable:false,reason:'WEBGL2_UNAVAILABLE',backend:P.backend};}
  const s=P.snapshot();if(s.plan?.coverageComplete!==true)throw new Error('framebuffer coverage oracle requires complete planned presentation coverage');
  const camera=C.cameraSnapshot(P.camera),draw=G.renderPortable(canvas,P.session,camera,{maxGpuMeshes:48,maxGpuBytes:8*1024*1024,fovDeg:F.VERTICAL_FOV_DEG});if(draw.backend!=='webgl2'||draw.glError!==0)throw new Error('coverage oracle could not establish clean WebGL2 frame '+JSON.stringify(draw));
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]);
  function originTriangleDistance(a,b,c){const p=[0,0,0],ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return len(a);const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return len(b);const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);return len(add(a,mul(ab,v)))}const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return len(c);const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return len(add(a,mul(ac,w)))}const va=d3*d6-d5*d4;if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const bc=sub(c,b),w=(d4-d3)/((d4-d3)+(d5-d6));return len(add(b,mul(bc,w)))}const denom=1/(va+vb+vc),v=vb*denom,w=vc*denom;return len(add(a,add(mul(ab,v),mul(ac,w))))}
  let minimumSurfaceTriangleRadiusM=Infinity,surfaceTriangles=0;for(const mesh of P.session.active.values()){const V=mesh.vertices,I=mesh.indices,o=mesh.localOrigin,baseIndexCount=Math.min(96,I.length);for(let k=0;k<baseIndexCount;k+=3){const pts=[];for(let q=0;q<3;q++){const j=I[k+q]*3;pts.push([V[j]+o[0],V[j+1]+o[1],V[j+2]+o[2]])}minimumSurfaceTriangleRadiusM=Math.min(minimumSurfaceTriangleRadiusM,originTriangleDistance(pts[0],pts[1],pts[2]));surfaceTriangles++}}
  if(!Number.isFinite(minimumSurfaceTriangleRadiusM)||surfaceTriangles<1)throw new Error('coverage oracle could not derive rendered surface bound');
  const nominalInnerRadiusM=s.presentationBounds.minRadiusM,triangulatedInnerRadiusM=Math.min(nominalInnerRadiusM,minimumSurfaceTriangleRadiusM),radius=triangulatedInnerRadiusM*innerSphereNumericalContraction;if(!(radius>0&&radius<camera.distanceM))throw new Error('invalid conservative triangulated coverage sphere');
  gl.finish();const width=canvas.width,height=canvas.height,pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const err=gl.getError();if(err!==gl.NO_ERROR)throw new Error('framebuffer readPixels failed '+err);
  const clear=Array.from(gl.getParameter(gl.COLOR_CLEAR_VALUE)).map(v=>Math.round(v*255)),ratio=radius/camera.distanceM,vfov=F.VERTICAL_FOV_DEG*Math.PI/180,aspect=width/height,tanY=Math.tan(vfov/2),tanX=tanY*aspect,tanLimit=ratio/Math.sqrt(1-ratio*ratio),tanLimit2=tanLimit*tanLimit,mask=new Uint8Array(width*height);let guaranteedPixels=0,clearGuaranteedPixels=0,minClearX=width,minClearY=height,maxClearX=-1,maxClearY=-1;
  const clearPixel=i=>Math.abs(pixels[i]-clear[0])<=clearTolerance&&Math.abs(pixels[i+1]-clear[1])<=clearTolerance&&Math.abs(pixels[i+2]-clear[2])<=clearTolerance;
  for(let y=0;y<height;y++){const ny=((2*(y+.5)/height)-1)*tanY;for(let x=0;x<width;x++){const nx=((2*(x+.5)/width)-1)*tanX;if(nx*nx+ny*ny>tanLimit2)continue;guaranteedPixels++;const p=(y*width+x)*4;if(clearPixel(p)){mask[y*width+x]=1;clearGuaranteedPixels++;minClearX=Math.min(minClearX,x);maxClearX=Math.max(maxClearX,x);minClearY=Math.min(minClearY,y);maxClearY=Math.max(maxClearY,y)}}}
  let components=0,largestConnectedClearRegion=0;if(clearGuaranteedPixels){const q=new Int32Array(clearGuaranteedPixels);for(let i=0;i<mask.length;i++)if(mask[i]){components++;let head=0,tail=0,size=0;q[tail++]=i;mask[i]=0;while(head<tail){const n=q[head++],x=n%width,y=Math.floor(n/width);size++;const ns=[x>0?n-1:-1,x+1<width?n+1:-1,y>0?n-width:-1,y+1<height?n+width:-1];for(const j of ns)if(j>=0&&mask[j]){mask[j]=0;q[tail++]=j}}largestConnectedClearRegion=Math.max(largestConnectedClearRegion,size)}}
  return {applicable:true,backend:draw.backend,width,height,innerSphereBasis:'MIN_OF_PRESENTATION_MIN_RADIUS_AND_RENDERED_SURFACE_TRIANGLE_DISTANCE',innerSphereNumericalContraction,nominalPresentationMinRadiusM:nominalInnerRadiusM,minimumSurfaceTriangleRadiusM,triangulatedInnerRadiusM,conservativeInnerRadiusM:radius,surfaceTriangles,guaranteedPixels,clearGuaranteedPixels,clearComponents:components,largestConnectedClearRegion,clearBounds:clearGuaranteedPixels?{minX:minClearX,minY:minClearY,maxX:maxClearX,maxY:maxClearY}:null,clearColorRgba8:clear,clearTolerance,drawCalls:draw.drawCalls,glError:draw.glError,actualDistance:camera.distanceM,targetDistance:P.camera.targetDistanceM,near:draw.clip.near,far:draw.clip.far,presentationMinRadiusM:s.presentationBounds.minRadiusM,presentationMaxRadiusM:s.presentationBounds.maxRadiusM,viewport:s.viewport};
 },{innerSphereNumericalContraction,clearTolerance,requireWebGL});
}

export function assertNoCoverageHoles(evidence,label='framebuffer'){
 if(!evidence.applicable)return;
 if(evidence.guaranteedPixels<1)throw new Error(label+' coverage oracle sampled no guaranteed-interior pixels');
 if(evidence.clearGuaranteedPixels!==0)throw new Error(label+' background holes inside guaranteed planet interior '+JSON.stringify(evidence));
}

export function assertApproachProjection(evidence,label='Approach'){
 if(!(evidence.limitingOccupancy>=0.65&&evidence.limitingOccupancy<=0.80)||evidence.fullLimbExpected!==true)throw new Error(label+' projection framing outside product acceptance '+JSON.stringify(evidence));
}

export function assertOrbitProjection(evidence,label='Orbit'){
 if(!(evidence.limitingOccupancy>=0.35&&evidence.limitingOccupancy<=0.60)||evidence.fullLimbExpected!==true)throw new Error(label+' projection framing lacks whole-world context '+JSON.stringify(evidence));
}
