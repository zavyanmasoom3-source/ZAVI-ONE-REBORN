#!/usr/bin/env python3
"""Phase 2 owner acceptance: real 3 independently persistent size controls.

Disposable Chrome profile only; no production account, sync or financial data.
Probe elements are temporary, in the real #content so computed CSS is tested.
"""
from chrome_cdp import Session
import json

with Session() as browser:
    browser.navigate('one')
    browser.unlock_one()
    browser.route('settings')
    browser.until("""!!document.querySelector('#content #z88-size-settings') &&
      typeof window.ZaviDisplaySettingsV6588?.get==='function'""",
      'live three size controls in the original Settings page')
    basic=browser.eval("""(()=>{
      const panel=document.getElementById('z88-size-settings');
      const keys=[...panel.querySelectorAll('[data-size-key]')].map(x=>x.dataset.sizeKey);
      const rows=[...panel.querySelectorAll('.z87-row')];
      return {keys,rows:rows.length,
        limits:window.ZaviDisplaySettingsV6588.limits,
        legacyVisible:!!document.getElementById('zavi-display-settings-v6545') &&
         getComputedStyle(document.getElementById('zavi-display-settings-v6545')).display!=='none'};
    })()""")
    assert basic['keys']==['text','system','icons'],basic
    assert basic['rows']==3 and basic['limits']==[50,115],basic
    assert not basic['legacyVisible'],basic
    browser.eval("""(()=>{
      const probe=document.createElement('section');
      probe.id='phase2-size-test-probe';
      probe.className='card';
      probe.innerHTML='<p>Text measurement</p><button type="button">'+
        '<svg class="lucide" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>'+
        '</button>';
      document.getElementById('content').append(probe);
    })()""")
    measurements={}
    for key,metric in [('text','textFont'),('system','cardPad'),('icons','iconWidth')]:
        values={}
        for value in (50,115):
            result=browser.eval("""(()=>{
              const key=%s,value=%d;
              window.ZaviDisplaySettingsV6588.set(key,value);
              const probe=document.getElementById('phase2-size-test-probe');
              const root=document.documentElement;
              const read={
                textFont:parseFloat(getComputedStyle(probe.querySelector('p')).fontSize),
                cardPad:parseFloat(getComputedStyle(probe).paddingTop),
                iconWidth:parseFloat(getComputedStyle(probe.querySelector('svg')).width)
              };
              return {metric:read,live:window.ZaviDisplaySettingsV6588.get(key),
                zoom:root.style.zoom||'',
                stored:localStorage.getItem('zavi_one_size_'+key+'_v6588')};
            })()""" %(json.dumps(key),value))
            assert result['live']==value and result['stored']==str(value),result
            assert result['zoom']=='',result
            values[value]=result['metric'][metric]
        assert values[115]>values[50],(key,values)
        measurements[key]=values
        browser.eval("window.ZaviDisplaySettingsV6588.set(%s,100)"%json.dumps(key))
    # Three independent values survive a real page reload.
    browser.eval("""(()=>{
      window.ZaviDisplaySettingsV6588.set('text',105);
      window.ZaviDisplaySettingsV6588.set('system',110);
      window.ZaviDisplaySettingsV6588.set('icons',115);
      document.getElementById('phase2-size-test-probe').remove();
    })()""")
    browser.navigate('one')
    browser.unlock_one()
    browser.route('settings')
    browser.until("!!document.querySelector('#z88-size-settings')",
                  'size controls after complete reload')
    persistence=browser.eval("""(()=>{
      const api=window.ZaviDisplaySettingsV6588;
      return {text:api.get('text'),system:api.get('system'),icons:api.get('icons'),
        zoom:document.documentElement.style.zoom||'',
        sliders:[...document.querySelectorAll('#z88-size-settings .z87-slider')]
          .map(x=>+x.value)};
    })()""")
    assert persistence=={'text':105,'system':110,'icons':115,
                          'zoom':'','sliders':[105,110,115]},persistence
    # Reset isolated data, not real users' settings.
    browser.eval("window.ZaviDisplaySettingsV6588.reset()")
    print('PASS: three independent text/interface/icon sizes; computed CSS; no zoom; persistence')
    print('MEASUREMENTS:',json.dumps(measurements,ensure_ascii=False))
