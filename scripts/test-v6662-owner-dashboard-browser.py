#!/usr/bin/env python3
"""Owner-approved V66.62 dashboard test; original ledgers stay untouched.
This runs against live DOM and a disposable browser profile, never writes real transactions.
"""
from chrome_cdp import Session,ROOT
from pathlib import Path
import json

out=ROOT/'qa-v6662-dashboard'
out.mkdir(exist_ok=True)

with Session() as browser:
    browser.unlock_one()
    browser.route('dashboard')
    browser.until("""!!document.querySelector('#content.z66d-root .z66d-chart-grid') &&
       document.querySelectorAll('#content .z66d-action').length===8""",
       'approved compact dashboard and quick actions are mounted')
    stylesheet=browser.eval("""(()=>{
      const e=document.querySelector('#z66OwnerDashboardCss');
      const root=document.querySelector('#content');
      const card=root?.querySelector('.z66d-summary');
      return {link:!!e,url:e?.href,loaded:!!e?.sheet,
        ruleCount:e?.sheet?.cssRules?.length||0,
        rootClass:root?.className,
        cardStyle:card?{background:getComputedStyle(card).backgroundColor,
          display:getComputedStyle(card).display}:null};
    })()""")
    print('DASHBOARD_CSS_DIAGNOSTIC='+json.dumps(stylesheet,ensure_ascii=False),flush=True)
    browser.until("""!!document.getElementById('z66OwnerDashboardCss')?.sheet &&
      document.getElementById('z66OwnerDashboardCss').sheet.cssRules.length>50""",
      'owner dashboard stylesheet loads and includes more than 50 rules')
    basics=browser.eval("""(()=>{
      const root=document.getElementById('content');
      const guide=root.querySelector('#z649DashboardExtras,.z643-workflow,.z642-smart,.z638-business-ribbon,.z639-focus-card');
      const titles=[...root.querySelectorAll(':scope > .z66d-section')].map(x=>x.dataset.z66DashSection);
      const actions=[...root.querySelectorAll('.z66d-action')].map(x=>({
        name:x.dataset.z66DashAction,action:x.dataset.action||'',go:x.dataset.go||''
      }));
      const stat=[...root.querySelectorAll('.z66d-summary .stat')].map(x=>({
        label:x.querySelector('.stat-label')?.textContent,
        value:x.querySelector('.stat-value')?.textContent
      }));
      const amounts=[...root.querySelectorAll('.z66d-money .stat')].map(x=>({
        label:x.querySelector('.stat-label')?.textContent,value:x.querySelector('.stat-value')?.textContent
      }));
      return {title:root.querySelector(':scope > .welcome h2')?.textContent,
        titles,guide:!!guide,actions,stats:stat,accounts:amounts,
        allDocs:!!root.querySelector('.z66d-charts .z6539-donut-card'),
        monthly:!!root.querySelector('.z66d-charts .z47-chart-scroll'),
        rate:!!root.querySelector('#usdRateDashboardForm'),
        inventory:!!root.querySelector('.z66d-stock'),
        recent:!![...root.children].find(e=>e.querySelector?.('.panel-head h3')?.textContent?.includes('آخرین فعالیت‌ها')),
        journaling:!!root.querySelector('.z66d-usd-journal [data-go="journal"]'),
        customer:!!root.querySelector('[data-go="debtors"]'),
        page:typeof page!=='undefined'?page:'',
        transactionLength:typeof db!=='undefined'?db.tx.length:null,
        hasFakeData:root.innerText.includes('چای سیاه زرین ۵۰۰ گرام')};
    })()""")
    assert basics['title']=='حساب‌های تجارت در یک نگاه',basics
    assert not basics['guide'] and not basics['hasFakeData'],basics
    assert set(basics['titles'])>=set(['summary','money','charts','stock']),basics
    assert len(basics['actions'])==8,basics
    assert len(basics['stats'])>=3 and len(basics['accounts'])==2,basics
    assert all(basics[k] for k in ('allDocs','monthly','rate','inventory','recent','journaling','customer')),basics
    before=basics['transactionLength']
    # The real app correctly refuses new sales in an empty shop. Add a
    # disposable in-memory test product (no persistent write, no real sale).
    browser.eval("""(()=>{
      db.products.push({id:'dashboard-qa-only',name:'Dashboard QA ONLY',
        sku:'DASH-QA-ONLY',category:'QA',salePrice:5,purchasePrice:3,
        openingQty:3,reorder:1});
    })()""")
    # Actually touch the native new-sale action: no synthetic invoice is posted.
    browser.eval("""document.querySelector('#content [data-z66-dash-action="sale"]').click()""")
    browser.until("""!!document.querySelector('#dialogForm #orderItems')""",
                  'new-sale quick action opens native invoice form')
    form=browser.eval("""({
       liveSale:!!document.querySelector('#dialogForm[data-zavi-sale-onepage="true"]'),
       open:!!document.querySelector('#dialogForm #zaviBarcodeScan'),
       noTransactionPosted:db.tx.length===%s
    })"""%before)
    assert all(form.values()),form
    browser.eval("if(typeof closeModal==='function')closeModal()")
    # Verify chart and warehouse cards remain, and authorized native routing works.
    browser.eval("""document.querySelector('#content [data-z66-dash-action="warehouse"]').click()""")
    browser.until("""typeof page!=='undefined'&&page==='products'""",
                  'warehouse shortcut opens the original products screen')
    browser.eval("go('dashboard')")
    browser.until("!!document.querySelector('#content .z66d-chart-grid')",
                  'dashboard re-mounts after route round trip')
    bysize=[]
    for width,height in ((320,568),(360,740),(393,852),(430,932),(700,460)):
        browser.command('Emulation.setDeviceMetricsOverride',{
          'width':width,'height':height,'deviceScaleFactor':1,
          'mobile':True,'screenWidth':width,'screenHeight':height
        })
        res=browser.eval("""(()=>{
          const root=document.getElementById('content');
          const viewport=document.documentElement.clientWidth;
          const sel=['.z66d-quick','.z66d-summary','.z66d-money',
            '.z66d-charts','.z66d-stock','.z66d-usd-journal'];
          const rects=sel.map(x=>{
            const e=root.querySelector(x),r=e?.getBoundingClientRect();
            return {name:x,left:r?.left??0,right:r?.right??0,
                width:r?.width??0,visible:e?getComputedStyle(e).display!=='none':false};
          });
          return {viewport,scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,
                  rects,nav:!!document.querySelector('#mobileBottom')};
        })()""")
        assert res['nav'],res
        assert all(x['visible'] and x['width']>0 for x in res['rects']),res
        assert res['scrollWidth']<=res['clientWidth']+2,res
        assert all(x['left']>=-1 and x['right']<=width+1 for x in res['rects']),res
        bysize.append({'size':[width,height],'width':res['scrollWidth']})
        if width==393:
            (out/'dashboard-393x852.png').write_bytes(browser.screenshot())
    for locale,title in [('fa-AF','فروش جدید'),('ps-AF','نوی پلور'),('en','New sale')]:
        browser.eval('window.ZaviLocaleV22.set(%s)'%json.dumps(locale))
        browser.until("""document.querySelector('#content [data-z66-dash-action="sale"]')
          ?.textContent?.includes(%s)"""%json.dumps(title),
           'dashboard quick-action switches to '+locale)
        assert browser.eval("document.getElementById('content').querySelectorAll('.z66d-action').length") == 8
    browser.eval("window.ZaviLocaleV22.set('fa-AF')")
    for mode in ('light','dark','glass'):
        browser.eval('window.ZaviThemeV29.set(%s)'%json.dumps(mode))
        browser.until("document.documentElement.dataset.zaviTheme===%s"%json.dumps(mode),
                      'dashboard theme updates to '+mode)
        browser.until("""!!document.querySelector('#content.z66d-root .z66d-summary') &&
          document.querySelector('#content .z66d-summary').getBoundingClientRect().height>50""",
          'visible dashboard summary mounted after theme '+mode)
        theme=browser.eval("""(()=>{
            const e=document.querySelector('#content .z66d-summary');
            const sheet=document.getElementById('z66OwnerDashboardCss');
            return {color:getComputedStyle(e).color,
               background:getComputedStyle(e).backgroundColor,
               visible:e.getBoundingClientRect().height>50,
               link:sheet?.href, linkLoaded:!!sheet?.sheet,
               sheetRules:sheet?.sheet?.cssRules?.length??-1,
               sheetDisabled:sheet?.disabled,rootClass:document.getElementById('content').className,
               rootVar:getComputedStyle(document.getElementById('content')).getPropertyValue('--z66d-paper'),
               requests:performance.getEntriesByType('resource').filter(x=>x.name.includes('zavi-owner-dashboard')).map(x=>({name:x.name,transferSize:x.transferSize,decodedBodySize:x.decodedBodySize}))};
        })()""")
        assert theme['visible'] and theme['background'] not in ('rgba(0, 0, 0, 0)','transparent'),theme
    browser.eval("window.ZaviThemeV29.set('dark')")
    # Owner's animation opt-out must win, including decorative shine.
    browser.eval("""document.documentElement.dataset.z637NoMotion='true'""")
    anim=browser.eval("""(()=>{
      const e=document.querySelector('#content .z66d-summary');
      const hero=document.querySelector('#content > .welcome');
      return {section:getComputedStyle(e).animationName,
        shine:getComputedStyle(hero,'::before').animationName};
    })()""")
    assert anim['section']=='none' and anim['shine']=='none',anim
    browser.eval("document.documentElement.removeAttribute('data-z637-no-motion')")
    assert browser.eval('db.tx.length')==before
    print('PASS: dashboard all sections visible, no public trade guide, original financial values and route handlers retained')
    print('PASS: live sale action, warehouse route, 5 phone widths, language/theme parity and animation opt-out')
    (out/'acceptance.json').write_text(json.dumps({'basics':basics,'sizes':bysize},
          ensure_ascii=False,indent=2),encoding='utf-8')
