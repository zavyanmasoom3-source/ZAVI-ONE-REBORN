/* Shared invoice studio for the manually editable document. No bypasses to write permissions. */
(()=>{'use strict';
 const S=window.ZaviInvoiceStudio6527; if(!S)return;
 function auth(){try{
  const session=JSON.parse(localStorage.getItem('z20_auth_session_persistent_v23_1')||sessionStorage.getItem('z20_auth_session')||'null');
  const ws=JSON.parse(localStorage.getItem('z20_workspace_id')||'null'),uid=session?.user?.id;
  const meta=JSON.parse(localStorage.getItem('z20_workspace_offline_metadata_v31_'+ws)||'null');
  if(!uid||!ws||meta?.id!==ws||meta?.owner_uid!==uid||meta?.user_uid!==uid)return null;
  const db=JSON.parse(localStorage.getItem('zavi_v34_tenant_'+uid+'_'+ws)||'null');if(!db||!Array.isArray(db.tx))return null;
  let type=localStorage.getItem('zavi_v638_business_type_'+uid+'_'+ws);
  if(!S.profiles[type])for(const prefix of ['zavi_v47_business_draft_','zavi_v47_business_snapshot_']){
   try{const data=JSON.parse(localStorage.getItem(prefix+uid+'_'+ws)||'null');if(data?.owner_uid===uid&&data?.workspace_id===ws&&S.profiles[data?.data?.business_type]){type=data.data.business_type;break}}catch(_){}}
  return {db,type:S.safeType(type)};
 }catch(_){return null}}
 function init(){
  const context=auth(),base=context?.db||null;let type=context?.type||'general';
  const oldId=new URLSearchParams(location.search).get('id');
  const saved=oldId?base?.manualInvoices?.find(r=>r.id===oldId):null;
  if(saved?.industryType)type=S.safeType(saved.industryType);
  const s=S.clean(saved?.invoiceDesign||base?.invoiceDesign,type),c=S.palette(s,type);
  const paper=document.querySelector('.paper');if(!paper)return;
  const root=document.documentElement;
  root.style.setProperty('--z6527-accent',c.accent);root.style.setProperty('--z6527-dark',c.dark);
  root.style.setProperty('--z6527-panel',c.panel);root.style.setProperty('--z6527-soft',c.soft);root.style.setProperty('--z6527-ink',c.ink);
  paper.dataset.z6527Template=s.template;
  paper.dataset.z6527Paper=s.paper==='A4'?'A4':'A5';
  if(s.paper==='A4'){
    const printRules=document.createElement('style');printRules.textContent='@media print{@page{size:A4 portrait;margin:5mm}html,body{width:210mm!important;height:auto!important;overflow:visible!important}.paper[data-z6527-paper="A4"]{position:static!important;transform:none!important;zoom:1!important;width:200mm!important;max-width:200mm!important;height:auto!important;min-height:270mm!important;padding:8mm!important}}';document.head.append(printRules);
  }
  function fitMobile(){if(matchMedia('(max-width: 620px)').matches){paper.style.zoom=String(Math.min(1,Math.max(.45,(window.innerWidth-8)/(s.paper==='A4'?793.7:559.4))))}else paper.style.zoom='';}
  fitMobile();window.addEventListener('resize',fitMobile,{passive:true});
  if(!s.showLogo)paper.dataset.z6527NoLogo='1';
  if(!s.showPhone)paper.dataset.z6527NoPhone='1';
  if(!s.showAddress)paper.dataset.z6527NoAddress='1';
  if(!s.showNotes)paper.dataset.z6527HideNotes='1';
  if(!s.showSignature)paper.dataset.z6527HideSign='1';
  if(!s.showBalance)paper.dataset.z6527HideBalance='1';
  const mark=paper.querySelector('.brand .mark');if(mark&&s.showLogo){
   const data=base?.shopLogoData;let safeIcon='./zavi-one-original-logo.png';
   if(typeof data==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(data)&&data.length<1200000)safeIcon=data;
   mark.replaceChildren();const img=document.createElement('img');img.src=safeIcon;img.alt='لوگوی فروشگاه';mark.append(img);
  }
  if(base&&!oldId){for(const [name,value] of [['shop',base.storeName],['shop_phone',base.shopPhone],['address',base.shopAddress],['currency',base.currency]]){const inp=paper.querySelector(`[name="${name}"]`);if(inp&&!inp.value&&value)inp.value=String(value).slice(0,100)}}
  const profile=S.profiles[type];let kind=saved?.kind==='purchase'?'purchase':'sale';
  const sel=document.createElement('label');sel.className='z6527-manual-selector';sel.innerHTML='<span>نوع سند</span><select aria-label="نوع فاکتور"><option value="sale">فاکتور فروش</option><option value="purchase">فاکتور خرید</option></select>';
  sel.querySelector('select').value=kind;document.querySelector('.tools')?.prepend(sel);
  function changeKind(){kind=sel.querySelector('select').value;const doc=paper.querySelector('.doc');if(doc)doc.innerHTML=(kind==='purchase'?'فاکتور خرید<small>PURCHASE INVOICE</small>':'فاکتور فروش<small>SALES INVOICE</small>');}
  sel.addEventListener('change',changeKind);changeKind();
  if(s.showIndustry){
   const block=document.createElement('section');block.className='z6527-manual-extras';block.id='z6527ManualBusinessDetails';
   const title=document.createElement('strong');title.textContent='مشخصات تخصصی: '+profile.label;block.append(title);
   const grid=document.createElement('div');grid.className='z6527-manual-grid';block.append(grid);
   for(const [key,label] of profile.fields){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.name='industry_'+key;input.maxLength=75;input.placeholder='اختیاری';row.append(input);grid.append(row)}
   paper.append(block);
  }
  const footer=document.createElement('p');footer.className='z6527-manual-footer';footer.textContent=s.footer;paper.append(footer);
  const line=document.querySelector('.table th:nth-child(3)');if(line&&profile.unit!=='تعداد')line.textContent=profile.unit;
  if(context){window.ZaviInvoiceManualStyle6527=()=>({invoiceDesign:{...s},kind,industryType:type});}
  // Restore ancillary specialist values for existing invoices after the original PIN-based restore has finished.
  // The app's original restore iterates input fields; new fields are appended after all legacy fields.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
