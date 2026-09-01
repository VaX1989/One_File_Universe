(function(root){
'use strict';const O=root.OFU=root.OFU||{};
function run(){const fixed=(a,b)=>Number((BigInt(a)*BigInt(b)+5000n)/10000n);const vector={u32Add:(0xffffffff+2)>>>0,imul:Math.imul(0x7fffffff,3),bigint:(2n**63n-1n).toString(),fixedMul4dp:fixed(12345,67890),quantizedFloat:Math.round((0.1+0.2)*1e9),nativeSin:Math.sin(1),nativeLog:Math.log(2)};return {vector,classes:{u32Add:'D3-candidate',imul:'D3-candidate',bigint:'D3-candidate',fixedMul4dp:'D3-candidate',quantizedFloat:'D2/D3-candidate-after-matrix',nativeSin:'D1-experimental-not-canonical',nativeLog:'D1-experimental-not-canonical'}};}
O.numericExperiment={run};
})(typeof globalThis!=='undefined'?globalThis:this);
