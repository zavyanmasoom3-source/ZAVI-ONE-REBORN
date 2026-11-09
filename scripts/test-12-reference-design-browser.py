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

    # Owner sheet 11: ONE appearance must not offer a stale two-mode picker.
    # The native settings actions and the existing preference widget share
    # persisted ZaviThemeV29 state; no test touches real owner data.
    browser.eval("""document.querySelector(
      '#content .zavi-clean-settings-group[data-group="look"]').open=true""")
    browser.until("""document.querySelectorAll(
      '#content .zavi-theme-settings [data-zavi-theme-choice]').length===3""",
      'ONE original settings picker exposes all three owner themes')
    for language,labels in [
        ('fa-AF',['روشن','تاریک','شیشه‌ای']),
        ('ps-AF',['روښانه','تیاره','ښیښه‌یي']),
        ('en',['Light','Dark','Glass'])
    ]:
        localized=browser.eval("""(()=>{
          document.documentElement.lang=%s;
          document.documentElement.dir=%s;
          document.dispatchEvent(new CustomEvent('zavi:language-change',
            {detail:{language:%s}}));
          return [...document.querySelectorAll(
            '#content .zavi-theme-settings [data-zavi-theme-choice]')]
            .map(b=>({mode:b.dataset.zaviThemeChoice,
              text:b.textContent.trim(),height:b.getBoundingClientRect().height}));
        })()""" % (json.dumps(language),
                   json.dumps('ltr' if language=='en' else 'rtl'),
                   json.dumps(language)))
        assert [x['mode'] for x in localized]==['dark','light','glass'] or (
            [x['mode'] for x in localized]==['light','dark','glass']),localized
        assert all(any(label in x['text'] for x in localized) for label in labels),localized
        assert all(x['height']>=44 for x in localized),localized
    browser.eval("""(()=>{
      document.documentElement.lang='fa-AF';
      document.documentElement.dir='rtl';
      document.dispatchEvent(new CustomEvent('zavi:language-change',
        {detail:{language:'fa-AF'}}));
    })()""")
    for theme in ['light','dark','glass']:
        synchronized=browser.eval("""(()=>{
          const theme=%s;
          document.querySelector('#content .zavi-theme-settings '+
            '[data-zavi-theme-choice="'+theme+'"]').click();
          const native=[...document.querySelectorAll(
            '#content .zavi-theme-settings [data-zavi-theme-choice]')]
            .filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.zaviThemeChoice);
          const pref=[...document.querySelectorAll(
            '#zavi-ui-preferences-v2 [data-zui-theme]')]
            .filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.zuiTheme);
          return {runtime:window.ZaviThemeV29.get(),
            appearance:document.documentElement.dataset.zaviAppearance,
            native,pref,stored:localStorage.getItem('zavi_ui_appearance_v2')};
        })()""" %json.dumps(theme))
        assert synchronized['runtime']==theme and synchronized['appearance']==theme,synchronized
        assert synchronized['native']==[theme] and synchronized['pref']==[theme],synchronized
        assert synchronized['stored']==theme,synchronized
    report['one_reference_settings_appearance']={
      'modes':['light','dark','glass'],'locales':['fa-AF','ps-AF','en'],
      'native_and_preferences_synchronized':True}

    # Owner sheet 11: changing interface language must relabel the actual
    # eight collapsible groups without losing the current search/open state
    # or moving/replacing any original Settings form controls.
    original_ids=browser.eval("""[...document.querySelectorAll(
       '#content .zavi-clean-settings-group .zavi-clean-settings-stack > *')]
       .map(el=>el.id||el.className)""")
    browser.eval("""document.querySelector(
      '#content .zavi-clean-settings-group[data-group="security"]').open=true""")
    for language,title,first,look in [
        ('fa-AF','تنظیمات','حساب و پروفایل','ظاهر و زبان'),
        ('ps-AF','تنظیمات','حساب او پېژندپاڼه','بڼه او ژبه'),
        ('en','Settings','Account & profile','Appearance & language')
    ]:
        localized=browser.eval("""(()=>{
          const lang=%s;
          document.documentElement.lang=lang;
          document.documentElement.dir=lang==='en'?'ltr':'rtl';
          document.dispatchEvent(new CustomEvent('zavi:language-change',
            {detail:{language:lang}}));
          const hub=document.querySelector('#content .zavi-clean-settings-hub');
          const groups=[...hub.querySelectorAll('.zavi-clean-settings-group')];
          return {title:hub.querySelector('.zavi-clean-settings-title strong')?.textContent,
            first:groups[0].querySelector('summary span')?.textContent,
            look:groups.find(g=>g.dataset.group==='look')?.querySelector('summary span')?.textContent,
            locale:hub.dataset.locale,
            search:!!hub.querySelector('#zaviCleanSettingsSearch'),
            securityOpen:groups.find(g=>g.dataset.group==='security')?.open,
            controls:[...hub.querySelectorAll('.zavi-clean-settings-stack > *')]
              .map(el=>el.id||el.className)};
        })()""" %json.dumps(language))
        assert localized['title']==title and localized['first']==first,localized
        assert localized['look']==look,localized
        assert localized['securityOpen'] and localized['search'],localized
        assert localized['controls']==original_ids,localized
    browser.eval("""(()=>{
      document.documentElement.lang='fa-AF';
      document.documentElement.dir='rtl';
      document.dispatchEvent(new CustomEvent('zavi:language-change',
        {detail:{language:'fa-AF'}}));
    })()""")
    report['one_settings_8_group_languages']={'locales':['fa-AF','ps-AF','en'],
       'live_controls_preserved':True,'open_state_preserved':True}

    only_one_theme=browser.eval("""(()=>{
      const native=document.querySelector('#content .zavi-theme-settings .zavi-theme-picker');
      const duplicate=document.querySelector('#zavi-ui-preferences-v2 .zui-pref-theme-row');
      const language=document.querySelector('#zavi-ui-preferences-v2 [data-zui-language="en"]');
      return {native:!!native&&getComputedStyle(native).display!=='none',
        duplicateHidden:!!duplicate&&getComputedStyle(duplicate).display==='none',
        languageVisible:!!language&&getComputedStyle(language).display!=='none'};
    })()""")
    assert all(only_one_theme.values()),only_one_theme
    report['one_settings_unique_appearance'] = only_one_theme


    # Click the actual language controls rather than only changing <html>
    # attributes. Locale and direction must persist without restarting.
    for value,visible_title in [
        ('en','Settings'),('ps-AF','تنظیمات'),('fa-AF','تنظیمات')
    ]:
        clicked=browser.eval("""(()=>{
          const value=%s;
          const b=document.querySelector(
            '#zavi-ui-preferences-v2 [data-zui-language="'+value+'"]');
          if(!b)return {buttonFound:false};
          b.click();
          const hub=document.querySelector('#content .zavi-clean-settings-hub');
          return {buttonFound:true,lang:document.documentElement.lang,
             direction:document.documentElement.dir,
             stored:localStorage.getItem('zavi_public_language_v11'),
             title:hub?.querySelector('.zavi-clean-settings-title strong')?.textContent,
             selected:[...document.querySelectorAll(
              '#zavi-ui-preferences-v2 [data-zui-language]')]
              .filter(x=>x.getAttribute('aria-pressed')==='true')
              .map(x=>x.dataset.zuiLanguage)};
        })()""" %json.dumps(value))
        assert clicked['buttonFound'] and clicked['lang']==value,clicked
        assert clicked['direction']==('ltr' if value=='en' else 'rtl'),clicked
        assert clicked['stored']==value and clicked['title']==visible_title,clicked
        assert clicked['selected']==[value],clicked
    # Navigation out and back must not reset the actual selected locale.
    browser.route('dashboard')
    browser.route('settings')
    persisted_locale=browser.eval("""(()=>({
       lang:document.documentElement.lang,
       stored:localStorage.getItem('zavi_public_language_v11'),
       title:document.querySelector('#content .zavi-clean-settings-title strong')?.textContent
    }))()""")
    assert persisted_locale=={'lang':'fa-AF','stored':'fa-AF','title':'تنظیمات'},persisted_locale

    # Full reload uses the real PIN lock, then revisits Settings. No
    # synthetic user data and no bypass of the app PIN.
    browser.unlock_one()
    browser.route('settings')
    after_reload=browser.eval("""(()=>({
      lang:document.documentElement.lang,
      persisted:localStorage.getItem('zavi_public_language_v11'),
      title:document.querySelector('#content .zavi-clean-settings-title strong')?.textContent,
      theme:document.documentElement.dataset.zaviTheme
    }))()""")
    assert after_reload['lang']=='fa-AF' and after_reload['persisted']=='fa-AF',after_reload
    assert after_reload['title']=='تنظیمات',after_reload




    # Owner reference 11: the native subscription view must NOT render dark
    # neon cards when the user has selected light mode. UI-only test: it
    # deliberately never requests a plan, writes a licence or touches RPC.
    browser.route('subscription')
    browser.until("!!document.querySelector('#zaviSubscriptionHub .zsh-card')",
                  'ONE actual subscription cards')
    for theme in ('light','dark','glass'):
        proof=browser.eval("""(()=>{
          window.ZaviThemeV29.set(%s);
          const hub=document.getElementById('zaviSubscriptionHub');
          const card=hub.querySelector('.zsh-card');
          const s=getComputedStyle(card);
          const account=document.querySelector('[data-zavi-auto-offline-card]');
          return {theme:document.documentElement.dataset.zaviTheme,
             card:s.backgroundColor,text:s.color,
             refresh:!!hub.querySelector('#zaviAnnualRefresh'),
             offline:!!account,hiddenTransfer:hub.querySelector('[data-zavi-offline-transfer]')?.hidden,
             dates:hub.querySelectorAll('.zsh-row').length};
        })()""" %json.dumps(theme))
        assert proof['theme']==theme,proof
        assert (proof['card']=='rgb(255, 255, 255)')==(theme=='light'),proof
        assert proof['text']!=proof['card'],proof
        assert proof['refresh'] and proof['offline'] and proof['dates']>=4,proof
        assert proof['hiddenTransfer'] is True,proof
        shot=out/('one-subscription-'+theme+'.png')
        shot.write_bytes(browser.screenshot())
        assert shot.stat().st_size>10000,shot
    for language,direction in [('fa-AF','rtl'),('ps-AF','rtl'),('en','ltr')]:
        status=browser.eval("""(()=>{
          const lang=%s,dir=%s;
          document.documentElement.lang=lang;
          document.documentElement.dir=dir;
          return getComputedStyle(document.getElementById('zaviSubscriptionHub')).direction;
        })()""" % (json.dumps(language),json.dumps(direction)))
        assert status==direction,(language,status)
    # A request link is NOT an activation/renewal operation. Validate
    # the live 7/180/365-day UI in three locales, without opening WhatsApp.
    for language,label in [('fa-AF','درخواست تمدید'),
                           ('ps-AF','د تمدید غوښتنه'),
                           ('en','Request renewal')]:
        requests=browser.eval("""(()=>{
          const l=%s;
          document.documentElement.lang=l;
          document.documentElement.dir=l==='en'?'ltr':'rtl';
          document.dispatchEvent(new CustomEvent('zavi:language-change',
            {detail:{language:l}}));
          go('subscription');
          const hub=document.getElementById('zaviSubscriptionHub');
          return {label:hub.querySelector('.zsh-renewal-note')?.textContent,
            requests:[...hub.querySelectorAll('[data-zavi-renew-request]')].map(el=>({
              duration:+el.dataset.zaviRenewRequest,
              target:el.target,rel:el.rel,
              href:el.href,
              message:new URL(el.href).searchParams.get('text'),
              height:Math.round(el.getBoundingClientRect().height),
              text:el.textContent.trim()
            })),authButton:!!hub.querySelector('#zaviAnnualRefresh')};
        })()""" %json.dumps(language))
        assert [x['duration'] for x in requests['requests']]==[7,180,365],requests
        assert requests['authButton'] and requests['label'],requests

        expected_heading={
          'fa-AF':'عضویت و اعتبار','ps-AF':'ګډون او اعتبار',
          'en':'Subscription & validity'}[language]
        expected_plan={
          'fa-AF':'نوع اشتراک','ps-AF':'د ګډون ډول',
          'en':'Subscription plan'}[language]
        details=browser.eval("""(()=>{
          const hub=document.getElementById('zaviSubscriptionHub');
          return {heading:hub.querySelector('.zsh-hero h2')?.textContent,
            plan:hub.querySelector('.zsh-main .zsh-caption')?.textContent,
            firstDate:hub.querySelector('.zsh-row span')?.textContent,
            direction:getComputedStyle(hub).direction,
            offline:hub.querySelector('[data-zavi-auto-offline-card] h3')?.textContent};
        })()""")
        assert details['heading']==expected_heading and details['plan']==expected_plan,details
        assert details['direction']==('ltr' if language=='en' else 'rtl'),details
        assert details['offline'] and details['firstDate'],details

        for entry in requests['requests']:
            assert entry['target']=='_blank' and 'noopener' in entry['rel'],entry
            assert entry['href'].startswith('https://wa.me/'),entry
            assert str(entry['duration']) in entry['message'],entry
            assert label in entry['text'],(language,entry)
            assert entry['height']>=44,entry
    print('PASS: original subscription 7/180/365-day renewal requests, 3 languages, no local grants')

    report['one_subscription_theme_repair']={
        'themes':['light','dark','glass'],'directions':['rtl','rtl','ltr'],
        'renewal_or_server_changes':False}

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
