#!/usr/bin/env node
/* Offline, no database writes: exercise the real V66.62 colour/warehouse journal. */
'use strict';
const assert=require('node:assert/strict');
const V=require('../apps/one/zavi-variant-inventory-v6662.js');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const p={id:'p-colours',openingQty:15,industryDetails:{type:'accessories',
 values:{colorVariants:JSON.stringify([{color:'سیاه',qty:10,barcode:'BLACK-A'},
 {color:'سفید',qty:5,barcode:'WHITE-A'}])}}};
const tx=[];
V.begin(p,V.rows(p),15,tx);
V.allocateWarehouse(p,tx,A);
let bins=V.warehouseBalances(p,tx);
assert.deepEqual(bins.map(x=>x.qty),[10,5]);
assert.deepEqual(V.verify(p,tx,15).map(x=>x.qty),[10,5]);
assert.equal(V.verifyWorkspace({products:[p],tx}),true);
V.moveWarehouse(p,tx,{id:'move-black-1',fromWarehouseId:A,toWarehouseId:B,
 variantKey:V.key('سیاه'),qty:4,date:'2026-11-11'});
bins=V.warehouseBalances(p,tx);
assert.equal(bins.find(x=>x.variantKey===V.key('سیاه')&&x.warehouseId===A).qty,6);
assert.equal(bins.find(x=>x.variantKey===V.key('سیاه')&&x.warehouseId===B).qty,4);
assert.deepEqual(V.verify(p,tx,15).map(x=>x.qty),[10,5]);
assert.throws(()=>V.moveWarehouse(p,tx,{id:'move-black-1',fromWarehouseId:A,toWarehouseId:B,
 variantKey:V.key('سیاه'),qty:4,date:'2026-11-11'}),/تکراری/);
assert.throws(()=>V.moveWarehouse(p,tx,{id:'move-overdrawn',fromWarehouseId:B,toWarehouseId:C,
 variantKey:V.key('سیاه'),qty:5,date:'2026-11-11'}),/کافی نیست/);
assert.equal(tx.length,1,'failed/retried transfers must never append another transaction');
tx.push({id:'purchase-white',type:'purchase',items:[{productId:p.id,variantKey:V.key('سفید'),warehouseId:B,qty:2}]});
assert.deepEqual(V.verify(p,tx,17).map(x=>x.qty),[10,7]);
assert.equal(V.warehouseBalances(p,tx).find(x=>x.variantKey===V.key('سفید')&&x.warehouseId===B).qty,2);
tx.push({id:'sale-black',type:'sale',items:[{productId:p.id,variantKey:V.key('سیاه'),warehouseId:B,qty:3}]});
assert.equal(V.warehouseBalances(p,tx).find(x=>x.variantKey===V.key('سیاه')&&x.warehouseId===B).qty,1);
assert.equal(V.verifyWorkspace({products:[p],tx}),true);
tx.push({id:'sale-overspend',type:'sale',items:[{productId:p.id,variantKey:V.key('سیاه'),warehouseId:B,qty:2}]});
assert.throws(()=>V.verifyWorkspace({products:[p],tx}),/منفی/);
tx.pop();
tx.push({id:'wrong-location',type:'sale',items:[{productId:p.id,variantKey:V.key('سفید'),qty:1}]});
assert.throws(()=>V.verifyWorkspace({products:[p],tx}),/گدام/);
tx.pop();
tx.push({id:'sale-return-black',type:'sale_return',items:[{productId:p.id,variantKey:V.key('سیاه'),warehouseId:B,qty:2}]});
assert.equal(V.verifyWorkspace({products:[p],tx}),true);
const totalBefore=V.warehouseBalances(p,tx).reduce((n,x)=>n+x.qty,0);
assert.equal(totalBefore,16);
tx.at(-1).voided=true;
assert.equal(V.warehouseBalances(p,tx).reduce((n,x)=>n+x.qty,0),14);
assert.equal(V.verifyWorkspace({products:[p],tx}),true);
const snapshot={products:[p],tx};
const reloaded=JSON.parse(JSON.stringify(snapshot));
assert.deepEqual(V.warehouseBalances(reloaded.products[0],reloaded.tx),
 V.warehouseBalances(p,tx),'offline JSON reload must preserve all balances and moves');
assert.equal(V.verifyWorkspace(reloaded),true);
// A later receipt must never hide a negative stock period in the journal.
const replayProduct={id:'qa-replay',openingQty:2,industryDetails:{type:'accessories',values:{
 colorVariants:JSON.stringify([{color:'سیاه',qty:2,barcode:'REPLAY-BLACK'}])}}};
const replay=[];
V.begin(replayProduct,V.rows(replayProduct),2,replay);
V.allocateWarehouse(replayProduct,replay,A);
replay.push({id:'invalid-sale-before-receipt',type:'sale',
 items:[{productId:'qa-replay',variantKey:V.key('سیاه'),warehouseId:B,qty:1}]});
replay.push({id:'receipt-after-invalid-sale',type:'purchase',
 items:[{productId:'qa-replay',variantKey:V.key('سیاه'),warehouseId:B,qty:1}]});
assert.throws(()=>V.warehouseBalances(replayProduct,replay),/پیش از موجودی کافی/);
assert.throws(()=>V.verifyWorkspace({products:[replayProduct],tx:replay}),/پیش از موجودی کافی/);
const totalReplay=[];
V.begin({...replayProduct,id:'qa-replay-2',variantLedger:undefined},V.rows(replayProduct),2,totalReplay);
console.log('PASS: original 66.62 colour warehouse transfer, sale, purchase, return/void, no overdraw, idempotence, offline replay');
