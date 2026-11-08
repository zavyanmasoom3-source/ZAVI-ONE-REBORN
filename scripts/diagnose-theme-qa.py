#!/usr/bin/env python3
"""Read-only measurement of applied theme attributes and computed page backgrounds."""
from chrome_cdp import Session
import json
with Session() as browser:
    result={}
    for theme in ('light','dark','glass'):
        browser.navigate('one')
        browser.eval("localStorage.setItem('zavi_ui_appearance_v2',"+repr(theme)+");localStorage.setItem('zavi_theme_preference_v29',"+repr(theme)+")")
        browser.unlock_one()
        browser.route('sales')
        result[theme]=browser.eval("""(()=>{
          const css=selector=>{const element=document.querySelector(selector);if(!element)return null;
            const style=getComputedStyle(element);return {name:element.tagName.toLowerCase(),class:element.className?.toString().slice(0,60),background:style.backgroundColor,image:style.backgroundImage.slice(0,100),color:style.color};};
          return {theme:document.documentElement.dataset.zaviTheme,appearance:document.documentElement.dataset.zaviAppearance,
           localTheme:localStorage.getItem('zavi_theme_preference_v29'),localAppearance:localStorage.getItem('zavi_ui_appearance_v2'),
           body:css('body'),content:css('#content'),card:css('#content .card'),topbar:css('.topbar'),
           bottom:css('.mobile-bottom'),panel:css('#content .zui-phase2-content'),form:css('#content input')};
        })()""")
print(json.dumps(result,ensure_ascii=False,indent=2))
for mode in ('light','dark','glass'):
    row=result[mode]
    assert row['localAppearance']==mode and row['appearance']==mode, f'Appearance selector mismatch: {mode}: {row}'
    assert row['localTheme']==mode, f'Legacy theme persistence mismatch for {mode}'
    assert row['theme']==('dark' if mode=='glass' else mode), f'CSS legacy theme mismatch for {mode}'
assert result['light']['card']['background']=='rgb(255, 255, 255)', 'Light card background must be white'
assert result['dark']['card']['background']!=result['light']['card']['background'], 'Light/Dark cards must differ'
print('PASS: persisted and rendered appearances are consistent across three themes')
