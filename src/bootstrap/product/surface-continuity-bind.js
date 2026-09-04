(function(root){
'use strict';
const O=root.OFU=root.OFU||{},T=O.planetSurfaceTerrain;if(!T||T.VERSION!=='ofu-local-terrain-lod-3')return;
const state={version:'ofu-wave-iv-surface-continuity-bind-1',bound:false,rebinds:0,lastPlanetId:null};
function rebind(){const P=root.__OFU_PLANET_PREVIEW__;if(!P?.chosen||typeof T.createTerrainSession!=='function')return false;P.surfaceTerrain?.dispose?.();P.surfaceTerrain=T.createTerrainSession();state.bound=true;state.rebinds++;state.lastPlanetId=P.provider?.planetId||P.chosen?.planetId||null;return true}
function init(){const P=root.__OFU_PLANET_PREVIEW__;if(!P){root.requestAnimationFrame?.(init);return}rebind();if(typeof P.retarget==='function'&&!P.__waveIVTerrainRetargetWrapped){const original=P.retarget;P.retarget=key=>{const result=original(key);rebind();return result};P.__waveIVTerrainRetargetWrapped=true}}
O.waveIVSurfaceContinuityBind=Object.freeze({VERSION:state.version,state,rebind,snapshot:()=>Object.freeze({...state,terrainVersion:T.VERSION})});if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
