const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)));
const normalize=vector=>{const length=Math.hypot(...vector);if(!(length>0))throw new TypeError('A non-zero direction is required');return Object.freeze(vector.map(value=>value/length))};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

export const CUBE_FACES=Object.freeze(['PX','NX','PY','NY','PZ','NZ']);

export function cubeFaceUvToDirection(face,u,v){
  const a=clamp(u,-1,1),b=clamp(v,-1,1),raw={PX:[1,b,-a],NX:[-1,b,a],PY:[a,1,-b],NY:[a,-1,b],PZ:[a,b,1],NZ:[-a,b,-1]}[String(face).toUpperCase()];
  if(!raw)throw new RangeError('Unknown cube-sphere face: '+face);return normalize(raw);
}

export function directionToCubeFaceUv(direction){
  const [x,y,z]=normalize(direction),ax=Math.abs(x),ay=Math.abs(y),az=Math.abs(z);let face,u,v;
  if(ax>=ay&&ax>=az){if(x>=0){face='PX';u=-z/ax;v=y/ax}else{face='NX';u=z/ax;v=y/ax}}
  else if(ay>=az){if(y>=0){face='PY';u=x/ay;v=-z/ay}else{face='NY';u=x/ay;v=z/ay}}
  else if(z>=0){face='PZ';u=x/az;v=y/az}else{face='NZ';u=-x/az;v=y/az}
  return Object.freeze({face,u,v,direction:Object.freeze([x,y,z])});
}

export function cubeSphereTileAddress(direction,level=0){
  const depth=Number(level);if(!Number.isInteger(depth)||depth<0||depth>26)throw new RangeError('Cube-sphere tile level must be an integer in [0,26]');
  const {face,u,v}=directionToCubeFaceUv(direction),side=2**depth,x=Math.min(side-1,Math.floor((u+1)*.5*side)),y=Math.min(side-1,Math.floor((v+1)*.5*side));
  return Object.freeze({contract:'ofu-cube-sphere-address-1',face,level:depth,x,y,id:`${face}:${depth}:${x}:${y}`});
}

export function cubeSphereTileCenter({face,level,x,y}){
  const side=2**Number(level),u=(Number(x)+.5)/side*2-1,v=(Number(y)+.5)/side*2-1;return cubeFaceUvToDirection(face,u,v);
}

export function cubeSphereTileUvBounds({face,level,x,y}){
  const depth=Number(level),tileX=Number(x),tileY=Number(y),side=2**depth;if(!CUBE_FACES.includes(String(face).toUpperCase())||!Number.isInteger(depth)||depth<0||depth>26||!Number.isInteger(tileX)||!Number.isInteger(tileY)||tileX<0||tileY<0||tileX>=side||tileY>=side)throw new TypeError('Invalid cube-sphere tile address');
  const span=2/side;return Object.freeze({face:String(face).toUpperCase(),level:depth,x:tileX,y:tileY,minU:-1+tileX*span,maxU:-1+(tileX+1)*span,minV:-1+tileY*span,maxV:-1+(tileY+1)*span});
}

export function modelCoordinatesFromDirection(direction){
  const [x,y,z]=normalize(direction),latitude=Math.asin(clamp(y,-1,1))*180/Math.PI,longitude=Math.atan2(z,x)*180/Math.PI;
  return Object.freeze({latMicroDeg:Math.round(latitude*1e6),lonMicroDeg:Math.round(longitude*1e6),bodyFixedUnit:Object.freeze([x,y,z]),authority:'MODEL_DERIVED',canonicalGeodesyClaim:false});
}

