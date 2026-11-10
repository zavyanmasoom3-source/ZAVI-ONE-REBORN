#!/usr/bin/env python3
"""Unified 12-image tokens and safe DOM helpers on REAL ONE/ADMIN entrypoints.

Disposable browser only. No cloud, finance, customer record or RLS mutations.
A test of tokens/components is not a pixel-perfect page certification.
"""
from pathlib import Path
import json
from chrome_cdp import Session, ROOT

out=ROOT/'qa-unified-reference'
out.mkdir(exist_ok=True)
results=[]
for app in ('one','admin'):
    with Session() as browser:
        browser.navigate(app)
        browser.until("!!window.ZaviThemeV29 && !!window.ZaviDesignSystemV1",
                      'live shared theme/helpers '+app,seconds=20)
        for mode in ('light','dark','glass'):
            state=browser.eval("""(()=>{
              const root=document.documentElement;
              window.ZaviThemeV29.set(%s);
              const x=window.ZaviDesignSystemV1;
              const fixture=document.createElement('section');
              fixture.className='zds-card';
              fixture.id='zdsUnifiedReferenceTest';
              const b=x.uiButton({label:'Test action',onClick:()=>fixture.dataset.clicked='yes',
                                icon:'check'});
              const fld=x.uiField({label:'Test input',name:'testInput',required:true});
              const chip=x.uiStatus({label:'Active',state:'success'});
              const steps=x.uiStepper({steps:['First','Second','Third'],active:1});
              const empty=x.uiEmpty({message:'No real data'});
              const sel=x.uiSelect({label:'Currency',name:'qaCurrency',
                options:[{value:'AFN',label:'Afghani'},{value:'USD',label:'US Dollar'}],
                value:'AFN',onChange:v=>fixture.dataset.currency=v});
              const sw=x.uiSwitch({label:'Motion',checked:false,
                onChange:v=>fixture.dataset.motion=String(v)});
              const tabs=x.uiTabs({tabs:[
                {id:'first',label:'First'},{id:'second',label:'Second'},
                {id:'third',label:'Third'}],active:0,
                onChange:id=>fixture.dataset.tab=id});
              fixture.append(b,fld.root,chip,steps,empty,sel.root,sw.root,tabs.root);
              document.body.append(fixture);
              b.click();
              fld.setError('Required');
              sel.input.value='USD';
              sel.input.dispatchEvent(new Event('change',{bubbles:true}));
              sw.input.click();
              tabs.buttons[1].click();
              const tabClicked=fixture.dataset.tab;
              tabs.buttons[1].dispatchEvent(new KeyboardEvent('keydown',
                {key:'ArrowRight',bubbles:true,cancelable:true}));
              const expectedKeyboardTab=document.documentElement.dir==='rtl'
                ? 'first':'third';
              const cs=getComputedStyle(fixture),btn=getComputedStyle(b);
              let noActionRejected=false;
              try{x.uiButton({label:'unsafe fake action'});}catch(_){noActionRejected=true}
              const result={mode:root.dataset.zaviAppearance,
                theme:root.dataset.zaviTheme,
                bg:cs.backgroundColor,fg:cs.color,buttonBg:btn.backgroundColor,
                buttonFg:btn.color, clicked:fixture.dataset.clicked,
                missingActionRejected:noActionRejected,
                fieldError:fld.input.getAttribute('aria-invalid'),
                inlineError:fld.input.nextElementSibling?.getAttribute('role'),
                stepActive:steps.querySelector('[aria-current="step"]')?.textContent,
                iconLocal:!!b.querySelector('svg.zds-svg-icon'),
                buttonHeight:b.getBoundingClientRect().height,
                selectChange:fixture.dataset.currency,
                selectRealOptions:sel.input.options.length,
                switchChange:fixture.dataset.motion,
                tabClick:tabClicked,tabKeyboard:fixture.dataset.tab,
                expectedKeyboardTab,
                tabSelected:tabs.root.querySelector('[aria-selected="true"]')?.dataset.zdsTab};
              fixture.remove();
              return result;
            })()""" % json.dumps(mode))
            assert state['mode']==mode and state['theme']==mode,(app,state)
            assert state['clicked']=='yes' and state['missingActionRejected'],(app,state)
            assert state['fieldError']=='true' and state['inlineError']=='alert',(app,state)
            assert state['stepActive']=='Second' and state['iconLocal'],(app,state)
            # ONE's genuine V66.62 reference has intentional compact 40px
            # controls. Test actual accessibility without silently replacing its
            # approved layout; newer ADMIN/shared screens still require 44px.
            original_one=(app=='one' and (ROOT/'apps/one/v6662-original-design-lock.json').is_file())
            assert state['buttonHeight'] >= (40 if original_one else 44),(app,state)
            assert state['selectChange']=='USD' and state['selectRealOptions']==2,(app,state)
            assert state['switchChange']=='true' and state['tabClick']=='second',(app,state)
            assert state['tabKeyboard']==state['expectedKeyboardTab'],(app,state)
            assert state['tabSelected']==state['expectedKeyboardTab'],(app,state)
            results.append({'app':app,**state})
            print('PASS',app,mode,'shared live theme + action guarded DOM components')
(out/'report.json').write_text(json.dumps({'results':results,'pixel_parity_certified':False,
     'live_server_permission_certified':False},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: 6 live theme transitions and real shared UI component contracts')
