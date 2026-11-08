#!/usr/bin/env python3
"""Fail-closed CI APK signing preflight. Secrets are never printed or committed.

GitHub Workflow maps app-specific Secrets to:
ZAVI_KEYSTORE_BASE64, ZAVI_STORE_PASSWORD, ZAVI_KEY_ALIAS, ZAVI_KEY_PASSWORD
The public certificate fingerprint is pinned in signing/certificates.json.
"""
from __future__ import annotations
import argparse
import base64
import binascii
import hashlib
import json
import os
from pathlib import Path
import re
import ssl
import subprocess
import sys

FIELDS = ('ZAVI_KEYSTORE_BASE64', 'ZAVI_STORE_PASSWORD',
          'ZAVI_KEY_ALIAS', 'ZAVI_KEY_PASSWORD')
APP_NAMES = ('one', 'admin')


class SigningGateError(Exception):
    pass


def load_credentials(env):
    missing = [name for name in FIELDS if not env.get(name)]
    if missing:
        raise SigningGateError('امضای ثابت APK تنظیم نشده است. GitHub Actions Secrets ناقص است: '
                               + ', '.join(missing) + ' . استفاده از امضای موقت ممنوع است.')
    for name in FIELDS[1:]:
        if any(c in env[name] for c in '\r\n'):
            raise SigningGateError('مقدار Secret دارای سطر جدید غیرمجاز است: ' + name)
    try:
        data = base64.b64decode(env['ZAVI_KEYSTORE_BASE64'], validate=True)
    except (binascii.Error, ValueError) as exc:
        raise SigningGateError('مقدار Keystore به صورت Base64 معتبر نیست.') from exc
    if not 512 <= len(data) <= 1024 * 1024:
        raise SigningGateError('اندازه فایل Keystore نامعتبر است.')
    return data


def compute_fingerprint(keystore, env):
    # Never put the keystore password in process arguments or job logs.
    cmd = ['keytool', '-exportcert', '-rfc', '-keystore', str(keystore),
           '-alias', env['ZAVI_KEY_ALIAS'], '-storepass:env', 'ZAVI_STORE_PASSWORD']
    try:
        result = subprocess.run(cmd, env=env, capture_output=True,
                                text=True, check=True, timeout=25)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired,
            FileNotFoundError) as exc:
        raise SigningGateError('بازکردن Keystore با رمز و alias داده‌شده موفق نشد؛ '
                               'رمز، نام alias و نوع فایل را محلی بررسی کنید.') from exc
    match = re.search(r'-----BEGIN CERTIFICATE-----\s*([A-Za-z0-9+/=\s]+)-----END CERTIFICATE-----',
                      result.stdout)
    if not match:
        raise SigningGateError('در Keystore گواهی معتبر پیدا نشد.')
    try:
        cert_der = ssl.PEM_cert_to_DER_cert(match.group(0))
    except ValueError as exc:
        raise SigningGateError('ساختار گواهی Keystore نامعتبر است.') from exc
    return hashlib.sha256(cert_der).hexdigest()


def check_pin(app, actual, pinfile):
    with open(pinfile, encoding='utf-8') as stream:
        pins = json.load(stream)
    expected = pins[app]['sha256'].lower()
    if not re.fullmatch(r'[0-9a-f]{64}', expected):
        raise SigningGateError('SHA-256 ثبت‌شده در signing/certificates.json نامعتبر است.')
    if actual != expected:
        raise SigningGateError('گواهی امضای فایل با گواهی ثابت ثبت‌شده برای ' + app +
                               ' یکسان نیست. ساخت APK متوقف شد؛ بدون تطبیق کلید، آپدیت امن نیست.' +
                               '\nگواهی دریافتی: ' + actual + '\nگواهی ثابت: ' + expected)
    return expected


def prepare(app, env, runner_temp, github_env, pins):
    data = load_credentials(env)
    outdir = Path(runner_temp)
    if not outdir.is_dir():
        raise SigningGateError('RUNNER_TEMP موجود نیست.')
    target = outdir / ('zavi-stable-' + app + '.keystore')
    if target.exists():
        raise SigningGateError('فایل Keystore از اجرای قبلی باقی مانده؛ از بازنویسی خودداری شد.')
    try:
        with target.open('xb') as stream:
            os.chmod(target, 0o600)
            stream.write(data)
        actual = compute_fingerprint(target, env)
        expected = check_pin(app, actual, pins)
        environment = Path(github_env)
        if not environment.is_file():
            raise SigningGateError('GITHUB_ENV در دسترس نیست.')
        # Never send secret contents to stdout/stderr.
        with environment.open('a', encoding='utf-8') as output:
            for key, value in (
                ('ZAVI_QA_STORE_FILE', str(target)),
                ('ZAVI_QA_STORE_PASSWORD', env['ZAVI_STORE_PASSWORD']),
                ('ZAVI_QA_KEY_ALIAS', env['ZAVI_KEY_ALIAS']),
                ('ZAVI_QA_KEY_PASSWORD', env['ZAVI_KEY_PASSWORD']),
                ('ZAVI_QA_EXPECTED_CERT_SHA256', expected),
                ('ZAVI_QA_SIGNING_MODE', 'stable'),
            ):
                output.write(f'{key}={value}\n')
        print('PASS: ثابت بودن گواهی برای ' + app + ' تأیید شد. SHA-256=' + expected)
    except Exception:
        target.unlink(missing_ok=True)
        raise


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--app', choices=APP_NAMES, required=True)
    p.add_argument('--pins', type=Path, default=Path('signing/certificates.json'))
    opts = p.parse_args(argv)
    try:
        prepare(opts.app, os.environ, os.environ.get('RUNNER_TEMP', ''),
                os.environ.get('GITHUB_ENV', ''), opts.pins)
    except (SigningGateError, OSError, json.JSONDecodeError, KeyError) as exc:
        print('::error::' + str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
