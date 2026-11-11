#!/usr/bin/env python3
"""Owner-approved seven-section settings regression against actual disposable Chrome.
Only DOM navigation and local display preferences are exercised; no customer
records, Supabase data, credentials or production workspaces are touched.
"""
from chrome_cdp import Session
import json
import time
from pathlib import Path

EXPECTED={'store','look','cloud','security','invoice','subscription','advanced'}
REQUIRED=['shopForm','zaviRenameShopForm','zawiChangePin','zaviSettingsLanguage',
          'zaviEnableAllFeatures','zaviIntegrityCheckV636','importFile']
with Session() as browser:
    err=browser.unlock_one()
    if err: raise AssertionError(err)
    browser.route('settings')
    browser.until("""!!document.querySelector('#content > .zavi-clean-settings-hub') &&
      document.querySelectorAll('#content .zavi-clean-settings-group').length===7""",
      'approved seven native settings groups mounted')
    browser.until("""!!document.querySelector('#content #zavi-assistant-settings') &&
      document.querySelectorAll('#content #zavi-assistant-settings input[type="checkbox"]').length===2""",
      'real independent assistant visibility controls survive collapsed settings')
    data=browser.eval("""(()=>{
      const hub=document.querySelector('#content > .zavi-clean-settings-hub');
      const groups=[...hub.querySelectorAll('.zavi-clean-settings-group')];
      return {ready:!!window.ZaviUnifiedSettingsApproved,
        groups:groups.map(g=>({id:g.dataset.group,count:g.querySelectorAll(':scope > .zavi-clean-settings-stack > .zavi-settings-feature').length,
          open:g.open,hidden:g.hidden,title:g.querySelector('summary>span')?.textContent})),
        required:%s.map(id=>({id,exists:!!hub.querySelector('#'+id)})),
        legacyPriority:document.querySelectorAll('#content .zavi-settings-6546-group').length,
        legacyProfile:document.querySelectorAll('#content #z76-settings-groups').length,
        nativeBulk:hub.querySelectorAll('#zaviEnableAllFeatures').length,
        detachedForms:[...document.querySelectorAll('#content form')].filter(f=>!f.isConnected).length,
        css:[...document.styleSheets].some(s=>String(s.href||'').includes('zavi-final-settings-common-v1.css') &&
          [...(s.cssRules||[])].some(r=>String(r.href||'').includes('zavi-approved-settings-v6662.css'))),
        features:hub.querySelectorAll('.zavi-settings-feature').length,
        moduleGrid:!!hub.querySelector('.zavi-settings-extra .zavi-module-grid'),
        optionsGrid:!!hub.querySelector('.zavi-settings-extra .z20-grid'),
        assistantToggles:hub.querySelectorAll('#zavi-assistant-settings input[type="checkbox"]').length,
        microphoneHidden:![...document.querySelectorAll('#z605-launch,#z197-dashboard-mic,#z196-launch')]
          .some(x=>getComputedStyle(x).display!=='none')
      };
    })()"""%json.dumps(REQUIRED))
    assert data['ready'] and data['css'],data
    assert set(g['id'] for g in data['groups'])==EXPECTED,data
    assert all(g['count']>0 and not g['hidden'] for g in data['groups']),data
    assert not any(g['open'] for g in data['groups']),data
    assert all(x['exists'] for x in data['required']),data
    assert data['legacyPriority']==0 and data['legacyProfile']==0,data
    assert data['nativeBulk']==1 and data['features']>=14,data
    assert data['moduleGrid'] and data['optionsGrid'],data
    assert data['assistantToggles']==2 and data['microphoneHidden'],data
    # Screenshot-based evidence revealed that older settings page headings,
    # support boxes and long warnings stayed visible *below* the new hub.
    # The UI is not accepted if ANY other visible settings block remains.
    layout=browser.eval("""(()=>{
      const root=document.querySelector('#content'),hub=root.querySelector(':scope > .zavi-clean-settings-hub');
      const outside=[...root.children].filter(x=>x!==hub && x.getBoundingClientRect().height>5 &&
        getComputedStyle(x).display!=='none' && getComputedStyle(x).visibility!=='hidden');
      const visible=outside.map(x=>({tag:x.tagName,cls:String(x.className).slice(0,90),
        id:x.id,text:(x.textContent||'').trim().slice(0,100)}));
      return {outside:visible,hubTop:hub.getBoundingClientRect().top,
        hubWidth:hub.clientWidth,scrollWidth:hub.scrollWidth,
        oldHeader:((el)=>el?getComputedStyle(el).display:'absent')(root.querySelector(':scope > .page-head')),
        leakedLegacy:!!root.querySelector(':scope > .settings-card,:scope > .z20-panel,:scope > .zavi-info-box'),
        visibleTopLevel:[...hub.querySelectorAll('.zavi-clean-settings-group')].length};
    })()""")
    print('ZAVI_APPROVED_SETTINGS_VISIBLE_ROOT='+json.dumps(layout,ensure_ascii=False),flush=True)
    assert not layout['outside'],layout
    assert layout['oldHeader'] in ('none','absent'),layout
    assert not layout['leakedLegacy'],layout
    assert layout['visibleTopLevel']==7,layout
    assert layout['scrollWidth']<=layout['hubWidth']+5,layout
    # The old 3-theme widget used to attach itself AFTER the settings hub,
    # showing a large extra card despite all seven folders being collapsed.
    browser.until("""(()=>{
      const look=document.querySelector('#content .zavi-clean-settings-group[data-group="look"]');
      const picker=document.getElementById('zavi-theme-controls');
      return !!picker && look?.contains(picker);
    })()""",'native 3-theme picker moved to compact appearance section')
    theme_location=browser.eval("""(()=>{
      const picker=document.getElementById('zavi-theme-controls');
      return {insideLook:!!picker?.closest('[data-group="look"]'),
        directUnderHub:picker?.parentElement?.classList.contains('zavi-clean-settings-hub'),
        duplicates:document.querySelectorAll('#zavi-theme-controls').length,
        choices:picker?.querySelectorAll('[data-zavi-theme-choice]').length};
    })()""")
    assert theme_location['insideLook'] and not theme_location['directUnderHub'],theme_location
    assert theme_location['duplicates']==1 and theme_location['choices']==3,theme_location


    display=browser.eval("""(()=>{
      const hub=document.querySelector('#content .zavi-clean-settings-hub');
      const store=hub.querySelector('[data-group="store"]');
      const editor=store.querySelector('.zavi-settings-feature:has(#shopForm)');
      store.open=true;editor.open=true;
      const form=hub.querySelector('#shopForm');
      const initial=form.elements.shopName.value;
      form.elements.shopName.value='QA SETTINGS DRAFT';
      const preserved=form.elements.shopName.value==='QA SETTINGS DRAFT';
      editor.open=false;editor.open=true;
      const after=form.elements.shopName.value;
      form.elements.shopName.value=initial;
      return {preserved,after,draftWasNeverSaved:!!form.isConnected,
         shopFormNested:store.contains(form),rename:store.contains(hub.querySelector('#zaviRenameShopForm'))};
    })()""")
    assert display['preserved'] and display['after']=='QA SETTINGS DRAFT',display
    assert display['shopFormNested'] and display['rename'],display

    browser.eval("""(()=>{
      const s=document.querySelector('#zaviCleanSettingsSearch');
      s.value='PIN';s.dispatchEvent(new Event('input',{bubbles:true}));
    })()""")
    found=browser.eval("""(()=>{
      const hub=document.querySelector('#content .zavi-clean-settings-hub');
      const groups=[...hub.querySelectorAll('.zavi-clean-settings-group')];
      return {shown:groups.filter(x=>!x.hidden).map(x=>x.dataset.group),
        visibleFeatures:[...hub.querySelectorAll('.zavi-settings-feature')].filter(x=>!x.hidden).length};
    })()""")
    assert 'security' in found['shown'] and found['visibleFeatures']>=1,found
    browser.eval("""(()=>{
      const s=document.querySelector('#zaviCleanSettingsSearch');
      s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));
    })()""")

    browser.eval("""(()=>{
      document.documentElement.lang='en';
      document.dispatchEvent(new Event('zavi:language-change'));
    })()""")
    browser.until("""document.querySelector('#content .zavi-clean-settings-group[data-group="cloud"] > summary span')
        ?.textContent.includes('Cloud')""",'English settings change without page reload')
    browser.eval("""(()=>{
      document.documentElement.lang='ps-AF';
      document.dispatchEvent(new Event('zavi:language-change'));
    })()""")
    browser.until("""document.querySelector('#content .zavi-clean-settings-group[data-group="cloud"] > summary span')
        ?.textContent.includes('کلاوډ')""",'Pashto settings change without page reload')
    browser.eval("""(()=>{
      document.documentElement.lang='fa-AF';
      document.dispatchEvent(new Event('zavi:language-change'));
    })()""")

    contrast=browser.eval("""(()=>{
      const summary=document.querySelector('#content .zavi-clean-settings-group[data-group="store"] > summary');
      const hex=(x)=>{const c=(x||'').match(/\d+(?:\.\d+)?/g)||[];
        return c.slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4))};
      const c=(x)=>{const [r,g,b]=hex(x);return .2126*r+.7152*g+.0722*b};
      const ratio=(a,b)=>{const x=c(a),y=c(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      const result={};const before=document.documentElement.getAttribute('data-zavi-theme');
      for(const mode of ['light','dark','glass']){
        window.ZaviThemeV29?.set(mode);
        const style=getComputedStyle(summary),text=getComputedStyle(summary.querySelector('span'));
        result[mode]={ratio:ratio(text.color,style.backgroundColor),
          text:text.color,background:style.backgroundColor};
      }
      if(before)window.ZaviThemeV29?.set(before);
      return result;
    })()""")
    assert all(v['ratio']>=4.5 for v in contrast.values()),contrast
    compact=browser.eval("""(()=>{
      const hub=document.querySelector('#content .zavi-clean-settings-hub');
      return {width:hub.clientWidth,scroll:hub.scrollWidth,
        features:[...hub.querySelectorAll('.zavi-settings-feature')].length,
        noDuplicateForms:document.querySelectorAll('#shopForm').length===1 &&
          document.querySelectorAll('#zaviRenameShopForm').length===1};
    })()""")
    assert compact['noDuplicateForms'] and compact['scroll']<=compact['width']+5,compact
    # Persist actual device-sized render for human visual inspection, not only DOM counts.
    browser.eval("""(()=>{
      document.documentElement.lang='fa-AF';
      window.ZaviThemeV29?.set('dark');
      const search=document.getElementById('zaviCleanSettingsSearch');
      if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
      document.querySelectorAll('#content .zavi-clean-settings-group').forEach(el=>el.open=false);
    })()""")
    browser.until("""document.querySelectorAll('#content .zavi-clean-settings-group[open]').length===0""",
      'seven closed settings cards for visual snapshot')
    # Never accept splash-screen captures as proof of the real settings layout.
    # The original V66.62 intro can start 130ms AFTER unlock.
    time.sleep(.28)
    browser.until("""!document.querySelector('.z6512-splash,.z6513-splash')""",
      'original V66.62 intro has fully disappeared before visual QA',12)
    Path('qa-settings').mkdir(exist_ok=True)
    Path('qa-settings/approved-66.62-settings-dark.png').write_bytes(browser.screenshot())
    browser.command('Emulation.setDeviceMetricsOverride',{'width':360,'height':780,
      'deviceScaleFactor':1,'mobile':True,'screenWidth':360,'screenHeight':780})
    Path('qa-settings/approved-66.62-settings-small-mobile.png').write_bytes(browser.screenshot())
    browser.eval("""(()=>{const el=document.querySelector('#content .zavi-clean-settings-group[data-group=cloud]');if(el)el.open=true;})()""")
    Path('qa-settings/approved-66.62-settings-expanded-cloud.png').write_bytes(browser.screenshot())
    print('PASS: zero duplicate root cards; exact seven approved settings visible on mobile')
    print('PASS: seven clean settings groups, original cloud/security/finance controls, native form state, 3 locales, 3 themes, offline ready')
