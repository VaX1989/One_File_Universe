#!/usr/bin/env python3
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  try:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium');page=b.new_page();page.goto('about:blank');result=page.evaluate('''async()=>{const r={protocol:location.protocol,isSecureContext,crossOriginIsolated,wasm:typeof WebAssembly==='object',sharedArrayBuffer:typeof SharedArrayBuffer==='function',webgpuApi:!!navigator.gpu,webgpuAdapter:false,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory??null};if(navigator.gpu){try{r.webgpuAdapter=!!(await navigator.gpu.requestAdapter())}catch(e){r.webgpuError=String(e)}}return r}''');b.close();print(json.dumps({'schema':'ofu-ai-f0-browser-host-capability-1','classification':'HOST_DIAGNOSTIC_NOT_DIRECT_FILE_EVIDENCE','engine':'chromium','result':result},indent=2))
  except Exception as e:
    print(json.dumps({'schema':'ofu-ai-f0-browser-host-capability-1','classification':'ENVIRONMENT_BLOCKED','engine':'chromium','error':str(e)},indent=2));raise
