(function(root){
'use strict';
const O=root.OFU=root.OFU||{},P=O.v1x07LifeEcologyPresentation,D=O.v1x07LifeField;
if(!P||!D)throw new Error('V1X-07 life/ecology presentation prerequisites missing');
const VERSION='ofu-v1x-07-organism-selection-handoff-1';
const AUTHORITY='PRESENTATION_ONLY';
function copy(value){if(value===undefined)return null;if(value===null||typeof value!=='object')return value;if(Array.isArray(value))return value.map(copy);const out={};for(const key of Object.keys(value).sort())out[key]=copy(value[key]);return out}
function findTarget(projection,populationId){return projection?.visual?.selectableTargets?.find(x=>x.populationId===populationId)||null}
function refine({projection,populationId,selectionState=null,referenceFrame=null,cameraState=null,historyToken=null,provenance=null}={}){
 if(!projection||projection.schema!==P.SCHEMA)return D.freeze({schema:VERSION,eligible:false,reason:'PROJECTION_REQUIRED',authority:AUTHORITY,canonicalMutation:false});
 if(projection.visual.mode!=='MODELED_LIFE')return D.freeze({schema:VERSION,eligible:false,reason:'NO_MODELED_LIFE_TARGET',worldIdentity:projection.worldIdentity,authority:AUTHORITY,canonicalMutation:false});
 const id=String(populationId||''),target=findTarget(projection,id);if(!target)return D.freeze({schema:VERSION,eligible:false,reason:'POPULATION_NOT_PRESENT_IN_PROJECTION',worldIdentity:projection.worldIdentity,populationId:id||null,authority:AUTHORITY,canonicalMutation:false});
 const instance=projection.visual.organismInstances.find(x=>x.populationId===id)||null;
 return D.freeze({schema:VERSION,version:VERSION,eligible:true,operation:'REFINE',consumerLane:'V1X-09',target:D.freeze({...target,representativeInstanceId:instance?.instanceId||null}),continuity:D.freeze({worldIdentity:projection.worldIdentity,regionIdentity:projection.regionIdentity,locationIdentity:projection.locationIdentity,previousSelectionId:selectionState?.selectedId??selectionState?.selectionId??null,requestedSelectionId:id,selectionMutationPerformed:false,selectionOwnerAdmissionRequired:true,referenceFrame:copy(referenceFrame),cameraState:copy(cameraState),historyToken:historyToken===undefined?null:copy(historyToken),provenance:copy(provenance)}),authority:AUTHORITY,sourceAuthority:'MODEL_DERIVED_SIMULATION',canonicalP6State:projection.canonical.state,canonicalMutation:false,canonicalPromotion:false,microClaim:false,claims:D.freeze({organismTargetIsModeledPopulation:true,instanceGeometryObserved:false,consumerMustResolveMicroscopicRepresentation:true})})
}
O.v1x07OrganismHandoff=D.freeze({VERSION,AUTHORITY,refine});
})(globalThis);
