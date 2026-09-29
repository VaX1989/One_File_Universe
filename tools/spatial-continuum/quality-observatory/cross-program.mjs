import { canonicalJson, sha256 } from './canonical.mjs';
import { exactWitnessKey } from './sampling.mjs';
import { summarizeDistribution } from './stats.mjs';

export const CROSS_PROGRAM_EVIDENCE_CLASSES = Object.freeze(['MEASURED','HEURISTIC','PRESENTATION_ONLY']);

export const CROSS_PROGRAM_CAPABILITIES = Object.freeze({
  product:Object.freeze(['allScaleContinuity','causalConsequenceCoverage','atlasExactReturn','browserDeviceEvidence']),
  platform:Object.freeze(['crossLanguageParity','abiVersionRegression','queryLatency','cacheMaterializationBounds','providerConformance','persistenceRecovery','securityFuzz'])
});

const EVIDENCE_CLASS_SET=new Set(CROSS_PROGRAM_EVIDENCE_CLASSES);
const witnessOf=observation=>observation?.witness||{};
const metricId=(domain,name)=>`${domain}.${name}`;
const evidenceOf=(observation,domain,name)=>observation?.crossProgram?.[domain]?.[name];
const capabilityDeclared=(observation,domain,name)=>observation?.crossProgram?.capabilityPresence?.[domain]?.[name]===true;
const evidenceClassOf=evidence=>EVIDENCE_CLASS_SET.has(evidence?.evidenceClass)?evidence.evidenceClass:'UNCLASSIFIED';
const countBy=values=>Object.fromEntries([...values.reduce((map,value)=>map.set(value,(map.get(value)||0)+1),new Map())].sort(([a],[b])=>String(a).localeCompare(String(b))));
const uniqueSorted=values=>[...new Set(values.filter(value=>value!==undefined&&value!==null&&String(value).length).map(String))].sort();
const boolFailure=(evidence,field)=>evidence?.[field]===false;
const mismatch=(left,right)=>typeof left==='string'&&left.length&&typeof right==='string'&&right.length&&left!==right;

const SPECS=Object.freeze([
  {domain:'product',name:'allScaleContinuity',issueCategory:'all_scale_continuity_failure',failure:evidence=>boolFailure(evidence,'pass'),numeric:{maxNormalizedDelta:'maxNormalizedDelta'}},
  {domain:'product',name:'causalConsequenceCoverage',issueCategory:'causal_consequence_coverage_failure',failure:evidence=>boolFailure(evidence,'pass')||(Number.isFinite(evidence?.expectedCount)&&Number.isFinite(evidence?.observedCount)&&evidence.observedCount<evidence.expectedCount),numeric:{expectedCount:'expectedCount',observedCount:'observedCount'}},
  {domain:'product',name:'atlasExactReturn',issueCategory:'atlas_exact_return_failure',failure:evidence=>boolFailure(evidence,'exactReturnPass')||mismatch(evidence?.savedContextHash,evidence?.returnedContextHash),numeric:{}},
  {domain:'product',name:'browserDeviceEvidence',issueCategory:'browser_device_failure',failure:evidence=>boolFailure(evidence,'pass'),numeric:{}},
  {domain:'platform',name:'crossLanguageParity',issueCategory:'cross_language_parity_failure',failure:evidence=>['byteParityPass','digestParityPass','rejectionParityPass'].some(field=>boolFailure(evidence,field)),numeric:{}},
  {domain:'platform',name:'abiVersionRegression',issueCategory:'abi_version_regression',failure:evidence=>boolFailure(evidence,'compatiblePass'),numeric:{}},
  {domain:'platform',name:'queryLatency',issueCategory:'query_latency_budget_failure',failure:evidence=>boolFailure(evidence,'withinDeclaredBudget'),numeric:{latencyMs:'latencyMs',budgetMs:'budgetMs'}},
  {domain:'platform',name:'cacheMaterializationBounds',issueCategory:'cache_materialization_bound_failure',failure:evidence=>boolFailure(evidence,'withinBoundsPass'),numeric:{cacheBytes:'cacheBytes',materializationBytes:'materializationBytes'}},
  {domain:'platform',name:'providerConformance',issueCategory:'provider_conformance_failure',failure:evidence=>boolFailure(evidence,'conformancePass'),numeric:{}},
  {domain:'platform',name:'persistenceRecovery',issueCategory:'persistence_recovery_failure',failure:evidence=>boolFailure(evidence,'recoveryPass'),numeric:{recoveryMs:'recoveryMs'}},
  {domain:'platform',name:'securityFuzz',issueCategory:'security_fuzz_failure',failure:evidence=>boolFailure(evidence,'fuzzPass'),numeric:{cases:'cases'}}
]);

const rowSort=(left,right)=>left.metricId.localeCompare(right.metricId)||exactWitnessKey(left.witness).localeCompare(exactWitnessKey(right.witness));

