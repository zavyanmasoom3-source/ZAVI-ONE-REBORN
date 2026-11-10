#!/usr/bin/env python3
"""Guarantee legacy orphaned CSS files never appear on auxiliary ONE pages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
PAGES=['invoice.html','invoice-a5.html','v25-business.html','install.html','offline-check.html']
REJECTED={'zavi-reference-v3.css','zavi-reference-one-v3.css',
'zavi-reference-auxiliary-v4.css','zavi-approved-one-v2.css',
'zavi-showcase-v6668.css','zavi-clean-professional-v6667.css',
'zavi-mobile-photo-qa-v6669.css'}
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag!='link':return
  props=dict(attrs)
  if props.get('rel')=='stylesheet':self.links.append(props.get('href',''))
for page in PAGES:
 path=ROOT/'apps'/'one'/page
 s=path.read_text(encoding='utf8')
 parser=Links();parser.feed(s)
 # Historical utility markup and original CSS are preserved unchanged.
 names=[unquote(urlsplit(url).path).split('/')[-1] for url in parser.links]
 assert not set(names).intersection(REJECTED),(page,'rejected new CSS still linked',set(names)&REJECTED)
 assert names,(page,'missing original local styles')
 assert len(names)==len(set(names)),(page,'duplicate stylesheet links')
 for link in parser.links:
  if urlsplit(link).scheme in ('http','https'):continue
  p=(path.parent/urlsplit(link).path).resolve()
  assert p.is_relative_to(ROOT) and p.is_file(),(page,'missing local CSS',link)
 print('PASS '+page+': kept original utility CSS and removed rejected PDF/newer design')
