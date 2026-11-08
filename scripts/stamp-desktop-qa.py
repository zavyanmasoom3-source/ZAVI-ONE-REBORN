#!/usr/bin/env python3
"""Write immutable desktop-QA metadata; never touch customer records."""
import argparse
from pathlib import Path
import datetime
import json
import re
p=argparse.ArgumentParser()
p.add_argument('--assets',required=True)
p.add_argument('--run',required=True,type=int)
p.add_argument('--commit',required=True)
a=p.parse_args()
if a.run<1 or not re.fullmatch('[0-9a-f]{40}',a.commit):
    raise SystemExit('Invalid CI build identity')
folder=Path(a.assets)
assert folder.is_dir() and (folder/'index.html').is_file()
version=f'66.78-reborn.qa.{a.run}'
today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
stamp={'commit':a.commit,'app':'one','run':str(a.run),
       'version':version,'package':'com.zavione.one.desktop',
       'kind':'desktop-qa','signing':'unsigned-windows-qa'}
(folder/'zavi-build-info.json').write_text(json.dumps(stamp,indent=2)+'\n',encoding='utf8')
for name in ('zavi-release.json','edition.json','deployment-info.json'):
    target=folder/name
    if not target.is_file():
        raise SystemExit('Missing required desktop version manifest: '+name)
    data=json.loads(target.read_text(encoding='utf8'))
    if not isinstance(data,dict):raise SystemExit('Invalid manifest: '+name)
    for k in ('version','web_version','release_version','staging_version'):
        data[k]=version
    data.update({'status':'qa_only','qa_only':True,'production_ready':False,
      'production_verified':False,'production_deployed':False,
      'build_package':stamp['package'],'build_commit':a.commit,
      'build_run':str(a.run),'signing_mode':stamp['signing'],
      'released_at':today,'release_date':today})
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: Windows QA build stamped',version,a.commit)
