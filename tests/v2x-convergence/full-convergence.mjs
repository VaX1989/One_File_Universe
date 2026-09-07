import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {loadComponents} from '../../tools/extensions/components.mjs';

const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
if(process.env.OFU_SOURCE_SHA)assert.equal(head,process.env.OFU_SOURCE_SHA,'exact convergence source mismatch');
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'','release witness requires clean checkout');

const suites=[
 ['macro-to-micro-and-reverse','tests/v1/integration/world-journey.mjs'],
 ['provider-micro-tissue-cell-molecular-atomic','tests/v1/provider-integration.mjs'],
 ['v2x01-cancellation-stale-resource','tests/v2x-01-runtime-adaptive-materialization/targeted.mjs'],
 ['v2x01-resource-soak','tests/v2x-01-runtime-adaptive-materialization/soak.mjs'],
 ['v2x04-orbit-stellar','tests/v2x-04-system-planet-approach/orbit-stellar-oracle.mjs'],
 ['v2x04-approach','tests/v2x-04-system-planet-approach/approach-continuity-oracle.mjs'],
 ['v2x04-illumination-lod','tests/v2x-04-system-planet-approach/illumination-body-lod-oracle.mjs'],
 ['v2x05-deep-planet','tests/v2x-05/deep-planet-oracles.mjs'],
 ['v2x06-cross-scale','tests/v2x-06-surface/cross-scale-integration.mjs'],
 ['v2x07-local-experience','tests/v2x-07-human-scale-local-traversal/local-experience.mjs'],
 ['v2x07-upstream','tests/v2x-07-human-scale-local-traversal/upstream-adapters.mjs'],
 ['v2x08-esm-core','tests/v2x-08/life-ecology-evolution-embodiment.mjs'],
 ['v2x08-esm-evolution','tests/v2x-08/life-evolution-succession.mjs'],
 ['v2x08-provider-renderer','tests/v2x-08/life-provider-renderer.mjs'],
 ['v2x08-single-file-facade','tests/v2x-08/single-file-facade.mjs'],
 ['v2x09-civilization','tests/v2x-09-civilization-economy-city/civilization-economy-city.mjs'],
 ['v2x10-individuals','tests/v2x10/run.mjs'],
 ['v2x11-cross-domain-gameplay','tests/v2x-11-gameplay-causal-engine/cross-domain-journey.mjs'],
 ['v2x12-matter','tests/v2x-12-matter-continuity/run.mjs'],
 ['v2x12-units-authority','tests/v2x-12-matter-continuity/authority-provenance.mjs'],
 ['v2x13-render-core','tests/render-platform/run-render-platform-tests.mjs'],
 ['v2x13-render-depth','tests/render-platform/run-render-platform-depth-tests.mjs'],
 ['v2x13-render-convergence','tests/render-platform/run-render-platform-convergence-tests.mjs'],
 ['v2x14-contracts','tests/v2x-14-product-experience/contracts.mjs']
];
const passed=[];
for(const [name,file] of suites){
 assert.ok(fs.existsSync(file),`missing convergence suite ${file}`);
 const r=spawnSync(process.execPath,[file],{encoding:'utf8',env:process.env,timeout:180000,maxBuffer:16*1024*1024});
 assert.equal(r.error,undefined,`${name} execution error: ${r.error}`);
 assert.equal(r.status,0,`${name} failed\n${String(r.stdout).slice(-3000)}\n${String(r.stderr).slice(-3000)}`);
 passed.push(name);
}

const componentFiles=[
 'v2x-01-runtime-adaptive-materialization.json',
 'v2x-02-camera-spatial-travel.json',
 'v2x-03-macrocosm.json',
 'v2x-04-system-planet-approach.json',
 'v2x-05-deep-planet-science.json',
 'v2x-06-surface-terrain-geology-hydrology.json',
 'v2x-07-human-scale-local-traversal.json',
 'v2x-08-life-ecology-evolution-embodiment.json',
 'v2x-09-civilization-economy-city.json',
 'v2x-10-persistent-individuals.json',
 'v2x-11-gameplay-causal-engine.json',
 'v2x-12-matter-continuity.json',
 'v2x-13-rendering-platform.json',
 'v2x-14-product-experience.json',
 'v2x-14-systemic-audio.json'
];
const plan=loadComponents();
const byId=new Map(plan.map(c=>[c.id,c]));
const html=fs.readFileSync('dist/One_File_Universe.html','utf8');
for(const file of componentFiles){
 const path='config/components/'+file;assert.ok(fs.existsSync(path),`missing shipping component manifest ${file}`);
 const manifest=JSON.parse(fs.readFileSync(path,'utf8'));assert.ok(manifest.components.length>0,`empty shipping manifest ${file}`);
 for(const c of manifest.components){
  assert.ok(byId.has(c.id),`component ${c.id} not in deterministic plan`);
  const marker=c.placement==='resource'?`id="ofu-resource-${c.id}"`:c.placement==='script'?`data-ofu-component="${c.id}"`:null;
  if(marker)assert.ok(html.includes(marker),`component ${c.id} not embedded in final single HTML`);
 }
}
assert.ok(!/(?:src|href)=["']https?:\/\//i.test(html),'mandatory external URL leaked into final HTML');
assert.ok(html.includes("connect-src 'none'"),'offline CSP missing');

const traversal=['Universe','Galaxy','Region','Neighborhood','System','Planet','Approach','Surface','Regional','Local','Human','Life','Tissue/Cell','Molecular','Atomic','reverse traversal'];
console.log(JSON.stringify({status:'PASS',suite:'v2x-full-convergence-release',sourceSha:head,sourceTree:tree,traversal,criticalSuites:passed,componentManifests:componentFiles,finalSingleHtml:true,mandatoryNetwork:false,exactSource:true,cancellationAndStaleWork:true,resourceSoak:true}));
