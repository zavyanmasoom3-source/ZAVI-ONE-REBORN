#!/usr/bin/env python3
"""V66.62 user video regression: compact, readable native screens only.
Disposable Chrome: no financial save, no Supabase write, no test customer data.
"""
from chrome_cdp import Session
import json

def brightness_check(report):
    assert report['light']['contrast']>=4.5,report
    assert report['dark']['contrast']>=4.5,report
    assert report['glass']['contrast']>=4.5,report

with Session() as browser:
    err=browser.unlock_one()
    if err: raise AssertionError(err)
    browser.route('settings')
    browser.until("""!!document.querySelector('#content .zavi-clean-settings-hub .zavi-module-grid')""",
                  'original settings visibility options loaded',seconds=15)
    # Open only existing disclosure ancestors, keeping the one canonical app form.
    browser.eval("""(()=>{
      const el=document.querySelector('#content .zavi-module-grid .zavi-switch')||
        document.querySelector('#content .zavi-module-grid label')||
        document.querySelector('#content .z20-grid .z20-toggle');
      if(!el)throw Error('Native module display toggle missing');
      for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
    })()""")
    report={}
    for theme in ('light','dark','glass'):
        browser.eval("window.ZaviThemeV29.set("+json.dumps(theme)+")")
        state=browser.eval("""(()=>{
          const el=document.querySelector('#content .zavi-module-grid .zavi-switch')||
            document.querySelector('#content .zavi-module-grid label')||
            document.querySelector('#content .z20-grid .z20-toggle');
          const text=el.querySelector('span,b,strong')||el;
          const s=getComputedStyle(el),t=getComputedStyle(text);
          const rgba=c=>{
            const a=String(c).match(/[0-9.]+/g)||[];
            return a.slice(0,3).map(Number);
          };
          const l=c=>{
            const x=rgba(c).map(v=>v/255).map(v=>
              v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
            return x[0]*.2126+x[1]*.7152+x[2]*.0722;
          };
          const a=l(t.color),b=l(s.backgroundColor);
          return {theme:document.documentElement.dataset.zaviTheme,
            contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),
            ink:t.color,bg:s.backgroundColor,
            width:el.getBoundingClientRect().width,
            height:el.getBoundingClientRect().height,
            gridWidth:el.closest('.zavi-module-grid,.z20-grid')?.clientWidth,
            cardCount:document.querySelectorAll('#content .zavi-clean-settings-group').length,
            duplicateForms:document.querySelectorAll('#shopForm').length,
            nativeToggle:!!el.querySelector('input[type=checkbox]'),
            overviewWidth:document.getElementById('content').clientWidth,
            contentWidth:document.getElementById('content').scrollWidth
          };
        })()""")
        assert state['theme']==theme and state['cardCount']==7,state
        assert state['nativeToggle'] and state['duplicateForms']==1,state
        assert 39<=state['height']<=96 and state['width']>100,state
        assert state['contentWidth']<=state['overviewWidth']+6,state
        assert state['contrast']>=4.5,state
        report[theme]=state
    brightness_check(report)
    browser.route('purchases')
    browser.until("""!!document.querySelector('#content .z66pm-actions .z66pm-action')""",
                  'actual purchase navigation loaded',seconds=12)
    for width in (360,420):
        browser.command('Emulation.setDeviceMetricsOverride',{
            'width':width,'height':780,'deviceScaleFactor':1,
            'mobile':True,'screenWidth':width,'screenHeight':780})
        purchases=browser.eval("""(()=>{
          const c=document.getElementById('content');
          const actions=[...c.querySelectorAll('.z66pm-actions .z66pm-action')];
          const metrics=[...c.querySelectorAll('.z66pm-metric')];
          const grid=getComputedStyle(c.querySelector('.z66pm-actions'));
          return {actions:actions.length,metrics:metrics.length,
            columns:grid.gridTemplateColumns.split(' ').length,
            heights:actions.map(x=>Math.round(x.getBoundingClientRect().height)),
            width:c.clientWidth,scroll:c.scrollWidth,
            supplierTab:!!c.querySelector('[data-z66pm-view=suppliers]'),
            inTransitTab:!!c.querySelector('[data-z66pm-view=orders]')};
        })()""")
        assert purchases['actions']==4 and purchases['columns']==2,purchases
        assert purchases['supplierTab'] and purchases['inTransitTab'],purchases
        assert all(h>=44 and h<=135 for h in purchases['heights']),purchases
        assert purchases['scroll']<=purchases['width']+6,purchases
    print('PASS user-video compact light/dark/glass settings contrast, 7 original groups, native toggles')
    print('PASS four compact native purchase actions, real supplier/in-transit tabs, 360/420px layout')
    print(json.dumps(report,ensure_ascii=False))
