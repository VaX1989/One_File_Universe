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

const patch=(level,x,z,rootExtentM)=>{
  const side=2**level,sizeM=rootExtentM/side,minEastM=-rootExtentM/2+x*sizeM,minNorthM=-rootExtentM/2+z*sizeM;
  return Object.freeze({id:`${level}:${x}:${z}`,level,x,z,sizeM,minEastM,minNorthM,centerEastM:minEastM+sizeM/2,centerNorthM:minNorthM+sizeM/2,geometricErrorM:Math.max(.15,sizeM*.045)});
};
const children=(item,rootExtentM)=>Object.freeze([[0,0],[1,0],[0,1],[1,1]].map(([dx,dz])=>patch(item.level+1,item.x*2+dx,item.z*2+dz,rootExtentM)));
const distanceToPatch=(item,east,north,altitude)=>{
  const half=item.sizeM/2,dx=Math.max(0,Math.abs(east-item.centerEastM)-half),dz=Math.max(0,Math.abs(north-item.centerNorthM)-half);
  return Math.max(.01,Math.hypot(dx,dz,Math.max(.01,altitude)));
};

export function sparseTerrainPatchPlan({cameraEastM=0,cameraNorthM=0,cameraAltitudeM,verticalFovRadians,viewportHeightPx,viewportWidthPx=viewportHeightPx,rootExtentM=1048576,baseSegments=12,targetErrorPx=3,maxLevel=16,maxPatches=48,cullRadiusM=null}={}){
  const east=Number(cameraEastM),north=Number(cameraNorthM),altitude=Math.max(.01,Number(cameraAltitudeM)),fov=Number(verticalFovRadians),height=Number(viewportHeightPx),width=Number(viewportWidthPx),extent=Number(rootExtentM),segments=Number(baseSegments),limit=Number(maxPatches),lastLevel=Number(maxLevel),errorBudget=Number(targetErrorPx);
  if(![east,north,altitude,fov,height,width,extent,segments,limit,lastLevel,errorBudget].every(Number.isFinite)||!(fov>0&&fov<Math.PI)||height<=0||width<=0||extent<=0||!Number.isInteger(segments)||segments<2||!Number.isInteger(limit)||limit<1||!Number.isInteger(lastLevel)||lastLevel<0||errorBudget<=0)throw new TypeError('Invalid sparse terrain LOD inputs');
  const focalPixels=height/(2*Math.tan(fov/2)),aspect=width/height,visibleRadius=cullRadiusM!=null&&Number.isFinite(Number(cullRadiusM))?Number(cullRadiusM):Math.max(100,altitude*2.4,altitude*Math.tan(fov/2)*Math.max(2,aspect*2.4)),active=[patch(0,0,0,extent)],culled=[],blocked=new Set();
  const score=item=>item.geometricErrorM/distanceToPatch(item,east,north,altitude)*focalPixels;
  const visible=item=>{const half=item.sizeM/2,dx=Math.max(0,Math.abs(item.centerEastM-east)-half),dz=Math.max(0,Math.abs(item.centerNorthM-north)-half);return Math.hypot(dx,dz)<=visibleRadius};
  while(active.length+3<=limit){
    let index=-1,best=errorBudget;
    for(let i=0;i<active.length;i++){const item=active[i],value=item.level<lastLevel&&visible(item)&&!blocked.has(item.id)?score(item):-Infinity;if(value>best){best=value;index=i}}
    if(index<0)break;
    const [parent]=active.splice(index,1),next=children(parent,extent);
    const visibleChildren=next.filter(visible);for(const child of next)(visible(child)?active:culled).push(child);
    if(!visibleChildren.length){active.push(parent);blocked.add(parent.id)}
  }
  active.sort((a,b)=>a.level-b.level||a.z-b.z||a.x-b.x);
  const levels=[...new Set(active.map(item=>item.level))],screenSpaceErrors=active.map(score);
  return Object.freeze({
    contract:'ofu-spatial-continuum-sparse-terrain-plan-1',coordinateUnit:'METRE',rootExtentM:extent,patchSegments:segments,targetErrorPx:errorBudget,maxLevel:lastLevel,maxPatches:limit,
    activePatchCount:active.length,culledPatchCount:culled.length,levels:Object.freeze(levels),mixedLod:levels.length>1,bounded:active.length<=limit,screenSpaceDriven:true,viewCulled:culled.length>0,
    maximumSelectedErrorPx:screenSpaceErrors.length?Math.max(...screenSpaceErrors):0,patches:Object.freeze(active)
  });
}
