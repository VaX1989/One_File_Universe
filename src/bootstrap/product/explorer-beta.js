(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const C=O.v09ExplorerCore;if(!C)throw new Error('v0.9 explorer core unavailable');
const q=id=>document.getElementById(id),STORAGE_KEY='ofu:v09:explorer-session:1',DISCOVERY_LIMIT=3,RECENT_LIMIT=5,BOOKMARK_LIMIT=6;
let session=loadSession(),lastToken=null,lastStamp='',syncTimer=null;
const state={seamVersion:1,ready:false,lastSelectionToken:null,lastAction:null,storage:'memory',syncs:0};
function storage(){try{const s=root.localStorage,k='__ofu_v09_probe__';s.setItem(k,'1');s.removeItem(k);state.storage='localStorage';return s}catch{state.storage='memory';return null}}
const store=storage();
function loadSession(){try{const raw=root.localStorage?.getItem(STORAGE_KEY);return C.normalizeSession(raw?JSON.parse(raw):{})}catch{return C.normalizeSession()}}
function save(){if(!store)return;try{store.setItem(STORAGE_KEY,JSON.stringify(session))}catch{state.storage='memory'}}
function setText(id,value){const node=q(id);if(node)node.textContent=value==null?'':String(value)}
function human(value){return String(value||'').toLowerCase().replace(/(^|_)([a-z])/g,(_,space,c)=>(space?' ':'')+c.toUpperCase())}
function currentContext(){const P=root.__OFU_PLANET_PREVIEW__,A=O.p3Astronomy;return P?.ctx&&A?{P,A}:null}
function resolveSnapshot(token){
 const ctx=currentContext();if(!ctx||!token)return null;
 try{const key=C.parsePlanetKey(token),planet=ctx.A.resolvePlanet(ctx.P.ctx,key);if(planet?.status!=='PRESENT')return null;const systemKey=Object.fromEntries(C.SYSTEM_FIELDS.map(name=>[name,key[name]])),system=ctx.A.resolveSystem(ctx.P.ctx,systemKey),total=system?.status==='PRESENT'?Number(system.facts.planetCount):Math.max(1,Number(key.orbitSlot)+1);return C.planetSnapshot(planet,key,Number(key.orbitSlot),total)}catch{return null}
}
function selectedSnapshot(){const nav=O.v08ExploreNavigation,target=nav?.state?.targets?.[nav.state.selectedIndex];if(!target?.key)return null;try{return resolveSnapshot(C.serializePlanetKey(target.key))}catch{return null}}
function systemDisplay(snapshot){return snapshot?C.systemLabel(session,snapshot.systemToken):'Current system'}
function worldDisplay(snapshot){return snapshot?systemDisplay(snapshot)+' · '+snapshot.title:'Saved world'}
function currentSystemSnapshots(){
 const targets=O.v08ExploreNavigation?.state?.targets||[],out=[];for(const target of targets){try{const snap=resolveSnapshot(C.serializePlanetKey(target.key));if(snap)out.push(snap)}catch{}}return out;
}
function makeButton(snapshot,{reason='',className='beta-world-card'}={}){const button=document.createElement('button');button.type='button';button.className=className;button.dataset.betaOpen=snapshot.token;const title=document.createElement('strong');title.textContent=worldDisplay(snapshot);const copy=document.createElement('span');copy.textContent=reason||snapshot.summary;button.append(title,copy);return button}
function renderList(id,tokens,limit,emptyCopy){const list=q(id);if(!list)return;list.textContent='';let shown=0;for(const token of tokens){if(shown>=limit)break;const snap=resolveSnapshot(token);if(!snap)continue;const li=document.createElement('li');li.append(makeButton(snap));list.append(li);shown++}if(!shown){const li=document.createElement('li');li.className='beta-empty';li.textContent=emptyCopy;list.append(li)}}
function renderOrientation(snapshot){
 if(!snapshot)return;
 const nav=O.v08ExploreNavigation,system=nav?.state?.system,star=nav?.state?.star,count=nav?.state?.targets?.length||snapshot.orbitTotal,starClass=star?.facts?.baselineEvolutionaryClass?human(star.facts.baselineEvolutionaryClass):'host star';
 setText('beta-breadcrumb-system',systemDisplay(snapshot));setText('beta-breadcrumb-world',snapshot.title);setText('beta-current-system',systemDisplay(snapshot));setText('beta-current-world',snapshot.title);
 setText('beta-orientation-copy',systemDisplay(snapshot)+' contains '+String(count)+' '+(count===1?'world':'worlds')+' in canonical orbit order around a '+starClass.toLowerCase()+' host. You are looking at '+snapshot.title+'.');
 const host=system?.facts?.stellarComponentCount===1n?'Single-star host':system?.facts?.stellarComponentCount?String(system.facts.stellarComponentCount)+'-star host':'Host context available';setText('beta-host-context',host+' · '+starClass);
}
function renderDiscovery(snapshot){const list=q('beta-discovery-list');if(!list)return;list.textContent='';const candidates=currentSystemSnapshots().filter(item=>item.token!==snapshot.token).sort((a,b)=>C.differenceScore(b,snapshot)-C.differenceScore(a,snapshot)).slice(0,DISCOVERY_LIMIT);if(!candidates.length){const li=document.createElement('li');li.className='beta-empty';li.textContent='No other world is present in this system.';list.append(li);return}for(const candidate of candidates){const li=document.createElement('li'),reason=C.differenceSummary(candidate,snapshot);li.append(makeButton(candidate,{reason}));list.append(li)}}
function renderSelected(snapshot){
 setText('beta-why-look',snapshot.summary+'.');const previous=resolveSnapshot(session.previous);setText('beta-difference-copy',previous&&previous.token!==snapshot.token?'Compared with your previous world: '+C.differenceSummary(snapshot,previous):'Choose another world and this space will explain the strongest supported differences.');
 const bookmark=q('beta-bookmark'),pin=q('beta-pin'),back=q('beta-back');if(bookmark){const active=session.bookmarks.includes(snapshot.token);bookmark.setAttribute('aria-pressed',active?'true':'false');bookmark.textContent=active?'Bookmarked':'Bookmark world'}if(pin){const active=session.pinned===snapshot.token;pin.setAttribute('aria-pressed',active?'true':'false');pin.textContent=active?'Pinned for compare':'Pin for compare'}if(back)back.disabled=!session.previous||session.previous===snapshot.token;
}
function renderComparison(snapshot){
 const pinned=resolveSnapshot(session.pinned),body=q('beta-compare-body');if(!body)return;body.textContent='';
 if(!pinned){setText('beta-compare-copy','Pin a world, then keep exploring. Compare will use only shared baseline facts.');return}
 if(pinned.token===snapshot.token){setText('beta-compare-copy',worldDisplay(snapshot)+' is pinned. Select another world to compare it.');return}
 setText('beta-compare-copy',worldDisplay(snapshot)+' compared with pinned '+worldDisplay(pinned)+'. '+C.differenceSummary(snapshot,pinned));
 for(const row of C.comparisonRows(snapshot,pinned)){const tr=document.createElement('tr'),th=document.createElement('th'),left=document.createElement('td'),right=document.createElement('td');th.scope='row';th.textContent=row.label;left.textContent=row.label==='System'?systemDisplay(snapshot):row.left;right.textContent=row.label==='System'?systemDisplay(pinned):row.right;tr.append(th,left,right);body.append(tr)}
 setText('beta-compare-current-name',worldDisplay(snapshot));setText('beta-compare-pinned-name',worldDisplay(pinned));
}
function renderSession(){renderList('beta-recent-list',session.recent.filter(token=>token!==session.current),RECENT_LIMIT,'Your recent destinations will appear here as you explore.');renderList('beta-bookmark-list',session.bookmarks,BOOKMARK_LIMIT,'Bookmark a world to keep it available in this local exploration session.')}
function renderOnboarding(){const box=q('beta-first-flight');if(!box)return;const complete=session.progress.selected&&session.progress.approached&&session.progress.inspected;box.hidden=session.onboardingDismissed||complete;for(const name of ['selected','approached','inspected']){const item=q('beta-step-'+name);if(item){const done=session.progress[name];item.dataset.complete=done?'true':'false';item.setAttribute('aria-label',(done?'Completed: ':'Not completed: ')+item.textContent.trim())}}}
function render(snapshot){renderOrientation(snapshot);renderDiscovery(snapshot);renderSelected(snapshot);renderComparison(snapshot);renderSession();renderOnboarding();setText('beta-session-note',state.storage==='localStorage'?'Recent destinations, bookmarks and comparison pin stay on this device. They are product state, not astronomical facts.':'Session state is temporary in this browser context and never becomes astronomical data.');state.ready=true}
function sync(){
 const snapshot=selectedSnapshot();if(!snapshot)return;const stamp=[snapshot.token,session.previous,session.pinned,session.bookmarks.join('|'),session.recent.join('|'),JSON.stringify(session.progress),session.onboardingDismissed,state.storage].join('::');
 if(snapshot.token!==lastToken){session=C.recordVisit(session,snapshot.token);lastToken=snapshot.token;state.lastSelectionToken=snapshot.token;save()}
 const nextStamp=[snapshot.token,session.previous,session.pinned,session.bookmarks.join('|'),session.recent.join('|'),JSON.stringify(session.progress),session.onboardingDismissed,state.storage].join('::');if(nextStamp===lastStamp)return;lastStamp=nextStamp;state.syncs++;render(snapshot)
}
function openToken(token,{collapse=true}={}){
 try{const key=C.parsePlanetKey(token),bridge=O.v08SelectionBridge;if(!bridge?.selectPlanet)throw new Error('selection bridge unavailable');bridge.selectPlanet(key,{announce:false});session=C.markProgress(session,'selected');save();state.lastAction='open-saved-target';O.v08ExploreNavigation?.sync?.();sync();O.productUI?.announce?.('Opened '+worldDisplay(resolveSnapshot(token)));if(collapse&&O.v08MobileInteraction?.state?.active)O.v08MobileInteraction.collapse();return true}catch(error){O.productUI?.announce?.('Saved destination could not be opened safely');state.lastAction='open-failed:'+String(error?.message||error);return false}
}
function mark(name){session=C.markProgress(session,name);save();lastStamp='';sync()}
function onClick(event){
 const open=event.target.closest?.('[data-beta-open]');if(open){openToken(open.dataset.betaOpen);return}
 if(event.target.closest?.('[data-beta-back]')){if(session.previous)openToken(session.previous);return}
 if(event.target.closest?.('[data-beta-bookmark]')){const snap=selectedSnapshot();if(snap){session=C.toggleBookmark(session,snap.token);save();lastStamp='';sync();O.productUI?.announce?.(session.bookmarks.includes(snap.token)?'World bookmarked':'Bookmark removed')}return}
 if(event.target.closest?.('[data-beta-pin]')){const snap=selectedSnapshot();if(snap){session=C.togglePin(session,snap.token);save();lastStamp='';sync();O.productUI?.announce?.(session.pinned===snap.token?'World pinned for comparison':'Comparison pin removed')}return}
 if(event.target.closest?.('[data-beta-dismiss-onboarding]')){session=C.dismissOnboarding(session);save();lastStamp='';sync();return}
 if(event.target.closest?.('[data-explore-target]')){mark('selected');root.setTimeout(sync,0);return}
 if(event.target.closest?.('[data-explore-stage="approach"],[data-explore-action="approach"]')){mark('approached');return}
 if(event.target.closest?.('[data-open-workspace="inspect"],[data-workspace="inspect"]')){mark('inspected');return}
}
function init(){document.addEventListener('click',onClick,false);syncTimer=root.setInterval(sync,300);sync();root.__OFU_EXPLORER_BETA__=api}
const api=Object.freeze({seamVersion:1,state,get session(){return session},snapshot:()=>Object.freeze({state:{...state},session}),sync,openToken});
O.v09ExplorerBeta=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
