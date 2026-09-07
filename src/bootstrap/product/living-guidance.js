(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-guidance-1',STORAGE_KEY='ofu:v11:living-guidance:1',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,ready:false,attachStatus:'waiting',attachAttempts:0,storage:'memory',dismissed:false,completed:false,progress:{started:false,world:false,surface:false},guideOpen:false,decorations:0,progressUpdates:0,guideOpens:0,mobileExpands:0,mobileFirstFlightExpands:0,mobileFirstFlightOffered:false};
let runtime=null,panel=null,observer=null,scheduled=false,lastProgress='';
function storageProbe(){try{const s=root.localStorage,k='__ofu_living_guidance_probe__';s.setItem(k,'1');s.removeItem(k);state.storage='localStorage';return s}catch{return null}}
const storage=storageProbe();
function normalizedProgress(value){const p=value&&typeof value==='object'?value:{};return{started:p.started===true,world:p.world===true,surface:p.surface===true}}
function load(){if(!storage)return;try{const x=JSON.parse(storage.getItem(STORAGE_KEY)||'{}');state.dismissed=x.dismissed===true;state.completed=x.completed===true;state.progress=normalizedProgress(x.progress)}catch{}}
function save(){if(!storage)return;try{storage.setItem(STORAGE_KEY,JSON.stringify({version:2,dismissed:state.dismissed,completed:state.completed,progress:state.progress}))}catch{state.storage='memory'}}
function observedProgress(s){const stage=String(s?.stage||'UNIVERSE'),surface=Array.isArray(runtime?.SURFACE)&&runtime.SURFACE.includes(stage),micro=Array.isArray(runtime?.REGIMES)&&runtime.REGIMES.includes(stage);return{started:stage!=='UNIVERSE',world:!!s?.world||!!s?.body&&['planet','moon'].includes(String(s.body.kind||'').toLowerCase()),surface:surface||micro}}
function progress(s){const observed=observedProgress(s);return Object.freeze({started:state.progress.started||observed.started,world:state.progress.world||observed.world,surface:state.progress.surface||observed.surface})}
function coarseInput(){try{return root.matchMedia?.('(pointer: coarse)')?.matches===true||Number(root.navigator?.maxTouchPoints||0)>0}catch{return false}}
function makeStep(id,text,done){const li=document.createElement('li');li.dataset.livingGuidanceStep=id;li.dataset.complete=done?'true':'false';li.setAttribute('aria-label',(done?'Completed: ':'Not completed: ')+text);li.textContent=(done?'✓ ':'○ ')+text;return li}
function primaryActions(){return panel?[...panel.children].find(node=>node.classList?.contains('living-actions'))||null:null}
function removeFirstFlight(){document.getElementById('living-first-flight')?.remove()}
function dismiss(){state.dismissed=true;save();removeFirstFlight();O.productUI?.announce?.('First flight guide dismissed');schedule()}
function ensureGuideVisible(){const mobile=O.v08MobileInteraction;if(!state.guideOpen||!mobile?.state?.active||mobile.state.sheet==='expanded'||typeof mobile.expand!=='function')return false;mobile.expand();state.mobileExpands++;return true}
function ensureFirstFlightVisible(){
 const box=document.getElementById('living-first-flight'),mobile=O.v08MobileInteraction;if(state.mobileFirstFlightOffered||!box||state.dismissed||state.completed||state.progress.started||!mobile?.state?.active)return false;
 state.mobileFirstFlightOffered=true;if(mobile.state.sheet==='expanded'||typeof mobile.expand!=='function')return false;mobile.expand();state.mobileFirstFlightExpands++;return true
}
function toggleGuide(force){const next=typeof force==='boolean'?force:!state.guideOpen;if(next===state.guideOpen){if(next)ensureGuideVisible();return}state.guideOpen=next;if(next){state.guideOpens++;ensureGuideVisible()}schedule();O.productUI?.announce?.(next?'Exploration controls opened':'Exploration controls closed')}
function ensureControlButton(){
 const actions=primaryActions();if(!actions)return null;let button=actions.querySelector('[data-living-guidance-toggle]');
 if(!button){button=document.createElement('button');button.type='button';button.className='living-button';button.textContent='Controls';button.dataset.livingGuidanceToggle='';button.setAttribute('aria-controls','living-controls-guide');button.setAttribute('aria-keyshortcuts','?');button.addEventListener('click',()=>toggleGuide());actions.append(button);state.decorations++}
 button.setAttribute('aria-expanded',state.guideOpen?'true':'false');button.setAttribute('aria-label',state.guideOpen?'Close exploration controls':'Open exploration controls');return button
}
function renderFirstFlight(p,stamp,anchor){
 if(state.dismissed||state.completed){removeFirstFlight();return}
 let box=document.getElementById('living-first-flight');if(box?.dataset.progress===stamp)return;
 if(!box){box=document.createElement('aside');box.id='living-first-flight';box.className='living-note';box.setAttribute('aria-labelledby','living-first-flight-title');box.dataset.livingProductState='LOCAL_SESSION_ONLY';state.decorations++}
 box.dataset.progress=stamp;box.replaceChildren();const title=document.createElement('strong');title.id='living-first-flight-title';title.textContent='First flight';const copy=document.createElement('p');copy.textContent='Choose a galaxy, reach a world, then move from orbit toward its surface. Progress here is local product state only; it never changes scientific or canonical state.';const list=document.createElement('ol');list.append(makeStep('started','Enter a galaxy',p.started),makeStep('world','Reach a world',p.world),makeStep('surface','Move to a surface scale',p.surface));const actions=document.createElement('div');actions.className='living-actions';const close=document.createElement('button');close.type='button';close.className='living-button';close.dataset.livingGuidanceDismiss='';close.textContent='Got it';close.addEventListener('click',dismiss);actions.append(close);box.append(title,copy,list,actions);panel.insertBefore(box,anchor||panel.firstChild)
}
function renderGuide(anchor){
 let guide=document.getElementById('living-controls-guide');if(!state.guideOpen){guide?.remove();return}
 const signature=coarseInput()?'coarse':'fine';if(guide?.dataset.guidanceSignature===signature)return;
 if(!guide){guide=document.createElement('section');guide.id='living-controls-guide';guide.className='living-note';guide.setAttribute('aria-labelledby','living-controls-guide-title');guide.dataset.livingProductState='PRESENTATION_ONLY';state.decorations++}
 guide.dataset.guidanceSignature=signature;guide.replaceChildren();const title=document.createElement('strong');title.id='living-controls-guide-title';title.textContent='Exploration controls';const intro=document.createElement('p');intro.textContent=signature==='coarse'?'Tap to select, drag to rotate, and pinch to move through scale.':'Click to select, drag to rotate, and use the wheel to move through scale.';const list=document.createElement('ul');for(const text of ['Use the scale rail and contextual action buttons to move between universe, systems, worlds, surfaces and microscopic representations.','With the Living viewport focused: [ goes Back, ] goes Forward, +/- changes scale, arrow keys move selection, Enter activates, and Home returns to Universe.','Survey results are model-derived simulations anchored to canonical identities; opening one does not promote modeled biology or civilization to canonical truth.']){const li=document.createElement('li');li.textContent=text;list.append(li)}const actions=document.createElement('div');actions.className='living-actions';const close=document.createElement('button');close.type='button';close.className='living-button';close.textContent='Close controls';close.dataset.livingGuidanceClose='';close.addEventListener('click',()=>toggleGuide(false));actions.append(close);guide.append(title,intro,list,actions);if(anchor?.nextSibling)panel.insertBefore(guide,anchor.nextSibling);else panel.append(guide)
}
function render(){
 if(!runtime||!panel)return false;const s=runtime.snapshot(),p=progress(s),nextProgress={started:p.started,world:p.world,surface:p.surface};if(nextProgress.started!==state.progress.started||nextProgress.world!==state.progress.world||nextProgress.surface!==state.progress.surface){state.progress=nextProgress;state.progressUpdates++;save()}const stamp=JSON.stringify(state.progress);if(stamp!==lastProgress)lastProgress=stamp;
 if(state.progress.started&&state.progress.world&&state.progress.surface&&!state.completed){state.completed=true;save();removeFirstFlight();O.productUI?.announce?.('First flight complete')}
 if(state.guideOpen)ensureGuideVisible();const control=ensureControlButton(),anchor=control?.closest('.living-actions')||primaryActions();renderFirstFlight(state.progress,stamp,anchor);ensureFirstFlightVisible();renderGuide(anchor);state.ready=true;return true
}
function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(()=>{scheduled=false;render()})}
function onKeydown(event){if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;const tag=event.target?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||event.target?.isContentEditable)return;if(event.key==='?'){event.preventDefault();toggleGuide()}}
function attach(){state.attachAttempts++;const product=O.v1LivingProduct,next=document.getElementById('living-panel');if(!product?.runtime||!next){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(attach,50);return}runtime=product.runtime;panel=next;state.attachStatus='attached';runtime.onChange?.(schedule);observer=new MutationObserver(schedule);observer.observe(panel,{childList:true,subtree:true});render()}
load();root.addEventListener('keydown',onKeydown,false);root.addEventListener('resize',schedule,{passive:true});const api=Object.freeze({VERSION,STORAGE_KEY,MAX_ATTACH_ATTEMPTS,state,progress,render,dismiss,toggleGuide,snapshot:()=>Object.freeze({...state,progress:runtime?progress(runtime.snapshot()):Object.freeze({...state.progress}),input:coarseInput()?'coarse':'fine'})});O.v11LivingGuidance=api;root.__OFU_LIVING_GUIDANCE__=api;attach();
})(typeof globalThis!=='undefined'?globalThis:this);
