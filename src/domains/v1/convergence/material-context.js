(function(root){
'use strict';
const O=root.OFU,V=O.v1Common,W=O.v1WorldContext,M=O.v1Materials;
if(!W||!M||!O.v1MicroSourceAdapters)throw new Error('World/material context dependencies required');
const VERSION='ofu-wave-a-material-context-1';
function sourceFor(world,point,objectId){
 const context=W.localContext(world,point),object=context.objects.find(x=>x.entityId===objectId);
 V.assert(object,'selected local object absent from this exact world/location');
 const common={sourceEntityId:object.entityId,parentEntityId:point.locationIdentity,provider:'v1.query.material-source',authority:'MODEL_DERIVED_SIMULATION',
   temperatureMilliK:context.surface.climate.localMeanTemperatureMilliK,metadata:{worldIdentity:world.planetIdentity,location:point,sourceObjectKind:object.kind,canonicalCompositionClaim:false}};
 if(object.kind==='WATER'||object.kind==='ICE')return M.source({...common,kind:object.kind,
   chemistryAuthority:M.CHEMISTRY.MODEL_DERIVED,components:[{id:'WATER_MODEL',formula:'H2O',ppm:1000000,authority:M.CHEMISTRY.MODEL_DERIVED}],
   metadata:{...common.metadata,chemistryAssumption:'H2O representation of the reduced water/ice model; not a measured sample'}});
 if(object.kind==='ROCK'){
   const raw=O.v1MicroSourceAdapters.rock({planetProfile:world.planetology,surfaceCell:{cellId:object.entityId}});
   return M.source({...raw,...common,metadata:{...common.metadata,materialFamily:context.surface.material.materialFamily}});
 }
 if(object.kind==='ATMOSPHERE')return M.source({...common,kind:'ATMOSPHERE',chemistryAuthority:M.CHEMISTRY.UNRESOLVED,components:[]});
 if(object.kind==='ORGANISM')return M.source({...common,kind:'BIOLOGICAL_TISSUE',
   biologicalOrganization:object.population.traits?.multicellularityPpm>=500000?'MODEL_SUPPORTED_MULTICELLULAR_DOMAINS':null,
   structure:object.population.traits?.multicellularityPpm>=500000?'BIOLOGICAL_SUPPORTED':'UNRESOLVED',
   chemistryAuthority:M.CHEMISTRY.UNRESOLVED,components:[],metadata:{...common.metadata,lineageId:object.population.lineageId,populationId:object.population.populationId}});
 if(object.kind==='ARTIFACT'){
   V.assert(object.technologySupported&&world.civilization.state==='MODELED_CIVILIZATION','manufacturing requires modeled technology');
   return M.source({...common,kind:'ARTIFACT',technologySupported:true,structure:'POROUS_AGGREGATE',components:[],chemistryAuthority:M.CHEMISTRY.UNRESOLVED,
     metadata:{...common.metadata,settlementId:object.settlement.settlementId,materialFamily:'MODELED_CONSTRUCTION_AGGREGATE',historyEpoch:world.civilization.epoch}});
 }
 throw new Error('Select a material, organism, or manufactured sample, not an aggregate settlement');
}
O.v1WorldMaterials=Object.freeze({VERSION,sourceFor});
})(globalThis);
