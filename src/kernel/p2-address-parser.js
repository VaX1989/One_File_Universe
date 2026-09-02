(function(root){
'use strict';
const P=(root.OFU||{}).p2;if(!P)throw new Error('P2 canonical kernel required');
if(typeof P.parseAddress!=='function'||typeof P.validateAddressBytes!=='function')throw new Error('P2 address parser unavailable');
function plain(v){return !!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)}
function dataObject(v,keys,name){
  if(!plain(v))throw new Error('OFU canonical: '+name+' must be a plain map');
  const own=Reflect.ownKeys(v);if(own.some(k=>typeof k!=='string'))throw new Error('OFU canonical: '+name+' has unsupported fields');
  const a=own.slice().sort(),b=keys.slice().sort();if(a.length!==b.length||a.some((k,i)=>k!==b[i]))throw new Error('OFU canonical: '+name+' has missing or unknown fields');
  for(let i=0;i<keys.length;i++){const d=Object.getOwnPropertyDescriptor(v,keys[i]);if(!d||!d.enumerable||!('value' in d))throw new Error('OFU canonical: '+name+' unsupported property')}
  return v;
}
const manifestKeys=['semanticManifestVersion','canonicalProtocolVersion','canonicalAddressVersion','unicodeProfileVersion','numericContractVersion','generatorSuite','generatorSuiteVersion','subsystems','domains','dependencies','lawProfile','genesis'];
const manifestGuard=m=>dataObject(m,manifestKeys,'Semantic Generator Manifest');
const rawValidate=P.validateSemanticManifest,rawManifest=P.semanticManifest,rawManifestHash=P.semanticManifestHash,rawAddress=P.address,rawDerive=P.derive;
P.validateSemanticManifest=m=>(manifestGuard(m),rawValidate(m));
P.semanticManifest=m=>(manifestGuard(m),rawManifest(m));
P.semanticManifestHash=m=>(manifestGuard(m),rawManifestHash(m));
P.address=segments=>{if(Array.isArray(segments))for(let i=0;i<segments.length;i++){const d=Object.getOwnPropertyDescriptor(segments,String(i));if(d&&'value'in d)dataObject(d.value,['kind','value'],'address segment')}return rawAddress(segments)};
P.derive=args=>(dataObject(args,['masterSeed','semanticManifestHash','domain','addressBytes','property','counter'],'derive arguments'),rawDerive(args));
})(typeof globalThis!=='undefined'?globalThis:this);
