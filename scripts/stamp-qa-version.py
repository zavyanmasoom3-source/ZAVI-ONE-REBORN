#!/usr/bin/env python3
"""Stamp/verify build-owned QA metadata inside the staged Android APK.

Only edits files under Android build assets; NEVER rewrites historical source
metadata, customer data, Supabase databases, or makes an APK release-ready.
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile

CONFIG={
 'one':{'prefix':'66.78-reborn.qa.', 'package':'com.zavione.one.rebornqa',
        'name':'ZAVI ONE REBORN QA','files':('zavi-release.json','edition.json','deployment-info.json')},
 'admin':{'prefix':'1.4.69-reborn.qa.','package':'com.zavione.one.admin.rebornqa',
          'name':'ZAVI ONE ADMIN REBORN QA','files':('zavi-release.json',)}
}
FIELDS=('version','web_version','release_version','staging_version')

def arguments():
    ap=argparse.ArgumentParser()
    ap.add_argument('--app',required=True,choices=sorted(CONFIG))
    ap.add_argument('--run',required=True,type=int)
    ap.add_argument('--commit',required=True)
    ap.add_argument('--signing',required=True,choices=('ephemeral','stable'))
    modes=ap.add_mutually_exclusive_group(required=True)
    modes.add_argument('--assets')
    modes.add_argument('--apk')
    return ap.parse_args()

def expected(args):
    if args.run < 1 or not re.fullmatch(r'[a-f0-9]{40}',args.commit):
        raise ValueError('Invalid immutable GitHub provenance')
    cfg=CONFIG[args.app]
    return cfg,cfg['prefix']+str(args.run)

def ensure(data,args,cfg,version):
    if not isinstance(data,dict) or data.get('app')!=args.app or data.get('commit')!=args.commit:
        raise ValueError('APK build provenance does not match requested app/commit')
    for k,v in {'version':version,'run':str(args.run),'package':cfg['package'],
                'signing':args.signing,'kind':'debug-qa'}.items():
        if data.get(k)!=v:raise ValueError('Build provenance mismatch: '+k)

def stamp(assets,args,cfg,version):
    info=json.loads((assets/'zavi-build-info.json').read_text(encoding='utf8'))
    ensure(info,args,cfg,version)
    updated=[]
    today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    for filename in cfg['files']:
        path=assets/filename
        if not path.is_file():
            raise ValueError('Missing historical version manifest in APK: '+filename)
        data=json.loads(path.read_text(encoding='utf8'))
        if not isinstance(data,dict):raise ValueError('Version manifest is not object: '+filename)
        for key in FIELDS:data[key]=version
        data.update({
            'name':cfg['name'], 'release':'REBORN QA '+version,
            'label':'REBORN QA — NOT FOR RELEASE',
            'status':'qa_only', 'qa_only':True, 'production_ready':False,
            'production_verified':False,'production_deployed':False,
            'client_publish_candidate':None,
            'build_commit':args.commit,'build_run':str(args.run),
            'build_package':cfg['package'],'signing_mode':args.signing,
            'build_date_utc':today,'release_date':today,'released_at':today
        })
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        updated.append(filename)
    return updated

def verify(apk,args,cfg,version):
    with ZipFile(apk,'r') as z:
        info=json.loads(z.read('assets/zavi-build-info.json'))
        ensure(info,args,cfg,version)
        for filename in cfg['files']:
            data=json.loads(z.read('assets/'+filename))
            for field in FIELDS:
                if data.get(field)!=version:
                    raise ValueError('APK contains stale '+filename+': '+field)
            for field in ('qa_only','production_ready','production_verified','production_deployed'):
                if data.get(field)!=(field=='qa_only'):
                    raise ValueError('APK misleading status '+filename+': '+field)
            if (data.get('build_commit')!=args.commit
                 or data.get('build_package')!=cfg['package']
                 or data.get('signing_mode')!=args.signing):
                raise ValueError('APK version provenance mismatch in '+filename)
        print('PASS: all in-APK manifests identify '+cfg['name']+' '+version+' ('+args.signing+')')

def main():
    args=arguments()
    try:
        cfg,version=expected(args)
        if args.assets:
            assets=Path(args.assets).resolve()
            if not assets.is_dir() or assets.name!='assets':
                raise ValueError('Must stamp a staged Android assets directory')
            changed=stamp(assets,args,cfg,version)
            print('PASS: QA metadata stamped '+version+' in '+', '.join(changed))
        else:
            verify(args.apk,args,cfg,version)
    except (OSError,ValueError,KeyError,RuntimeError) as e:
        print('QA VERSION GATE FAILED: '+str(e),file=sys.stderr)
        raise SystemExit(1)

if __name__=='__main__':main()