function metricSummary(spec,rows){
  const numeric={};
  for(const [label,field] of Object.entries(spec.numeric||{}))numeric[label]=summarizeDistribution(rows.map(row=>row.evidence?.[field]).filter(Number.isFinite));
  const summary={
    metricId:metricId(spec.domain,spec.name),
    domain:spec.domain,
    capabilityDeclaredSamples:rows.length,
    evidenceSamples:rows.filter(row=>row.evidencePresent).length,
    evidenceClassifications:countBy(rows.filter(row=>row.evidencePresent).map(row=>row.evidenceClass)),
    failureWitnesses:rows.filter(row=>row.failed).length,
    numeric
  };
  if(spec.name==='causalConsequenceCoverage'){
    const coverage=rows.map(row=>{
      const expected=row.evidence?.expectedCount,observed=row.evidence?.observedCount;
      if(!Number.isFinite(expected)||!Number.isFinite(observed))return null;
      if(expected===0)return 1;
      return Math.max(0,Math.min(1,observed/expected));
    }).filter(Number.isFinite);
    summary.numeric.coverage=summarizeDistribution(coverage);
  }
  if(spec.name==='browserDeviceEvidence'){
    summary.browsers=uniqueSorted(rows.map(row=>row.evidence?.browser));
    summary.deviceClasses=uniqueSorted(rows.map(row=>row.evidence?.deviceClass));
  }
  if(spec.name==='abiVersionRegression')summary.versions=uniqueSorted(rows.map(row=>row.evidence?.version));
  return summary;
}

export function analyzeCrossProgramEvidence(observations){
  const issues=[],stagedEvidence=[],missingEvidence=[],metrics={};
  const declaredCapabilities=new Set();
  const rowsForHash=[];
  for(const spec of SPECS){
    const id=metricId(spec.domain,spec.name),rows=[];
    for(const observation of observations){
      const declared=capabilityDeclared(observation,spec.domain,spec.name);
      const evidence=evidenceOf(observation,spec.domain,spec.name);
      if(!declared){
        if(evidence!==undefined)stagedEvidence.push({metricId:id,witness:{...witnessOf(observation)},status:'IGNORED_UNTIL_CAPABILITY_DECLARED'});
        continue;
      }
      declaredCapabilities.add(id);
      if(evidence===undefined||evidence===null){
        missingEvidence.push({metricId:id,witness:{...witnessOf(observation)},status:'DECLARED_CAPABILITY_WITHOUT_EVIDENCE'});
        rows.push({metricId:id,witness:{...witnessOf(observation)},evidencePresent:false,evidenceClass:'UNCLASSIFIED',evidence:null,failed:false});
        continue;
      }
      const evidenceClass=evidenceClassOf(evidence);
      if(evidenceClass==='UNCLASSIFIED')issues.push({category:'metric_evidence_classification_missing',witness:{...witnessOf(observation)},detail:{metricId:id,required:CROSS_PROGRAM_EVIDENCE_CLASSES}});
      const failed=Boolean(spec.failure(evidence));
      if(failed)issues.push({category:spec.issueCategory,witness:{...witnessOf(observation)},detail:{metricId:id,evidenceClass,scope:'QUALITY_EVIDENCE_ONLY'}});
      rows.push({metricId:id,witness:{...witnessOf(observation)},evidencePresent:true,evidenceClass,evidence,failed});
    }
    rows.sort(rowSort);
    rowsForHash.push(...rows.map(row=>({metricId:row.metricId,witness:row.witness,evidencePresent:row.evidencePresent,evidenceClass:row.evidenceClass,evidence:row.evidence,failed:row.failed})));
    metrics[id]=metricSummary(spec,rows);
  }
  issues.sort((left,right)=>left.category.localeCompare(right.category)||String(left.detail?.metricId||'').localeCompare(String(right.detail?.metricId||''))||exactWitnessKey(left.witness).localeCompare(exactWitnessKey(right.witness)));
  stagedEvidence.sort(rowSort);
  missingEvidence.sort(rowSort);
  const classificationCounts=countBy(rowsForHash.filter(row=>row.evidencePresent).map(row=>row.evidenceClass));
  const report={
    contract:'ofu.r6.quality-observatory.cross-program.v1',
    authorityBoundary:{
      observationAndFalsificationOnly:true,
      scientificTruthAuthority:false,
      semanticAuthority:false,
      releaseAuthority:false,
      productMutationAuthority:false,
      nativeRuntimeAuthority:false
    },
    metricEvidenceClassification:{
      required:true,
      allowed:[...CROSS_PROGRAM_EVIDENCE_CLASSES],
      counts:classificationCounts
    },
    capabilityPolicy:{
      explicitPresenceRequired:true,
      absentCapabilityImpliesFailure:false,
      undeclaredEvidencePolicy:'IGNORE_AND_REPORT_STAGED',
      missingDeclaredEvidencePolicy:'REPORT_ONLY_UNLESS_CALLER_ADDS_AN_EXPLICIT_CHECK'
    },
    declaredCapabilities:[...declaredCapabilities].sort(),
    stagedEvidence,
    missingEvidence,
    metrics,
    issueCount:issues.length,
    issues
  };
  report.crossProgramHash=sha256(canonicalJson({
    authorityBoundary:report.authorityBoundary,
    metricEvidenceClassification:report.metricEvidenceClassification,
    capabilityPolicy:report.capabilityPolicy,
    declaredCapabilities:report.declaredCapabilities,
    stagedEvidence,
    missingEvidence,
    metrics,
    issues,
    rows:rowsForHash.sort(rowSort)
  }));
  return report;
}
