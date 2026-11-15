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
    # The owner screenshots show MOST module rows white-on-white, although
    # the former test only checked row one. Test every real checkbox label.
    # All nodes remain the original settings controls, no fake toggles.
    for mode in ('light','dark','glass'):
        browser.eval("window.ZaviThemeV29.set("+json.dumps(mode)+")")
        browser.command('Emulation.setDeviceMetricsOverride',{
            'width':360,'height':780,'deviceScaleFactor':1,'mobile':True,
            'screenWidth':360,'screenHeight':780})
        details=browser.eval("""(()=>{
          const labels=[...document.querySelectorAll('#content .zavi-clean-settings-hub .zavi-module-grid label.zavi-switch')];
          const rgba=c=>(c.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
          const lum=c=>{const x=rgba(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
            return x[0]*.2126+x[1]*.7152+x[2]*.0722};
          const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
          return {theme:document.documentElement.dataset.zaviTheme,count:labels.length,
            labels:labels.map(el=>{
              const span=el.querySelector('span'),box=el.querySelector('input[type=checkbox]');
              const b=getComputedStyle(el),t=getComputedStyle(span);
              return {label:span?.textContent.trim(),ink:t.color,bg:b.backgroundColor,
                contrast:contrast(t.color,b.backgroundColor),
                visible:t.visibility!=='hidden'&&t.display!=='none'&&el.getBoundingClientRect().height>=40,
                checkbox:!!box,overflow:el.scrollWidth>el.clientWidth+3};
            })};
        })()""")
        assert details['theme']==mode and details['count']>=10,details
        assert all(x['label'] and x['checkbox'] and x['visible'] and
                   not x['overflow'] and x['contrast']>=4.5
                   for x in details['labels']),details
    print('PASS every original module label readable in Light Dark Glass on 360px phone')
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
    # Screenshot: renewal requests previously ran into each other with no
    # separate card styling. Check all three real WhatsApp links & layouts;
    # never click/send a renewal or change the server subscription.
    browser.route('subscription')
    browser.until("""!!document.querySelector('#content #zaviSubscriptionHub .zsh-renewal-requests')""",
                  'original subscription and renewal screen mounted',seconds=15)
    for theme in ('light','dark','glass'):
        browser.eval("window.ZaviThemeV29.set("+json.dumps(theme)+")")
        for width in (360,420):
            browser.command('Emulation.setDeviceMetricsOverride',{
                'width':width,'height':780,'deviceScaleFactor':1,'mobile':True,
                'screenWidth':width,'screenHeight':780})
            state=browser.eval("""(()=>{
              const root=document.querySelector('#content #zaviSubscriptionHub');
              const nav=root.querySelector('.zsh-renewal-requests');
              const links=[...nav.querySelectorAll('.zsh-duration-request')];
              return {
                links:links.map(el=>{
                  const r=el.getBoundingClientRect(),s=getComputedStyle(el);
                  return {days:el.dataset.zaviRenewRequest,href:el.getAttribute('href'),
                    text:el.textContent.trim(),width:r.width,height:r.height,
                    bg:s.backgroundColor,ink:s.color};
                }),
                width:root.clientWidth,scroll:root.scrollWidth,
                originalRefresh:!!root.querySelector('#zaviAnnualRefresh'),
                offline:!!root.querySelector('[data-zavi-auto-offline-card]'),
                dates:root.querySelectorAll('.zsh-row').length,
                px:[...links.map(el=>Math.round(el.getBoundingClientRect().left))]
              };
            })()""")
            assert [x['days'] for x in state['links']]==['7','180','365'],state
            assert all(x['href'].startswith('https://wa.me/') and x['height']>=44
                       and x['width']>=85 and x['text'] for x in state['links']),state
            assert len(set(state['px']))==3,state
            assert state['scroll']<=state['width']+6,state
            assert state['originalRefresh'] and state['offline'] and state['dates']>=4,state
    print('PASS 7/180/365 renewal choices separated in original server-backed subscription, 3 themes x 2 mobile widths')
    # Debtors and expenses: preserve original forms and controls while making
    # the empty and populated screens usable on a 360px owner phone.
    for route in ('debtors','expenses'):
        browser.route(route)
        browser.until("""document.getElementById('content')?.classList.contains(
          'z66-compact-'+%s)"""%json.dumps(route),
          'native '+route+' compact styling attached',seconds=12)
        for theme in ('light','dark','glass'):
            browser.eval("window.ZaviThemeV29.set("+json.dumps(theme)+")")
            for width in (360,420):
                browser.command('Emulation.setDeviceMetricsOverride',{
                    'width':width,'height':780,'deviceScaleFactor':1,'mobile':True,
                    'screenWidth':width,'screenHeight':780})
                data=browser.eval("""(()=>{
                  const c=document.getElementById('content');
                  const r=typeof page==='string'?page:'';
                  const hero=c.querySelector(':scope>.debt-hero'),
                    grid=c.querySelector(':scope>.stat-grid');
                  const sourceButtons=r==='debtors'?
                    c.querySelectorAll('[data-action=customer_payment],[data-action=contact]'):
                    c.querySelectorAll('[data-action=expense]');
                  return {route:r,client:c.clientWidth,scroll:c.scrollWidth,
                    heroHeight:hero?.getBoundingClientRect().height||0,
                    metrics:grid?.children.length||0,buttons:sourceButtons.length,
                    hasSearch:!!c.querySelector('#searchInput'),
                    nativeReceipts:r==='debtors'?!!c.querySelector('[data-action=customer_payment]'):true,
                    card:!!c.querySelector('section.card')};
                })()""")
                assert data['route']==route and data['scroll']<=data['client']+6,data
                assert data['card'] and data['buttons']>=1,data
                if route=='debtors':
                    assert data['heroHeight']>35 and data['hasSearch'] and data['nativeReceipts'],data
                else: assert data['metrics']==2,data
    print('PASS original debtor receipts, balances and expense record screens remain accessible across all three themes and phone widths')
    print('PASS user-video compact light/dark/glass settings contrast, 7 original groups, native toggles')
    print('PASS four compact native purchase actions, real supplier/in-transit tabs, 360/420px layout')
    print(json.dumps(report,ensure_ascii=False))
