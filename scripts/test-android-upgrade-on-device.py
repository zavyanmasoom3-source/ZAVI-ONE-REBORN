#!/usr/bin/env python3
"""Destructive-to-QA-only Android in-place update smoke test (no real records).

Requires two consecutive STABLE-SIGNED debug QA builds, Android SDK aapt,
apksigner and adb, plus a dedicated disposable emulator/phone.
Never runs on customer production package IDs.
"""
import argparse
import json
import re
import subprocess
import sys
import uuid
from pathlib import Path

PACKAGES={'one':'com.zavione.one.rebornqa','admin':'com.zavione.one.admin.rebornqa'}

def run(argv):
    return subprocess.check_output(argv,text=True,stderr=subprocess.STDOUT).strip()

def apk_info(path, aapt, apksigner):
    badging=run([aapt,'dump','badging',str(path)])
    match=re.search(r"(?m)^package: name='([^']+)' versionCode='(\d+)'",badging)
    if not match:raise RuntimeError('APK package metadata missing')
    verification=run([apksigner,'verify','--verbose','--print-certs',str(path)])
    signer=re.search(r'Signer #1 certificate SHA-256 digest:\s*([a-fA-F0-9:]+)',verification)
    if not signer:raise RuntimeError('APK is unsigned or has no readable certificate')
    for scheme in ('v2','v3'):
        if not re.search(r'Verified using '+scheme+r' scheme.*?: true',verification):
            raise RuntimeError('Missing verified '+scheme+' signature')
    legacy=run([apksigner,'verify','--min-sdk-version','23','--verbose','--print-certs',str(path)])
    if not re.search(r'Verified using v1 scheme.*?: true',legacy):
        raise RuntimeError('Missing verified JAR v1 signature under API 23')
    old_signer=re.search(r'Signer #1 certificate SHA-256 digest:\s*([a-fA-F0-9:]+)',legacy)
    if not old_signer or old_signer.group(1).replace(':','').lower()!=signer.group(1).replace(':','').lower():
        raise RuntimeError('Signing certificate changed between v1 and v2/v3 verification')
    return match.group(1),int(match.group(2)),signer.group(1).replace(':','').lower()

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--app',choices=PACKAGES,required=True)
    p.add_argument('--previous-apk',type=Path,required=True)
    p.add_argument('--next-apk',type=Path,required=True)
    p.add_argument('--aapt',default='aapt')
    p.add_argument('--apksigner',default='apksigner')
    p.add_argument('--adb',default='adb')
    p.add_argument('--device',help='ADB serial of a disposable device')
    p.add_argument('--dedicated-qa-device',action='store_true',
       help='Required confirmation: the connected device contains NO customer financial data')
    a=p.parse_args()
    if not a.dedicated_qa_device:
        p.error('Use only on a dedicated device with NO real customer data')
    before=apk_info(a.previous_apk,a.aapt,a.apksigner)
    after=apk_info(a.next_apk,a.aapt,a.apksigner)
    package=PACKAGES[a.app]
    if before[0]!=package or after[0]!=package:
        raise SystemExit('REFUSED: only separate REBORN QA packages are eligible')
    if before[2]!=after[2]:
        raise SystemExit('FAIL: signing certificate changed')
    if after[1]<=before[1]:
        raise SystemExit('FAIL: versionCode did not increase')
    device=[a.adb]+(['-s',a.device] if a.device else [])
    if not a.device:
        connected=run(device+['devices']).splitlines()[1:]
        ready=[s for s in connected if s.endswith('\tdevice')]
        if len(ready)!=1:
            raise SystemExit('Exactly one connected QA device required, or supply --device')
    marker='zavi-upgrade-'+uuid.uuid4().hex
    run(device+['install','-r',str(a.previous_apk)])
    # The files/ directory is Android-private and survives an in-place update.
    # QA debug builds are debuggable, so run-as works without root.
    run(device+['shell','run-as',package,'mkdir','-p','files'])
    run(device+['shell','run-as',package,'sh','-c',
      "printf '%s' '"+marker+"' > files/zavi-update-test-probe"])
    run(device+['install','-r',str(a.next_apk)])
    found=run(device+['shell','run-as',package,'cat','files/zavi-update-test-probe'])
    if found!=marker:
        raise SystemExit('FAIL: private application data was lost during update')
    print(json.dumps({'app':a.app,'package':package,'oldVersionCode':before[1],
       'newVersionCode':after[1],'certificateSHA256':after[2],
       'privateAppDataPreserved':True,'physicalFinancialQA':False},indent=2))
    print('PASS: two APKs signed by the same key, newer versionCode, Android install -r and private data preserved')

if __name__=='__main__':
    try:main()
    except (subprocess.CalledProcessError,OSError,RuntimeError) as e:
        print('ANDROID QA UPDATE TEST FAILED: '+str(e),file=sys.stderr)
        sys.exit(1)
