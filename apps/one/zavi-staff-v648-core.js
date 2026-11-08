/* ZAVI ONE V64.8 — pure staff POS helpers; no financial secrets or local persistence. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviStaff648=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const latin=s=>String(s??'').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x)));
 const code=s=>latin(s).trim().toLocaleLowerCase();
 const validMoney=s=>/^[0-9]{1,9}(\.[0-9]{1,2})?$/.test(latin(s).trim());
 const validQty=s=>/^[0-9]{1,6}(\.[0-9]{1,3})?$/.test(latin(s).trim())&&Number(latin(s))>0&&Number(latin(s))<=10000;
 function matches(list,barcode){const target=code(barcode);if(!target)return [];return (list||[]).filter(p=>[p.sku,...(Array.isArray(p.barcodes)?p.barcodes:[])].some(c=>code(c)===target));}
 function normalizeItems(cart,kind){if(!['sale','purchase'].includes(kind)||!Array.isArray(cart)||!cart.length||cart.length>40)throw Error('فهرست فاکتور معتبر نیست.');
 const seen=new Set();return cart.map(i=>{const product_id=String(i.product_id||'');if(!product_id||product_id.length>120||seen.has(product_id))throw Error('محصول تکراری یا نامعتبر است.');seen.add(product_id);
 const qty=latin(i.qty).trim();if(!validQty(qty))throw Error('تعداد محصول درست نیست.');const out={product_id,qty};if(kind==='purchase'){const price=latin(i.price).trim();if(!validMoney(price)||Number(price)>100000000)throw Error('قیمت خرید معتبر نیست.');out.price=price;}return out;});}
 function safeFlags(x){return {can_sell:x?.can_sell===true,can_buy:x?.can_buy===true,hide_capital_profit:x?.hide_capital_profit!==false};}
 function money(x){const n=Number(x);return Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n):'—';}
 return {latin,code,validMoney,validQty,matches,normalizeItems,safeFlags,money};
});
