/* ZAVI ONE V63.6: decimal-safe invoice arithmetic for new orders.
 * Base-currency invoice amounts are rounded to two decimal places, quantities to
 * three decimal places; historic documents are NOT rewritten. Uses BigInt instead
 * of binary floating-point for the subtotal, discount and paid balance.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviDecimal=api;})(typeof window==='object'?window:null,function(){'use strict';
 const LIMIT=100000000000000n;
 function scaled(raw,digits){
  let value=String(raw??'').trim().replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  if(!/^[+-]?(?:\d+)(?:\.\d+)?$/.test(value))throw Error('عدد اعشاری معتبر نیست.');
  const negative=value[0]==='-',parts=value.replace(/^[+-]/,'').split('.');
  const base=10n**BigInt(digits),whole=BigInt(parts[0]||'0'),fraction=(parts[1]||'');
  let result=whole*base+BigInt((fraction.slice(0,digits)).padEnd(digits,'0')||'0');
  if(fraction.length>digits&&Number(fraction[digits])>=5)result++;
  result=negative?-result:result;
  if(result>LIMIT||result< -LIMIT)throw Error('مبلغ از حد مجاز بزرگ‌تر است.');
  return result;
 }
 const cents=raw=>scaled(raw,2);
 const milli=raw=>scaled(raw,3);
 const toNumber=n=>Number(n)/100;
 function roundMoney(x){return toNumber(cents(x))}
 function sumLineCents(lines){
  if(!Array.isArray(lines)||lines.length>5000)throw Error('تعداد ردیف فاکتور معتبر نیست.');
  let total=0n;
  for(const line of lines){const q=milli(line.qty),p=cents(line.price);if(q<=0n||p<0n)throw Error('قیمت یا تعداد محصول معتبر نیست.');total+=q*p;if(total>LIMIT*1000n)throw Error('مبلغ فاکتور از حد مجاز بزرگ‌تر است.');}
  return (total+500n)/1000n;
 }
 function sumLineTotals(lines){return toNumber(sumLineCents(lines))}
 function invoiceTotals(lines,discount=0,shipping=0,paid=0){
  const gross=sumLineCents(lines),d=cents(discount),s=cents(shipping),p=cents(paid);
  if(d<0n||s<0n||p<0n||d>gross)throw Error('تخفیف یا باربری یا پرداخت معتبر نیست.');
  const total=gross-d+s;if(p>total)throw Error('پرداخت از مبلغ فاکتور بیشتر است.');
  return {gross:toNumber(gross),discount:toNumber(d),shipping:toNumber(s),total:toNumber(total),paid:toNumber(p),remaining:toNumber(total-p)};
 }
 function convertMoney(amount,rate){
  const value=cents(amount), fx=scaled(rate,8);
  if(fx<=0n)throw Error('نرخ تبدیل معتبر وارد کنید.');
  const product=value*fx, abs=product<0n?-product:product;
  const rounded=(abs+50000000n)/100000000n;
  if(rounded>LIMIT)throw Error('مبلغ از حد مجاز بزرگ‌تر است.');
  return toNumber(product<0n?-rounded:rounded);
 }
 function sumMoney(values){
  const total=values.reduce((sum,x)=>sum+cents(x),0n);
  if(total>LIMIT||total< -LIMIT)throw Error('مبلغ از حد مجاز بزرگ‌تر است.');
  return toNumber(total);
 }
 return Object.freeze({roundMoney,sumLineTotals,invoiceTotals,convertMoney,sumMoney});
});
