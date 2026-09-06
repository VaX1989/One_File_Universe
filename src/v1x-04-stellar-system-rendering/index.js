(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
for(const key of ['v1x04SystemMath','v1x04OrbitPresentation','v1x04SystemScene','v1x04SystemProvider'])if(!O[key])throw new Error('V1X-04 missing dependency '+key);
O.v1x04StellarSystemRendering=Object.freeze({VERSION:'ofu-v1x-04-stellar-system-rendering-1',math:O.v1x04SystemMath,orbit:O.v1x04OrbitPresentation,scene:O.v1x04SystemScene,provider:O.v1x04SystemProvider});
})(typeof globalThis!=='undefined'?globalThis:this);
