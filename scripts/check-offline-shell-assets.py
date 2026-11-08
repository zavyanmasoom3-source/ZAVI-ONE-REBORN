#!/usr/bin/env python3
"""Stop a release with missing, duplicated or uncached mandatory PWA assets.

A JS syntax check alone cannot find missing service-worker precache paths.
This read-only check covers both apps and the three shared contracts.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re

ROOT=Path(__file__).resolve().parents[1]
SHARED={
 '../../packages/shared/database/supabase-config.js',
 '../../packages/shared/security/access-contract.js',
 '../../packages/shared/i18n/language-core.js',
 '../../packages/shared/diagnostics/build-proof-v1.js',
 '../../packages/shared/ui/design-system-v1.css',
 '../../packages/shared/ui/design-system-v1.js',
}

class Refs(HTMLParser):
 def __init__(self):
  super().__init__()
  self.refs=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='script':
   url=attrs.get('src')
  elif tag=='link' and 'stylesheet' in attrs.get('rel','').lower().split():
   url=attrs.get('href')
  else:
   return
  if url and not urlsplit(url).scheme and not url.startswith('//'):
   self.refs.append(unquote(urlsplit(url).path))

for app in ('one','admin'):
 base=ROOT/'apps'/app
 sw=(base/'sw.js').read_text(encoding='utf-8')
 m=re.search(r'const CORE=(\[[\s\S]*?\]);',sw)
 assert m,f'{app}: static CORE must be a literal JS list'
 core=json.loads(m.group(1))
 assert len(core)==len(set(core)),f'{app}: duplicate mandatory offline assets'
 for name in core:
  assert (base/name).resolve().is_file(),f'{app}: missing offline asset: {name}'
 p=Refs()
 p.feed((base/'index.html').read_text(encoding='utf-8'))
 ref_set=set(p.refs)
 missing=[name for name in ref_set if (name.startswith('./') or name in SHARED)
          and name.replace('./','',1) not in core and name not in core]
 assert not missing,f'{app}: entrypoint assets not precached: {missing}'
 for name in SHARED:
  assert name in core,f'{app}: missing shared offline contract: {name}'
 assert 'STATIC.has(' in sw and ('const isScope=' in sw or 'function within(' in sw),f'{app}: cross-scope shared fetch denied'
 print(f'PASS {app}: {len(core)} unique existing offline assets; {len(ref_set)} entrypoint refs covered')
print('PASS: both PWA offline shells contain every mandatory local script and stylesheet')
