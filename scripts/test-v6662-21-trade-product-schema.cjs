#!/usr/bin/env node
/* V66.62 adaptive product industry metadata — no inventory/financial writes. */
'use strict';
const assert=require('node:assert/strict');
const forms=require('../apps/one/zavi-industry-forms-v6529.js');
const all=['general','supermarket','pharmacy','laboratory','gold','mobile','wholesale',
 'distribution','clothing','footwear','bookstore','cosmetics','electronics','furniture',
 'hardware','construction','exchange','contractor','services','company','accessories'];
assert.equal(forms.types.length,21);
for(const id of all){assert(forms.types.includes(id));assert(forms.fields(id).length>=2);}
const gold=Object.fromEntries(forms.fields('gold').map(x=>[x.key,x]));
for(const field of ['jewelryKind','locketType','setPieces','karat','grossGrams','labor','stoneGrams','rate24'])assert(gold[field]);
assert(gold.jewelryKind.options.includes('لاکت طلا'));
assert(gold.jewelryKind.options.includes('سیت (ست) طلا'));
assert.throws(()=>forms.normalize('gold',{jewelryKind:'سیت (ست) طلا'}),/سیت/);
const set=forms.normalize('gold',{jewelryKind:'سیت (ست) طلا',setPieces:'گردنبند، گوشواره',grossGrams:'12.5',karat:'21'});
assert.equal(set.values.grossGrams,'12.5');
assert.equal(set.values.setPieces,'گردنبند، گوشواره');
const original=JSON.stringify([{color:'سیاه',qty:5,barcode:'QA-BLACK-01'},
  {color:'سفید',qty:3,barcode:'QA-WHITE-01'}]);
const cover=forms.normalize('accessories',{brand:'Samsung',model:'A56',colorVariants:original});
assert.equal(cover.type,'accessories');
assert.deepEqual(JSON.parse(cover.values.colorVariants).map(x=>x.qty),[5,3]);
assert.match(forms.render('accessories',cover,{expanded:true}),/z66-color-editor/);
assert.match(forms.display(cover).map(x=>x.join(' ')).join(' '),/سیاه \(5\)/);
assert.throws(()=>forms.normalize('accessories',{colorVariants:'[{"color":"سیاه","qty":5},{"color":"سیاه","qty":2}]'}),/تکراری/);
assert.throws(()=>forms.normalize('accessories',{colorVariants:'[{"color":"سفید","qty":-1}]'}),/نامعتبر/);
assert.throws(()=>forms.normalize('accessories',{colorVariants:'[{"color":"سفید","qty":1,"barcode":"A"},{"color":"سیاه","qty":2,"barcode":"A"}]'}),/تکراری/);
const phone=forms.normalize('mobile',{brand:'Apple',colorVariants:original});
assert.equal(phone.type,'mobile');
assert.throws(()=>forms.normalize('mobile',{imei:'123'}),/۱۵/);
console.log('PASS: all 21 profiles have schema, gold locket & set, validated colour/barcode metadata');
