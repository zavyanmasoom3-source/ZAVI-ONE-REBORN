#!/usr/bin/env python3
"""Two full Android compile staging contracts using disposable directories."""
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import sys
import importlib.util
module=Path(__file__).with_name('stage6-stage-android-compile.py')
spec=importlib.util.spec_from_file_location('stage6_staging',module)
staging=importlib.util.module_from_spec(spec)
spec.loader.exec_module(staging)
stage,ROOT,VARIANTS,SHARED=(staging.stage,staging.ROOT,
                              staging.VARIANTS,staging.SHARED)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
sha='a'*40
for app in ('one','admin'):
    original={p:digest(ROOT/'apps'/app/p) for p in
              ['index.html','zavi-release.json','icon-192.png']}
    with TemporaryDirectory(prefix='zavi-stage6-') as root:
        tmp=Path(root)
        assets=tmp/'assets'
        res=tmp/'res'
        got=stage(app,812,sha,assets,res)
        assert got['kind']=='UNSIGNED_R8_COMPILE_ONLY'
        assert got['installable'] is False and got['release_approved'] is False
        assert got['signing']=='none'
        assert got['package']==VARIANTS[app][1]
        assert got['version']==VARIANTS[app][0]+'812'
        assert json.loads((assets/'zavi-build-info.json').read_text())==got
        for filename in SHARED:
            assert digest(assets/'packages/shared'/filename)==digest(
                ROOT/'packages/shared'/filename),filename
        assert './packages/shared/' in (assets/'index.html').read_text()
        if app=='one' and (ROOT/'apps/one/v6662-original-design-lock.json').exists():
            native=(assets/'index.html').read_text(encoding='utf8')
            assert 'fonts.googleapis.com' not in native
            assert 'fonts.gstatic.com' not in native
            assert 'data-zavi-native-font-only="v6662"' in native
            assert native.count('zavi-store-recovery-v6594.js')==1
            assert (assets/'packages/shared/ui/fonts/Vazirmatn-Variable.ttf').is_file()

        assert (assets/VARIANTS[app][2]).is_file()
        assert digest(assets/'icon-192.png')==digest(
            res/'drawable-nodpi/zavi_launcher_image.png')
        assert (res/'values/styles.xml').is_file()
        assert (res/'xml/zavi_camera_paths.xml').is_file()
        assert all(digest(ROOT/'apps'/app/name)==before
                   for name,before in original.items())
        # The only regenerated source in the output is build-owned provenance.
        stage(app,813,sha,assets,res)
        assert json.loads((assets/'zavi-build-info.json').read_text())['run']=='813'
        assert all(digest(ROOT/'apps'/app/name)==before
                   for name,before in original.items())
        for bad in [0,10000]:
            try:stage(app,bad,sha,assets,res)
            except ValueError:pass
            else:raise AssertionError('invalid CI run number accepted')
    print('PASS:',app,'complete shared app staging and native resources, fresh immutable commit, NO installable artifacts, no source edits')
print('PASS: two app variants, provenance safety, source preservation')
