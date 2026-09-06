#!/usr/bin/env python3
"""Research-only direct file probe. Does not contact the network."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
url=pathlib.Path(__file__).with_name('direct-file-probe.html').resolve().as_uri()
try:
  with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page()
    page.goto(url,wait_until='load',timeout=10000)
    page.wait_for_function('window.__OFU_AI_F0_RESULT__ !== undefined',timeout=10000)
    print(json.dumps(page.evaluate('window.__OFU_AI_F0_RESULT__'),indent=2)); browser.close()
except Exception as exc:
  print(json.dumps({"schema":"ofu-ai-f0-direct-file-probe-1","executed":False,"classification":"ENVIRONMENT_BLOCKED","error":str(exc)},indent=2))
  sys.exit(2)
