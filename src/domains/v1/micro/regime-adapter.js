(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,P=O.v1MicroPipeline,A=O.v1MicroSourceAdapters;if(!V||!P||!A)throw new Error('v1 micro pipeline and adapters required');
const VERSION='ofu-v1-micro-regime-adapter-1';
function create(sourceSpec,options){const session=P.createSession(sourceSpec,options);return Object.freeze({version:VERSION,order:P.ORDER,step:session.step,request:session.transitionTo,exit:session.exit,snapshot:session.snapshot,current:session.current,portableState:session.portableState,reconcile:session.reconcile,evict:session.evict,source:session.source,session});}
function fromLegacy(legacyMicroscopic,options){return create(A.legacyBiological(legacyMicroscopic),options);}
function compatibility(){const legacy=O.v1ModelRegimeRuntime?.ORDER||Object.keys(O.v1Microscopic?.REGIMES||{});return Object.freeze({contract:'ofu-v1-micro-runtime-compatibility-1',legacyOrder:Object.freeze([...legacy]),waveAOrder:P.ORDER,entryFromSpatial:'LOCAL_TO_MATERIAL',legacyBiologyAdapter:'BIOLOGICAL_TISSUE_SOURCE',geometricZoomClaim:false,sharedRegistryMutation:false});}
O.v1MicroRegimeAdapter=Object.freeze({VERSION,create,fromLegacy,compatibility});
})(globalThis);
