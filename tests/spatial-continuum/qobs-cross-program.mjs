import assert from 'node:assert/strict';
import {
  analyzeCrossProgramEvidence,
  analyzeObservations,
  CROSS_PROGRAM_EVIDENCE_CLASSES
} from '../../tools/spatial-continuum/quality-observatory/index.mjs';

const witness=index=>({address:`ofu://qobs/${index}`,seed:`seed-${index}`,modelVersion:'qobs-cross-program-v1',stage:'W1',sampleId:`sample-${index}`});
const base=index=>({
  contract:'ofu.r6.quality-observatory.observation.v1',
  witness:witness(index),
  checks:{generationInvariant:true},
  provenance:{authorityClass:'TEST_ANALYSIS',source:'qobs-cross-program-fixture'},
  performance:{cpuUpdateMs:1+index,cpuRenderMs:2+index,gpuVerified:false}
});

const pass={
  ...base(0),
  crossProgram:{
    capabilityPresence:{
      product:{allScaleContinuity:true,causalConsequenceCoverage:true,atlasExactReturn:true,browserDeviceEvidence:true},
      platform:{crossLanguageParity:true,abiVersionRegression:true,queryLatency:true,cacheMaterializationBounds:true,providerConformance:true,persistenceRecovery:true,securityFuzz:true}
    },
    product:{
      allScaleContinuity:{evidenceClass:'MEASURED',pass:true,maxNormalizedDelta:0.001},
      causalConsequenceCoverage:{evidenceClass:'HEURISTIC',pass:true,expectedCount:4,observedCount:4},
      atlasExactReturn:{evidenceClass:'MEASURED',exactReturnPass:true,savedContextHash:'same',returnedContextHash:'same'},
      browserDeviceEvidence:{evidenceClass:'MEASURED',pass:true,browser:'chromium',deviceClass:'desktop'}
    },
    platform:{
      crossLanguageParity:{evidenceClass:'MEASURED',byteParityPass:true,digestParityPass:true,rejectionParityPass:true},
      abiVersionRegression:{evidenceClass:'MEASURED',compatiblePass:true,version:'p2-feasibility-v0'},
      queryLatency:{evidenceClass:'MEASURED',withinDeclaredBudget:true,latencyMs:2,budgetMs:10},
      cacheMaterializationBounds:{evidenceClass:'MEASURED',withinBoundsPass:true,cacheBytes:1024,materializationBytes:2048},
      providerConformance:{evidenceClass:'MEASURED',conformancePass:true},
      persistenceRecovery:{evidenceClass:'MEASURED',recoveryPass:true,recoveryMs:4},
      securityFuzz:{evidenceClass:'MEASURED',fuzzPass:true,cases:128}
    }
  }
};

const fail={
  ...base(1),
  crossProgram:{
    capabilityPresence:{
      product:{allScaleContinuity:true,causalConsequenceCoverage:true,atlasExactReturn:true},
      platform:{crossLanguageParity:true,queryLatency:true}
    },
    product:{
      allScaleContinuity:{evidenceClass:'MEASURED',pass:false,maxNormalizedDelta:0.8},
      causalConsequenceCoverage:{evidenceClass:'HEURISTIC',expectedCount:6,observedCount:2},
      atlasExactReturn:{evidenceClass:'MEASURED',exactReturnPass:false,savedContextHash:'saved',returnedContextHash:'different'},
      browserDeviceEvidence:{evidenceClass:'PRESENTATION_ONLY',pass:false,browser:'webkit',deviceClass:'mobile'}
    },
    platform:{
      crossLanguageParity:{evidenceClass:'MEASURED',byteParityPass:false,digestParityPass:true,rejectionParityPass:false},
      queryLatency:{evidenceClass:'MEASURED',withinDeclaredBudget:false,latencyMs:30,budgetMs:10},
      providerConformance:{evidenceClass:'MEASURED',conformancePass:false}
    }
  }
};

