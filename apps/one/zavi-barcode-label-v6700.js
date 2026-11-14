/* Recovered ZAVI ONE 66.75 barcode label workflow. Read-only catalogue; no stock writes. */
(() => {
 'use strict';
 if(window.ZaviBarcodeLabelsV6700) return;
 const enc=String.raw;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const codes=p=>[p?.sku,...(Array.isArray(p?.barcodes)?p.barcodes:[])].filter(Boolean);
 const source=()=>{
  try {
   if(typeof db !== 'undefined' && Array.isArray(db?.products))return db.products.filter(Boolean);
   if(Array.isArray(window.zaviDb?.products))return window.zaviDb.products.filter(Boolean);
  }catch(_){}
  return [];
 };
 const C128=['BaBbBb','BbBaBb','BbBbBa','AbAbBc','AbAcBb','AcAbBb','AbBbAc','AbBcAb','AcBbAb','BbAbAc','BbAcAb','BcAbAb','AaBbCb','AbBaCb','AbBbCa','AaCbBb','AbCaBb','AbCbBa','BbCbAa','BbAaCb','BbAbCa','BaCbAb','BbCaAb','CaBaCa','CaAbBb','CbAaBb','CbAbBa','CaBbAb','CbBaAb','CbBbAa','BaBaBc','BaBcBa','BcBaBa','AaAcBc','AcAaBc','AcAcBa','AaBcAc','AcBaAc','AcBcAa','BaAcAc','BcAaAc','BcAcAa','AaBaCc','AaBcCa','AcBaCa','AaCaBc','AaCcBa','AcCaBa','CaCaBa','BaAcCa','BcAaCa','BaCaAc','BaCcAa','BaCaCa','CaAaBc','CaAcBa','CcAaBa','CaBaAc','CaBcAa','CcBaAa','CaDaAa','BbAdAa','DcAaAa','AaAbBd','AaAdBb','AbAaBd','AbAdBa','AdAaBb','AdAbBa','AaBbAd','AaBdAb','AbBaAd','AbBdAa','AdBaAb','AdBbAa','BdAbAa','BbAaAd','DaCaAa','BdAaAb','AcDaAa','AaAbDb','AbAaDb','AbAbDa','AaDbAb','AbDaAb','AbDbAa','DaAbAb','DbAaAb','DbAbAa','BaBaDa','BaDaBa','DaBaBa','AaAaDc','AaAcDa','AcAaDa','AaDaAc','AaDcAa','DaAaAc','DaAcAa','AaCaDa','AaDaCa','CaAaDa','DaAaCa','BaAdAb','BaAbAd','BaAbCb','BcCaAaB'];
 const eanBits=value=>{
  let s=String(value||'').replace(/\D/g,'');
  if(s.length===12){let sum=[...s].reduce((acc,d,i)=>acc+Number(d)*(i%2?3:1),0);s+=String((10-sum%10)%10);}
  if(s.length!==13 || !/^\d{13}$/.test(s))return null;
  const check=String((10-[...s.slice(0,12)].reduce((sum,d,i)=>sum+Number(d)*(i%2?3:1),0)%10)%10);
  if(s[12]!==check)return null;
  const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R=['1110010','1100110','1101100','1000010','1001110','1000110','1010000','1000100','1001000','1110100'];
  const parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'][Number(s[0])];
  let bits='101';for(let i=1;i<7;i++)bits+=parity[i-1]==='L'?L[Number(s[i])]:G[Number(s[i])];bits+='01010';
  for(let i=7;i<13;i++)bits+=R[Number(s[i])];return bits+'101';
 };
 const code128Bits=value=>{
  const s=String(value??'');
  if(!s || s.length>40 || [...s].some(c=>c.charCodeAt(0)<32||c.charCodeAt(0)>126))return null;
  const chars=[104,...[...s].map(c=>c.charCodeAt(0)-32)];
  chars.push((chars[0]+chars.slice(1).reduce((a,n,i)=>a+n*(i+1),0))%103,106);
  return chars.map(x=>C128[x]).join('').split('').map(c=>(c>='A'&&c<='Z'?'1':'0').repeat(c.toLowerCase().charCodeAt(0)-96)).join('');
 };
 const barcode=bits=>{
  let rect='';for(let i=0;i<bits.length;i++)if(bits[i]==='1')rect+='<rect x="'+i+'" y="0" width="1" height="48"/>';
  return '<svg class="zavi-label-bars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+bits.length+' 48" preserveAspectRatio="none" aria-label="barcode"><g fill="black">'+rect+'</g></svg>';
 };
 const money=val=>typeof window.currency==='function'?window.currency(Number(val)||0):String(Number(val)||0);
 function open(){
  const list=source();if(!list.length){window.toast?.('ابتدا حداقل یک محصول ثبت کنید.');return;}
  if(typeof window.showModal!=='function'){window.alert('صفحهٔ محصولات هنوز آماده نیست.');return;}
  const opts=list.map(p=>'<option value="'+escape(p.id)+'">'+escape(p.name||'محصول')+'</option>').join('');
  const body='<div class="zavi-label-grid"><label>محصول<select id="z-label-product">'+opts+'</select></label><label>بارکد<input id="z-label-code" dir="ltr" maxlength="40"></label><label>نوع بارکد<select id="z-label-type"><option value="code128">Code 128</option><option value="ean13">EAN-13</option></select></label><label>اندازه لیبل<select id="z-label-size"><option value="50x30">50×30 mm</option><option value="60x40">60×40 mm</option><option value="58x30">58×30 mm</option></select></label><label>تعداد چاپ<input id="z-label-copies" type="number" min="1" max="500" value="1"></label><div class="zavi-label-toggles"><label><input type="checkbox" id="z-label-name" checked> نام محصول</label><label><input type="checkbox" id="z-label-price" checked> قیمت فروش</label></div></div><p id="z-label-error" role="status"></p><div id="z-label-preview"></div>';
  window.showModal('چاپ لیبل',body,'چاپ لیبل');
  const $=id=>document.getElementById(id);
  const form=$('dialogForm');if(!form)return;
  const selected=()=>list.find(p=>String(p.id)===$('z-label-product').value)||list[0];
  function updateCode(){const p=selected();$('z-label-code').value=String(codes(p)[0]||'');}
  const state=()=>{
   const p=selected(),raw=$('z-label-code').value.trim(),type=$('z-label-type').value;
   const bits=type==='ean13'?eanBits(raw):code128Bits(raw);
   $('z-label-error').textContent=bits?'':(type==='ean13'?'کود EAN-13 معتبر نیست.':'بارکد Code128 باید ۱ تا ۴۰ حرف قابل چاپ لاتین داشته باشد.');
   const price=$('z-label-price').checked?'<b class="zavi-label-price">'+escape(money(p.salePrice||0))+'</b>':'';
   const name=$('z-label-name').checked?'<strong>'+escape(p.name||'محصول')+'</strong>':'';
   const card=bits?'<article class="zavi-label-sheet" data-size="'+escape($('z-label-size').value)+'">'+name+barcode(bits)+'<span dir="ltr">'+escape(raw)+'</span>'+price+'</article>':'';
   $('z-label-preview').innerHTML=card;
   return card;
  };
  updateCode();state();
  ['z-label-product','z-label-code','z-label-type','z-label-size','z-label-copies','z-label-name','z-label-price'].forEach(id=>$(id)?.addEventListener('input',()=>{if(id==='z-label-product')updateCode();state();}));
  form.addEventListener('submit',e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const card=state();if(!card)return;
   const n=Number($('z-label-copies').value);if(!Number.isSafeInteger(n)||n<1||n>500){$('z-label-error').textContent='تعداد چاپ باید بین ۱ و ۵۰۰ باشد.';return;}
   const win=window.open('','_blank');if(!win){window.toast?.('اجازهٔ بازکردن پنجرهٔ چاپ فعال نیست.');return;}
   const css='.zavi-label-sheet{width:50mm;min-height:30mm;break-inside:avoid;display:flex;align-items:center;justify-content:center;flex-direction:column;border:1px solid #ddd;padding:2mm;font:8pt Arial,sans-serif;box-sizing:border-box}.zavi-label-sheet[data-size="60x40"]{width:60mm;min-height:40mm}.zavi-label-sheet[data-size="58x30"]{width:58mm;min-height:30mm}.zavi-label-bars{width:96%;height:13mm}.zavi-label-price{font-size:9pt}@media print{body{margin:0}.zavi-label-sheet{page-break-inside:avoid}}';
   win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>ZAVI ONE Barcode</title><style>'+css+'</style></head><body>'+card.repeat(n)+'</body></html>');
   win.document.close();win.focus();setTimeout(()=>win.print(),200);
  },true);
 }
 function inject(){
  const root=document.getElementById('content');if(!root)return;
  // Four-tab approved product workspace owns the sole label entry.
  // Keep the old launcher only as a fallback when the tabs are unavailable.
  if(root.querySelector('[data-zavi-flow="products"] .zavi-products-label-panel')){
   root.querySelector('#zavi-label-launcher')?.remove();return;
  }
  if(root.querySelector('#zavi-label-launcher'))return;
  const active= document.body.dataset.zaviPage==='products'||root.classList.contains('zpdf-products')||!!document.querySelector('.nav-btn.active[data-go="products"]');
  if(!active)return;
  const head=root.querySelector('.page-head,.zui-section-heading,header');if(!head)return;
  const button=document.createElement('button');button.id='zavi-label-launcher';button.type='button';button.className='btn subtle';button.textContent='چاپ لیبل';button.addEventListener('click',open);
  head.appendChild(button);
 }
 window.ZaviBarcodeLabelsV6700=Object.freeze({open,eanBits,code128Bits});
 const root=document.getElementById('content');
 if(root)new MutationObserver(inject).observe(root,{childList:true,subtree:true});
 document.addEventListener('zavi:page',inject);
 document.addEventListener('click',e=>{if(e.target.closest('[data-action="barcode_label"]')){e.preventDefault();open();}else setTimeout(inject,0);},true);
 inject();
})();