/* ZAVI ONE V64.8 — isolated, server-authorized colleague POS.
 * Never load the owner's payload or accept a browser-supplied sale price/cost.
 * Not activated on production until reviewed SQL + data-migration tests pass.
 */
(()=>{'use strict';
const $=s=>document.querySelector(s);const core=window.ZaviStaff648;
if(!core)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let open=false,workspaces=[],chosen=null,context=null,kind='sale',cart=[],pending=false,previousFocus=null,operationDraft=null,financeSummary=null,financeError='';
const language=()=>document.documentElement.lang||'fa-AF';
const i18n=(fa,ps,en)=>language()==='en'?en:language()==='ps-AF'?ps:fa;
function session(){return window.zaviCloudGetAuthSession?.()||null}
function allowed(){const s=session();return !!(s?.user?.id&&s?.access_token)&&window.zaviCloudRestoreInfo?.()?.role!=='owner'}
async function rpc(name,body){const s=session(),uid=s?.user?.id,config=window.zaviCloudGetPublicConfig?.()||{};
 if(!uid||!s?.access_token||!config.url||!config.key)throw Error('ابتدا با حساب جداگانه همکار وارد شوید.');
 const url=new URL(config.url);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw Error('سرور امن HTTPS لازم است.');
 if(window.zaviCloudRefreshAuthSession)await window.zaviCloudRefreshAuthSession();
 const fresh=session();if(fresh?.user?.id!==uid||!fresh.access_token)throw Error('نشست تغییر کرده است. دوباره وارد شوید.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),17000);
 try{const response=await fetch(url.href.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+fresh.access_token,'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:controller.signal,cache:'no-store'});
 const data=await response.json().catch(()=>null);if(!response.ok)throw Error(data?.message||data?.error||'خطای سرور ('+response.status+')');return data;
 }finally{clearTimeout(timer)}
}
function status(message,error=false){const target=$('#z648Status');if(target){target.textContent=message;target.classList.toggle('z648-fail',error)}}
function show(){const d=document.createElement('div');d.id='z648Overlay';d.className='z648-shade';d.innerHTML=`<section class="z648-sheet" role="dialog" aria-modal="true" aria-labelledby="z648Title"><div class="z648-top"><h2 id="z648Title">🧾 پنل خرید و فروش همکار</h2><button type="button" class="z648-close" data-z648="close" aria-label="بستن">✕</button></div>
<p>فقط عملیاتی فعال می‌شوند که مالک در سرور برای حساب شما اجازه داده است. سرمایه و مفاد در این پنل از سرور دریافت نمی‌شوند.</p>
<div class="z648-form"><div class="z648-field"><label for="z648Workspaces">فروشگاه</label><select id="z648Workspaces"></select></div><div class="z648-field"><label for="z648Kind">نوع عملیات</label><select id="z648Kind"></select></div></div>
<div id="z648Details" hidden><p id="z648Permissions" class="z648-pill"></p><div id="z657Finance" class="z657-finance" hidden></div><div class="z648-form"><div class="z648-field"><label for="z648Scan">بارکد یا کُد محصول</label><input id="z648Scan" autocomplete="off" placeholder="اسکن کنید یا کُد بنویسید"></div><div class="z648-field"><label for="z648Product">محصول</label><select id="z648Product"></select></div><div class="z648-field"><label for="z648Qty">تعداد</label><input id="z648Qty" inputmode="decimal" value="1"></div><div class="z648-field" id="z648PriceWrap"><label for="z648Price">قیمت خرید هر واحد (برای خرید)</label><input id="z648Price" inputmode="decimal" autocomplete="off" placeholder="قیمت خرید"></div><div class="z648-field"><label for="z648Account">حساب دریافت یا پرداخت</label><select id="z648Account"></select></div></div>
<div id="z648Lookup" class="z648-status">برای افزودن محصول کد بارکد را وارد کنید.</div>
<div class="z648-actions"><button type="button" data-z648="add">افزودن به فاکتور</button><button type="button" data-z648="refresh">تازه‌سازی موجودی</button></div>
<div id="z648Cart"></div><div class="z648-actions"><button type="button" class="z648-primary" data-z648="submit">ثبت قطعی با اجازه مالک</button><button type="button" data-z648="reset">پاک کردن سبد</button></div></div>
<div role="status" aria-live="polite" id="z648Status" class="z648-status">در حال دریافت اجازه‌ها...</div></section>`;
 document.body.append(d);
}
function modeList(){const kinds=[];if(chosen?.can_sell)kinds.push(['sale','فروش نقدی']);if(chosen?.can_buy)kinds.push(['purchase','خرید نقدی']);$('#z648Kind').innerHTML=kinds.map(([id,l])=>`<option value="${id}" ${id===kind?'selected':''}>${l}</option>`).join('');
 if(!kinds.some(x=>x[0]===kind))kind=kinds[0]?.[0]||'';$('#z648Kind').value=kind;
}
function findByCode(products,barcode){return window.ZaviBarcodeV641?.lookup?.(products,barcode)??core.matches(products,barcode)}
function preview(){const code=$('#z648Scan')?.value||'';const matches=findByCode(context?.products||[],code);const target=$('#z648Lookup');if(!target)return;
 if(!code.trim()){target.textContent='بارکد را بنویسید یا از فهرست محصول انتخاب کنید.';return;}
 if(matches.length!==1){target.textContent=matches.length?'بارکد تکراری در گدام است.':'محصولی با این بارکد یافت نشد.';return;}
 const p=matches[0];$('#z648Product').value=p.id;
 target.textContent=p.name+' · قیمت فروش: '+core.money(p.sale_price)+' '+esc(context.currency)+' · موجودی: '+core.money(p.stock);
}
function cartHtml(){const spot=$('#z648Cart');if(!spot)return;
 const products=new Map((context?.products||[]).map(p=>[p.id,p]));
 spot.innerHTML=!cart.length?'<p>هنوز محصولی به این فاکتور اضافه نشده است.</p>':`<table class="z648-table"><thead><tr><th>محصول</th><th>تعداد</th><th>قیمت واحد</th><th></th></tr></thead><tbody>${cart.map((it,i)=>`<tr><td>${esc(products.get(it.product_id)?.name||'—')}</td><td>${esc(it.qty)}</td><td>${core.money(kind==='sale'?products.get(it.product_id)?.sale_price:it.price)}</td><td><button data-z648-remove="${i}" type="button">حذف</button></td></tr>`).join('')}</tbody></table>`;
 const sum=cart.reduce((acc,i)=>acc+Number(i.qty)*Number(kind==='sale'?products.get(i.product_id)?.sale_price||0:i.price||0),0);
 spot.insertAdjacentHTML('beforeend',`<div class="z648-totals"><strong>مجموع تخمینی فاکتور</strong><b>${core.money(sum)} ${esc(context?.currency||'AFN')}</b></div>`);
}
function renderFinance(){
 const panel=$('#z657Finance');if(!panel)return;
 if(!chosen||chosen.hide_capital_profit!==false){panel.hidden=true;panel.textContent='';return;}
 panel.hidden=false;
 if(financeError){panel.textContent=financeError;return;}
 if(!financeSummary){panel.textContent=i18n('در حال دریافت خلاصه مالیِ مجاز...','د اجازه لرونکي مالي لنډیز ترلاسه کول...','Loading authorized financial summary...');return;}
 const m=financeSummary;
 // Only three non-identifying server-computed aggregates, not the accounting payload.
 panel.innerHTML='<b>'+i18n('خلاصه مالی با اجازه مالک','د مالک په اجازه مالي لنډیز','Owner-authorized financial summary')+'</b>'
 +'<div class="z657-finance-grid"><span>'+i18n('سرمایه موجود در گدام','په ګودام کې پانګه','Inventory capital')+'</span><strong>'+esc(core.money(m.inventory_capital))+' '+esc(m.currency)+'</strong>'
 +'<span>'+i18n('فروش خالص','خالص پلور','Net sales')+'</span><strong>'+esc(core.money(m.net_sales))+' '+esc(m.currency)+'</strong>'
 +'<span>'+i18n('مفاد تقریبی','اټکلي ګټه','Estimated profit')+'</span><strong>'+esc(core.money(m.estimated_profit))+' '+esc(m.currency)+'</strong></div>'
 +'<small>'+i18n('مبالغ تخمینی‌اند؛ سرمایه گدام با کل دارایی مالک فرق دارد.','شمېرې اټکلي دي؛ د ګودام پانګه د مالک له ټولو شتمنیو سره توپیر لري.','Estimates only; inventory capital is not the owner’s total equity.')+'</small>';
}
async function loadFinance(expectedWorkspace,expectedActor){
 financeSummary=null;financeError='';renderFinance();
 if(chosen?.hide_capital_profit!==false)return;
 try{
  const response=await rpc('zavi_v657_staff_finance',{p_workspace:expectedWorkspace});
  if(!open||chosen?.id!==expectedWorkspace||session()?.user?.id!==expectedActor)return;
  if(response?.workspace_id!==expectedWorkspace||response?.estimate_only!==true)throw Error('Financial response invalid');
  financeSummary=response;financeError='';
 }catch(e){
  if(!open||chosen?.id!==expectedWorkspace||session()?.user?.id!==expectedActor)return;
  financeError=i18n('خلاصه مالی هنوز قابل دریافت نیست؛ بدون معلومات محرمانه ادامه دهید.','مالي لنډیز لاسرسی نه لري؛ له محرمو معلوماتو پرته ادامه ورکړئ.','Financial summary unavailable; continue without confidential information.');
 }renderFinance();
}
function renderContext(){const detail=$('#z648Details');if(!chosen||!context||!(chosen.can_buy||chosen.can_sell)){detail.hidden=true;status('برای این فروشگاه اجازه خرید یا فروش ثبت نشده است.');return;}
 detail.hidden=false;modeList();renderFinance();$('#z648Permissions').textContent=(chosen.can_sell?'✓ فروش  ':'')+(chosen.can_buy?'✓ خرید  ':'')+(chosen.hide_capital_profit?'· سرمایه و مفاد پنهان':'· اجازه مشاهده سرمایه و مفاد درخواست شده (نمایش مالی هنوز فعال نیست)');
 $('#z648PriceWrap').hidden=kind!=='purchase';
 $('#z648Product').innerHTML=(context.products||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.sku||'بدون بارکد')}</option>`).join('');
 $('#z648Account').innerHTML=(context.accounts||[]).map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
 cartHtml();preview();status('آماده ثبت عملیات مجاز. سرمایه، قیمت تمام‌شده و مفاد در پاسخ‌های سرور ارسال نمی‌شوند.');
}
async function listWorkspaces(){const response=await rpc('zavi_v648_staff_workspaces',{});if(!Array.isArray(response))throw Error('فهرست فروشگاه از سرور قابل خواندن نیست.');workspaces=response.map(x=>({...x,...core.safeFlags(x)}));
 const sel=$('#z648Workspaces');sel.innerHTML=workspaces.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
 if(!workspaces.length){$('#z648Details').hidden=true;status('هیچ فروشگاه مجازی برای حساب همکار پیدا نشد. مالک باید شما را اضافه کند.',true);return;}
 await pick(workspaces[0].id);
}
async function pick(id){if(pending)return;const w=workspaces.find(x=>x.id===id);if(!w)throw Error('فروشگاه مجاز نیست.');chosen=w;cart=[];context=null;financeSummary=null;financeError='';
 status('در حال دریافت فهرست محصولات مجاز...');const identity=session()?.user?.id;const response=await rpc('zavi_v648_staff_catalog',{p_workspace:w.id});
 if(!open||session()?.user?.id!==identity||chosen?.id!==id)return;
 if(response?.workspace_id!==w.id||!Array.isArray(response.products)||!Array.isArray(response.accounts))throw Error('پاسخ نامعتبر سرور');
 context=response;chosen={...w,...core.safeFlags(response)};renderContext();if(chosen.hide_capital_profit===false)await loadFinance(id,identity);
}
function addToCart(){if(!context||!chosen)return;const pid=$('#z648Product').value,p=context.products.find(p=>p.id===pid);if(!p)throw Error('ابتدا محصول معتبر انتخاب کنید.');
 const qty=core.latin($('#z648Qty').value).trim();if(!core.validQty(qty))throw Error('تعداد مثبت و معتبر وارد کنید.');
 const purchasePrice=core.latin($('#z648Price').value).trim();if(kind==='purchase'&&!core.validMoney(purchasePrice))throw Error('قیمت خرید معتبر وارد کنید.');
 const matching=cart.find(x=>x.product_id===pid);if(matching){const combined=Number(matching.qty)+Number(qty);if(!core.validQty(String(combined)))throw Error('تعداد بیش از حد مجاز است.');matching.qty=String(combined);if(kind==='purchase')matching.price=purchasePrice;}
 else cart.push({product_id:pid,qty,...(kind==='purchase'?{price:purchasePrice}:{})});
 if(cart.length>40){cart.pop();throw Error('حداکثر ۴۰ ردیف در هر فاکتور.');}cartHtml();status('محصول به فاکتور اضافه شد. پیش از ثبت، موارد را بررسی کنید.');
}
function uuid4(){if(typeof crypto?.randomUUID==='function')return crypto.randomUUID();
 if(!crypto?.getRandomValues)throw Error('تولید شناسه امن عملیات در این مرورگر ممکن نیست.');
 const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
 return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
async function save(){if(pending)return;if(!chosen||!context||!cart.length)throw Error('ابتدا محصول به فاکتور اضافه کنید.');
 if((kind==='sale'&&!chosen.can_sell)||(kind==='purchase'&&!chosen.can_buy))throw Error('اجازه این عملیات وجود ندارد.');
 if(!window.confirm((kind==='sale'?'فروش':'خرید')+' نقدی ثبت شود؟ این عملیات موجودی و حساب فروشگاه را تغییر می‌دهد.'))return;
 pending=true;const actor=session()?.user?.id,workspace=chosen.id;
 const sanitized=core.normalizeItems(cart,kind),accountId=$('#z648Account').value;
 const signature=JSON.stringify({actor,workspace,kind,accountId,sanitized});
 if(operationDraft&&operationDraft.signature!==signature){pending=false;throw Error('فاکتور تغییر کرده است؛ قبل از ارسال دوباره، رسید عملیات قبلی را بررسی کنید.');}
 if(!operationDraft)operationDraft={signature,id:uuid4()};
 const operationId=operationDraft.id;
 try{const result=await rpc('zavi_v648_staff_record',{p_workspace:workspace,p_operation_id:operationId,p_kind:kind,p_items:sanitized,p_account_id:accountId});
  if(!open||actor!==session()?.user?.id||workspace!==chosen?.id)return;
  if(!result?.success||result.operation_id!==operationId)throw Error('سرور ثبت عملیات را تأیید نکرد.');
  cart=[];operationDraft=null;cartHtml();status('✓ ثبت شد: '+result.code+' · '+core.money(result.total)+' '+result.currency+'؛ کُد سند را نگه دارید.');
  try{const refresh=await rpc('zavi_v648_staff_catalog',{p_workspace:workspace});if(open&&chosen?.id===workspace&&session()?.user?.id===actor){context=refresh;renderContext();status('✓ سند '+result.code+' در سرور ثبت شد.');}}catch(_){status('✓ سند '+result.code+' ثبت شد؛ تازه‌سازی موجودی انجام نشد. پیش از ثبت فاکتور بعدی، روی تازه‌سازی بزنید.');}
 }finally{pending=false;}
}
function close(){open=false;chosen=null;context=null;financeSummary=null;financeError='';cart=[];workspaces=[];operationDraft=null;$('#z648Overlay')?.remove();if(previousFocus?.isConnected)previousFocus.focus();}
async function begin(){if(open||!allowed())return;previousFocus=document.activeElement;open=true;show();$('#z648Overlay [data-z648="close"]')?.focus();try{await listWorkspaces()}catch(e){status('اتصال یا مجوز: '+e.message,true)}}
function ensureLauncher(){let b=$('#z648Open');if(!b){b=document.createElement('button');b.id='z648Open';b.className='z648-launch';b.type='button';b.textContent='👤 فروش و خرید همکار';document.body.append(b)}
 b.hidden=!allowed();if(open&&!allowed())close();}
document.addEventListener('click',async e=>{const btn=e.target.closest?.('[data-z648]'),launcher=e.target.closest?.('#z648Open'),entry=e.target.closest?.('[data-z648-open]'),rm=e.target.closest?.('[data-z648-remove]');if(!btn&&!launcher&&!entry&&!rm)return;
 e.preventDefault();if(launcher||entry){await begin();return;}if(rm){cart.splice(Number(rm.dataset.z648Remove),1);cartHtml();return;}
 const task=btn.dataset.z648;if(task==='close'){close();return;}
 try{if(task==='add')addToCart();else if(task==='reset'){cart=[];cartHtml();}else if(task==='refresh'){await pick(chosen.id)}else if(task==='submit')await save()}catch(err){status(err.message||'خطا',true)}
});
document.addEventListener('change',e=>{if(!open)return;if(e.target?.id==='z648Workspaces')pick(e.target.value).catch(er=>status(er.message,true));
 if(e.target?.id==='z648Kind'){kind=e.target.value;cart=[];renderContext();}if(e.target?.id==='z648Product'){$('#z648Scan').value='';preview()}});
document.addEventListener('input',e=>{if(open&&e.target?.id==='z648Scan')preview()});
document.addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape'){e.preventDefault();close();return;}
 if(e.key==='Enter'&&e.target?.id==='z648Scan'){e.preventDefault();const m=findByCode(context?.products||[],e.target.value);if(m.length===1){$('#z648Product').value=m[0].id;preview();$('#z648Qty').focus();}}
});
window.addEventListener('load',ensureLauncher);ensureLauncher();setInterval(()=>{if(document.visibilityState!=='hidden')ensureLauncher()},12000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ensureLauncher()});
})();
