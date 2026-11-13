#!/usr/bin/env python3
"""Browser regression of the ACTUAL purchase route and foreign purchase action."""
from chrome_cdp import Session,ROOT
from pathlib import Path
out=ROOT/'qa-v6662-purchase-management'
out.mkdir(exist_ok=True)
with Session() as browser:
    err=browser.unlock_one()
    if err: raise AssertionError(err)
    browser.eval("go('purchases')")
    browser.until("!!document.querySelector('#content .z66pm-root[data-z66pm-version=\"real-66.62\"]')",
                  "new purchase management route is ACTUALLY rendered")
    initial=browser.eval("""(()=>{
      const root=document.querySelector('.z66pm-root');
      return {actions:root.querySelectorAll('.z66pm-action').length,
        foreign:!!root.querySelector('[data-z66pm-foreign]'),
        transit:!!root.querySelector('[data-z66pm-view="orders"]'),
        suppliers:!!root.querySelector('[data-z66pm-pane="suppliers"]'),
        invoiceTable:!!root.querySelector('[data-z66pm-pane="invoices"] #searchInput'),
        originalChinaButton:!!root.querySelector('[data-action="china_purchase"]'),
        emptyLedger:db.tx.length===0};
    })()""")
    assert initial['actions']==4 and initial['foreign'] and initial['transit'] and initial['suppliers'],initial
    assert initial['invoiceTable'] and not initial['originalChinaButton'] and initial['emptyLedger'],initial
    browser.eval("document.querySelector('[data-z66pm-view=\"suppliers\"]').click()")
    assert browser.eval("document.querySelector('[data-z66pm-pane=suppliers]').hidden===false")
    browser.eval("document.querySelector('[data-z66pm-view=\"orders\"]').click()")
    assert browser.eval("document.querySelector('[data-z66pm-pane=orders]').hidden===false")
    browser.eval("document.querySelector('[data-z66pm-foreign]').click()")
    browser.until("!!document.querySelector('#dialogForm[data-zavi-purchase-onepage=true] [name=pCountry]')",
                  "foreign action opens native live purchase form")
    foreign=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm').elements;
      return {currency:f.originalCurrency.value,origin:f.purchaseOrigin.value,country:f.pCountry.value,
        customs:!!f.pCustoms,tax:!!f.pTaxOn,accounts:f.accountId.options.length,
        rows:document.querySelectorAll('#dialogForm .order-line').length,
        nativeSubmit:!!document.querySelector('#dialogForm .modal-foot button[type=submit]'),
        before:db.tx.length};
    })()""")
    assert foreign['currency']=='USD' and foreign['origin']=='other' and foreign['country']=='',foreign
    assert foreign['customs'] and foreign['tax'] and foreign['accounts']>=4 and foreign['rows']>=1,foreign
    assert foreign['nativeSubmit'] and foreign['before']==0,foreign
    for width,height in [(320,568),(390,844)]:
      browser.command('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':True})
      assert browser.eval("document.querySelector('#dialogForm').scrollWidth<=document.querySelector('#dialogForm').clientWidth+4")
    (out/'foreign-native-form.png').write_bytes(browser.screenshot())
    browser.eval("closeModal();go('purchases')")
    browser.until("!!document.querySelector('#content .z66pm-root')",'purchase hub after close')
    (out/'purchase-management-home.png').write_bytes(browser.screenshot())
    print('PASS actual purchase hub: 4 visible actions, no China-only shortcut, supplier/in-transit panes')
    print('PASS native foreign invoice opens with blank global country, USD, customs, tax, actual accounts; no writes')
