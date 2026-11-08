const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname, assert=(v,msg)=>{if(!v)throw Error(msg)};
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const scan=(start,end)=>app.slice(app.indexOf(start),app.indexOf(end,app.indexOf(start)));
const part=scan('function adminDashboardCounts(){','function renderCustomers(){');
let rows=[{workspace_id:'r1',workspace_name:'فروشگاه نمونه',owner_email:'example@example.com',plan:'annual',status:'active',expires_at:new Date(Date.now()+360*86400000).toISOString(),last_paid_at:new Date().toISOString(),last_amount:900,last_currency:'AFN'},{workspace_id:'r2',workspace_name:'فروشگاه دوم',owner_email:'example2@example.com',plan:'none',status:'pending',last_amount:null},{workspace_id:'r3',workspace_name:'فروشگاه سوم',owner_email:'example3@example.com',plan:'semiannual',status:'active',expires_at:new Date(Date.now()-3*86400000).toISOString(),last_amount:400}];
const ctx={rows,mode:'demo',Date,Math,Number,console,faDigits:x=>String(x),status:r=>r.plan==='none'?['pending','در انتظار']:(r.expires_at&&new Date(r.expires_at)<new Date())?['expired','منقضی']:['active','فعال'],escapeHTML:x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;'),shortDate:x=>String(x).slice(0,10),money:(n,c)=>`${n} ${c}`,statLabel:r=>`<span>${r.plan}</span>`,heading:(a,b)=>`<header>${a} ${b}</header>`};
vm.createContext(ctx);vm.runInContext(part,ctx,{timeout:1000});
const counts=vm.runInContext('adminDashboardCounts()',ctx);assert(counts.all===3&&counts.active===1&&counts.pending===1&&counts.expired===1,'invalid counts');
for(const fn of ['renderOverview','renderDevices','renderSupport','renderActivity','renderHealth','renderSecurity']){
 const result=vm.runInContext(fn+'()',ctx,{timeout:1000});assert(typeof result==='string'&&result.length>100,'empty '+fn);assert(result.includes('<'),'no markup '+fn);console.log(fn,'OK',result.length);
}
assert(html.includes('zavi-admin-next-v1.css')&&html.includes('zavi-admin-next-v1.js'),'UI assets not linked');
assert(html.includes('zaviAdminSplash')&&html.includes('admin-mobile-nav'),'UI elements missing');
assert(app.includes("const ZAVI_ADMIN_ALLOWED_EMAILS=new Set(['zavyanmasoom6@gmail.com']);"),'owner gate missing');
assert(app.includes("['localhost','127.0.0.1'].includes(location.hostname)"),'public demo not gated');
assert(!html.includes('hamedzavyan8@gmail.com'),'secondary admin exposed');
assert(manifest.name==='ZAVI ONE ADMIN','manifest wrong');
console.log('PASS: 6 section renderings, status aggregation, logo splash, navigation, login restrictions, demo gate, manifest.');
