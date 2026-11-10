#!/usr/bin/env python3
"""Real click navigation, NOT mere go(page) calls, in both actual app UIs.

Runs without cloud credentials in disposable Chrome. The ONE local PIN is
newly created for test only. ADMIN uses the app's existing localhost-only
read-only demo. Never signs in as a customer or writes an invoice.
"""
import json
from chrome_cdp import Session

RESULTS=[]
with Session() as browser:
    err=browser.unlock_one()
    if err:raise SystemExit('Disposable local PIN was not confirmed: '+err)
    browser.until("document.querySelectorAll('#mobileBottom .bottom-btn[data-go]').length===5",
                  'ONE actual bottom navigation buttons')
    bottom=browser.eval("""[...document.querySelectorAll('#mobileBottom .bottom-btn[data-go]')]
      .map(el=>el.dataset.go)""")
    assert bottom==['dashboard','sales','products','purchases','more'],bottom
    for mode in ('light','dark','glass'):
        for locale,direction in [('fa-AF','rtl'),('ps-AF','rtl'),('en','ltr')]:
            browser.eval("""(()=>{
              window.ZaviThemeV29.set(%s);
              window.ZaviLocaleV22.set(%s);
            })()"""%(json.dumps(mode),json.dumps(locale)))
            for target in bottom:
                value=browser.eval("""(()=>{
                  const target=%s;
                  const tab=document.querySelector('#mobileBottom .bottom-btn[data-go="'+target+'"]');
                  if(!tab)throw Error('Missing real bottom nav '+target);
                  tab.click();
                  const content=document.getElementById('content');
                  const cs=content?getComputedStyle(content):null;
                  return {
                   requested:target,
                   active:typeof page==='string'?page:'missing',
                   locked:document.documentElement.classList.contains('zawi-locked'),
                   visible:!!content&&cs.visibility!=='hidden'&&
                    cs.display!=='none'&&content.getBoundingClientRect().width>0,
                   length:(content?.innerText||'').trim().length,
                   rootTheme:document.documentElement.dataset.zaviTheme,
                   lang:document.documentElement.lang,
                   dir:document.documentElement.dir,
                   dashboardOnly:target!=='dashboard'&&
                    document.body.classList.contains('zavi-reference-dashboard-active'),
                   navExists:document.querySelectorAll('#mobileBottom [data-go]').length===5
                  };
                })()"""%json.dumps(target))
                assert value['active']==target and value['visible'] and value['length']>15,value
                assert not value['locked'] and not value['dashboardOnly'],value
                assert value['rootTheme']==mode and value['lang']==locale,value
                assert value['dir']==direction and value['navExists'],value
                RESULTS.append({'app':'one','theme':mode,'locale':locale,'route':target})
    print('PASS: ONE 45 real bottom-nav clicks, no dashboard fallback, 3 themes x 3 languages')

    # Switch to the actual ADMIN page. Navigation is tested through DOM click
    # handlers, not by calling render() directly or bypassing the login page.
    browser.navigate('admin')
    browser.until("!!document.getElementById('demoBtn')",
                  'read-only localhost ADMIN demo available')
    browser.eval("document.getElementById('demoBtn').click()")
    browser.until("document.getElementById('appScreen').hidden===false",
                  'ADMIN local demo opened')
    browser.until("""(()=>{
      const splash=document.getElementById('zaviAdminSplash');
      return !splash || splash.classList.contains('is-hidden') ||
        getComputedStyle(splash).visibility==='hidden';
    })()""",'ADMIN splash completed',30)
    routes=['overview','customers','devices','support','payments',
            'finance','activity','health','brand','security','settings']
    for theme in ('light','dark','glass'):
        browser.eval('window.ZaviThemeV29.set(%s)'%json.dumps(theme))
        for target in routes:
            state=browser.eval("""(()=>{
              const target=%s;
              const nav=document.querySelector(
                '#appScreen .nav-item[data-page="'+target+'"]');
              if(!nav)throw Error('ADMIN missing native navigation '+target);
              const advanced=nav.closest('details');
              if(advanced)advanced.open=true;
              nav.click();
              const view=document.getElementById('view');
              const main=document.getElementById('appScreen');
              return {target,selected:document.querySelector(
                 '#appScreen .nav-item.selected[data-page]')?.dataset.page,
                 visible:!main.hidden&&!!view&&getComputedStyle(view).display!=='none',
                 length:(view?.innerText||'').trim().length,
                 rootTheme:document.documentElement.dataset.zaviTheme,
                 fakeMode:window.ZaviAdminAPI?.getMode?.(),
                 available:!!nav};
            })()"""%json.dumps(target))
            assert state['selected']==target,(theme,state)
            assert state['visible'] and state['length']>15,state
            assert state['rootTheme']==theme and state['fakeMode']=='demo',state
            RESULTS.append({'app':'admin','theme':theme,'route':target})
    print('PASS: ADMIN 33 real navigation clicks on existing owner-only screens, 3 themes')
    print('PASS: 78 actual clicks total; no phone, cloud, production payments or permissions touched')
    print(json.dumps({'screens_checked':len(RESULTS),
      'note':'route availability only, not functional/PDF pixel parity'},
      ensure_ascii=False))
