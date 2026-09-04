(function(root){
'use strict';
const O=root.OFU=root.OFU||{},R=O.waveIVScaleRuntime;if(!R||typeof document==='undefined')return;
const VERSION='ofu-wave-iv-scene-normalizer-2',state={version:VERSION,initialized:false,updates:0,lastScale:null,lastProvider:null,legacyVisualProviderRetired:true};
function sync(s=R.snapshot()){const planet=document.getElementById('planet-view'),legacy=document.getElementById('visual-universe-overlay'),macro=document.getElementById('wave-iv-macro-view'),macroActive=s.activeSceneProvider==='wave-iv-macro';if(legacy){legacy.style.visibility='hidden';legacy.style.pointerEvents='none';legacy.dataset.scenePrimary='false';legacy.setAttribute('aria-hidden','true')}if(macro){macro.style.display=macroActive?'block':'none';macro.dataset.scenePrimary=macroActive?'true':'false'}if(planet){planet.style.visibility=macroActive?'hidden':'visible';planet.dataset.scenePrimary=macroActive?'false':'true';planet.setAttribute('aria-hidden','false')}state.lastScale=s.semanticScale;state.lastProvider=s.activeSceneProvider;state.updates++;return snapshot()}
function snapshot(){return Object.freeze({...state,activeSceneProvider:R.snapshot().activeSceneProvider,semanticScale:R.snapshot().semanticScale,duplicatePrimaryVisible:false})}
function init(){if(state.initialized)return;state.initialized=true;R.on('sceneChanged',e=>sync(e.snapshot));R.on('scaleChanged',e=>sync(e.snapshot));sync()}
O.waveIVSceneNormalizer=Object.freeze({VERSION,state,init,sync,snapshot});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
