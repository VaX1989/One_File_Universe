const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)));
const normalize=vector=>{const length=Math.hypot(...vector);if(!(length>0))throw new TypeError('A non-zero direction is required');return Object.freeze(vector.map(value=>value/length))};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

export const CUBE_FACES=Object.freeze(['PX','NX','PY','NY','PZ','NZ']);
export const CUBE_EDGES=Object.freeze(['WEST','EAST','SOUTH','NORTH']);

const rawCubeFaceUv=(face,u,v)=>{
  const raw={PX:[1,v,-u],NX:[-1,v,u],PY:[u,1,-v],NY:[u,-1,v],PZ:[u,v,1],NZ:[-u,v,-1]}[String(face).toUpperCase()];
  if(!raw)throw new RangeError('Unknown cube-sphere face: '+face);return raw;
};

export function cubeFaceUvToDirection(face,u,v){
  return normalize(rawCubeFaceUv(face,clamp(u,-1,1),clamp(v,-1,1)));
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

export function cubeSphereTileEdgeNeighbor(tile,edge){
  const bounds=cubeSphereTileUvBounds(tile),side=2**bounds.level,direction=String(edge).toUpperCase();if(!CUBE_EDGES.includes(direction))throw new RangeError('Unknown cube-sphere edge: '+edge);
  if(direction==='WEST'&&bounds.x>0)return cubeSphereTileAddress(cubeFaceUvToDirection(bounds.face,(bounds.minU+bounds.maxU)/2-(bounds.maxU-bounds.minU), (bounds.minV+bounds.maxV)/2),bounds.level);
  if(direction==='EAST'&&bounds.x<side-1)return cubeSphereTileAddress(cubeFaceUvToDirection(bounds.face,(bounds.minU+bounds.maxU)/2+(bounds.maxU-bounds.minU), (bounds.minV+bounds.maxV)/2),bounds.level);
  if(direction==='SOUTH'&&bounds.y>0)return cubeSphereTileAddress(cubeFaceUvToDirection(bounds.face,(bounds.minU+bounds.maxU)/2,(bounds.minV+bounds.maxV)/2-(bounds.maxV-bounds.minV)),bounds.level);
  if(direction==='NORTH'&&bounds.y<side-1)return cubeSphereTileAddress(cubeFaceUvToDirection(bounds.face,(bounds.minU+bounds.maxU)/2,(bounds.minV+bounds.maxV)/2+(bounds.maxV-bounds.minV)),bounds.level);
  const epsilon=(bounds.maxU-bounds.minU)*1e-4,u=direction==='WEST'?bounds.minU-epsilon:direction==='EAST'?bounds.maxU+epsilon:(bounds.minU+bounds.maxU)/2,v=direction==='SOUTH'?bounds.minV-epsilon:direction==='NORTH'?bounds.maxV+epsilon:(bounds.minV+bounds.maxV)/2;
  return cubeSphereTileAddress(normalize(rawCubeFaceUv(bounds.face,u,v)),bounds.level);
}

export function cubeSphereTileNeighbors(tile){
  return Object.freeze(CUBE_EDGES.map(edge=>Object.freeze({edge,...cubeSphereTileEdgeNeighbor(tile,edge)})));
}

export function sampledPlanetaryPatchError(tile,{radiusM,segments=12,heightAt,verticalExaggeration=1}={}){
  const radius=Number(radiusM),subdivisions=Number(segments),exaggeration=Number(verticalExaggeration),bounds=cubeSphereTileUvBounds(tile);if(!(radius>0)||!Number.isInteger(subdivisions)||subdivisions<2||typeof heightAt!=='function'||!(exaggeration>=0))throw new TypeError('Invalid content-aware planetary error inputs');
  const sample=(u,v)=>Number(heightAt(cubeFaceUvToDirection(bounds.face,u,v)))||0,values=Array.from({length:3},(_,y)=>Array.from({length:3},(_,x)=>sample(bounds.minU+(bounds.maxU-bounds.minU)*x/2,bounds.minV+(bounds.maxV-bounds.minV)*y/2))),corners=[values[0][0],values[0][2],values[2][0],values[2][2]];let residual=0;
  for(let y=0;y<3;y++)for(let x=0;x<3;x++){const tx=x/2,ty=y/2,interpolated=(corners[0]*(1-tx)+corners[1]*tx)*(1-ty)+(corners[2]*(1-tx)+corners[3]*tx)*ty;residual=Math.max(residual,Math.abs(values[y][x]-interpolated))}
  const angularSpan=Math.PI/2/2**bounds.level,chordError=radius*(1-Math.cos(angularSpan/(2*subdivisions))),geometricErrorM=Math.max(.01,chordError+residual*exaggeration);
  return Object.freeze({geometricErrorM,terrainResidualM:residual,sphericalChordErrorM:chordError,samples:9,contentAware:true,authority:'PRESENTATION_ONLY'});
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

function patch(face,level,x,y,radiusM,geometricErrorForPatch=null){
  const side=2**level,angularSpan=Math.PI/2/side,center=cubeSphereTileCenter({face,level,x,y}),base={id:`${face}:${level}:${x}:${y}`,face,level,x,y,center,angularSpan},measured=typeof geometricErrorForPatch==='function'?geometricErrorForPatch(Object.freeze(base)):null,value=Number(typeof measured==='object'?measured?.geometricErrorM:measured),fallback=radiusM*angularSpan*.045;
  return Object.freeze({...base,geometricErrorM:value>0&&Number.isFinite(value)?value:fallback,geometricErrorSource:value>0&&Number.isFinite(value)?'SAMPLED_TERRAIN_RESIDUAL_PLUS_SPHERE_CHORD':'ANGULAR_SPAN_FALLBACK',terrainResidualM:Number(measured?.terrainResidualM)||0,sphericalChordErrorM:Number(measured?.sphericalChordErrorM)||0});
}
const childPatches=(parent,radiusM,geometricErrorForPatch)=>Object.freeze([[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>patch(parent.face,parent.level+1,parent.x*2+dx,parent.y*2+dy,radiusM,geometricErrorForPatch)));

const coveringPatch=(active,address)=>active.filter(candidate=>candidate.face===address.face&&candidate.level<=address.level&&Math.floor(address.x/2**(address.level-candidate.level))===candidate.x&&Math.floor(address.y/2**(address.level-candidate.level))===candidate.y).sort((a,b)=>b.level-a.level)[0]||null;
const adjacencyStats=active=>{let maximumLevelDelta=0,crossFaceNeighborChecks=0,neighborChecks=0;for(const item of active)for(const neighbor of cubeSphereTileNeighbors(item)){const covering=coveringPatch(active,neighbor);if(!covering)continue;neighborChecks++;if(neighbor.face!==item.face)crossFaceNeighborChecks++;maximumLevelDelta=Math.max(maximumLevelDelta,item.level-covering.level)}return Object.freeze({maximumLevelDelta,crossFaceNeighborChecks,neighborChecks,neighborConstrained:maximumLevelDelta<=1})};

function balancePlanetaryLeaves(active,{radiusM,maxLevel,maxPatches,visible,geometricErrorForPatch}){
  const working=[...active],committedCulled=[];let refinements=0;
  for(let guard=0;guard<maxPatches*4;guard++){
    let coarse=null;for(const item of [...working].sort((a,b)=>b.level-a.level||a.id.localeCompare(b.id))){for(const neighbor of cubeSphereTileNeighbors(item)){const candidate=coveringPatch(working,neighbor);if(candidate&&item.level-candidate.level>1){coarse=candidate;break}}if(coarse)break}
    if(!coarse)return Object.freeze({success:true,active:working,culled:committedCulled,refinements,stats:adjacencyStats(working)});if(coarse.level>=maxLevel)return Object.freeze({success:false,active,culled:Object.freeze([]),refinements:0,stats:adjacencyStats(active)});
    const descendants=childPatches(coarse,radiusM,geometricErrorForPatch),next=descendants.filter(visible);if(!next.length||working.length-1+next.length>maxPatches)return Object.freeze({success:false,active,culled:Object.freeze([]),refinements:0,stats:adjacencyStats(active)});working.splice(working.findIndex(item=>item.id===coarse.id),1,...next);committedCulled.push(...descendants.filter(item=>!visible(item)));refinements++;
  }
  return Object.freeze({success:false,active,culled:Object.freeze([]),refinements:0,stats:adjacencyStats(active)});
}

export function planetaryPatchPlan({cameraBodyFixedUnit=[1,0,0],cameraAltitudeM,radiusM,verticalFovRadians,viewportHeightPx,targetErrorPx=3,maxLevel=14,maxPatches=96,geometricErrorForPatch=null}={}){
  const camera=normalize(cameraBodyFixedUnit),altitude=Math.max(.01,Number(cameraAltitudeM)),radius=Number(radiusM),fov=Number(verticalFovRadians),height=Number(viewportHeightPx),budget=Number(targetErrorPx),limit=Number(maxPatches),lastLevel=Number(maxLevel);
  if(!(radius>0)||!(fov>0&&fov<Math.PI)||!(height>0)||!(budget>0)||!Number.isInteger(limit)||limit<6||!Number.isInteger(lastLevel)||lastLevel<0)throw new TypeError('Invalid planetary patch budget');
  const focal=height/(2*Math.tan(fov/2)),culled=[],horizonAngle=Math.acos(clamp(radius/(radius+altitude),-1,1));let active=[];
  const visible=item=>Math.acos(clamp(dot(camera,item.center),-1,1))<=horizonAngle+item.angularSpan*.82;
  const score=item=>{const centerAngle=Math.acos(clamp(dot(camera,item.center),-1,1)),surfaceDistance=radius*Math.max(0,centerAngle-item.angularSpan*.9);return item.geometricErrorM/Math.max(altitude,surfaceDistance)*focal};
  for(const root of CUBE_FACES.map(face=>patch(face,0,0,0,radius,geometricErrorForPatch)))(visible(root)?active:culled).push(root);
  const blocked=new Set();let neighborBalanceRefinements=0;
  while(active.length+3<=limit){let bestIndex=-1,bestScore=budget;for(let index=0;index<active.length;index++){const item=active[index],value=item.level<lastLevel&&visible(item)&&!blocked.has(item.id)?score(item):-Infinity;if(value>bestScore){bestScore=value;bestIndex=index}}if(bestIndex<0)break;const parent=active[bestIndex],descendants=childPatches(parent,radius,geometricErrorForPatch),visibleChildren=descendants.filter(visible),trial=[...active.slice(0,bestIndex),...visibleChildren,...active.slice(bestIndex+1)];if(!visibleChildren.length||trial.length>limit){blocked.add(parent.id);continue}const balanced=balancePlanetaryLeaves(trial,{radiusM:radius,maxLevel:lastLevel,maxPatches:limit,visible,geometricErrorForPatch});if(!balanced.success){blocked.add(parent.id);continue}active=[...balanced.active];culled.push(...descendants.filter(item=>!visible(item)),...balanced.culled);neighborBalanceRefinements+=balanced.refinements}
  active.sort((a,b)=>a.face.localeCompare(b.face)||a.level-b.level||a.y-b.y||a.x-b.x);const levels=[...new Set(active.map(item=>item.level))].sort((a,b)=>a-b),adjacency=adjacencyStats(active),errors=active.map(item=>item.geometricErrorM),residuals=active.map(item=>item.terrainResidualM);return Object.freeze({contract:'ofu-planetary-cube-sphere-lod-2',topology:'CUBE_SPHERE',faces:6,activePatchCount:active.length,culledPatchCount:culled.length,maxPatches:limit,maxLevel:lastLevel,levels:Object.freeze(levels),mixedLod:levels.length>1,bounded:active.length<=limit,horizonCulled:culled.length>0,screenSpaceDriven:true,contentAwareError:typeof geometricErrorForPatch==='function',maximumGeometricErrorM:errors.length?Math.max(...errors):0,maximumTerrainResidualM:residuals.length?Math.max(...residuals):0,neighborLevelDelta:adjacency.maximumLevelDelta,neighborConstrained:adjacency.neighborConstrained,neighborChecks:adjacency.neighborChecks,crossFaceNeighborChecks:adjacency.crossFaceNeighborChecks,neighborBalanceRefinements,patches:Object.freeze(active)});
}

export function advanceSurfaceDirection(direction,east,north,{eastM=0,northM=0,radiusM}={}){
  const radius=Number(radiusM);if(!(radius>0))throw new TypeError('Body radius must be positive');const unit=normalize(direction),candidate=unit.map((value,index)=>value+(Number(eastM)*Number(east[index])+Number(northM)*Number(north[index]))/radius);return normalize(candidate);
}
