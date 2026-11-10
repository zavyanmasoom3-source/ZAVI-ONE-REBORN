#!/usr/bin/env python3
"""Stage 6: prepare an UNSIGNED, R8-only Android source compilation.

The build output is NOT INSTALLABLE and must NEVER be published. Never
touch apps/<app>/ source, credentials, production data or per-app keystores.
"""
from argparse import ArgumentParser
from pathlib import Path
from shutil import copytree,copy2,rmtree
import json
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
VARIANTS={
 'one':('66.78-reborn.qa.', 'com.zavione.one',
        'zavi-pdf-final-v6760.css'),
 'admin':('1.4.69-reborn.qa.','com.zavione.one.admin',
          'zavi-admin-pdf-final-v1467.css')
}
SHARED=('database/supabase-config.js','security/access-contract.js',
        'i18n/language-core.js','ui/design-system-v1.js',
        'ui/design-system-v1.css')

def stage(app,run,commit,assets,res):
    if app not in VARIANTS:raise ValueError('Unknown application')
    if not 1 <= run <= 9999 or not re.fullmatch('[0-9a-f]{40}',commit):
        raise ValueError('Missing unique source/version provenance')
    if assets.resolve() == (ROOT/'apps'/app).resolve():
        raise ValueError('Refusing to modify application source')
    if (ROOT/'apps'/app).resolve() in assets.resolve().parents:
        raise ValueError('Cannot stage inside original app source')
    prefix,package,skin=VARIANTS[app]
    if assets.exists():rmtree(assets)
    copytree(ROOT/'apps'/app,assets)
    for name in SHARED:
        if not (ROOT/'packages/shared'/name).is_file():
            raise ValueError('Missing mandatory shared contract: '+name)
    copytree(ROOT/'packages/shared',assets/'packages/shared',dirs_exist_ok=True)
    index=assets/'index.html'
    s=index.read_text(encoding='utf-8')
    s=s.replace('../../packages/shared/','./packages/shared/')
    s=s.replace('../packages/shared/','./packages/shared/')
    index.write_text(s,encoding='utf-8')
    if not (assets/skin).is_file():raise ValueError('Missing approved app style: '+skin)
    for name in SHARED:
        if not (assets/'packages/shared'/name).is_file():
            raise ValueError('Stage missing: '+name)
    info={
        'commit':commit,'app':app,'run':str(run),
        'version':prefix+str(run),'package':package,
        'kind':'UNSIGNED_R8_COMPILE_ONLY','installable':False,
        'release_approved':False,'signing':'none',
        'notice':'QA compilation evidence; not an APK for installation'
    }
    (assets/'zavi-build-info.json').write_text(
        json.dumps(info,ensure_ascii=False,sort_keys=True,indent=2)+'\n',
        encoding='utf-8')
    for sub in ('drawable-nodpi','values','xml'):
        (res/sub).mkdir(parents=True,exist_ok=True)
    copy2(ROOT/'apps'/app/'icon-192.png',
          res/'drawable-nodpi/zavi_launcher_image.png')
    (res/'values/styles.xml').write_text(
        '<resources><style name="ZaviTheme" parent="android:style/Theme.Material.Light.NoActionBar">'
        '<item name="android:windowLightStatusBar">false</item></style></resources>\n',
        encoding='utf-8')
    (res/'xml/zavi_camera_paths.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>'
        '<paths xmlns:android="http://schemas.android.com/apk/res/android">'
        '<cache-path name="camera" path="."/></paths>\n',
        encoding='utf-8')
    return info

def main():
    p=ArgumentParser()
    p.add_argument('--app',choices=sorted(VARIANTS),required=True)
    p.add_argument('--run',type=int,required=True)
    p.add_argument('--commit',required=True)
    p.add_argument('--assets',type=Path,default=ROOT/'android-build/app/src/main/assets')
    p.add_argument('--res',type=Path,default=ROOT/'android-build/app/src/main/res')
    a=p.parse_args()
    try:
        proof=stage(a.app,a.run,a.commit,a.assets,a.res)
    except (OSError,ValueError) as e:
        print('STAGE6 R8 COMPILATION STAGING FAILED: '+str(e),file=sys.stderr)
        return 1
    print('PASS: staged original '+a.app+' and shared code for unsigned R8 compile '
          +proof['version']+' '+proof['commit'][:12]+'; NO INSTALLABLE APK')
    return 0
if __name__=='__main__':raise SystemExit(main())
