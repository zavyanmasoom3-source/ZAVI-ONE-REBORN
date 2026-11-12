#!/usr/bin/env python3
"""Approved 66.62 sales manager: native invoice data/search/returns preserved.
No persistent transactions or fabricated invoice output.
"""
from chrome_cdp import Session,ROOT
import json
from pathlib import Path

out=ROOT/'qa-v6662-sales-management'
out.mkdir(exist_ok=True)

with Session() as browser:
    err=browser.unlock_one()
    if err:raise AssertionError(err)
    browser.route('sales')
    browser.until("""document.getElementById('content')?.classList.contains('z66sales-root')""",
      'approved real sales management DOM')
    initial=browser.eval("""(()=>{
      const e=document.getElementById('content');
      const header=e.querySelector(':scope > .page-head');
      const stats=e.querySelector(':scope > .stat-grid');
      const records=e.querySelector(':scope > .z66sales-table');
      const archived=e.querySelector(':scope > .z66sales-stored');
      const manual=e.querySelector(':scope > .z66sales-manual');
      const nav=[...document.querySelectorAll('#mobileBottom .bottom-btn')]
          .map(x=>x.dataset.go);
      return {head:header?.querySelector('h2')?.textContent,
        titles:[...e.children].map(x=>x.className),
        statCount:stats?.querySelectorAll(':scope > .stat').length,
        actualTotal:stats?.querySelector('.stat-value')?.textContent,
        newSale:header?.querySelector('[data-action="sale"]')?.isConnected===true,
        returnSale:header?.querySelector('[data-action="sale_return"]')?.isConnected===true,
        search:!!records?.querySelector('#searchInput'),
        resultList:!!records?.querySelector('.table-bar'),
        archived:!!archived?.querySelector('.panel-head h3'),
        archivedReal:archived?.textContent?.includes('فاکتورهای ذخیره‌شده'),
        manual:!!manual?.querySelector('.panel-head h3'),
        manualReal:manual?.textContent?.includes('فاکتورهای دستی'),
        noWidgetDuplicate:e.querySelectorAll('#searchInput').length===1,
        noClonedActions:e.querySelectorAll('[data-action="sale"]').length===1,
        nav,transactions:db.tx.length,
        archives:(db.invoiceArchive||[]).length,
        manualCount:(db.manualInvoices||[]).length,
        noChartCopies:e.querySelectorAll('canvas.z66sales-chart').length===0};
    })()""")
    assert initial['head']=='مدیریت فروش',initial
    assert initial['statCount']==2 and initial['nav']==[
      'dashboard','sales','products','purchases','more'],initial
    assert all(initial[k] for k in ['newSale','returnSale','search','resultList',
      'archived','archivedReal','manual','manualReal','noWidgetDuplicate',
      'noClonedActions','noChartCopies']),initial
    assert initial['transactions']==0 and initial['archives']==0 and initial['manualCount']==0,initial
    print('PASS: native sales dashboard with two real stats, search, saved/manual invoice lists and five bottom routes')
    # Synthetic product in memory only permits native new-sale modal to open.
    browser.eval("""db.products.push({id:'z66-sales-qa-only',name:'QA SALES ONLY',
      sku:'QA-SALES-ONLY',category:'QA',salePrice:4,purchasePrice:2,
      openingQty:5,reorder:1})""")
    browser.eval("document.querySelector('#content [data-action=\"sale\"]').click()")
    browser.until("""!!document.querySelector('#dialogForm[data-zavi-sale-onepage="true"]')""",
                  'sale manager button opens original approved sale invoice')
    assert browser.eval("db.tx.length")==0
    browser.eval("document.getElementById('cancelModal').click()")
    browser.eval("document.querySelector('#content [data-action=\"sale_return\"]').click()")
    browser.until("""!!document.getElementById('dialogForm')""",
                  'sale return action preserved')
    assert browser.eval("db.tx.length")==0
    browser.eval("document.getElementById('cancelModal').click()")
    # Search still binds to real page= 'sales' event handler; no fake list.
    browser.eval("""(()=>{
       const x=document.getElementById('searchInput');x.value='QA_NO_MATCH';
       x.dispatchEvent(new Event('input',{bubbles:true}));
    })()""")
    browser.until("""!!document.getElementById('searchInput') &&
      document.getElementById('searchInput').value==='QA_NO_MATCH'""",
      'real search value preserved by live native handler')
    browser.eval("go('sales')")
    browser.until("""document.getElementById('content')?.classList.contains('z66sales-root')""",
      'sales dashboard survives rerender')
    browser.until("""!!document.querySelector('#content.z66sales-root > .z66sales-hero')
      && !!document.querySelector('#content.z66sales-root > .z66sales-stats')
      && !!document.querySelector('#content.z66sales-root > .z66sales-table')
      && !!document.querySelector('#content.z66sales-root > .z66sales-stored')
      && !!document.querySelector('#content.z66sales-root > .z66sales-manual')""",
      'owner-approved sales layout class processing completes after native rerender')
    for width,height in ((320,568),(360,740),(393,852),(430,932)):
       browser.command('Emulation.setDeviceMetricsOverride',{
         'width':width,'height':height,'deviceScaleFactor':1,
         'mobile':True,'screenWidth':width,'screenHeight':height})
       geom=browser.eval("""(()=>{
         const root=document.getElementById('content');
         const names=['.z66sales-hero','.z66sales-stats','.z66sales-table',
           '.z66sales-stored','.z66sales-manual'];
         return {viewport:document.documentElement.clientWidth,
           scroll:root.scrollWidth,client:root.clientWidth,
           blocks:names.map(n=>{const x=root.querySelector(n),r=x?.getBoundingClientRect();
             return {name:n,left:r?.left,right:r?.right,w:r?.width};})};
       })()""")
       assert geom['scroll']<=geom['client']+2,geom
       assert all(x['w']>0 and x['left']>=-1 and x['right']<=width+1 for x in geom['blocks']),geom
       if width==393:
          (out/'sales-manager-393x852.png').write_bytes(browser.screenshot())
    for theme in ('dark','light','glass'):
       browser.eval("window.ZaviThemeV29.set(%s)"%json.dumps(theme))
       browser.until("document.documentElement.dataset.zaviTheme===%s"%json.dumps(theme),
                     'sales manager theme '+theme)
       themeValue=browser.eval("""(()=>{
         const x=document.querySelector('.z66sales-stats > .stat');
         return {bg:getComputedStyle(x).backgroundImage,
             visualGradient:getComputedStyle(x,'::before').backgroundImage,
             ink:getComputedStyle(x.querySelector('.stat-label')).color,
             background:getComputedStyle(x).background,
             paper:getComputedStyle(x).getPropertyValue('--z66s-paper'),
             field:getComputedStyle(x).getPropertyValue('--z66s-field'),
             link:document.getElementById('z66SalesCss')?.href,
             cssLoaded:!!document.getElementById('z66SalesCss')?.sheet,
             cssRules:document.getElementById('z66SalesCss')?.sheet?.cssRules.length,
             selectorMatches:!!document.querySelector('#content.z66sales-root .z66sales-stats > .stat'),
             classes:x.className,
             inline:x.getAttribute('style'),
             cssSheets:[...document.styleSheets].filter(z=>!!z.href&&z.href.includes('sales-management')).map(z=>z.href),
             matchedCss:(()=>{
                const found=[];
                for(const sh of document.styleSheets)try{
                   for(const r of sh.cssRules||[]){
                     if(r.selectorText&&r.style&&r.style.cssText.match(/background/i)){
                       try{if(x.matches(r.selectorText))found.push({
                         sel:r.selectorText.slice(0,260),
                         val:r.style.cssText.slice(0,230),
                         href:(sh.href||'inline').slice(-100)
                       })}catch(_){}
                     }
                   }
                }catch(_){}
                return found.slice(-22);
             })()};
       })()""")
       assert ('linear-gradient' in themeValue['bg'] or
                'linear-gradient' in themeValue['visualGradient']),themeValue
    browser.eval("document.documentElement.dataset.z637NoMotion='true'")
    anim=browser.eval("""getComputedStyle(document.querySelector('.z66sales-hero')).animationName""")
    assert anim=='none',anim
    browser.eval("document.documentElement.removeAttribute('data-z637-no-motion')")
    assert browser.eval('db.tx.length')==0
    print('PASS: genuine new-sale/return actions, search preservation, no transaction writes, four mobile sizes')
    print('PASS: three visual themes and reduced-motion animation control')
    (out/'sales-manager.json').write_text(json.dumps(initial,ensure_ascii=False,indent=2),encoding='utf-8')
