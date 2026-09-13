const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));

export function projectedSpanPixels({worldSpan,cameraDistance,verticalFovRadians,viewportHeightPx}){
  const span=Number(worldSpan),distance=Number(cameraDistance),fov=Number(verticalFovRadians),height=Number(viewportHeightPx);
  if(!(span>=0)||!(distance>0)||!(fov>0&&fov<Math.PI)||!(height>0))throw new TypeError('Screen-space LOD inputs must be finite and positive');
  return span/distance*(height/(2*Math.tan(fov/2)));
}

export function perceptualLod({projectedSpanPx,targetErrorPx=96,levels=[24,48,80]}){
  const span=Number(projectedSpanPx),error=Number(targetErrorPx),sorted=[...levels].map(Number).sort((a,b)=>a-b);
  if(!(span>=0)||!(error>0)||sorted.length<2||sorted.some(value=>!(value>0)))throw new TypeError('Invalid perceptual LOD budget');
  const required=span/error;
  if(required<=sorted[0])return Object.freeze({requiredSubdivisions:required,selected:sorted[0],weights:Object.freeze({coarse:1,medium:0,high:0}),screenSpaceDriven:true});
  if(required>=sorted.at(-1))return Object.freeze({requiredSubdivisions:required,selected:sorted.at(-1),weights:Object.freeze({coarse:0,medium:0,high:1}),screenSpaceDriven:true});
  const lowerIndex=sorted.findIndex((value,index)=>index<sorted.length-1&&required>=value&&required<sorted[index+1]),lower=sorted[lowerIndex],upper=sorted[lowerIndex+1],t=clamp01((required-lower)/(upper-lower));
  return Object.freeze({requiredSubdivisions:required,selected:t<.5?lower:upper,weights:Object.freeze(lowerIndex===0?{coarse:1-t,medium:t,high:0}:{coarse:0,medium:1-t,high:t}),screenSpaceDriven:true});
}
