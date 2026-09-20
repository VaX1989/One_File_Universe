import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const suites=[
  ['human-sense-of-place','tests/spatial-continuum/r6-w0-human-sense-of-place.mjs'],
  ['human-browser','tests/spatial-continuum/r6-w0-human-browser.mjs'],
  ['open-generalization','tests/spatial-continuum/open-generalization.mjs']
];

const results=[];
for(const [name,path] of suites){
  const run=spawnSync(process.execPath,[path],{
    encoding:'utf8',
    maxBuffer:128*1024*1024,
    timeout:420000,
    env:{...process.env}
  });
  if(run.status!==0){
    process.stdout.write(run.stdout||'');
    process.stderr.write(run.stderr||'');
    throw new Error(`PRODUCT-HUMAN certification suite ${name} failed with status ${run.status}`);
  }
  assert.ok((run.stdout||'').includes('"status": "PASS"')||(run.stdout||'').includes('"status":"PASS"'),`${name} must emit PASS evidence`);
  results.push({name,status:'PASS'});
}

const evidence={
  schema:'ofu-product-human-certification-v1',
  prompt_id:'PRODUCT-HUMAN',
  status:'PASS',
  certification_only:true,
  production_changes:false,
  authority:'PRESENTATION_ONLY_WHERE_CONTEXT_IS_GENERATED',
  suites:results,
  acceptance:{
    near_mid_far:true,
    landmarks_contextual_density:true,
    horizon_atmosphere_lighting_depth_cues:true,
    stable_world_scale:true,
    exact_world_surface_sample_ancestry:true,
    at_least_three_genuine_worlds:true,
    non_palette_differences:true,
    causal_product_depth_consistency:true,
    bounded_cache_streaming_eviction_rematerialization:true,
    reversal_restoration:true,
    one_scene:true,
    one_camera:true,
    renderer_owned_picking:true,
    zero_mandatory_network:true
  },
  physicalDeviceEvidence:'NOT_VERIFIED'
};
console.log('PRODUCT-HUMAN certification: PASS');
console.log(JSON.stringify(evidence));
