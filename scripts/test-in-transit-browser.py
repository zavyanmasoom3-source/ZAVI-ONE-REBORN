#!/usr/bin/env python3
"""Live Chromium UI exercise; every server reply is synthetic, no real API writes."""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json

out=ROOT/'qa-in-transit'
out.mkdir(exist_ok=True)
with Session() as browser:
    browser.navigate('one')
    assert not browser.unlock_one()
    route=browser.route('purchases')
    assert route['selected'] and route['visible'] and not route['locked'],route
    browser.until("!!document.querySelector('[data-zv-transit]')",'in-transit module mounted')
    assert browser.eval("document.querySelectorAll('[data-zv-open]').length===1"),'purchase heading must expose one transit launcher'
    assert browser.eval("document.querySelector('[data-zv-status]').textContent.includes('مالک')"),'owner-only gate must be visible'
    print('PASS: real Chrome purchase page displays owner-only cloud gate')
    init=browser.eval(r"""(()=>{
      const workspace='22222222-2222-4222-8222-222222222222';
      const warehouse='33333333-3333-4333-8333-333333333333';
      const uid='55555555-5555-4555-8555-555555555555';
      const product={id:'qa-unique-product-transit',name:'QA transit product',sku:'QA-TRANSIT-1',
          openingQty:0,openingCost:0,purchasePrice:0,salePrice:10,reorder:0};
      db.products.push(product);
      window.__zvTransitQA={workspace,warehouse,uid,product,orders:[],lines:[],receipts:[],posted:0};
      const fake=window.__zvTransitQA,original=window.fetch;
      window.zaviCloudRestoreInfo=()=>({role:'owner',workspace});
      window.zaviCloudGetPublicConfig=()=>({url:'https://qa-transit.invalid',key:'sb_publishable_qa_only'});
      window.zaviCloudGetAuthSession=()=>({user:{id:uid},access_token:'mock-not-a-real-token'});
      window.zaviCloudRefreshAuthSession=async()=>({user:{id:uid},access_token:'mock-not-a-real-token'});
      window.zaviCloudCanEdit=()=>true;
      window.fetch=async(input,options={})=>{
        const url=String(input);
        if(!url.startsWith('https://qa-transit.invalid/'))return original(input,options);
        let data;
        if(url.includes('/rest/v1/zavi_warehouses?'))
          data=[{id:warehouse,workspace_id:workspace,name:'QA warehouse',is_active:true}];
        else if(url.includes('/rest/v1/zavi_in_transit_orders?'))data=fake.orders;
        else if(url.includes('/rest/v1/zavi_in_transit_lines?'))data=fake.lines;
        else if(url.includes('/rpc/zavi_v671_create_in_transit')){
          const p=JSON.parse(options.body);
          if(!fake.orders.find(x=>x.id===p.p_order_id)){
            fake.orders.push({id:p.p_order_id,workspace_id:workspace,
              supplier_name:p.p_supplier_name,country_name:p.p_country_name,
              tracking_number:p.p_tracking_number,expected_date:p.p_expected_date,
              status:p.p_status,created_at:'2026-11-09'});
            fake.lines.push(...p.p_lines.map(x=>({...x,workspace_id:workspace,
              order_id:p.p_order_id,received_qty:'0'})));
          }
          data={success:true,order_id:p.p_order_id};
        }else if(url.includes('/rpc/zavi_v671_receive_in_transit')){
          const p=JSON.parse(options.body);
          if(!fake.receipts.find(r=>r.p_receipt_id===p.p_receipt_id)){
            const line=fake.lines.find(l=>l.id===p.p_line_id);
            if(!line)throw Error('Mock line missing');
            if(Number(p.p_quantity)>Number(line.ordered_qty)-Number(line.received_qty))
              throw Error('Mock server blocked over-receipt');
            line.received_qty=String(Number(line.received_qty)+Number(p.p_quantity));
            fake.receipts.push(p);fake.posted+=Number(p.p_quantity);
            const order=fake.orders.find(x=>x.id===p.p_order_id);
            order.status=Number(line.received_qty)===Number(line.ordered_qty)?'received':'partially_received';
          }
          data={success:true,receipt_id:p.p_receipt_id};
        }else throw Error('Unexpected network endpoint: '+url);
        return {ok:true,status:200,json:async()=>data};
      };
      return {productId:product.id,stockBefore:stockState()[product.id]?.qty||0};
    })()""")
    assert init['stockBefore']==0,init
    browser.eval("document.querySelector('[data-zv-refresh]').click()")
    browser.until("!!document.querySelector('[data-zv-create]')",'owner form after mock authenticated fetch')
    fields=browser.eval(r"""(()=>{
       const f=document.querySelector('[data-zv-create]');
       f.elements.supplier.value='Test supplier';
       f.elements.country.value='China';
       f.elements.tracking.value='TRACK-TEST';
       f.elements.eta.value='2026-12-01';
       f.elements.warehouse.value=window.__zvTransitQA.warehouse;
       f.elements.currency.value='CNY';f.elements.rate.value='10';
       f.querySelector('[name=product]').value=window.__zvTransitQA.product.id;
       f.querySelector('[name=qty]').value='3';
       f.querySelector('[name=price]').value='12.25';
       f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
       return {country:f.elements.country.value,product:f.querySelector('[name=product]').value};
    })()""")
    assert fields['country']=='China' and fields['product']==init['productId'],fields
    browser.until("window.__zvTransitQA.orders.length===1",'one mock server order')
    browser.until("!!document.querySelector('[data-zv-receive]')",'partial receipt form')
    browser.eval(r"""(()=>{
       const f=document.querySelector('[data-zv-receive]');
       f.elements.quantity.value='2';
       f.elements.note.value='Physically counted';
       f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    })()""")
    browser.until("window.__zvTransitQA.receipts.length===1",'first mock receipt')
    browser.until("document.querySelector('[data-zv-receive]')?.dataset.remaining==='1.0000'",'remaining qty projection')
    result=browser.eval(r"""(()=>{
       const fake=window.__zvTransitQA,form=document.querySelector('[data-zv-receive]');
       const first=fake.receipts[0],qty=stockState()[fake.product.id]?.qty||0;
       form.elements.quantity.value='1.25';
       form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
       return {countOrders:fake.orders.length,receiptCount:fake.receipts.length,posted:fake.posted,
         localStock:qty,firstReceiptId:first.p_receipt_id,
         status:document.querySelector('[data-zv-status]').textContent};
    })()""")
    assert result['countOrders']==1 and result['receiptCount']==1,result
    assert result['posted']==2 and result['localStock']==0,result
    browser.until("document.querySelector('[data-zv-status]').textContent.includes('Over-receipt')",
                  'over-receipt blocked by real client handler')
    screenshot=out/'order-partial-receipt.png'
    screenshot.write_bytes(browser.screenshot())
    assert screenshot.stat().st_size>10000
    # Simulate a server that committed receipt 2, but the network dropped its ACK.
    # A retry must carry the SAME idempotency UUID and cannot double-post goods.
    browser.eval(r"""(()=>{
      const original=window.fetch;
      window.__zvTransitQA.dropAcknowledgement=true;
      window.fetch=async(url,opts)=>{
        if(String(url).includes('/rpc/zavi_v671_receive_in_transit')&&window.__zvTransitQA.dropAcknowledgement){
          window.__zvTransitQA.dropAcknowledgement=false;
          await original(url,opts); // synthetic server committed the transaction
          throw Error('QA: network dropped after server commit');
        }
        return original(url,opts);
      };
      const f=document.querySelector('[data-zv-receive]');
      f.elements.quantity.value='1';
      f.elements.note.value='Last unit';
      f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    })()""")
    browser.until("window.__zvTransitQA.receipts.length===2",'mock server second receipt committed')
    browser.until("document.querySelector('[data-zv-status]').textContent.includes('network dropped')",
                  'lost acknowledgement shows uncertainty')
    browser.eval("document.querySelector('[data-zv-refresh]').click()")
    browser.until("!!document.querySelector('[data-zv-retry]')",'retry same pending operation button')
    before_retry=browser.eval(r"""(()=>{
      const o=window.__zvTransitQA;
      return {posted:o.posted,receipts:o.receipts.length,
        pending:JSON.parse(localStorage.getItem('zavi-in-transit-pending-v1:'+o.uid+':'+o.workspace)||'null')};
    })()""")
    assert before_retry['posted']==3 and before_retry['receipts']==2 and before_retry['pending']
    last_id=before_retry['pending']['params']['p_receipt_id']
    browser.eval("document.querySelector('[data-zv-retry]').click()")
    browser.until("document.querySelector('[data-zv-retry]')===null",'pending operation cleared after same-id retry')
    after_retry=browser.eval(r"""(()=>{
      const o=window.__zvTransitQA;
      return {posted:o.posted,receipts:o.receipts.length,
        status:o.orders[0].status,
        last_id:o.receipts[1].p_receipt_id,
        pending:localStorage.getItem('zavi-in-transit-pending-v1:'+o.uid+':'+o.workspace),
        legacyStock:stockState()[o.product.id]?.qty||0};
    })()""")
    assert after_retry['posted']==3 and after_retry['receipts']==2,after_retry
    assert after_retry['status']=='received',after_retry
    assert after_retry['last_id']==last_id and after_retry['pending'] is None,after_retry
    assert after_retry['legacyStock']==0,after_retry
    final_screenshot=out/'order-received-after-dropped-ack.png'
    final_screenshot.write_bytes(browser.screenshot())
    assert final_screenshot.stat().st_size>10000
    print('PASS: synthetic network drops server ACK; retry reuses original receipt UUID and posts exactly once')
    print('PASS: real Chrome creates mock server order and partially receives 2/3 units')
    print('PASS: client blocks 1.25-unit overreceipt; legacy stock remains 0')
    (out/'result.json').write_text(json.dumps({
        'scope':'Real Chrome app UI; intercepted localhost-only synthetic server response; no customer data or Supabase writes',
        'orders':result['countOrders'],'receipts':after_retry['receipts'],
        'server_mock_posted':after_retry['posted'],'legacy_stock_unchanged':after_retry['legacyStock']==0,
        'dropped_ack_same_receipt_id_retried':True,'double_post_prevented_in_mock':True,
        'server_rpc_execution_verified':False,'physical_device_verified':False
    },indent=2)+'\n')
