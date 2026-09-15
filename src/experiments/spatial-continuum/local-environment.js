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
  if(typeof terrainSampler!=='function')throw new TypeError('Local environment requires the shared terrain sampler');const size=Number(cellSizeM),radius=Math.floor(Number(activeRadius)),limit=Math.floor(Number(maxInstances));if(!(size>0)||radius<1||limit<9)throw new RangeError('Invalid local environment bounds');
  const grammar=String(regime.localGrammar||'MIXED_LITHIC_FIELD'),process=processFor(grammar),density=clamp(Number(regime.localDensity||1),.35,1.8),axis=randomFactory(String(seed)+':field-axis')()*Math.PI*2,cache=new Map();let generations=0,evictions=0,lastWindow=null;
  const candidate=(rnd,cellX,cellZ)=>({eastM:(cellX+rnd())*size,northM:(cellZ+rnd())*size});
  const heightAt=point=>terrainSampler(point.eastM,point.northM),slopeAt=point=>Math.hypot(terrainSampler(point.eastM+1.5,point.northM)-terrainSampler(point.eastM-1.5,point.northM),terrainSampler(point.eastM,point.northM+1.5)-terrainSampler(point.eastM,point.northM-1.5));
  const cell=(cellX,cellZ)=>{
    const id=`local-cell:${cellX}:${cellZ}`,existing=cache.get(id);if(existing)return existing;const rnd=randomFactory(`${seed}:${id}:${grammar}`),count=Math.max(2,Math.round((3+rnd()*4)*density)),center={eastM:(cellX+.5)*size,northM:(cellZ+.5)*size},instances=[];
    for(let index=0;index<count;index++){
      let point;
      if(process==='DIRECTIONAL_FRACTURE_CLUSTER'){const along=(rnd()-.5)*size*1.34,across=(rnd()-.5)*size*.12;point={eastM:center.eastM+Math.cos(axis)*along-Math.sin(axis)*across,northM:center.northM+Math.sin(axis)*along+Math.cos(axis)*across}}
      else if(process==='RADIAL_EJECTA_CLUSTER'){const angle=rnd()*Math.PI*2,radial=size*(.13+rnd()*.36);point={eastM:center.eastM+Math.cos(angle)*radial,northM:center.northM+Math.sin(angle)*radial}}
      else if(process==='BASIN_DEPOSITION_CLUSTER'){const options=[candidate(rnd,cellX,cellZ),candidate(rnd,cellX,cellZ),candidate(rnd,cellX,cellZ)];point=options.sort((a,b)=>heightAt(a)-heightAt(b))[0]}
      else if(process==='SLOPE_EXPOSED_CLUSTER'){const options=[candidate(rnd,cellX,cellZ),candidate(rnd,cellX,cellZ),candidate(rnd,cellX,cellZ)];point=options.sort((a,b)=>slopeAt(b)-slopeAt(a))[0]}
      else point=candidate(rnd,cellX,cellZ);
      const tall=grammar==='ANGULAR_ICE_FRACTURE_FIELD',rounded=grammar==='ROUNDED_SEDIMENT_FIELD',ejecta=grammar==='ANGULAR_EJECTA_FIELD',base=tall?(.22+rnd()*.72):rounded?(.15+rnd()*.28):ejecta?(.12+rnd()*.5):(.16+rnd()*.56),vertical=tall?1.8+rnd()*3.8:grammar==='UPLIFTED_LITHIC_FIELD'?1.1+rnd()*2.3:rounded?(.45+rnd()*.36):(.65+rnd()*1.25);
      instances.push(Object.freeze({id:`${id}:feature:${index}`,cellId:id,eastM:point.eastM,northM:point.northM,heightM:heightAt(point),scale:Object.freeze([base*(tall ? .42 : rounded ? 1.35 : ejecta ? 1.45 : 1),base*vertical,base*(tall ? .26 : rounded ? 1 : ejecta ? .68 : 1)]),rotation:Object.freeze([(rnd()-.5)*(tall ? .24 : .9),rnd()*Math.PI*2,(rnd()-.5)*(tall ? .2 : .9)]),family:grammar,authority:'PRESENTATION_ONLY'}));
    }
    const value=Object.freeze({id,cellX,cellZ,process,instances:Object.freeze(instances),authority:'PRESENTATION_ONLY'});cache.set(id,value);generations++;return value;
  };
  const windowFor=(eastM,northM)=>{
    const centerX=Math.floor(Number(eastM)/size),centerZ=Math.floor(Number(northM)/size),cells=[];for(let z=centerZ-radius;z<=centerZ+radius;z++)for(let x=centerX-radius;x<=centerX+radius;x++)cells.push(cell(x,z));const activeIds=new Set(cells.map(item=>item.id));for(const id of [...cache.keys()])if(!activeIds.has(id)){cache.delete(id);evictions++}const candidates=cells.flatMap(item=>item.instances),instances=Object.freeze(candidates.slice(0,limit)),signature=`${centerX}:${centerZ}:${grammar}`;lastWindow=Object.freeze({contract:'ofu-r6-local-environment-window-1',centerCell:Object.freeze([centerX,centerZ]),cellSizeM:size,activeRadius:radius,activeCells:Object.freeze(cells.map(item=>item.id)),activeCellCount:cells.length,activeCellLimit:(radius*2+1)**2,instances,instanceCount:instances.length,instanceLimit:limit,grammar,process,bounded:cells.length<=(radius*2+1)**2&&instances.length<=limit,authority:'PRESENTATION_ONLY',signature});return lastWindow;
  };
  return Object.freeze({contract:'ofu-r6-local-environment-generator-1',grammar,process,cellSizeM:size,activeRadius:radius,maxInstances:limit,windowFor,snapshot:()=>Object.freeze({grammar,process,residentCells:cache.size,cellLimit:(radius*2+1)**2,generations,evictions,lastWindow,bounded:cache.size<=(radius*2+1)**2})});
}
