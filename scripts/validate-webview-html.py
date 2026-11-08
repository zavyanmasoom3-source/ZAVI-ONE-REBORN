#!/usr/bin/env python3
"""Fail APK builds when inline JS escapes into visible HTML text."""
from html.parser import HTMLParser
from pathlib import Path
import re

class PageCheck(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.script_depth = 0
        self.style_depth = 0
        self.visible = []
        self.scripts = 0
    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.script_depth += 1
            self.scripts += 1
        if tag == 'style':
            self.style_depth += 1
    def handle_endtag(self, tag):
        if tag == 'script':
            self.script_depth = max(0, self.script_depth - 1)
        if tag == 'style':
            self.style_depth = max(0, self.style_depth - 1)
    def handle_data(self, data):
        if not self.script_depth and not self.style_depth:
            self.visible.append(data)

page = Path('android-build/app/src/main/assets/index.html')
if not page.is_file():
    raise SystemExit('Missing staged WebView index.html')
html = page.read_text(encoding='utf-8')
if '<html' not in html.lower() or '</html>' not in html.lower():
    raise SystemExit('Incomplete WebView HTML document')
check = PageCheck()
check.feed(html)
visible = ' '.join(check.visible)
# Multiple JS statements in visible text indicate a premature closing script tag.
signatures = [
    r'\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=',
    r'\bfunction\s+[A-Za-z_$][\w$]*\s*\(',
    r'\breturn\s+const\b',
]
hits = [pattern for pattern in signatures if re.search(pattern, visible)]
if len(hits) >= 2:
    raise SystemExit('JavaScript source appears as visible page text; check inline </script> in templates')
if check.scripts < 1:
    raise SystemExit('No script elements found in WebView application')
print(f'WebView HTML validated: {check.scripts} script elements, no obvious visible JS source')
