import { clamp01, median, quantile, summarizeDistribution } from './stats.mjs';
import { canonicalJson, sha256 } from './canonical.mjs';

export const DEFAULT_DESCRIPTOR_DIMENSIONS = Object.freeze([
  'silhouetteTopography','horizonLandformProfile','spatialFrequencyRoughness','atmosphereSkyRegime','materialFamily','objectDensityClustering','scaleDistribution','palette','causalFingerprint','microstructureTopology'
]);

const scalarDistance=(a,b)=>{
  if(Number.isFinite(a)&&Number.isFinite(b))return clamp01(Math.abs(Number(a)-Number(b))/Math.max(1,Math.abs(Number(a)),Math.abs(Number(b))));
  return canonicalJson(a)===canonicalJson(b)?0:1;
};
const arrayDistance=(a,b)=>{
  if(a.every(Number.isFinite)&&b.every(Number.isFinite)){
    const length=Math.max(a.length,b.length); if(!length)return 0; let total=0;
    for(let index=0;index<length;index++)total+=index<a.length&&index<b.length?scalarDistance(a[index],b[index]):1;
    return total/length;
  }
  const left=new Set(a.map(value=>canonicalJson(value))),right=new Set(b.map(value=>canonicalJson(value))),union=new Set([...left,...right]);
  if(!union.size)return 0; let intersection=0; for(const value of left)if(right.has(value))intersection++;
  return 1-intersection/union.size;
};
const objectDistance=(a,b)=>{
  const keys=[...new Set([...Object.keys(a||{}),...Object.keys(b||{})])].sort(); if(!keys.length)return 0;
  return keys.reduce((sum,key)=>sum+valueDistance(a?.[key],b?.[key]),0)/keys.length;
};
export const valueDistance=(a,b)=>{
  if(a===undefined||a===null||b===undefined||b===null)return null;
  if(Array.isArray(a)&&Array.isArray(b))return arrayDistance(a,b);
  if(a&&b&&typeof a==='object'&&typeof b==='object')return objectDistance(a,b);
  return scalarDistance(a,b);
};
const pairs=samples=>{const out=[];for(let left=0;left<samples.length;left++)for(let right=left+1;right<samples.length;right++)out.push([samples[left],samples[right],left,right]);return out};
const descriptorOf=sample=>sample?.descriptors??sample;
export function rawPairDistance(left,right,dimensions=DEFAULT_DESCRIPTOR_DIMENSIONS){const a=descriptorOf(left),b=descriptorOf(right),components={};for(const dimension of dimensions)components[dimension]=valueDistance(a?.[dimension],b?.[dimension]);return components}

export function calibratePerceptualDiversity({repetitive,distinct,dimensions=DEFAULT_DESCRIPTOR_DIMENSIONS,label='unnamed-calibration'}){
  if(!Array.isArray(repetitive)||repetitive.length<3)throw new Error('repetitive baseline requires at least three samples');
  if(!Array.isArray(distinct)||distinct.length<3)throw new Error('distinct baseline requires at least three samples');
  const repetitivePairs=pairs(repetitive),distinctPairs=pairs(distinct),calibration={};
  for(const dimension of dimensions){
    const lowValues=repetitivePairs.map(([a,b])=>rawPairDistance(a,b,[dimension])[dimension]).filter(Number.isFinite);
    const highValues=distinctPairs.map(([a,b])=>rawPairDistance(a,b,[dimension])[dimension]).filter(Number.isFinite);
    const lowAnchor=median(lowValues),highAnchor=median(highValues),repetitiveEnvelopeRaw=quantile(lowValues,0.95),distinctFloorRaw=quantile(highValues,0.05);
    calibration[dimension]={calibrated:Number.isFinite(lowAnchor)&&Number.isFinite(highAnchor)&&highAnchor>lowAnchor+1e-12,lowAnchor,highAnchor,repetitiveEnvelopeRaw,distinctFloorRaw,baselineSeparation:Number.isFinite(distinctFloorRaw)&&Number.isFinite(repetitiveEnvelopeRaw)?distinctFloorRaw-repetitiveEnvelopeRaw:null,repetitive:summarizeDistribution(lowValues),distinct:summarizeDistribution(highValues)};
  }
  const calibratedDimensions=dimensions.filter(dimension=>calibration[dimension].calibrated);
  if(calibratedDimensions.length<2)throw new Error('calibration did not separate at least two descriptor dimensions');
  const normalize=(dimension,raw)=>{const {lowAnchor,highAnchor}=calibration[dimension];return Number.isFinite(raw)?clamp01((raw-lowAnchor)/(highAnchor-lowAnchor)):null};
  const aggregateForPair=(a,b)=>{const raw=rawPairDistance(a,b,calibratedDimensions),values=calibratedDimensions.map(dimension=>normalize(dimension,raw[dimension])).filter(Number.isFinite);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null};
  const repetitiveAggregate=repetitivePairs.map(([a,b])=>aggregateForPair(a,b)).filter(Number.isFinite),distinctAggregate=distinctPairs.map(([a,b])=>aggregateForPair(a,b)).filter(Number.isFinite);
  const collapseThreshold=quantile(repetitiveAggregate,0.95),distinctFloor=quantile(distinctAggregate,0.05);
  return {contract:'ofu.r6.quality-observatory.diversity-calibration.v1',label,dimensions:[...dimensions],calibratedDimensions,excludedDimensions:dimensions.filter(dimension=>!calibration[dimension].calibrated),anchors:calibration,aggregateBaseline:{collapseThreshold,distinctFloor,separated:Number.isFinite(collapseThreshold)&&Number.isFinite(distinctFloor)&&distinctFloor>collapseThreshold,repetitive:summarizeDistribution(repetitiveAggregate),distinct:summarizeDistribution(distinctAggregate)},methodology:{componentDistance:'TYPE_AWARE_NORMALIZED_DISTANCE',lowAnchor:'MEDIAN_REPETITIVE_PAIR_DISTANCE',highAnchor:'MEDIAN_DISTINCT_PAIR_DISTANCE',collapseEnvelope:'P95_REPETITIVE_CALIBRATED_PAIR_DISTANCE',distinctFloor:'P05_DISTINCT_CALIBRATED_PAIR_DISTANCE',aggregation:'EQUAL_CONTRIBUTION_ACROSS_CALIBRATED_SEMANTIC_DIMENSIONS',paletteRole:'ONE_COMPONENT_ONLY',imageSimilarityRole:'SUPPORTING_EVIDENCE_ONLY_NOT_SCORED'},baselineFingerprint:sha256({repetitive:repetitive.map(descriptorOf),distinct:distinct.map(descriptorOf),dimensions})};
}

