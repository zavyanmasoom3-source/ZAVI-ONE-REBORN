#!/usr/bin/env python3
"""Real browser acceptance for the five exact owner-uploaded APK CSS files.

Tests source-locked Light/Dark/Glass on existing application screens.
Never invokes production owner login or remote accounting operations.
This is CSS/runtime evidence, not pixel-by-pixel Android-device certification.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json

OUT=ROOT/'qa-owner-apk-style'
OUT.mkdir(exist_ok=True)
CSS={
 'one':['zavi-clean-professional-v6667.css',
        'zavi-showcase-v6668.css','zavi-mobile-photo-qa-v6669.css'],
 'admin':['zavi-clean-professional-v1458.css',
          'zavi-admin-showcase-v1459.css']
}
TOKEN={'one':'--z68-canvas','admin':'--z59-bg'}
EXPECTED={
 'one':{'light':'#f4f7fc','dark':'#071427','glass':'#163b75'},
 'admin':{'light':'#f4f7fd','dark':'#081527','glass':'#1b4787'}
}
RESULTS=[]

for app in ('one','admin'):
    with Session() as b:
        b.navigate(app)
        b.until("!!window.ZaviThemeV29","original runtime theme API available",seconds=20)
        if app=='one':
            err=b.unlock_one()
            assert not err,('ONE disposable local PIN failure',err)
            route=b.route('dashboard')
            assert route['selected'] and route['visible'] and not route['locked'],route
        else:
            b.until("!!document.getElementById('demoBtn')",
                    'ADMIN localhost-only read-only demo button',seconds=20)
            b.eval("document.getElementById('demoBtn').click()")
            b.until("!document.getElementById('appScreen').hidden",
                    'ADMIN real route tree shown in local demo',seconds=20)
        for theme in ('light','dark','glass'):
            state=b.eval("""(()=>{
              window.ZaviThemeV29.set(%s);
              const root=document.documentElement, styles=[...document.querySelectorAll(
                'link[rel="stylesheet"]')].filter(x=>x.media!=='not all');
              const names=styles.map(el=>(el.getAttribute('href')||'')
                .split('?')[0].split('/').pop());
              const key=%s;
              const field=app=>app==='one'?document.getElementById('content'):
                  document.getElementById('view');
              return {
                theme:root.dataset.zaviTheme,
                appearance:root.dataset.zaviAppearance,
                value:getComputedStyle(root).getPropertyValue(key).trim().toLowerCase(),
                styleTail:names.slice(-%d),
                activeSite:!!field(%s),
                mainRoutes:%s==='one'
                  ?document.querySelectorAll('#mobileBottom [data-go]').length
                  :document.querySelectorAll('#appScreen .nav-item[data-page]').length
              };
            })()""" %(json.dumps(theme),json.dumps(TOKEN[app]),len(CSS[app]),
                         json.dumps(app),json.dumps(app)))
            assert state['theme']==theme and state['appearance']==theme,(app,theme,state)
            assert state['value']==EXPECTED[app][theme],(app,theme,state)
            assert state['styleTail']==CSS[app],(app,theme,'style order changed',state)
            assert state['activeSite'] and state['mainRoutes']>= (5 if app=='one' else 8),state
            image=OUT/f'{app}-{theme}.png'
            image.write_bytes(b.screenshot())
            assert image.stat().st_size>10000,image
            RESULTS.append({'app':app,'theme':theme,'css':state['styleTail'],
                            'token':state['value'],'routes':state['mainRoutes'],
                            'screenshot':image.name,'passed':True})
            print('PASS: ORIGINAL user APK style',app,theme,'real routed screen',image.name)
(OUT/'result.json').write_text(json.dumps(
 {'checks':RESULTS,'pixels_equal_to_owner_device':False,
  'real_server_auth_tested':False,'real_data_mutation_tested':False},
 ensure_ascii=False,indent=2)+'\n')
print('PASS: six original-appearance browser checks; no changes to owner visual assets')
