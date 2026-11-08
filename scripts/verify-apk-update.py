#!/usr/bin/env python3
"""Fail-closed APK upgrade compatibility verification.

This gate never modifies an APK or any customer data. Android can install an APK
as an in-place update only if the package name is identical, the signing identity
is accepted by Android (including rotation lineage if applicable), and version
code is not downgraded. This checker intentionally supports the simple one-signer
same-certificate case; complex signing rotations need separate device validation.
"""
import argparse
import re
import subprocess
import sys

LEGACY_ONE_PACKAGE='com.zavione.one'
LEGACY_ONE_SHA256='f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25'
TARGETS={
    'one':{'legacy':LEGACY_ONE_PACKAGE,'qa':LEGACY_ONE_PACKAGE+'.rebornqa'},
    'admin':{'legacy':'com.zavione.one.admin','qa':'com.zavione.one.admin.rebornqa'}
}

class UnsafeUpdate(ValueError):
    pass

def run_command(command):
    try:
        return subprocess.check_output(command,stderr=subprocess.STDOUT,text=True)
    except subprocess.CalledProcessError as exc:
        raise UnsafeUpdate('Android tool returned nonzero exit status: '+str(exc.returncode)) from exc
    except OSError as exc:
        raise UnsafeUpdate('Android build tool unavailable: '+str(exc)) from exc

def parse_badging(output):
    matches=re.findall(r"(?m)^package:\s+name='([^']+)'\s+versionCode='([0-9]+)'",output)
    if len(matches)!=1:
        raise UnsafeUpdate('Expected exactly one APK package/versionCode declaration')
    package,version=matches[0]
    code=int(version)
    if code<=0:raise UnsafeUpdate('Non-positive Android versionCode')
    return package,code

def parse_signers(output):
    matches=re.findall(r'(?m)^Signer #(\d+) certificate SHA-256 digest:\s*([0-9A-Fa-f: ]+)$',output)
    if not matches:raise UnsafeUpdate('APK has no verifiable signing certificate')
    if len(matches)!=1 or matches[0][0]!='1':
        raise UnsafeUpdate('Expected exactly one signer; lineage and multi-signer upgrades require manual review')
    value=re.sub(r'[:\s]','',matches[0][1]).lower()
    if not re.fullmatch(r'[0-9a-f]{64}',value):
        raise UnsafeUpdate('Malformed signer SHA-256')
    return value

def inspect(apk,aapt,apksigner):
    # Check v2/v3 for supported API26+ and *also* force API23 to prove v1.
    # Default apksigner output can report v1=false for minSdk26 even when
    # the APK has a valid JAR signature, so never infer it from default output.
    signing=run_command([apksigner,'verify','--verbose','--print-certs',apk])
    for scheme in ('v2','v3'):
        if not re.search(r'(?m)^Verified using '+scheme+r' scheme.*?: true\\s*$', signing):
            raise UnsafeUpdate('APK lacks a verified '+scheme+' signature')
    legacy=run_command([apksigner,'verify','--min-sdk-version','23',
                        '--verbose','--print-certs',apk])
    if not re.search(r'(?m)^Verified using v1 scheme.*?: true\\s*$',legacy):
        raise UnsafeUpdate('APK lacks a verified JAR v1 signature under API23')
    signer=parse_signers(signing)
    if signer!=parse_signers(legacy):
        raise UnsafeUpdate('Different certificate identities across v1 and v2/v3')
    badging=run_command([aapt,'dump','badging',apk])
    package,version=parse_badging(badging)
    return package,version,signer

def check_update(candidate,app,mode,expected_sha256=None,installed=None):
    legacy=TARGETS[app]['legacy']
    qa=TARGETS[app]['qa']
    package,code,sha=candidate
    if mode=='qa':
        if package!=qa:
            raise UnsafeUpdate('QA APK must use a distinct application ID and never replace production')
        if expected_sha256:
            pin=re.sub(r'[:\s]','',expected_sha256).lower()
            if not re.fullmatch(r'[0-9a-f]{64}',pin) or sha!=pin:
                raise UnsafeUpdate('QA signer changed from the pinned stable certificate')
        if installed:
            old_package,old_code,old_sha=installed
            if old_package!=qa:
                raise UnsafeUpdate('Cannot update production installation with QA app')
            if sha!=old_sha:
                raise UnsafeUpdate('QA certificate changed; in-place upgrade is blocked')
            if code<=old_code:
                raise UnsafeUpdate('QA versionCode must increase on in-place upgrade')
        return 'separate-qa'
    if package!=legacy:
        raise UnsafeUpdate('Production upgrade package name differs from installed legacy app')
    if not expected_sha256:
        raise UnsafeUpdate('Original certificate fingerprint is required for release candidates')
    expected=re.sub(r'[:\s]','',expected_sha256).lower()
    if not re.fullmatch(r'[0-9a-f]{64}',expected):
        raise UnsafeUpdate('Invalid expected fingerprint format')
    if app=='one' and expected!=LEGACY_ONE_SHA256:
        raise UnsafeUpdate('ZAVI ONE expected signer differs from measured reference APK 66.75')
    if sha!=expected:
        raise UnsafeUpdate('Candidate APK certificate differs from original installation: NOT UPDATABLE')
    if installed:
        old_package,old_code,old_sha=installed
        if old_package!=legacy or old_sha!=expected:
            raise UnsafeUpdate('Provided baseline APK is not the expected production installation')
        if code<=old_code:
            raise UnsafeUpdate('Candidate versionCode is not newer than installed APK')
    return 'same-certificate-release-candidate'

def main(argv=None):
    parser=argparse.ArgumentParser(description='Verify Android APK package/signing update compatibility')
    parser.add_argument('--app',choices=sorted(TARGETS),required=True)
    parser.add_argument('--apk',required=True)
    parser.add_argument('--mode',choices=('qa','release-candidate'),required=True)
    parser.add_argument('--expected-sha256')
    parser.add_argument('--installed-apk',help='Optional local signed baseline APK; never upload user data')
    parser.add_argument('--aapt',default='aapt')
    parser.add_argument('--apksigner',default='apksigner')
    opts=parser.parse_args(argv)
    try:
        current=inspect(opts.apk,opts.aapt,opts.apksigner)
        old=inspect(opts.installed_apk,opts.aapt,opts.apksigner) if opts.installed_apk else None
        result=check_update(current,opts.app,opts.mode,opts.expected_sha256,old)
    except UnsafeUpdate as exc:
        print('APK UPDATE SAFETY GATE FAILED: '+str(exc),file=sys.stderr)
        return 1
    print('PASS: '+result+' | app='+opts.app+' | package='+current[0]+
          ' | versionCode='+str(current[1])+' | signer='+current[2])
    return 0

if __name__=='__main__':
    raise SystemExit(main())
