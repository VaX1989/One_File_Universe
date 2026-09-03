import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium,firefox,webkit} from 'playwright';

const require=createRequire(import.meta.url);
const playwrightVersion=require('playwright/package.json').version;
const browserName=process.env.BROWSER||'chromium';
const engine={chromium,firefox,webkit}[browserName];
if(!engine) throw new Error(`unknown browser ${browserName}`);
const expectedBackend=process.env.EXPECTED_BACKEND||'';
const dpr=Number(process.env.DPR||1);
const viewport={width:Number(process.env.VIEWPORT_W||1280),height:Number(process.env.VIEWPORT_H||800)};
const build=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));
const file=path.resolve('dist/One_File_Universe.html');
const url=pathToFileURL(file).href;
const browser=await engine.launch({headless:true});
const context=await browser.newContext({viewport,deviceScaleFactor:dpr});
const page=await context.newPage();
const requests=[];
const pageErrors=[];
page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),navigation:r.isNavigationRequest()}));
page.on('pageerror',e=>pageErrors.push(e.message));

try {
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&globalThis.__OFU_PLANET_PREVIEW__?.session?.active?.size>0,{timeout:30000});
  const probe=await page.evaluate(()=>{
    const S=globalThis.__OFU_PLANET_PREVIEW__;
    const canvas=document.getElementById('planet-view');
    const gl=canvas.getContext('webgl2');
    if(!gl){
      return {backend:S.backend,webgl2Context:false,drawCalls:S.draw?.drawCalls||0,pixelReadback:'NOT_APPLICABLE',glError:'NOT_APPLICABLE',gpuRenderer:'NOT_AVAILABLE',gpuVendor:'NOT_AVAILABLE'};
    }
    const debug=gl.getExtension('WEBGL_debug_renderer_info');
    const renderer=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'NOT_EXPOSED';
    const vendor=debug?gl.getParameter(debug.UNMASKED_VENDOR_WEBGL):'NOT_EXPOSED';
    const snap=OFU.planetRenderCore.cameraSnapshot(S.camera);
    const draw=OFU.planetWebGL2.renderPortable(canvas,S.session,snap,{maxGpuMeshes:48,maxGpuBytes:8*1024*1024});
    const w=Math.min(64,canvas.width),h=Math.min(64,canvas.height);
    const pixels=new Uint8Array(w*h*4);
    gl.readPixels(Math.max(0,Math.floor((canvas.width-w)/2)),Math.max(0,Math.floor((canvas.height-h)/2)),w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let nonBackgroundPixels=0;
    for(let i=0;i<pixels.length;i+=4) if(pixels[i]>20||pixels[i+1]>25||pixels[i+2]>30) nonBackgroundPixels++;
    return {backend:draw.backend,webgl2Context:true,drawCalls:draw.drawCalls||0,pixelReadback:'MEASURED',samplePixels:w*h,nonBackgroundPixels,glError:draw.glError,gpuRenderer:renderer,gpuVendor:vendor,depthBits:gl.getParameter(gl.DEPTH_BITS)};
  });
  const unexpected=requests.filter(r=>!(r.navigation&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));
  if(expectedBackend&&probe.backend!==expectedBackend) throw new Error(`backend mismatch expected=${expectedBackend} actual=${probe.backend}`);
  if(probe.drawCalls<=0) throw new Error('zero renderer draw calls');
  if(probe.backend==='webgl2'){
    if(!probe.webgl2Context) throw new Error('WebGL2 backend without WebGL2 context');
    if(probe.pixelReadback!=='MEASURED'||probe.nonBackgroundPixels<8) throw new Error('WebGL2 pixel evidence missing');
    if(probe.glError!==0) throw new Error(`WebGL2 error ${probe.glError}`);
  }
  if(unexpected.length) throw new Error(`unexpected runtime network ${JSON.stringify(unexpected)}`);
  if(pageErrors.length) throw new Error(`page errors ${JSON.stringify(pageErrors)}`);
  const evidence={
    status:'PASS',sourceCommit:process.env.OFU_SOURCE_SHA||null,artifactSha256:build.artifactSha256,artifactBytes:build.artifactBytes,
    browser:browserName,browserVersion:browser.version(),playwrightVersion,nodeVersion:process.version,
    osPlatform:process.platform,osRelease:os.release(),architecture:process.arch,headless:true,dpr,viewport,
    runnerClass:process.env.RUNNER_CLASS||'UNSPECIFIED_CI_RUNNER',ciProvider:process.env.GITHUB_ACTIONS==='true'?'GITHUB_ACTIONS':'LOCAL_OR_OTHER',
    expectedBackend:expectedBackend||null,...probe,unexpectedNetworkRequests:unexpected.length,pageErrors:pageErrors.length,
    directFile:url.startsWith('file:'),physicalDriverVram:{measurement:'NOT_MEASURABLE',reason:'NO_PORTABLE_BROWSER_API'},
    certificationClass:probe.backend==='webgl2'?'WEBGL2_AUTOMATED_ENGINE':'CANVAS2D_FALLBACK_AUTOMATED_ENGINE',
    realBrowserCertification:false,realDeviceCertification:false
  };
  fs.mkdirSync('dist/evidence/browser-performance',{recursive:true});
  const out=`dist/evidence/browser-performance/capability-${process.platform}-${process.arch}-${browserName}-dpr${dpr}.json`;
  fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence,null,2));
} finally {
  await context.close();
  await browser.close();
}
