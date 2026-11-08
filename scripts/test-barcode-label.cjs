'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('apps/one/zavi-barcode-label-v6700.js','utf8');
const tbl=src.match(/const C128=\[([^\]]+)\]/);
assert(tbl,'Code128 table must be present');
const patterns=[...tbl[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
assert.equal(patterns.length,107,'Code128 has 107 standard patterns');
assert.equal(patterns[81],'AbAaDb','Code128 pattern 81 must match reference');
const fakeWindow={};
const ctx={
  window:fakeWindow,
  document:{getElementById:()=>null,addEventListener:()=>{},querySelector:()=>null},
  MutationObserver:class{observe(){}},
  setTimeout:()=>{},
  console
};
vm.runInNewContext(src,ctx);
const enc=fakeWindow.ZaviBarcodeLabelsV6700;
assert(enc,'Barcode API must be exposed');
assert.equal(enc.eanBits('4006381333931').length,95);
assert.equal(enc.eanBits('400638133393'),enc.eanBits('4006381333931'));
assert.equal(enc.eanBits('4006381333932'),null,'Invalid check digit must not print');
assert.equal(enc.eanBits('abcdef'),null);
assert.equal(enc.code128Bits('ABC').startsWith('11010010000'),true,'Code128 B must have Start-B');
assert.equal(enc.code128Bits('1234').length>50,true);
assert.equal(enc.code128Bits('bad-é'),null,'Reject invalid Code128-B characters');
assert.equal(enc.code128Bits(''),null);
console.log('PASS: Barcode Code128-B and EAN-13 encoding contracts');
