/* ZAVI warehouse locations V66.36: non-financial catalog metadata.
   No quantity mutation: stock remains exclusively in the accounting ledger. */
(function(){
'use strict';
var KEY='zavi.warehouse.locations.v1';
var WAREHOUSE_KEY='zavi.warehouse.names.v1';
function readNames(){try{var a=JSON.parse(localStorage.getItem(WAREHOUSE_KEY)||'[]');return Array.isArray(a)?a.filter(function(x){return typeof x==='string'&&x.trim()}).slice(0,100):[]}catch(e){return []}}
function rememberName(name){name=clean(name);if(!name)return true;var a=readNames();if(a.indexOf(name)>=0)return true;a.push(name);try{localStorage.setItem(WAREHOUSE_KEY,JSON.stringify(a));return true}catch(e){return false}}
function read(){try{var v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(e){return {}}}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(e){return false}}
function clean(s){return String(s||'').trim().slice(0,100)}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function mount(){
 var root=document.getElementById('content');if(!root)return;
 var heading=Array.from(root.querySelectorAll('h1,h2,h3')).some(function(el){return /محصول و موجودی گدام|محصولات و موجودی|مدیریت محصولات/.test(el.textContent||'')});
 if(!heading && !(/محصول و موجودی گدام|محصولات و موجودی|مدیریت محصولات/.test(root.textContent||'')))return;
 if(root.querySelector('#zavi-location-manager'))return;
 var products=(typeof db!=='undefined'&&db&&Array.isArray(db.products))?db.products:[];
 // Access the application's real product register only; never invent inventory quantities.
 // Allow naming warehouses even before the first product is registered.
 var box=document.createElement('section');box.id='zavi-location-manager';box.className='card';
 box.style.cssText='margin:14px 0;padding:18px;border-radius:18px';
 box.innerHTML='<h3>مدیریت گدام‌ها</h3><p class="muted">گدام جدید بسازید یا موقعیت محصول را انتخاب کنید. موجودی حسابداری جداگانه مدیریت می‌شود.</p><div class="zavi-location-grid"><label>محصول<select id="zavi-loc-product"></select></label><label>نام گدام<select id="zavi-loc-warehouse-choice"></select></label><label>افزودن گدام<input id="zavi-loc-warehouse" maxlength="100" placeholder="نام گدام جدید (اختیاری)"></label><label>بخش / راهرو<input id="zavi-loc-zone" maxlength="100" placeholder="بخش A"></label><label>الماری / قفسه<input id="zavi-loc-shelf" maxlength="100" placeholder="قفسه ۱"></label></div><div class="zavi-loc-actions"><button type="button" class="btn" id="zavi-warehouse-add">افزودن نام گدام</button> <button type="button" class="btn primary" id="zavi-loc-save">ثبت موقعیت</button></div><div id="zavi-loc-status" role="status"></div><div class="zavi-loc-list" id="zavi-loc-list"></div>';
 var select=box.querySelector('#zavi-loc-product');
 products.forEach(function(p){var o=document.createElement('option');o.value=String(p.id);o.textContent=String(p.name||p.sku||p.id);select.appendChild(o)});
 if(!products.length){var o=document.createElement('option');o.value='';o.textContent='ابتدا محصول ثبت کنید';select.appendChild(o);box.querySelector('#zavi-loc-save').disabled=true;}
 function warehouses(){
  var values=['گدام مرکزی'].concat(readNames().filter(function(n){return n!=='گدام مرکزی'}));
  Object.keys(read()).forEach(function(id){var w=clean(read()[id]&&read()[id].warehouse);if(w&&values.indexOf(w)<0)values.push(w)});
  return values;
 }
 function update(){
  var v=read(),p=select.value,x=v[p]||{};
  var choices=box.querySelector('#zavi-loc-warehouse-choice'),chosen=clean(x.warehouse)||'گدام مرکزی';
  var names=warehouses();if(names.indexOf(chosen)<0)names.push(chosen);
  choices.replaceChildren();
  names.forEach(function(name){var opt=document.createElement('option');opt.value=name;opt.textContent=name;choices.appendChild(opt)});
  choices.value=chosen;
  box.querySelector('#zavi-loc-warehouse').value='';
  box.querySelector('#zavi-loc-zone').value=x.zone||'';
  box.querySelector('#zavi-loc-shelf').value=x.shelf||'';
  box.querySelector('#zavi-loc-list').innerHTML=products.filter(function(p){return v[p.id]}).map(function(p){var a=v[p.id];return '<div class="zavi-loc-row"><strong>'+esc(p.name)+'</strong><span>'+esc(a.warehouse)+' · '+esc(a.zone)+' · '+esc(a.shelf)+'</span></div>'}).join('')||'<p class="muted">هنوز موقعیت محصولی ثبت نشده است.</p>';
 }
 select.addEventListener('change',update);
 box.querySelector('#zavi-warehouse-add').addEventListener('click',function(){
  var name=clean(box.querySelector('#zavi-loc-warehouse').value);
  if(!name){box.querySelector('#zavi-loc-status').textContent='نام گدام جدید را وارد کنید.';return}
  if(!rememberName(name)){box.querySelector('#zavi-loc-status').textContent='ذخیره نام گدام انجام نشد.';return}
  update();
  box.querySelector('#zavi-loc-warehouse-choice').value=name;
  box.querySelector('#zavi-loc-status').textContent='نام گدام اضافه شد. برای ثبت موقعیت، محصول را انتخاب کنید.';
 });

 box.querySelector('#zavi-loc-save').addEventListener('click',function(){
  var id=select.value;if(!id)return;
  var v=read();var warehouse=clean(box.querySelector('#zavi-loc-warehouse').value)||clean(box.querySelector('#zavi-loc-warehouse-choice').value);
  if(!warehouse){box.querySelector('#zavi-loc-status').textContent='نام گدام را انتخاب کنید.';return}
  if(!rememberName(warehouse)){box.querySelector('#zavi-loc-status').textContent='نام گدام ذخیره نشد؛ فضای ذخیره‌سازی را بررسی کنید.';return}
  v[id]={warehouse:warehouse,zone:clean(box.querySelector('#zavi-loc-zone').value),shelf:clean(box.querySelector('#zavi-loc-shelf').value)};
  box.querySelector('#zavi-loc-status').textContent=save(v)?'موقعیت محصول ذخیره شد.':'ذخیره انجام نشد؛ فضای ذخیره‌سازی را بررسی کنید.';update();
 });
 var scanner=root.querySelector('.z638-warehouse-scanner');
 if(scanner)scanner.insertAdjacentElement('afterend',box);else root.prepend(box);
 update();
}
var queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;mount()})}
function init(){schedule();new MutationObserver(schedule).observe(document.getElementById('content')||document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();