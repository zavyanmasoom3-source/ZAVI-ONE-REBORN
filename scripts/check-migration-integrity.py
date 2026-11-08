#!/usr/bin/env python3
"""Read-only migration gate. Incomplete imports MUST fail, never publish an APK."""
from pathlib import Path
from collections import Counter
import re, json, subprocess, sys
root=Path(__file__).resolve().parents[1]
failures=[]
for app in ('one','admin'):
    base=root/'apps'/app
    html=base/'index.html'
    if not html.exists():
        failures.append(f'{app}: missing index.html')
        continue
    text=html.read_text(encoding='utf-8')
    # Only the actual document head, not markup embedded in JS template literals.
    head=text.split('</head>',1)[0]
    references=re.findall(r'<(?:script|link)\b[^>]*?(?:src|href)=["\']\./([^"\']+\.(?:js|css)(?:\?[^"\']*)?)["\']',head,re.I)
    assets=[x.split('?',1)[0] for x in references]
    for path in assets:
        if not (base/path).is_file():
            failures.append(f'{app}: missing referenced asset {path}')
    for name,n in Counter(assets).items():
        if n>1:failures.append(f'{app}: duplicate loaded asset {name} ({n} times)')
    for p in base.glob('*.json'):
        try:json.loads(p.read_text(encoding='utf-8'))
        except (ValueError,UnicodeError) as e:failures.append(f'{app}: invalid JSON {p.name}: {e}')
    print(f'{app}: checked {len(assets)} head references')
if failures:
    print('MIGRATION INCOMPLETE - build blocked:',file=sys.stderr)
    for x in failures:print(' - '+x,file=sys.stderr)
    sys.exit(1)
print('PASS: source asset dependency integrity')
