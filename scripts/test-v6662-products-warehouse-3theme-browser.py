#!/usr/bin/env python3
"""Approved V66.62 inventory UI: ACTUAL light/dark/glass × 3 languages.

Disposable Chromium app profile. Never posts ledger, stock or cloud RPC writes.
Checks real products / native warehouse controls / stock tab and real barcode
modal after switching the installed app's theme setting, not CSS snapshots.
"""
import json
from chrome_cdp import Session

LANGUAGES=(('fa-AF','rtl'),('ps-AF','rtl'),('en','ltr'))
THEMES=('light','dark','glass')
WIDTHS=(320,390,430)

with Session() as browser:
    err=browser.unlock_one()
    if err: raise AssertionError(err)
    browser.eval("""(()=>{
      if(!db.products.some(p=>p.id==='three-theme-qa-only')){
        db.products.push({id:'three-theme-qa-only',name:'QA barcode sample',
          sku:'QA66-128',barcodes:['QA66-128'],salePrice:25,
          purchasePrice:12,openingQty:1,reorder:0,category:'QA'});
      }
      return true;
    })()""")
    report=[]
    for theme in THEMES:
        for language,direction in LANGUAGES:
            browser.eval("""(()=>{
              window.ZaviThemeV29.set(%s);
              window.ZaviLocaleV22.set(%s);
              if(typeof go!=='function')throw Error('Native navigation missing');
              go('products');
            })()"""%(json.dumps(theme),json.dumps(language)))
            browser.until("""!!document.querySelector('#content [data-zavi-flow="products"]')
              && !!document.querySelector('#content [data-zavi-flow="products"] .zv-wh-manager')""",
              'real approved products and warehouse panel on '+theme+'/'+language,seconds=16)
            for width in WIDTHS:
                browser.command('Emulation.setDeviceMetricsOverride',{
                  'width':width,'height':844,'deviceScaleFactor':1,'mobile':True,
                  'screenWidth':width,'screenHeight':844})
                browser.eval("""document.querySelectorAll(
                  '#content [data-zavi-flow=products] .zavi-flow-tabs > [role=tab]')[1].click()""")
                browser.until("""(()=>{
                  const selected=document.querySelector(
                    '#content [data-zavi-flow=products] .zavi-flow-tabs [aria-selected=true]');
                  return !!selected && getComputedStyle(selected).backgroundColor!=='rgba(0, 0, 0, 0)';
                })()""","selected inventory tab background fully painted",seconds=5)
                state=browser.eval("""(()=>{
                  const root=document.querySelector('#content [data-zavi-flow=products]');
                  const tabs=[...root.querySelectorAll('.zavi-flow-tabs > [role=tab]')];
                  const style=x=>x?getComputedStyle(x):null;
                  const g=style(document.documentElement);
                  const manager=root.querySelector('.zv-wh-manager');
                  const more=document.querySelector('#content .zavi-products-more-actions');
                  const stock=root.querySelector('.zavi-products-overview');
                  const button=tabs[0];
                  const input=manager?.querySelector('[data-wh-add] input[name=warehouse_name]');
                  const s={
                    theme:document.documentElement.dataset.zaviTheme,
                    appearance:document.documentElement.dataset.zaviAppearance,
                    language:document.documentElement.lang,
                    direction:document.documentElement.dir,
                    tabLabels:tabs.map(t=>t.dataset.zaviFlowLabel),
                    active:root.dataset.activeTab,
                    activeContrast:style(tabs[1])?.color,
                    activeBg:style(tabs[1])?.backgroundColor,
                    tabInk:style(tabs[0])?.color,
                    tabSurface:style(root.querySelector('.zavi-flow-tabs'))?.backgroundColor,
                    warehouseSurface:style(manager)?.backgroundColor,
                    fieldSurface:style(input)?.backgroundColor,
                    fieldInk:style(input)?.color,
                    inkToken:g.getPropertyValue('--zw-ink').trim(),
                    surfaceToken:g.getPropertyValue('--zw-surface').trim(),
                    glassFilter:style(manager)?.backdropFilter,
                    panelVisible:!root.querySelectorAll(':scope > [role=tabpanel]')[1].hidden,
                    addVisible:!!input && !!input.closest('[data-wh-add]') &&
                                !input.closest('[data-wh-add]').hidden,
                    tabs:tabs.length,
                    overview:!!stock,
                    scanner:!!root.querySelector('.zavi-products-scanner-details .z638-warehouse-scanner'),
                    label:!!root.querySelector('.zavi-products-label-panel [data-action=barcode_label]'),
                    client:document.getElementById('content').clientWidth,
                    scroll:document.getElementById('content').scrollWidth
                  };
                  tabs[0].click();
                  return s;
                })()""")
                assert (state['theme'],state['appearance'],state['direction'])==(
                    theme,theme,direction),state
                assert state['tabs']==4 and state['tabLabels']==[
                    'products','warehouses','movements','labels'],state
                assert state['active']=='1' and state['panelVisible'] and state['addVisible'],state
                assert state['overview'] and state['scanner'] and state['label'],state
                assert state['scroll']<=state['client']+3,('HORIZONTAL_OVERFLOW',width,state)
                def components(color):
                    import re
                    return tuple(int(v) for v in re.findall(r'\d+',color)[:3])
                if theme=='light':
                    assert max(components(state['tabInk']))<125,state
                    assert max(components(state['fieldInk']))<125,state
                    assert min(components(state['tabSurface']))>225,state
                    assert min(components(state['fieldSurface']))>205,state
                else:
                    assert min(components(state['tabInk']))>185,state
                    assert min(components(state['fieldInk']))>165,state
                assert state['activeContrast']=='rgb(255, 255, 255)',state
                assert state['activeBg']!='rgba(0, 0, 0, 0)',state
                if theme=='glass':
                    assert 'rgba(' in state['warehouseSurface'],state
                    assert 'blur(' in state['glassFilter'],state
                else:
                    assert state['glassFilter']=='none',state
            # Real native product editor with 21 trades and 4 barcode methods.
            browser.eval("openEntity('product')")
            browser.until("""!!document.querySelector('#dialogForm.z66-product-editor .z66-registration-trade')
              && !!document.querySelector('#dialogForm .z66-reg-methods')""",
              'actual product editor mounted in '+theme+'/'+language,seconds=14)
            modal=browser.eval("""(()=>{
              const f=document.querySelector('#dialogForm.z66-product-editor');
              const select=f.querySelector('.z66-registration-trade select');
              const method=f.querySelector('.z66-reg-method');
              return {
                trades:select?.options.length,
                methods:f.querySelectorAll('.z66-reg-methods .z66-reg-method').length,
                ink:getComputedStyle(method).color,
                bg:getComputedStyle(method).backgroundColor,
                fieldInk:getComputedStyle(select).color,
                fieldBg:getComputedStyle(select).backgroundColor
              };
            })()""")
            assert modal['trades']==21 and modal['methods']==4,modal
            def contrast(fg,bg):
                def lightness(rgb):
                    def linear(c):
                        c=c/255.0
                        return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
                    a=components(rgb)
                    return sum(w*linear(v) for w,v in zip((0.2126,0.7152,0.0722),a))
                a,b=lightness(fg),lightness(bg)
                return (max(a,b)+0.05)/(min(a,b)+0.05)
            # The first real scan method is selected: white ink on blue is
            # correct even in Light mode. Check readable contrast, not hue.
            assert contrast(modal['ink'],modal['bg'])>=4.5,(theme,language,modal)
            if theme=='light':
                assert max(components(modal['fieldInk']))<125,(theme,language,modal)
            else:
                assert min(components(modal['fieldInk']))>165,(theme,language,modal)
            browser.eval("closeModal()")
            # The same working Code128/EAN13 engine: white thermal preview is
            # invariant between themes and separate from the dark/glass editor.
            browser.eval("window.ZaviBarcodeLabelsV6700.open()")
            browser.until("""!!document.querySelector('#dialogForm #z-label-preview .zavi-label-sheet')""",
                          'real barcode preview in '+theme+'/'+language,seconds=12)
            label=browser.eval("""(()=>{
              const f=document.querySelector('#dialogForm');
              const p=f.querySelector('#z-label-preview .zavi-label-sheet');
              const i=f.querySelector('#z-label-code');
              return {
                product:f.querySelector('#z-label-product')?.options.length,
                types:[...f.querySelector('#z-label-type').options].map(o=>o.value),
                code:i.value,
                fieldInk:getComputedStyle(i).color,
                previewBg:getComputedStyle(p).backgroundColor,
                previewInk:getComputedStyle(p).color
              };
            })()""")
            assert label['product']>=1 and label['types']==['code128','ean13'],label
            assert label['previewBg']=='rgb(255, 255, 255)' and label['previewInk']=='rgb(17, 17, 17)',label
            if theme=='light':
                assert max(components(label['fieldInk']))<125,label
            else:
                assert min(components(label['fieldInk']))>165,label
            browser.eval("closeModal()")
            report.append({'theme':theme,'language':language,'widths':WIDTHS,
                           'productEditor':True,'warehouse':True,'label':True})
    print('PASS approved LIVE inventory: 3 themes x 3 languages x 3 phone widths')
    print('PASS native 21-trade product editor, four barcode methods, warehouse form and printable label')
    print(json.dumps(report,ensure_ascii=False))
