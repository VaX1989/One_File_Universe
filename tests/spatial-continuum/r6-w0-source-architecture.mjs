import assert from 'node:assert/strict';
import fs from 'node:fs';

const url=relative=>new URL('../../'+relative,import.meta.url);
const read=relative=>fs.readFileSync(url(relative),'utf8');
const count=(source,pattern)=>(source.match(pattern)||[]).length;
const experience=read('src/experiments/spatial-continuum/experience.js');
const base=read('src/experiments/spatial-continuum/renderer.js');
const facade=read('src/experiments/spatial-continuum/renderer-phase2.js');
const build=read('tools/build-spatial-continuum.mjs');
const workflow=read('.github/workflows/spatial-continuum-experiment.yml');

assert.match(experience,/from '\.\/renderer-phase2\.js'/,'checked-in experience must directly import the active Phase-2 renderer');
assert.match(experience,/from '\.\/orientation-scale-ux\.js'/,'checked-in experience must directly import the orientation provider');
assert.equal(count(experience,/createOrientationScaleUX\(/g),1,'exactly one orientation provider must be instantiated');
assert.match(experience,/id="continuum-orientation"/);

assert.doesNotMatch(build,/transformPhase2(?:Renderer|Experience)|phase2-(?:renderer|experience)-transform|onLoad\s*:/,'build must package checked-in application source without semantic rewriting');
assert.match(build,/semanticBuildTransforms:false/);
assert.match(build,/sourceTruth:'DIRECT_CHECKED_IN'/);
assert.match(build,/canonicalFocusAuthorities:1/);
assert.match(build,/cameraAuthorities:1/);
assert.match(build,/sceneAuthorities:1/);
assert.match(build,/picking:'BABYLON_SCENE_RAY_PICK'/);
assert.match(build,/phase2NavigationAuthorityAdded:false/);

assert.match(base,/macroRenderingOwnedExternally=false,lowerScaleRenderingOwnedExternally=false/);
assert.match(base,/const macro=macroRenderingOwnedExternally\?null:createMacroLayer/,'legacy macro renderer must not be constructed when Phase-2 owns macro rendering');
assert.match(base,/name==='molecular'&&!lowerScaleRenderingOwnedExternally&&!molecular/,'legacy molecular layer must not be constructed when Phase-2 owns lower scales');
assert.match(base,/name==='atomic'&&!lowerScaleRenderingOwnedExternally&&!atomic/,'legacy atomic layer must not be constructed when Phase-2 owns lower scales');
assert.match(base,/rendererOwnership:Object\.freeze\(\{macro:macroRenderingOwnedExternally\?'EXTERNAL':'BASE',lowerScale:lowerScaleRenderingOwnedExternally\?'EXTERNAL':'BASE'\}\)/);
assert.match(base,/rendererOwnedPicking:true/);
assert.equal(count(base,/new Scene\(/g),1,'base renderer must own exactly one scene');
assert.equal(count(base,/new FreeCamera\(/g),1,'base renderer must own exactly one camera');

assert.match(facade,/createBaseContinuumRenderer\(canvas,world,\{\.\.\.options,macroRenderingOwnedExternally:true,lowerScaleRenderingOwnedExternally:true\}\)/);
assert.match(facade,/getOpenUniverse:\(\)=>activeWorld\.openUniverse/,'authoritative openUniverse must pass intact to progressive macro owner');
assert.doesNotMatch(facade,/createMacroSuppressedOpenUniverse|catalogueFor\s*[:=].*\[\]|new Proxy\(/,'Phase-2 must not fake or wrap semantic authority to suppress the base renderer');
assert.doesNotMatch(facade,/new Scene\(|new FreeCamera\(/,'composition facade must reuse the base scene and camera');
assert.match(facade,/pick:base\.pick/);
assert.match(facade,/rendererOwnedPicking:true/);
assert.match(facade,/sceneCount:1/);

assert.equal(fs.existsSync(url('tools/spatial-continuum/phase2-renderer-transform.mjs')),false,'obsolete renderer transform must be removed');
assert.equal(fs.existsSync(url('tools/spatial-continuum/phase2-experience-transform.mjs')),false,'obsolete experience transform must be removed');
assert.equal(fs.existsSync(url('tools/spatial-continuum/materialize-phase2-source.mjs')),false,'one-shot materializer must not remain');
assert.equal(fs.existsSync(url('tools/spatial-continuum/promote-phase2-source.mjs')),false,'one-shot promoter must not remain');

assert.match(workflow,/permissions: \{contents: read\}/);
const checkoutCount=count(workflow,/uses:\s*actions\/checkout@/g),credentialDropCount=count(workflow,/persist-credentials:\s*false/g);assert.ok(checkoutCount>0,'normal Spatial Continuum CI must perform at least one exact-source checkout');assert.equal(credentialDropCount,checkoutCount,'every normal Spatial Continuum checkout must drop push credentials');
assert.doesNotMatch(workflow,/contents: write|persist-credentials: true|git\s+push|git\s+commit|R6_W0_ONE_SHOT_SOURCE_PROMOTION|materialize-phase2-source|promote-phase2-source/,'normal experiment CI must be strictly read-only');

console.log(JSON.stringify({status:'PASS',suite:'r6-w0-source-truth-architecture',sourceTruthEqualsRuntimeTruth:true,semanticBuildTransforms:'NONE',ciSourceMutation:'NONE',workflowContentPermission:'READ',workflowPersistCredentials:false,workflowCheckouts:checkoutCount,macroRendererOwner:'PHASE2_PROGRESSIVE',lowerScaleRendererOwner:'PHASE2_EPISTEMIC',sceneAuthorities:1,cameraAuthorities:1,focusNavigationAuthorities:1,rendererOwnedPicking:true},null,2));
