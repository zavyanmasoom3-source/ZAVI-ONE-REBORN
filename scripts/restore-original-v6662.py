#!/usr/bin/env python3
"""Rebase ONE appearance on the verified, unchanged V66.62 APK web interface.

Preserve current source files for Supabase, accounting, offline, permissions and
stage-3..8 feature modules. Never alter database contents or secrets.
For use on restoration branch ONLY; see scripts/check-v6662-original-restore.py.
"""
from pathlib import Path
import argparse, hashlib, json, re, zipfile

APK_SHA='2eb852d7cdb026ccd828a660328bd26bb474f9880430e0ea3007f51489ee50dc'
ORIGINAL_HTML_SHA='4356e04aa76903229f427bffb1849e43cd1fc51508a8e5367ce5ad948c4a1ba2'
PROJECT='wbbmwfnmurpphwxesssx'
FEATURE_CSS=(
 'zavi-compact-workflow-v1.css','zavi-cheques-v1.css',
 'zavi-warehouses-v1.css','zavi-barcode-label-v6700.css',
 'zavi-message-center-v6720.css','zavi-safe-transfer-v1.css',
 'zavi-in-transit-v1.css'
)
FEATURE_JS=(
 'zavi-compact-workflow-v1.js','zavi-cheques-v1.js','zavi-zxing-offline-v1.js',
 'zavi-warehouses-v1.js','zavi-warehouse-transfers-v1.js',
 'zavi-whatsapp-v1.js','zavi-barcode-label-v6700.js',
 'zavi-message-center-v6720.js','zavi-safe-transfer-v1.js','zavi-in-transit-v1.js'
)
RETIRED_VISUAL_ONLY=(
 'zavi-approved-one-v2.css','zavi-reference-one-v3.css',
 'zavi-owner-reference-login-v1.css','zavi-unified-compact-v1.css',
 'zavi-clean-professional-v6667.css','zavi-showcase-v6668.css',
 'zavi-mobile-photo-qa-v6669.css','zavi-reference-auxiliary-v4.css',
 'zavi-v6662-classic-restore.css','zavi-ui-foundation-v2.css',
 'zavi-entry-appearance.css','zavi-preferences-v2.css',
 'zavi-approved-dashboard-v2.js'
)
FILE_PATTERN=re.compile(r'<(?:link|script)\b[^>]*(?:href|src)=["\x27]([^"\x27]+)')
SCRIPT_TAG=re.compile(r'<script\b[^>]*\bsrc=["\x27]([^"\x27]+)["\x27][^>]*></script>',re.I)
LINK_TAG=re.compile(r'<link\b[^>]*\bhref=["\x27]([^"\x27]+)["\x27][^>]*>',re.I)

def basename(url):
    return url.split('?',1)[0].split('/')[-1]

