(function(root){
'use strict';
const O=root.OFU=root.OFU||{},R=O.waveIVScaleRuntime;
if(!R||typeof document==='undefined')return;
const VERSION='ofu-wave-iv-scene-normalizer-1',CONTRACT=R.SCENE_PROVIDER_CONTRACT;
const state={version:VERSION,contract:CONTRACT,initialized:false,visualPrimary:null,planetPrimary:null,updates:0,lastScale:null};
function visualCanvas(){return document.getElementById('visual-universe-overlay')}
function planetCanvas(){return document.getElementById('planet-view')}
function markVisual(active){const c=visualCanvas();if(!c)return;c.dataset.scenePrimary=active?'true':'false';c.style.visibility=active?'visible':'hidden';c.setAttribute('aria-hidden','true');state.visualPrimary=!!active;state.updates++}
function sync(snapshot=R.snapshot()){const planet=planetCanvas(),visual=visualCanvas(),planetActive=snapshot.activeSceneProvider==='planet-webgl';if(planet){planet.dataset.scenePrimary=planetActive?'true':'false';planet.setAttribute('aria-hidden','false')}if(visual)markVisual(snapshot.activeSceneProvider==='visual-universe-system');state.planetPrimary=planetActive;state.lastScale=snapshot.semanticScale;return snapshotState()}
function snapshotState(){return Object.freeze({...state,activeSceneProvider:R.snapshot().activeSceneProvider,semanticScale:R.snapshot().semanticScale,duplicatePlanetVisible:false})}
function init(){if(state.initialized)return;state.initialized=true;R.registerSceneProvider({id:'visual-universe-system',scales:['system'],setActive(active){markVisual(active)}});R.on('sceneChanged',event=>sync(event.snapshot));R.on('scaleChanged',event=>sync(event.snapshot));const observer=typeof MutationObserver==='function'?new MutationObserver(()=>sync()):null;if(observer){observer.observe(document.body,{childList:true,subtree:true});state.observer=observer}sync()}
const API=Object.freeze({VERSION,contract:CONTRACT,state,init,sync,snapshot:snapshotState});O.waveIVSceneNormalizer=API;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
