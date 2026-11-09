#!/usr/bin/env python3
"""Chrome DevTools Protocol over stdlib WebSocket; real-time wait for WebCrypto PIN.

Only used for local, disposable browser QA. Production authentication isn't bypassed.
"""
from base64 import b64encode, b64decode
from contextlib import suppress
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.request import urlopen
import json
import os
import shutil
import socket
import struct
import subprocess
import time
import uuid

ROOT=Path(__file__).resolve().parents[1]
def chrome_path():
    return next((shutil.which(c) for c in ('google-chrome','chromium','chromium-browser') if shutil.which(c)),None)
def exact(sock,n):
    data=b''
    while len(data)<n:
        chunk=sock.recv(n-len(data))
        if not chunk:raise ConnectionError('Chrome CDP connection closed')
        data+=chunk
    return data
class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
class Session:
    def __enter__(self):
        exe=chrome_path()
        if not exe:raise RuntimeError('Google Chrome/Chromium missing')
        self.server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
        Thread(target=self.server.serve_forever,daemon=True).start()
        self.web='http://127.0.0.1:'+str(self.server.server_address[1])
        # Ephemeral CI runners can reject the first Chrome process. Retry with
        # a fresh isolated profile; never reuse one with a stale singleton lock.
        for attempt in range(3):
            self.tmp=TemporaryDirectory(prefix='zavi-chrome-')
            self.proc=subprocess.Popen([exe,'--headless=new','--no-sandbox','--disable-gpu',
                '--disable-dev-shm-usage','--disable-sync','--no-first-run',
                '--disable-background-networking','--remote-allow-origins=*',
                '--remote-debugging-port=0','--user-data-dir='+self.tmp.name,'about:blank'],
                stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            f=Path(self.tmp.name)/'DevToolsActivePort'
            for _ in range(180):
                if f.exists():break
                if self.proc.poll() is not None:break
                time.sleep(.1)
            if f.exists():break
            with suppress(Exception):
                self.proc.terminate()
                self.proc.wait(timeout=4)
            with suppress(Exception):self.proc.kill()
            self.tmp.cleanup()
            if attempt<2:time.sleep(.6)
        else:
            raise RuntimeError('Chrome CDP port unavailable after 3 isolated attempts')
        port=int(f.read_text().splitlines()[0])
        targets=json.loads(urlopen(f'http://127.0.0.1:{port}/json/list').read())
        page=next((x for x in targets if x.get('type')=='page'),None)
        if not page:raise RuntimeError('No CDP page')
        from urllib.parse import urlparse
        ws=urlparse(page['webSocketDebuggerUrl'])
        self.sock=socket.create_connection((ws.hostname,ws.port),timeout=35)
        key=b64encode(os.urandom(16)).decode()
        self.sock.sendall((f'GET {ws.path} HTTP/1.1\r\nHost: {ws.hostname}:{ws.port}\r\n'
          'Connection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\n'
          f'Sec-WebSocket-Key: {key}\r\nOrigin: http://localhost\r\n\r\n').encode())
        buf=b''
        while b'\r\n\r\n' not in buf:buf+=self.sock.recv(4096)
        if b' 101 ' not in buf.split(b'\r\n',1)[0]:raise RuntimeError('CDP websocket handshake rejected')
        self.leftover=buf.split(b'\r\n\r\n',1)[1]
        self.next_id=1
        self.command('Page.enable');self.command('Runtime.enable')
        self.command('Emulation.setDeviceMetricsOverride',{'width':420,'height':915,
          'deviceScaleFactor':1,'mobile':True,'screenWidth':420,'screenHeight':915})
        return self
    def _read(self,n):
        data=self.leftover[:n];self.leftover=self.leftover[n:]
        if len(data)<n:data+=exact(self.sock,n-len(data))
        return data
    def _receive(self):
        while True:
            head=self._read(2)
            opcode=head[0]&0x0f
            length=head[1]&127
            if length==126:length=struct.unpack('!H',self._read(2))[0]
            elif length==127:length=struct.unpack('!Q',self._read(8))[0]
            masked=head[1]&128
            mask=self._read(4) if masked else None
            data=self._read(length)
            if mask:data=bytes(x^mask[i%4] for i,x in enumerate(data))
            if opcode==1:return json.loads(data)
            if opcode==8:raise ConnectionError('CDP websocket closed')
            if opcode==9:self._send(data,opcode=10)
    def _send(self,data,opcode=1):
        if isinstance(data,str):data=data.encode('utf-8')
        l=len(data);mask=os.urandom(4)
        head=bytes([0x80|opcode])
        if l<126:head+=bytes([0x80|l])
        elif l<65536:head+=bytes([0x80|126])+struct.pack('!H',l)
        else:head+=bytes([0x80|127])+struct.pack('!Q',l)
        self.sock.sendall(head+mask+bytes(x^mask[i%4] for i,x in enumerate(data)))
    def command(self,method,params=None):
        id=self.next_id;self.next_id+=1
        self._send(json.dumps({'id':id,'method':method,'params':params or {}}))
        while True:
            msg=self._receive()
            if msg.get('id')!=id:continue
            if 'error' in msg:raise RuntimeError(method+': '+str(msg['error']))
            return msg['result']
    def eval(self,js):
        res=self.command('Runtime.evaluate',{'expression':js,'awaitPromise':True,'returnByValue':True})
        if res.get('exceptionDetails'):
            raise RuntimeError('JS error: '+str(res['exceptionDetails'].get('text')))
        return res.get('result',{}).get('value')
    def until(self,condition,label,seconds=25):
        t=time.monotonic()
        while time.monotonic()-t<seconds:
            try:
                if self.eval(condition):return
            except Exception:pass
            time.sleep(.1)
        raise RuntimeError('Timeout: '+label)
    def navigate(self,app):
        self.command('Page.navigate',{'url':self.web+'/apps/'+app+'/index.html'})
        self.until('document.readyState==="complete"&&location.pathname==="/apps/'+app+'/index.html"',app+' ready')
    def unlock_one(self):
        self.navigate('one')
        self.until('typeof go==="function"&&!!document.getElementById("zawiPinForm")','app initialized')
        status=self.eval("""(()=>{
          const pass=document.getElementById('zawiPinOne'),repeat=document.getElementById('zawiPinRepeat'),form=document.getElementById('zawiPinForm');
          if(!pass||!repeat||!form)return false;
          pass.value='987654321';repeat.value='987654321';
          form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
          return true;
        })()""")
        if not status:raise RuntimeError('PIN form missing')
        self.until('!document.documentElement.classList.contains("zawi-locked")','PIN setup/authentication',30)
        return self.eval("document.getElementById('zawiPinError')?.textContent||''")
    def route(self,name):
        result=self.eval("""(()=>{
         go(%s);
         const e=document.getElementById('content');
         return {route:%s,selected:typeof page!=='undefined'&&page===%s,
          active:!!document.querySelector('[data-go="%s"].active,[data-go="%s"][aria-current="page"]'),
          visible:!!e&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>0&&e.innerText.trim().length>15,
          locked:document.documentElement.classList.contains('zawi-locked'),
          length:e?.innerText.length||0};
        })()""" % (json.dumps(name),json.dumps(name),json.dumps(name),name,name))
        return result
    def screenshot(self):
        return b64decode(self.command('Page.captureScreenshot',{'format':'png',
           'captureBeyondViewport':False})['data'])
    def __exit__(self,*exc):
        with suppress(Exception):self.sock.close()
        with suppress(Exception):self.proc.terminate();self.proc.wait(timeout=6)
        with suppress(Exception):self.server.shutdown();self.server.server_close()
        with suppress(Exception):self.tmp.cleanup()
