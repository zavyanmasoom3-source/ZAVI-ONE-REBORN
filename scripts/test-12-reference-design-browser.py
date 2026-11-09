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
    expected={'light':'#F4F7FC','dark':'#0A0F19','glass':'#0C1D35'}[theme]
    assert result['background']==expected,(app,theme,result)
    return result

with Session() as browser:
    browser.navigate('one')
    browser.unlock_one()
    time.sleep(3)  # Wait for real screen; do not screenshot the splash overlay.
    for theme in ('light','dark','glass'):
        mode=check_styles(browser,'one',theme)
        browser.route('dashboard')
        browser.until("!!document.querySelector('#mobileBottom .bottom-btn')",
                      'ONE original five-tab mobile navigation')
        browser.until("document.querySelectorAll('#content.zrf-dashboard .zrf-quick-action').length===4",
                      'ONE four native quick routes in approved home')
        quick=browser.eval("""(()=>{
          return [...document.querySelectorAll('#content.zrf-dashboard .zrf-quick-action')]
            .map(b=>({route:b.dataset.zrfGo,text:b.innerText.trim(),
              hasIcon:!!b.querySelector('svg')}));
        })()""")
        assert [x['route'] for x in quick]==['sales','purchases','contacts','products'],quick
        assert all(x['hasIcon'] and x['text'] for x in quick),quick
        native=browser.eval("""(()=>{
          const home=document.querySelector('#content.zrf-dashboard>.zrf-home');
          const oldQuick=document.querySelector('#content.zrf-dashboard .z63-quick-panel');
          const fixed=[...document.querySelectorAll('body button,body a')]
            .filter(el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();
              return cs.position==='fixed' && r.width>=18 && r.height>=18})
            .slice(0,35).map(el=>({tag:el.tagName,id:el.id,
              classes:String(el.className).slice(0,120),
              title:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,65),
              rect:(()=>{const r=el.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]})()}));
          return {homeChildren:[...home.children].map(el=>({id:el.id,className:el.className})),
            oldQuickExists:!!oldQuick,oldQuickDisplay:oldQuick?getComputedStyle(oldQuick).display:null,fixed};
        })()""")
        assert not native['oldQuickExists'],('retired dashboard quick widget injected',native)
        assert not any('z62-hero' in x['className'] for x in native['homeChildren']),native
        assert not any('z62-hero' in el['className'] or 'z63-quick-panel' in el['className'] for el in native['homeChildren']),native
        assert native['homeChildren'][0]['className'].find('zavi-native-welcome')>=0,native
        assert 'welcome' not in native['homeChildren'][0]['className'].split(),native
        assert not any(x['className'].find('zrf-brandbar')>=0 for x in native['homeChildren']),native
        assistant=browser.eval("""(()=>{
          const btn=document.getElementById('z637AiButton');
          const bot=document.getElementById('z605-launch');
          const value=el=>!el||getComputedStyle(el).display==='none'||el.hidden;
          return {dashboard:document.body.classList.contains('zavi-reference-dashboard-active'),
             aiHidden:value(btn),voiceHidden:value(bot)};
        })()""")
        assert all(assistant.values()),assistant
        report['apps'][f'one-{theme}-assistant-visibility']=assistant
        emptyPlot=browser.eval("""(()=>({
          flat:[...document.querySelectorAll('#zavApprovedHomeSummary .zav-new-chart polyline')]
            .some(el=>el.getAttribute('points')?.split(' ').every(p=>p.endsWith(',48.0'))),
          svgCount:document.querySelectorAll('#zavApprovedHomeSummary .zav-new-chart svg').length
        }))()""")
        assert emptyPlot['svgCount']==2 and not emptyPlot['flat'],emptyPlot
        report['apps'][f'one-{theme}-layout-diagnostic']=native
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
    # Retired floating assistants must never cover forms or the mobile navigation.
    # This is a UI assertion only: accounting commands/permissions are unchanged.
    for route in ('sales','products','purchases'):
        state=browser.route(route)
        assert state['selected'] and state['visible'] and not state['locked'],state
        overlay=browser.eval("""(()=>{
          const ids=['z637AiButton','z605-launch'];
          const active=ids.map(id=>document.getElementById(id))
             .filter(el=>el && getComputedStyle(el).display!=='none' &&
                     !el.hidden && getComputedStyle(el).visibility!=='hidden');
          return {route:document.querySelector('#content [data-module]')?.dataset.module,
                  active:active.map(el=>el.id),
                  navVisible:getComputedStyle(document.getElementById('mobileBottom')).display!=='none'};
        })()""")
        assert not overlay['active'] and overlay['navVisible'], (route, overlay)
        report['apps'][f'one-{route}-floating-buttons']=overlay
        if route=='products':
            scanner=browser.eval("""(()=>{
              const panel=document.querySelector('#content details.z638-warehouse-scanner');
              if(!panel)return {exists:false};
              const closed=!panel.open;
              const input=panel.querySelector('#zaviWarehouseScan');
              const camera=panel.querySelector('[data-zavi-camera-open="zaviWarehouseScan"]');
              panel.querySelector('summary').click();
              return {exists:true,closed,open:panel.open,
                 input:!!input,camera:!!camera,
                 inputVisible:!!input && getComputedStyle(input).display!=='none'};
            })()""")
            assert all(scanner.values()),scanner
            report['apps']['one-products-compact-barcode']=scanner

            header=browser.eval("""(()=>{
              const bar=document.querySelector('.topbar');
              const dual=document.querySelector('#zaviDateBanner .zavi-date-compact');
              return {height:bar?.getBoundingClientRect().height,
                compact:!!dual,separator:!!dual?.textContent?.includes('·'),
                legacyParts:document.querySelectorAll('#zaviDateBanner .zavi-date-part').length,
                visible:!!bar && getComputedStyle(bar).display!=='none'};
            })()""")
            assert header['compact'] and header['separator'] and header['legacyParts']==0,header
            assert header['height']<=55 and header['visible'],header
            report['apps']['one-products-one-line-dual-date']=header


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
    browser.route('sales')
    browser.until("!!document.querySelector('#content .zavi-sales-reference')",
                  'ONE reference sales uses native list')
    sales=browser.eval("""(()=>({
      title:document.querySelector('.zavi-sales-top h1')?.textContent,
      tabs:[...document.querySelectorAll('[data-zavi-sales-view]')].map(x=>x.dataset.zaviSalesView),
      newSale:!!document.querySelector('.zavi-sales-new[data-action="sale"]'),
      search:!!document.getElementById('searchInput'),
      legacyHeader:!!document.querySelector('#content .zui-order-page')
    }))()""")
    assert sales['tabs']==['all','paid','credit'] and sales['newSale'] and sales['search'] and not sales['legacyHeader'],sales
    report['one_reference_sales']=sales
    browser.eval("document.querySelector('[data-zavi-sales-view=credit]').click()")
    browser.until("document.querySelector('[data-zavi-sales-view=credit]')?.getAttribute('aria-pressed')==='true'",
                  'real credit tab works without dashboard redirect')
    browser.navigate('admin')
    time.sleep(3)  # Wait for ADMIN launch overlay to finish.
    browser.until("!!document.getElementById('demoBtn')",
                  'ADMIN localhost-only demo button')
    browser.eval("document.getElementById('demoBtn').click()")
    browser.until("!document.getElementById('appScreen').hidden",
                  'ADMIN local read-only demo')
    browser.until("document.getElementById('zaviAdminSplash')?.classList.contains('is-hidden')",
                  'ADMIN splash hidden before reference screenshots',seconds=30)
    time.sleep(0.4)
    for theme in ('light','dark','glass'):
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
