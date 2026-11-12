#!/usr/bin/env python3
"""Owner-approved V66.62 dashboard test; original ledgers stay untouched.
This runs against live DOM and a disposable browser profile, never writes real transactions.
"""
from chrome_cdp import Session,ROOT
from pathlib import Path
import json

out=ROOT/'qa-v6662-dashboard'
out.mkdir(exist_ok=True)

# A previously green browser suite did not establish that the actual APK
# entrypoint loaded the approved JS or that the offline shell cached it.
# Test both packaging invariants before opening Chrome.
entry=(ROOT/'apps/one/index.html').read_text(encoding='utf-8')
worker=(ROOT/'apps/one/sw.js').read_text(encoding='utf-8')
assert 'src="./zavi-owner-dashboard-v6662.js?' in entry,'APP ENTRYPOINT MISSING approved dashboard script'
assert '"zavi-owner-dashboard-v6662.js"' in worker,'OFFLINE CACHE MISSING dashboard JS'
assert '"zavi-owner-dashboard-v6662.css"' in worker,'OFFLINE CACHE MISSING dashboard CSS'

with Session() as browser:
    browser.unlock_one()
    browser.route('dashboard')
    try:
        browser.until("""!!document.querySelector('#content.z66d-root .z66d-chart-grid') &&
           document.querySelectorAll('#content .z66d-action').length===8""",
           'approved compact dashboard and quick actions are mounted',seconds=14)
    except RuntimeError:
        diagnostic=browser.eval("""(()=>{
          const root=document.getElementById('content');
          return {
           page:typeof page!=='undefined'?page:null,
           classes:root?.className,hero:!!root?.querySelector(':scope > .welcome'),
           originalStats:!!root?.querySelector(':scope > .stat-grid'),
           transformedStats:!!root?.querySelector(':scope > .z66d-summary'),
           childCount:root?.children.length,
           names:[...root?.children||[]].map(x=>x.className||x.tagName).slice(0,24),
           actions:root?.querySelectorAll('.z66d-action').length,
           loaded:[...document.scripts].filter(x=>x.src.includes('owner-dashboard')).map(x=>x.src),
           cssLoaded:!!document.getElementById('z66OwnerDashboardCss')?.sheet,
           err:window.__z66DashboardLastError||'',
           bootErrors:window.__zaviCIBootErrors||[],
           chart:!!root?.querySelector('.z66d-chart-grid')
          };
        })()""")
        print('DASHBOARD_BOOT_DIAGNOSTIC='+json.dumps(diagnostic,ensure_ascii=False),flush=True)
        raise
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
    approved=browser.eval("""(()=>{
      const root=document.querySelector('#content.z66d-root');
      return {
        loaded:[...document.scripts].some(x=>x.src.includes('/zavi-owner-dashboard-v6662.js')),
        primary:[...root.querySelectorAll('.z66d-quick-four [data-z66-dash-action]')]
            .map(x=>x.dataset.z66DashAction),
        rocket:!!root.querySelector('.welcome .z66d-rocket'),
        overview:!!root.querySelector('.z66d-charts .z66d-month-overview'),
        miniBars:root.querySelectorAll('.z66d-mini-bar').length,
        calendarDays:root.querySelectorAll('.z66d-calendar-day').length,
        calendarGrid:getComputedStyle(root.querySelector('.z66d-calendar-grid')).gridTemplateColumns,
        invoiceButton:!!root.querySelector('[data-z66-dash-action="invoices"]'),
        rate:!!root.querySelector('#usdRateDashboardForm')
      };
    })()""")
    assert approved['loaded'] and approved['rocket'] and approved['overview'],approved
    assert approved['primary']==['sale','purchase','warehouse','invoices'],approved
    assert approved['miniBars']==7 and 28<=approved['calendarDays']<=31,approved
    assert approved['invoiceButton'] and approved['rate'],approved
    browser.eval("document.querySelector('[data-z66-dash-action=\"invoices\"]').click()")
    assert browser.eval("document.activeElement?.classList.contains('z66d-invoice-tab')"),'invoice quick action did not open native invoice panel'
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
        # Reproduce reported Redmi screenshot: an empty top viewport and
        # labels تقویم/ماه/سال split vertically by old 3-column mobile layout.
        geometry=browser.eval("""(()=>{
          const root=document.getElementById('content');
          const hero=root.querySelector(':scope > .welcome'),quick=root.querySelector('.z66d-quick');
          const filters=root.querySelector('.z66d-charts .z27-chart-filters');
          const selectors=[...filters?.querySelectorAll('label')||[]].map(el=>{
            const select=el.querySelector('select');
            const labelBox=el.getBoundingClientRect(),selectBox=select?.getBoundingClientRect();
            const text=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
            const range=document.createRange();
            if(text)range.selectNodeContents(text);
            return {width:labelBox.width,height:labelBox.height,
              selectWidth:selectBox?.width||0,selectHeight:selectBox?.height||0,
              text: text?.textContent?.trim()||'',textLines:text?[...range.getClientRects()].length:0,
              selected:select?.selectedOptions[0]?.textContent?.trim()||''};
          });
          const cr=root.getBoundingClientRect(),hr=hero?.getBoundingClientRect(),
            qr=quick?.getBoundingClientRect(),fr=filters?.getBoundingClientRect();
          return {contentTop:cr.top,heroTop:hr?.top,heroHeight:hr?.height,
            heroBg:hero?getComputedStyle(hero).backgroundImage:null,
            heroText:hero?.innerText?.slice(0,110),
            heroStyle:hero?{display:getComputedStyle(hero).display,direction:getComputedStyle(hero).direction,
              flexDirection:getComputedStyle(hero).flexDirection,flexWrap:getComputedStyle(hero).flexWrap,
              alignItems:getComputedStyle(hero).alignItems}:null,
            heroChildren:[...hero?.children||[]].map(x=>{const r=x.getBoundingClientRect();
              const c=getComputedStyle(x);return {tag:x.tagName,cls:String(x.className).slice(0,90),
              top:r.top,left:r.left,height:r.height,width:r.width,display:c.display,position:c.position,
              marginTop:c.marginTop,marginBottom:c.marginBottom,
              text:x.innerText?.slice(0,90)};}).slice(0,12),quickTop:qr?.top,
            topSpace:(hr?.top||0)-cr.top,afterHeroGap:(qr?.top||0)-(hr?.bottom||0),
            filtersWidth:fr?.width,selectors};
        })()""")
        print('MOBILE_DASHBOARD_GEOMETRY='+json.dumps({'size':[width,height],**geometry},
             ensure_ascii=False),flush=True)
        assert geometry['topSpace']<=60 and geometry['heroHeight']<=235 and geometry['afterHeroGap']<=40,(
            'Giant blank dashboard welcome area on real mobile',width,height,geometry)
        if width<=430:
            labels=geometry['selectors']
            assert len(labels)==3 and labels[0]['width']>=geometry['filtersWidth']*.93,(
                'Calendar mode must have a full-width line',width,labels)
            assert all(x['textLines']<=1 and x['selectWidth']>=x['width']*.92 for x in labels),(
                'Month/year/calendar labels wrap or selects are clipped',width,labels)
        assert res['nav'],res
        assert all(x['visible'] and x['width']>0 for x in res['rects']),res
        assert res['scrollWidth']<=res['clientWidth']+2,res
        # A common real-APK regression: two squeezed charts on a narrow phone.
        if width<800:
            chart=browser.eval("""(()=>{
              const grid=document.querySelector('#content .z66d-chart-grid');
              const cards=[...grid.children].filter(x=>x.matches('.card'));
              return {container:grid.getBoundingClientRect().width,
                cards:cards.map(x=>x.getBoundingClientRect().width)};
            })()""")
            assert len(chart['cards'])>=2 and all(
                x>=chart['container']*.89 for x in chart['cards']),(
                 'Dashboard chart squeezed to half-width on mobile',chart,[width,height])
        assert all(x['left']>=-1 and x['right']<=width+1 for x in res['rects']),res
        bysize.append({'size':[width,height],'width':res['scrollWidth']})
        if width==393:
            (out/'dashboard-393x852.png').write_bytes(browser.screenshot())
            # Screenshot at the *selected calendar*, not only the top dashboard.
            browser.eval("""(()=>{
              const filters=document.querySelector('#content .z66d-charts .z27-chart-filters');
              filters?.scrollIntoView({block:'center',behavior:'instant'});
            })()""")
            (out/'dashboard-calendar-filters-393.png').write_bytes(browser.screenshot())
            browser.eval("""(()=>{
              const c=document.querySelector('#content .z66d-sales-calendar');
              c.open=true;c.scrollIntoView({block:'center',behavior:'instant'});
            })()""")
            (out/'dashboard-calendar-open-393.png').write_bytes(browser.screenshot())

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
