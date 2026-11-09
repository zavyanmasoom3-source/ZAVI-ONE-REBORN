#!/usr/bin/env node
/* Shared design contract tests: no app profile, secrets, network or financial data. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ds = require('../packages/shared/ui/design-system-v1.js');

assert.equal(ds.normalizeLanguage('fa'), 'fa-AF');
assert.equal(ds.normalizeLanguage('ps-AF'), 'ps-AF');
assert.equal(ds.normalizeLanguage('en-GB'), 'en');
assert.equal(ds.direction('fa-AF'), 'rtl');
assert.equal(ds.direction('ps-AF'), 'rtl');
assert.equal(ds.direction('en'), 'ltr');

const day = new Date('2026-11-05T00:00:00Z');
assert.equal(ds.formatDualDate(day, {language:'fa-AF'}),
  '۱۴ عقرب ۱۴۰۵ | ۵ نوامبر ۲۰۲۶');
assert.equal(ds.formatDualDate(day, {language:'fa-AF',digitStyle:'latn'}),
  '14 عقرب 1405 | 5 نوامبر 2026');
assert.equal(ds.formatDualDate(day, {language:'en'}),
  '14 Aqrab 1405 | 5 November 2026');
const pashto = ds.formatDualDate(day, {language:'ps-AF'});
assert.match(pashto,/لړم/);
assert.match(pashto,/\|/);
assert.doesNotMatch(pashto,/[0-9]/,'Pashto uses one digit style by default');
assert.throws(()=>ds.formatDualDate('invalid'),/Invalid date/);
// The real renderer passes Document, not an ordinary element. Language must
// come from document.documentElement (ownerDocument is null on Document).
const dateNode = {
  textContent:'',
  getAttribute(name) {
    return name==='data-zds-dual-date' ? '2026-11-05' : null;
  }
};
const fakeDoc = {
  nodeType:9,
  documentElement:{lang:'en'},
  querySelectorAll(selector) {
    assert.equal(selector,'[data-zds-dual-date]');
    return [dateNode];
  }
};
assert.equal(ds.refreshDualDateNodes(fakeDoc),1);
assert.equal(dateNode.textContent,'14 Aqrab 1405 | 5 November 2026');
fakeDoc.documentElement.lang='fa-AF';
assert.equal(ds.refreshDualDateNodes(fakeDoc),1);
assert.equal(dateNode.textContent,'۱۴ عقرب ۱۴۰۵ | ۵ نوامبر ۲۰۲۶');

assert.equal(ds.digits('۱۴۰۵ ٢٠٢٦ 123','latn','fa-AF'), '1405 2026 123');
assert.equal(ds.digits('1405 ٢٠٢٦ 123','arabext','fa-AF'),'۱۴۰۵ ۲۰۲۶ ۱۲۳');
assert.equal(ds.formatExchangeRate('75','USD','AFN',{language:'fa-AF'}),
  '۱ USD = ۷۵ AFN');
assert.equal(ds.formatExchangeRate('75','USD','AFN',{language:'en'}),
  '1 USD = 75 AFN');
for (const [rate,a,b] of [[0,'USD','AFN'],[-1,'USD','AFN'],[1,'USD','USD'],['NaN','USD','AFN']]) {
  assert.throws(()=>ds.formatExchangeRate(rate,a,b),RangeError);
}
assert.equal(ds.normalizeAfghanPhone('0798832389'),'+93798832389');
assert.equal(ds.normalizeAfghanPhone('798832389'),'+93798832389');
assert.equal(ds.normalizeAfghanPhone('93798832389'),'+93798832389');
assert.equal(ds.normalizeAfghanPhone('+93 798 832 389'),'+93798832389');
assert.equal(ds.whatsappDigits('۰۷۹۸۸۳۲۳۸۹'),'93798832389');
assert.equal(ds.normalizeAfghanPhone('7777'),null);
assert.equal(ds.normalizeAfghanPhone('++93798832389'),null);
assert.equal(ds.passwordVisibilityLabel('fa-AF',false),'نمایش رمز');
assert.equal(ds.passwordVisibilityLabel('fa-AF',true),'پنهان‌کردن رمز');
assert.equal(ds.passwordVisibilityLabel('ps-AF',false),'پټنوم ښکاره کړئ');
assert.equal(ds.passwordVisibilityLabel('en',true),'Hide password');
assert.equal(ds.localizedLabel('serverSettings','fa-AF'),'تنظیمات اتصال سرور');
assert.equal(ds.localizedLabel('serverSettings','en'),'Server connection settings');
assert.equal(ds.localizedLabel('serverUrl','ps-AF'),'د مرکزي سرور پته');
assert.throws(()=>ds.localizedLabel('unknown','en'),RangeError);
assert.equal(ds.normalizeAfghanPhone('+447700900123'),'+447700900123');

const css=fs.readFileSync(path.join(__dirname,'../packages/shared/ui/design-system-v1.css'),'utf8');
const modes=['light','dark','glass'];
function block(mode) {
  const key='html[data-zavi-appearance="'+mode+'"]';
  const start=css.indexOf(key);
  assert.ok(start>=0,'Theme missing: '+mode);
  return css.slice(css.indexOf('{',start)+1,css.indexOf('}',start));
}
function token(text,key) {
  const match=text.match(new RegExp('--zds-'+key+':\\s*([^;\\n]+)'));
  assert.ok(match,'Missing design token '+key);
  return match[1].trim();
}
function rgb(hex) {
  assert.match(hex,/^#[a-f0-9]{6}$/i);
  return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
}
function composite(fg,bg,alpha) {
  const f=rgb(fg),b=rgb(bg);
  return '#'+f.map((v,i)=>Math.round(255*(v*alpha+b[i]*(1-alpha))).toString(16).padStart(2,'0')).join('');
}
function luminance(hex) {
  const c=rgb(hex).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a,b) {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
for(const mode of modes) {
  const b=block(mode);
  let surface=token(b,'surface');
  if(mode==='glass') {
    const m=surface.match(/^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/);
    assert.ok(m,'Glass background must have a bounded alpha');
    const fg='#'+[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join('');
    surface=composite(fg,token(b,'bg'),Number(m[4]));
  }
  for(const name of ['text','muted','danger']) {
    const ratio=contrast(token(b,name),surface);
    assert.ok(ratio>=4.5,mode+' '+name+' insufficient contrast: '+ratio.toFixed(2));
  }
  const action=contrast(token(b,'button'),token(b,'button-text'));
  assert.ok(action>=4.5,mode+' action contrast insufficient: '+action.toFixed(2));
  console.log('PASS:',mode,'WCAG AA token contrast, input and action color contracts');
}
for(const rule of ['.zds-field-error','[aria-invalid="true"]',
  '[role="tab"]','html[dir="rtl"]','prefers-reduced-motion']) {
  assert.ok(css.includes(rule),'Missing shared design rule: '+rule);
}
console.log('PASS: Afghan month, dual date, digits, FX order, international phone, three-theme contrast and RTL shared design');

// Twelve-reference shared component regression (2026-11-09).
const requiredComponents=[
 '.zds-button--secondary','.zds-button--danger','.zds-search',
 '.zds-filterbar','.zds-pagination','.zds-select','.zds-date-input',
 '.zds-calendar-grid','.zds-date-pair','.zds-two-col','.zds-actions',
 '.zds-status--success','.zds-status--warning','.zds-status--danger',
 '.zds-table','.zds-stepper','.zds-dialog','.zds-sheet',
 '.zds-skeleton','.zds-toast','.zds-offline-banner'
];
for (const item of requiredComponents) {
 assert.ok(css.includes(item),'Shared component absent: '+item);
}
for (const app of ['one','admin']) {
 const html=fs.readFileSync(path.join(__dirname,'../apps',app,'index.html'),'utf8');
 const tokens='../../packages/shared/ui/design-system-v1.css';
 const finalSkin='./zavi-reference-'+app+'-v3.css';
 assert.ok(html.includes(tokens),'Missing shared token import: '+app);
 assert.ok(html.includes(finalSkin),'Missing reference stylesheet: '+app);
 assert.ok(html.indexOf(tokens)<html.indexOf(finalSkin),
  'Shared design must load before final app skin: '+app);
 assert.ok(!/fonts\\.googleapis\\.com|fonts\\.gstatic\\.com/.test(html),
  'Network-loaded fonts are prohibited in offline apps: '+app);
}
console.log('PASS: source-linked shared design, forms, calendars, responsive filters and status contracts');
