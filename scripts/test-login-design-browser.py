#!/usr/bin/env python3
"""Real Chrome smoke checks of login/password controls in ONE and ADMIN.

This test changes only the disposable browser profile. It does NOT certify
all app translation strings, cloud authentication or financial data.
"""
from pathlib import Path
import json
from chrome_cdp import Session, ROOT

OUT=ROOT/'qa-login-design'
OUT.mkdir(exist_ok=True)

for app,field_id in [('one','zawiPinOne'),('admin','authPassword')]:
    with Session() as browser:
        browser.navigate(app)
        if app=='admin':
            # The animation is not the login screen; wait until it is gone.
            browser.until("""(()=>{
              const auth=document.getElementById('authScreen');
              const splash=document.getElementById('zaviAdminSplash');
              return !!auth && !auth.hidden &&
                auth.getBoundingClientRect().width>0 &&
                (!splash || getComputedStyle(splash).visibility==='hidden');
            })()""",'ADMIN real login visible after splash',seconds=20)
            assert browser.eval("""(()=>{
              const demo=document.getElementById('demoBtn');
              const resume=document.getElementById('resumeBtn');
              return (!demo || !demo.hidden || getComputedStyle(demo).display==='none') &&
                (!resume || !resume.hidden || getComputedStyle(resume).display==='none');
            })()"""), 'HTML-hidden ADMIN entry buttons must remain invisible'
        browser.until("""(typeof window.ZaviDesignSystemV1==='object' &&
          typeof window.ZaviThemeV29?.set==='function')""",
          app+' common design and theme scripts',seconds=20)
        original=browser.eval("""(()=>{
          const input=document.getElementById(%s);
          const button=document.querySelector('[data-zds-password-toggle=%s]');
          return {input:!!input,button:!!button,password:input?.type,
            aria:button?.getAttribute('aria-label')};
        })()""" %(json.dumps(field_id),json.dumps(field_id)))
        if not(original['input'] and original['button'] and original['password']=='password'):
            raise SystemExit(app+' real password control missing: '+repr(original))
        result=browser.eval("""(()=>{
          const input=document.getElementById(%s);
          const button=document.querySelector('[data-zds-password-toggle=%s]');
          button.click();
          const visible=input.type==='text' &&
            button.getAttribute('aria-pressed')==='true';
          button.click();
          return {visible,hiddenAgain:input.type==='password' &&
            button.getAttribute('aria-pressed')==='false'};
        })()""" %(json.dumps(field_id),json.dumps(field_id)))
        if result != {'visible':True,'hiddenAgain':True}:
            raise SystemExit(app+' password eye toggle failed: '+repr(result))
        for lang in ['fa-AF','ps-AF','en']:
            status=browser.eval("""(()=>{
              document.documentElement.lang=%s;
              document.documentElement.dir=(%s==='en'?'ltr':'rtl');
              document.dispatchEvent(new CustomEvent('zavi:language-change',
                {detail:{language:%s}}));
              const api=window.ZaviDesignSystemV1;
              const label=document.querySelector('[data-zds-password-toggle=%s]')
                .getAttribute('aria-label');
              const expected=api.passwordVisibilityLabel(%s,false);
              const adv=document.querySelector('.zds-login-advanced');
              return {label,expected,dir:document.documentElement.dir,
                advancedLabel:adv?.querySelector('[data-zds-translation]')
                  ?.textContent||null,
                expectedAdvanced:adv?api.localizedLabel('serverSettings',%s):null,
                advancedCollapsed:adv?!adv.open:null,
                fieldStillPresent:!!document.getElementById(%s)};
            })()""" %tuple(json.dumps(x) for x in
                 [lang,lang,lang,field_id,lang,lang,field_id]))
            if status['label']!=status['expected'] or not status['fieldStillPresent']:
                raise SystemExit(app+' password localization regression: '+repr(status))
            if status['dir']!=('ltr' if lang=='en' else 'rtl'):
                raise SystemExit(app+' direction mismatch: '+repr(status))
            if app=='admin' and (status['advancedLabel']!=status['expectedAdvanced'] or
                                 status['advancedCollapsed'] is not True):
                raise SystemExit('ADMIN advanced connection settings mismatch: '+repr(status))
        # Real runtime theme API only; not merely changing a CSS attribute.
        browser.eval("document.documentElement.lang='fa-AF';document.documentElement.dir='rtl';")
        for mode in ['light','dark']:
            proof=browser.eval("""(()=>{
              window.ZaviThemeV29.set(%s);
              const root=document.documentElement;
              return {appearance:root.dataset.zaviAppearance,
                theme:root.dataset.zaviTheme,
                token:getComputedStyle(root).getPropertyValue('--zds-text').trim(),
                field:!!document.getElementById(%s)};
            })()""" %(json.dumps(mode),json.dumps(field_id)))
            if proof['appearance']!=mode or not proof['token'] or not proof['field']:
                raise SystemExit(app+' missing theme on real login: '+repr(proof))
            p=OUT/(app+'-login-'+mode+'.png')
            p.write_bytes(browser.screenshot())
            if p.stat().st_size<10000:
                raise SystemExit('Tiny/blank screenshot: '+p.name)
            print('PASS:',app,mode,'real login theme + password control + screenshot',p.name)

        if app=='one':
            # Owner's last light-reference sheet: test the real gate controls,
            # not a mock login. All clicks affect appearance only, not auth.
            controls=browser.eval("""(()=>{
              const gate=document.getElementById('zawiPrivateGate');
              const controls=[...gate.querySelectorAll(
                '.zavi-gate-appearance [data-zavi-theme-choice]')];
              const links=[...document.querySelectorAll('link[rel="stylesheet"]')]
                .map(el=>el.getAttribute('href')||'');
              return {realGate:!!gate,realPin:!!gate?.querySelector('#zawiPinForm'),
                realRecovery:!!gate?.querySelector('#zawiForgotPinBtn'),
                stylesheet:links.some(x=>x.includes('zavi-owner-reference-login-v1.css')),
                themes:controls.map(el=>el.dataset.zaviThemeChoice),
                minTap:controls.map(el=>Math.round(el.getBoundingClientRect().height))};
            })()""")
            assert controls['realGate'] and controls['realPin'] and controls['realRecovery'],controls
            assert controls['stylesheet'],controls
            assert controls['themes']==['light','dark','glass'],controls
            assert all(h>=44 for h in controls['minTap']),controls
            for language,expected in [('fa-AF','روشن'),('ps-AF','روښانه'),('en','Light')]:
                label=browser.eval("""(()=>{
                  document.documentElement.lang=%s;
                  document.documentElement.dir=%s;
                  const btn=document.querySelector(
                    '#zawiPrivateGate [data-zavi-theme-choice="light"]');
                  return [...btn.querySelectorAll('.zavi-gate-lang')]
                    .filter(el=>getComputedStyle(el).display!=='none')
                    .map(el=>el.textContent.trim());
                })()""" %(json.dumps(language),json.dumps('ltr' if language=='en' else 'rtl')))
                assert label==[expected],(language,label)
            browser.eval("document.documentElement.lang='fa-AF';document.documentElement.dir='rtl';")
            for choice in ['light','dark','glass']:
                result=browser.eval("""(()=>{
                  const btn=document.querySelector(
                    '#zawiPrivateGate [data-zavi-theme-choice=%s]');
                  btn.click();
                  const root=document.documentElement;
                  const state=[...document.querySelectorAll(
                    '#zawiPrivateGate [data-zavi-theme-choice]')].map(el=>({
                      theme:el.dataset.zaviThemeChoice,
                      selected:el.getAttribute('aria-pressed')==='true'
                    }));
                  const card=document.querySelector('#zawiPrivateGate .zawi-auth-card');
                  return {theme:root.dataset.zaviTheme,appearance:root.dataset.zaviAppearance,
                    selected:state.filter(s=>s.selected).map(s=>s.theme),
                    cardBg:getComputedStyle(card).backgroundColor,
                    cardVisible:card.getBoundingClientRect().width>0};
                })()""" %json.dumps(choice))
                assert result['theme']==choice and result['appearance']==choice,result
                assert result['selected']==[choice] and result['cardVisible'],result
                screenshot=OUT/('one-owner-gate-'+choice+'.png')
                screenshot.write_bytes(browser.screenshot())
                assert screenshot.stat().st_size>10000,screenshot
            # Reload the real app: the older preferences boot used to reset
            # saved glass to dark. Catch that regression on a fresh page load.
            browser.navigate('one')
            browser.until("""document.readyState==='complete' &&
              typeof window.ZaviThemeV29?.get==='function' &&
              !!document.getElementById('zawiPrivateGate')""",
              'real ONE PIN gate after persisted theme reload',seconds=20)
            persisted=browser.eval("""(()=>({
              theme:document.documentElement.dataset.zaviTheme,
              appearance:document.documentElement.dataset.zaviAppearance,
              uiStorage:localStorage.getItem('zavi_ui_appearance_v2'),
              themeStorage:localStorage.getItem('zavi_theme_preference_v29'),
              runtime:window.ZaviThemeV29.get()
            }))()""")
            assert all(v=='glass' for v in persisted.values()),persisted
            print('PASS: owner-referenced ONE PIN entry, 3 themes, 3 locales, persisted glass reload')

print('PASS: both apps, two theme runtime screenshots and three localized password/advanced labels')
print('NOT VERIFIED: all surrounding login prose translations, biometric authentication, real owner login.')
