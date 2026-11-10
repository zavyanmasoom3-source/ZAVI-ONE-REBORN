#!/usr/bin/env python3
"""Owner-approved classic V66.62-style appearance guard.
Keep modern feature CSS/JS and both apps offline-safe; reject newer skins.
"""
from pathlib import Path
from urllib.parse import urlsplit
import re
ROOT=Path(__file__).resolve().parents[1]
obsolete={
 'zavi-graphic-refresh.css','zavi-release-polish-v19.css','zavi-dark-executive-v18.css',
 'zavi-dark-executive-v23.css','zavi-theme-v29.css',
 'zavi-final-light-v30.css','zavi-light-production-v31.css',
 'zavi-light-hotfix-v32.css','zavi-light-finish-v33.css',
 'zavi-light-studio-v34.css','zavi-signature-v35.css',
 'zavi-premium-v37.css','zavi-layout-contrast-v40.css',
 'zavi-reborn-design-v1.css','zavi-cinematic-v2.css',
 'neon-theme-v47.css','neon-admin-v47.css'
}
for app in ('one','admin'):
    html=(ROOT/'apps'/app/'index.html').read_text(encoding='utf8')
    sw=(ROOT/'apps'/app/'sw.js').read_text(encoding='utf8')
    hrefs=[m.group(1).split('?')[0].split('/')[-1] for m in re.finditer(
        r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\']([^"\']+)',html,re.I)]
    violations=obsolete.intersection(hrefs)
    assert not violations,(app,'obsolete loaded',sorted(violations))
    for name in obsolete:
        assert not (ROOT/'apps'/app/name).exists(),(app,'retired CSS physically present',name)
    assert len(hrefs)==len(set(hrefs)),(app,'duplicate runtime CSS links')
    assert hrefs.index('zavi-reference-v3.css')>hrefs.index('zavi-approved-visual-v2.css')
    if app=='one':
        assert hrefs[-1]=='zavi-v6662-classic-restore.css',(app,hrefs[-4:])
        assert '"zavi-v6662-classic-restore.css"' in sw,('classic safety CSS not cached',app)
        retired_skins=('zavi-clean-professional-v6667.css','zavi-showcase-v6668.css',
                       'zavi-mobile-photo-qa-v6669.css','zavi-pdf-final-v6760.css',
                       'zavi-unified-compact-v1.css','zavi-approved-one-v2.css',
                       'zavi-owner-reference-login-v1.css','zavi-reference-one-v3.css')
    else:
        assert hrefs[-1]=='zavi-reference-admin-v3.css',(app,hrefs[-4:])
        retired_skins=('zavi-clean-professional-v1458.css','zavi-admin-showcase-v1459.css',
                       'zavi-admin-pdf-final-v1467.css','zavi-unified-compact-v1.css',
                       'zavi-approved-admin-v2.css','zavi-reference-admin-v3.css')
    for name in retired_skins:
        tags=re.findall(r'<link[^>]*>',html,re.I)
        relevant=[tag for tag in tags if name in tag]
        assert len(relevant)==1,(app,'missing/duplicate controlled skin',name)
        assert 'media="not all"' in relevant[0],(app,'new skin was reactivated',name)
    assert 'zavi-classic6662-v1' not in html,(app,'unexpected legacy marker')
    must={'design-system-v1.css',f'zavi-reference-{app}-v3.css'}
    if app=='one':must.update({'zavi-compact-workflow-v1.css','zavi-barcode-label-v6700.css'})
    else:must.update({'zavi-admin-settings-hub-v1.css','style.css'})
    assert must.issubset(hrefs),(app,'missing functional CSS',sorted(must-set(hrefs)))
    assert not any(('"'+name+'"') in sw or ("'"+name+"'") in sw for name in obsolete)
    cache=re.search(r"const CACHE_NAME='([^']+)'",sw)
    assert cache and cache.group(1).startswith(f'zavi-{app}-design-tokens-unified-'),(app,'stale design token cache')
    assert '"../../packages/shared/ui/design-system-v1.css"' in sw,(app,'shared design not offline cached')
    assert '"../../packages/shared/ui/design-system-v1.js"' in sw,(app,'shared design helpers not offline cached')
    print(f'PASS {app}: classic styling enabled; {len(retired_skins)} newer skins inactive; functional CSS retained')
print('PASS: original classic appearance is active; newer-only skins are inert in both apps')
