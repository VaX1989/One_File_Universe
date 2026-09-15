const IMPORT_ANCHOR="import { createContinuumRenderer } from './renderer.js';";
const HOVER_ANCHOR='<div class="continuum-hover" id="continuum-hover"></div>';
const BOOT_ANCHOR='    for(const stop of kernel.stages){';
const UPDATE_ANCHOR='      root.querySelector(\'[data-action="deeper"]\').disabled=';
const SNAPSHOT_ANCHOR="render,explorationFreedom:'CONTINUOUS_MACRO_AND_BRANCHING_SCALE'";
const DISPOSE_ANCHOR="dispose(){if(disposed)return false;disposed=true;renderer.dispose();openUniverse.dispose();return true}";

export function transformPhase2Experience(source){
  let output=String(source);
  if(!output.includes(IMPORT_ANCHOR))throw new Error('R6/W0 Phase-2 experience transform lost orientation import anchor');
  output=output.replace(IMPORT_ANCHOR,`${IMPORT_ANCHOR}\nimport { createOrientationScaleUX } from './orientation-scale-ux.js';`);
  if(!output.includes(HOVER_ANCHOR))throw new Error('R6/W0 Phase-2 experience transform lost orientation host anchor');
  output=output.replace(HOVER_ANCHOR,`${HOVER_ANCHOR}\n      <div id="continuum-orientation" class="continuum-orientation-shell" data-transition-critical="false"></div>`);
  if(!output.includes(BOOT_ANCHOR))throw new Error('R6/W0 Phase-2 experience transform lost orientation boot anchor');
  output=output.replace(BOOT_ANCHOR,`    const orientation=createOrientationScaleUX({container:root.querySelector('#continuum-orientation'),reducedMotion:reduced,onIntent:intent=>{if(intent?.type==='BACK')goBack()}});\n${BOOT_ANCHOR}`);
  if(!output.includes(UPDATE_ANCHOR))throw new Error('R6/W0 Phase-2 experience transform lost updateUi anchor');
  output=output.replace(UPDATE_ANCHOR,`      const renderContext=renderer.snapshot(),transitionCritical=Boolean(renderContext.surfaceConvergence?.handoff?.presentation?.transitionCritical),explorationActive=Boolean(state.scale.moving||transitionCritical||(lastInputAt!==null&&currentTime()-lastInputAt<900)),orientationSelection={id:focus,label:node?.metadata?.label||node?.kind||focus,kind:node?.kind||'FOCUS',authority:node?.authority,explicitlySelected:sampleExplicitlySelected};orientation.update({snapshot:{state,openUniverse:open,branchHistory},path:open.currentAddress?.segments||[],history:branchHistory,selection:orientationSelection,viewportWidth:innerWidth,explorationActive,reducedMotion:reduced,canGoBack:state.historyDepth>0||branchHistory.length>0});const orientationShell=root.querySelector('#continuum-orientation');if(orientationShell)orientationShell.dataset.transitionCritical=String(transitionCritical);\n${UPDATE_ANCHOR}`);
  if(!output.includes(SNAPSHOT_ANCHOR))throw new Error('R6/W0 Phase-2 experience transform lost snapshot anchor');
  output=output.replace(SNAPSHOT_ANCHOR,"render,orientation:orientation.snapshot(),explorationFreedom:'CONTINUOUS_MACRO_AND_BRANCHING_SCALE'");
  if(!output.includes(DISPOSE_ANCHOR))throw new Error('R6/W0 Phase-2 experience transform lost disposal anchor');
  output=output.replace(DISPOSE_ANCHOR,"dispose(){if(disposed)return false;disposed=true;orientation.destroy();renderer.dispose();openUniverse.dispose();return true}");
  return output;
}

export function phase2ExperienceTransformContract(){return Object.freeze({contract:'ofu-r6-w0-phase2-experience-transform-1',orientationProviders:1,intents:Object.freeze(['BACK','ORIENTATION_PANEL']),navigationAuthorityAdded:false,cameraAuthorityAdded:false,focusAuthorityAdded:false})}
