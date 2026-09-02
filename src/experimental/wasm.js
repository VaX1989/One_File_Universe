(function(root){
'use strict';const O=root.OFU=root.OFU||{};
const BASE64='AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA2FkZAAACgkBBwAgACABags=';
function decode(){const s=atob(BASE64),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;}
async function init(){const t=performance.now(),bytes=decode(),mod=await WebAssembly.instantiate(bytes),ms=performance.now()-t;return {bytes:bytes.byteLength,initMs:ms,add:mod.instance.exports.add,deterministicProbe:mod.instance.exports.add(2147483640,7)};}
async function benchmark(iterations=100000){const w=await init();let x=0,t=performance.now();for(let i=0;i<iterations;i++)x=(x+i)|0;const jsMs=performance.now()-t;t=performance.now();let y=0;for(let i=0;i<iterations;i++)y=w.add(y,i);const wasmMs=performance.now()-t;return {iterations,jsMs,wasmMs,same:x===y,result:x};}
O.wasmExperiment={BASE64,decode,init,benchmark};
})(typeof globalThis!=='undefined'?globalThis:this);
