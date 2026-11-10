#!/usr/bin/env python3
"""Lock the five ORIGINAL CSS blobs from the owner-supplied APKs (10 Nov 2026).

This is an appearance-only contract: do not delete current feature modules,
navigation handlers, cloud code or invoice templates. The user's submitted
Android APKs are reference artifacts, not test/build inputs in GitHub CI.
"""
from pathlib import Path
from urllib.parse import urlsplit
import hashlib
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
BASE={
 'one':[
  ('zavi-clean-professional-v6667.css','9b8651b10b3fbb078f42dee8bda147d83514de65'),
  ('zavi-showcase-v6668.css','d0be9190d12d016ccca547253b46845723b37bf5'),
  ('zavi-mobile-photo-qa-v6669.css','ef4083abd6e697b245e1e5b89de40b6e8775a9c5')],
 'admin':[
  ('zavi-clean-professional-v1458.css','62415c25159c686e770b5135c358410108a7b117'),
  ('zavi-admin-showcase-v1459.css','94123abd913696a54c880e390c9b1ce0392dc05c')]
}
OLD_PAGE_SKINS={
 'one':('zavi-reference-one-v3.css','zavi-approved-one-v2.css',
        'zavi-unified-compact-v1.css','zavi-v6662-classic-restore.css'),
 'admin':('zavi-reference-admin-v3.css','zavi-approved-admin-v2.css',
          'zavi-unified-compact-v1.css','zavi-admin-pdf-final-v1467.css',
          'zavi-admin-classic-safety.css')
}
for app, originals in BASE.items():
    if app=='one' and (ROOT/'apps/one/v6662-original-design-lock.json').is_file():
        subprocess.run([sys.executable,str(ROOT/'scripts/check-v6662-original-restore.py')],check=True)
        print('PASS one: exact OLD 66.62 look, rejected newer skins removed')
        continue
    base=ROOT/'apps'/app
    html=(base/'index.html').read_text(encoding='utf8')
    sw=(base/'sw.js').read_text(encoding='utf8')
    links=re.findall('<link\\b[^>]*>',html,re.I)
    active=[]
    for tag in links:
        if 'stylesheet' not in tag or 'href=' not in tag:
            continue
        if 'media="not all"' not in tag:
            href=re.search('href="([^"]+)"',tag)
            if href:active.append(urlsplit(href.group(1)).path.split('/')[-1])
    expected=[name for name,_ in originals]
    assert active[-len(expected):]==expected,(app,'active original APK skins must load LAST',active[-8:])
    for name,expected_blob in originals:
        tags=[t for t in links if re.search('href="[^"]*'+re.escape(name),t)]
        assert len(tags)==1 and 'media="not all"' not in tags[0],(app,'original skin not active exactly once',name)
        assert 'data-zavi-owner-baseline="apk-uploaded-20261110"' in tags[0],(app,'skin not owner-locked',name)
        raw=(base/name).read_bytes()
        blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+bytes([0])+raw).hexdigest()
        assert blob==expected_blob,(app,'owner original CSS content was changed',name,blob)
        assert '"'+name+'"' in sw,(app,'original CSS missing from offline precache',name)
    for name in OLD_PAGE_SKINS[app]:
        assert not any(name in t and 'media="not all"' not in t for t in links),(app,'replacement skin reenabled',name)
    if app=='admin':
        assert 'zavi-reference-navigation-v3.js' not in html, 'new reference-only ADMIN reordering changes original navigation'
        assert 'account-control.js' in html, 'ADMIN owner security removed'
    else:
        assert all(x in html for x in ('zavi-in-transit-v1.js','zavi-cheques-v1.js','zavi-warehouses-v1.js')), 'ONE functional modules missing'
    cache=re.search(r"const CACHE_NAME='([^']+)'",sw)
    assert cache and 'owner-apk-style-lock' in cache.group(1),(app,'old design remains offline-cached')
    assert '../../packages/shared/ui/design-system-v1.css' in sw,(app,'shared feature styles missing')
    print('PASS',app,'owner APK originals locked exactly, last in cascade, cache rotated, features retained')
print('PASS: user-submitted ZAVI ONE and ADMIN original designs are immutable in source')
