#!/usr/bin/env python3
"""Read-only audit before physically pruning retired presentation assets.

Keeps all customer data, functional Javascript, database code and route styling.
Prints every source reference to retired files, excluding self-referential old
CSS and human-facing docs. No file is removed until references are accounted for.
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
retired={
 'zavi-graphic-refresh.css','zavi-release-polish-v19.css','zavi-dark-executive-v18.css',
 'zavi-dark-executive-v23.css','zavi-theme-v29.css',
 'zavi-final-light-v30.css','zavi-light-production-v31.css',
 'zavi-light-hotfix-v32.css','zavi-light-finish-v33.css',
 'zavi-light-studio-v34.css','zavi-signature-v35.css',
 'zavi-premium-v37.css','zavi-layout-contrast-v40.css',
 'zavi-reborn-design-v1.css','zavi-cinematic-v2.css',
 'neon-theme-v47.css','neon-admin-v47.css'
}
extensions={'.html','.css','.js','.mjs','.cjs','.ts','.tsx','.jsx','.json','.xml','.kt','.java','.gradle','.properties','.sh'}
skips={'node_modules','.git','dist','build','coverage','.gradle'}
report={}
for app in ('one','admin'):
 base=root/'apps'/app
 paths=[]
 for folder in [base,root/'packages'/'shared']:
  for p in folder.rglob('*'):
   if not p.is_file() or p.suffix.lower() not in extensions or skips.intersection(p.parts):continue
   if p.name in retired:continue
   paths.append(p)
 text={p:p.read_text(encoding='utf8',errors='replace') for p in paths}
 summary={}
 for name in sorted(retired):
  asset=base/name
  if not asset.exists():continue
  refs=[]
  for p,c in text.items():
   if name in c:refs.append(str(p.relative_to(root)))
  summary[name]=refs
 report[app]=summary
 print(f'{app}: {len(summary)} retired CSS files still exist')
 for name,refs in summary.items():
  print('  '+name+(' referenced by '+', '.join(refs) if refs else ' - SAFE FOR PHYSICAL DELETION'))
print('AUDIT_JSON='+json.dumps(report,sort_keys=True))
