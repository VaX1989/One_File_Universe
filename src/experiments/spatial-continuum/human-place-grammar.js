const hash=value=>{let output=2166136261;for(const char of String(value)){output^=char.charCodeAt(0);output=Math.imul(output,16777619)}return output>>>0};
const randomFactory=seed=>{let value=hash(seed)||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296}};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const freezeVector=value=>Object.freeze(value.map(Number));

const FAMILY={
  ANGULAR_ICE_FRACTURE_FIELD:{clusterCount:3,voidRatio:.2,corridorWidth:.12,landmarkChance:.22,scale:[.72,1.05,1.55],roughness:.82,skyline:'SPIRE_RAKES'},
  UPLIFTED_LITHIC_FIELD:{clusterCount:4,voidRatio:.24,corridorWidth:.16,landmarkChance:.3,scale:[.82,1.2,1.72],roughness:.9,skyline:'RIDGE_SENTINELS'},
  ROUNDED_SEDIMENT_FIELD:{clusterCount:2,voidRatio:.34,corridorWidth:.22,landmarkChance:.12,scale:[.64,.88,1.18],roughness:.42,skyline:'LOW_BASIN_MOUNDS'},
  ANGULAR_EJECTA_FIELD:{clusterCount:3,voidRatio:.28,corridorWidth:.18,landmarkChance:.26,scale:[.76,1.08,1.48],roughness:.76,skyline:'RADIAL_MARKERS'},
  MIXED_LITHIC_FIELD:{clusterCount:3,voidRatio:.3,corridorWidth:.2,landmarkChance:.2,scale:[.7,1,1.36],roughness:.64,skyline:'BROKEN_LOW_RIDGE'}
};

export function createHumanPlaceGrammar({seed,regime={},terrainSampler,cellSizeM=32}={}){
  if(typeof terrainSampler!=='function')throw new TypeError('Human place grammar requires the shared terrain sampler');
  const size=Number(cellSizeM);if(!(size>0))throw new RangeError('Invalid HUMAN place cell size');
  const family=String(regime.localGrammar||'MIXED_LITHIC_FIELD'),base=FAMILY[family]||FAMILY.MIXED_LITHIC_FIELD,rnd=randomFactory(`${seed}:human-place:${family}`),axis=rnd()*Math.PI*2,secondaryAxis=axis+Math.PI*(.34+rnd()*.3),density=clamp(Number(regime.localDensity||1),.35,1.8),atmosphere=clamp(Number(regime.atmosphereStrength??regime.atmosphere??.45),0,1),cloud=clamp(Number(regime.cloudStrength??.2),0,1);
  const horizonDistance=size*6,horizon=[];
  for(let index=0;index<24;index++){
    const angle=index/24*Math.PI*2,east=Math.cos(angle)*horizonDistance,north=Math.sin(angle)*horizonDistance,height=Number(terrainSampler(east,north))||0;horizon.push(Object.freeze({angle,heightM:height,distanceM:horizonDistance}));
  }
  const heights=horizon.map(row=>row.heightM),minimum=Math.min(...heights),maximum=Math.max(...heights),relief=maximum-minimum;
  const clusterAnchors=Object.freeze(Array.from({length:base.clusterCount},(_,index)=>{
    const along=(index-(base.clusterCount-1)/2)*size*.24+(rnd()-.5)*size*.12,across=(rnd()-.5)*size*.34;
    return freezeVector([Math.cos(axis)*along-Math.sin(axis)*across,Math.sin(axis)*along+Math.cos(axis)*across]);
  }));
  const corridorDirection=freezeVector([Math.cos(secondaryAxis),Math.sin(secondaryAxis)]),voidCenter=freezeVector([(rnd()-.5)*size*.22,(rnd()-.5)*size*.22]);
  const scaleBands=Object.freeze({near:base.scale[0],mid:base.scale[1],far:base.scale[2]});
  const aerialPerspective=Object.freeze({strength:clamp(.18+atmosphere*.58+cloud*.18,0,1),nearM:size*1.2,midM:size*3.2,farM:size*6.5});
  return Object.freeze({
    contract:'ofu-r6-w0-human-place-grammar-1',authority:'PRESENTATION_ONLY',scientificLandformClaim:false,family,skyline:base.skyline,density,axis,secondaryAxis,clusterAnchors,voidCenter,voidRadiusM:size*base.voidRatio,corridorDirection,corridorWidthM:size*base.corridorWidth,landmarkChance:base.landmarkChance,roughness:base.roughness,scaleBands,aerialPerspective,horizon:Object.freeze({distanceM:horizonDistance,reliefM:relief,minHeightM:minimum,maxHeightM:maximum,samples:Object.freeze(horizon)}),camera:Object.freeze({eyeHeightM:1.68,referenceStrideM:.74,lookAheadM:size*.72}),budgets:Object.freeze({maxLandmarksPerWindow:5,maxClustersPerCell:base.clusterCount,adaptiveDensity:density})
  });
}

export function classifyHumanDepth({eastM,northM,centerEastM=0,centerNorthM=0,cellSizeM=32}={}){
  const distance=Math.hypot(Number(eastM)-Number(centerEastM),Number(northM)-Number(centerNorthM)),size=Number(cellSizeM)||32;
  return distance<size*1.35?'NEAR':distance<size*3.2?'MID':'FAR';
}
