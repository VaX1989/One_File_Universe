import { robustOutlierIndexes, summarizeDistribution, relativeGrowth } from './stats.mjs';
import { scorePerceptualDiversity } from './diversity.mjs';
import { canonicalJson, sha256 } from './canonical.mjs';
import { exactWitnessKey } from './sampling.mjs';
import { analyzeCrossProgramEvidence } from './cross-program.mjs';

const witnessOf=observation=>observation.witness||{};
const makeIssue=(category,observation,detail)=>({category,witness:{...witnessOf(observation)},detail});
const falseChecks=(object={})=>Object.entries(object).filter(([,value])=>value===false).map(([name])=>name);
export function validateObservation(observation,index=0){
  if(!observation||typeof observation!=='object')throw new Error(`observation ${index} must be an object`);
  const witness=witnessOf(observation);
  for(const field of ['address','seed','modelVersion'])if(typeof witness[field]!=='string'||!witness[field])throw new Error(`observation ${index} witness.${field} is required`);
  if(observation.descriptors!==undefined&&(!observation.descriptors||typeof observation.descriptors!=='object'||Array.isArray(observation.descriptors)))throw new Error(`observation ${index} descriptors must be an object`);
  return observation;
}
const addRobustOutliers=(issues,observations,path,category,zLimit)=>{const values=observations.map(observation=>path.split('.').reduce((value,key)=>value?.[key],observation));for(const outlier of robustOutlierIndexes(values,zLimit))issues.push(makeIssue(category,observations[outlier.index],{metric:path,value:outlier.value,robustZ:outlier.robustZ,median:outlier.median,mad:outlier.mad,zLimit}))};
const summarizeMetric=(observations,path)=>summarizeDistribution(observations.map(observation=>path.split('.').reduce((value,key)=>value?.[key],observation)).filter(Number.isFinite));
const summarizeResourceGrowth=(observations,budgets={})=>{
  const groups=new Map(); observations.forEach((observation,index)=>{if(!observation.resources)return;const key=observation.journeyKey||'default';if(!groups.has(key))groups.set(key,[]);groups.get(key).push({observation,index,sequence:Number.isFinite(observation.sequence)?observation.sequence:index})});
  const rows=[]; for(const [journeyKey,items] of groups){items.sort((a,b)=>a.sequence-b.sequence);const first=items[0].observation,last=items.at(-1).observation,metrics={};for(const key of [...new Set([...Object.keys(first.resources||{}),...Object.keys(last.resources||{})])].sort()){const start=first.resources?.[key],end=last.resources?.[key];if(Number.isFinite(start)&&Number.isFinite(end))metrics[key]={start,end,delta:end-start,relativeGrowth:relativeGrowth(start,end),budget:budgets[key]??null,violates:Number.isFinite(budgets[key])&&(end-start)>budgets[key]}}rows.push({journeyKey,firstWitness:witnessOf(first),lastWitness:witnessOf(last),metrics})} return rows;
};

