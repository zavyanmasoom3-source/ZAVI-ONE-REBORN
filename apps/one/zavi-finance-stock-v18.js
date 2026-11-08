/* V18 - READ ONLY business insights, no SQL changes, no mutation to legacy ledger.
 * Receives current in-memory tenant state only. Values intentionally share the
 * existing program's summary() and stockState() calculations. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]));
const num=v=>Number(v)||0;
const fmt=v=>new Intl.NumberFormat(window.zaviPublicLanguage?.()==='en'?'en-US':'fa-AF',{maximumFractionDigits:2}).format(num(v));
const trans=(fa,en,ps)=>({en, 'ps-AF':ps, 'fa-AF':fa})[window.zaviPublicLanguage?.()||'fa-AF']||fa;
const card=(label,value,note='',css='')=>`<article class="zv18-kpi ${css}"><span>${esc(label)}</span><strong dir="auto">${esc(value)}</strong>${note?`<small>${esc(note)}</small>`:''}</article>`;
function snapshot(s,stock,products,config={}){
 const rows=(products||[]).map(p=>{
  const inv=stock?.[p.id]||{};const qty=num(inv.qty);const limit=Math.max(0,num(p.reorder));
  return {name:p.name||p.sku||'—',sku:p.sku||'',qty,limit,worth:num(inv.value),isLow:qty<=limit,kind:qty<=0?'empty':'low'};
 });
 rows.sort((a,b)=>a.qty-b.qty);
 const low=rows.filter(p=>p.qty<=p.limit), out=rows.filter(p=>p.qty<=0);
 const gross=num(s.sales)-num(s.cogs);const net=gross-num(s.expenses)-num(s.adjustLoss);
 return {rows,low,out,gross,net,margin:s.sales>0?net/s.sales*100:0,loss:num(s.adjustLoss),expenses:num(s.expenses),sales:num(s.sales),cogs:num(s.cogs),warehouse:rows.reduce((a,x)=>a+x.worth,0)};
}
function pnl(s,stock,products){const m=snapshot(s,stock,products);
 const note=trans('محاسبه تقریبی براساس معاملات ثبت‌شده، بهای اجناس فروخته‌شده و مصارف؛ برای مالیات یا حسابرسی رسمی تأیید جداگانه لازم است.','Estimated from recorded transactions, cost of goods sold and expenses; not a certified tax or audit statement.','د ثبت شوو معاملو، د پلورل شوو توکو لګښت او مصارفو پر بنسټ اټکل دی؛ رسمي تایید ته اړتیا لري.');
 return `<section class="zv18-insight" aria-label="${esc(trans('گزارش سود و زیان','Profit and loss','د ګټې او زیان راپور'))}"><div class="zv18-title"><h3>${trans('گزارش سود و زیان','Profit & loss','د ګټې او زیان راپور')}</h3><span class="zv18-pill">${trans('براساس داده واقعی','From recorded entries','د ثبت شوو معلوماتو پر بنسټ')}</span></div><div class="zv18-grid">
 ${card(trans('فروش خالص','Net sales','خالص پلور'),fmt(m.sales))}
 ${card(trans('بهای فروش','Cost of goods sold','د پلور لګښت'),fmt(m.cogs))}
 ${card(trans('سود ناخالص','Gross profit','ناخالصه ګټه'),fmt(m.gross),'','zv18-highlight')}
 ${card(trans('مصارف و ضایعات','Expenses & losses','لګښتونه او زیانونه'),fmt(m.expenses+m.loss))}
 ${card(trans('سود خالص تقریبی','Estimated net profit','اټکلي خالصه ګټه'),fmt(m.net),'','zv18-highlight')}
 ${card(trans('حاشیه سود','Profit margin','د ګټې سلنه'),fmt(m.margin)+'%')}
 </div><p class="zv18-note">${esc(note)}</p></section>`;
}
function inventory(stock,products){const v=snapshot({sales:0,cogs:0,expenses:0,adjustLoss:0},stock,products);
 return `<section class="zv18-insight" aria-label="${esc(trans('موجودی هوشمند','Smart inventory','هوښیار موجودي'))}"><div class="zv18-title"><h3>📦 ${trans('موجودی هوشمند','Smart inventory','هوښیار موجودي')}</h3><span class="zv18-pill">${trans('براساس حد هشدار هر محصول','Based on each item’s reorder level','د هر توکي د خبرتیا د کچې له مخې')}</span></div><div class="zv18-grid">
 ${card(trans('انواع محصول','Products','د توکو ډولونه'),fmt(v.rows.length))}
 ${card(trans('اجناس کم‌موجودی','Low-stock items','کم موجودي توکي'),fmt(v.low.length),'','zv18-warn')}
 ${card(trans('ناموجود','Out of stock','خلاص شوي'),fmt(v.out.length),'','zv18-warn')}
 ${card(trans('ارزش موجودی به بهای خرید','Inventory at cost','د موجودۍ د لګښت ارزښت'),fmt(v.warehouse))}
 </div><div class="zv18-stock-list">${v.low.length?v.low.slice(0,8).map(x=>`<div class="zv18-stock-row"><strong data-no-translate="true">${esc(x.name)}</strong><span>${trans('مانده','Remaining','پاتې')}: ${fmt(x.qty)} &nbsp; · &nbsp; ${trans('حد هشدار','Reorder at','د خبرتیا حد')}: ${fmt(x.limit)}</span></div>`).join(''):`<p>${trans('هیچ محصول کم‌موجودی ثبت نشده است.','No low-stock items found.','کم موجودي توکي ونه موندل شول.')}</p>`}</div></section>`;
}
window.ZaviFinanceStockV18={snapshot,pnl,inventory};
})();
