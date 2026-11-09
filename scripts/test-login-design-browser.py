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
print('PASS: both apps, two theme runtime screenshots and three localized password/advanced labels')
print('NOT VERIFIED: all surrounding login prose translations, biometric authentication, real owner login.')