export function analyzeObservations({campaignId='R6_G_UNNAMED',observations,calibration=null,config={}}){
  if(!Array.isArray(observations)||!observations.length)throw new Error('observations must be a non-empty array'); observations.forEach(validateObservation); const issues=[];
  for(const observation of observations){
    for(const failure of observation.failures||[])issues.push(makeIssue('generation_invariant_failure',observation,{failure}));
    for(const name of falseChecks(observation.checks))issues.push(makeIssue('generation_invariant_failure',observation,{check:name}));
    if(observation.representation?.blank===true)issues.push(makeIssue('blank_representation',observation,{representation:observation.representation}));
    if(observation.representation?.degenerate===true)issues.push(makeIssue('degenerate_representation',observation,{representation:observation.representation}));
    for(const name of falseChecks(observation.transition?.checks))issues.push(makeIssue(name.startsWith('lod')?'lod_transition_failure':'transition_continuity_failure',observation,{check:name}));
    if(observation.transition?.continuityPass===false)issues.push(makeIssue('transition_continuity_failure',observation,{metric:'continuityPass'}));
    if(observation.transition?.lodSeamPass===false)issues.push(makeIssue('lod_transition_failure',observation,{metric:'lodSeamPass'}));
    if(observation.transition?.lodPopPass===false)issues.push(makeIssue('lod_transition_failure',observation,{metric:'lodPopPass'}));
    if((observation.queue?.staleResultViolations||0)>0)issues.push(makeIssue('stale_result_violation',observation,{count:observation.queue.staleResultViolations}));
    if((observation.queue?.cancellationFailures||0)>0)issues.push(makeIssue('cancellation_failure',observation,{count:observation.queue.cancellationFailures}));
    if(observation.runtime?.directFilePass===false)issues.push(makeIssue('direct_file_violation',observation,{}));
    if((observation.runtime?.networkRequests||[]).length)issues.push(makeIssue('offline_violation',observation,{networkRequests:observation.runtime.networkRequests}));
    for(const [name,value] of Object.entries(observation.accessibility?.checks||{}))if(value===false)issues.push(makeIssue('accessibility_journey_failure',observation,{check:name}));
    if(observation.resourceGrowthViolation===true)issues.push(makeIssue('resource_growth_violation',observation,{source:'explicit_observation'}));
  }
  const zLimit=Number.isFinite(config.robustOutlierZ)?config.robustOutlierZ:4.5;
  for(const metric of ['visual.exposure','visual.luminance'])addRobustOutliers(issues,observations,metric,'lighting_exposure_outlier',zLimit);
  for(const metric of ['human.density','human.medianScale','human.horizonFraction'])addRobustOutliers(issues,observations,metric,'human_scale_density_horizon_anomaly',zLimit);
  const deterministicGroups=new Map(); for(const observation of observations){if(!observation.outputFingerprint)continue;const key=exactWitnessKey(witnessOf(observation));if(!deterministicGroups.has(key))deterministicGroups.set(key,new Set());deterministicGroups.get(key).add(String(observation.outputFingerprint))}
  for(const [key,outputs] of deterministicGroups)if(outputs.size>1){const observation=observations.find(item=>exactWitnessKey(witnessOf(item))===key);issues.push(makeIssue('determinism_violation',observation,{outputFingerprints:[...outputs].sort()}))}
  const resourceGrowth=summarizeResourceGrowth(observations,config.resourceDeltaBudgets||{}); for(const row of resourceGrowth)for(const [metric,value] of Object.entries(row.metrics))if(value.violates){const observation=observations.find(item=>exactWitnessKey(witnessOf(item))===exactWitnessKey(row.lastWitness));issues.push(makeIssue('resource_growth_violation',observation,{journeyKey:row.journeyKey,metric,...value}))}
  const provenanceRequired=config.provenanceRequired||['authorityClass','source']; const provenanceRows=observations.map(observation=>{const provenance=observation.provenance||{},missing=provenanceRequired.filter(key=>provenance[key]===undefined||provenance[key]===null||provenance[key]==='');return {witness:witnessOf(observation),present:provenanceRequired.length-missing.length,required:provenanceRequired.length,coverage:provenanceRequired.length?(provenanceRequired.length-missing.length)/provenanceRequired.length:1,missing}});
  if(config.failOnMissingProvenance)for(const row of provenanceRows.filter(row=>row.missing.length)){const observation=observations.find(item=>exactWitnessKey(witnessOf(item))===exactWitnessKey(row.witness));issues.push(makeIssue('provenance_coverage_failure',observation,{missing:row.missing}))}
  const descriptorSamples=observations.filter(observation=>observation.descriptors).map(observation=>({descriptors:observation.descriptors,imageEvidence:observation.imageEvidence,witness:witnessOf(observation)}));
  const diversity=calibration&&descriptorSamples.length>=2?scorePerceptualDiversity(descriptorSamples,calibration):null; const collapseWitnesses=diversity?.collapseWitnesses?.map(row=>({calibratedDistance:row.calibratedDistance,left:witnessOf(descriptorSamples[row.leftIndex]),right:witnessOf(descriptorSamples[row.rightIndex])}))||[];
  const performance={cpuUpdateMs:summarizeMetric(observations,'performance.cpuUpdateMs'),cpuRenderMs:summarizeMetric(observations,'performance.cpuRenderMs'),gpuFrameMs:summarizeDistribution(observations.filter(observation=>observation.performance?.gpuVerified===true).map(observation=>observation.performance?.gpuFrameMs).filter(Number.isFinite)),gpuEvidence:{verifiedSamples:observations.filter(observation=>observation.performance?.gpuVerified===true&&Number.isFinite(observation.performance?.gpuFrameMs)).length,unverifiedSamples:observations.filter(observation=>observation.performance&&observation.performance.gpuVerified!==true).length}};
  const crossProgram=analyzeCrossProgramEvidence(observations); issues.push(...crossProgram.issues);
  const issueCounts=Object.fromEntries([...issues.reduce((map,issue)=>map.set(issue.category,(map.get(issue.category)||0)+1),new Map())].sort(([a],[b])=>a.localeCompare(b)));
  const report={contract:'ofu.r6.quality-observatory.report.v1',campaignId:String(campaignId),status:issues.length?'FALSIFIED':'NO_FAILURE_WITNESSED',sampleCount:observations.length,witnessSetHash:sha256(observations.map(observation=>witnessOf(observation))),issueCount:issues.length,issueCounts,issues,crossProgram,diversity:diversity?{...diversity,collapseWitnesses}:null,performance,resourceGrowth,provenance:{required:provenanceRequired,meanCoverage:provenanceRows.reduce((sum,row)=>sum+row.coverage,0)/provenanceRows.length,minimumCoverage:Math.min(...provenanceRows.map(row=>row.coverage)),rows:provenanceRows},accessibility:{samplesWithEvidence:observations.filter(observation=>observation.accessibility).length,failedChecks:issues.filter(issue=>issue.category==='accessibility_journey_failure').length},offlineDirectFile:{networkViolationSamples:issues.filter(issue=>issue.category==='offline_violation').length,directFileViolationSamples:issues.filter(issue=>issue.category==='direct_file_violation').length},methodology:{failureSemantics:'OBSERVED_EXPLICIT_CHECKS_PLUS_CALIBRATED_ROBUST_OUTLIERS',robustOutlierZ:zLimit,diversityScalarMagicScore:false,imageSimilarityAuthority:false,thresholds:{resourceDeltaBudgets:config.resourceDeltaBudgets||{},diversityCollapse:'CALIBRATION_DERIVED_P95_REPETITIVE_ENVELOPE'}}};
  report.reportHash=sha256(canonicalJson({...report,reportHash:undefined})); return report;
}
