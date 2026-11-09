#!/usr/bin/env python3
"""Guarantee legacy orphaned CSS files never appear on auxiliary ONE pages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
PAGES=['invoice.html','invoice-a5.html','v25-business.html','install.html','offline-check.html']
OLD={'zavi-release-polish-v19.css','zavi-dark-executive-v18.css',
'zavi-dark-executive-v23.css','zavi-theme-v29.css','zavi-final-light-v30.css',
'zavi-light-production-v31.css','zavi-light-hotfix-v32.css',
'zavi-light-finish-v33.css','zavi-light-studio-v34.css','zavi-signature-v35.css',
'zavi-premium-v37.css','zavi-layout-contrast-v40.css','zavi-reborn-design-v1.css',
'zavi-cinematic-v2.css','neon-theme-v47.css','neon-admin-v47.css'}
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
 assert 'data-zavi-utility="' in s,(page,'missing new reference page scope')
 names=[unquote(urlsplit(url).path).split('/')[-1] for url in parser.links]
 assert not set(names).intersection(OLD),(page,'retired CSS still linked',set(names)&OLD)
 assert names[-3:]==['zavi-reference-v3.css','zavi-reference-one-v3.css',
  'zavi-reference-auxiliary-v4.css'],(page,names[-4:])
 assert len(names)==len(set(names)),(page,'duplicate stylesheet links')
 for link in parser.links:
  if urlsplit(link).scheme in ('http','https'):continue
  p=(path.parent/urlsplit(link).path).resolve()
  assert p.is_relative_to(ROOT) and p.is_file(),(page,'missing local CSS',link)
 print('PASS '+page+': loaded only existing local styles and new reference theme')
