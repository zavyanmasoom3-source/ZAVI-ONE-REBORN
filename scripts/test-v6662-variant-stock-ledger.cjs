#!/usr/bin/env node
/* No network, DB writes, or production fixtures: test the real offline colour journal. */
'use strict';
const assert=require('node:assert/strict');
const V=require('../apps/one/zavi-variant-inventory-v6662.js');
const product={id:'p1',openingQty:18,industryDetails:{type:'accessories',values:{
 colorVariants:JSON.stringify([{color:'سیاه',qty:10,barcode:'BLACK-01'},{color:'سفید',qty:8,barcode:'WHITE-01'}])
}}};
const history=[{id:'old1',type:'sale',items:[{productId:'p1',qty:2}]}];
const first=V.rows(product);
assert.deepEqual(first.map(x=>x.qty),[10,8]);
V.begin(product,first,18,history);
assert(V.tracked(product));
assert.deepEqual(V.verify(product,history,18).map(x=>x.qty),[10,8]);
history.push({id:'sale1',type:'sale',items:[{productId:'p1',variantKey:V.key('سیاه'),qty:3}]});
assert.deepEqual(V.verify(product,history,15).map(x=>x.qty),[7,8]);
history.push({id:'buy1',type:'purchase',items:[{productId:'p1',variantKey:V.key('سفید'),qty:4}]});
history.push({id:'return1',type:'sale_return',items:[{productId:'p1',variantKey:V.key('سیاه'),qty:1}]});
assert.deepEqual(V.verify(product,history,20).map(x=>x.qty),[8,12]);
let want=[{key:V.key('سیاه'),color:'سیاه',barcode:'BLACK-01',qty:6},{key:V.key('سفید'),color:'سفید',barcode:'WHITE-01',qty:12}];
const change=V.changes(product,history,20,want);
assert.deepEqual(change,[{variantKey:V.key('سیاه'),delta:-2}]);
history.push({id:'adj1',type:'stock_adjust',productId:'p1',variantKey:change[0].variantKey,delta:-2});
assert.deepEqual(V.verify(product,history,18).map(x=>x.qty),[6,12]);
history.push({id:'sale2',type:'sale',items:[{productId:'p1',variantKey:V.key('سیاه'),qty:7}]});
assert.throws(()=>V.verify(product,history,11),/منفی|پیش از موجودی کافی/);
history.at(-1).voided=true;
assert.deepEqual(V.verify(product,history,18).map(x=>x.qty),[6,12]);
history.push({id:'unassigned1',type:'purchase',items:[{productId:'p1',qty:1}]});
assert.throws(()=>V.balances(product,history),/بدون تعیین رنگ/);
history.pop();
const expanded=[...want,{key:V.key('آبی'),color:'آبی',barcode:'BLUE-01',qty:0}];
assert.deepEqual(V.changes(product,history,18,expanded),[]);
V.addNewColours(product,expanded);
history.push({id:'adj2',type:'stock_adjust',productId:'p1',variantKey:V.key('آبی'),delta:5});
assert.deepEqual(V.verify(product,history,23).map(x=>x.qty),[6,12,5]);
assert.throws(()=>V.changes(product,history,23,want),/حذف نکنید/);
const changedHistory=history.slice();changedHistory[0]={id:'not-the-original',type:'sale',items:[]};
assert.throws(()=>V.balances(product,changedHistory),/ترتیب اسناد/);
assert.throws(()=>V.verify(product,history,999),/جمع موجودی/);
assert.throws(()=>V.begin(product,first,18,history),/قبلاً فعال/);
assert.throws(()=>V.rows({industryDetails:{values:{colorVariants:'[{"color":"سیاه","qty":3},{"color":"سیاه","qty":4}]'}}}),/تکراری/);

const w1='11111111-1111-4111-8111-111111111111',w2='22222222-2222-4222-8222-222222222222';
const q={id:'p-wh',openingQty:9,industryDetails:{type:'accessories',values:{
 colorVariants:JSON.stringify([{color:'سیاه',qty:6,barcode:'Q-BLK'},{color:'سفید',qty:3,barcode:'Q-WHT'}])
}}};
const whTx=[];
V.begin(q,V.rows(q),9,whTx);
V.allocateWarehouse(q,whTx,w1);
assert.deepEqual(V.warehouseBalances(q,whTx).map(x=>x.qty),[6,3]);
const moved=V.moveWarehouse(q,whTx,{id:'move-001',fromWarehouseId:w1,toWarehouseId:w2,
 variantKey:V.key('سیاه'),qty:'4',date:'2026-11-11'});
assert.equal(moved.type,'warehouse_transfer');
assert.deepEqual(V.warehouseBalances(q,whTx).map(x=>x.qty),[2,3,4]);
assert.deepEqual(V.balances(q,whTx).map(x=>x.qty),[6,3]);
assert.throws(()=>V.moveWarehouse(q,whTx,{id:'move-001',fromWarehouseId:w1,toWarehouseId:w2,variantKey:V.key('سیاه'),qty:'1'}),/تکراری/);
assert.throws(()=>V.moveWarehouse(q,whTx,{id:'move-002',fromWarehouseId:w1,toWarehouseId:w2,variantKey:V.key('سیاه'),qty:'5'}),/کافی نیست/);
assert.equal(whTx.length,1,'rejected transfers never append records');
whTx.push({id:'sale-wh',type:'sale',items:[{productId:q.id,variantKey:V.key('سیاه'),warehouseId:w2,qty:3}]});
assert.deepEqual(V.warehouseBalances(q,whTx).map(x=>x.qty),[2,3,1]);
whTx.push({id:'buy-wh',type:'purchase',items:[{productId:q.id,variantKey:V.key('سفید'),warehouseId:w2,qty:2}]});
assert.deepEqual(V.warehouseBalances(q,whTx).map(x=>x.qty),[2,3,1,2]);
assert.deepEqual(V.balances(q,whTx).map(x=>x.qty),[3,5]);
assert(V.verifyWorkspace({products:[q],tx:whTx}));
const broken={id:'unknown-location',type:'sale',items:[{productId:q.id,variantKey:V.key('سیاه'),qty:1}]};
whTx.push(broken);
assert.throws(()=>V.verifyWorkspace({products:[q],tx:whTx}),/بدون رنگ یا گدام/);
whTx.pop();
assert.throws(()=>V.allocateWarehouse(q,whTx,w2),/قبلاً فعال/);
assert.throws(()=>V.moveWarehouse(q,whTx,{id:'move-003',fromWarehouseId:w2,toWarehouseId:w1,variantKey:'سیاه',qty:'1.0005'}),/سه رقم/);
assert(V.verifyWorkspace({products:[q],tx:whTx}));
console.log('PASS: isolated warehouse bins, colour purchase/sale, exact transfer, no double posting, oversell fail closed');
console.log('PASS: per-colour independent sale, purchase, returns, adjustments, void, migration, ledger tampering and reconciliation');
