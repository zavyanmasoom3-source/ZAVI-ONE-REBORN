#!/usr/bin/env python3
"""Fail-closed comparison of two consecutive stable-signed ZAVI Android APKs.

Only compares APK metadata and signature integrity; does NOT claim an on-device
upgrade or preservation of financial records. Never reads or writes a keystore.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

QA_PACKAGES = {
    'one': 'com.zavione.one.rebornqa',
    'admin': 'com.zavione.one.admin.rebornqa',
}
RELEASE_PACKAGES = {
    'one': 'com.zavione.one',
    'admin': 'com.zavione.one.admin',
}
LEGACY_ONE_CERT = 'f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25'


class VerificationError(ValueError):
    pass


def command(args):
    try:
        return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT)
    except (subprocess.CalledProcessError, OSError) as error:
        raise VerificationError(f'Android tooling failed for {args[0]}') from error


def normalise_cert(value):
    digest = re.sub(r'[:\s]', '', value).lower()
    if not re.fullmatch(r'[0-9a-f]{64}', digest):
        raise VerificationError('Expected a complete SHA-256 certificate fingerprint')
    return digest


def read_apk(apk, aapt, apksigner):
    if not apk.is_file():
        raise VerificationError(f'APK not found: {apk}')
    badging = command([aapt, 'dump', 'badging', str(apk)])
    matches = re.findall(r"(?m)^package:\s+name='([^']+)'\s+versionCode='(\d+)'", badging)
    if len(matches) != 1:
        raise VerificationError('Exactly one package/versionCode declaration required')
    package, code = matches[0]
    code = int(code)
    if code <= 0:
        raise VerificationError('Android versionCode must be positive')
    output = command([apksigner, 'verify', '--verbose', '--print-certs', str(apk)])
    # Android >= 24 no longer requires JAR v1. The default apksigner report
    # may say v1=false even when a valid v1 signature exists.
    for scheme in ('v2', 'v3'):
        if not re.search(r'(?m)^Verified using '+scheme+r' scheme(?: \([^\n]*?\))?: true\s*$', output):
            raise VerificationError(f'{apk.name}: {scheme} signature not verified')
    legacy = command([apksigner, 'verify', '--min-sdk-version', '23',
                      '--verbose', '--print-certs', str(apk)])
    if not re.search(r'(?m)^Verified using v1 scheme(?: \([^\n]*?\))?: true\s*$', legacy):
        raise VerificationError(f'{apk.name}: v1 signature failed API 23 verification')
    matches = re.findall(r'(?m)^Signer #(\d+) certificate SHA-256 digest:\s*([0-9a-fA-F: ]+)\s*$', output)
    if len(matches) != 1 or matches[0][0] != '1':
        raise VerificationError('Exactly one signed certificate is required (rotation not supported)')
    legacy_matches = re.findall(r'(?m)^Signer #(\d+) certificate SHA-256 digest:\s*([0-9a-fA-F: ]+)\s*$', legacy)
    if len(legacy_matches) != 1 or legacy_matches[0][0] != '1' or normalise_cert(legacy_matches[0][1]) != normalise_cert(matches[0][1]):
        raise VerificationError('Signer identity changed across v1 and v2/v3 verification')
    return {'package': package, 'versionCode': code, 'certificateSHA256': normalise_cert(matches[0][1])}


def compare(previous, current, app, mode, expected):
    package = (QA_PACKAGES if mode == 'qa' else RELEASE_PACKAGES)[app]
    expected = normalise_cert(expected)
    if mode == 'release' and app == 'one' and expected != LEGACY_ONE_CERT:
        raise VerificationError('Original ZAVI ONE installed certificate is required for direct upgrade')
    if previous['package'] != package or current['package'] != package:
        raise VerificationError('Package identity changed: Android cannot update this installation')
    if previous['certificateSHA256'] != expected or current['certificateSHA256'] != expected:
        raise VerificationError('APK signer differs from pinned certificate or previous APK')
    if current['versionCode'] <= previous['versionCode']:
        raise VerificationError('New APK versionCode must be strictly greater than previous')
    return {'result': 'APK_PAIR_METADATA_PASS', 'app': app, 'mode': mode,
            'package': package, 'previousVersionCode': previous['versionCode'],
            'currentVersionCode': current['versionCode'], 'certificateSHA256': expected,
            'deviceInstallTested': False, 'financialDataPreservationTested': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', choices=sorted(QA_PACKAGES), required=True)
    parser.add_argument('--mode', choices=('qa', 'release'), required=True)
    parser.add_argument('--previous-apk', type=Path, required=True)
    parser.add_argument('--current-apk', type=Path, required=True)
    parser.add_argument('--expected-sha256', required=True)
    parser.add_argument('--aapt', default='aapt')
    parser.add_argument('--apksigner', default='apksigner')
    args = parser.parse_args()
    try:
        previous = read_apk(args.previous_apk, args.aapt, args.apksigner)
        current = read_apk(args.current_apk, args.aapt, args.apksigner)
        report = compare(previous, current, args.app, args.mode, args.expected_sha256)
    except VerificationError as error:
        print('APK PAIR CHECK FAILED: ' + str(error), file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
