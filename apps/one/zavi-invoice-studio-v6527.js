/* ZAVI ONE 65.27 — tenant-owned, business-aware invoice design.
   Only changes presentation; no financial write or cross-workspace settings. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviInvoiceStudio6527=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const palettes=Object.freeze({
 navy:{label:'آبی رسمی',accent:'#1262bc',dark:'#081a35',panel:'#10315b',soft:'#dbeeff',ink:'#183958',light:'#ffffff'},
 teal:{label:'فیروزه‌ای',accent:'#007e92',dark:'#063c4b',panel:'#07566a',soft:'#d4f8f6',ink:'#174d56',light:'#ffffff'},
 emerald:{label:'سبز زمردی',accent:'#16724d',dark:'#103f32',panel:'#1b5d48',soft:'#dcf7e9',ink:'#204d3c',light:'#ffffff'},
 gold:{label:'طلایی لوکس',accent:'#ad7821',dark:'#292016',panel:'#473524',soft:'#f8e7c5',ink:'#51402b',light:'#ffffff'},
 royal:{label:'آبی سلطنتی',accent:'#3b53be',dark:'#161f57',panel:'#2b397f',soft:'#e4e8ff',ink:'#292f65',light:'#ffffff'},
 plum:{label:'بنفش',accent:'#7d438e',dark:'#30203d',panel:'#493158',soft:'#f2e4f9',ink:'#4f2d59',light:'#ffffff'},
 graphite:{label:'خاکستری مینیمال',accent:'#3f6073',dark:'#1e2932',panel:'#304351',soft:'#e7eff2',ink:'#283b48',light:'#ffffff'},
 rose:{label:'زرشکی',accent:'#ad4057',dark:'#461e30',panel:'#65263b',soft:'#ffe3eb',ink:'#6b2f3f',light:'#ffffff'}
});
const templates=Object.freeze({modern:'مدرن',classic:'رسمی',minimal:'ساده و چاپ کم‌مصرف',premium:'مجلل'});
const profiles=Object.freeze({
 general:{label:'تجارت عمومی',palette:'navy',unit:'تعداد',fields:[['reference','شماره مرجع'],['description','شرح معامله']]},
 gold:{label:'زرگری و طلافروشی',palette:'gold',unit:'گرام',fields:[['grossGrams','وزن ناخالص (گرام)'],['stoneGrams','وزن سنگ (گرام)'],['karat','عیار طلا'],['netGrams','وزن خالص (گرام)'],['labor','اجرت ساخت'],['rate24','نرخ طلا / گرام']]},
 pharmacy:{label:'دواخانه',palette:'emerald',unit:'بسته/عدد',fields:[['batch','شماره بچ'],['expiry','تاریخ انقضا'],['manufacturer','تولیدکننده']]},
 supermarket:{label:'سوپرمارکت و مواد غذایی',palette:'teal',unit:'عدد/کیلو',fields:[['barcode','بارکد'],['expiry','تاریخ انقضا'],['unit','واحد']]},
 mobile:{label:'موبایل و لوازم جانبی',palette:'royal',unit:'عدد',fields:[['imei','IMEI یا سریال'],['warranty','مدت ضمانت'],['model','مدل']]},
 wholesale:{label:'عمده‌فروشی',palette:'navy',unit:'کارتن/بسته',fields:[['orderNo','شماره سفارش'],['units','تعداد بسته'],['wholesaleTier','نوع قیمت عمده']]},
 distribution:{label:'شرکت توزیع',palette:'teal',unit:'بسته',fields:[['route','مسیر توزیع'],['agent','نماینده'],['delivery','تاریخ تحویل']]},
 clothing:{label:'پوشاک و بوتیک',palette:'rose',unit:'عدد',fields:[['size','سایز'],['color','رنگ'],['model','مدل']]},
 footwear:{label:'کفش و ورزشی',palette:'plum',unit:'جفت',fields:[['size','سایز'],['brand','برند'],['color','رنگ']]},
 bookstore:{label:'کتاب و لوازم‌التحریر',palette:'royal',unit:'عدد',fields:[['isbn','ISBN'],['author','نویسنده'],['edition','شماره چاپ']]},
 cosmetics:{label:'آرایشی و بهداشتی',palette:'rose',unit:'عدد',fields:[['batch','شماره بچ'],['expiry','انقضا'],['volume','حجم']]},
 electronics:{label:'وسایل برقی و الکترونیکی',palette:'royal',unit:'عدد',fields:[['serial','شماره سریال'],['warranty','پایان ضمانت'],['model','مدل']]},
 furniture:{label:'مبلمان',palette:'gold',unit:'عدد/ست',fields:[['dimensions','ابعاد'],['delivery','تحویل'],['color','رنگ']]},
 hardware:{label:'ابزارفروشی',palette:'graphite',unit:'عدد/متر',fields:[['sku','کود کالا'],['unit','واحد'],['brand','برند']]},
 construction:{label:'مصالح ساختمانی',palette:'graphite',unit:'کیسه/متر',fields:[['project','نام پروژه'],['unit','واحد'],['delivery','تحویل']]},
 exchange:{label:'صرافی و تبدیل ارز',palette:'emerald',unit:'واحد ارز',fields:[['ticket','رسید صرافی'],['sourceCurrency','ارز پرداختی'],['targetCurrency','ارز دریافتی'],['sourceAmount','مبلغ پرداختی'],['rate','نرخ تبدیل'],['fee','کارمزد'],['remittance','شماره حواله']]},
 contractor:{label:'شرکت ساختمانی',palette:'graphite',unit:'متره/مرحله',fields:[['project','پروژه'],['contract','قرارداد'],['unit','واحد'],['quantity','مقدار کار'],['stage','مرحله'],['advance','پیش‌پرداخت']]},
 services:{label:'شرکت خدماتی',palette:'teal',unit:'ساعت/خدمت',fields:[['service','نوع خدمت'],['jobNo','شماره کار'],['due','موعد تکمیل']]},
 laboratory:{label:'لابراتوار طبی',palette:'emerald',unit:'خدمت',fields:[['service','نام آزمایش'],['sample','شماره نمونه'],['ref','شماره مراجعه']]},
 company:{label:'شرکت تجارتی',palette:'navy',unit:'عدد/خدمت',fields:[['contract','قرارداد'],['costCenter','مرکز هزینه'],['reference','شماره مرجع']]}
});
function safeType(x){return Object.prototype.hasOwnProperty.call(profiles,String(x))?String(x):'general'}
function clean(input,type){const raw=input&&typeof input==='object'?input:{};const trade=safeType(type),hasColor=Object.hasOwn(palettes,raw.palette),hasTemplate=Object.hasOwn(templates,raw.template);
return Object.freeze({palette:hasColor?raw.palette:profiles[trade].palette,template:hasTemplate?raw.template:'modern',showLogo:raw.showLogo!==false,showPhone:raw.showPhone!==false,showAddress:raw.showAddress!==false,showIndustry:raw.showIndustry!==false,showSignature:raw.showSignature!==false,showNotes:raw.showNotes!==false,showBalance:raw.showBalance!==false,footer:String(raw.footer||'تشکر از اعتماد شما').slice(0,100),paper:['A5','A4','80','58'].includes(raw.paper)?raw.paper:'A5'});}
const palette=(settings,type)=>palettes[clean(settings,type).palette];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function settingsHTML(raw,type){const p=profiles[safeType(type)],s=clean(raw,type);return `<section class="card settings-card z6527-studio" id="z6527StudioSettings" aria-label="طراحی و رنگ فاکتورها"><header class="z6527-head"><div><h3>🎨 طراح فاکتور ZAVI ONE</h3><p>رنگ، قالب و مشخصات فاکتور فروش، خرید و دستی برای همین فروشگاه</p></div><span class="z6527-industry-badge">${esc(p.label)}</span></header><form id="z6527StudioForm" class="z6527-studio-form"><label>رنگ فاکتور<select name="palette">${Object.entries(palettes).map(([k,v])=>`<option value="${k}" ${s.palette===k?'selected':''}>${esc(v.label)}</option>`).join('')}</select></label><label>قالب طراحی<select name="template">${Object.entries(templates).map(([k,v])=>`<option value="${k}" ${s.template===k?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>اندازه چاپ<select name="paper"><option value="A5" ${s.paper==='A5'?'selected':''}>A5 — فاکتور دستی</option><option value="A4" ${s.paper==='A4'?'selected':''}>A4</option><option value="80" ${s.paper==='80'?'selected':''}>حرارتی ۸۰ میلی‌متر</option><option value="58" ${s.paper==='58'?'selected':''}>حرارتی ۵۸ میلی‌متر</option></select></label><label class="z6527-full">پیام پایین فاکتور<input name="footer" maxlength="100" value="${esc(s.footer)}" placeholder="تشکر از اعتماد شما"></label><div class="z6527-options">${[['showLogo','لوگوی فروشگاه'],['showPhone','شماره تماس'],['showAddress','آدرس'],['showIndustry','مشخصات صنف'],['showSignature','جای امضا'],['showNotes','توضیحات'],['showBalance','باقی‌مانده حساب']].map(([k,label])=>`<label><input type="checkbox" name="${k}" ${s[k]?'checked':''}> ${label}</label>`).join('')}</div><div class="z6527-preview" id="z6527DesignPreview" aria-label="پیش‌نمایش رنگ و قالب">${previewHTML(s,type)}</div><div class="z6527-actions"><button class="btn primary" type="submit">✓ ذخیره طراحی فاکتورها</button><button class="btn subtle" type="button" id="z6527ResetDesign">قالب پیشنهادی صنف</button><a class="btn subtle" href="./invoice.html" target="_blank" rel="noopener">پیش‌نمایش فاکتور دستی</a></div><p class="tiny-note">این تغییر فقط ظاهر و اطلاعات نمایشی فاکتور را تغییر می‌دهد؛ مبلغ، بدهی و موجودی کالا دست‌نخورده می‌ماند. در فاکتور هر صنف، مشخصات ثبت‌شده همان معامله نمایش داده می‌شود، نه مقادیر فرضی.</p></form></section>`}
function previewHTML(settings,type){const s=clean(settings,type),c=palette(s,type),p=profiles[safeType(type)];return `<div class="z6527-preview-paper" data-template="${s.template}" style="--inv-accent:${c.accent};--inv-dark:${c.dark};--inv-soft:${c.soft};--inv-ink:${c.ink}"><div class="z6527-preview-top"><b>ZAVI ONE</b><span>${esc(p.label)}</span></div><div class="z6527-preview-title">فاکتور فروش · SALES INVOICE</div><div class="z6527-preview-row"><span>مشتری: نمونه</span><span>شماره: DEMO</span></div><div class="z6527-preview-table"><b>محصول / خدمت</b><span>${esc(p.unit)}</span><span>مبلغ</span></div><div class="z6527-preview-row"><span>نمونه آزمایشی</span><span>۱</span><span>—</span></div><div class="z6527-preview-foot">${esc(s.footer)}</div></div>`}
function industryFields(type){return profiles[safeType(type)].fields}
return Object.freeze({profiles,palettes,templates,safeType,clean,palette,esc,settingsHTML,previewHTML,industryFields});
});
