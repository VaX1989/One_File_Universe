import assert from 'node:assert/strict';

export function assertSurfaceResources({terrain:t,gpu:g}) {
  for(const k of ['activePatches','cpuMeshes','cpuBytes'])assert(Number.isSafeInteger(t[k])&&t[k]>=0,'invalid terrain counter '+k);
  for(const k of ['liveMeshes','liveBuffers','liveTrackedBytes','createdBuffers','deletedBuffers','invalidatedBuffers','microdetailBufferBytes','totalTrackedBytes'])assert(Number.isSafeInteger(g[k])&&g[k]>=0,'invalid GPU counter '+k);
  assert(t.activePatches>0&&t.activePatches<=25);assert(t.cpuMeshes<=64&&t.cpuBytes<=6*1024*1024);
  assert(g.liveMeshes<=32&&g.totalTrackedBytes<=6*1024*1024);assert.equal(g.valid,true);
  // The surface exposes raw registry counters, not the globe lifecycle wrapper.
  assert.equal(g.createdBuffers,g.deletedBuffers+g.invalidatedBuffers+g.liveBuffers,'surface registry buffer conservation');
  assert.equal(g.liveBuffers,g.liveMeshes*2,'two terrain buffers per live mesh');
  assert.equal(g.totalTrackedBytes,g.liveTrackedBytes+g.microdetailBufferBytes,'terrain plus microdetail allocation accounting');
}

/** Actual local-camera / local-renderer evidence. Never reuse the inactive globe
 * camera or the globe's spherical coverage mask to certify a surface frame. */
