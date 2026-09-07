(function(root){
'use strict';
const O=root.OFU=root.OFU||{},original=O.v1x02SpatialUniverse,provider=O.v2x03MacrocosmProvider;
if(!original||!provider)throw new Error('V2X convergence macrocosm composition dependencies missing');
if(original.__v2x03Composed)return;
const originalRepresentation=original.representation.bind(original);
let calls=0,providerCalls=0,fallbacks=0,last=null;
function representation(args={}){
 calls++;
 const context=String(args.context||'').toUpperCase();
 try{
  let scene=null;
  if(context==='UNIVERSE')scene=provider.buildUniverse(args);
  else if(context==='GALAXY')scene=provider.buildGalaxy({galaxy:{canonicalId:args.scopeId,metadata:{modelProfile:{morphology:args.morphology||'UNKNOWN'}}},entities:args.entities||[],cameraFrame:args.cameraFrame,quality:'STANDARD',presentationSeed:args.presentationSeed,densityHint:args.densityHint});
  else if(context==='REGION')scene=provider.buildRegion({parentId:args.scopeId,children:args.entities||[],quality:'STANDARD',focus:args.focus??0,parentExtent:args.parentExtent??1});
  else if(context==='NEIGHBORHOOD')scene=provider.buildNeighborhood({objects:args.entities||[],cameraFrame:args.cameraFrame,quality:'STANDARD',scaleUnits:original.profile({context:'NEIGHBORHOOD'}).scaleUnits});
  if(scene&&Array.isArray(scene.objects)){
   providerCalls++;
   last=Object.freeze({context,status:'PROVIDER',objects:scene.objects.length,authority:provider.AUTHORITY,contract:provider.CONTRACT});
   return Object.freeze({...scene,objects:scene.objects,composition:Object.freeze({provider:'v2x03.macrocosm-provider',fallback:false})});
  }
 }catch(error){
  // The original bounded representation remains the fail-safe presentation path.
  last=Object.freeze({context,status:'FALLBACK',reason:String(error?.message||error).slice(0,256),authority:'PRESENTATION_ONLY'});
 }
 fallbacks++;
 const value=originalRepresentation(args);
 return Object.freeze({...value,composition:Object.freeze({provider:'v1x02.spatial-universe',fallback:true})});
}
const composed=Object.freeze({...original,representation,__v2x03Composed:true,compositionSnapshot:()=>Object.freeze({schema:'ofu-v2x03-living-composition-1',status:'ACTIVE',calls,providerCalls,fallbacks,last,authority:'PRESENTATION_ONLY',canonicalTruthChanged:false,cameraAuthorityChanged:false,selectionAuthorityChanged:false,scaleAuthorityChanged:false})});
O.v1x02SpatialUniverse=composed;
O.v2xLivingMacrocosmComposition=Object.freeze({VERSION:'ofu-v2x03-living-composition-1',AUTHORITY:'PRESENTATION_ONLY',original,composed,snapshot:composed.compositionSnapshot});
})(typeof globalThis!=='undefined'?globalThis:this);
