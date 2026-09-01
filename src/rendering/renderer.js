(function(root){
'use strict';const O=root.OFU=root.OFU||{};
function probe(){const c=document.createElement('canvas');let gl2=null;try{gl2=c.getContext('webgl2');}catch{}return {webgl2:!!gl2,webgpu:!!(navigator&&navigator.gpu),worker:typeof Worker==='function',blob:typeof Blob==='function',sharedArrayBuffer:typeof SharedArrayBuffer==='function',secureContext:!!root.isSecureContext};}
function render(canvas,facts,quality='baseline'){let gl=null;try{gl=canvas.getContext('webgl2',{antialias:quality!=='low'});}catch{}if(!gl){const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#05070d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#9ad7ff';ctx.fillText('OFU diagnostic fallback',16,28);}return {backend:'2d-fallback'};}gl.viewport(0,0,canvas.width,canvas.height);const t=(facts.star.temperatureK-2500)/7500;gl.clearColor(0.02+0.08*t,0.025,0.06+0.08*(1-t),1);gl.clear(gl.COLOR_BUFFER_BIT);return {backend:'webgl2'};}
O.renderer={probe,render};
})(typeof globalThis!=='undefined'?globalThis:this);
