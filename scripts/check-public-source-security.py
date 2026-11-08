#!/usr/bin/env python3
"""Read-only public-source safeguard for ZAVI ONE REBORN.

This prevents accidentally distributing well-known high-privilege credential
forms in the source tree. It does NOT replace a full Git history/secret audit.
Supabase publishable/anon keys are intentionally not classified as secrets:
their access must be protected by RLS, not by obscurity.
"""
from pathlib import Path
import base64
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SUFFIXES = {'.js', '.mjs', '.cjs', '.html', '.css', '.json', '.yml', '.yaml',
            '.sql', '.gradle', '.properties', '.xml', '.py', '.md', '.txt',
            '.java', '.sh', '.bat'}
FORBIDDEN_TRACKED = {'.env', '.env.production', '.env.local',
                     'service-account.json', 'google-services.json'}
FORBIDDEN_SUFFIXES = {'.pem', '.p12', '.pfx', '.jks', '.keystore', '.key'}
issues = []

try:
    names = subprocess.check_output(
        ['git', '-C', str(ROOT), 'ls-files', '-z'], stderr=subprocess.DEVNULL
    ).decode('utf-8').split('\0')
    files = [ROOT / name for name in names if name]
except (OSError, subprocess.CalledProcessError):
    files = [p for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts]

for file in files:
    path = file.relative_to(ROOT)
    lower = file.name.lower()
    if lower in FORBIDDEN_TRACKED or file.suffix.lower() in FORBIDDEN_SUFFIXES:
        issues.append(f'{path}: private configuration or signing file is tracked')
        continue
    if file.suffix.lower() not in SUFFIXES and lower not in {'.gitignore', 'gradlew'}:
        continue
    try:
        source = file.read_text(encoding='utf-8')
    except (UnicodeError, OSError):
        continue
    if re.search(r'sb_secret_[A-Za-z0-9_-]{12,}', source):
        issues.append(f'{path}: Supabase secret key candidate')
    if re.search(r'-{5}BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-{5}', source):
        issues.append(f'{path}: embedded private-key material')
    for match in re.finditer(
        r'\beyJ[A-Za-z0-9_-]{16,}\.eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b',
        source
    ):
        try:
            payload = match.group(0).split('.')[1]
            data = json.loads(base64.urlsafe_b64decode(
                payload + '=' * ((-len(payload)) % 4)
            ))
            if data.get('role') == 'service_role':
                issues.append(f'{path}: embedded service_role JWT')
        except (ValueError, UnicodeError, json.JSONDecodeError):
            continue

if issues:
    print('PUBLIC SOURCE SECRET GATE FAILED:', file=sys.stderr)
    for issue in issues:
        print(' - ' + issue, file=sys.stderr)
    sys.exit(1)
print(f'PASS: scanned {len(files)} tracked files for known privileged key formats')
