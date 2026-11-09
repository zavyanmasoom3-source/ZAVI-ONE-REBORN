#!/usr/bin/env python3
"""Reject parse errors in embedded scripts BEFORE slow browser workflows start.

The ONE main app is currently an HTML shell containing critical inline JS.
External .js syntax checks alone do not detect template-literal errors here.
This inspects scripts independently, matching browser classic-script parsing.
"""
from html.parser import HTMLParser
from pathlib import Path
import subprocess,sys

ROOT=Path(__file__).resolve().parents[1]

class ScriptCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.in_script=False
        self.parts=[]
        self.scripts=[]
        self.script_line=0
    def handle_starttag(self,tag,attrs):
        if tag!='script':return
        meta=dict(attrs)
        kind=str(meta.get('type') or '').strip().lower()
        if meta.get('src') or kind not in ('','text/javascript','application/javascript'):
            self.in_script=False
            return
        self.in_script=True
        self.script_line=self.getpos()[0]
        self.parts=[]
    def handle_data(self,data):
        if self.in_script:self.parts.append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.in_script:
            self.scripts.append((self.script_line,''.join(self.parts)))
            self.in_script=False
            self.parts=[]

total=0
for app in ('one','admin'):
    path=ROOT/'apps'/app/'index.html'
    parser=ScriptCollector()
    parser.feed(path.read_text(encoding='utf-8'))
    checked=0
    for line,code in parser.scripts:
        if not code.strip():continue
        result=subprocess.run(['node','--check'],input=code,text=True,
                              capture_output=True,timeout=12)
        if result.returncode:
            print(f'INVALID INLINE JS: {path.relative_to(ROOT)} near HTML line {line}',
                  file=sys.stderr)
            print(result.stderr[:4000],file=sys.stderr)
            sys.exit(1)
        checked+=1
    assert checked>0,(app,'no classic inline scripts found')
    total+=checked
    print(f'PASS {app}: {checked} real inline JavaScript blocks parse')
print(f'PASS: {total} inline blocks syntactically valid')
