import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  planDeterministicSweep,
  calibratePerceptualDiversity,
  scorePerceptualDiversity,
  analyzeObservations,
  buildHumanSummary
} from '../../tools/spatial-continuum/quality-observatory/index.mjs';

const root=process.cwd();
const evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r6-w0','quality-observatory'));
fs.mkdirSync(evidenceDir,{recursive:true});

const descriptor=(value,index,{categoricalPrefix='rep',paletteValue=value}={})=>({
  silhouetteTopography:[value,value*0.8,value*0.6],
  horizonLandformProfile:[value*0.4,value*0.7,value],
  spatialFrequencyRoughness:[value,value*0.5],
  atmosphereSkyRegime:`${categoricalPrefix}-sky-${categoricalPrefix==='distinct'?index:0}`,
  materialFamily:`${categoricalPrefix}-material-${categoricalPrefix==='distinct'?index:0}`,
  objectDensityClustering:[value*0.3,value*0.9],
  scaleDistribution:[value*0.2,value*0.5,value],
  palette:[paletteValue,paletteValue*0.7,paletteValue*0.4],
  causalFingerprint:`${categoricalPrefix}-causal-${categoricalPrefix==='distinct'?index:0}`,
  microstructureTopology:[value*0.1,value*0.6,value]
});

const repetitive=Array.from({length:8},(_,index)=>({descriptors:descriptor(0.2+index*0.0005,index)}));
const distinct=Array.from({length:8},(_,index)=>({descriptors:descriptor(0.05+index*0.13,index,{categoricalPrefix:'distinct'})}));
const calibration=calibratePerceptualDiversity({repetitive,distinct,label:'R6_G_SYNTHETIC_KNOWN_REPETITIVE_VS_DISTINCT'});
assert.equal(calibration.calibratedDimensions.length,10,'all ten declared dimensions should calibrate in the controlled fixture');
assert.equal(calibration.aggregateBaseline.separated,true,'known-distinct fixture should sit above repetitive envelope');

const repetitiveCandidate=Array.from({length:6},(_,index)=>({descriptors:descriptor(0.31+index*0.0004,index,{categoricalPrefix:'candidate-repeat'})}));
const distinctCandidate=distinct.slice(0,6);
const repetitiveScore=scorePerceptualDiversity(repetitiveCandidate,calibration);
const distinctScore=scorePerceptualDiversity(distinctCandidate,calibration);
assert.ok(repetitiveScore.score.populationSpread<distinctScore.score.populationSpread,'known repetitive population must score below known distinct population');
assert.ok(repetitiveScore.score.templateCollapseRate>distinctScore.score.templateCollapseRate,'known repetitive population must expose more collapse');

const paletteOnly=Array.from({length:6},(_,index)=>({descriptors:{...descriptor(0.4,0,{categoricalPrefix:'palette-only'}),palette:[index/5,(5-index)/5,index/10]}}));
const paletteOnlyScore=scorePerceptualDiversity(paletteOnly,calibration);
assert.ok(paletteOnlyScore.score.populationSpread<0.2,'palette-only variation must not masquerade as broad perceptual diversity');

const planA=planDeterministicSweep({campaignId:'R6_G_SWEEP_TEST',campaignSeed:'seed-42',addresses:['ofu://c','ofu://a','ofu://b'],seeds:['2','1'],modelVersions:['m2','m1'],stages:['HUMAN','GLOBAL_SURFACE'],limit:7});
const planB=planDeterministicSweep({campaignId:'R6_G_SWEEP_TEST',campaignSeed:'seed-42',addresses:['ofu://b','ofu://c','ofu://a'],seeds:['1','2'],modelVersions:['m1','m2'],stages:['GLOBAL_SURFACE','HUMAN'],limit:7});
assert.deepEqual(planA.selected,planB.selected,'deterministic sweep selection must be independent of candidate input order');
assert.equal(planA.planHash,planB.planHash);
assert.equal(planA.selectedCount,7);

const exposures=[1,1.01,0.99,1.02,0.98,1.015,0.995,4.0];
const densities=[0.4,0.41,0.39,0.405,0.395,0.402,0.398,3.5];
const observations=Array.from({length:8},(_,index)=>({
  contract:'ofu.r6.quality-observatory.observation.v1',
  witness:{address:`ofu://world/${index}`,seed:`seed-${index}`,modelVersion:'r6-fixture',stage:'HUMAN',sampleId:`sample-${index}`},
  descriptors:descriptor(0.05+index*0.13,index,{categoricalPrefix:'distinct'}),
  checks:{generationInvariant:true},
  representation:{blank:false,degenerate:false},
  visual:{exposure:exposures[index],luminance:0.5+index*0.002},
  human:{density:densities[index],medianScale:1+index*0.002,horizonFraction:0.45+index*0.001},
  transition:{continuityPass:true,lodSeamPass:true,lodPopPass:true,checks:{}},
  performance:{cpuUpdateMs:2+index,cpuRenderMs:1+index*0.5,gpuVerified:index<4,gpuFrameMs:index<4?1.5+index*0.1:null},
  resources:{meshes:10+index,materials:4,textures:1},
  queue:{staleResultViolations:0,cancellationFailures:0},
  runtime:{directFilePass:true,networkRequests:[]},
  provenance:{authorityClass:'MODEL_DERIVED',source:'synthetic-fixture'},
  accessibility:{checks:{keyboardReachable:true,focusVisible:true}},
  outputFingerprint:`output-${index}`,
  journeyKey:'fixture-journey',sequence:index
}));