def restore(apk,root):
    app=root/'apps'/'one'
    if not (root/'apps/admin/index.html').is_file():
        raise RuntimeError('Missing ADMIN app - refuse restoration')
    assert 'ZAVI-ONE-REBORN' in str(root) or (root/'packages/shared').is_dir(), 'wrong repository'
    source=(app/'index.html').read_text(encoding='utf-8')
    with zipfile.ZipFile(apk) as z:
        assert hashlib.sha256(apk.read_bytes()).hexdigest()==APK_SHA, 'Not exact 62MB original APK'
        original=z.read('assets/index.html')
        assert hashlib.sha256(original).hexdigest()==ORIGINAL_HTML_SHA,'Old interface integrity mismatch'
        original_html=original.decode('utf-8')
        assert original_html.rfind('</body>') > len(original_html) - 100, 'Missing actual final document body'
        old_refs=[basename(m.group(1)) for m in FILE_PATTERN.finditer(original_html)
                  if not re.match(r'^(?:https?://|data:|blob:)',m.group(1),re.I)]
        old_css=[x for x in old_refs if x.endswith('.css')]
        assert len(old_css)>=100,(len(old_css),'not the complete original interface')
        copied=[]
        for record in z.infolist():
            if not record.filename.startswith('assets/') or record.is_dir():continue
            relative=Path(record.filename).relative_to('assets')
            if len(relative.parts)!=1:continue
            if relative.suffix not in ('.css','.js','.svg','.png','.webp','.ico','.woff','.woff2','.ttf'):
                continue
            dest=app/relative
            # CSS is always copied byte-identically from the actual V66.62 APK.
            # Leave the current JS when present: cloud, sales and permission
            # logic is newer and must NOT silently revert.
            if relative.suffix=='.css' or not dest.exists():
                dest.write_bytes(z.read(record))
                copied.append(relative.name)
        for src in old_refs:
            if src.startswith('http'):continue
            if not (app/src).exists() and not src.endswith(('.woff2','.ttf')):
                raise RuntimeError('Missing old interface dependency: '+src)
        tags=[]
        feature_list=[]
        for css in FEATURE_CSS:
            p=app/css
            assert p.is_file(),f'Modern feature CSS is missing: {css}'
            assert css not in old_refs,css
            candidates=[m.group(0) for m in LINK_TAG.finditer(source)
                        if basename(m.group(1))==css]
            if len(candidates)!=1:raise RuntimeError('Missing exact source CSS tag: '+css)
            tags.append(candidates[0]);feature_list.append(css)
        for js in FEATURE_JS:
            p=app/js
            assert p.is_file(),f'Modern feature JS is missing: {js}'
            assert js not in old_refs,js
            candidates=[m.group(0) for m in SCRIPT_TAG.finditer(source)
                        if basename(m.group(1))==js]
            if len(candidates)!=1:raise RuntimeError('Missing exact source JS tag: '+js)
            tags.append(candidates[0]);feature_list.append(js)
        # No new design sheet, component skin or reference navigation is
        # allowed to load over the original 66.62 appearance.
        marker='<!-- ZAVI V66.62 ORIGINAL LOOK: original APK index is byte-identical after removing this feature-only block. -->'
        injected='\n'+marker+'\n'+'\n'.join(tags)+'\n'
        last_close=original_html.rfind('</body>')
        assembled=original_html[:last_close]+injected+original_html[last_close:]
        assert assembled.replace(injected,'')==original_html
        (app/'index.html').write_text(assembled,encoding='utf-8')
        # Keep more recent cloud config and server-side OWNER checks in code.
        cloud=(app/'cloud-config.js').read_text(encoding='utf-8')
        assert PROJECT in cloud and 'sb_publishable_' in cloud
        assert (app/'cloud.js').is_file()
        assert (root/'packages/shared/database/supabase-config.js').is_file()
        for n in RETIRED_VISUAL_ONLY:
            p=app/n
            if p.exists():p.unlink()
        # Native WebView and offline PWA must not display a stale cached skin.
        sw=app/'sw.js'
        old_sw=sw.read_text(encoding='utf-8')
        original_assets=sorted(set(old_css))
        missing=[name for name in original_assets if ('"'+name+'"') not in old_sw]
        # Precache originals, plus modern feature module entries for offline.
        add=sorted(set(missing+list(FEATURE_CSS)+list(FEATURE_JS)))
        existing_names=set(re.findall(r'["\x27]([\w./-]+\.(?:css|js))["\x27]',old_sw))
        add=[n for n in add if n not in existing_names]
        replacement="const CORE=[\n"+''.join(f'  "{n}",\n' for n in add)
        assert old_sw.count('const CORE=[')==1
        old_sw=old_sw.replace('const CORE=[',replacement,1)
        old_sw=re.sub(r"const CACHE_NAME='[^']+'",
                      "const CACHE_NAME='zavi-one-exact-original-v6662-restored-20261110-v1'",
                      old_sw,count=1)
        sw.write_text(old_sw,encoding='utf-8')
        proof={
          'original_apk_sha256':APK_SHA,'original_html_sha256':ORIGINAL_HTML_SHA,
          'original_apk_size':62226180,'original_css_count':len(old_css),
          'original_css_order':old_css,'extra_functional_assets':feature_list,
          'retired_new_design_files':list(RETIRED_VISUAL_ONLY),
          'original_css_files_restored':len([n for n in copied if n.endswith('.css')]),
          'current_cloud_and_accounting_js_preserved':True,
          'original_voice_model_must_be_pinned_in_final_apk':True,
          'server_project_id':PROJECT,
          'release_certified':False
        }
        (app/'v6662-original-design-lock.json').write_text(
           json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('RESTORED: exact original 66.62 HTML +',len(old_css),'original CSS references')
        print('RETAINED:',len(feature_list),'modern functional feature scripts/styles')
        print('PRESERVED: all existing sales/finance/cloud JS files and ADMIN')
        print('REMOVED:',len(RETIRED_VISUAL_ONLY),'new-only UI skin files from ONE')
        print('NO PRODUCTION DATABASE WRITE OR FINANCIAL RECORD MIGRATION')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--apk',required=True,type=Path)
    parser.add_argument('--root',required=True,type=Path)
    a=parser.parse_args()
    restore(a.apk,a.root.resolve())
