#!/usr/bin/env python3
"""Actual account-control stylesheet: Light/Dark/Glass + RTL/LTR.

Uses a synthetic, customer-free account card inside the real ADMIN page.
No Auth session, server request, customer list, archive, billing or mutations.
"""
import json
from chrome_cdp import Session

with Session() as browser:
    browser.navigate('admin')
    browser.until("!!document.getElementById('z24Styles') && !!window.ZaviThemeV29",
                  'real ADMIN owner-account stylesheet injected')
    browser.eval("""(()=>{
      const overlay=document.createElement('section');overlay.id='z24Root';
      overlay.setAttribute('data-qa','synthetic-owner-appearance');
      overlay.innerHTML='<div class="v24-shell"><article class="v24-box">'
        +'<div class="v24-stat">QA-only display</div>'
        +'<input class="v24-input" value="QA" aria-label="QA only">'
        +'<table class="v24-table"><tbody><tr><td>QA row</td></tr></tbody></table>'
        +'<button class="v24-btn subtle">QA action</button></article></div>';
      document.body.append(overlay);
    })()""")
    cases=[]
    for mode in ('light','dark','glass'):
        for language,direction in [('fa-AF','rtl'),('ps-AF','rtl'),('en','ltr')]:
            result=browser.eval("""(()=>{
               const theme=%s,direction=%s,language=%s;
               window.ZaviThemeV29.set(theme);
               document.documentElement.setAttribute('lang',language);
               document.documentElement.setAttribute('dir',direction);
               const root=document.getElementById('z24Root');
               const card=root.querySelector('.v24-box');
               const cs=getComputedStyle(card);
               const input=getComputedStyle(root.querySelector('input'));
               const table=getComputedStyle(root.querySelector('table'));
               return {
                theme:document.documentElement.dataset.zaviTheme,
                lang:document.documentElement.lang,
                dir:getComputedStyle(root).direction,
                tableDir:table.direction,
                cardBackground:cs.backgroundColor,
                cardImage:cs.backgroundImage,
                cardText:cs.color,
                glassBlur:cs.backdropFilter||cs.webkitBackdropFilter||'',
                inputColor:input.color,
                inputBackground:input.backgroundColor
               };
            })()"""%(json.dumps(mode),json.dumps(direction),json.dumps(language)))
            assert result['theme']==mode and result['lang']==language,result
            assert result['dir']==direction and result['tableDir']==direction,result
            if mode=='light':
                assert result['cardBackground']=='rgb(255, 255, 255)',result
                assert result['cardText']=='rgb(23, 55, 80)',result
            elif mode=='dark':
                assert 'linear-gradient' in result['cardImage'],result
            else:
                assert result['cardBackground'].startswith('rgba('),result
                assert 'blur(' in result['glassBlur'],result
            cases.append({'theme':mode,'language':language,'passed':True})
    print('PASS: 9 actual ADMIN account/recovery Light/Dark/Glass + Dari/Pashto/English RTL/LTR computed CSS cases')
    print('PASS: light account cards readable and glass panels actually translucent with blur')
    print('TEST SCOPE: owner-account appearance, not full language translations or design pixel parity')