Object.assign(observations[7],{
  checks:{generationInvariant:false},
  failures:['synthetic generation failure'],
  representation:{blank:true,degenerate:true},
  transition:{continuityPass:false,lodSeamPass:false,lodPopPass:false,checks:{lodCoverage:false}},
  queue:{staleResultViolations:1,cancellationFailures:1},
  runtime:{directFilePass:false,networkRequests:['https://forbidden.example/resource']},
  provenance:{authorityClass:'MODEL_DERIVED'},
  accessibility:{checks:{keyboardReachable:false,focusVisible:true}},
  resources:{meshes:30,materials:4,textures:1}
});
observations.push({...observations[0],outputFingerprint:'output-0-conflict'});

const report=analyzeObservations({
  campaignId:'R6_G_SYNTHETIC_FALSIFICATION',observations,calibration,
  config:{failOnMissingProvenance:true,resourceDeltaBudgets:{meshes:5},robustOutlierZ:4.5}
});
assert.equal(report.status,'FALSIFIED');
for(const category of [
  'generation_invariant_failure','blank_representation','degenerate_representation','transition_continuity_failure','lod_transition_failure',
  'stale_result_violation','cancellation_failure','direct_file_violation','offline_violation','accessibility_journey_failure',
  'lighting_exposure_outlier','human_scale_density_horizon_anomaly','determinism_violation','resource_growth_violation','provenance_coverage_failure'
])assert.ok(report.issueCounts[category]>=1,`expected ${category} witness`);
assert.ok(report.issues.every(issue=>issue.witness.address&&issue.witness.seed&&issue.witness.modelVersion),'every failure must retain an exact replay witness');
assert.ok(report.performance.cpuUpdateMs.p95>report.performance.cpuUpdateMs.p50);
assert.equal(report.performance.gpuEvidence.verifiedSamples,5,'four unique GPU samples plus the duplicate rerun should be counted as verified evidence');
assert.ok(report.diversity.score.descriptorCoverage>0.99);
assert.equal(report.methodology.diversityScalarMagicScore,false);
assert.equal(report.methodology.imageSimilarityAuthority,false);

const summary=buildHumanSummary(report);
assert.match(summary,/multidimensional score vector/);
assert.match(summary,/offline_violation/);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-r6g-cli-'));
const observationsFile=path.join(tmp,'observations.json'),calibrationFile=path.join(tmp,'calibration.json'),reportFile=path.join(tmp,'report.json'),summaryFile=path.join(tmp,'report.md');
fs.writeFileSync(observationsFile,JSON.stringify(observations,null,2));
fs.writeFileSync(calibrationFile,JSON.stringify(calibration,null,2));
execFileSync(process.execPath,[path.join(root,'tools/spatial-continuum/quality-observatory/cli.mjs'),'--observations',observationsFile,'--calibration',calibrationFile,'--out',reportFile,'--summary',summaryFile,'--campaign','R6_G_CLI_TEST'],{stdio:'pipe'});
const cliReport=JSON.parse(fs.readFileSync(reportFile,'utf8'));
assert.equal(cliReport.status,'FALSIFIED');
assert.equal(cliReport.sampleCount,observations.length);
assert.match(fs.readFileSync(summaryFile,'utf8'),/R6_G_CLI_TEST/);

const output={
  status:'PASS',suite:'spatial-continuum-r6-w0-quality-observatory',
  calibration:{calibratedDimensions:calibration.calibratedDimensions,aggregateBaseline:calibration.aggregateBaseline,baselineFingerprint:calibration.baselineFingerprint},
  knownPopulations:{repetitive:repetitiveScore.score,distinct:distinctScore.score,paletteOnly:paletteOnlyScore.score},
  sampling:{candidateCount:planA.candidateCount,selectedCount:planA.selectedCount,planHash:planA.planHash},
  falsification:{issueCount:report.issueCount,issueCounts:report.issueCounts,reportHash:report.reportHash,exactWitnesses:true},
  boundaries:{productionSourceWrites:false,centralRunnerModified:false,workflowModified:false,packageModified:false,imageSimilarityAuthority:false,diversityScalarMagicScore:false}
};
fs.writeFileSync(path.join(evidenceDir,'quality-observatory-test-results.json'),JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(path.join(evidenceDir,'quality-observatory-summary.md'),summary);
console.log(JSON.stringify(output,null,2));
