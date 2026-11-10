#!/usr/bin/env python3
"""Native-only repair for the *unmodified* 66.62 APK page.

The owner's pixel reference stays byte-locked in apps/one/index.html.
Only a copied, staged WebView asset is changed before Android/Windows builds.
No UI styles, routes, billing logic, customer data or auth settings are replaced.
"""
from argparse import ArgumentParser
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / 'apps/one/index.html'
FONT = 'packages/shared/ui/fonts/Vazirmatn-Variable.ttf'
REMOTE = (
    '<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;500;600;700;800;900&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap">'
)
SECOND_LOAD = '<script defer src="./zavi-store-recovery-v6594.js?v=66.14"></script>'
ORIGINAL_LOAD = '<script src="./zavi-store-recovery-v6594.js?v=65.94" defer></script>'
def local_font_css(href):
    return (
        '<style data-zavi-native-font-only="v6662">'
        "@font-face{font-family:'Vazirmatn';"
        "src:url('"+href+"') format('truetype');"
        "font-style:normal;font-weight:100 900;font-display:swap}"
        '</style>\\n'
    )

def fix(staged: Path) -> dict:
    staged = staged.resolve()
    if staged == ORIGINAL.resolve() or staged.is_relative_to((ROOT/'apps').resolve()):
        raise ValueError('Refusing to change original application source')
    source = ORIGINAL.read_bytes()
    before = hashlib.sha256(source).hexdigest()
    html = staged.read_text(encoding='utf8')
    if 'zavi-compact-workflow-v1.js' not in html:
        raise ValueError('Not a restored original 66.62 feature build')
    if FONT_FACE in html:
        raise ValueError('Already sanitized: refusing duplicate modification')
    if html.count(ORIGINAL_LOAD) != 1 or html.count(SECOND_LOAD) != 1:
        raise ValueError('Unexpected store recovery script layout; stop safely')
    html = html.replace(SECOND_LOAD, '')
    for link in REMOTE:
        if html.count(link) != 1:
            raise ValueError('Unexpected remote font layout: ' + link[:60])
        html = html.replace(link, '')
    if 'fonts.googleapis.com' in html or 'fonts.gstatic.com' in html:
        raise ValueError('Additional unapproved remote font fetch remains')
    candidates = (
        ('./'+FONT, staged.parent/FONT),
        ('../../'+FONT, staged.parent/'../../'/FONT),
    )
    local_candidates=[(href,p) for href,p in candidates if p.is_file() and p.stat().st_size>200000]
    if not local_candidates:
        raise ValueError('Missing full offline Pashto-capable local font')
    href,_=local_candidates[0]
    if html.count('</head>') < 1:
        raise ValueError('Missing HTML head')
    html=html.replace('</head>', local_font_css(href)+'</head>', 1)
    if len(re.findall(r'<script[^>]+zavi-store-recovery-v6594\.js',html)) != 1:
        raise ValueError('Native script de-duplication failed')
    staged.write_text(html,encoding='utf8')
    after=hashlib.sha256(ORIGINAL.read_bytes()).hexdigest()
    if before != after:
        raise ValueError('Original 66.62 source mutated')
    return {'source_sha256':before,'native_bytes':len(html.encode('utf8')),
            'native_duplicate_script_removed':True,'offline_font_enabled':True}

def main():
    parser=ArgumentParser()
    parser.add_argument('staged_index',type=Path)
    options=parser.parse_args()
    print('PASS original V66.62 native WebView staging',fix(options.staged_index))

if __name__=='__main__':
    main()
