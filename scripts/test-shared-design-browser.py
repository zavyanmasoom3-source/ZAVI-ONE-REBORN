#!/usr/bin/env python3
"""Browser-computed design contract: 3 themes × 3 locales × ONE/ADMIN.

Disposable Chrome fixture uses the shipped shared CSS/JS and REAL index.html
origins. Checks computed text/background colors, direction and compact date.
Does not certify unrelated legacy widgets, database or full PDF parity.
"""
from chrome_cdp import Session
import json
import re
from pathlib import Path

LANGS=('fa-AF','ps-AF','en')
THEMES=('light','dark','glass')
ROWS=[]

EXAMINE="""(function(){
 const root=document.documentElement;
 const original={lang:root.lang,dir:root.dir,appearance:root.getAttribute('data-zavi-appearance')};
 const old=document.getElementById('zdsBrowserQaFixture');
 if(old)old.remove();
 const fixture=document.createElement('section');
 fixture.id='zdsBrowserQaFixture';
 fixture.style.cssText='position:relative;display:grid;gap:8px;padding:12px;max-width:360px';
 fixture.innerHTML='<div class="zds-card"><p class="zds-muted">معلومات / Information</p><button class="zds-action">عملیات / Action</button><div class="zds-field"><label for="qaField">نام / Name</label><input id="qaField" placeholder="Name"></div><div class="zds-empty">هیچ موردی نیست</div></div>';
 document.body.appendChild(fixture);
 const themes=['light','dark','glass'],languages=['fa-AF','ps-AF','en'];
 const checks=[];
 function rgba(str){
   const m=str.match(/^rgba?\\(\\s*([\\d.]+)[, ]+([\\d.]+)[, ]+([\\d.]+)(?:[, /]+([\\d.]+))?\\s*\\)$/);
   if(!m)throw Error('Unsupported color '+str);
   return [+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]];
 }
 function bg(el){
   let current=el,c=[255,255,255];
   const layers=[];
   while(current && current.nodeType===1){layers.push(rgba(getComputedStyle(current).backgroundColor));current=current.parentElement;}
   layers.reverse();
   for(const [r,g,b,a] of layers)c=[r*a+c[0]*(1-a),g*a+c[1]*(1-a),b*a+c[2]*(1-a)];
   return c;
 }
 function channel(x){x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}
 function lum(a){return .2126*channel(a[0])+.7152*channel(a[1])+.0722*channel(a[2])}
 function contrast(a,b){let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
 for(const theme of themes){
   root.setAttribute('data-zavi-appearance',theme);
   root.setAttribute('data-zavi-theme',theme);
   for(const lang of languages){
     root.lang=lang;root.dir=lang==='en'?'ltr':'rtl';
     const api=window.ZaviDesignSystemV1;
     if(!api)throw Error('Shared design script failed to load');
     const formatted=api.formatDualDate(new Date('2026-11-05T00:00:00Z'),{language:lang});
     const passed=formatted.includes(' | ') && (lang!=='fa-AF'||formatted.includes('عقرب')) && (lang!=='ps-AF'||formatted.includes('لړم'));
     if(!passed)throw Error('Two-calendar Afghan date failed '+lang+' '+formatted);
     for(const [selector,expectedBg] of [
       ['.zds-card','.zds-card'],['.zds-muted','.zds-card'],
       ['.zds-action','.zds-action'],['.zds-empty','.zds-empty'],
       ['.zds-field input','.zds-field input']]){
       const item=fixture.querySelector(selector);
       const style=getComputedStyle(item),f=rgba(style.color),b=bg(item);
       const ratio=contrast(f,b);
       if(ratio<4.5)throw Error('WCAG contrast '+theme+' '+lang+' '+selector+' '+ratio.toFixed(2)+' computed foreground='+style.color+' raw background='+style.backgroundColor+' composite bg='+JSON.stringify(b)+' root button='+getComputedStyle(root).getPropertyValue('--zds-button')+' appearance='+root.getAttribute('data-zavi-appearance'));
       if(style.direction!==(lang==='en'?'ltr':'rtl') && selector==='.zds-card')
         throw Error('Wrong direction '+theme+' '+lang);
       checks.push({theme,lang,selector,ratio:+ratio.toFixed(2)});
     }
     api.setFieldError(fixture.querySelector('#qaField'),'اطلاعات لازم است');
     const field=fixture.querySelector('#qaField');
     if(field.getAttribute('aria-invalid')!=='true' ||
        !field.nextElementSibling?.classList.contains('zds-field-error'))
       throw Error('Inline field validation missing');
     api.setFieldError(field,'');
     if(field.getAttribute('aria-invalid')!=='false')throw Error('Field error did not reset');
   }
 }
 fixture.remove();
 root.lang=original.lang;root.dir=original.dir;
 if(original.appearance===null)root.removeAttribute('data-zavi-appearance');
 else root.setAttribute('data-zavi-appearance',original.appearance);
 return {checks,dates:languages.map(lang=>[lang,window.ZaviDesignSystemV1.formatDualDate(
   new Date('2026-11-05T00:00:00Z'),{language:lang})])};
})()"""

with Session() as browser:
    for app in ('one','admin'):
        browser.navigate(app)
        # Login/pin screens remain real, but tests touch only a throwaway
        # presentation fixture and no actual customer/financial record.
        # Preserve actionable browser exception messages in CI (not just "Uncaught").
        wrapped='(function(){try{return '+EXAMINE+';}catch(e){return {qaError:String(e),qaStack:String(e.stack)}}})()'
        result=browser.eval(wrapped)
        if 'qaError' in result:
            raise AssertionError(app+' shared design browser check: '+result['qaError']+' '+result.get('qaStack',''))
        ROWS.append({'app':app,'contrasts':result['checks'],'dates':result['dates']})
        print('PASS:',app,'3 themes x 3 languages x 5 computed contrast pairs, Afghan dual dates and inline errors')

out=Path(__file__).resolve().parents[1]/'qa-design-contrast'
out.mkdir(exist_ok=True)
(out/'report.json').write_text(json.dumps({'scope':'shared opt-in components only',
    'full_app_contrast_certified':False,'results':ROWS},ensure_ascii=False,indent=2)+'\n',
    encoding='utf-8')
print('PASS: 135 browser-computed WCAG-AA color pair checks (3 modes × 3 languages × 5 pairs × 2 apps), NOT full application WCAG certification')
