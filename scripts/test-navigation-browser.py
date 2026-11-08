#!/usr/bin/env python3
"""Browser smoke test of real ZAVI ONE route rendering (not static HTML-only checks).

Runs in GitHub's hosted Chrome against locally served repository files;
never touches production data. No npm dependencies or external URLs required.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html import unescape
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import json
import re
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
browser=next((shutil.which(name) for name in ('google-chrome','chromium','chromium-browser') if shutil.which(name)),None)
if not browser:
    raise SystemExit('ERROR: Chromium/Chrome is required for the route smoke test')

probe=r"""
<script id="zavi-smoke-injected">
window.addEventListener('DOMContentLoaded',()=>{
 setTimeout(()=>{
  const routes=['dashboard','sales','purchases','products','contacts','debtors','creditors','money','reports','settings'];
  const result={routes:[],errors:[]};
  try {
   if(typeof go!=='function')throw Error('main navigation function go() was not defined');
   for(const route of routes) {
    try {
     go(route);
     const box=document.getElementById('content');
     const rendered=box && box.innerText.trim().length>=15;
     const selected=typeof page!=='undefined'&&page===route;
     const nav=document.querySelector('[data-go="'+route+'"].active,[data-go="'+route+'"][aria-current="page"]');
     result.routes.push({route,rendered:!!rendered,selected:!!selected,nav:!!nav});
    }catch(error) {
     result.errors.push({route,error:String(error&&error.stack||error).slice(0,600)});
    }
   }
  }catch(error){result.errors.push({error:String(error&&error.stack||error).slice(0,600)});}
  const out=document.createElement('pre');
  out.id='zavi-smoke-result';out.textContent=JSON.stringify(result);
  document.body.appendChild(out);
 },250);
},{once:true});
</script>
"""
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path.split('?')[0]=='/apps/one/index.html':
            html=(ROOT/'apps/one/index.html').read_text(encoding='utf-8')
            if '</body>' not in html:
                self.send_error(500,'No body to instrument');return
            html=html.replace('</body>',probe+'</body>',1)
            body=html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:super().do_GET()

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
try:
 with TemporaryDirectory(prefix='zavi-smoke-') as profile:
    url=f'http://127.0.0.1:{server.server_address[1]}/apps/one/index.html'
    command=[browser,'--headless=new','--no-sandbox','--disable-gpu',
             '--disable-dev-shm-usage','--no-first-run',
             '--disable-background-networking','--disable-sync','--no-default-browser-check',
             '--disable-extensions','--virtual-time-budget=8000',
             '--user-data-dir='+profile,'--dump-dom',url]
    execution=subprocess.run(command,capture_output=True,text=True,timeout=75)
    output=execution.stdout
    found=re.search(r'<pre id="zavi-smoke-result">([\s\S]*?)</pre>',output)
    if not found:
        print('Chrome exit code:',execution.returncode)
        print('Chrome stderr:',execution.stderr[-2400:])
        print('Chrome HTML tail:',output[-1400:])
        raise SystemExit('ERROR: navigation script did not finish in Chrome')
    result=json.loads(unescape(found.group(1)))
    print(json.dumps(result,ensure_ascii=False,indent=2))
    bad=[x for x in result['routes'] if not all((x['rendered'],x['selected'],x['nav']))]
    if result['errors'] or bad or len(result['routes'])!=10:
        raise SystemExit('FAIL: ZAVI ONE pages did not navigate/render as expected')
    print('PASS: 10 real app routes render and select correctly')
finally:
 server.shutdown()
