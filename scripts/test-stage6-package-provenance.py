#!/usr/bin/env python3
"""Two full Android compile staging contracts using disposable directories."""
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import sys
from stage6_stage_android_compile import stage,ROOT,VARIANTS,SHARED

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
