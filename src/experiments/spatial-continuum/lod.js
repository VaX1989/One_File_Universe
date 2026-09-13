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

export function terrainPatchPlan({projectedSpanPx,targetErrorPx=24,extent=34,baseSegments=14,maxLevel=2,maxPatches=16,previousLevel=null}){
  const span=Number(projectedSpanPx),error=Number(targetErrorPx),worldExtent=Number(extent),segments=Number(baseSegments),limit=Number(maxPatches);
  if(!(span>=0)||!(error>0)||!(worldExtent>0)||!Number.isInteger(segments)||segments<2||!Number.isInteger(maxLevel)||maxLevel<0||!Number.isInteger(limit)||limit<1)throw new TypeError('Invalid terrain patch budget');
  const requiredSegments=span/error,rawLevel=Math.max(0,Math.min(maxLevel,Math.ceil(Math.log2(Math.max(1,requiredSegments/segments))))),prior=Number(previousLevel),thresholdLevel=Number.isInteger(prior)?Math.max(0,Math.min(maxLevel,prior)):rawLevel;
  let level=rawLevel;
  if(Number.isInteger(prior)&&rawLevel!==thresholdLevel){const boundary=segments*2**Math.max(rawLevel,thresholdLevel);if(requiredSegments>boundary*.82&&requiredSegments<boundary*1.18)level=thresholdLevel;}
  let side=2**level;
  while(side*side>limit&&level>0){level--;side=2**level}
  const size=worldExtent/side,patches=[];
  for(let z=0;z<side;z++)for(let x=0;x<side;x++)patches.push(Object.freeze({id:`${level}:${x}:${z}`,level,x:-worldExtent/2+(x+.5)*size,z:-worldExtent/2+(z+.5)*size,size}));
  return Object.freeze({contract:'ofu-spatial-continuum-terrain-patch-plan-1',level,side,activePatchCount:patches.length,maxPatches:limit,patchSegments:segments,projectedSpanPx:span,targetErrorPx:error,requiredSegments,screenSpaceDriven:true,bounded:patches.length<=limit,patches:Object.freeze(patches)});
}
