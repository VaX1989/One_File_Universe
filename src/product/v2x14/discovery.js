(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-discovery-observer-4',AUTHORITY='PRESENTATION_ONLY';
const BOUNDS=Object.freeze({maxPagesPerInteraction:24,maxWorldsPerPage:12,maxSystemQueriesPerPage:128,maxResults:12});
function invariant(ok,message){if(!ok)throw new Error('V2X14 discovery observer: '+message);}
function count(value,max=Number.MAX_SAFE_INTEGER){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(max,Math.trunc(n))):0;}
function create(options={}){
 const product=options.product||O.v1LivingProduct;
 invariant(product&&typeof product.snapshot==='function','Living product required');
 invariant(product.runtime&&typeof product.runtime.snapshot==='function','Living runtime snapshot required');
 function snapshot(){
  const productState=product.snapshot()||{},runtimeState=product.runtime.snapshot()||{},search=productState.search&&typeof productState.search==='object'?productState.search:{};
  const context=runtimeState.system?.canonicalId||null,available=!!context&&!runtimeState.micro;
  return Object.freeze({
   schema:'ofu-v2x14-discovery-observer-snapshot-4',version:VERSION,authority:AUTHORITY,
   available,context,goal:typeof search.goal==='string'?search.goal:null,cursorPresent:search.cursor!=null,
   pages:count(search.pages),worlds:count(search.worlds),running:search.running===true,resultCount:count(search.results,BOUNDS.maxResults),
   bounds:BOUNDS,centralSurveyAvailable:typeof product.survey==='function',centralSurveyOwner:'v1LivingProduct',
   ownsSearchState:false,invokesSurvey:false,invokesSearchWorlds:false,exposesCanonicalKey:false,
   resultActivationAuthority:'CENTRAL_LIVING_SURVEY_UI',globalEnumeration:false,networkRequired:false
  });
 }
 return Object.freeze({snapshot});
}
O.v2x14Discovery=Object.freeze({VERSION,AUTHORITY,BOUNDS,create});
})(globalThis);
