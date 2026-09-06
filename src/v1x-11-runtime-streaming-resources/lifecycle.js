(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts;
if(!C)throw new Error('V1X-11 requires PX contracts');
const VERSION='ofu-v1x11-lifecycle-1';
const STATES=Object.freeze(['COLD','WARM','HOT','IMMEDIATE']);
const DOMAINS=Object.freeze(['macro','planet','surface','life','civilization','micro']);
const rank=Object.freeze({COLD:0,WARM:1,HOT:2,IMMEDIATE:3});
function state(value){C.assert(STATES.includes(value),'LIFECYCLE','unknown working-set state '+value);return value;}
function domain(value){C.assert(DOMAINS.includes(value),'LIFECYCLE','unknown materialization domain '+value);return value;}
function identity(input){const value=C.data(input,{bytes:4096,nodes:64});C.keys(value,['providerId','entityId','representationId']);C.token(value.providerId,'provider id');C.hash(value.entityId,'entity id');C.token(value.representationId,'representation id');return value;}
function key(input){const value=identity(input);return value.providerId+'|'+value.entityId+'|'+value.representationId;}
function compare(a,b){return rank[state(a)]-rank[state(b)];}
function atLeast(actual,required){return compare(actual,required)>=0;}
O.v1x11Lifecycle=Object.freeze({VERSION,STATES,DOMAINS,state,domain,identity,key,compare,atLeast});
})(globalThis);