const unclassified={
  ...base(2),
  crossProgram:{
    capabilityPresence:{product:{allScaleContinuity:true}},
    product:{allScaleContinuity:{pass:true}}
  }
};

const missingDeclared={
  ...base(3),
  crossProgram:{capabilityPresence:{platform:{persistenceRecovery:true}}}
};

const observations=[pass,fail,unclassified,missingDeclared];
const cross=analyzeCrossProgramEvidence(observations);

assert.deepEqual(CROSS_PROGRAM_EVIDENCE_CLASSES,['MEASURED','HEURISTIC','PRESENTATION_ONLY']);
assert.equal(cross.contract,'ofu.r6.quality-observatory.cross-program.v1');
assert.equal(cross.authorityBoundary.observationAndFalsificationOnly,true);
for(const forbidden of ['scientificTruthAuthority','semanticAuthority','releaseAuthority','productMutationAuthority','nativeRuntimeAuthority'])assert.equal(cross.authorityBoundary[forbidden],false);

for(const category of [
  'all_scale_continuity_failure',
  'causal_consequence_coverage_failure',
  'atlas_exact_return_failure',
  'cross_language_parity_failure',
  'query_latency_budget_failure',
  'metric_evidence_classification_missing'
])assert.ok(cross.issues.some(issue=>issue.category===category),`expected ${category}`);

assert.ok(!cross.issues.some(issue=>issue.category==='browser_device_failure'),'undeclared browser/device evidence must be staged, not treated as failure');
assert.ok(!cross.issues.some(issue=>issue.category==='provider_conformance_failure'),'undeclared provider evidence must be staged, not treated as failure');
assert.ok(cross.stagedEvidence.some(row=>row.metricId==='product.browserDeviceEvidence'));
assert.ok(cross.stagedEvidence.some(row=>row.metricId==='platform.providerConformance'));
assert.ok(cross.missingEvidence.some(row=>row.metricId==='platform.persistenceRecovery'));
assert.ok(cross.declaredCapabilities.includes('platform.persistenceRecovery'));
assert.equal(cross.capabilityPolicy.absentCapabilityImpliesFailure,false);
assert.equal(cross.capabilityPolicy.explicitPresenceRequired,true);
assert.equal(cross.metricEvidenceClassification.counts.MEASURED,14);
assert.equal(cross.metricEvidenceClassification.counts.HEURISTIC,2);
assert.equal(cross.metricEvidenceClassification.counts.UNCLASSIFIED,1);

const reverse=analyzeCrossProgramEvidence([...observations].reverse());
assert.equal(reverse.crossProgramHash,cross.crossProgramHash,'cross-program evidence hash must be observation-order independent');

const integrated=analyzeObservations({campaignId:'QOBS_CROSS_PROGRAM_FIXTURE',observations});
assert.equal(integrated.status,'FALSIFIED');
assert.equal(integrated.crossProgram.crossProgramHash,cross.crossProgramHash);
assert.equal(integrated.issueCounts.all_scale_continuity_failure,1);
assert.equal(integrated.issueCounts.atlas_exact_return_failure,1);
assert.equal(integrated.issueCounts.cross_language_parity_failure,1);
assert.equal(integrated.issueCounts.query_latency_budget_failure,1);
assert.equal(integrated.issueCounts.metric_evidence_classification_missing,1);
assert.equal(integrated.crossProgram.authorityBoundary.releaseAuthority,false);
assert.ok(integrated.issues.every(issue=>issue.witness.address&&issue.witness.seed&&issue.witness.modelVersion),'all emitted failures must preserve exact replay witnesses');

const output={
  status:'PASS',
  suite:'qobs-cross-program',
  crossProgramHash:cross.crossProgramHash,
  declaredCapabilities:cross.declaredCapabilities,
  stagedEvidence:cross.stagedEvidence.map(row=>row.metricId),
  missingEvidence:cross.missingEvidence.map(row=>row.metricId),
  issueCounts:integrated.issueCounts,
  authorityBoundary:integrated.crossProgram.authorityBoundary
};
console.log(JSON.stringify(output,null,2));
