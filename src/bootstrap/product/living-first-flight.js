(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-first-flight-1',STORAGE_KEY='ofu:v11:living-first-flight:1',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,ready:false,attachStatus:'waiting',attachAttempts:0,storage:'memory',dismissed:false,completed:false,decorations:0,progressUpdates:0};
let runtime=null,panel=null,observer=null,scheduled=false,lastProgress='';
function store(){try{const s=root.localStorage,k='__ofu_living_first_flight_probe__';s.setItem(k,'1');s.removeItem(k);state.storage='localStorage';return s}catch{return null}}
const storage=store();
function load(){if(!storage)return;try{const x=JSON.parse(storage.getItem(STORAGE_KEY)||'{}');state.dismissed=x.dismissed===true;state.completed=x.completed===true}catch{}}
function save(){if(!storage)return;try{storage.setItem(STORAGE_KEY,JSON.stringify({version:1,dismissed:state.dismissed,completed:state.completed}))}catch{state.storage='memory'}}
function progress(s){const stage=String(s?.stage||'UNIVERSE'),surface=Array.isArray(runtime?.SURFACE)&&runtime.SURFACE.includes(stage),micro=Array.isArray(runtime?.REGIMES)&&runtime.REGIMES.includes(stage);return Object.freeze({started:stage!=='UNIVERSE',world:!!s?.body,surface:surface||micro})}
function remove(){document.getElementById('living-first-flight')?.remove()}
function dismiss(){state.dismissed=true;save();remove();O.productUI?.announce?.('First flight guide dismissed')}
function makeStep(id,text,done){const li=document.createElement('li');li.dataset.livingFirstFlightStep=id;li.dataset.complete=done?'true':'false';li.setAttribute('aria-label',(done?'Completed: ':'Not completed: ')+text);li.textContent=(done?'✓ ':'○ ')+text;return li}
function render(){
 if(!runtime||!panel)return false;const s=runtime.snapshot(),p=progress(s),stamp=JSON.stringify(p);if(stamp!==lastProgress){lastProgress=stamp;state.progressUpdates++}
 if(p.started&&p.world&&p.surface&&!state.completed){state.completed=true;save();O.productUI?.announce?.('First flight complete')}
 if(state.dismissed||state.completed){remove();state.ready=true;return true}
 let box=document.getElementById('living-first-flight');if(!box){box=document.createElement('aside');box.id='living-first-flight';box.className='living-note';box.setAttribute('aria-labelledby','living-first-flight-title');box.dataset.livingProductState='LOCAL_SESSION_ONLY';state.decorations++}
 box.replaceChildren();const title=document.createElement('strong');title.id='living-first-flight-title';title.textContent='First flight';const copy=document.createElement('p');copy.textContent='Choose a galaxy, reach a world, then move from orbit toward its surface. This guide tracks only your local product progress; it never changes scientific or canonical state.';const list=document.createElement('ol');list.append(makeStep('started','Enter a galaxy',p.started),makeStep('world','Reach a world',p.world),makeStep('surface','Move to a surface scale',p.surface));const actions=document.createElement('div');actions.className='living-actions';const close=document.createElement('button');close.type='button';close.className='living-button';close.dataset.livingFirstFlightDismiss='';close.textContent='Got it';close.addEventListener('click',dismiss);actions.append(close);box.append(title,copy,list,actions);
 const anchor=panel.querySelector('.living-actions');if(anchor)panel.insertBefore(box,anchor);else panel.append(box);state.ready=true;return true
}
function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(()=>{scheduled=false;render()})}
function attach(){state.attachAttempts++;const product=O.v1LivingProduct,next=document.getElementById('living-panel');if(!product?.runtime||!next){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(attach,50);return}runtime=product.runtime;panel=next;state.attachStatus='attached';runtime.onChange?.(schedule);observer=new MutationObserver(schedule);observer.observe(panel,{childList:true,subtree:true});render()}
load();const api=Object.freeze({VERSION,STORAGE_KEY,MAX_ATTACH_ATTEMPTS,state,progress,render,dismiss,snapshot:()=>Object.freeze({...state,progress:runtime?progress(runtime.snapshot()):null})});O.v11LivingFirstFlight=api;root.__OFU_LIVING_FIRST_FLIGHT__=api;attach();
})(typeof globalThis!=='undefined'?globalThis:this);
