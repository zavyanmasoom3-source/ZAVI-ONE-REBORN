#!/usr/bin/env python3
"""59-reference-page route-open/browser screenshot evidence, NOT PDF visual parity.

All screenshots are actual unlocked browser UI except the two real lock/login
screens. Reference PDFs are user-provided outside GitHub, so this test CANNOT
prove pixel-level parity or functional correctness of forms and payments.
"""
from pathlib import Path
import json
import time
from chrome_cdp import Session, ROOT

OUT=ROOT/'qa-pdf-routes'
OUT.mkdir(exist_ok=True)

# Mapping is based on docs/PDF_59_PAGE_TRACEABILITY.md, not on assumptions
# that 59 reference pages correspond to 59 different application routes.
ROUTE_GROUPS={
 1:['sales']*11,
 2:['login','login','dashboard','dashboard','money','debtors',
    'products','products','products','products','purchases','purchases'],
 3:['purchases']*12,
 4:['purchases','purchases','purchases','settings','purchases','purchases',
    'sales','sales','sales','sales','sales','money'],
 5:['money','money','money','money','debtors','debtors','debtors',
    'settings','sales','settings','money','money']
}
assert [len(v) for v in ROUTE_GROUPS.values()]==[11,12,12,12,12]
assert sum(len(v) for v in ROUTE_GROUPS.values())==59

def take(browser,pdf,page,route,result):
    file=f'reference-{pdf}-p{page:02d}-{route}.png'
    path=OUT/file
    path.write_bytes(browser.screenshot())
    if path.stat().st_size<10000:
        raise RuntimeError('Empty/invalid browser proof: '+file)
    return {'pdf':pdf,'page':page,'route':route,'file':file,
            'evidence':'actual browser screenshot; route only',
            'pixel_parity_verified':False,
            'business_flow_verified':False,
            'route_state':result}

with Session() as browser:
    browser.navigate('one')
    time.sleep(1.8)
    captures=[]
    # Two login/lock reference pages: screenshot the actual locked UI before
    # generating a throwaway local PIN. No authentication bypass.
    for page in (1,2):
        captures.append(take(browser,2,page,'login',{'shown':'pre-unlock screen'}))
    error=browser.unlock_one()
    if error:raise SystemExit('Disposable PIN setup failed: '+error)
    time.sleep(1.5)
    for pdf,routes in ROUTE_GROUPS.items():
        for page,route in enumerate(routes,1):
            if route=='login':continue
            state=browser.route(route)
            if not (state.get('selected') and state.get('visible') and not state.get('locked')):
                raise SystemExit('Route did not open for PDF '+str(pdf)+' page '+str(page)+': '+repr(state))
            time.sleep(.12)
            captures.append(take(browser,pdf,page,route,state))

assert len(captures)==59
assert len({item['file'] for item in captures})==59
OUT.joinpath('manifest.json').write_text(json.dumps({
 'statement':'59/59 ROUTES OPENED, NOT 59/59 SCREEN/FUNCTION/PDF PARITY',
 'source':'docs/PDF_59_PAGE_TRACEABILITY.md',
 'reference_pdf_embedded_in_CI':False,
 'status':'route-smoke-only',
 'pages':sorted(captures,key=lambda r:(r['pdf'],r['page']))
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PASS: opened 59 mapped browser routes / lock entrypoints, captured 59 real UI screenshots.')
print('NOT VERIFIED: screenshot comparison to PDF, form workflows, printing and physical Android behavior.')
