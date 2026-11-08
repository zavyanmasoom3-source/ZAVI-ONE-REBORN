#!/usr/bin/env python3
"""Run the real QA stamper on copies, never edit source manifests."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
import hashlib
import json
import shutil
import sys
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
STAMPer=ROOT/'scripts/stamp-qa-version.py'
SHA='a'*40
for app in ('one','admin'):
    source=ROOT/'apps'/app
    filenames=('zavi-release.json','edition.json','deployment-info.json') if app=='one' else ('zavi-release.json',)
    original={f:hashlib.sha256((source/f).read_bytes()).hexdigest() for f in filenames}
    with TemporaryDirectory() as tmp:
        assets=Path(tmp)/'assets'
        assets.mkdir()
        package=('com.zavione.one.rebornqa' if app=='one' else 'com.zavione.one.admin.rebornqa')
        version=('66.78-reborn.qa.900' if app=='one' else '1.4.69-reborn.qa.900')
        for f in filenames:shutil.copy2(source/f,assets/f)
        (assets/'zavi-build-info.json').write_text(json.dumps({
            'app':app,'commit':SHA,'run':'900','version':version,'package':package,
            'signing':'ephemeral','kind':'debug-qa'}),encoding='utf8')
        base=[sys.executable,str(STAMPer),'--app',app,'--run','900','--commit',SHA,'--signing','ephemeral']
        subprocess.run(base+['--assets',str(assets)],check=True)
        apk=Path(tmp)/'mock.apk'
        with ZipFile(apk,'w') as out:
            for file in assets.iterdir():out.write(file,'assets/'+file.name)
        subprocess.run(base+['--apk',str(apk)],check=True)
        for f in filenames:
            if hashlib.sha256((source/f).read_bytes()).hexdigest()!=original[f]:
                raise SystemExit('Source manifest modified by build: '+app+'/'+f)
        # An intentionally stale APK must be rejected, not quietly marked current.
        bad=Path(tmp)/'bad.apk'
        with ZipFile(bad,'w') as out:
            for file in assets.iterdir():
                contents=file.read_bytes()
                if file.name==filenames[0]:
                    changed=json.loads(contents)
                    changed['version']='65.33-OLD'
                    contents=json.dumps(changed).encode()
                out.writestr('assets/'+file.name,contents)
        denied=subprocess.run(base+['--apk',str(bad)],capture_output=True)
        if denied.returncode==0:raise SystemExit('Stale APK version accepted: '+app)
print('PASS: both APK metadata sets freshly stamped and stale/misleading versions rejected')
