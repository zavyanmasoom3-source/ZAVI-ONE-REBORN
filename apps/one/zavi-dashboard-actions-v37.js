/* V37: decorative but REAL quick-action controls, bound to original action handlers.
   No transactions are created automatically, and no auth/DB paths are touched. */
(()=>{'use strict';
const words={
 'fa-AF':[['فروش جدید','صدور فاکتور فروش'],['خرید جدید','ثبت فاکتور خرید'],['دریافت وجه','از مشتری'],['پرداخت وجه','به تأمین‌کننده']],
 'ps-AF':[['نوی پلور','د پلور بل جوړول'],['نوې پېرودنه','د پېرود بل جوړول'],['پیسې ترلاسه کول','له پېرودونکي'],['پیسې ورکول','عرضه کوونکي ته']],
 en:[['New sale','Create sales invoice'],['New purchase','Create purchase invoice'],['Receive payment','From a customer'],['Make payment','To a supplier']]
};
const actions=[['sale','sale','🛒'],['purchase','purchase','🛍'],['customer_payment','receive','↗'],['supplier_payment','pay','↙']];
function paint(){const root=document.getElementById('content');if(!root)return;const welcome=root.querySelector(':scope > .welcome');if(!welcome||root.querySelector(':scope > .zavi-v37-actions'))return;
 const raw=document.documentElement.lang;
 const lang=raw==='en'?'en':raw==='ps-AF'||raw==='ps'?'ps-AF':'fa-AF';
 const panel=document.createElement('nav');panel.className='zavi-v37-actions';panel.setAttribute('aria-label',lang==='en'?'Quick actions':lang==='ps-AF'?'چټک کارونه':'عملیات سریع');
 actions.forEach(([action,cl,ico],i)=>{
  const button=document.createElement('button');button.type='button';button.className=`zavi-v37-action zavi-v37-${cl}`;button.dataset.action=action;
  const emblem=document.createElement('span');emblem.className='zavi-v37-icon';emblem.setAttribute('aria-hidden','true');emblem.innerHTML=typeof window.icon==='function'?window.icon(['sale','purchase','wallet','wallet'][i]):ico;
  const txt=document.createElement('span');const title=document.createElement('strong');title.textContent=words[lang][i][0];const sub=document.createElement('small');sub.textContent=words[lang][i][1];txt.append(title,sub);button.append(emblem,txt);panel.appendChild(button);
 });
 welcome.insertAdjacentElement('afterend',panel);
}
let waiting=false;function schedule(){if(waiting)return;waiting=true;requestAnimationFrame(()=>{waiting=false;paint()})}
function init(){const root=document.getElementById('content');if(!root)return;new MutationObserver(schedule).observe(root,{childList:true});paint()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('zavi:language-changed',schedule);
})();
