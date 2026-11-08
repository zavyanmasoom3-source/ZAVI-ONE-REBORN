#!/usr/bin/env python3
"""Capture anonymous local-only screens for comparison with approved 59 PDF pages.

Run on GitHub's Chrome runner. Source is served from checkout, not from production.
Screenshots are QA evidence, not product mocks or release proof.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import json
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-screens'
OUT.mkdir(exist_ok=True)
browser=next((shutil.which(c) for c in ('google-chrome','chromium','chromium-browser') if shutil.which(c)),None)
if not browser:raise SystemExit('Chrome is required for visual QA')
SCREENS=[('one','dashboard'),('one','sales'),('one','purchases'),('one','products'),('one','money'),('one','debtors'),('one','settings'),('admin','login')]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
    def do_GET(self):
        target=self.path.split('?')[0]
        if target in ('/apps/one/index.html','/apps/admin/index.html'):
            app=target.split('/')[2]
            html=(ROOT/('apps/'+app+'/index.html')).read_text(encoding='utf-8')
            query=self.path.split('?',1)[1] if '?' in self.path else ''
            route=next((part[6:] for part in query.split('&') if part.startswith('route=')),None)
            if app=='one' and route:
                probe=f"""<script>window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{{try{{go({json.dumps(route)})}}catch(err){{document.body.setAttribute('data-qa-error',String(err))}}}},350),{{once:true}});</script>"""
                html=html.rsplit('</body>',1)[0]+probe+'</body>'+html.rsplit('</body>',1)[1]
            raw=html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(raw)))
            self.end_headers();self.wfile.write(raw)
        else:super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
result=[]
try:
 for app,route in SCREENS:
    with TemporaryDirectory(prefix='zavi-visual-qa-') as profile:
        path=OUT/f'{app}-{route}.png'
        url=f'http://127.0.0.1:{server.server_address[1]}/apps/{app}/index.html?route={route}'
        proc=subprocess.run([browser,'--headless=new','--no-sandbox','--disable-gpu',
            '--disable-dev-shm-usage','--disable-background-networking',
            '--disable-sync','--no-first-run','--no-default-browser-check',
            '--window-size=420,915','--force-device-scale-factor=1',
            '--virtual-time-budget=6000','--user-data-dir='+profile,
            '--screenshot='+str(path),url],capture_output=True,text=True,timeout=80)
        if proc.returncode!=0 or not path.is_file() or path.stat().st_size<2000:
            print(proc.stderr[-1600:])
            raise SystemExit(f'Cannot capture {app}/{route}: exit={proc.returncode}')
        result.append({'app':app,'route':route,'file':path.name,'bytes':path.stat().st_size})
        print('CAPTURED',app,route,path.stat().st_size)
 (OUT/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
finally:server.shutdown()
print('PASS: visual QA screenshots captured. Human/visual PDF comparison remains required.')
