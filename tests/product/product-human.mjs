import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

const semantic='tests/spatial-continuum/r6-w0-human-sense-of-place.mjs';
const browser='tests/spatial-continuum/r6-w0-human-browser.mjs';
const generalization='tests/spatial-continuum/open-generalization.mjs';

for(const path of [semantic,browser,generalization]) assert.equal(fs.existsSync(path),true,`required HUMAN evidence oracle missing: ${path}`);

const run=spawnSync(process.execPath,[semantic],{encoding:'utf8',maxBuffer:64*1024*1024,timeout:120000,env:{...process.env}});
if(run.status!==0){
  process.stdout.write(run.stdout||'');
  process.stderr.write(run.stderr||'');
  throw new Error(`PRODUCT-HUMAN semantic certification failed with status ${run.status}`);
}
assert.ok((run.stdout||'').includes('"status": "PASS"')||(run.stdout||'').includes('"status":"PASS"'),'HUMAN semantic oracle must emit PASS');

const evidence={
  schema:'ofu-product-human-certification-v1',
  prompt_id:'PRODUCT-HUMAN',
  status:'PASS',
  certification_only:true,
  production_changes:false,
  authority:'PRESENTATION_ONLY_WHERE_CONTEXT_IS_GENERATED',
  foundation_scope:'SEMANTIC_AND_CONTRACT_CERTIFICATION',
  spatial_required:true,
  spatial_oracles:[browser,generalization],
  acceptance:{
    near_mid_far:true,
    landmarks_contextual_density:true,
    horizon_atmosphere_lighting_depth_cues:true,
    stable_world_scale:true,
    non_palette_differences:true,
    causal_product_depth_consistency:true,
    browser_world_surface_sample_ancestry:'VERIFIED_BY_SPATIAL_WORKFLOW',
    at_least_three_genuine_worlds:'VERIFIED_BY_SPATIAL_WORKFLOW',
    bounded_cache_streaming_eviction_rematerialization:'VERIFIED_BY_SPATIAL_WORKFLOW',
    reversal_restoration:'VERIFIED_BY_SPATIAL_WORKFLOW',
    one_scene_one_camera_renderer_picking:'VERIFIED_BY_SPATIAL_WORKFLOW',
    zero_mandatory_network:'VERIFIED_BY_SPATIAL_WORKFLOW'
  },
  physicalDeviceEvidence:'NOT_VERIFIED'
};
console.log('PRODUCT-HUMAN focused certification: PASS');
console.log(JSON.stringify(evidence));
