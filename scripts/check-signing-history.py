#!/usr/bin/env python3
"""Read-only Git history check: reject tracked signing files in ANY reachable commit.

Requires a full, non-shallow checkout. Checks file/path types and known names,
not a comprehensive historical content or secret-entropy audit.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SECRET_SUFFIXES = ('.jks', '.keystore', '.p12', '.pfx', '.pem', '.key')
SECRET_NAMES = {'.env', '.env.production', '.env.local',
                'service-account.json', 'google-services.json'}


def command(*parts):
    return subprocess.check_output(['git', '-C', str(ROOT), *parts],
                                   stderr=subprocess.DEVNULL, text=True)


def historic_sensitive_paths():
    if command('rev-parse', '--is-shallow-repository').strip() != 'false':
        raise RuntimeError('Full Git history not available: actions/checkout fetch-depth: 0 required')
    output = command('rev-list', '--objects', '--all')
    names = set()
    for line in output.splitlines():
        # First SHA only may refer to a commit; paths follow one space.
        sha, sep, path = line.partition(' ')
        if not sep or not path:
            continue
        name = path.rsplit('/', 1)[-1].lower()
        if name in SECRET_NAMES or name.endswith(SECRET_SUFFIXES):
            names.add(path)
    return sorted(names)


if __name__ == '__main__':
    try:
        findings = historic_sensitive_paths()
    except (OSError, subprocess.CalledProcessError, RuntimeError) as error:
        print('SIGNING HISTORY AUDIT FAILED: ' + str(error), file=sys.stderr)
        sys.exit(1)
    if findings:
        print('SIGNING HISTORY AUDIT FAILED: signing secrets or private files '
              'were tracked historically; rotate keys where appropriate and '
              'review full history before release:', file=sys.stderr)
        for path in findings:
            print(' - ' + path, file=sys.stderr)
        sys.exit(1)
    print('PASS: no known keystore/private-file paths in reachable full Git history '
          '(path-based audit, not a full content scan)')
