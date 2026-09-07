(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-discovery-1',AUTHORITY='PRESENTATION_ONLY';
const GOALS=new Set(['ANY','BIOSPHERE','CIVILIZATION','STERILE']);
function invariant(ok,message){if(!ok)throw new Error('V2X14 discovery: '+message);}
function create(options={}){
 const product=options.product||O.v1LivingProduct,runtime=options.runtime||product?.runtime;
 invariant(runtime&&typeof runtime.snapshot==='function','Living runtime required');
 invariant(typeof runtime.searchWorlds==='function','bounded searchWorlds API required');
 invariant(typeof runtime.enterKey==='function','public enterKey travel API required');
 let cursor=null,goal='ANY',pages=0,worlds=0,rows=[],context=null,generation=0,running=false;
 function reset(nextGoal=goal){invariant(GOALS.has(nextGoal),'unsupported goal');goal=nextGoal;cursor=null;pages=0;worlds=0;rows=[];context=runtime.snapshot().system?.canonicalId||null;generation++;running=false;return snapshot();}
 function reconcile(){const next=runtime.snapshot().system?.canonicalId||null;if(next!==context){context=next;cursor=null;pages=0;worlds=0;rows=[];generation++;running=false;}return context;}
 async function page(options={}){
  reconcile();invariant(context,'system context required');if(running)return snapshot();running=true;const token=++generation;
  try{
   await Promise.resolve();if(token!==generation)return snapshot();
   const out=runtime.searchWorlds({goal,cursor,maxWorlds:12,maxSystemQueries:128,limit:Math.max(1,Math.min(6,Number(options.limit)||6))});
   invariant(out&&Array.isArray(out.candidates),'search result candidates required');
   pages++;worlds+=Number(out.worldsEvaluated)||0;cursor=out.nextCursor??null;
   for(const row of out.candidates){const id=row?.planetIdentity;if(id&&!rows.some(x=>x.planetIdentity===id))rows.push(row);}rows=rows.slice(0,12);
  } finally {if(token===generation)running=false;}
  return snapshot();
 }
 function select(planetIdentity){const row=rows.find(x=>x?.planetIdentity===planetIdentity);invariant(row&&row.canonicalKey,'known discovered row required');return runtime.enterKey(row.canonicalKey);}
 function snapshot(){return Object.freeze({schema:'ofu-v2x14-discovery-snapshot-1',version:VERSION,authority:AUTHORITY,goal,context,cursor,pages,worlds,running,results:Object.freeze(rows.map(x=>Object.freeze({planetIdentity:x.planetIdentity,canonicalKey:x.canonicalKey,biologyState:x.biologyState??null,civilizationState:x.civilizationState??null,surfaceTemperatureMilliK:x.surfaceTemperatureMilliK??null}))),bounds:Object.freeze({rows:12,perPage:6,maxWorlds:12,maxSystemQueries:128}),globalEnumeration:false,navigationDelegatesTo:'v1LivingRuntime.enterKey',mutatesCanonicalSelectionDirectly:false,networkRequired:false});}
 return Object.freeze({reset,page,select,snapshot});
}
O.v2x14Discovery=Object.freeze({VERSION,AUTHORITY,GOALS,create});
})(globalThis);
