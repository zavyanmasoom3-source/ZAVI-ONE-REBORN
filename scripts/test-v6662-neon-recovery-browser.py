#!/usr/bin/env python3
"""Owner-approved neon recovery: render/viewport/theme regression, no real server calls."""
from pathlib import Path
import json
from chrome_cdp import Session, ROOT

OUT=ROOT/'qa-v6662-neon-auth'
OUT.mkdir(exist_ok=True)

with Session() as browser:
    browser.unlock_one()
    browser.navigate('one')
    browser.until("""document.documentElement.classList.contains('zawi-locked')
       && !!document.getElementById('zawiForgotPinBtn')""",
       'auth starts locked for real PIN recovery')
    browser.eval("document.getElementById('zawiForgotPinBtn').click()")
    browser.until("""!!document.querySelector(
       '#z24Recovery .z66rec-shield svg') &&
       !!document.querySelector('#z24Recovery .z66rec-brand')""",
       'approved recovery graphics appear with real recovery controls')
    layout=browser.eval("""(()=>{
      const root=document.getElementById('z24Recovery');
      const card=root.querySelector('.z24-pbox');
      const cancel=root.querySelector('#z24Cancel');
      return {
        role:root.getAttribute('role'),modal:root.getAttribute('aria-modal'),
        cards:root.querySelectorAll('.z24-pbox').length,
        steps:root.querySelectorAll('[data-z24-step]').length,
        active:root.dataset.z24CurrentStage,
        cancelInHeader:!!cancel?.closest('.z24-ph'),
        correctEmail:root.querySelector('#z24Email')?.type==='email',
        correctOnlinePassword:root.querySelector('#z24Password')?.type==='password',
        noFakeCode:!root.querySelector('input[type="tel"], input[autocomplete="one-time-code"]'),
        realLogin:!!root.querySelector('#z24Login'),
        realStore:!!root.querySelector('#z24Workspace'),
        realRequest:!!root.querySelector('#z24Ask'),
        realStatus:!!root.querySelector('#z24Check'),
        realReset:!!root.querySelector('#z24Finish'),
        background:getComputedStyle(card).backgroundImage,
        visibleStageOne:!root.querySelector('[data-z24-panel="1"]').hidden,
        otherStagesHidden:[...root.querySelectorAll('[data-z24-panel]')].slice(1).every(el=>el.hidden)
      };
    })()""")
    assert layout['role']=='dialog' and layout['modal']=='true',layout
    assert layout['cards']==1 and layout['steps']==4 and layout['active']=='1',layout
    assert all(layout[x] for x in (
      'cancelInHeader','correctEmail','correctOnlinePassword','noFakeCode',
      'realLogin','realStore','realRequest','realStatus','realReset',
      'visibleStageOne','otherStagesHidden')),layout
    assert 'linear-gradient' in layout['background'],layout
    devices=[]
    for width,height in ((320,568),(360,640),(393,852),(430,932),(320,460),(720,400)):
        browser.command('Emulation.setDeviceMetricsOverride',{
            'width':width,'height':height,'deviceScaleFactor':1,
            'mobile':True,'screenWidth':width,'screenHeight':height
        })
        geom=browser.eval("""(()=>{
           const root=document.getElementById('z24Recovery');
           const card=root.querySelector('.z24-pbox');
           const r=root.getBoundingClientRect(),c=card.getBoundingClientRect();
           return {overlay:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},
            card:{left:c.left,right:c.right,top:c.top,bottom:c.bottom,width:c.width,height:c.height},
            client:root.clientWidth,scroll:root.scrollWidth,
            cardClient:card.clientWidth,cardScroll:card.scrollWidth,
            hasLogin:root.querySelector('#z24Login').getBoundingClientRect().width>=150,
            canScroll:card.scrollHeight>card.clientHeight,
            maxHeight:getComputedStyle(card).maxHeight};
        })()""")
        assert geom['card']['width']>=min(width-28,282),geom
        assert geom['card']['left']>=6 and geom['card']['right']<=width-6,geom
        assert abs(geom['card']['left']-(width-geom['card']['right']))<1.5,geom
        assert geom['card']['top']>=-1 and geom['card']['bottom']<=height+1,geom
        assert geom['cardScroll']<=geom['cardClient']+2,geom
        assert geom['scroll']<=geom['client']+2,geom
        assert geom['hasLogin'],geom
        devices.append({'width':width,'height':height,'scrollable':geom['canScroll']})
        if width==393:
            (OUT/'recovery-393x852.png').write_bytes(browser.screenshot())
    for locale,title in (
        ('fa-AF','بازیابی حساب'),('ps-AF','د حساب بېرته ترلاسه کول'),
        ('en','Recover account')
    ):
        browser.eval('window.ZaviLocaleV22.set(%s)'%json.dumps(locale))
        browser.until("""document.getElementById('z24RecoveryHeading')
           ?.textContent===%s"""%json.dumps(title),'recovery translated '+locale)
        assert browser.eval("""document.querySelector('#z24Recovery #z24Email').type""")=='email'
    browser.eval("window.ZaviLocaleV22.set('fa-AF')")
    themes=[]
    for theme in ('dark','light','glass'):
        browser.eval("window.ZaviThemeV29.set(%s)"%json.dumps(theme))
        browser.until("document.documentElement.dataset.zaviTheme===%s"%json.dumps(theme),
                     'neon recovery theme '+theme)
        state=browser.eval("""(()=>{
          const e=document.getElementById('z24Recovery');
          return {paper:getComputedStyle(e).getPropertyValue('--z66r-paper').trim(),
           title:getComputedStyle(e.querySelector('h2')).color,
           visible:e.getBoundingClientRect().width>200};
        })()""")
        assert state['paper'] and state['visible'],state
        themes.append({'theme':theme,**state})
    assert themes[0]['paper']!=themes[1]['paper'],themes
    browser.eval("document.documentElement.dataset.z637NoMotion='true'")
    reduced=browser.eval("""(()=>{
       const root=document.getElementById('z24Recovery');
       return {card:getComputedStyle(root.querySelector('.z24-pbox')).animationName,
        shield:getComputedStyle(root.querySelector('.z66rec-shield')).animationName};
    })()""")
    assert reduced['card']=='none' and reduced['shield']=='none',reduced
    browser.eval("document.documentElement.removeAttribute('data-z637-no-motion')")
    # The moved Back button is the very same native cancel button.
    browser.eval("document.getElementById('z24Cancel').click()")
    browser.until("!document.getElementById('z24Recovery')",
                  'native back button closes safely')
    assert browser.eval("document.documentElement.classList.contains('zawi-locked')")
    assert browser.eval("!!localStorage.getItem('zawi_store_personal_pin_v1')")
    print('PASS: neon recovery UI real modal, 4 original stages, no fake SMS path, safe native close')
    print('PASS: six viewports, 3 languages, 3 themes, animations opt-out, PIN remains locked')
    (OUT/'neon-recovery.json').write_text(json.dumps({
        'initial':layout,'devices':devices,'themes':themes
    },ensure_ascii=False,indent=2),encoding='utf-8')
