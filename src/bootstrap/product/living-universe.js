(function(root){
'use strict';
const O=root.OFU;if(typeof document==='undefined')return;
const VERSION='ofu-wave-a-living-product-1',title=s=>String(s||'').toLowerCase().replaceAll('_',' '),short=s=>String(s||'').slice(0,8);
let runtime=null,renderer=null,stage=null,panel=null,canvas=null,rail=null,heading=null,location=null,breadcrumbs=null,uiError=null,pending=null,initialized=false;
let search={goal:'CIVILIZATION',cursor:null,rows:[],worlds:0,pages:0,running:false,generation:0,context:null},renderError=null;
const $=id=>document.getElementById(id);
function el(tag,text=null,attrs={}){const x=document.createElement(tag);if(text!==null)x.textContent=text;for(const [k,v] of Object.entries(attrs)){if(k==='class')x.className=v;else x.setAttribute(k,String(v));}return x;}
function button(text,action,{primary=false,disabled=false,id=null}={}){const b=el('button',text,{type:'button',class:'living-button'+(primary?' primary':''),'data-living-action':id||text});b.disabled=disabled;b.addEventListener('click',()=>act(action));return b;}
function act(fn){try{uiError=null;const result=fn();if(result?.then)result.catch(fail);return result;}catch(error){fail(error);return null;}}
function fail(error){uiError=String(error?.message||error);renderError=uiError;renderPanel(runtime?.snapshot());console.error('Wave A product:',error);}
function stopLegacy(){for(const id of ['wave-iv-macro','planet-webgl','surface-webgl']){try{O.pxProduct.sceneImplementation(id).setActive(false);}catch(error){/* A legacy scene may be unavailable in a restricted graphics backend. */}}}
function pointAction(point,{settlement=null}={}){
 const s=runtime.snapshot();
 if(s.world&&['GAS_GIANT','ICE_GIANT'].includes(s.world.planetology.bulkPriorClass))return runtime.inspectAtmosphere();
 const next=settlement?'HUMAN':s.stage==='GLOBAL_SURFACE'?'REGIONAL_SURFACE':['LOCAL_SURFACE','HUMAN'].includes(s.stage)?s.stage:'GLOBAL_SURFACE';
 return runtime.at(point.latMicroDeg,point.lonMicroDeg,{stage:next});
}
function primaryAction(s){
 if(s.stage==='UNIVERSE'||s.stage==='GALAXY')return s.rows[0]?{label:s.stage==='UNIVERSE'?'Enter galaxy':'Enter stellar region',run:()=>runtime.activate(s.rows[0])}:null;
 if(s.stage==='REGION')return {label:'Enter stellar neighborhood',run:()=>runtime.enterNeighborhood()};
 if(s.stage==='NEIGHBORHOOD'||s.stage==='SYSTEM')return null;
 if(s.stage==='ORBIT'&&s.world)return {label:'Approach world',run:()=>runtime.approach()};
 if(s.stage==='APPROACH')return ['GAS_GIANT','ICE_GIANT'].includes(s.world.planetology.bulkPriorClass)?{label:'Inspect atmosphere',run:()=>runtime.inspectAtmosphere()}:{label:'Descend to surface',run:()=>runtime.at(0,0)};
 const index=runtime.SURFACE.indexOf(s.stage);if(index>=0&&index<3)return {label:['','Explore region','Enter local terrain','Enter human scale'][index+1],run:()=>runtime.scale(runtime.SURFACE[index+1])};
 if(s.stage==='HUMAN'||s.stage==='LOCAL_SURFACE')return {label:'Inspect selected material',run:()=>runtime.enterMicro(),disabled:!s.selectedObjectId||['SETTLEMENT','RUIN'].includes(s.local?.objects.find(o=>o.entityId===s.selectedObjectId)?.kind)};
 const mi=runtime.REGIMES.indexOf(s.stage);if(mi>=0&&mi<3)return {label:'Enter '+title(runtime.REGIMES[mi+1]),run:()=>runtime.deeper()};return null;
}
function choices(rows,{selected=null,convert=null}={}){
 const box=el('div',null,{class:'living-choices'});
 for(const item of rows){
  let name,meta='',click;
  if(convert){({name,meta,click}=convert(item));}
  else if(item.kind==='galaxy'){name='Galaxy '+short(item.canonicalId);meta=title(item.metadata.modelProfile.morphology)+' / '+(item.metadata.modelProfile.meanAgeMyr/1000).toFixed(1)+' billion model years';click=()=>runtime.enterGalaxy(item);}
  else if(item.kind==='galactic_region'){name='Region '+short(item.entityId);meta='Sector '+['sectorX','sectorY','sectorZ'].map(k=>String(item.canonicalKey[k])).join(', ')+' / model population context';click=()=>runtime.enterRegion(item);}
  else if(item.kind==='system'){name='System '+short(item.canonicalId);meta=String(item.metadata.facts.stellarComponentCount)+' stars / '+String(item.metadata.facts.planetCount)+' worlds';click=()=>runtime.enterSystem(item);}
  else if(item.kind==='star'){name='Star '+short(item.canonicalId);meta=Number(item.metadata.facts.baselineTemperatureK).toLocaleString()+' K / '+title(item.metadata.facts.baselineEvolutionaryClass);click=()=>runtime.enterBody(item);}
  else if(item.kind==='planet'||item.kind==='moon'){name=(item.kind==='moon'?'Moon ':'World ')+short(item.canonicalId);meta=item.kind==='planet'?title(item.metadata.facts.bulkPriorClass)+' / '+Number(item.metadata.facts.baselineMassMilliEarth)/1000+' Earth masses':Number(item.metadata.facts.baselineMassMilliEarth)/1000+' Earth masses / P3 satellite';click=()=>runtime.enterBody(item);}
  else{name=title(item.kind)+' / '+item.label;meta=item.population?title(item.population.role)+' / model lineage '+short(item.population.lineageId):'Location '+short(item.location.locationIdentity);click=()=>runtime.selectObject(item.entityId);}
  const b=el('button',null,{type:'button',class:'living-choice','data-living-entity':item.canonicalId||item.entityId||item.planetIdentity||item.settlementId,'aria-pressed':String(selected===item.entityId)});b.append(el('span',name));if(meta)b.append(el('small',meta));b.addEventListener('click',()=>act(click));box.append(b);
 }
 return box;
}
function details(name,fields){const d=el('details',null,{class:'living-details'});d.append(el('summary',name));const dl=el('dl');for(const [k,v] of Object.entries(fields)){dl.append(el('dt',k),el('dd',typeof v==='object'?JSON.stringify(v):String(v)));}d.append(dl);return d;}
function stats(items){const box=el('div',null,{class:'living-stats'});for(const [k,v] of items){const x=el('div',null,{class:'living-stat'});x.append(el('span',k),el('strong',v));box.append(x);}return box;}
function coordinateForm(s){
 const form=el('form',null,{class:'living-coordinate-form'});
 const lat=el('input',null,{id:'living-lat',type:'number',min:'-90',max:'90',step:'any',required:'required'}),lon=el('input',null,{id:'living-lon',type:'number',min:'-180',max:'180',step:'any',required:'required'});
 lat.value=String((s.point?.latMicroDeg||0)/1e6);lon.value=String((s.point?.lonMicroDeg||0)/1e6);
 const a=el('label','Latitude (model body frame)',{for:lat.id}),b=el('label','Longitude',{for:lon.id});a.append(lat);b.append(lon);form.append(a,b);
 const go=el('button','Go to coordinates',{type:'submit',class:'living-button','data-living-action':'go-coordinates'});form.append(go);
 form.addEventListener('submit',e=>{e.preventDefault();act(()=>{const la=Number(lat.value),lo=Number(lon.value);if(!Number.isFinite(la)||!Number.isFinite(lo)||la< -90||la>90||lo< -180||lo>180)throw new Error('Enter latitude -90 to 90 and longitude -180 to 180.');return runtime.at(Math.round(la*1e6),Math.round(lo*1e6),{stage:runtime.SURFACE.includes(s.stage)?s.stage:'REGIONAL_SURFACE'});});});return form;
}
function renderPanel(s){
 if(!panel||!s)return;const previous=document.activeElement,focusAction=previous?.dataset?.livingAction,hadFocus=panel.contains(previous);panel.replaceChildren();
 panel.append(el('div','WAVE A / DEVELOPMENT CANDIDATE',{class:'living-eyebrow'}));
 panel.append(el('h2',s.world?title(s.world.planetology.bulkPriorClass)+' world':s.body?.kind==='star'?'Stellar context':s.stage==='UNIVERSE'?'Choose a galaxy':title(s.stage)));
 panel.append(el('span','MODEL-DERIVED WORLD / CANONICAL IDENTITIES',{class:'living-inline-authority'}));
 if(uiError)panel.append(el('p',uiError,{class:'living-error',role:'alert'}));
 const acts=el('div',null,{class:'living-actions'});acts.append(button('Back',()=>runtime.back(),{disabled:s.historyDepth===0,id:'back'}));const primary=primaryAction(s);if(primary)acts.append(button(primary.label,primary.run,{primary:true,disabled:primary.disabled,id:'deeper'}));panel.append(acts);
 if(s.world){
  const w=s.world,p=w.planetology,b=w.biology,life=b.occupancy.biosphereEstablished;
  panel.append(stats([['Mean model temperature',(p.climate.surfaceTemperatureMilliK/1000).toFixed(1)+' K'],['Modeled ocean area',(p.hydrosphere.waterAreaPpm/10000).toFixed(1)+'%']]));
  panel.append(el('p',life?'A modeled biosphere is established. Local presence depends on the selected environment.':'No modeled biosphere is established on this world. Rock, ice or atmosphere inspection remains available.'));
  panel.append(el('p',w.civilization.state==='MODELED_CIVILIZATION'?'Evolved lineage supports '+w.civilization.settlements.length+' terrain-backed settlements at model epoch '+w.civilization.epoch+'.':'No civilization is established under this world model.'));
  if(s.local){
   panel.append(el('h3','Here / '+short(s.point.locationIdentity)));
   panel.append(el('p',title(s.local.surface.material.materialFamily)+' / '+title(s.local.surface.climate.climateZone)));
   panel.append(el('p','Biome: '+title(s.local.life.local.biome||s.local.life.region.biome||'abiotic')+' / '+s.local.life.local.populations.length+' local modeled populations.'));
  }
  if(s.micro){
   panel.append(el('h3',title(s.stage)+' representation'));
   const m=s.micro.current;panel.append(el('p',title(m.status||m.structure||m.phase||'material descriptor')));
   panel.append(el('p','Source '+short(s.micro.sourceEntityId)+' / exact return location '+short(s.point.locationIdentity),{class:'living-note'}));
   if(s.stage==='ATOMIC')panel.append(el('p','Atomic coordinates are a bounded structural model. Electron orbits, particle trajectories and quantum dynamics are not asserted.',{class:'living-note'}));
  }else if(s.rows.length){panel.append(el('h3',runtime.SURFACE.includes(s.stage)?'Select an object or material':'Satellites'));panel.append(choices(s.rows,{selected:s.selectedObjectId}));}
  if(s.local&&!s.micro){
   const x=s.local.objects.find(o=>o.entityId===s.selectedObjectId);
   if(x){
    const evidence={Source:x.entityId,'Location':x.location.locationIdentity,'Authority':'MODEL_DERIVED_SIMULATION'};
    if(x.population){evidence['Ecological role']=x.population.role;evidence['Lineage']=x.population.lineageId;evidence['Morphology model']=x.morphology;evidence['Local eligibility']=s.local.life.region.state;}
    if(x.settlement){const c=O.v1CivilizationRuntime,summary=c.settlementSummary(w.civilization,x.settlement.settlementId),past=c.whatHappenedHere(w.civilization,x.settlement.settlementId);evidence['Settlement']=summary.type;evidence['Population']=summary.population;evidence['Stocks']=summary.stocks;evidence['Infrastructure']=summary.infrastructurePpm;evidence['Historical events']=past.events.map(e=>({epoch:e.epoch,type:e.type}));evidence['Archaeological layers']=past.ruins.map(e=>({epoch:e.epoch,kind:e.kind}));evidence['Canonical history admission']=false;}
    if(['ROCK','WATER','ICE'].includes(x.kind)){evidence['Material family']=s.local.surface.material.materialFamily;evidence['Hydrological phase']=s.local.surface.hydrology.surfaceState;evidence['Local temperature (mK)']=s.local.surface.climate.localMeanTemperatureMilliK;evidence['Geology']=s.local.surface.geology.province;evidence['Runoff potential (ppm)']=s.local.surface.hydrology.runoffPpm;}
    const box=details('Selected '+title(x.kind)+' evidence',evidence);box.open=true;panel.append(box);
   }
  }
  if(!s.micro&&s.local&&s.selectedObjectId&&!['SETTLEMENT','RUIN'].includes(s.local.objects.find(o=>o.entityId===s.selectedObjectId)?.kind))panel.append(button('Enter material inspection',()=>runtime.enterMicro(),{primary:true,id:'inspect-material'}));
  if(!s.micro&&!['GAS_GIANT','ICE_GIANT'].includes(p.bulkPriorClass))panel.append(coordinateForm(s));
  if(w.civilization.settlements.length&&!s.micro){
   panel.append(el('h3','Civilization / shared terrain'));
   panel.append(choices(w.civilization.settlements.slice(0,12),{convert:x=>({name:title(x.type)+' '+short(x.settlementId),meta:x.status+' / population '+x.population.toLocaleString()+' / '+(x.location.latMicroDeg/1e6).toFixed(2)+', '+(x.location.lonMicroDeg/1e6).toFixed(2),click:()=>runtime.at(x.location.latMicroDeg,x.location.lonMicroDeg,{stage:'HUMAN'})})}));
   const lab=el('label','History projection: epoch '+w.civilization.epoch,{for:'living-history'}),slider=el('input',null,{type:'range',id:'living-history',min:0,max:60,step:1});slider.value=w.civilization.epoch;slider.addEventListener('change',()=>act(()=>runtime.time(Number(slider.value))));panel.append(lab,slider);
   panel.append(el('p','History projection is separate from committed P4 history. Moving this control does not write canonical events.',{class:'living-note'}));
  }
  panel.append(details('World evidence and limitations',{'Canonical body':w.planetIdentity,'Body context':w.bodyContext.kind,'Formation':p.causal.formation.formationZone,'Interior':p.interior.geodynamicRegime,'Atmosphere':p.atmosphere.compositionFamily,'Climate':p.climate.climateRegime,'Geology':p.geology.tectonicStyle,'Composition (ppm)':{metal:p.composition.metalPpm,silicate:p.composition.silicatePpm,ice:p.composition.icePpm,lightVolatile:p.composition.lightVolatilePpm},'Evolution generation':b.ecosystem.generation,'Biosphere':b.occupancy.state,'Canonical P6':'UNCHANGED - model biology is not P6 evidence','Geometry':'Reduced-order model, not measured elevation','Moon assumptions':w.bodyContext.kind==='MOON'?w.bodyContext:'Not applicable'}));
 }else{
  panel.append(el('p',s.stage==='UNIVERSE'?'Every selectable galaxy resolves through P3. Galaxy shape and screen positions are model/presentation encodings.':'Select directly in the viewport or use the list. Discovery is paginated; empty pages do not mean the universe ends.'));
  if(s.body?.kind==='star')panel.append(details('Canonical stellar facts',s.body.metadata.facts));
  if(s.rows.length)panel.append(choices(s.rows));
 }
 if(['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD'].includes(s.stage)){
  const d=el('div',null,{class:'living-actions'});d.append(button('Next page',()=>runtime.nextPage(),{disabled:s.page?.nextCursor==null,id:'next-page'}),button('Next spatial window',()=>runtime.nextWindow(),{id:'next-window'}));panel.append(d);
 }
 if(s.system&&!s.micro){
  panel.append(el('h3','Survey nearby modeled worlds'));
  const select=el('select',null,{id:'living-search-goal','aria-label':'Nearby world survey goal'});
  for(const [value,label] of [['CIVILIZATION','Civilization-bearing worlds'],['BIOSPHERE','Living worlds'],['STERILE','Worlds without life'],['ANY','All world classes']]){const option=el('option',label,{value});option.selected=search.goal===value;select.append(option);}
  select.addEventListener('change',()=>{search={...search,goal:select.value,cursor:null,rows:[],worlds:0,pages:0};});panel.append(select);
  const a=el('div',null,{class:'living-actions'});a.append(button(search.running?'Surveying...':search.pages?'Continue survey':'Begin bounded survey',()=>survey(),{disabled:search.running,primary:false,id:'survey'}));if(search.running)a.append(button('Cancel survey',()=>{search.generation++;search.running=false;renderPanel(runtime.snapshot());},{id:'cancel-survey'}));panel.append(a);
  panel.append(el('div',search.running?'Scanning real neighboring systems...':search.pages?search.worlds+' modeled worlds examined across '+search.pages+' bounded pages.':'No preselected showcase worlds are used.',{id:'living-search-progress',role:'status'}));
  const result=el('div',null,{id:'living-search-results'});result.append(choices(search.rows,{convert:x=>({name:'World '+short(x.planetIdentity),meta:(x.surfaceTemperatureMilliK/1000).toFixed(1)+' K / '+title(x.biologyState)+' / '+title(x.civilizationState),click:()=>runtime.enterKey(x.canonicalKey)})}));panel.append(result);
 }
 panel.append(el('p','Canonical astronomy and history remain distinct from these model-derived worlds. Visual symbols do not add scientific evidence.',{class:'living-note'}));
 if(hadFocus){const target=focusAction?[...panel.querySelectorAll('button')].find(b=>b.dataset.livingAction===focusAction):null;(target&&!target.disabled?target:canvas).focus({preventScroll:true});}
}
function drawChrome(s){
 heading.textContent=s.world?(s.world.bodyContext.kind==='MOON'?'Moon ':'World ')+short(s.world.planetIdentity):s.body?.kind==='star'?'Star '+short(s.body.canonicalId):s.stage==='UNIVERSE'?'One living universe':title(s.stage)+' / '+short(s.node.canonicalId||s.node.entityId);
 location.textContent=s.point?(s.point.latMicroDeg/1e6).toFixed(6)+' deg / '+(s.point.lonMicroDeg/1e6).toFixed(6)+' deg / '+title(s.stage):'Canonical identity retained / '+title(s.stage);
 breadcrumbs.replaceChildren();const trail=[['UNIVERSE','Universe',true],['GALAXY','Galaxy '+short(s.galaxy?.canonicalId),s.galaxy],['REGION','Region',s.region],['SYSTEM','System '+short(s.system?.canonicalId),s.system],['ORBIT','World '+short(s.body?.canonicalId),s.body]];
 for(const [scale,label,ok] of trail){if(!ok)continue;const b=el('button',label,{type:'button'});b.addEventListener('click',()=>act(()=>runtime.scale(scale)));if(breadcrumbs.children.length)breadcrumbs.append(el('span',' / '));breadcrumbs.append(b);}
 rail.replaceChildren();const labels={UNIVERSE:'Universe',GALAXY:'Galaxy',REGION:'Region',NEIGHBORHOOD:'Stars',SYSTEM:'System',ORBIT:'Orbit',APPROACH:'Approach',GLOBAL_SURFACE:'Surface',REGIONAL_SURFACE:'Regional',LOCAL_SURFACE:'Local',HUMAN:'Human'};
 for(const [scale,label] of Object.entries(labels)){const b=el('button',label,{type:'button','data-living-scale':scale,'aria-pressed':s.stage===scale});b.disabled=scale==='GALAXY'?!s.galaxy:['REGION','NEIGHBORHOOD'].includes(scale)?!s.region:scale==='SYSTEM'?!s.system:scale==='ORBIT'?!s.body:['APPROACH',...runtime.SURFACE].includes(scale)?!s.world||runtime.SURFACE.includes(scale)&&['GAS_GIANT','ICE_GIANT'].includes(s.world.planetology.bulkPriorClass):false;b.addEventListener('click',()=>act(()=>runtime.scale(scale)));rail.append(b);}
 const m=el('button',s.micro?title(s.stage):'Micro',{type:'button','data-living-scale':'MICRO','aria-pressed':!!s.micro});m.disabled=!s.local||!s.selectedObjectId||!!s.micro;m.addEventListener('click',()=>act(()=>runtime.enterMicro()));rail.append(m);
 stage.dataset.stage=s.stage;stage.dataset.worldIdentity=s.world?.planetIdentity||'';stage.dataset.locationIdentity=s.point?.locationIdentity||'';
}
function change(s){
 const context=s.system?.canonicalId||null;if(search.running&&search.context!==context){search.generation++;search.running=false;}
 if(search.context!==context){search={...search,cursor:null,rows:[],worlds:0,pages:0,context};}
 drawChrome(s);renderPanel(s);stopLegacy();pending=renderer.render(s).catch(fail);
}
async function survey(){
 if(search.running)return;const generation=++search.generation,context=runtime.snapshot().system?.canonicalId;search.running=true;search.context=context;renderPanel(runtime.snapshot());
 try{
  // At most 24 pages per interaction; yield after every page and preserve the exact continuation cursor.
  for(let i=0;i<24;i++){
   await new Promise(r=>setTimeout(r,0));if(search.generation!==generation||context!==runtime.snapshot().system?.canonicalId)break;
   const out=runtime.searchWorlds({goal:search.goal,cursor:search.cursor,maxWorlds:12,maxSystemQueries:128,limit:6});
   search.worlds+=out.worldsEvaluated;search.pages++;search.cursor=out.nextCursor;
   for(const row of out.candidates)if(!search.rows.some(r=>r.planetIdentity===row.planetIdentity))search.rows.push(row);
   search.rows=search.rows.slice(0,12);renderPanel(runtime.snapshot());
   if(out.candidates.length||out.nextCursor===null)break;
  }
 }catch(e){fail(e);}finally{if(search.generation===generation){search.running=false;renderPanel(runtime.snapshot());}}
 return {pages:search.pages,worlds:search.worlds,rows:search.rows,cursor:search.cursor};
}
function bindInputs(){
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{e.stopPropagation();canvas.focus({preventScroll:true});drag={x:e.offsetX,y:e.offsetY,lastX:e.offsetX,lastY:e.offsetY,moved:false,pointer:e.pointerId};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;e.stopPropagation();const dx=e.offsetX-drag.lastX,dy=e.offsetY-drag.lastY;if(Math.hypot(e.offsetX-drag.x,e.offsetY-drag.y)>5)drag.moved=true;const s=runtime.snapshot();if(drag.moved&&s.world&&['ORBIT','APPROACH'].includes(s.stage))renderer.rotate(dx,dy);drag.lastX=e.offsetX;drag.lastY=e.offsetY;});
 canvas.addEventListener('pointerup',e=>{if(!drag)return;e.stopPropagation();const moved=drag.moved;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(!moved)act(()=>renderer.activateAt(e.offsetX,e.offsetY));});
 canvas.addEventListener('pointercancel',()=>{drag=null;});
 let wheelAt=0;canvas.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();const now=performance.now();if(now-wheelAt<300)return;wheelAt=now;act(()=>{const s=runtime.snapshot();if(e.deltaY>0)runtime.back();else{const a=primaryAction(s);if(a&&!a.disabled)a.run();}});},{passive:false});
 root.addEventListener('keydown',e=>{
  if(document.activeElement!==canvas)return;
  if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();act(()=>runtime.back());}
  else if(e.key==='+'||e.key==='='||e.key==='-'||e.key==='Home'){e.preventDefault();e.stopImmediatePropagation();act(()=>{if(e.key==='Home')runtime.scale('UNIVERSE');else if(e.key==='-')runtime.back();else{const a=primaryAction(runtime.snapshot());if(a&&!a.disabled)a.run();}});}
  else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();act(()=>renderer.keyboard(e.key));}
 },true);
 const resize=()=>{stopLegacy();pending=renderer.render(runtime.snapshot()).catch(fail);};
 if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(()=>requestAnimationFrame(resize));ro.observe(canvas.parentElement);}else root.addEventListener('resize',resize);
}
function init(){
 if(initialized)return;
 const P=root.__OFU_PLANET_PREVIEW__,frame=document.querySelector('.viewport-frame'),explore=document.querySelector('[data-workspace-panel="explore"]');
 if(!P?.ctx||!P?.chosen?.key||!O.v1LivingRuntime||!O.v1LivingRenderer||!frame||!explore)return false;
 initialized=true;document.body.classList.add('wave-a-active');
 panel=el('section',null,{id:'living-panel','aria-label':'Living universe exploration'});explore.prepend(panel);
 stage=el('section',null,{id:'living-stage','aria-label':'Living universe viewport'});frame.append(stage);
 const top=el('header',null,{id:'living-titlebar'}),info=el('div');info.append(el('div','ONE FILE UNIVERSE / WAVE A',{class:'living-eyebrow'}));heading=el('h2','One living universe',{id:'living-heading'});location=el('div','',{id:'living-location'});info.append(heading,location);top.append(info);stage.append(top);
 breadcrumbs=el('nav',null,{id:'living-breadcrumbs','aria-label':'Current universe context'});stage.append(breadcrumbs);
 const wrap=el('div',null,{id:'living-canvas-wrap'}),gl=el('canvas',null,{id:'living-gl','aria-hidden':'true'});gl.hidden=true;canvas=el('canvas','Use the adjacent controls to explore without canvas.',{id:'living-view',tabindex:0,'aria-label':'Interactive living universe. Select objects, drag worlds, or use adjacent controls.'});wrap.append(gl,canvas);stage.append(wrap);
 rail=el('nav',null,{id:'living-rail','aria-label':'Cross-scale exploration'});stage.append(rail);frame.closest('.viewport-shell').setAttribute('aria-labelledby','living-heading');
 runtime=O.v1LivingRuntime.create({ctx:P.ctx,key:P.chosen.key,onCanonicalSelection:key=>O.v08SelectionBridge.selectPlanet(key,{announce:false}),galaxySource:()=>{const s=O.waveIVMacroProvider.getScene({scale:'GALAXY',ctx:P.ctx,canonicalKey:P.chosen.key,selectedOrbitSlot:P.chosen.key.orbitSlot});return s.objects.filter(o=>o.kind==='GALAXY'&&o.canonicalKey).map(o=>o.canonicalKey);}});
 renderer=O.v1LivingRenderer.create(canvas,gl,{onActivate:n=>act(()=>runtime.activate(n)),onPoint:(p,extra)=>act(()=>pointAction(p,extra)),onObject:id=>act(()=>runtime.selectObject(id))});
 runtime.onChange(change);bindInputs();change(runtime.snapshot());
 O.v1LivingProduct=Object.freeze({VERSION,runtime,renderer,survey,snapshot(){return {version:VERSION,initialized,stage:runtime.snapshot().stage,render:renderer.state(),uiError,search:{goal:search.goal,cursor:search.cursor,pages:search.pages,worlds:search.worlds,running:search.running,results:search.rows.length},foregroundOwner:'WAVE_A_LIVING_VIEWPORT',canonicalMutation:false};},ready:()=>pending,clearError(){uiError=null;renderPanel(runtime.snapshot());}});
 return true;
}
let attempts=0;function boot(){try{if(init())return;if(++attempts<100)setTimeout(boot,50);else console.error('Wave A startup prerequisites did not become ready');}catch(e){console.error('Wave A startup failed',e);const target=document.querySelector('[data-workspace-panel="explore"]');if(target)target.prepend(el('p','Living-universe startup failed: '+String(e.message),{class:'living-error',role:'alert'}));}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})(globalThis);