export async function localSurfaceEvidence(page, {requireWebGL = false, sampleFramebuffer = true, expectedBand = 'HUMAN'} = {}) {
  await page.waitForFunction(band => {
    const P=globalThis.__OFU_PLANET_PREVIEW__, S=P?.surfaceProvider?.snapshot();
    return P?.surfaceMode==='LOCAL' && S?.mode==='LOCAL' && S?.camera?.currentBand===band;
  }, expectedBand, {timeout:15000});
  const e=await page.evaluate(({requireWebGL,sampleFramebuffer})=>{
    const P=__OFU_PLANET_PREVIEW__, W=OFU.planetSurfaceWebGL2, canvas=document.getElementById('planet-view');
    const surface=P.surfaceProvider.snapshot(),camera=surface.camera;
    const common={owner:'surface-webgl',semanticScale:OFU.waveIVScaleRuntime.snapshot().semanticScale,
      planetId:P.provider.planetId,surfacePlanetId:surface.planetId,mode:P.surfaceMode,camera,claims:surface.claims};
    const gl=canvas.getContext('webgl2');
    if(!gl){if(requireWebGL)throw new Error('local surface WebGL2 required but unavailable');return{...common,framebuffer:{status:'NOT_MEASURABLE',reason:'WEBGL2_UNAVAILABLE'}};}
    const draw=W.render(canvas,P.surfaceTerrain,camera,{provider:P.provider,maxGpuMeshes:32,maxGpuBytes:6*1024*1024});
    if(draw.backend!=='webgl2-local-surface'||draw.glError!==0||draw.drawCalls<1)throw new Error('local surface render failed '+JSON.stringify(draw));
    const out={...common,drawCalls:draw.drawCalls,backend:draw.backend,glError:draw.glError,
      resources:{terrain:draw.terrain,gpu:draw.gpu},clip:draw.clip,coveragePlan:draw.coverage,
      framebuffer:{status:'NOT_SAMPLED',reason:'REPEATED_LIFECYCLE_RESOURCE_CHECK'}};
    if(!sampleFramebuffer)return out;
    const width=canvas.width,height=canvas.height,pixels=new Uint8Array(width*height*4);
    gl.finish();gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    if(gl.getError()!==gl.NO_ERROR)throw new Error('local surface readPixels failed');
    const clear=Array.from(gl.getParameter(gl.COLOR_CLEAR_VALUE)).map(v=>Math.round(v*255));
    const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>a.map((v,i)=>v-b[i]);
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
    // Independent CPU ray/triangle intersections against the actual uploaded mesh.
    // Reproduce only the declared vertex-coordinate transform, not GPU rasterization.
    const h=camera.headingRad,p=camera.pitchRad,forward=[Math.sin(h)*Math.cos(p),Math.cos(h)*Math.cos(p),Math.sin(p)];
    const right=norm(cross(forward,[0,0,1])),up=cross(right,forward),eye=camera.cameraRelativePositionM;
    const origin=camera.absolutePresentationPositionM.map((v,i)=>v-eye[i]),ref=draw.verticalDatum.referenceElevationM,scale=draw.presentationPolicy.elevationScale;
    const triangles=[];
    for(const [id,m] of P.surfaceTerrain.active){
      const V=m.vertices,I=m.indices,o=m.localOriginM,vertex=i=>[V[i*3]+o[0]-origin[0],V[i*3+1]+o[1]-origin[1],(V[i*3+2]-ref)*scale+o[2]-origin[2]];
      for(let i=0;i<I.length;i+=3){const a=vertex(I[i]),b=vertex(I[i+1]),c=vertex(I[i+2]);triangles.push({id,a,e1:sub(b,a),e2:sub(c,a)});}
    }
    const tanY=Math.tan(W.FOV/2),tanX=tanY*width/height,rows=[];
    let cpuHits=0,cpuHitClear=0;
    for(let gy=1;gy<=11;gy++)for(let gx=1;gx<=15;gx++){
      const x=Math.min(width-1,Math.floor(gx*width/16)),y=Math.min(height-1,Math.floor(gy*height/12));
      const nx=(2*(x+.5)/width-1)*tanX,ny=(2*(y+.5)/height-1)*tanY;
      const dir=norm(forward.map((v,i)=>v+right[i]*nx+up[i]*ny));let hit=null,nearest=Infinity;
      for(const t of triangles){
        const q=cross(dir,t.e2),det=dot(t.e1,q);if(det<=1e-9)continue;
        const a=sub(eye,t.a),u=dot(a,q)/det;if(u<1e-4||u>1-1e-4)continue;
        const r=cross(a,t.e1),v=dot(dir,r)/det;if(v<1e-4||u+v>1-1e-4)continue;
        const distance=dot(t.e2,r)/det,depth=distance*dot(dir,forward);
        if(depth>draw.clip.near*1.01&&depth<draw.clip.far*.99&&distance<nearest){nearest=distance;hit=t.id;}
      }
      if(hit){cpuHits++;const i=(y*width+x)*4,isClear=[0,1,2].every(k=>Math.abs(pixels[i+k]-clear[k])<=1);if(isClear)cpuHitClear++;rows.push({x,y,patchId:hit,distanceM:nearest,framebufferClear:isClear});}
    }
    return {...out,framebuffer:{status:'MEASURED',method:'LOCAL_ACTIVE_MESH_CPU_RAY_VS_FRAMEBUFFER',width,height,gridSamples:165,triangles:triangles.length,cpuHits,cpuHitClear,samples:rows}};
  }, {requireWebGL,sampleFramebuffer});
  assert.equal(e.mode,'LOCAL');assert.equal(e.camera.currentBand,expectedBand);
  assert.equal(e.semanticScale,expectedBand.toLowerCase());assert.equal(e.planetId,e.surfacePlanetId);
  for(const v of [...e.camera.absolutePresentationPositionM,...e.camera.cameraRelativePositionM,e.camera.headingRad,e.camera.pitchRad])assert(Number.isFinite(v),'local pose must be finite');
  assert(e.camera.presentationAltitudeM>=2);
  for(const claim of ['physicalTerrainElevationClaim','canonicalGeodesyClaim','geologyClaim','hydrologyClaim','vegetationClaim','biosphereClaim'])assert.equal(e.claims[claim],false);
  if(e.resources)assertSurfaceResources(e.resources);
  if(e.framebuffer.status==='MEASURED'){assert(e.framebuffer.cpuHits>=8,'local oracle must sample actual terrain: '+JSON.stringify(e.framebuffer));assert.equal(e.framebuffer.cpuHitClear,0,'local terrain is missing at independently confirmed visible mesh intersections: '+JSON.stringify(e.framebuffer));}
  return e;
}
