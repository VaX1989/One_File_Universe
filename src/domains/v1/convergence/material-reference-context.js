(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,R=O.v1MaterialReference,W=O.v1WorldMaterials;
if(!V||!R||!W)throw new Error('material reference context dependencies required');
const VERSION='ofu-v11-material-reference-context-1',previousSourceFor=W.sourceFor;
function sourceFor(world,point,objectId){
 const source=previousSourceFor(world,point,objectId),referenceProperties=R.profile(source);
 V.assert(referenceProperties.sourceEntityId===source.sourceEntityId,'material reference source identity');
 return V.freezeDeep({...source,referenceProperties});
}
O.v1WorldMaterials=Object.freeze({...W,VERSION,sourceFor});
})(globalThis);
