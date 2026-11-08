#!/usr/bin/env python3
"""Static source integrity gate; does not replace device or functional tests."""
from pathlib import Path
import re,sys
failed=[]
for app in ("one","admin"):
    root=Path("apps")/app
    html=(root/"index.html").read_text(encoding="utf-8")
    for name in ("zavi-ui-foundation-v2.css","zavi-preferences-v2.js","zavi-preferences-v2.css","zavi-unified-compact-v1.css"):
        if name not in html: failed.append(f"{app}: entrypoint does not load {name}")
        if not (root/name).is_file(): failed.append(f"{app}: missing asset {name}")
    for code in ("fa-AF","ps-AF","en"):
        if code not in (root/"zavi-preferences-v2.js").read_text(encoding="utf-8"):failed.append(f"{app}: language missing {code}")
    # Every local script and stylesheet referenced by the entrypoint must exist.
    # External https/data URLs and dynamic runtime resources are intentionally excluded.
    static_html=re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.I|re.S)
    for raw in re.findall(r'''(?:src|href)\s*=\s*["']([^"']+)["']''', static_html, flags=re.I):
        path=raw.split("?",1)[0].split("#",1)[0]
        if "${" in path or not path or path.startswith(("tel:","http:","https:","data:","blob:","//","#","mailto:")):
            continue
        candidate=(root/path).resolve()
        if not candidate.is_relative_to(Path.cwd().resolve()):
            failed.append(f"{app}: local asset escapes repository: {raw}")
        elif not candidate.is_file():
            failed.append(f"{app}: missing referenced asset: {raw}")
    print(f"{app}: source assets, linked files, theme/language module checked")
if failed:
    for f in failed:print("ERROR:",f,file=sys.stderr)
    sys.exit(1)
print("Static source integrity: PASS. Functional and visual QA still required.")
