(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-discovery-2',AUTHORITY='PRESENTATION_ONLY';
const GOALS=new Set(['ANY','BIOSPHERE','CIVILIZATION','STERILE']);
const BOUNDS=Object.freeze({rows:12,perPage:6,maxWorlds:12,maxSystemQueries:128,maxPagesPerScan:12});
function invariant(ok,message){if(!ok)throw new Error('V2X14 discovery: '+message);}
function create(options={}){
 const product=options.product||O.v1LivingProduct,runtime=options.runtime||product?.runtime;
 invariant(runtime&&typeof runtime.snapshot==='function','Living runtime required');invariant(typeof runtime.searchWorlds==='function','bounded searchWorlds API required');invariant(typeof runtime.enterKey==='function','public enterKey travel API required');
 let cursor=null,goal='ANY',pages=0,worlds=0,rows=[],context=null,generation=0,running=false,lastError=null,lastOutcome='IDLE';
 const currentContext=()=>runtime.snapshot().system?.canonicalId||null;
 function clear(nextContext){cursor=null;pages=0;worlds=0;rows=[];context=nextContext;lastError=null;lastOutcome='IDLE';}
 function reset(nextGoal=goal){invariant(GOALS.has(nextGoal),'unsupported goal');goal=nextGoal;generation++;running=false;clear(currentContext());return snapshot();}
 function reconcile(){const next=currentContext();if(next!==context){generation++;running=false;clear(next);lastOutcome='CONTEXT_CHANGED';}return context;}
 function cancel(reason='USER_CANCELLED'){generation++;running=false;lastOutcome=String(reason||'CANCELLED');return snapshot();}
 function accept(out,token,expectedContext){if(token!==generation||currentContext()!==expectedContext)return false;invariant(out&&Array.isArray(out.candidates),'search result candidates required');pages++;worlds+=Math.max(0,Number(out.worldsEvaluated)||0);cursor=out.nextCursor??null;for(const row of out.candidates){const id=row?.planetIdentity;if(id&&!rows.some(x=>x.planetIdentity===id))rows.push(row);}rows=rows.slice(0,BOUNDS.rows);lastOutcome=out.candidates.length?'RESULTS':'EMPTY_PAGE';return true;}
 async function page(options={}){
  reconcile();invariant(context,'system context required');if(running)return snapshot();running=true;lastError=null;const token=++generation,expectedContext=context;
  try{await Promise.resolve();if(token!==generation)return snapshot();const out=runtime.searchWorlds({goal,cursor,maxWorlds:BOUNDS.maxWorlds,maxSystemQueries:BOUNDS.maxSystemQueries,limit:Math.max(1,Math.min(BOUNDS.perPage,Number(options.limit)||BOUNDS.perPage))});accept(out,token,expectedContext);}catch(error){if(token===generation){lastError=String(error?.message||error);lastOutcome='ERROR';}throw error;}finally{if(token===generation)running=false;}
  return snapshot();
 }
 async function scan(options={}){
  reconcile();invariant(context,'system context required');if(running)return snapshot();running=true;lastError=null;const token=++generation,expectedContext=context,maxPages=Math.max(1,Math.min(BOUNDS.maxPagesPerScan,Number(options.maxPages)||BOUNDS.maxPagesPerScan)),stopOnResult=options.stopOnResult!==false;
  try{for(let i=0;i<maxPages;i++){await Promise.resolve();if(token!==generation||currentContext()!==expectedContext)break;const before=rows.length,out=runtime.searchWorlds({goal,cursor,maxWorlds:BOUNDS.maxWorlds,maxSystemQueries:BOUNDS.maxSystemQueries,limit:BOUNDS.perPage});if(!accept(out,token,expectedContext))break;if((stopOnResult&&rows.length>before)||cursor===null||rows.length>=BOUNDS.rows)break;}}catch(error){if(token===generation){lastError=String(error?.message||error);lastOutcome='ERROR';}throw error;}finally{if(token===generation)running=false;}
  return snapshot();
 }
 function select(planetIdentity){reconcile();const row=rows.find(x=>x?.planetIdentity===planetIdentity);invariant(row&&row.canonicalKey,'known discovered row required');lastOutcome='TRAVEL_DELEGATED';return runtime.enterKey(row.canonicalKey);}
 function snapshot(){return Object.freeze({schema:'ofu-v2x14-discovery-snapshot-2',version:VERSION,authority:AUTHORITY,goal,context,cursor,pages,worlds,running,lastError,lastOutcome,results:Object.freeze(rows.map(x=>Object.freeze({planetIdentity:x.planetIdentity,canonicalKey:x.canonicalKey,biologyState:x.biologyState??null,civilizationState:x.civilizationState??null,surfaceTemperatureMilliK:x.surfaceTemperatureMilliK??null}))),bounds:BOUNDS,globalEnumeration:false,navigationDelegatesTo:'v1LivingRuntime.enterKey',mutatesCanonicalSelectionDirectly:false,networkRequired:false,staleResultsAccepted:false});}
 return Object.freeze({reset,reconcile,cancel,page,scan,select,snapshot});
}
O.v2x14Discovery=Object.freeze({VERSION,AUTHORITY,GOALS,BOUNDS,create});
})(globalThis);
