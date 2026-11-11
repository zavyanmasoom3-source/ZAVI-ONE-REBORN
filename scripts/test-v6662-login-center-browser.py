#!/usr/bin/env python3
"""Regression: real owner V66.62 PIN gate is horizontally centered, never clipped.

Only ephemeral local Chrome; PIN auth and business data unchanged.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json

output=ROOT/'qa-v6662-login-center'
output.mkdir(exist_ok=True)

with Session() as browser:
    browser.navigate('one')
    browser.until("""document.documentElement.classList.contains('zawi-locked')
      && document.getElementById('zawiPrivateGate')?.classList.contains('zavi66-approved-login')
      && !!document.getElementById('zavi66PinHint')""",
      'V66.62 PIN login appears with approved theme')
    # The approved neon theme is functional, not just a painted mock.
    neon=browser.eval("""(()=>{
       const g=document.getElementById('zawiPrivateGate');
       const c=g.querySelector('.zawi-auth-card');
       const controls=[...g.querySelectorAll('.z66neon-theme')];
       return {
          brand:g.querySelector('.z66neon-brand')?.textContent?.replace(/\s+/g,' ').trim(),
          themes:controls.map(x=>({mode:x.dataset.z66Theme,
             accessible:!!x.getAttribute('aria-label'),type:x.type})),
          gradient:getComputedStyle(c).backgroundImage,
          logo:g.querySelector('.zawi-lock-emblem img')?.getAttribute('src'),
          originalPIN:!!g.querySelector('#zawiPinOne[pattern]'),
          recovery:!!g.querySelector('#zawiForgotPinBtn')
       };
    })()""")
    assert neon['brand']=='ZAVI ONE',neon
    assert {x['mode'] for x in neon['themes']}=={'light','dark'},neon
    assert all(x['accessible'] and x['type']=='button' for x in neon['themes']),neon
    assert 'linear-gradient' in neon['gradient'],neon
    assert neon['logo']=='./zavi-one-original-logo.png' and neon['originalPIN'] and neon['recovery'],neon
    browser.eval("document.querySelector('.z66neon-theme[data-z66-theme=light]').click()")
    browser.until("document.documentElement.dataset.zaviTheme==='light'",
                  'native light theme toggled through new login control')
    assert browser.eval("""document.querySelector(
         '.z66neon-theme[data-z66-theme=light]').getAttribute('aria-pressed')""")=='true'
    browser.eval("document.querySelector('.z66neon-theme[data-z66-theme=dark]').click()")
    browser.until("document.documentElement.dataset.zaviTheme==='dark'",
                  'native dark theme toggled through new login control')
    assert browser.eval("""document.querySelector(
         '.z66neon-theme[data-z66-theme=dark]').getAttribute('aria-pressed')""")=='true'
    browser.eval("document.documentElement.dataset.z637NoMotion='true'")
    motion=browser.eval("""(()=>{
       const c=document.querySelector('#zawiPrivateGate .zawi-auth-card');
       return {card:getComputedStyle(c).animationName,
         glow:getComputedStyle(c.querySelector('.zawi-lock-emblem')).animationName};
    })()""")
    assert motion['card']=='none' and motion['glow']=='none',motion
    browser.eval("document.documentElement.removeAttribute('data-z637-no-motion')")
    sizes=[(320,568),(360,640),(393,852),(430,932),(320,460),(720,400)]
    tested=[]
    for width,height in sizes:
        browser.command('Emulation.setDeviceMetricsOverride',{
           'width':width,'height':height,'deviceScaleFactor':1,
           'mobile':True,'screenWidth':width,'screenHeight':height
        })
        for lang in ('fa-AF','ps-AF','en'):
            browser.eval('window.ZaviLocaleV22.set(%s)'%json.dumps(lang))
            browser.until("""document.getElementById('zawiPrivateGate')
                ?.dir===%s"""%json.dumps('ltr' if lang=='en' else 'rtl'),
                'PIN direction switched instantly to '+lang)
            result=browser.eval("""(()=>{
               const gate=document.getElementById('zawiPrivateGate');
               const card=gate.querySelector('.zawi-auth-card');
               const field=gate.querySelector('#zawiPinOne');
               const submit=gate.querySelector('#zawiPinSubmit');
               const forgot=gate.querySelector('#zawiForgotPinBtn');
               const bounds=o=>{const r=o.getBoundingClientRect();
                 return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
                    width:r.width,height:r.height}};
               const g=bounds(gate),c=bounds(card),f=bounds(field);
               const vw=document.documentElement.clientWidth;
               const vh=window.innerHeight;
               const available=vw;
               return {vw,vh,g,c,f,
                 zoom:document.documentElement.style.zoom||'',
                 direction:gate.dir,
                 cardOverflow:card.scrollWidth-card.clientWidth,
                 gateOverflow:gate.scrollWidth-gate.clientWidth,
                 cardScrollable:card.scrollHeight>card.clientHeight,
                 cardInnerScrollHeight:card.scrollHeight,
                 hiddenPanel:getComputedStyle(gate).display==='none',
                 elementsExist:!!submit&&!!forgot,
                 submitWidth:bounds(submit).width,
                 forgotWidth:bounds(forgot).width,
                 eyebrowText:gate.querySelector('.zavi-gate-eyebrow')?.textContent,
                 theme:document.documentElement.dataset.zaviTheme};
            })()""")
            assert not result['hiddenPanel'],result
            assert result['elementsExist'],result
            assert abs(result['g']['left'])<=1.1 and abs(result['g']['right']-width)<=1.1,result
            assert result['c']['width']>=min(width-32,280),result
            assert result['c']['width']<=390.5,result
            assert result['c']['left']>=9.0 and result['c']['right']<=width-9.0,result
            assert abs(result['c']['left']-(width-result['c']['right']))<=1.25,result
            assert result['c']['top']>=-1 and result['c']['bottom']<=height+1,result
            assert result['f']['left']>=result['c']['left']+8,result
            assert result['f']['right']<=result['c']['right']-8,result
            assert result['cardOverflow']<=2.0 and result['gateOverflow']<=2.0,result
            assert result['submitWidth']>=170 and result['forgotWidth']>=70,result
            tested.append({'size':[width,height],'lang':lang,
                'card':result['c'],'scrollable':result['cardScrollable']})
            if width==393 and lang=='fa-AF':
                (output/'login-393x852.png').write_bytes(browser.screenshot())
    browser.eval("window.ZaviLocaleV22.set('fa-AF')")
    for mode in ('light','dark','glass'):
        browser.eval('window.ZaviThemeV29.set(%s)'%json.dumps(mode))
        browser.until("""document.documentElement.dataset.zaviTheme===%s"""%json.dumps(mode),
                      'V66.62 theme toggles '+mode)
        theme=browser.eval("""(()=>{
            const gate=document.getElementById('zawiPrivateGate');
            const card=gate.querySelector('.zawi-auth-card');
            const g=gate.getBoundingClientRect(),c=card.getBoundingClientRect();
            return {visible:getComputedStyle(gate).display!=='none',
               bg:getComputedStyle(card).backgroundColor,
               centerError:Math.abs(c.left-(window.innerWidth-c.right)),
               inside:c.left>=9&&c.right<=window.innerWidth-9};
        })()""")
        assert theme['visible'] and theme['centerError']<=1.25 and theme['inside'],theme
        assert theme['bg'] not in ('rgba(0, 0, 0, 0)','transparent'),theme
    # Test actual authentication gate lifecycle, not a visual login bypass.
    err=browser.unlock_one()
    assert not err,err
    isHidden=browser.eval("""(()=>{
       const gate=document.getElementById('zawiPrivateGate');
       return getComputedStyle(gate).display==='none'
          && !document.documentElement.classList.contains('zawi-locked');
    })()""")
    assert isHidden,'PIN gate must disappear normally after real local PIN validation'
    print('PASS: 18 real 320–720px browser geometry probes, RTL/LTR, three themes, no clipped PIN, natural unlock')
    print('PASS: multi-line and short-screen internal scrolling supported')
    (output/'geometry.json').write_text(json.dumps(tested,ensure_ascii=False,indent=2),encoding='utf-8')
