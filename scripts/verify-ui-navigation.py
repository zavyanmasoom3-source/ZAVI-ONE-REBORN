#!/usr/bin/env python3
"""Fail CI if the PDF route attribute intercepts all navigation clicks again."""
from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
html = (root / "apps/one/index.html").read_text(encoding="utf-8")
route_map = (root / "apps/one/zavi-pdf-screen-map-v6740.js").read_text(encoding="utf-8")
ui_js = root / "apps/one/zavi-final-settings-store-v6559.js"
ui_css = root / "apps/one/zavi-reborn-design-v1.css"
head = html.split("</head>", 1)[0]

assert "document.body.dataset.zaviPage = route" in route_map, "Missing route attribute contract"
assert "const pagingButton=e.target.closest('button[data-zavi-page][data-direction]');" in html, "Pager must only handle explicit pager buttons"
assert "e.target.closest('[data-zavi-page]')" not in html, "Regression: global body attribute swallows all menu clicks"
assert "let goEl=e.target.closest('[data-go]');if(goEl){go(goEl.dataset.go);return}" in html, "Delegated main route click missing"
for route in ("sales", "purchases", "products", "contacts", "debtors", "creditors", "money", "reports", "settings"):
    assert f"['{route}'," in html, f"Navigation item missing: {route}"

assert '<link rel="stylesheet" href="./zavi-reborn-design-v1.css?v=1"' in head, "REBORN design is not loaded"
assert 'src="./zavi-final-settings-store-v6559.js?' in html, "Canonical settings hub is not loaded"
assert 'src="./zavi-simple-workspace-v1.js' not in html, "Legacy nested settings groups must not run"
assert ui_js.is_file() and ui_css.is_file(), "REBORN settings/design assets missing"
script = ui_js.read_text(encoding="utf-8")
for needle in ("zavi-clean-settings-hub", "zavi-clean-settings-group", "MutationObserver", "search(hub", "zavi-clean-settings-stack", "'account','store','look','security','cloud','invoice','subscription','advanced'"):
    assert needle in script, f"Settings grouping contract missing: {needle}"
if shutil.which("node"):
    subprocess.run(["node", "--check", str(ui_js)], check=True)
print("ZAVI navigation / REBORN settings static checks: PASS")
