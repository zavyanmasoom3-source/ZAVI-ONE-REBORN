#!/usr/bin/env python3
"""Read-only gate for packaged Android WebView source dependencies.

A valid migration must include *every* local script, stylesheet, icon, image,
manifest and shared module referenced by either application entry point.
Generated APKs must never rely on the browser cache for missing files.
"""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
FAILURES = []


class References(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.assets = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        rel = (attrs.get('rel') or '').lower().split()
        if tag in ('script', 'img', 'iframe', 'source'):
            url = attrs.get('src')
        elif tag == 'link' and any(r in rel for r in ('stylesheet', 'icon', 'apple-touch-icon', 'manifest')):
            url = attrs.get('href')
        else:
            return
        if url:
            self.assets.append((tag, tuple(rel), url))


def check_asset(app, base, tag, rel, url, loaded):
    if url.startswith(('#', '//', 'data:', 'blob:', 'mailto:', 'tel:')):
        return
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc:
        return
    raw = unquote(parsed.path)
    if not raw:
        return
    # Absolute URLs point to the web origin, not the /assets folder inside the APK.
    if raw.startswith('/'):
        FAILURES.append(f'{app}: root-relative local URL cannot be packaged: {url}')
        return
    target = (base / raw).resolve()
    if not target.is_relative_to(ROOT):
        FAILURES.append(f'{app}: reference escapes repository: {url}')
    elif not target.is_file():
        FAILURES.append(f'{app}: missing referenced {tag} asset: {url}')
    elif tag == 'script' or (tag == 'link' and 'stylesheet' in rel):
        loaded.append(str(target.relative_to(ROOT)))


def audit(app):
    base = ROOT / 'apps' / app
    html_file = base / 'index.html'
    if not html_file.is_file():
        FAILURES.append(f'{app}: missing index.html')
        return
    try:
        html = html_file.read_text(encoding='utf-8')
        parser = References()
        parser.feed(html)
    except (UnicodeError, ValueError) as exc:
        FAILURES.append(f'{app}: invalid entrypoint: {exc}')
        return
    loaded = []
    for tag, rel, url in parser.assets:
        check_asset(app, base, tag, rel, url, loaded)
    for filename, count in Counter(loaded).items():
        if count > 1:
            FAILURES.append(f'{app}: script/stylesheet loaded {count} times: {filename}')
    for filename in base.rglob('*.json'):
        try:
            json.loads(filename.read_text(encoding='utf-8'))
        except (ValueError, UnicodeError) as exc:
            FAILURES.append(f'{app}: invalid JSON {filename.relative_to(base)}: {exc}')
    print(f'{app}: checked {len(parser.assets)} entrypoint asset references and JSON files')


for required in (
    'gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.jar',
    'gradle/wrapper/gradle-wrapper.properties', 'settings.gradle', 'build.gradle',
    'android-build/app/src/main/AndroidManifest.xml',
    'packages/shared/database/supabase-config.js',
    'packages/shared/security/access-contract.js',
    'packages/shared/i18n/language-core.js',
):
    if not (ROOT / required).is_file():
        FAILURES.append(f'missing required build/shared file: {required}')
for app in ('one', 'admin'):
    audit(app)
if FAILURES:
    print('MIGRATION INCOMPLETE - build blocked:', file=sys.stderr)
    for failure in FAILURES:
        print(' - ' + failure, file=sys.stderr)
    sys.exit(1)
print('PASS: local entrypoint dependencies, shared contracts and JSON integrity')