export function raySphereIntersection(origin,direction,{center=[0,0,0],radius=1}={}){
  const ray=normalize(direction),relative=origin.map((value,index)=>Number(value)-Number(center[index])),r=Number(radius),b=2*dot(relative,ray),c=dot(relative,relative)-r*r,discriminant=b*b-4*c;if(!(r>0)||!Number.isFinite(r))throw new TypeError('Sphere radius must be positive');if(discriminant<0)return null;
  const root=Math.sqrt(discriminant),near=(-b-root)/2,far=(-b+root)/2,distance=near>=0?near:far>=0?far:null;if(distance==null)return null;const point=relative.map((value,index)=>value+ray[index]*distance),unit=normalize(point);
  return Object.freeze({distance,point:Object.freeze(point.map((value,index)=>value+Number(center[index]))),bodyFixedUnit:unit,coordinates:modelCoordinatesFromDirection(unit)});
}

function patch(face,level,x,y,radiusM){
  const side=2**level,angularSpan=Math.PI/2/side,center=cubeSphereTileCenter({face,level,x,y});return Object.freeze({id:`${face}:${level}:${x}:${y}`,face,level,x,y,center,angularSpan,geometricErrorM:radiusM*angularSpan*.045});
}
const childPatches=(parent,radiusM)=>Object.freeze([[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>patch(parent.face,parent.level+1,parent.x*2+dx,parent.y*2+dy,radiusM)));

export function planetaryPatchPlan({cameraBodyFixedUnit=[1,0,0],cameraAltitudeM,radiusM,verticalFovRadians,viewportHeightPx,targetErrorPx=3,maxLevel=14,maxPatches=96}={}){
  const camera=normalize(cameraBodyFixedUnit),altitude=Math.max(.01,Number(cameraAltitudeM)),radius=Number(radiusM),fov=Number(verticalFovRadians),height=Number(viewportHeightPx),budget=Number(targetErrorPx),limit=Number(maxPatches),lastLevel=Number(maxLevel);
  if(!(radius>0)||!(fov>0&&fov<Math.PI)||!(height>0)||!(budget>0)||!Number.isInteger(limit)||limit<6||!Number.isInteger(lastLevel)||lastLevel<0)throw new TypeError('Invalid planetary patch budget');
  const focal=height/(2*Math.tan(fov/2)),active=[],culled=[],horizonAngle=Math.acos(clamp(radius/(radius+altitude),-1,1));
  const visible=item=>Math.acos(clamp(dot(camera,item.center),-1,1))<=horizonAngle+item.angularSpan*.82;
  const score=item=>item.geometricErrorM/Math.max(altitude,radius*Math.acos(clamp(dot(camera,item.center),-1,1)))*focal;
  for(const root of CUBE_FACES.map(face=>patch(face,0,0,0,radius)))(visible(root)?active:culled).push(root);
  while(active.length+3<=limit){let bestIndex=-1,bestScore=budget;for(let index=0;index<active.length;index++){const item=active[index],value=item.level<lastLevel&&visible(item)?score(item):-Infinity;if(value>bestScore){bestScore=value;bestIndex=index}}if(bestIndex<0)break;const [parent]=active.splice(bestIndex,1);for(const child of childPatches(parent,radius))(visible(child)?active:culled).push(child)}
  const levels=[...new Set(active.map(item=>item.level))].sort((a,b)=>a-b);return Object.freeze({contract:'ofu-planetary-cube-sphere-lod-1',topology:'CUBE_SPHERE',faces:6,activePatchCount:active.length,culledPatchCount:culled.length,maxPatches:limit,maxLevel:lastLevel,levels:Object.freeze(levels),mixedLod:levels.length>1,bounded:active.length<=limit,horizonCulled:culled.length>0,screenSpaceDriven:true,patches:Object.freeze(active)});
}

export function advanceSurfaceDirection(direction,east,north,{eastM=0,northM=0,radiusM}={}){
  const radius=Number(radiusM);if(!(radius>0))throw new TypeError('Body radius must be positive');const unit=normalize(direction),candidate=unit.map((value,index)=>value+(Number(eastM)*Number(east[index])+Number(northM)*Number(north[index]))/radius);return normalize(candidate);
}
