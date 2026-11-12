#!/usr/bin/env node
/* V66.62 adaptive product industry metadata — no inventory/financial writes. */
'use strict';
const assert=require('node:assert/strict');
const forms=require('../apps/one/zavi-industry-forms-v6529.js');
const all=['general','supermarket','pharmacy','laboratory','gold','mobile','wholesale',
 'distribution','clothing','footwear','bookstore','cosmetics','electronics','furniture',
 'hardware','construction','exchange','contractor','services','company','accessories'];
assert.equal(forms.types.length,21);
const approved=['general','supermarket','gold','pharmacy','wholesale',
 'clothing','bookstore','footwear','cosmetics','electronics','furniture','hardware',
 'exchange','construction','mobile','accessories','food','restaurant',
 'automotive','services','agriculture'];
assert.equal(forms.approvedTypes.length,21);
assert.deepEqual(forms.approvedTypes,approved);
assert.equal(new Set(approved).size,21);
for(const type of ['food','restaurant','automotive','agriculture']){
 assert(forms.fields(type).length>=3,'missing native product schema: '+type);
 assert.notEqual(forms.typeOf(type),'general','cannot alias distinct products: '+type);
 assert(forms.render(type,null,{expanded:true}).includes('data-z629-type="'+type+'"'));
}
assert.equal(forms.label('food'),'مواد غذایی');
assert.equal(forms.label('restaurant'),'رستورانت');
assert.equal(forms.label('automotive'),'لوازم موتر');
assert.equal(forms.label('agriculture'),'زراعت و مالداری');
assert.equal(forms.normalize('food',{batch:'B-001'}).type,'food');
assert.equal(forms.normalize('restaurant',{prepMinutes:'15'}).values.prepMinutes,'15');
assert.equal(forms.normalize('automotive',{partNo:'A-123'}).values.partNo,'A-123');
assert.equal(forms.normalize('agriculture',{cropType:'گندم'}).values.cropType,'گندم');

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
assert.throws(()=>forms.normalize('accessories',{colorVariants:'[{"color":"سفید","qty":-1}]'}),/معتبر نیست/);
assert.throws(()=>forms.normalize('accessories',{colorVariants:'[{"color":"سفید","qty":1,"barcode":"A"},{"color":"سیاه","qty":2,"barcode":"A"}]'}),/تکراری/);
const phone=forms.normalize('mobile',{brand:'Apple',colorVariants:original});
assert.equal(phone.type,'mobile');
assert.throws(()=>forms.normalize('mobile',{imei:'123'}),/۱۵/);
console.log('PASS: all 21 profiles have schema, gold locket & set, validated colour/barcode metadata');
