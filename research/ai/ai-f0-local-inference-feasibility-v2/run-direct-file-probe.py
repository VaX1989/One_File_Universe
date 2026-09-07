#!/usr/bin/env python3
"""Research-only direct-file capability probe; aborts any http(s) request."""
import json,pathlib,sys
from playwright.sync_api import sync_playwright
url=pathlib.Path(__file__).with_name('direct-file-probe.html').resolve().as_uri();engines=('chromium','firefox','webkit');results=[]
def classify(message):
  if 'ERR_BLOCKED_BY_ADMINISTRATOR' in message:return 'ENVIRONMENT_POLICY_BLOCKED_FILE_NAVIGATION'
  if "Executable doesn't exist" in message:return 'ENGINE_UNAVAILABLE_IN_EXECUTION_ENVIRONMENT'
  return 'ENVIRONMENT_OR_ENGINE_FAILURE'
with sync_playwright() as p:
  for name in engines:
    browser=None;remote=[]
    try:
      browser_type=getattr(p,name);kwargs={'headless':True}
      if name=='chromium':kwargs['executable_path']='/usr/bin/chromium'
      browser=browser_type.launch(**kwargs);context=browser.new_context()
      def route_handler(route):
        if route.request.url.startswith(('http://','https://')):remote.append(route.request.url);route.abort()
        else:route.continue_()
      context.route('**/*',route_handler);page=context.new_page();page.goto(url,wait_until='load',timeout=10000);page.wait_for_function('window.__OFU_AI_F0_RESULT__ !== undefined',timeout=10000);results.append({'engine':name,'executed':True,'remoteHttpRequestsBlocked':remote,'result':page.evaluate('window.__OFU_AI_F0_RESULT__')})
    except Exception as exc:
      message=str(exc);results.append({'engine':name,'executed':False,'classification':classify(message),'remoteHttpRequestsBlocked':remote,'error':message})
    finally:
      if browser:browser.close()
out={'schema':'ofu-ai-f0-browser-matrix-2','url':url,'policy':'ALL_HTTP_AND_HTTPS_REQUESTS_ABORTED','results':results};print(json.dumps(out,indent=2))
if not any(x['executed'] for x in results):sys.exit(2)
