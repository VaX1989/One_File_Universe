(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const C=O.v09ExplorerCore;if(!C)throw new Error('v0.9 explorer core unavailable');
const q=id=>document.getElementById(id),STORAGE_KEY='ofu:v09:explorer-session:1',DISCOVERY_LIMIT=3,RECENT_LIMIT=5,BOOKMARK_LIMIT=6,MODELED_DISCOVERY_LIMIT=3,MODELED_DISCOVERY_PAGE_CAP=8,MODELED_DISCOVERY_RESULT_CAP=12;
const MODELED_GOALS=Object.freeze(['ANY','BIOSPHERE','CIVILIZATION','STERILE']);
let session=loadSession(),startupResumeToken=session.current,lastToken=null,lastStamp='',syncTimer=null;
const modeledDiscovery={goal:null,sourceEntity:null,cursor:null,nextCursor:null,candidates:[],status:'idle',message:'Choose a modeled outcome to search a bounded neighborhood around the selected world.',pages:0,systemQueries:0,worldsEvaluated:0,searching:false,error:null};
const state={seamVersion:4,ready:false,lastSelectionToken:null,lastAction:null,storage:'memory',syncs:0,resumeStatus:startupResumeToken?'pending':'none',resumedToken:null,modeledDiscovery};
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
function currentSystemSnapshots(){const targets=O.v08ExploreNavigation?.state?.targets||[],out=[];for(const target of targets){try{const snap=resolveSnapshot(C.serializePlanetKey(target.key));if(snap)out.push(snap)}catch{}}return out}
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
function buildModeledDiscovery(){
 if(q('beta-modeled-discovery'))return true;const host=q('beta-discovery-list')?.closest?.('.beta-discovery');if(!host)return false;
 const wrap=document.createElement('div');wrap.id='beta-modeled-discovery';wrap.className='beta-modeled-discovery';wrap.setAttribute('aria-labelledby','beta-modeled-discovery-heading');
 const heading=document.createElement('h4');heading.id='beta-modeled-discovery-heading';heading.textContent='Search modeled outcomes';
 const note=document.createElement('p');note.className='semantic-note';note.textContent='This bounded search uses MODEL_DERIVED_SIMULATION scenarios around the selected canonical world. A match is a scenario worth exploring, not a claim that life, civilization, climate, or proximity is canonical truth.';
 const controls=document.createElement('div');controls.className='panel-actions';controls.setAttribute('aria-label','Modeled outcome search');
 for(const [goal,label] of [['ANY','Any scenario'],['BIOSPHERE','Modeled biosphere'],['CIVILIZATION','Modeled civilization'],['STERILE','Modeled sterile']]){const button=document.createElement('button');button.type='button';button.className='action-button secondary';button.dataset.betaModeledGoal=goal;button.setAttribute('aria-pressed','false');button.textContent=label;controls.append(button)}
 const status=document.createElement('p');status.id='beta-modeled-discovery-status';status.className='semantic-note';status.setAttribute('aria-live','polite');
 const list=document.createElement('ul');list.id='beta-modeled-discovery-list';list.className='beta-card-list';
 const more=document.createElement('button');more.id='beta-modeled-more';more.type='button';more.className='action-button secondary';more.dataset.betaModeledMore='';more.textContent='Search further';more.hidden=true;
 wrap.append(heading,note,controls,status,list,more);host.append(wrap);renderModeledDiscovery();return true;
}
function modeledProviderReady(){try{return !!O.pxProduct?.inspect&&O.pxProduct?.snapshot?.().registry?.bindingsSealed===true}catch{return false}}
function modelTemperature(candidate){const n=Number(candidate?.surfaceTemperatureMilliK);return Number.isFinite(n)?(n/1000).toFixed(1)+' K':'temperature unavailable'}
function modelWater(candidate){const n=Number(candidate?.waterAreaPpm);return Number.isFinite(n)?Math.round(n/10000)+'% modeled water area':'water area unavailable'}
function modelOutcome(candidate){if(candidate?.civilizationState==='MODELED_CIVILIZATION')return'Modeled civilization';if(candidate?.biologyState==='MODELED_BIOSPHERE')return'Modeled biosphere';return'Modeled sterile outcome'}
function modeledCandidateButton(candidate,index){
 const button=document.createElement('button');button.type='button';button.className='beta-world-card';button.dataset.betaModeledOpen=String(index);const title=document.createElement('strong');title.textContent=modelOutcome(candidate);const off=candidate.systemOffset||{},offset=`system offset ${Number(off.x)||0}, ${Number(off.y)||0}, ${Number(off.z)||0}`;const copy=document.createElement('span');copy.textContent='MODEL_DERIVED_SIMULATION · '+modelTemperature(candidate)+' · '+modelWater(candidate)+' · '+offset;button.append(title,copy);return button;
}
function renderModeledDiscovery(){
 const status=q('beta-modeled-discovery-status'),list=q('beta-modeled-discovery-list'),more=q('beta-modeled-more'),ready=modeledProviderReady();if(!status||!list||!more)return;
 for(const button of document.querySelectorAll('[data-beta-modeled-goal]')){const selected=button.dataset.betaModeledGoal===modeledDiscovery.goal;button.setAttribute('aria-pressed',selected?'true':'false');button.disabled=modeledDiscovery.searching||!ready}
 status.textContent=!ready?'Modeled discovery is still initializing. Canonical exploration remains available.':modeledDiscovery.searching?'Searching a bounded modeled neighborhood…':modeledDiscovery.message;
 list.textContent='';for(let i=0;i<modeledDiscovery.candidates.length;i++){const li=document.createElement('li');li.append(modeledCandidateButton(modeledDiscovery.candidates[i],i));list.append(li)}
 more.hidden=!(ready&&!modeledDiscovery.searching&&modeledDiscovery.nextCursor!==null&&modeledDiscovery.pages<MODELED_DISCOVERY_PAGE_CAP);more.disabled=modeledDiscovery.searching;more.textContent=modeledDiscovery.candidates.length?'Search further':'Continue bounded search';
}
function resetModeledDiscovery(message='Choose a modeled outcome to search a bounded neighborhood around the selected world.'){
 Object.assign(modeledDiscovery,{goal:null,sourceEntity:null,cursor:null,nextCursor:null,candidates:[],status:'idle',message,pages:0,systemQueries:0,worldsEvaluated:0,searching:false,error:null});renderModeledDiscovery();
}
function verifyModeledPage(result,source){
 if(result?.authority?.class!=='MODEL_DERIVED_SIMULATION')throw new Error('modeled discovery authority mismatch');const value=result.value;if(value?.authority!=='MODEL_DERIVED_SIMULATION'||value?.canonicalP6Unchanged!==true||value?.boundedSearch!==true||value?.globalEnumeration!==false)throw new Error('modeled discovery contract mismatch');const after=O.pxProduct.captured();if(after.selection.target.entityId!==source.selection.target.entityId||after.selection.time.historyDigest!==source.selection.time.historyDigest)throw new Error('modeled discovery mutated canonical selection/history');return value;
}
function searchModeled(goal,{more=false}={}){
 const normalized=String(goal||modeledDiscovery.goal||'ANY').toUpperCase();if(!MODELED_GOALS.includes(normalized)||modeledDiscovery.searching)return false;if(!modeledProviderReady()){modeledDiscovery.message='Modeled discovery is still initializing.';renderModeledDiscovery();return false}
 let source;try{source=O.pxProduct.captured()}catch(error){modeledDiscovery.message='Modeled discovery cannot capture the current canonical world yet.';modeledDiscovery.error=String(error?.message||error);renderModeledDiscovery();return false}
 const continuing=more&&modeledDiscovery.goal===normalized&&modeledDiscovery.sourceEntity===source.selection.target.entityId&&modeledDiscovery.nextCursor!==null;
 if(!continuing)Object.assign(modeledDiscovery,{goal:normalized,sourceEntity:source.selection.target.entityId,cursor:null,nextCursor:null,candidates:[],status:'searching',message:'Searching…',pages:0,systemQueries:0,worldsEvaluated:0,error:null});
 else modeledDiscovery.status='searching';modeledDiscovery.searching=true;renderModeledDiscovery();
 const cursor=continuing?modeledDiscovery.nextCursor:null;
 root.setTimeout(()=>{
  try{
   const result=O.pxProduct.inspect('v1.query.world-candidates',{address:[],cursor,limit:MODELED_DISCOVERY_LIMIT,filters:{goal:normalized,maxSystemQueries:128,maxWorlds:24}},'DISCOVER'),value=verifyModeledPage(result,source),seen=new Set(modeledDiscovery.candidates.map(c=>c.planetIdentity));
   for(const candidate of value.candidates||[]){if(candidate?.planetIdentity===source.selection.target.entityId||seen.has(candidate?.planetIdentity))continue;modeledDiscovery.candidates.push(candidate);seen.add(candidate.planetIdentity);if(modeledDiscovery.candidates.length>=MODELED_DISCOVERY_RESULT_CAP)break}
   modeledDiscovery.goal=normalized;modeledDiscovery.sourceEntity=source.selection.target.entityId;modeledDiscovery.cursor=cursor;modeledDiscovery.nextCursor=value.nextCursor??null;modeledDiscovery.pages++;modeledDiscovery.systemQueries+=Number(value.systemQueries)||0;modeledDiscovery.worldsEvaluated+=Number(value.worldsEvaluated)||0;modeledDiscovery.status='ready';modeledDiscovery.error=null;
   const count=modeledDiscovery.candidates.length,scope=`${modeledDiscovery.systemQueries} systems / ${modeledDiscovery.worldsEvaluated} modeled worlds evaluated`;
   modeledDiscovery.message=count?`${count} ${count===1?'different candidate':'different candidates'} found · ${scope}. Matches are model-derived scenarios; selecting one only changes canonical navigation target.`:`No different ${normalized.toLowerCase()} match in this bounded page · ${scope}.`;
  }catch(error){modeledDiscovery.status='error';modeledDiscovery.error=String(error?.message||error);modeledDiscovery.message='Modeled discovery could not complete safely. Canonical exploration was not changed.'}
  finally{modeledDiscovery.searching=false;renderModeledDiscovery()}
 },0);return true;
}
function openModeledCandidate(index){
 const candidate=modeledDiscovery.candidates[Number(index)];if(!candidate?.canonicalKey)return false;
 try{const key=Object.freeze(Object.fromEntries(Object.entries(candidate.canonicalKey).map(([name,value])=>[name,BigInt(value)]))),ctx=currentContext(),planet=ctx?.A?.resolvePlanet?.(ctx.P.ctx,key);if(planet?.status!=='PRESENT'||O.p2?.hex?.(planet.id)!==candidate.planetIdentity)throw new Error('modeled candidate canonical identity mismatch');const opened=openToken(C.serializePlanetKey(key),{action:'modeled-discovery-open'});if(!opened)return false;O.productUI?.announce?.('Opened canonical world from a model-derived discovery result; modeled outcome is not canonical truth');resetModeledDiscovery('Modeled search cleared because the canonical navigation target changed. Choose an outcome to search around this world.');return true}catch(error){modeledDiscovery.error=String(error?.message||error);modeledDiscovery.message='That modeled candidate could not be established as a canonical navigation target.';renderModeledDiscovery();return false}
}
function renderSelected(snapshot){
 setText('beta-why-look',snapshot.summary+'.');const previous=resolveSnapshot(session.previous);setText('beta-difference-copy',previous&&previous.token!==snapshot.token?'Compared with your previous world: '+C.differenceSummary(snapshot,previous):'Choose another world and this space will explain the strongest supported differences.');
 const bookmark=q('beta-bookmark'),pin=q('beta-pin'),back=q('beta-back'),forward=q('beta-forward'),trail=C.trailState(session);
 if(bookmark){const active=session.bookmarks.includes(snapshot.token);bookmark.setAttribute('aria-pressed',active?'true':'false');bookmark.textContent=active?'Bookmarked':'Bookmark world'}
 if(pin){const active=session.pinned===snapshot.token;pin.setAttribute('aria-pressed',active?'true':'false');pin.textContent=active?'Pinned for compare':'Pin for compare'}
 if(back){back.disabled=!trail.canBack;back.setAttribute('aria-label',trail.canBack?'Back to previous destination':'No previous destination in trail')}
 if(forward){forward.disabled=!trail.canForward;forward.setAttribute('aria-label',trail.canForward?'Forward to next destination':'No forward destination in trail')}
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
function sessionNote(){
 const persistence=state.storage==='localStorage'?'Recent destinations, trail position, bookmarks and comparison pin stay on this device. They are product state, not astronomical facts.':'Session state is temporary in this browser context and never becomes astronomical data.';
 if(state.resumeStatus==='restored')return'Resumed your last explored destination. '+persistence;
 if(state.resumeStatus==='unavailable')return'Your previous destination could not be restored safely, so exploration started from the current available world. '+persistence;
 return persistence;
}
function render(snapshot){renderOrientation(snapshot);renderDiscovery(snapshot);renderSelected(snapshot);renderComparison(snapshot);renderSession();renderOnboarding();renderModeledDiscovery();setText('beta-session-note',sessionNote());state.ready=true}
function attemptStartupResume(){
 if(state.resumeStatus!=='pending')return state.resumeStatus==='restored';
 const token=startupResumeToken;if(!token){state.resumeStatus='none';return false}
 const bridge=O.v08SelectionBridge,nav=O.v08ExploreNavigation;if(!bridge?.selectPlanet||!nav?.sync||!currentContext())return null;
 const saved=resolveSnapshot(token);if(!saved){state.resumeStatus='unavailable';startupResumeToken=null;state.lastAction='startup-resume-unavailable';return false}
 const priorLastToken=lastToken;
 try{lastToken=token;bridge.selectPlanet(C.parsePlanetKey(token),{announce:false});nav.sync();state.resumeStatus='restored';state.resumedToken=token;state.lastSelectionToken=token;state.lastAction='startup-resume';startupResumeToken=null;save();return true}catch(error){lastToken=priorLastToken;state.resumeStatus='unavailable';state.lastAction='startup-resume-failed:'+String(error?.message||error);startupResumeToken=null;return false}
}
function sync(){
 if(state.resumeStatus==='pending'&&attemptStartupResume()===null)return;
 const snapshot=selectedSnapshot();if(!snapshot)return;
 if(snapshot.token!==lastToken){session=C.recordVisit(session,snapshot.token);lastToken=snapshot.token;state.lastSelectionToken=snapshot.token;save()}
 if(modeledDiscovery.sourceEntity&&!modeledDiscovery.searching){try{const entity=O.pxProduct?.captured?.().selection?.target?.entityId;if(entity&&entity!==modeledDiscovery.sourceEntity)resetModeledDiscovery('Modeled search cleared because the canonical navigation target changed. Choose an outcome to search around this world.')}catch{}}
 const nextStamp=[snapshot.token,session.previous,session.pinned,session.bookmarks.join('|'),session.recent.join('|'),session.trail.join('|'),session.trailCursor,JSON.stringify(session.progress),session.onboardingDismissed,state.storage,state.resumeStatus,state.resumedToken||''].join('::');if(nextStamp===lastStamp)return;lastStamp=nextStamp;state.syncs++;render(snapshot)
}
function openToken(token,{collapse=true,action='open-saved-target',preserveTrail=false}={}){
 const priorLastToken=lastToken;
 try{const key=C.parsePlanetKey(token),bridge=O.v08SelectionBridge;if(!bridge?.selectPlanet)throw new Error('selection bridge unavailable');if(preserveTrail)lastToken=token;bridge.selectPlanet(key,{announce:false});session=C.markProgress(session,'selected');save();state.lastAction=action;O.v08ExploreNavigation?.sync?.();sync();O.productUI?.announce?.('Opened '+worldDisplay(resolveSnapshot(token)));if(collapse&&O.v08MobileInteraction?.state?.active)O.v08MobileInteraction.collapse();return true}catch(error){if(preserveTrail)lastToken=priorLastToken;O.productUI?.announce?.('Saved destination could not be opened safely');state.lastAction='open-failed:'+String(error?.message||error);return false}
}
function navigateTrail(delta){
 const moved=C.moveTrail(session,delta);if(!moved.moved)return false;
 const priorSession=session,priorLastToken=lastToken;session=moved.session;lastStamp='';
 const opened=openToken(moved.token,{collapse:false,action:delta<0?'trail-back':'trail-forward',preserveTrail:true});
 if(opened){save();return true}
 session=priorSession;lastToken=priorLastToken;save();lastStamp='';sync();return false;
}
function mark(name){session=C.markProgress(session,name);save();lastStamp='';sync()}
function onClick(event){
 const modeledGoal=event.target.closest?.('[data-beta-modeled-goal]');if(modeledGoal){searchModeled(modeledGoal.dataset.betaModeledGoal);return}
 if(event.target.closest?.('[data-beta-modeled-more]')){searchModeled(modeledDiscovery.goal,{more:true});return}
 const modeledOpen=event.target.closest?.('[data-beta-modeled-open]');if(modeledOpen){openModeledCandidate(Number(modeledOpen.dataset.betaModeledOpen));return}
 const open=event.target.closest?.('[data-beta-open]');if(open){openToken(open.dataset.betaOpen);return}
 if(event.target.closest?.('[data-beta-back]')){navigateTrail(-1);return}
 if(event.target.closest?.('[data-beta-forward]')){navigateTrail(1);return}
 if(event.target.closest?.('[data-beta-bookmark]')){const snap=selectedSnapshot();if(snap){session=C.toggleBookmark(session,snap.token);save();lastStamp='';sync();O.productUI?.announce?.(session.bookmarks.includes(snap.token)?'World bookmarked':'Bookmark removed')}return}
 if(event.target.closest?.('[data-beta-pin]')){const snap=selectedSnapshot();if(snap){session=C.togglePin(session,snap.token);save();lastStamp='';sync();O.productUI?.announce?.(session.pinned===snap.token?'World pinned for comparison':'Comparison pin removed')}return}
 if(event.target.closest?.('[data-beta-dismiss-onboarding]')){session=C.dismissOnboarding(session);save();lastStamp='';sync();return}
 if(event.target.closest?.('[data-explore-target]')){mark('selected');root.setTimeout(sync,0);return}
 if(event.target.closest?.('[data-explore-stage="approach"],[data-explore-action="approach"]')){mark('approached');return}
 if(event.target.closest?.('[data-open-workspace="inspect"],[data-workspace="inspect"]')){mark('inspected');return}
}
function onKeydown(event){if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;const tag=event.target?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||event.target?.isContentEditable)return;if(event.key==='['&&C.trailState(session).canBack){navigateTrail(-1);event.preventDefault()}else if(event.key===']'&&C.trailState(session).canForward){navigateTrail(1);event.preventDefault()}}
function snapshot(){return Object.freeze({state:{...state,modeledDiscovery:{...modeledDiscovery,candidates:modeledDiscovery.candidates.map(c=>({...c}))}},session,trail:C.trailState(session)})}
function init(){buildModeledDiscovery();document.addEventListener('click',onClick,false);document.addEventListener('keydown',onKeydown,false);syncTimer=root.setInterval(sync,300);sync();root.__OFU_EXPLORER_BETA__=api}
const api=Object.freeze({seamVersion:4,state,get session(){return session},snapshot,sync,openToken,navigateTrail,attemptStartupResume,searchModeled,openModeledCandidate,resetModeledDiscovery});
O.v09ExplorerBeta=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
