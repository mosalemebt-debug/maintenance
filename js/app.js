/* التشغيل والتنقل والرسم (init / nav / render) */
/* إعادة رسم مؤجّلة: عشرات مستمعات Firestore بتنادي الرسم مع بعض، فنجمعهم في رسمة واحدة */
let _rq=0;
function renderSoon(){if(_rq)return;_rq=setTimeout(()=>{_rq=0;render()},80)}
async function init(){
  nav();render();
  try{db=wrapDb(await claude.use('db'))}catch(e){db=null}
  if(!db){$('#main').insertAdjacentHTML('afterbegin','<div class="card s-bad">تعذر الاتصال بقاعدة البيانات؛ راجع إعدادات firebase-config.js.</div>');return}
  if(window.ROLE==='entry'){tab='e_round';nav();render();return}
  db.collection('inbox').onSnapshot(s=>procInbox(s.docs.map(d=>({id:d.id,o:d.data()}))));
  const t=setTimeout(()=>{},10000);
  db.collection('notices').onSnapshot(s=>{notices=s.docs.map(d=>normN({id:d.id,...d.data()})).sort((a,b)=>a.n-b.n);clearTimeout(t);renderSoon()});
  db.collection('purchases').onSnapshot(s=>{purchases=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.k-b.k);renderSoon()});
  db.collection('rounds').onSnapshot(s=>{rounds={};s.docs.forEach(d=>rounds[d.id]=d.data());renderSoon()});
  db.collection('settings').onSnapshot(s=>{settings={};s.docs.forEach(d=>settings[d.id]=d.data());applyAssetLists();renderSoon()});
  db.collection('auditLog').onSnapshot(s=>{auditLog=s.docs.map(d=>d.data()).sort((a,b)=>String(b.at).localeCompare(String(a.at)));renderSoon()});
  db.collection('jobsheets').onSnapshot(s=>{jobsheets=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>num(a.no)-num(b.no));renderSoon()});
  db.collection('assetLog').onSnapshot(s=>{assetLog=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.at).localeCompare(String(a.at)));renderSoon()});
  db.collection('assets').onSnapshot(s=>{assets=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.code).localeCompare(String(b.code),'en',{numeric:true}));renderSoon()});
  db.collection('stock').onSnapshot(s=>{stock=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));renderSoon()});
}
const NAVG=[['الرئيسية',[['daily','المتابعة اليومية']]],['التشغيل',[['round','المرور اليومي'],['notices','الصيانة العلاجية'],['jobsheets','JobSheet']]],['الأصول والمشتريات',[['purch','طلبات الشراء'],['adash','لوحة الأصول'],['assets','سجل الأصول'],['acassets','أصول التكييف'],['stock','المخزن']]],['التقارير',[['reports','التقارير']]],['النظام',[['audit','سجل التعديلات'],['backup','نسخ احتياطي']]]];
const lastTab={};
function badges(){
  const o={};try{o.notices=notices.filter(n=>n.status!=='تم الإصلاح').length;o.stock=stock.filter(x=>+x.qty<=+x.min).length;o.purch=purchases.filter(p=>p.status!=='تم التركيب').length;o.jobsheets=jobsheets.filter(j=>['صادر','قيد التنفيذ'].includes(j.status)).length}catch(e){}
  return o;
}
function nav(){
  const hd=document.getElementById('hdate');if(hd)hd.textContent=DAYS[new Date().getDay()]+' '+dFmt(ymd(new Date()));
  if(window.ROLE==='entry'){$('#nav').innerHTML='<div class="nt">'+[['e_round','مرور يومي'],['e_notice','إخطار جديد'],['e_purch','طلب شراء']].map(([k,v])=>`<button class="${tab===k?'on':''}" onclick="tab='${k}';nav();render();window.scrollTo(0,0)">${v}</button>`).join('')+'</div>';return}
  const bd=badges();const bg=n=>n?`<span class="bg">${n}</span>`:'';
  const MAIN=['daily','round','notices','purch','assets','stock'],NM={};
  NAVG.forEach(([g,l])=>l.forEach(([k,v])=>NM[k]=v));
  const more=Object.keys(NM).filter(k=>!MAIN.includes(k));
  $('#nav').innerHTML=`<div class="nt">${MAIN.map(k=>`<button class="${tab===k?'on':''}" onclick="go('${k}')">${NM[k]}${bg(bd[k])}</button>`).join('')}<select class="${more.includes(tab)?'on':''}" onchange="if(this.value)go(this.value)"><option value="">المزيد ▾</option>${more.map(k=>`<option value="${k}" ${tab===k?'selected':''}>${NM[k]}${bd[k]?' ('+bd[k]+')':''}</option>`).join('')}</select></div>`;
}
function goGroup(i){tab=lastTab[i]||NAVG[i][1][0][0];nav();render();window.scrollTo(0,0)}
function go(t){tab=t;nav();render();window.scrollTo(0,0)}
function toggleForm(){const on=document.body.classList.toggle('showf');if(on){const f=document.querySelector('.addf');if(f)f.scrollIntoView({behavior:'smooth',block:'start'})}}
function goForm(t){go(t);document.body.classList.add('showf');const f=document.querySelector('.addf');if(f)f.scrollIntoView()}
let nAll=false,nf={q:'',fl:'',lc:'',st:'',pr:'',late:false},af={q:'',t:'',st:'',lv:'',dc:''},pf2={q:'',st:'',fin:''};
function liveFilter(el,obj,key){obj[key]=el.type==='checkbox'?el.checked:el.value;const id=el.id,pos=el.selectionStart;window.forceR=true;render();window.forceR=false;const e=document.getElementById(id);if(e){e.focus();try{e.setSelectionRange(pos,pos)}catch(_){}}}
const norm=v=>String(v??'').toLowerCase();
function nFilterBar(){
  const L=notices.filter(nfOK).length;
  return `<div class="card"><div class="fbar"><label style="flex:2 1 200px">بحث (رقم، قسم، عطل، ممثل...)<input id="q_n" data-keep="1" value="${esc(nf.q)}" oninput="liveFilter(this,nf,'q')"></label><label>الدور<select id="fl_n" onchange="liveFilter(this,nf,'fl')"><option value="">الكل</option>${nFloors().map(x=>`<option ${nf.fl===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>المكان<input id="lc_n" list="nlocs" data-keep="1" placeholder="مثال: 107 أو حمام" value="${esc(nf.lc)}" oninput="liveFilter(this,nf,'lc')"></label><datalist id="nlocs">${[...new Set(notices.map(n=>String(n.loc||'').trim()).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">`).join('')}</datalist><label>الحالة<select id="s_n" onchange="liveFilter(this,nf,'st')"><option value="">الكل</option><option value="__open" ${nf.st==='__open'?'selected':''}>المفتوحة فقط</option>${ST.map(x=>`<option ${nf.st===x?'selected':''}>${x}</option>`).join('')}</select></label><label>الأولوية<select id="pri_n" onchange="liveFilter(this,nf,'pr')"><option value="">الكل</option>${PR.map(x=>`<option ${nf.pr===x?'selected':''}>${x}</option>`).join('')}</select></label><label style="flex-direction:row;align-items:center;gap:4px;flex:0 0 auto"><input id="l_n" type="checkbox" style="width:auto;min-height:0" ${nf.late?'checked':''} onchange="liveFilter(this,nf,'late')"> المتأخرة فقط</label><button class="btn sm alt" onclick="nAll=!nAll;render()">${nAll?'عرض مختصر':'عرض كل الأعمدة'}</button><button class="btn sm alt" onclick="nf={q:'',fl:'',lc:'',st:'',pr:'',late:false};render()">مسح الفلاتر</button><span class="msg">عرض ${L} من ${notices.length}</span></div></div>`;
}
function nfOK(n){
  if(nf.st==='__open'?n.status==='تم الإصلاح':(nf.st&&n.status!==nf.st))return false;
  const si=slaInfo(n);if(nf.pr&&si.pr!==nf.pr)return false;if(nf.late&&!si.over)return false;
  if(nf.fl&&nFloor(n)!==nf.fl)return false;
  if(nf.lc){const a=n.asset?assetByCode(n.asset):null;if(!norm([n.loc,a&&a.loc].join(' ')).includes(norm(nf.lc.trim())))return false}
  if(nf.q){const t=norm([n.ref,n.dept,n.loc,n.details,n.action,n.rep,n.reporter,n.asset,n.notes].join(' '));if(!t.includes(norm(nf.q)))return false}return true;
}
function pFilterBar(){return `<div class="card"><div class="fbar"><label style="flex:2 1 200px">بحث (صنف، إخطار...)<input id="q_p" data-keep="1" value="${esc(pf2.q)}" oninput="liveFilter(this,pf2,'q')"></label><label>الحالة<select id="s_p" onchange="liveFilter(this,pf2,'st')"><option value="">الكل</option>${PST.map(x=>`<option ${pf2.st===x?'selected':''}>${x}</option>`).join('')}</select></label><label>اعتماد المالية<select id="f_p" onchange="liveFilter(this,pf2,'fin')"><option value="">الكل</option><option value="__none" ${pf2.fin==='__none'?'selected':''}>لم يُرسل للمالية</option>${FST.map(x=>`<option ${pf2.fin===x?'selected':''}>${x}</option>`).join('')}</select></label></div></div>`}
const pfOK=p=>{if(pf2.st&&p.status!==pf2.st)return false;if(pf2.fin&&(pf2.fin==='__none'?p.fin:p.fin!==pf2.fin))return false;return !pf2.q||norm([p.item,p.ref,p.notes,p.code].join(' ')).includes(norm(pf2.q))};
function dupBanner(){
  const d=[...new Set(notices.map(n=>n.ref).filter((r,i,a)=>r&&a.indexOf(r)!==i))];
  return d.length?`<div class="card s-bad"><b>⚠ أرقام إخطارات مكررة: ${d.slice(0,6).join('، ')}</b> <span class="msg" style="color:inherit">ده بيحصل لو اتسجلت إخطارات على جهازين بدون إنترنت. راجعهم وعدّل أو احذف المكرر.</span> <button class="btn sm" onclick="nf.q='${d[0]}';go('notices')">عرض</button></div>`:'';
}
function qa(){return `<div class="card"><div class="fbar qa"><button class="btn" onclick="go('round')">ادخل مرور اليوم</button><button class="btn alt" onclick="goForm('notices')">إخطار جديد</button><button class="btn alt" onclick="goForm('purch')">طلب شراء</button><button class="btn alt" onclick="go('assets')">سجل الأصول</button></div></div>`}
function render(){
  if(!window.forceR&&document.activeElement&&['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&document.activeElement.dataset.keep)return;
  if(window._lt!==tab){document.body.classList.remove('showf');window._lt=tab}
  const keepV={};document.querySelectorAll('#main input[id],#main select[id],#main textarea[id]').forEach(e=>{if(/^(f|p|as|st|ni|nq)_/.test(e.id)&&e.value!=='')keepV[e.id]=e.value});
  const wy=window.scrollY,ws=[...document.querySelectorAll('.wrap:not(#rep)')].map(w=>[w.scrollTop,w.scrollLeft]);
  $('#main').innerHTML=({round:vRound,notices:vNotices,purch:vPurch,reports:vReports,daily:vDaily,backup:vBackup,audit:vAudit,adash:vADash,assets:vAssets,acassets:vACAssets,stock:vStock,jobsheets:vJobs,e_round:vERound,e_notice:vENotice,e_purch:vEPurch})[tab]();
  document.querySelectorAll('textarea').forEach(fit);
  labelize();
  Object.entries(keepV).forEach(([id,v])=>{const e=document.getElementById(id);if(e&&e.tagName!=='BUTTON')e.value=v});
  document.querySelectorAll('.wrap:not(#rep)').forEach((w,i)=>{if(ws[i]){w.scrollTop=ws[i][0];w.scrollLeft=ws[i][1]}});
  window.scrollTo(0,wy);
  nav();
  const fb=document.getElementById('fab');if(fb)fb.style.display=document.querySelector('.addf')?'flex':'none';
}
function labelize(){
  document.querySelectorAll('main table').forEach(t=>{
    if(t.closest('#rep')||!t.rows.length||t.rows[0].cells[0].tagName!=='TH')return;
    t.classList.add('rt');const hs=[...t.rows[0].cells].map(c=>c.textContent.trim());
    [...t.rows].slice(1).forEach(r=>{if(r.cells.length===hs.length)[...r.cells].forEach((c,i)=>c.dataset.l=hs[i])});
  });
}
function fit(t){t.style.height='auto';t.style.height=t.scrollHeight+'px'}
const DEV=localStorage.getItem('devtag')||(()=>{const t=Math.random().toString(36).slice(2,5);localStorage.setItem('devtag',t);return t})();
const uid=(p,n)=>p+String(n).padStart(4,'0')+'-'+DEV;
let lastN=0,lastK=0;
const nextN=()=>(lastN=Math.max(lastN,...notices.map(n=>n.n))+1);
const nextK=()=>(lastK=Math.max(+lastK||0,...purchases.map(p=>+p.k||0))+1);
async function addNotice(o){
  const n=nextN(),d={n,ref:ref(n),status:'',...o};if(!d.prio)d.prio=autoPrio(d.dept,d.details);
  notices.push({id:uid('n',n),...d});
  await db.collection('notices').doc(uid('n',n)).set(d);
}
