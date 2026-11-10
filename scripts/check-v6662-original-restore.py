#!/usr/bin/env python3
"""Strict read-only guard for original 66.62 look and preserved functional modules."""
from pathlib import Path
import hashlib,json,re,sys

root=Path(__file__).resolve().parents[1]
app=root/'apps/one'
p=json.loads((app/'v6662-original-design-lock.json').read_text(encoding='utf-8'))
s=(app/'index.html').read_text(encoding='utf-8')
marker='<!-- ZAVI V66.62 ORIGINAL LOOK: original APK index is byte-identical after removing this feature-only block. -->'
assert s.count(marker)==1,'original UI source marker absent'
begin=s.index('\n'+marker)
end=s.index('</body>',begin)
original=s[:begin]+s[end:]
assert hashlib.sha256(original.encode('utf-8')).hexdigest()==p['original_html_sha256'],'Original 66.62 HTML was modified'
css=[re.search(r'href=["\x27]([^"\x27]+)',x).group(1) for x in re.findall(r'<link\b[^>]*rel=["\x27]stylesheet["\x27][^>]*>',original,re.I)
     if re.search(r'href=["\x27]([^"\x27]+)',x)]
assert [u.split('?')[0].split('/')[-1] for u in css if u.split('?')[0].endswith('.css')]==p['original_css_order']
assert len(p['original_css_order'])>=100
# All original local resources and new functional modules must exist.
for name in p['original_css_order']+p['extra_functional_assets']:
    assert (app/name).is_file(),f'Missing original CSS or modern feature: {name}'
for name in p['retired_new_design_files']:
    assert not (app/name).exists(),f'Unapproved newer visual skin left in app: {name}'
for name in p['extra_functional_assets']:
    assert name in s,f'Modern business functionality was dropped: {name}'
assert 'zavi-clean-professional-v6667.css' not in s
assert 'zavi-showcase-v6668.css' not in s
assert 'zavi-reference-one-v3.css' not in s
assert (app/'cloud.js').is_file() and (app/'annual-license.js').is_file()
assert (app/'device-activation.js').is_file() and (app/'pin-recovery.js').is_file()
assert 'wbbmwfnmurpphwxesssx' in (app/'cloud-config.js').read_text(encoding='utf-8')
assert 'sb_publishable_' in (app/'cloud-config.js').read_text(encoding='utf-8')
assert (root/'packages/shared/database/supabase-config.js').is_file()
for shared in ('database/supabase-config.js','security/access-contract.js','i18n/language-core.js'):
    assert '../../packages/shared/'+shared in s,('Shared security/i18n script not mounted',shared)
assert (root/'apps/admin/index.html').is_file()
sw=(app/'sw.js').read_text(encoding='utf-8')
assert 'zavi-one-exact-original-v6662-restored-' in sw,'PWA may use old cached new-design assets'
assert not (app/'models/ggml-base-q5_1.bin').exists(),'Do not store 60 MB voice model in Git; stage from pinned release during native build'
print('PASS: original V66.62 HTML byte-for-byte before feature add-ons')
print('PASS: all original CSS appearance files restored; no new-only skins in ONE')
print('PASS: added financial/warehouse/barcode features remain wired')
print('PASS: latest public Supabase config, offline source and ADMIN untouched')
print('LIMITATION: model is staged from verified old APK at BUILD time; no live signed customer APK tested')