export function scorePerceptualDiversity(samples,calibration){
  if(!Array.isArray(samples)||samples.length<2)return {contract:'ofu.r6.quality-observatory.perceptual-diversity.v1',sampleCount:samples?.length??0,score:{populationSpread:null,nearestNeighborDistinctness:null,templateCollapseRate:null,descriptorCoverage:0},components:{},collapseWitnesses:[]};
  const dimensions=calibration.calibratedDimensions||[],pairsList=pairs(samples),pairRows=[];
  for(const [left,right,leftIndex,rightIndex] of pairsList){
    const raw=rawPairDistance(left,right,dimensions),components={};
    for(const dimension of dimensions){const anchor=calibration.anchors[dimension];components[dimension]=Number.isFinite(raw[dimension])?clamp01((raw[dimension]-anchor.lowAnchor)/(anchor.highAnchor-anchor.lowAnchor)):null}
    const values=Object.values(components).filter(Number.isFinite),aggregate=values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null; pairRows.push({leftIndex,rightIndex,aggregate,components});
  }
  const aggregates=pairRows.map(row=>row.aggregate).filter(Number.isFinite),nearest=[];
  for(let index=0;index<samples.length;index++){const options=pairRows.filter(row=>row.leftIndex===index||row.rightIndex===index).map(row=>row.aggregate).filter(Number.isFinite);if(options.length)nearest.push(Math.min(...options))}
  const collapseThreshold=calibration.aggregateBaseline.collapseThreshold,collapsePairs=pairRows.filter(row=>Number.isFinite(row.aggregate)&&Number.isFinite(collapseThreshold)&&row.aggregate<=collapseThreshold),collapseMembers=new Set(collapsePairs.flatMap(row=>[row.leftIndex,row.rightIndex])),componentSummary={};
  for(const dimension of dimensions)componentSummary[dimension]=summarizeDistribution(pairRows.map(row=>row.components[dimension]).filter(Number.isFinite));
  const totalCells=pairRows.length*dimensions.length,presentCells=pairRows.reduce((count,row)=>count+Object.values(row.components).filter(Number.isFinite).length,0);
  return {contract:'ofu.r6.quality-observatory.perceptual-diversity.v1',sampleCount:samples.length,pairCount:pairRows.length,score:{populationSpread:median(aggregates),nearestNeighborDistinctness:median(nearest),templateCollapseRate:samples.length?collapseMembers.size/samples.length:null,descriptorCoverage:totalCells?presentCells/totalCells:0},baselines:{collapseThreshold,distinctFloor:calibration.aggregateBaseline.distinctFloor,separated:calibration.aggregateBaseline.separated},components:componentSummary,collapseWitnesses:collapsePairs.map(row=>({leftIndex:row.leftIndex,rightIndex:row.rightIndex,calibratedDistance:row.aggregate})),supportingImageEvidence:samples.map((sample,index)=>sample.imageEvidence?{index,...sample.imageEvidence}:null).filter(Boolean),pairRows};
}
