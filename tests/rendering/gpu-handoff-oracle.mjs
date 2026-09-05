import assert from 'node:assert/strict';

// Real-browser state inspection, independent of the renderer's draw count.
// No synthetic framebuffer is used by this oracle.
export async function passStateEvidence(page) {
 const e=await page.evaluate(()=>{
  const P=__OFU_PLANET_PREVIEW__,canvas=document.getElementById('planet-view'),gl=canvas.getContext('webgl2');
  if(!gl)return{status:'NOT_MEASURABLE',reason:'WEBGL2_UNAVAILABLE'};
  const local=P.surfaceMode==='LOCAL',state=local?OFU.planetSurfaceWebGL2.stats(canvas):OFU.planetWebGL2.stateStats(canvas);
  return{status:'MEASURED',local,generation:state.generation,gpu:state.gpu,
   defaultArrayBound:gl.getParameter(gl.VERTEX_ARRAY_BINDING)===null,
   instanceAttributeEnabled:gl.getVertexAttrib(1,gl.VERTEX_ATTRIB_ARRAY_ENABLED),
   instanceDivisor:gl.getVertexAttrib(1,gl.VERTEX_ATTRIB_ARRAY_DIVISOR),error:gl.getError()};
 });
 if(e.status==='MEASURED'){
  assert.equal(e.error,0,'render handoff must leave no WebGL errors');
  assert.equal(e.defaultArrayBound,true,'render pass must release its private VAO');
  assert.equal(e.instanceAttributeEnabled,false,'instance attribute must never pollute the default VAO');
  assert.equal(e.instanceDivisor,0,'instance divisor must never pollute the default VAO');
  const v=e.gpu?.vertexArrays;
  assert.equal(v?.ownership,'RENDER_PASS_PRIVATE_VAO');assert.equal(v?.liveArrays,e.local?2:1);
  assert.equal(v?.lifecycleAccountingExact,true);assert.equal(e.gpu.lifecycleAccountingExact,true);
  if(e.local)assert.equal(e.gpu.microdetailLifecycleAccountingExact,true);
 }
 return e;
}

export async function localContextRecovery(page) {
 const e=await page.evaluate(async()=>{
  const P=__OFU_PLANET_PREVIEW__,W=OFU.planetSurfaceWebGL2,canvas=document.getElementById('planet-view'),gl=canvas.getContext('webgl2');
  if(!gl)return{status:'NOT_MEASURABLE',reason:'WEBGL2_UNAVAILABLE'};
  if(P.surfaceMode!=='LOCAL')throw new Error('surface context recovery requires active local scene');
  const ext=gl.getExtension('WEBGL_lose_context');
  if(!ext)return{status:'NOT_MEASURABLE',reason:'EXTENSION_UNAVAILABLE'};
  const before=W.stats(canvas),identity={planetId:P.provider.planetId,anchorToken:P.surfaceProvider.snapshot().camera.anchorToken};
  function event(name){return new Promise((resolve,reject)=>{
   const handler=()=>{clearTimeout(timer);resolve()},timer=setTimeout(()=>{canvas.removeEventListener(name,handler);reject(new Error('surface '+name+' event deadline exceeded'))},3000);
   canvas.addEventListener(name,handler,{once:true});
  })}
  const loss=event('webglcontextlost');ext.loseContext();await loss;
  const lost=W.stats(canvas);
  if(lost.gpu.vertexArrays.liveArrays!==0||lost.gpu.microdetailBuffers.live!==0)throw new Error('surface resources were not invalidated on context loss');
  const restoration=event('webglcontextrestored');await new Promise(resolve=>setTimeout(resolve,0));ext.restoreContext();await restoration;
  let after;
  for(let frame=0;frame<180;frame++){
   await new Promise(resolve=>requestAnimationFrame(resolve));
   after=W.render(canvas,P.surfaceTerrain,P.surfaceProvider.snapshot().camera,{provider:P.provider});
   if(after.backend==='webgl2-local-surface'&&after.generation>before.generation&&after.drawCalls>0)break;
  }
  if(after?.generation!==before.generation+1||after.glError!==0||after.drawCalls<1)throw new Error('fresh surface GPU generation did not render');
  if(after.contextLosses!==before.contextLosses+1||after.contextRestores!==before.contextRestores+1)throw new Error('surface context event accounting mismatch');
  if(after.gpu.vertexArrays.invalidated<before.gpu.vertexArrays.liveArrays||after.gpu.invalidatedBuffers<before.gpu.liveBuffers||after.gpu.microdetailBuffers.invalidated<2)throw new Error('surface resource invalidation accounting mismatch');
  if(P.provider.planetId!==identity.planetId||P.surfaceProvider.snapshot().camera.anchorToken!==identity.anchorToken)throw new Error('context recovery changed surface identity');
  return{status:'PASS',identity,before:{generation:before.generation,gpu:before.gpu},lost:{generation:lost.generation,gpu:lost.gpu},after:{generation:after.generation,gpu:after.gpu,drawCalls:after.drawCalls,glError:after.glError}};
 });
 if(e.status==='PASS')e.passState=await passStateEvidence(page);
 return e;
}
