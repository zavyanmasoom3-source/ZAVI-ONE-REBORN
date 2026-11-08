/* ZAVI ONE V65.76 — customer profile and compact settings.
 * User photo/display-name are device-local PERSONAL preferences only.
 * Do not modify accounting data, customer/legal identity, invoices, security roles,
 * offline lease, or server-synchronised workspace records.
 */
(()=>{'use strict';
const q=(s,p=document)=>p.querySelector(s);
const mk=(tag,cl,text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=String(text);return e};
const language=()=>{const l=(document.documentElement.lang||'fa-AF').toLowerCase();return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa'};
const dict={
 fa:{title:'پروفایل شخصی من',description:'نام و عکس خود را برای نمایش کوچک در داشبورد انتخاب کنید.',name:'نام نمایشی',namePlaceholder:'نام خود را بنویسید',photo:'انتخاب عکس',deletePhoto:'حذف عکس',save:'ذخیره پروفایل',saved:'پروفایل شخصی ذخیره شد.',unavailable:'برای ذخیره پروفایل وارد حساب ابری فروشگاه شوید.',limit:'این عکس و نام فقط در همین دستگاه برای حساب شما محفوظ می‌شود؛ اطلاعات فاکتور و نام رسمی فروشگاه تغییر نمی‌کند.',badPhoto:'عکس JPG، PNG یا WebP تا ۵ مگابایت انتخاب کنید.',badName:'نام را بین ۲ تا ۵۰ حرف وارد کنید.',badSave:'حافظۀ دستگاه برای این عکس کافی نیست.',business:'فروشگاه و نوع تجارت',appearance:'ظاهر، زبان و فونت',finance:'حساب‌ها و ارز',documents:'فاکتور و ابزارها',security:'امنیت و پشتیبان',advanced:'تنظیمات پیشرفته',sectionHelp:'برای دیدن گزینه‌ها این بخش را باز کنید.',hello:'سلام'},
 en:{title:'My personal profile',description:'Choose your name and picture to appear discreetly on your dashboard.',name:'Display name',namePlaceholder:'Your name',photo:'Choose picture',deletePhoto:'Remove picture',save:'Save profile',saved:'Your personal profile has been saved.',unavailable:'Sign in to your store cloud account to save a personal profile.',limit:'This name and photo are stored on this device for your account only. They do not change invoices or the store legal name.',badPhoto:'Choose JPG, PNG or WebP under 5 MB.',badName:'Use 2 to 50 characters for your name.',badSave:'Could not save the photo to device storage.',business:'Store & industry',appearance:'Appearance & language',finance:'Accounts & currency',documents:'Invoices & tools',security:'Security & backups',advanced:'Advanced settings',sectionHelp:'Open to see more options.',hello:'Hello'},
 ps:{title:'زما شخصي پروفایل',description:'خپل نوم او عکس وټاکئ چې په داشبورډ کې په کوچنۍ بڼه ښکاره شي.',name:'ښکاره نوم',namePlaceholder:'خپل نوم ولیکئ',photo:'عکس وټاکئ',deletePhoto:'عکس لرې کړئ',save:'پروفایل خوندي کړئ',saved:'شخصي پروفایل خوندي شو.',unavailable:'د پروفایل لپاره خپل کلاوډ حساب ته ننوځئ.',limit:'نوم او عکس یوازې پر دې وسیله ستاسو د حساب لپاره خوندي کېږي. رسمي اسناد نه بدلوي.',badPhoto:'تر ۵ MB پورې JPG، PNG یا WebP عکس وټاکئ.',badName:'نوم له ۲ تر ۵۰ تورو ولیکئ.',badSave:'په وسیله کې د عکس ساتلو ځای نشته.',business:'دوکان او سوداګري',appearance:'بڼه، ژبه او فونټ',finance:'حسابونه او اسعار',documents:'بلونه او وسایل',security:'امنیت او بیک اپ',advanced:'نور تنظیمات',sectionHelp:'د نورو اختیارونو لپاره یې پرانیزئ.',hello:'سلام'}
};
const t=()=>dict[language()];
const MAX_INPUT=5*1024*1024;
const prefix='zavi_v6576_personal_user_profile_';
const valid=id=>typeof id==='string'&&/^[0-9a-zA-Z_-]{8,128}$/.test(id);
/* Offline-capable, per-installation profile. Authenticated accounts stay tenant-scoped. */
const scope=()=>{
 try{
  const ctx=window.zaviCloudRestoreInfo?.()||{};
  const signed=window.zaviCloudGetAuthSession?.()?.user?.id||'';
  const ws=ctx.workspace||'';
  if(valid(signed)&&valid(ws))return {uid:signed,ws,key:prefix+signed+'_'+ws};
  let device=localStorage.getItem('zavi_v6577_local_profile_id');
  if(!valid(device)){
   device='local_'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().replaceAll('-',''):Math.random().toString(36).slice(2)+Date.now().toString(36));
   localStorage.setItem('zavi_v6577_local_profile_id',device);
  }
  return {uid:device,ws:valid(ws)?ws:'device',key:prefix+device+'_'+(valid(ws)?ws:'device')};
 }catch(_){return null}
};
const current=()=>{const s=scope();if(!s)return null;try{const x=JSON.parse(localStorage.getItem(s.key)||'null');if(!x||x.version!==1||typeof x.name!=='string'||x.name.length>50||typeof x.photo!=='string'||(x.photo&&!/^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(x.photo))||x.photo.length>110000)return null;return x}catch(_){return null}};
const safeText=(x)=>String(x||'').replace(/[\u0000-\u001F\u007F<>]/g,'').trim().slice(0,50);
const toast=msg=>{const z=q('#toast');if(z)z.textContent=msg;else console.warn(msg)};
let draftPhoto='',dirtyPhoto=false,activeScope='',updating=false;
const initials=name=>safeText(name).split(/\s+/).map(s=>Array.from(s)[0]||'').slice(0,2).join('')||'👤';
function face(name,src,cls){
 const box=mk('span',cls||'z76-avatar');
 if(src){const image=mk('img');image.alt='';image.decoding='async';image.src=src;image.referrerPolicy='no-referrer';box.append(image)}
 else box.append(mk('span','z76-initials',initials(name)));
 return box;
}
function localName(){
 const r=current();
 const user=window.zaviCloudGetAuthSession?.()?.user;
 return safeText(r?.name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||(language()==='en'?'My profile':language()==='ps'?'زما پروفایل':'پروفایل من'));
}
function chip(){
 const r=current(),label=localName();
 if(!scope()||!label)return null;
 const b=mk('div','z76-profile-chip');b.id='z76-dash-profile';b.setAttribute('aria-label',t().title);
 b.append(face(label,r?.photo,'z76-small-avatar'));
 const text=mk('span','z76-chip-name',label);text.title=label;b.append(text);
 return b;
}
function dashboard(){
 const content=q('#content');if(!content)return;
 const welcome=q('.welcome',content);const existing=q('#z76-dash-profile',content);
 if(!welcome){existing?.remove();return}
 const s=scope(),r=current(),mark=(s?.key||'')+'|'+(r?.name||'')+'|'+(r?.photo?.length||0)+'|'+language();
 if(existing?.dataset.mark===mark)return;
 existing?.remove();const next=chip();if(!next)return;next.dataset.mark=mark;
 const heading=q('.welcome > div:first-child',content);(heading||welcome).prepend(next);
}
async function compressImage(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>MAX_INPUT)throw Error('badPhoto');
 let bmp=null;
 try{
  if(typeof createImageBitmap==='function')bmp=await createImageBitmap(file);
  else bmp=await new Promise((resolve,reject)=>{
   const im=new Image(),url=URL.createObjectURL(file);
   im.onload=()=>{URL.revokeObjectURL(url);resolve(im)};
   im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('badPhoto'))};im.src=url;
  });
  const w=bmp.width||bmp.naturalWidth,h=bmp.height||bmp.naturalHeight;
  if(!(w>0&&h>0))throw Error('badPhoto');
  const side=144,cv=document.createElement('canvas');cv.width=cv.height=side;
  const c=cv.getContext('2d');if(!c)throw Error('badSave');
  const scale=Math.max(side/w,side/h);
  c.drawImage(bmp,(side-w*scale)/2,(side-h*scale)/2,w*scale,h*scale);
  const data=cv.toDataURL('image/jpeg',.72);
  if(data.length>110000)throw Error('badSave');
  return data;
 }finally{try{bmp?.close?.()}catch(_){}}
}
function profileCard(){
 const card=mk('section','z76-profile-card');card.id='z76-profile-card';
 card.setAttribute('aria-label',t().title);
 const title=mk('div','z76-profile-head');
 title.append(mk('h3','',t().title),mk('p','',t().description));
 const record=current(),name=localName();
 const line=mk('div','z76-profile-editor');
 const preview=face(name,record?.photo||'','z76-large-avatar');preview.id='z76-face-preview';
 const main=mk('div','z76-profile-fields'),label=mk('label','z76-field-label',t().name);
 label.htmlFor='z76-profile-name';
 const input=mk('input','z76-profile-input');input.id='z76-profile-name';input.type='text';input.maxLength=50;input.autocomplete='nickname';input.value=record?.name||name;input.placeholder=t().namePlaceholder;
 main.append(label,input);line.append(preview,main);
 const actions=mk('div','z76-profile-actions');
 const choose=mk('label','z76-button z76-button-secondary',t().photo),file=mk('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.id='z76-photo-file';file.hidden=true;choose.append(file);
 const remove=mk('button','z76-button z76-button-secondary',t().deletePhoto);remove.type='button';
 const save=mk('button','z76-button z76-button-primary',t().save);save.type='button';
 const warning=mk('p','z76-profile-notice',t().limit);warning.setAttribute('role','status');
 const enabled=!!scope();input.disabled=!enabled;file.disabled=!enabled;remove.disabled=!enabled;save.disabled=!enabled;
 if(!enabled)warning.textContent=t().unavailable;
 draftPhoto=record?.photo||'';dirtyPhoto=false;
 const resetPreview=()=>{preview.replaceChildren(...face(input.value,draftPhoto,'z76-large-avatar').childNodes)};
 file.addEventListener('change',async()=>{
  const f=file.files?.[0];if(!f)return;
  try{const data=await compressImage(f);if(!card.isConnected)return;draftPhoto=data;dirtyPhoto=true;resetPreview()}
  catch(err){warning.textContent=t()[err.message]||t().badPhoto}
  finally{file.value=''}
 });
 remove.addEventListener('click',()=>{draftPhoto='';dirtyPhoto=true;resetPreview()});
 input.addEventListener('input',()=>{if(!draftPhoto)resetPreview()});
 save.addEventListener('click',()=>{
  const s=scope();if(!s){warning.textContent=t().unavailable;return}
  const value=safeText(input.value);
  if(Array.from(value).length<2){warning.textContent=t().badName;return}
  const obj={version:1,name:value,photo:draftPhoto,updated_at:new Date().toISOString()};
  try{localStorage.setItem(s.key,JSON.stringify(obj));warning.textContent=t().saved;dirtyPhoto=false;dashboard()}
  catch(_){warning.textContent=t().badSave}
 });
 actions.append(choose,remove,save);
 card.append(title,line,actions,warning);
 return card;
}
const classify=(card)=>{
 const h=card.querySelector('h3,h2,.settings-card-title')?.textContent?.toLowerCase()||'';
 const s=(h+' '+(card.className||'')).toLowerCase();
 if(/z637-customize|شخصی‌سازی|شخصی سازی|zavi-custom-card|z6515-font|theme|زبان|language|فونت|ظاهر|تم|رنگ|animation|حرکت/.test(s))return 'appearance';
 if(/account|usd|دالر|ارز|نقد|بانک|حواله|سرمایه|exchange|currency/.test(s))return 'finance';
 if(/shopform|store|rename|فروشگاه|دوکان|تجارت|مدیریت عمومی|کسب‌وکار|industry|نوع کسب/.test(s)||card.querySelector('#shopForm'))return 'business';
 if(/receipt|print|invoice|فاکتور|رسید|چاپ|csv|excel|پرنتر/.test(s))return 'documents';
 if(/backup|security|encrypt|pass|audit|health|پشتیبان|امنیت|رمز|سلامت|بازنشانی/.test(s))return 'security';
 return 'advanced';
};
const categories=['business','appearance','finance','documents','security','advanced'];
function reorganize(){
 const content=q('#content');if(!content)return;
 if(!q('#shopForm',content)&&!q('.settings-card',content)){q('#z76-profile-card',content)?.remove();return}
 let personal=q('#z76-profile-card',content);
 if(!personal){personal=profileCard();
  const lead=q('#z74-workspace',content);
  if(lead)lead.before(personal);else {
    const first=Array.from(content.children).find(x=>x.matches?.('section.settings-card'));
    if(first)first.before(personal);else content.prepend(personal);
  }
 }
 const cards=Array.from(content.children).filter(x=>x.matches?.('section.settings-card,div.settings-card,section.z6524-launch'));
 let groups=q('#z76-settings-groups',content);
 if(!cards.length&&!groups)return;
 if(!groups){groups=mk('div','z76-settings-groups');groups.id='z76-settings-groups';
  const anchor=q('#z74-workspace',content)||personal;anchor.after(groups);
 }
 const grouped=Object.fromEntries(categories.map(x=>[x,[]]));
 for(const card of cards)grouped[classify(card)].push(card);
 for(const id of categories){
  if(!grouped[id].length)continue;
  let group=q('[data-z76-group="'+id+'"]',groups);
  if(!group){
   group=mk('details','z76-settings-group');group.dataset.z76Group=id;
   if(id==='business')group.open=true;
   const summary=mk('summary','z76-group-title');
   const labels={business:'🏬',appearance:'🎨',finance:'💱',documents:'🧾',security:'🔐',advanced:'⚙️'};
   summary.append(mk('span','',labels[id]+' '+t()[id]),mk('span','z76-group-count',''));
   const body=mk('div','z76-group-body');group.append(summary,body);
   groups.append(group);
  }
  const body=q('.z76-group-body',group);
  grouped[id].forEach(card=>body.append(card));
  q('.z76-group-count',group).textContent=String(body.children.length);
 }
 // The industry picker belongs with shop settings rather than on top of all settings.
 const industry=q('#z74-workspace',content);
 const shopBody=q('[data-z76-group="business"] .z76-group-body',groups);
 if(industry&&shopBody){shopBody.prepend(industry);
  const g=q('[data-z76-group="business"] .z76-group-count',groups);
  if(g)g.textContent=String(shopBody.children.length);
 }
}
function sync(){
 const content=q('#content');if(!content)return;
 if(q('#shopForm',content)||q('.settings-card',content))reorganize();else dashboard();
}
let queued=false;
function mount(){
 const content=q('#content');if(!content)return;
 const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync()});
 });
 observer.observe(content,{childList:true,subtree:false});
 ['zavi-cloud-session-changed','zavi-cloud-workspace-selected','zavi-business-updated'].forEach(x=>window.addEventListener(x,()=>{q('#z76-profile-card')?.remove();sync()}));
 window.addEventListener('storage',e=>{if(e.key?.startsWith(prefix)){q('#z76-profile-card')?.remove();sync()}});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();