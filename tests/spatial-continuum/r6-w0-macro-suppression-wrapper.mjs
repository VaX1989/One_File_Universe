import assert from 'node:assert/strict';
import { createMacroSuppressedOpenUniverse } from '../../src/experiments/spatial-continuum/renderer-phase2.js';

let revision=1;
const authority={};
Object.defineProperties(authority,{
  catalogueFor:{value:()=>Object.freeze(['real-catalogue']),enumerable:true,writable:false,configurable:false},
  path:{get:()=>Object.freeze({revision}),enumerable:true,configurable:false},
  focus:{get:()=>`focus-${revision}`,enumerable:true,configurable:false},
  select:{value:id=>`selected:${id}`,enumerable:true,writable:false,configurable:false}
});
Object.freeze(authority);
const wrapper=createMacroSuppressedOpenUniverse(authority);
assert.notEqual(wrapper,authority);
assert.equal(Object.isFrozen(wrapper),true);
assert.deepEqual(wrapper.catalogueFor(),[],'base renderer wrapper must suppress only direct macro catalogue consumption');
assert.equal(wrapper.path.revision,1);assert.equal(wrapper.focus,'focus-1');revision=2;assert.equal(wrapper.path.revision,2,'dynamic authority getters must remain live through the wrapper');assert.equal(wrapper.focus,'focus-2');assert.equal(wrapper.select('x'),'selected:x');assert.deepEqual(authority.catalogueFor(),['real-catalogue'],'authoritative openUniverse must remain untouched');
const descriptor=Object.getOwnPropertyDescriptor(wrapper,'catalogueFor');assert.equal(descriptor.configurable,false);assert.equal(descriptor.writable,false);
console.log(JSON.stringify({status:'PASS',suite:'r6-w0-phase2-frozen-open-universe-wrapper',proxyInvariantSafe:true,dynamicGettersPreserved:true,authoritativeObjectUntouched:true,macroCatalogueSuppressedForBaseRenderer:true},null,2));
