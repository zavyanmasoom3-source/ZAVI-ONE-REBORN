#!/usr/bin/env python3
"""Regression: the 12-screenshot reference must be the ONLY active page-wide theme.
Do not delete operational module styling or business handlers.
"""
from pathlib import Path
from urllib.parse import urlsplit
import re
ROOT=Path(__file__).resolve().parents[1]
obsolete={
 'zavi-release-polish-v19.css','zavi-dark-executive-v18.css',
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
    assert hrefs[-1]==f'zavi-reference-{app}-v3.css',(app,hrefs[-4:])
    must={'design-system-v1.css',f'zavi-reference-{app}-v3.css'}
    if app=='one':must.update({'zavi-compact-workflow-v1.css','zavi-barcode-label-v6700.css'})
    else:must.update({'zavi-admin-settings-hub-v1.css','style.css'})
    assert must.issubset(hrefs),(app,'missing functional CSS',sorted(must-set(hrefs)))
    assert not any(('"'+name+'"') in sw or ("'"+name+"'") in sw for name in obsolete)
    assert f"zavi-{app}-ref-12-design-reset-v{'v5' if app=='one' else 'v4'}-20261109" in sw
    print(f'PASS {app}: {len(hrefs)} active CSS links, retired theme files removed from root')
print('PASS: reference theme is the final active design in ONE and ADMIN')
