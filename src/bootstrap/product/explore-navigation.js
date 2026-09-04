(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const q=id=>document.getElementById(id);
const STAGES=Object.freeze({
 system:Object.freeze({radii:180,label:'System',note:'System — understand the host star and the worlds that belong here.'}),
 orbit:Object.freeze({radii:4,label:'Orbit',note:'Orbit — frame the selected world as an object in its system.'}),
 approach:Object.freeze({radii:1.35,label:'Approach',note:'Approach — move close enough to read the world as a distinct body.'}),
 close:Object.freeze({radii:1.012,label:'Close',note:'Close — inspect presentation detail without treating it as canonical terrain.'})
});
const state={ready:false,system:null,star:null,targets:[],selectedIndex:0,stage:'system',lastPreviewId:null,lastSystemId:null,lastRenderNotice:null,lastSelectionResult:null,lastSelectionError:null};
const titleCase=value=>String(value||'').toLowerCase().replace(/(^|_)([a-z])/g,(_,space,c)=>(space?' ':'')+c.toUpperCase());
const planetName=index=>'Planet '+String(index+1);
const PLANET_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot']);
const samePlanetKey=(a,b)=>!!a&&!!b&&PLANET_FIELDS.every(name=>BigInt(a[name])===BigInt(b[name]));
const systemKey=key=>Object.freeze(Object.fromEntries(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ'].map(name=>[name,BigInt(key[name])])));
function targetFromPlanet(planet,key,index,total){
 const facts=planet.facts||{};
 return Object.freeze({
  index,
  name:planetName(index),
  key:Object.freeze({...key,orbitSlot:BigInt(index)}),
  id:planet.id,
  orbitLabel:'Orbit '+String(index+1)+' of '+String(total),
  classLabel:facts.bulkPriorClass?titleCase(facts.bulkPriorClass):'Bulk class unavailable',
  moonLabel:facts.moonCount===undefined?'Moon data unavailable':(facts.moonCount===0n?'No canonical moons':facts.moonCount===1n?'1 canonical moon':String(facts.moonCount)+' canonical moons')
 });
}
function resolveSystemContext(){
 const A=O.p3Astronomy,P=root.__OFU_PLANET_PREVIEW__;
 if(!A||!P?.ctx||!P?.chosen?.key)return null;
 const key=systemKey(P.chosen.key),system=A.resolveSystem(P.ctx,key);
 if(system?.status!=='PRESENT')return null;
 const count=Number(system.facts.planetCount),star=A.resolveStar(P.ctx,{...key,componentIndex:0n});
 const targets=[];
 for(let i=0;i<count;i++){
  const planet=A.resolvePlanet(P.ctx,{...key,orbitSlot:BigInt(i)});
  if(planet?.status==='PRESENT')targets.push(targetFromPlanet(planet,key,i,count));
 }
 return {key,system,star:star?.status==='PRESENT'?star:null,targets};
}
function renderSystem(){
 const s=state.system;if(!s)return;
 const count=state.targets.length,stellar=Number(s.facts.stellarComponentCount||0n);
 if(q('explore-system-summary'))q('explore-system-summary').textContent=(stellar===1?'Single-star system':String(stellar)+'-star system')+' · '+String(count)+' '+(count===1?'planet':'planets')+' canonically present';
 if(q('explore-star-summary'))q('explore-star-summary').textContent=state.star?titleCase(state.star.facts.baselineEvolutionaryClass)+' · primary host context':'Canonical star details unavailable';
 const list=q('explore-target-list');if(!list)return;list.textContent='';
 for(const target of state.targets){
  const item=document.createElement('li'),button=document.createElement('button');
  button.type='button';button.className='action-button secondary';button.dataset.exploreTarget=String(target.index);button.setAttribute('aria-pressed',target.index===state.selectedIndex?'true':'false');
  button.textContent=target.name+' · '+target.orbitLabel+' · '+target.classLabel;
  item.append(button);list.append(item);
 }
}
function selected(){return state.targets[state.selectedIndex]||null}
function inspectorMatches(target){const I=O.inspectorTest?.state?.current;return !!target&&I?.type==='Planet'&&samePlanetKey(I.key,target.key)}
function rendererCanShow(target){const P=root.__OFU_PLANET_PREVIEW__;return !!target&&!!P?.chosen?.key&&samePlanetKey(target.key,P.chosen.key)&&P.targetStatus==='SUPPORTED'}
function renderSelection(){
 const target=selected();if(!target)return;
 const P=root.__OFU_PLANET_PREVIEW__,canShow=rendererCanShow(target),sameTarget=samePlanetKey(target.key,P?.chosen?.key),heading=q('explore-selected-heading'),context=q('explore-selected-context'),status=q('explore-selection-status'),go=q('explore-go');
 if(heading)heading.textContent=target.name;
 if(context)context.textContent=target.orbitLabel+' · '+target.classLabel+' · '+target.moonLabel;
 if(status){
  if(canShow)status.textContent='This world is selected across Explore, Inspect, and the renderer and can be explored through scale.';
  else if(P?.targetStatus==='UNSUPPORTED'&&sameTarget)status.textContent='This canonical world is selected, but the current renderer cannot visualize it. Its canonical identity remains valid.';
  else if(state.lastSelectionError)status.textContent='The selection could not be established safely. The previous canonical target remains authoritative.';
  else status.textContent='Select this world to connect its canonical identity to the renderer.';
 }
 if(go){go.disabled=!canShow;go.textContent=canShow?'Approach selected world':'Approach unavailable for this selection'}
 for(const button of document.querySelectorAll('[data-explore-target]'))button.setAttribute('aria-pressed',Number(button.dataset.exploreTarget)===state.selectedIndex?'true':'false');
}
function renderStage(){
 const stage=STAGES[state.stage];if(!stage)return;
 if(q('explore-stage-note'))q('explore-stage-note').textContent=stage.note;
 for(const button of document.querySelectorAll('[data-explore-stage]'))button.setAttribute('aria-pressed',button.dataset.exploreStage===state.stage?'true':'false');
}
function establishSelection(target,{announce=false}={}){
 if(!target)return false;
 const bridge=O.v08SelectionBridge;
 if(!bridge?.selectPlanet)throw new Error('shared canonical selection bridge unavailable');
 state.lastSelectionError=null;
 state.lastSelectionResult=bridge.selectPlanet(target.key,{announce});
 return true;
}
function selectIndex(index,{announce=true,establish=true}={}){
 if(!state.targets.length)return false;
 const next=Math.max(0,Math.min(state.targets.length-1,Number(index)));
 state.selectedIndex=next;
 const target=selected();
 if(establish){
  try{establishSelection(target,{announce:false})}catch(error){state.lastSelectionError=String(error?.message||error);renderSelection();if(announce)O.productUI?.announce?.('Selection could not be established');return false}
 }
 renderSelection();
 if(announce)O.productUI?.announce?.(rendererCanShow(target)?'Selected '+target.name+'; ready to explore':'Selected '+target.name+'; visualization unavailable');
 return true;
}
function moveSelection(delta){if(!state.targets.length)return false;const next=(state.selectedIndex+Number(delta)+state.targets.length)%state.targets.length;return selectIndex(next)}
function setStage(name,{announce=true}={}){
 const stage=STAGES[name],target=selected(),P=root.__OFU_PLANET_PREVIEW__;
 if(!stage||!target)return false;
 state.stage=name;renderStage();
 if(rendererCanShow(target)&&typeof P?.navigateToRadii==='function')P.navigateToRadii(stage.radii);
 if(announce)O.productUI?.announce?.(rendererCanShow(target)?stage.label+' view for '+target.name:stage.label+' selected; visualization unavailable for '+target.name);
 return true;
}
function approach(){if(!rendererCanShow(selected()))return false;return setStage('approach')}
function sync(){
 const context=resolveSystemContext(),P=root.__OFU_PLANET_PREVIEW__;if(!context)return;
 const systemId=O.p2?.hex&&context.system?.id?O.p2.hex(context.system.id):null,previewId=P?.provider?.planetId||P?.chosen?.planetId||null;
 if(systemId!==state.lastSystemId){
  state.system=context.system;state.star=context.star;state.targets=context.targets;state.lastSystemId=systemId;
  const currentIndex=context.targets.findIndex(target=>samePlanetKey(target.key,P?.chosen?.key));state.selectedIndex=currentIndex>=0?currentIndex:0;
  const target=selected();
  if(target&&!inspectorMatches(target)&&O.v08SelectionBridge?.selectPlanet){try{establishSelection(target,{announce:false})}catch(error){state.lastSelectionError=String(error?.message||error)}}
  renderSystem();renderSelection();renderStage();state.ready=true;
 }
 if(previewId!==state.lastPreviewId){
  state.lastPreviewId=previewId;
  const currentIndex=state.targets.findIndex(target=>samePlanetKey(target.key,P?.chosen?.key));
  if(currentIndex>=0){state.selectedIndex=currentIndex;renderSelection()}
 }
 const notice=[P?.targetStatus,P?.targetReason,state.selectedIndex,state.lastSelectionError||''].join('|');if(notice!==state.lastRenderNotice){state.lastRenderNotice=notice;renderSelection()}
}
function init(){
 document.addEventListener('click',event=>{
  const target=event.target.closest?.('[data-explore-target]');if(target){selectIndex(Number(target.dataset.exploreTarget));return}
  const relative=event.target.closest?.('[data-explore-relative]');if(relative){moveSelection(Number(relative.dataset.exploreRelative));return}
  const stage=event.target.closest?.('[data-explore-stage]');if(stage){setStage(stage.dataset.exploreStage);return}
  if(event.target.closest?.('[data-explore-action="approach"]'))approach();
 });
 setInterval(sync,250);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
O.v08ExploreNavigation=Object.freeze({seamVersion:2,state,STAGES,selectIndex,moveSelection,setStage,sync,rendererCanShow,planetName});
})(typeof globalThis!=='undefined'?globalThis:this);
