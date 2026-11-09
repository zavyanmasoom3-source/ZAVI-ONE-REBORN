#!/usr/bin/env python3
"""Actual Chrome evidence for approved V2 theme and existing UX controls.
Only localhost disposable profiles, read-only ADMIN demo, no real auth/DB writes.
The generated visual references are NOT pixel-measurable design source files:
successful tests cannot certify one-to-one reference fidelity.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json
import time

OUT=ROOT/'qa-approved-ui'
OUT.mkdir(exist_ok=True)
report={'status':'two-theme browser smoke, NOT pixel parity or production release',
        'server_auth_tested':False,'financial_rpc_tested':False,
        'reference_pixel_parity_verified':False,'apps':{}}

def theme_proof(browser,app,mode):
    proof=browser.eval("""(()=>{
      window.ZaviThemeV29.set(%s);
      const root=document.documentElement;
      const body=getComputedStyle(document.body);
      const core=getComputedStyle(root);
      const btns=[...document.querySelectorAll('[data-zavi-theme-choice]')]
       .map(e=>e.dataset.zaviThemeChoice);
      const styles=[...document.querySelectorAll('link[rel="stylesheet"]')]
       .filter(l=>l.dataset.zaviApproved)
       .map(l=>l.getAttribute('href'));
      return {theme:root.dataset.zaviTheme,appearance:root.dataset.zaviAppearance,
        color:body.color,background:body.backgroundColor,
        surface:core.getPropertyValue('--zav-surface').trim(),
        brand:core.getPropertyValue('--zav-blue').trim(),
        styles,buttons:btns,
        navScript:!!document.querySelector('[data-zavi-approved-app=%s]')};
    })()""" %(json.dumps(mode),json.dumps(app)))
    assert proof['theme']==mode and proof['appearance']==mode,(app,mode,proof)
    assert proof['surface'] and proof['brand'] and proof['navScript'],proof
    assert len(proof['styles'])==2 and all('approved' in s for s in proof['styles']),proof
    assert 'glass' not in proof['buttons'],proof
    return proof

with Session() as browser:
    assert not browser.unlock_one()
    # Actual launch animation must disappear before any screenshot becomes evidence.
    time.sleep(3)
    browser.route('dashboard')
    for mode in ('light','dark'):
        result=theme_proof(browser,'one',mode)
        browser.until("document.body.classList.contains('zavi-approved-dashboard')",
                      'ONE approved dashboard route marker')
        dash=browser.eval("""(()=>{
          return {route:page,preferences:!!document.getElementById('zavi-ui-preferences-v2'),
            assistant:document.getElementById('z605-launch')
              ?getComputedStyle(document.getElementById('z605-launch')).display:null,
            bottom:[...document.querySelectorAll('#mobileBottom [data-go]')]
              .map(b=>b.dataset.go),head:document.querySelector('#content')?.innerText.slice(0,90)};
        })()""")
        browser.until("!!document.querySelector('#zavApprovedHomeSummary .zav-new-stats')",
                      'read-only real ledger dashboard summary')
        accounting=browser.eval("""(()=>{
          const ledger=summary(),balances=totals();
          const cards=[...document.querySelectorAll('#zavApprovedHomeSummary .zav-new-stat')];
          const actual=cards.map(c=>c.querySelector('strong')?.textContent?.trim());
          const expected=[ledger.sales,ledger.profit,balances.receivable,balances.payable]
            .map(n=>currency(n).trim());
          const chartCount=document.querySelectorAll('#zavApprovedHomeSummary .zav-new-chart svg').length;
          const normalized=x=>String(x).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
             .replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
          return {actual,expected,chartCount,
            sameValues:actual.every((v,i)=>normalized(v)===normalized(expected[i]))};
        })()""")
        assert accounting['sameValues'] and accounting['chartCount']==2,accounting
        report['apps']['one-'+mode+'-ledger-evidence']=accounting
        assert not dash['preferences'],('preferences leaked onto dashboard',dash)
        assert dash['assistant'] in (None,'none'),('assistant covers dashboard',dash)
        assert set(['dashboard','sales','products','purchases']).issubset(dash['bottom']),dash
        details=browser.eval("""(()=>{
          const content=document.getElementById('content');
          const el=[...content.querySelectorAll('h1,h2,h3')].find(e=>
            e.textContent.includes('مدیریت تجارت') || e.textContent.includes('خوش آمدید'));
          const p=el?.closest('.welcome,.zrf-home,.zui-dashboard-page,section');
          const paint=e=>e?({className:e.className,
            background:getComputedStyle(e).background,
            color:getComputedStyle(e).color,
            opacity:getComputedStyle(e).opacity,
            rect:{width:e.getBoundingClientRect().width,
             height:e.getBoundingClientRect().height}}):null;
          return {heading:paint(el),parent:paint(p),main:paint(content),
            firstChildren:[...content.children].slice(0,6).map(e=>e.className)};
        })()""")
        report['apps']['one-'+mode+'-diagnostics']=details
        image=OUT/('one-dashboard-'+mode+'.png')
        image.write_bytes(browser.screenshot())
        assert image.stat().st_size>14000,image
        report['apps']['one-'+mode]={'theme':result,'dashboard':dash,'screenshot':image.name}
        browser.route('sales')
        assert not browser.eval("!!document.getElementById('zavi-ui-preferences-v2')")
        browser.route('dashboard')

    # ONE real settings controls, not a second dashboard widget.
    browser.route('settings')
    browser.until("!!document.querySelector('#zavi-ui-preferences-v2')",
                  'ONE appearance controls on Settings route')
    prefs=browser.eval("""[...document.querySelectorAll('#zavi-ui-preferences-v2 [data-zui-theme]')]
        .map(b=>b.dataset.zuiTheme)""")
    assert prefs==['light','dark'],prefs
    browser.route('dashboard')
    assert not browser.eval("!!document.getElementById('zavi-ui-preferences-v2')")
    # The existing sale dialog is built by the real app, with temporary
    # in-memory stock so there is no financial mutation or cloud write.
    browser.eval("""(()=>{
      db.products.push({id:'qa-only-ui-product',name:'QA-only demo product',
        sku:'QA-2026-UI',barcodes:[],openingQty:4,openingCost:1,salePrice:2,
        category:'QA',reorder:1});
      openOrder('sale');
    })()""")
    browser.until("!!document.querySelector('#dialogForm #zaviBarcodeScan')",
                  'real new-sale form and offline barcode input')
    form=browser.eval("""(()=>{
      const f=document.querySelector('#dialogForm');
      const tabs=[...f.querySelectorAll('.zavi-flow-tab')];
      return {barcode:!!f.querySelector('#zaviBarcodeScan'),
        camera:!!f.querySelector('[data-zavi-camera-open]'),
        orderLines:f.querySelectorAll('#orderItems .order-line').length,
        tabs:tabs.map(x=>x.dataset.zaviFlowLabel),
        submit:!!f.querySelector('button[type="submit"]')};
    })()""")
    assert form['barcode'] and form['camera'] and form['orderLines']==1 and form['submit'],form
    assert form['tabs']==['products','customer','payment'],form
    (OUT/'one-real-sale-form.png').write_bytes(browser.screenshot())
    report['one_sale_form']=form
    print('PASS ONE: approved light/dark dashboard, real sale form, no dashboard preferences or assistant overlay')

with Session() as browser:
    browser.navigate('admin')
    browser.until("!!document.getElementById('demoBtn')",
                  'ADMIN locally available read-only preview')
    browser.eval("document.getElementById('demoBtn').click()")
    browser.until("!document.getElementById('appScreen').hidden",
                  'ADMIN existing local demo navigation')
    browser.until("""(()=>{
      const splash=document.getElementById('zaviAdminSplash');
      return !splash || getComputedStyle(splash).visibility==='hidden';
    })()""",'ADMIN splash no longer covering interactive UI',seconds=20)
    browser.command('Emulation.setDeviceMetricsOverride',
      {'width':1366,'height':900,'deviceScaleFactor':1,'mobile':False,
       'screenWidth':1366,'screenHeight':900})
    for mode in ('light','dark'):
        result=theme_proof(browser,'admin',mode)
        browser.eval("document.querySelector('#appScreen .nav-item[data-page=overview]').click()")
        browser.until("document.querySelector('#view .admin-kpis')!==null",
                      'ADMIN real dashboard cards')
        browser.until("document.body.classList.contains('zavi-approved-dashboard')",
                      'ADMIN approved route marker')
        summary=browser.eval("""(()=>{
          const cards=[...document.querySelectorAll('#view .admin-kpi')];
          return {cards:cards.length,nav:[...document.querySelectorAll('.nav-item[data-page]')]
            .map(x=>x.dataset.page),actualUI:!!document.querySelector('#view .admin-analytics'),
            noSettingsWidget:!document.querySelector('#zavi-ui-preferences-v2')};
        })()""")
        assert summary['cards']>=4 and summary['actualUI'] and summary['noSettingsWidget'],summary
        colors=browser.eval("""(()=>{
          const info=selector=>{const e=document.querySelector(selector),c=e?getComputedStyle(e):null;
            return c?{opacity:c.opacity,background:c.backgroundColor,color:c.color,
              webkitTextFillColor:c.webkitTextFillColor,filter:c.filter,
              visibility:c.visibility}:null;};
          return {kpi:info('.admin-kpi'),kpiStrong:info('.admin-kpi strong'),
            hero:info('.admin-hero'),heroTitle:info('.admin-hero h1'),
            chart:info('.admin-analytics-main')};
        })()""")
        report['apps']['admin-'+mode+'-diagnostics']=colors
        image=OUT/('admin-dashboard-desktop-'+mode+'.png')
        image.write_bytes(browser.screenshot())
        assert image.stat().st_size>14000,image
        report['apps']['admin-'+mode]={'theme':result,'dashboard':summary,'screenshot':image.name}
    browser.eval("document.querySelector('#appScreen .nav-item[data-page=settings]').click()")
    browser.until("!!document.querySelector('#zavi-ui-preferences-v2')",
                  'ADMIN appearance settings loaded')
    options=browser.eval("""[...document.querySelectorAll('#zavi-ui-preferences-v2 [data-zui-theme]')]
        .map(b=>b.dataset.zuiTheme)""")
    assert options==['light','dark'],options
    assert browser.eval("!!document.getElementById('zaviChangePasswordForm')")
    (OUT/'admin-settings-desktop-dark.png').write_bytes(browser.screenshot())
    report['admin_settings']={'options':options,'originalPasswordFormRetained':True}
    print('PASS ADMIN: both themes, actual local read-only dashboard and settings controls')

(OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('NOT CERTIFIED: physical Android, real subscription/auth/RPC, exact pixel fidelity, or final release')
