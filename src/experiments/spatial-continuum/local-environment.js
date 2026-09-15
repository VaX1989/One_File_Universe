import { classifyHumanDepth, createHumanPlaceGrammar } from './human-place-grammar.js';

const hash=value=>{let output=2166136261;for(const char of String(value)){output^=char.charCodeAt(0);output=Math.imul(output,16777619)}return output>>>0};
const randomFactory=seed=>{let value=hash(seed)||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296}};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

const processFor=grammar=>({
  ANGULAR_ICE_FRACTURE_FIELD:'DIRECTIONAL_FRACTURE_CLUSTER',
  UPLIFTED_LITHIC_FIELD:'SLOPE_EXPOSED_CLUSTER',
  ROUNDED_SEDIMENT_FIELD:'BASIN_DEPOSITION_CLUSTER',
  ANGULAR_EJECTA_FIELD:'RADIAL_EJECTA_CLUSTER',
  MIXED_LITHIC_FIELD:'SPARSE_JITTERED_FIELD'
}[grammar]||'SPARSE_JITTERED_FIELD');

export function createLocalEnvironmentGenerator({seed,terrainSampler,regime={},cellSizeM=32,activeRadius=2,maxInstances=120}={}){
  if(typeof terrainSampler!=='function')throw new TypeError('Local environment requires the shared terrain sampler');
  const size=Number(cellSizeM),radius=Math.floor(Number(activeRadius)),limit=Math.floor(Number(maxInstances));if(!(size>0)||radius<1||limit<9)throw new RangeError('Invalid local environment bounds');
  const grammar=String(regime.localGrammar||'MIXED_LITHIC_FIELD'),process=processFor(grammar),place=createHumanPlaceGrammar({seed,regime,terrainSampler,cellSizeM:size}),density=place.density,axis=place.axis,cache=new Map();let generations=0,evictions=0,lastWindow=null;
  const candidate=(rnd,cellX,cellZ)=>({eastM:(cellX+rnd())*size,northM:(cellZ+rnd())*size});
  const heightAt=point=>terrainSampler(point.eastM,point.northM),slopeAt=point=>Math.hypot(terrainSampler(point.eastM+1.5,point.northM)-terrainSampler(point.eastM-1.5,point.northM),terrainSampler(point.eastM,point.northM+1.5)-terrainSampler(point.eastM,point.northM-1.5));
  const compositionScore=(point,center)=>{
    const localEast=point.eastM-center.eastM,localNorth=point.northM-center.northM,voidDistance=Math.hypot(localEast-place.voidCenter[0],localNorth-place.voidCenter[1]),corridorDistance=Math.abs(localEast*place.corridorDirection[1]-localNorth*place.corridorDirection[0]),clusterDistance=Math.min(...place.clusterAnchors.map(anchor=>Math.hypot(localEast-anchor[0],localNorth-anchor[1]))),voidPenalty=voidDistance<place.voidRadiusM?2.4:0,corridorPenalty=corridorDistance<place.corridorWidthM?1.45:0,clusterReward=1/(1+clusterDistance/Math.max(1,size*.18));return clusterReward-voidPenalty-corridorPenalty;
  };
  const chooseComposed=(rnd,cellX,cellZ,center,mode)=>{
    const options=Array.from({length:5},()=>candidate(rnd,cellX,cellZ));
    if(mode==='BASIN')return options.sort((a,b)=>(heightAt(a)-heightAt(b))-(compositionScore(a,center)-compositionScore(b,center))*.35)[0];
    if(mode==='SLOPE')return options.sort((a,b)=>(slopeAt(b)-slopeAt(a))+(compositionScore(b,center)-compositionScore(a,center))*.45)[0];
    return options.sort((a,b)=>compositionScore(b,center)-compositionScore(a,center))[0];
  };
  const cell=(cellX,cellZ)=>{
    const id=`local-cell:${cellX}:${cellZ}`,existing=cache.get(id);if(existing)return existing;const rnd=randomFactory(`${seed}:${id}:${grammar}:place-v2`),count=Math.max(2,Math.round((3+rnd()*4)*density)),center={eastM:(cellX+.5)*size,northM:(cellZ+.5)*size},instances=[];
    for(let index=0;index<count;index++){
      let point;
      if(process==='DIRECTIONAL_FRACTURE_CLUSTER'){
        const anchor=place.clusterAnchors[index%place.clusterAnchors.length],along=(rnd()-.5)*size*.72,across=(rnd()-.5)*size*.075;point={eastM:center.eastM+anchor[0]+Math.cos(axis)*along-Math.sin(axis)*across,northM:center.northM+anchor[1]+Math.sin(axis)*along+Math.cos(axis)*across};
      }else if(process==='RADIAL_EJECTA_CLUSTER'){
        const anchor=place.clusterAnchors[index%place.clusterAnchors.length],angle=rnd()*Math.PI*2,radial=size*(.08+rnd()*.28);point={eastM:center.eastM+anchor[0]+Math.cos(angle)*radial,northM:center.northM+anchor[1]+Math.sin(angle)*radial};
      }else if(process==='BASIN_DEPOSITION_CLUSTER')point=chooseComposed(rnd,cellX,cellZ,center,'BASIN');
      else if(process==='SLOPE_EXPOSED_CLUSTER')point=chooseComposed(rnd,cellX,cellZ,center,'SLOPE');
      else point=chooseComposed(rnd,cellX,cellZ,center,'COMPOSED');
      const tall=grammar==='ANGULAR_ICE_FRACTURE_FIELD',rounded=grammar==='ROUNDED_SEDIMENT_FIELD',ejecta=grammar==='ANGULAR_EJECTA_FIELD',base=tall?(.22+rnd()*.72):rounded?(.15+rnd()*.28):ejecta?(.12+rnd()*.5):(.16+rnd()*.56),vertical=tall?1.8+rnd()*3.8:grammar==='UPLIFTED_LITHIC_FIELD'?1.1+rnd()*2.3:rounded?(.45+rnd()*.36):(.65+rnd()*1.25),landmark=index===0&&((cellX%3+3)%3===0)&&((cellZ%3+3)%3===0)&&rnd()<Math.min(1,place.landmarkChance*2.4),hierarchyScale=landmark?1.8+rnd()*.75:1,baseScale=Object.freeze([base*(tall?.42:rounded?1.35:ejecta?1.45:1)*hierarchyScale,base*vertical*hierarchyScale,base*(tall?.26:rounded?1:ejecta?.68:1)*hierarchyScale]);
      instances.push(Object.freeze({id:`${id}:feature:${index}`,cellId:id,eastM:point.eastM,northM:point.northM,heightM:heightAt(point),baseScale,scale:baseScale,rotation:Object.freeze([(rnd()-.5)*(tall?.24:.9),rnd()*Math.PI*2,(rnd()-.5)*(tall?.2:.9)]),family:grammar,depthBand:null,landmark,cluster:index%place.clusterAnchors.length,authority:'PRESENTATION_ONLY'}));
    }
    const value=Object.freeze({id,cellX,cellZ,process,instances:Object.freeze(instances),authority:'PRESENTATION_ONLY'});cache.set(id,value);generations++;return value;
  };
  const windowFor=(eastM,northM)=>{
    const centerX=Math.floor(Number(eastM)/size),centerZ=Math.floor(Number(northM)/size),cells=[];for(let z=centerZ-radius;z<=centerZ+radius;z++)for(let x=centerX-radius;x<=centerX+radius;x++)cells.push(cell(x,z));const activeIds=new Set(cells.map(item=>item.id));for(const id of [...cache.keys()])if(!activeIds.has(id)){cache.delete(id);evictions++}
    const centerEast=(centerX+.5)*size,centerNorth=(centerZ+.5)*size,project=item=>{const depthBand=classifyHumanDepth({eastM:item.eastM,northM:item.northM,centerEastM:centerEast,centerNorthM:centerNorth,cellSizeM:size}),depthScale=depthBand==='NEAR'?place.scaleBands.near:depthBand==='MID'?place.scaleBands.mid:place.scaleBands.far,baseScale=item.baseScale||item.scale;return Object.freeze({...item,scale:Object.freeze(baseScale.map(value=>value*depthScale)),depthBand})},candidates=cells.flatMap(item=>item.instances).map(project),landmarks=candidates.filter(item=>item.landmark).sort((a,b)=>Math.hypot(a.eastM-centerEast,a.northM-centerNorth)-Math.hypot(b.eastM-centerEast,b.northM-centerNorth)).slice(0,place.budgets.maxLandmarksPerWindow),landmarkIds=new Set(landmarks.map(item=>item.id)),ordered=[...landmarks,...candidates.filter(item=>!landmarkIds.has(item.id)).sort((a,b)=>{const rank={NEAR:0,MID:1,FAR:2};return rank[a.depthBand]-rank[b.depthBand]||a.id.localeCompare(b.id)})],instances=Object.freeze(ordered.slice(0,limit)),depthCounts=Object.freeze(instances.reduce((out,item)=>{out[item.depthBand]=(out[item.depthBand]||0)+1;return out},{})),signature=`${centerX}:${centerZ}:${grammar}:place-v3`;
    lastWindow=Object.freeze({contract:'ofu-r6-w0-human-local-environment-window-3',centerCell:Object.freeze([centerX,centerZ]),cellSizeM:size,activeRadius:radius,activeCells:Object.freeze(cells.map(item=>item.id)),activeCellCount:cells.length,activeCellLimit:(radius*2+1)**2,instances,instanceCount:instances.length,instanceLimit:limit,grammar,process,placeGrammar:place,depthCounts,landmarkCount:instances.filter(item=>item.landmark).length,bounded:cells.length<=(radius*2+1)**2&&instances.length<=limit,authority:'PRESENTATION_ONLY',signature});return lastWindow;
  };
  return Object.freeze({contract:'ofu-r6-w0-human-local-environment-generator-3',grammar,process,placeGrammar:place,cellSizeM:size,activeRadius:radius,maxInstances:limit,windowFor,snapshot:()=>Object.freeze({grammar,process,placeGrammar:place,residentCells:cache.size,cellLimit:(radius*2+1)**2,generations,evictions,lastWindow,bounded:cache.size<=(radius*2+1)**2})});
}
