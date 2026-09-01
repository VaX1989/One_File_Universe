(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const MANIFEST={protocol:'ofu-canonical-v1',generator:'p1-micro-universe',version:1,domains:{galaxyCell:1,system:1,star:1,planet:1}};
const MANIFEST_HASH='TO_BE_BUILT';
function ctx(seed){return {masterSeed256:seed,manifestHash:O.runtimeManifestHash||MANIFEST_HASH};}
function q(seed,segments,domain,property,counter=0){return O.canonical.deriveU32({...ctx(seed),domainTag:domain,addressBytes:O.canonical.address(segments),propertyTag:property,counter});}
function galaxyCell(seed,x,y,z){const a=[{kind:'text',value:'galaxy-cell'},{kind:'u64',value:BigInt.asUintN(64,BigInt(x))},{kind:'u64',value:BigInt.asUintN(64,BigInt(y))},{kind:'u64',value:BigInt.asUintN(64,BigInt(z))}];return {address:a,occupied:(q(seed,a,'galaxy','occupied')%7)===0,densityQ16:q(seed,a,'galaxy','density')&0xffff};}
function system(seed,cell,index){const a=[...cell.address,{kind:'text',value:'system'},{kind:'u64',value:BigInt(index)}];return {address:a,starCount:1+(q(seed,a,'system','star-count')%3),metallicityQ16:q(seed,a,'system','metallicity')&0xffff};}
function star(seed,sys,index){const a=[...sys.address,{kind:'text',value:'star'},{kind:'u64',value:BigInt(index)}];return {address:a,massMilliSolar:200+(q(seed,a,'star','mass')%1801),temperatureK:2500+(q(seed,a,'star','temp')%7501)};}
function planet(seed,st,index){const a=[...st.address,{kind:'text',value:'planet'},{kind:'u64',value:BigInt(index)}];return {address:a,radiusKm:1800+(q(seed,a,'planet','radius')%68001),orbitMilliAU:50+(q(seed,a,'planet','orbit')%4951),classCode:q(seed,a,'planet','class')%8};}
function publicFact(x){const c={...x};delete c.address;return c;}
function sample(seed,x=0n,y=0n,z=0n){const cell=galaxyCell(seed,x,y,z),sys=system(seed,cell,0),st=star(seed,sys,0),pl=planet(seed,st,0);return {cell:publicFact(cell),system:publicFact(sys),star:publicFact(st),planet:publicFact(pl)};}
O.micro={MANIFEST,galaxyCell,system,star,planet,sample};
})(typeof globalThis!=='undefined'?globalThis:this);
