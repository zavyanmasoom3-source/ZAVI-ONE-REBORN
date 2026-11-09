#!/usr/bin/env python3
"""12 owner-image design regression: real app screens in disposable Chromium.

Never logs in to production, writes ledgers, performs subscriptions or calls RPC.
Checks applied CSS on actual DOM and original navigation, not pixel parity.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json
import time

out=ROOT/'qa-12-references'
out.mkdir(exist_ok=True)
report={'reference_count':12,'pixel_parity_verified':False,
        'server_authorization_tested':False,'financial_writes_tested':False,
        'apps':{}}

def check_styles(browser, app, theme):
    result=browser.eval("""(()=>{
      window.ZaviThemeV29.set(%s);
      const root=document.documentElement,cs=getComputedStyle(root);
      const links=[...document.querySelectorAll('link[rel=stylesheet]')]
         .map(e=>e.getAttribute('href')||'');
      return {theme:root.dataset.zaviTheme,
        background:cs.getPropertyValue('--zav-bg').trim(),
        text:cs.getPropertyValue('--zav-ink').trim(),
        tokenLoaded:links.some(x=>x.includes('zavi-reference-v3.css')),
        appLoaded:links.some(x=>x.includes('zavi-reference-%s-v3.css')),
        navLoaded:!!document.querySelector('[data-zavi-reference-app="%s"]')};
    })()""" % (json.dumps(theme),app,app))
    assert result['theme']==theme,(app,result)
    assert result['tokenLoaded'] and result['appLoaded'] and result['navLoaded'],result
    expected={'light':'#f5f7fb','dark':'#0a0e15'}[theme]
    assert result['background']==expected,(app,theme,result)
    return result

with Session() as browser:
    browser.navigate('one')
    browser.unlock_one()
    time.sleep(3)  # Wait for real screen; do not screenshot the splash overlay.
    for theme in ('light','dark'):
        mode=check_styles(browser,'one',theme)
        browser.route('dashboard')
        browser.until("!!document.querySelector('#mobileBottom .bottom-btn')",
                      'ONE original five-tab mobile navigation')
        bottom=browser.eval("""(()=>{
          const nav=document.getElementById('mobileBottom');
          return {destinations:[...nav.querySelectorAll('[data-go]')].map(b=>b.dataset.go),
            hasRealDashboard:!!document.querySelector('#content.zrf-dashboard'),
            label:nav.getAttribute('aria-label')};
        })()""")
        assert bottom['hasRealDashboard'] and len(bottom['destinations'])==5,bottom
        assert set(['dashboard','sales','products','purchases']).issubset(
            bottom['destinations']),bottom
        image=out/f'one-{theme}.png'
        image.write_bytes(browser.screenshot())
        assert image.stat().st_size>10000,image
        report['apps'][f'one-{theme}']={'visual':mode,'navigation':bottom}
    # Obsolete legacy design customizer and repair menu are absent from new UI.
    browser.route('settings')
    obsolete=browser.eval("""(()=>({custom:!!document.querySelector('#z637DesignForm'),
     oldFonts:!!document.querySelector('.z6515-font-card'),
     repairMenu:!!document.querySelector('#sidebarLinks [data-go="repairs"],#sidebarLinks2 [data-go="repairs"]')}))()""")
    assert not any(obsolete.values()),obsolete
    report['one_removed_legacy_presentation']=obsolete
    browser.until("!!document.querySelector('#zaviCleanSettingsSearch')",
                  'ONE eight-section settings hub')
    sections=browser.eval("""(()=>{
      const groups=[...document.querySelectorAll('#content .zavi-clean-settings-group')];
      return {count:groups.length,expanded:groups.filter(g=>g.open).length,
        keys:groups.map(g=>g.dataset.group),
        search:!!document.getElementById('zaviCleanSettingsSearch')};
    })()""")
    assert sections['count']==8 and sections['expanded']==0 and sections['search'],sections
    report['one_12_reference_settings']=sections
    browser.navigate('admin')
    time.sleep(3)  # Wait for ADMIN launch overlay to finish.
    browser.until("!!document.getElementById('demoBtn')",
                  'ADMIN localhost-only demo button')
    browser.eval("document.getElementById('demoBtn').click()")
    browser.until("!document.getElementById('appScreen').hidden",
                  'ADMIN local read-only demo')
    for theme in ('light','dark'):
        mode=check_styles(browser,'admin',theme)
        nav=browser.eval("""(()=>{
          const root=document.querySelector('#appScreen .sidebar .nav');
          const main=[...root.querySelectorAll(':scope > .nav-item[data-page]')]
             .map(b=>b.dataset.page);
          const more=root.querySelector(':scope > .zavi-ref-more');
          return {main,advanced:[...more.querySelectorAll('[data-page]')]
             .map(b=>b.dataset.page),closed:!more.open,
             selected:root.querySelector('.nav-item.selected')?.dataset.page};
        })()""")
        expected=['overview','customers','payments','devices','support',
                  'activity','security','settings']
        assert nav['main']==expected,(theme,nav)
        assert set(nav['advanced'])=={'finance','health','brand'},nav
        assert nav['selected']=='overview' and nav['closed'],nav
        image=out/f'admin-{theme}.png'
        image.write_bytes(browser.screenshot())
        assert image.stat().st_size>10000,image
        report['apps'][f'admin-{theme}']={'visual':mode,'navigation':nav}
    # Core delegated navigation still opens native, functional route:
    browser.eval("""document.querySelector(
       '#appScreen .nav-item[data-page="devices"]').click()""")
    browser.until("document.querySelector('#pageCrumb')?.textContent?.includes('دستگاه')",
                  'ADMIN original devices route')
    report['admin_devices_original_route']=True
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: reference-v3 CSS, original ONE 5 destinations, ADMIN compact owner navigation')
print('NOT PROVED: image pixel-parity, authenticated RLS, financial posting or release quality')
