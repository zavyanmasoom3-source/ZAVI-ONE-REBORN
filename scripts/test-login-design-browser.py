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

        if app=='one' and (ROOT/'apps/one/v6662-original-design-lock.json').is_file():
            # Approved owner-requested 66.62 login, not a second mock login.
            browser.until("""document.getElementById('zawiPrivateGate')
              ?.classList.contains('zavi66-approved-login')""",
              'approved compact login enhancement applied',seconds=15)
            layout=browser.eval("""(()=>{
              const gate=document.getElementById('zawiPrivateGate');
              const card=gate.querySelector('.zawi-auth-card');
              const meter=document.getElementById('z639PinProgress');
              return {
                compact:card.getBoundingClientRect().width<=395,
                brandHidden:getComputedStyle(gate.querySelector('.zawi-brand-latin')).display==='none',
                meterHidden:!meter||getComputedStyle(meter).display==='none',
                originalLogo:card.querySelector('.zawi-lock-emblem img')
                   ?.getAttribute('src')==='./zavi-one-original-logo.png',
                languageAtTop:card.firstElementChild.id==='zaviGateLanguage' ||
                  card.firstElementChild.classList.contains('zavi-auth-language'),
                pinField:!!gate.querySelector('#zawiPinForm #zawiPinOne'),
                setupConfirm:!!gate.querySelector('#zawiPinRepeat[required]'),
                recoveryLink:!!gate.querySelector('#zawiForgotPinBtn'),
                hintVisible:getComputedStyle(
                  gate.querySelector('#zavi66PinHint')).display!=='none'
              };
            })()""")
            assert all(layout.values()),layout
            for locale,title in [
                ('fa-AF','ورود به ZAVI ONE'),
                ('ps-AF','ZAVI ONE ته ننوتل'),
                ('en','Sign in to ZAVI ONE')
            ]:
                browser.eval('window.ZaviLocaleV22.set(%s)'%json.dumps(locale))
                browser.until("""document.getElementById('zawiGateTitle')
                  ?.textContent===%s"""%json.dumps(title),
                  'login localizes without reload: '+locale,seconds=15)
                state=browser.eval("""(()=>({
                  title:document.getElementById('zawiGateTitle').textContent,
                  label:document.getElementById('zawiPinLabel').textContent,
                  activeLanguage:document.getElementById('zaviGateLanguage').value,
                  direction:document.getElementById('zawiPrivateGate').dir,
                  forgot:document.getElementById('zawiForgotPinBtn').textContent,
                  pinKept:document.getElementById('zawiPinOne').type==='password'
                }))()""")
                assert state['activeLanguage']==locale,state
                assert state['direction']==('ltr' if locale=='en' else 'rtl'),state
                assert state['label'] and state['forgot'] and state['pinKept'],state
            browser.eval("window.ZaviLocaleV22.set('fa-AF')")
            for mode in ['light','dark','glass']:
                theme=browser.eval("""(()=>{
                  window.ZaviThemeV29.set(%s);
                  const root=document.getElementById('zawiPrivateGate');
                  const card=root.querySelector('.zawi-auth-card');
                  const css=getComputedStyle(card);
                  return {name:document.documentElement.dataset.zaviTheme,
                    visible:card.getBoundingClientRect().width>250,
                    bg:css.backgroundColor,ink:css.color};
                })()"""%json.dumps(mode))
                assert theme['name']==mode and theme['visible'],theme
                assert theme['bg'] not in ('rgba(0, 0, 0, 0)','transparent'),theme
            browser.eval("window.ZaviThemeV29.set('light')")
            print('PASS: approved 66.62 compact PIN entry, locale labels, '
                  'theme cards, eye and recovery controls')
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
                token:(getComputedStyle(root).getPropertyValue('--zds-text')||getComputedStyle(root).getPropertyValue('--z38-text')).trim(),
                field:!!document.getElementById(%s)};
            })()""" %(json.dumps(mode),json.dumps(field_id)))
            if proof['appearance']!=mode or not proof['token'] or not proof['field']:
                raise SystemExit(app+' missing theme on real login: '+repr(proof))
            p=OUT/(app+'-login-'+mode+'.png')
            p.write_bytes(browser.screenshot())
            if p.stat().st_size<10000:
                raise SystemExit('Tiny/blank screenshot: '+p.name)
            print('PASS:',app,mode,'real login theme + password control + screenshot',p.name)

        if app=='one' and (ROOT/'apps/one/v6662-original-design-lock.json').is_file():
            # The user's genuine 62MB V66.62 has PIN and recovery on its
            # classic entry, while the three original theme controls live in
            # Settings. Do NOT require the rejected PDF-only login sheet.
            legacy=browser.eval("""(()=>({
              pin:!!document.getElementById('zawiPinOne'),
              recovery:!!document.getElementById('zawiForgotPinBtn'),
              original:!!document.getElementById('zawiPrivateGate')
            }))()""")
            assert all(legacy.values()),legacy
            err=browser.unlock_one()
            if err:raise AssertionError('Original PIN unlock failed: '+str(err))
            state=browser.route('settings')
            assert state['selected'] and state['visible'] and not state['locked'],state
            browser.until("""document.querySelectorAll(
              '#zavi-theme-controls [data-zavi-theme-choice]').length===3""",
              'genuine legacy three-mode settings picker',seconds=20)
            for choice in ['light','dark','glass']:
                proof=browser.eval("""(()=>{
                  window.ZaviThemeV29.set(%s);
                  const root=document.documentElement;
                  const buttons=[...document.querySelectorAll(
                    '#zavi-theme-controls [data-zavi-theme-choice]')];
                  return {theme:root.dataset.zaviTheme,
                    appearance:root.dataset.zaviAppearance,
                    controls:buttons.map(b=>b.dataset.zaviThemeChoice),
                    selected:buttons.filter(b=>b.getAttribute('aria-pressed')==='true')
                      .map(b=>b.dataset.zaviThemeChoice)};
                })()""" %json.dumps(choice))
                assert proof['theme']==choice and proof['appearance']==choice,proof
                assert proof['controls']==['light','dark','glass'] and proof['selected']==[choice],proof
                image=OUT/('one-original-settings-'+choice+'.png')
                image.write_bytes(browser.screenshot())
                assert image.stat().st_size>10000,image
            for language,direction in [('fa-AF','rtl'),('ps-AF','rtl'),('en','ltr')]:
                lang=browser.eval("""(()=>{
                  window.ZaviLocaleV22.set(%s);
                  return {lang:document.documentElement.lang,
                    dir:document.documentElement.dir};
                })()""" %json.dumps(language))
                assert lang['lang']==language and lang['dir']==direction,lang
            print('PASS: original 66.62 PIN/recovery, settings-based 3 themes, 3 languages, existing look')
            continue

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
            # Owner-uploaded original uses compact 40px theme tiles. Do not silently
            # increase their dimensions and change the approved layout.
            assert all(h>=40 for h in controls['minTap']),controls
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

            # The real PBKDF2 PIN gate must localize all labels immediately.
            # Switching locale mid-entry may not clear a typed PIN.
            for language,title,submit in [
                ('fa-AF','ورود به ZAVI ONE','ثبت رمز و ورود'),
                ('ps-AF','ZAVI ONE ته ننوتل','رمز جوړول او ننوتل'),
                ('en','Sign in to ZAVI ONE','Save PIN & enter')
            ]:
                gate_text=browser.eval("""(()=>{
                  const l=%s;
                  const pass=document.getElementById('zawiPinOne');
                  pass.value='123456';
                  document.documentElement.lang=l;
                  document.documentElement.dir=l==='en'?'ltr':'rtl';
                  document.dispatchEvent(new CustomEvent('zavi:language-change',
                    {detail:{language:l}}));
                  const e=id=>document.getElementById(id);
                  return {title:e('zawiGateTitle')?.textContent,
                    button:e('zawiPinSubmit')?.textContent,
                    help:e('zawiGateHelp')?.textContent,
                    label:e('zawiPinLabel')?.textContent,
                    repeat:e('zawiPinRepeatRow')?.querySelector('label')?.textContent,
                    forgotten:e('zawiForgotPinBtn')?.textContent,
                    typed:pass.value,
                    theme:e('zawiPrivateGate')?.querySelector('.zavi-gate-appearance')
                      ?.getAttribute('aria-label')};
                })()""" %json.dumps(language))
                assert gate_text['title']==title and gate_text['button']==submit,gate_text
                assert gate_text['typed']=='123456' and gate_text['help'],gate_text
                assert gate_text['label'] and gate_text['repeat'] and gate_text['theme'],gate_text
                assert gate_text['forgotten'],gate_text
            browser.eval("""(()=>{
              document.documentElement.lang='fa-AF';
              document.documentElement.dir='rtl';
              document.dispatchEvent(new CustomEvent('zavi:language-change',
                {detail:{language:'fa-AF'}}));
              document.getElementById('zawiPinOne').value='';
            })()""")
            print('PASS: native PIN login labels and guarded PIN input survive three language changes')


            # Exercise the real recovery dialog without submitting a credential
            # or calling the production PIN-reset RPC.
            for lang, heading in [('fa-AF','بازیابی رمز خصوصی'),
                                  ('ps-AF','د شخصي رمز بېرته ترلاسه کول'),
                                  ('en','Recover private PIN')]:
                browser.eval("""(()=>{
                  const lang=%s;
                  document.documentElement.lang=lang;
                  document.documentElement.dir=lang==='en'?'ltr':'rtl';
                  document.dispatchEvent(new CustomEvent('zavi:language-change',
                    {detail:{language:lang}}));
                  document.getElementById('zawiForgotPinBtn').click();
                })()""" %json.dumps(lang))
                browser.until("!!document.getElementById('z24Recovery')",
                              'real recovery dialog visible')
                proof=browser.eval("""(()=>{
                  const root=document.getElementById('z24Recovery');
                  return {heading:root.querySelector('h2')?.textContent.trim(),
                    role:root.getAttribute('role'),modal:root.getAttribute('aria-modal'),
                    described:!!root.querySelector('#z24RecoveryIntro'),
                    dir:getComputedStyle(root).direction,focused:document.activeElement?.id,
                    password:root.querySelector('#z24Password')?.type,
                    askDisabled:root.querySelector('#z24Ask')?.disabled,
                    loadDisabled:root.querySelector('#z24Load')?.disabled};
                })()""")
                assert proof['heading']==heading and proof['role']=='dialog',proof
                assert proof['modal']=='true' and proof['described'],proof
                assert proof['dir']==('ltr' if lang=='en' else 'rtl'),proof
                assert proof['focused']=='z24Email' and proof['password']=='password',proof
                assert proof['askDisabled'] and proof['loadDisabled'],proof

                # A real store-selection status must follow the active locale,
                # and must update again if the language changes while open.
                note=browser.eval("""(()=>{
                  document.getElementById('z24Workspace').dispatchEvent(
                    new Event('change',{bubbles:true}));
                  return document.getElementById('z24RecoveryStatus')?.textContent;
                })()""")
                expected={'fa-AF':'دوکان خود را انتخاب کرده',
                          'ps-AF':'خپل دوکان وټاکئ',
                          'en':'Select your store'}[lang]
                assert expected in note,(lang,note)
                if lang=='fa-AF':
                    switched=browser.eval("""(()=>{
                      document.documentElement.lang='en';
                      document.documentElement.dir='ltr';
                      document.dispatchEvent(new CustomEvent('zavi:language-change',
                        {detail:{language:'en'}}));
                      const before=document.getElementById('z24RecoveryStatus')?.textContent;
                      document.documentElement.lang='fa-AF';
                      document.documentElement.dir='rtl';
                      document.dispatchEvent(new CustomEvent('zavi:language-change',
                        {detail:{language:'fa-AF'}}));
                      return {english:before,
                        dari:document.getElementById('z24RecoveryStatus')?.textContent};
                    })()""")
                    assert 'Select your store' in switched['english'],switched
                    assert 'دوکان خود را انتخاب کرده' in switched['dari'],switched

                for mode in ['light','dark','glass']:
                    display=browser.eval("""(()=>{
                      window.ZaviThemeV29.set(%s);
                      const el=document.querySelector('#z24Recovery .z24-pbox');
                      const s=getComputedStyle(el);
                      return {background:s.backgroundColor,token:getComputedStyle(document.documentElement).getPropertyValue('--zds-surface').trim(),styleLoaded:!!document.getElementById('z24RecoveryStyle'),visible:el.getBoundingClientRect().width>0};
                    })()""" %json.dumps(mode))
                    assert display['visible'] and display['styleLoaded'] and display['token'],display
                    assert (display['background']=='rgb(255, 255, 255)')==(mode=='light'),display
                    if lang=='fa-AF':
                        shot=OUT/('one-recovery-'+mode+'.png')
                        shot.write_bytes(browser.screenshot())
                        assert shot.stat().st_size>10000,shot
                closed=browser.eval("""(()=>{
                  document.querySelector('#z24Email').dispatchEvent(
                    new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
                  return {closed:!document.getElementById('z24Recovery'),
                    focused:document.activeElement?.id};
                })()""")
                assert closed=={'closed':True,'focused':'zawiForgotPinBtn'},closed
            print('PASS: recovered PIN modal appearance, English direction, focus and Escape')


print('PASS: both apps, two theme runtime screenshots and three localized password/advanced labels')
print('NOT VERIFIED: all surrounding login prose translations, biometric authentication, real owner login.')
