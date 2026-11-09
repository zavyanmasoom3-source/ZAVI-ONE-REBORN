#!/usr/bin/env python3
"""Real browser test: each PWA installs a complete, current offline shell.

Disposable localhost profile, no account or cloud login, and no customer data.
This tests program assets only, NOT offline financial transaction correctness.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json
import re

with Session() as browser:
 for app in ('one','admin'):
  browser.navigate(app)
  browser.until("""(async()=>{
   if(!('serviceWorker' in navigator))return false;
   const registration=await navigator.serviceWorker.getRegistration('./');
   return !!registration?.active;
  })()""",app+' service worker active',seconds=90)
  status=browser.eval("""(async()=>{
   const registration=await navigator.serviceWorker.getRegistration('./');
   const worker=registration?.active;
   if(!worker)return {error:'No active worker'};
   return await new Promise(resolve=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>resolve({error:'Status message timed out'}),15000);
    channel.port1.onmessage=event=>{
     clearTimeout(timer);channel.port1.close();resolve(event.data||{});
    };
    worker.postMessage({type:'ZAVI_SHELL_STATUS'},[channel.port2]);
   });
  })()""")
  print(json.dumps({'app':app,'status':status},ensure_ascii=False))
  if not isinstance(status,dict):
   raise SystemExit(app+': no status object')
  if status.get('ready') is not True or status.get('app_cached') is not True:
   raise SystemExit(app+': offline shell incomplete: '+str(status.get('missing',status)))
  if status.get('required')!=status.get('cached'):
   raise SystemExit(app+': mismatched offline asset count')
  worker_source=(ROOT/'apps'/app/'sw.js').read_text(encoding='utf-8')
  match=re.search(r'''const CACHE_NAME\s*=\s*['\"]([^'\"]+)['\"];''',worker_source)
  if not match:
   raise SystemExit(app+': service-worker cache identifier missing in source')
  expected_version=match.group(1)
  if status.get('version')!=expected_version:
   raise SystemExit(app+': installed offline cache version '+str(status.get('version'))+
                    ' differs from current source '+expected_version)
 print('PASS: both PWA shells installed and all mandatory assets cached in Chrome')
