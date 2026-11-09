/* Pure contract checks; no customer data and NO cloud writes. */
'use strict';
const assert=require('node:assert/strict');
const api=require('../apps/one/zavi-in-transit-v1.js');
const id1='11111111-1111-4111-8111-111111111111',id2='22222222-2222-4222-8222-222222222222',
  id3='33333333-3333-4333-8333-333333333333',id4='44444444-4444-4444-8444-444444444444';
const base={p_order_id:id1,p_workspace_id:id2,p_destination_warehouse_id:id3,p_supplier_name:'Supplier',
  p_country_name:'China',p_currency_code:'cny',p_exchange_rate:'10.25',p_status:'ordered',
  p_freight_original:'2',p_customs_original:'0',p_other_costs_original:'0',
  p_lines:[{id:id4,product_ref:'p-123',product_name:'Genuine product',sku:'ABC',
    ordered_qty:'3.5000',unit_price_original:'12.25'}]};
const x=api.createParams(base);
assert.equal(x.p_currency_code,'CNY');assert.equal(x.p_exchange_rate,'10.25');
assert.equal(x.p_purchase_total_original,'42.87500000');
assert.equal(x.p_lines[0].product_ref,'p-123');
assert.equal(api.decimal('۱.۲۵'),'1.25');
assert.equal(api.decimal('١٫٢٥'),'1.25');
assert.equal(api.units('3.5'),35000n);
assert.throws(()=>api.createParams({...base,p_lines:[]}),/required/);
assert.throws(()=>api.createParams({...base,p_lines:[base.p_lines[0],base.p_lines[0]]}),/repeated/);
assert.throws(()=>api.createParams({...base,p_lines:[{...base.p_lines[0],product_ref:''}]}),/Unmapped/);
assert.throws(()=>api.createParams({...base,p_lines:[{...base.p_lines[0],ordered_qty:'-2'}]}),/decimal/);
assert.throws(()=>api.createParams({...base,p_exchange_rate:'0'}),/positive/);
assert.throws(()=>api.createParams({...base,p_status:'received'}),/status/);
assert.throws(()=>api.createParams({...base,p_currency_code:'USD<script>'}),/currency/);
assert.throws(()=>api.createParams({...base,p_country_name:''}),/origin/);
const receipt={p_receipt_id:id1,p_order_id:id2,p_line_id:id3,p_product_ref:'p-123',p_quantity:'1.5',p_note:''};
assert.deepEqual(api.receiveParams(receipt,'2.0'),{...receipt,p_note:null});
assert.throws(()=>api.receiveParams(receipt,'1.4'),/Over-receipt/);
assert.throws(()=>api.receiveParams({...receipt,p_quantity:'0'},'5'),/positive/);
assert.throws(()=>api.receiveParams({...receipt,p_product_ref:''},'5'),/Unmapped/);
assert.throws(()=>api.receiveParams({...receipt,p_quantity:'1.00001'},'5'),/decimal/);
const markup=api.markup();
assert.match(markup,/data-zv-transit/);
assert.doesNotMatch(markup,/<script/);
console.log('PASS 20 in-transit pure checks: precision, owner-only RPC inputs, mapping, overflow, and UI mount');
