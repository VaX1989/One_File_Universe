(function(root){
'use strict';
const O=root.OFU=root.OFU||{},E=O.v2x07LocalSpatialEmbodiment,G=O.v2x07GroundPresence,R=O.v2x07LocalRenderer;
if(!E||!G||!R)throw new Error('V2X-07 local rendering dependencies required');
const VERSION='ofu-v2x-07-local-experience-provider-2';
const AUTHORITY='PRESENTATION_ONLY';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function createProvider({groundProvider,embodimentProviders=[],profileName='desktop',profileOverride={},width=1280,height=720,fovYRad=Math.PI/3}={}){
 let profile=String(profileName),last=null,frames=0,picks=0,unsupportedFrames=0,occlusionUnsupportedFrames=0,peakPrimitives=0,peakObjects=0,peakGroundSampleCalls=0;
 function setProfile(next){profile=String(next||'desktop');return profile}
 function materialize(camera,{context={},viewportWidth=width,viewportHeight=height}={}){
  const terrain=G.sampleGrid({camera,groundProvider,profileName:profile}),reuseOcclusion=String(profile).toLowerCase()==='minimal',occlusionTerrain=reuseOcclusion?terrain:G.sampleGrid({camera,groundProvider,profileName:'minimal'}),embodiment=E.materialize({camera,providers:embodimentProviders,profileName:profile,profileOverride,context}),cues=G.scaleCues(camera),frame=R.buildFrame({camera,terrain,occlusionTerrain,embodiment,scaleCues:cues,width:viewportWidth,height:viewportHeight,profileName:profile,fovYRad});
  const visualTerrainSamples=terrain.resources?.samples||0,occlusionGridSamples=occlusionTerrain.resources?.samples||0,additionalOcclusionSampleCalls=reuseOcclusion?0:occlusionGridSamples,groundSampleCalls=visualTerrainSamples+additionalOcclusionSampleCalls,maxGroundSampleCalls=(terrain.resources?.maxSamples||0)+(reuseOcclusion?0:(occlusionTerrain.resources?.maxSamples||0));
  if(groundSampleCalls>maxGroundSampleCalls)throw new Error('local experience ground sample accounting exceeded declared bound');
  frames++;if(!terrain.supported)unsupportedFrames++;if(!occlusionTerrain.supported)occlusionUnsupportedFrames++;peakPrimitives=Math.max(peakPrimitives,frame.resources.primitives);peakObjects=Math.max(peakObjects,embodiment.objects.length);peakGroundSampleCalls=Math.max(peakGroundSampleCalls,groundSampleCalls);
  last=freeze({version:VERSION,authority:AUTHORITY,profile,camera:freeze({...camera}),terrain,occlusionTerrain,embodiment,cues,renderFrame:frame,resources:{frames,unsupportedFrames,occlusionUnsupportedFrames,peakPrimitives,peakObjects,peakGroundSampleCalls,terrainSamples:visualTerrainSamples,visualTerrainSamples,occlusionGridSamples,additionalOcclusionSampleCalls,groundSampleCalls,maxGroundSampleCalls,occlusionTerrainReused:reuseOcclusion,objects:embodiment.objects.length,pickTargets:frame.pickTargets.length},claims:{centralRendererMutated:false,centralCameraAuthorityMutated:false,centralSelectionAuthorityMutated:false,terrainTruthOwned:false,lifeStateOwned:false,civilizationStateOwned:false,resourceAccountingIncludesOcclusionTerrain:true}});return last
 }
 function pick(x,y){if(!last)return freeze({hit:false,reason:'NO_LOCAL_FRAME',authority:AUTHORITY});const result=R.pick(last.renderFrame,x,y);picks++;return freeze({...result,pickSequence:picks})}
 function render(ctx){if(!last)throw new Error('materialize a local frame before rendering');return R.renderCanvas2D(ctx,last.renderFrame)}
 function interior(provider,target,context={}){return E.resolveInterior(provider,target,context)}
 function snapshot(){return freeze({version:VERSION,authority:AUTHORITY,profile,hasFrame:!!last,planetId:last?.embodiment?.planetId||null,anchorToken:last?.embodiment?.anchorToken||null,resources:last?.resources||{frames,unsupportedFrames,occlusionUnsupportedFrames,peakPrimitives,peakObjects,peakGroundSampleCalls},picks,claims:{networkResources:0,centralBindingRequired:true,directFileCompatible:true,resourceAccountingIncludesOcclusionTerrain:true}})}
 return Object.freeze({VERSION,AUTHORITY,materialize,pick,render,interior,setProfile,snapshot})
}
O.v2x07LocalExperienceProvider=Object.freeze({VERSION,AUTHORITY,createProvider});
})(typeof globalThis!=='undefined'?globalThis:this);
