(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v2x14-product-experience-adapter-1';let mounted=null;
async function boot(){
 try{if(O.v1LivingProduct?.ready)await O.v1LivingProduct.ready();if(!mounted&&O.v2x14ProductExperience)mounted=O.v2x14ProductExperience.mount({document,product:O.v1LivingProduct});}catch(error){console.warn('V2X14 product adapter unavailable:',error?.message||error);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
O.v2x14ProductExperienceAdapter=Object.freeze({VERSION,snapshot:()=>mounted?.snapshot?.()||null,boot});
})(globalThis);
