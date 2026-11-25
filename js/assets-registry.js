/* سجل الأصول (الجدول، التفاصيل، القرارات، التصدير) */
function aFilterBar(){
  const sel=(k,l,opts)=>`<label>${l}<select onchange="liveFilter(this,af,'${k}')"><option value="">الكل</option>${opts.map(o=>`<option ${af[k]===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
  return `<div class="card"><div class="fbar"><label style="flex:2 1 200px">بحث (كود، اسم، موقع، ماركة)<input id="q_a" data-keep="1" value="${esc(af.q)}" oninput="liveFilter(this,af,'q')"></label>${sel('t','النوع',ATY.filter(t=>t!=='تكييف'))}${sel('m','الطريقة',['فردي','مجموعة'])}${sel('st','الحالة',['شغال','معطل','مُكهّن'])}${sel('dc','القرار',[...DECS,'بدون قرار'])}${sel('lc','الدور',[...new Set(locRows().map(r=>r.f))])}<label>أعطال من<input type="date" value="${af.d1||''}" onchange="liveFilter(this,af,'d1')"></label><label>إلى<input type="date" value="${af.d2||''}" onchange="liveFilter(this,af,'d2')"></label><button class="btn sm alt" onclick="af={q:'',t:'',m:'',st:'',dc:'',lc:'',d1:'',d2:''};render()">مسح الفلاتر</button></div></div>`;
}
function afOK(x){
  const a=x.a;if(af.t&&a.type!==af.t)return false;if(af.m&&(isGrp(a)?'مجموعة':'فردي')!==af.m)return false;
  if(af.st==='شغال'&&x.st!=='شغال')return false;if(af.st==='معطل'&&!x.st.startsWith('معطل'))return false;if(af.st==='مُكهّن'&&x.st!=='مُكهّن')return false;
  if(af.dc==='بدون قرار'?!!a.dec:(af.dc&&a.dec!==af.dc))return false;
  if(af.lc&&a.f!==af.lc&&!String(a.loc||'').includes(af.lc))return false;
  if((af.d1||af.d2)&&!x.ns.some(n=>{const d=String(iso(n.date));return(!af.d1||d>=af.d1)&&(!af.d2||d<=af.d2)}))return false;
  return !af.q||norm([a.code,a.name,a.loc,a.type,a.brand,a.model].join(' ')).includes(norm(af.q));
}
let aTab='';
const ATABS={
 act:{l:'أصل في الخدمة',f:x=>x.a.stat!=='مُكهّن'},
 units:{l:'المجموعات (إجمالي القطع)',f:x=>x.a.stat!=='مُكهّن'&&x.grp},
 broken:{l:'معطل الآن',f:x=>x.a.stat!=='مُكهّن'&&x.st!=='شغال'},
 planned:{l:'قرارات استبدال / تكهين مخططة',f:x=>x.a.stat!=='مُكهّن'&&(x.a.dec==='استبدال'||x.a.dec==='تكهين')},
 pcost:{l:'الاستبدال المخطط (تكلفته)',f:x=>x.a.stat!=='مُكهّن'&&x.a.dec==='استبدال'},
 dead:{l:'مُكهّن / مستبدل',f:x=>x.a.stat==='مُكهّن'}
};
let aTools=false;
function vAssets(){
  const list=assets.filter(a=>!isAC(a)).map(a=>({a,...assetStats(a)})),act=list.filter(x=>x.a.stat!=='مُكهّن'),units=act.reduce((t,x)=>t+x.qty,0),nGrp=act.filter(x=>x.grp).length;
  const broken=act.filter(x=>x.st!=='شغال').length;
  const planned=act.filter(x=>x.a.dec==='استبدال'||x.a.dec==='تكهين'),plannedCost=planned.filter(x=>x.a.dec==='استبدال').reduce((t,x)=>t+(+x.a.decCost||totVal(x.a)||0),0);
  const acs=assets.filter(a=>a.type==='تكييف'&&a.stat!=='مُكهّن'),acHP=Math.round(acs.filter(a=>a.capu==='حصان').reduce((t,a)=>t+(+a.cap||0),0)*100)/100;
  const tk=(key,cls,val,label)=>`<div class="k tabk ${cls||''} ${aTab===key?'on':''}" role="button" tabindex="0" onclick="aTab=aTab==='${key}'?'':'${key}';render()" title="اضغط لعرض بيانات هذه الحالة">${'<b>'+val+'</b>'}${label}</div>`;
  let h=`<div class="card"><div class="grid">${tk('act','',act.length,'أصل في الخدمة')}${tk('units','',units,'إجمالي القطع ('+nGrp+' مجموعة)')}${tk('broken',broken?'s-warn':'',broken,'معطل الآن')}${tk('dead','',list.length-act.length,'مُكهّن / مستبدل')}<div class="k tabk" role="button" tabindex="0" onclick="go('acassets')" title="أصول التكييف ليها صفحة مستقلة"><b>${acHP} حصان</b>أصول التكييف (${acs.length} وحدة) ← صفحة مستقلة</div></div>
  <div class="msg hint">الحالة بتتحسب تلقائياً من الصيانة العلاجية: لو فيه إخطار مفتوح مربوط بكود الأصل يظهر «معطل»، ولو اتقفل يرجع «شغال». القرار (إبقاء / مراقبة / استبدال / تكهين) بتحدده إنت من زر «قرار». <b>اضغط على أي مربع فوق لعرض أصوله، واضغط عليه تاني للرجوع لكل الأصول.</b></div>
  <div class="row" style="margin-top:8px"><button class="btn alt" onclick="exportAssets()">تصدير سجل الأصول Excel</button></div></div>`;
  h+=`<div class="card"><div class="row">${[['','كل الأصول'],['هندسي','الحصر الهندسي والمعدات'],['تجهيزات','التجهيزات والأثاث']].map(([k,l])=>`<button class="btn sm ${aSec===k?'':'alt'}" onclick="aSec='${k}';render()">${l} (${list.filter(x=>!k||secA(x.a)===k).length})</button>`).join('')}</div></div>`;
  h+=aFilterBar();
  const rows=list.filter(x=>!aSec||secA(x.a)===aSec).filter(afOK).filter(x=>!aTab||ATABS[aTab].f(x)).sort((x,y)=>(y.r12-x.r12)||String(x.a.code).localeCompare(String(y.a.code),'en',{numeric:true}));
  if(aTab)h+=`<div class="card"><div class="row" style="align-items:center"><b>المعروض: ${ATABS[aTab].l} — ${rows.length} أصل</b><button class="btn sm alt" onclick="aTab='';render()">عرض كل الأصول</button></div></div>`;
  h+=`<div class="card wrap"><table><tr>${['الكود','الاسم','النوع','الموقع','الحالة','سنة التركيب / العمر','الأعطال (12 شهر / الكل)','التكلفة (ج.م)','القرار','إجراءات'].map(x=>`<th>${x}</th>`).join('')}</tr>`;
  rows.forEach(x=>{const a=x.a,yr=yearOf(a.inst),dd=a.dec?(esc(a.dec)+(a.decDone?' ✔ نُفِّذ':'')+(a.decYear?'<div class="msg">'+a.decYear+'</div>':'')):'—';
    h+=`<tr><td><b>${esc(a.code)}</b></td><td class="l">${esc(a.name)}<div class="msg"><b>${effCond(x)}</b> · ${secA(a)} · <a href="#" onclick="assetCond('${a.id}');return false">تغيير الحالة</a></div><div class="msg">الدور: <select onchange="setFloor('${a.id}',this.value)"><option value="">— غير محدد —</option>${[...new Set(locRows().map(r=>r.f))].map(f=>`<option ${a.f===f?'selected':''}>${esc(f)}</option>`).join('')}</select></div><div class="msg">${[+a.cap?a.cap+' '+(a.capu||''):'',a.brand||''].filter(Boolean).map(esc).join(' · ')}</div>${x.grp?'<div class="msg"><b>مجموعة × '+x.qty+'</b> · سليم '+Math.max(0,x.qty-x.qf-x.qd)+' / إصلاح '+x.qf+' / تالف '+x.qd+'</div>':''}</td><td>${esc(a.type)}</td><td class="l">${esc(a.loc)}</td><td class="${x.stc}">${x.st}${aTab==='broken'&&x.open.length?'<div class="msg">'+x.open.slice(0,3).map(n=>esc(n.ref)+': '+esc(n.details)).join('<br>')+'</div>':''}</td>
    <td class="${x.age!==null&&x.age>=x.life?'s-bad':x.age!==null&&x.age>=0.8*x.life?'s-warn':''}">${yr||'—'}<div class="msg">${x.age!==null?x.age+' من '+x.life+' سنة':''}</div></td><td class="${x.r12>=3?'s-bad':x.r12===2?'s-warn':''}">${x.r12} / ${x.ns.length}</td><td>${money(x.cost)}</td>
    <td class="${a.dec==='استبدال'||a.dec==='تكهين'?'s-warn':''}">${dd}</td>
    <td><div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap"><button class="btn sm alt" onclick="assetDetail('${a.id}')">السجل</button><button class="btn sm" onclick="assetDecide('${a.id}')">قرار</button><button class="btn sm alt" onclick="newFaultFor('${esc(a.code)}')">عطل</button><button class="btn sm alt" onclick="openEdit('assets','${a.id}')">تعديل</button><button class="btn sm" style="background:#b42318" onclick="delItem('assets','${a.id}')">حذف</button></div></td></tr>`});
  h+=(rows.length?'':'<tr><td colspan="10">لا توجد أصول مطابقة</td></tr>')+'</table></div>';
  h+=`<details class="card" ${aTools||mx?'open':''} ontoggle="aTools=this.open"><summary><b>أدوات وإعدادات السجل</b> <span class="msg">(استيراد، أصل جديد، تحديد الدور بالجملة، أنواع ومواقع)</span></summary>`+vFloorBulk()+vBulkEdit()+vXlImport()+vMxImport()+`<div class="card addf"><b>أصل جديد</b><div class="msg hint">سيب الكود فاضي وهيتولّد تلقائي حسب النوع (مثلاً AC-48 أو DR-07). <b>فردي</b> = كود لكل قطعة، <b>مجموعة</b> = كود واحد لعدد من القطع المتشابهة في مكان واحد (كراسي، ستاير، كشافات...).</div><div class="row" style="margin-top:6px"><label>الكود (اختياري)<input id="as_c" data-keep="1" placeholder="تلقائي"></label><label>الاسم / الطراز<input id="as_n" data-keep="1"></label><label>النوع<select id="as_t" onchange="$('#as_m').value=GRP_TYPES.includes(this.value)?'مجموعة':'فردي'">${ATY.filter(t=>!HIDE_T.includes(t)).map(t=>`<option>${t}</option>`).join('')}</select></label><label>الطريقة<select id="as_m"><option>فردي</option><option>مجموعة</option></select></label><label>العدد (للمجموعة)<input id="as_q" type="number" min="1" data-keep="1" style="width:90px"></label><label>القدرة<input id="as_cap" type="number" step="0.25" data-keep="1" style="width:90px"></label><label>الوحدة<select id="as_cu">${CAPU.map(u=>`<option>${u}</option>`).join('')}</select></label><label>الماركة<input id="as_b" data-keep="1" style="width:110px"></label><label>سنة التركيب<input id="as_y" type="number" min="1980" max="2100" data-keep="1" style="width:90px"></label><label>الدور<select id="as_fl"><option value="">— اختر —</option>${[...new Set(locRows().map(r=>r.f))].map(f=>`<option>${esc(f)}</option>`).join('')}</select></label><label>الموقع<select id="as_lc"><option value="">— اختر —</option>${locRows().map((r,i)=>`<option value="${i}">${esc(locLbl(r))}</option>`).join('')}</select></label><label>تفصيل الموقع<input id="as_l" data-keep="1" placeholder="اختياري"></label><label>الموديل<input id="as_md" data-keep="1" style="width:110px"></label><label>المواصفات / الخامة<input id="as_sp" data-keep="1"></label><label>تاريخ الشراء / التركيب<input id="as_pd" type="date" data-keep="1"></label><label>الحالة<select id="as_cd">${CONDS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>ملاحظات<input id="as_nt" data-keep="1"></label><label>قيمة استبدال الوحدة (ج.م)<input id="as_v" type="number" data-keep="1"></label><button class="btn" onclick="assetAdd()">إضافة أصل</button></div></div>
  ${vAssetLists()}${vLocSet()}${vSecSet()}</details>`;
  return h;
}
async function assetAdd(){
  const t=$('#as_t').value,n=$('#as_n').value.trim();let c=$('#as_c').value.trim();
  if(!n){alert('اكتب اسم الأصل');return}
  if($('#as_m').value==='مجموعة'&&!((+$('#as_q').value||0)>=1)){alert('اكتب عدد القطع للمجموعة');return}
  if(!c)c=nextCodes(t,1)[0];
  if(assetByCode(c)){alert('الكود «'+c+'» مستخدم من قبل');return}
  const id='as'+Date.now()+'-'+DEV,o={code:c,name:n,type:t,cap:+$('#as_cap').value||0,capu:$('#as_cu').value,loc:locStr(),...locObj(),...($('#as_fl').value?{f:$('#as_fl').value}:{}),model:$('#as_md').value.trim(),specs:$('#as_sp').value.trim(),pdate:$('#as_pd').value,cond:$('#as_cd').value,note:$('#as_nt').value.trim(),value:+$('#as_v').value||0,brand:$('#as_b').value.trim(),inst:+$('#as_y').value||'',mode:$('#as_m').value||'فردي',qty:$('#as_m').value==='مجموعة'?(+$('#as_q').value||1):0};
  assets.push({id,...o});await db.collection('assets').doc(id).set(o);await assetLogAdd(c,'إنشاء','تسجيل الأصل');
  $('#as_c').value='';$('#as_n').value='';toast('تمت الإضافة ✓ (الكود '+c+')');
}
function assetDetailByCode(c){const a=assetByCode(c);if(a)assetDetail(a.id);else alert('الكود «'+c+'» غير موجود في سجل الأصول')}
function newFaultFor(code){
  const a=assetByCode(code);if(!a)return;closeEdit();goForm('notices');
  const f=document.getElementById('f_asset');if(f)f.value=a.code;const d=document.getElementById('f_loc');if(d)d.value=a.loc||'';const fe=document.getElementById('f_floor');if(fe)fe.value=aFloor(a);
  const t=document.getElementById('f_trade');if(t&&TYPE_TRADE[a.type])t.value=TYPE_TRADE[a.type];
  const x=document.getElementById('f_details');if(x)x.focus();
}
function assetDetail(id){
  const a=assets.find(x=>x.id===id);if(!a)return;const x=assetStats(a);closeEdit();
  const ev=[];x.ns.forEach(n=>{const pt=purchases.filter(p=>p.ref===n.ref).map(p=>p.item+'×'+(p.qty||1)).join('، ');ev.push({d:String(iso(n.date)),k:'عطل',t:n.ref+' – '+(n.details||'')+(+n.aff?' (العدد المتأثر: '+n.aff+')':'')+' | البداية: '+dFmt(String(iso(n.date)))+(n.fixdate?' · النهاية: '+dFmt(String(iso(n.fixdate))):'')+(n.action?' | الإجراء/النتيجة: '+n.action:'')+(pt?' | قطع الغيار: '+pt:''),s:n.status||'',c:noticeCost(n)})});
  assetLog.filter(l=>sameCode(l.code,a.code)).forEach(l=>ev.push({d:String(l.at).slice(0,10),k:l.kind,t:l.text||'',s:'',c:0}));
  ev.sort((p,q)=>q.d.localeCompare(p.d));
  const d=document.createElement('div');d.id='md';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;overflow:auto;padding:12px';
  d.innerHTML=`<div class="card" style="max-width:900px;margin:16px auto"><b style="font-size:16px">${esc(a.code)} – ${esc(a.name)}</b>
  <div class="grid" style="margin:8px 0"><div class="k ${x.stc}"><b style="font-size:16px">${x.st}</b>الحالة التشغيلية</div><div class="k"><b>${x.age!==null?x.age+' / '+x.life:'—'}</b>العمر / العمر الافتراضي (سنة)</div><div class="k"><b>${x.r12} / ${x.ns.length}</b>أعطال (12 شهر / الكل)</div><div class="k"><b>${money(x.cost)}</b>إجمالي التكلفة (ج.م)</div><div class="k"><b>${totVal(a)?money(totVal(a)):'—'}</b>قيمة الاستبدال${x.grp?' الإجمالية':''} (ج.م)</div></div>
  ${x.grp?`<div class="msg" style="margin-top:4px"><b>مجموعة:</b> العدد الكلي ${x.qty} · سليم ${Math.max(0,x.qty-x.qf-x.qd)} · يحتاج إصلاح ${x.qf} · تالف ${x.qd} · قيمة استبدال الوحدة ${money(a.value)} ج.م</div>`:''}<div class="msg">${esc(a.type)} · ${esc(a.loc||'بدون موقع')}${+a.cap?' · '+a.cap+' '+esc(a.capu||''):''}${a.brand?' · '+esc(a.brand):''}${yearOf(a.inst)?' · تركيب '+yearOf(a.inst):''}</div>
  <div class="msg"><b>${effCond({a,st:x.st})}</b> · ${secA(a)}${a.model?' · موديل '+esc(a.model):''}${a.specs?' · '+esc(a.specs):''}${a.pdate?' · شراء/تركيب '+dFmt(a.pdate):''}${a.note?' · '+esc(a.note):''}${a.pieces?'<br>القطع: '+a.pieces.map(esc).join('، '):''}</div><div style="margin:6px 0"><b>القرار:</b> ${a.dec?esc(a.dec)+(a.decDone?' (نُفِّذ)':'')+(a.decYear?' · سنة '+a.decYear:'')+(+a.decCost?' · '+money(a.decCost)+' ج.م':'')+(a.decWhy?' – '+esc(a.decWhy):''):'لم يُحدد'}${a.replacedBy?' · استُبدل بالكود '+esc(a.replacedBy):''}${a.replaces?' · بديل للكود '+esc(a.replaces):''}</div>
  <div class="row" style="margin:8px 0"><button class="btn" onclick="assetDecide('${a.id}')">قرار</button><button class="btn alt" onclick="newFaultFor('${esc(a.code)}')">تسجيل عطل</button><button class="btn alt" onclick="assetMove('${a.id}')">نقل</button><button class="btn alt" onclick="assetSplit('${a.id}')">تقسيم لأصول منفصلة</button>${isGrp(a)?`<button class="btn alt" onclick="assetPieces('${a.id}')">ترقيم القطع</button>`:''}<button class="btn alt" onclick="openEdit('assets','${a.id}')">تعديل البيانات</button>${a.stat==='مُكهّن'?`<button class="btn alt" onclick="assetReactivate('${a.id}')">إعادة للخدمة</button>`:''}<button class="btn alt" onclick="closeEdit()">إغلاق</button></div>
  <div class="wrap"><table><tr>${['التاريخ','النوع','التفاصيل','الحالة','التكلفة'].map(t=>`<th>${t}</th>`).join('')}</tr>${ev.map(e=>`<tr><td>${dFmt(e.d)}</td><td>${e.k}</td><td class="l">${esc(e.t)}</td><td>${esc(e.s)}</td><td>${e.c?money(e.c):''}</td></tr>`).join('')||'<tr><td colspan="5">لا توجد أحداث مسجلة</td></tr>'}</table></div></div>`;
  document.body.appendChild(d);
}
function assetDecide(id){
  const a=assets.find(x=>x.id===id);if(!a)return;const x=assetStats(a);closeEdit();
  const d=document.createElement('div');d.id='md';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;overflow:auto;padding:12px';
  d.innerHTML=`<div class="card" style="max-width:640px;margin:16px auto"><b>قرار بشأن ${esc(a.code)} – ${esc(a.name)}</b>
  <div class="grid" style="margin-top:8px"><label>القرار<select id="d_dec"><option value="">بدون قرار</option>${DECS.map(o=>`<option ${a.dec===o?'selected':''}>${o}</option>`).join('')}</select></label><label>السنة المخططة للتنفيذ<input id="d_yr" type="number" min="2020" max="2100" value="${a.decYear||thisYear()+1}"></label><label>تكلفة الاستبدال المقدّرة (ج.م)<input id="d_cost" type="number" min="0" value="${+a.decCost||totVal(a)||''}"></label></div>
  <label style="margin-top:8px">سبب القرار<textarea id="d_why" rows="2" style="min-width:0">${esc(a.decWhy||'')}</textarea></label>
  <div class="row" style="margin-top:10px"><button class="btn" onclick="assetDecideSave('${a.id}')">حفظ القرار</button>${a.dec==='استبدال'&&!a.decDone?`<button class="btn alt" onclick="assetExecReplace('${a.id}')">تنفيذ الاستبدال (كود جديد)</button>`:''}${a.dec==='تكهين'&&!a.decDone?`<button class="btn alt" onclick="assetExecScrap('${a.id}')">تنفيذ التكهين</button>`:''}<button class="btn alt" onclick="closeEdit()">إلغاء</button></div>
  <div class="msg hint" style="margin-top:6px">«تنفيذ الاستبدال» بيقفل الأصل القديم (مُكهّن) وبينشئ أصل جديد بكود جديد وسنة تركيب الحالية. «تنفيذ التكهين» بيخرج الأصل من الخدمة.</div></div>`;
  document.body.appendChild(d);
}
async function assetDecideSave(id){
  const a=assets.find(x=>x.id===id);if(!a)return;
  const dec=$('#d_dec').value,why=$('#d_why').value.trim(),yr=+$('#d_yr').value||'',cost=+$('#d_cost').value||0;
  const o={dec,decWhy:why,decYear:dec?yr:'',decCost:dec==='استبدال'?cost:0,decAt:ymd(new Date()),decDone:false};
  Object.assign(a,o);await db.collection('assets').doc(id).update(o);
  await assetLogAdd(a.code,'قرار',(dec||'إلغاء القرار')+(why?' – '+why:'')+(dec&&yr?' (سنة '+yr+')':''));
  closeEdit();toast('تم حفظ القرار ✓');
}
async function assetExecScrap(id){
  const a=assets.find(x=>x.id===id);if(!a||!confirm('تنفيذ تكهين «'+a.code+' – '+a.name+'» وإخراجه من الخدمة؟'))return;
  const o={stat:'مُكهّن',decDone:true,decAt:ymd(new Date())};Object.assign(a,o);await db.collection('assets').doc(id).update(o);
  await assetLogAdd(a.code,'تكهين','تم تنفيذ التكهين وإخراج الأصل من الخدمة');closeEdit();toast('تم التكهين ✓');
}
async function assetExecReplace(id){
  const a=assets.find(x=>x.id===id);if(!a||!confirm('تنفيذ استبدال «'+a.code+' – '+a.name+'»؟ هيتقفل الأصل القديم وينشأ أصل جديد بكود جديد.'))return;
  const nc=nextCodes(a.type,1)[0],nid='as_'+nc;
  const n={code:nc,name:a.name,type:a.type,cap:+a.cap||0,capu:a.capu||'',loc:a.loc||'',value:isGrp(a)?(+a.value||0):(+a.decCost||+a.value||0),mode:a.mode||'فردي',qty:isGrp(a)?(+a.qty||0):0,brand:a.brand||'',model:a.model||'',inst:thisYear(),life:+a.life||'',notes:'بديل للكود '+a.code,replaces:a.code,src:'استبدال'};
  assets.push({id:nid,...n});await db.collection('assets').doc(nid).set(n);
  const o={stat:'مُكهّن',decDone:true,decAt:ymd(new Date()),replacedBy:nc};Object.assign(a,o);await db.collection('assets').doc(id).update(o);
  await assetLogAdd(a.code,'استبدال','تم الاستبدال بالأصل الجديد '+nc);await assetLogAdd(nc,'إنشاء','أصل جديد بديل للكود '+a.code);
  closeEdit();toast('تم الاستبدال – الكود الجديد '+nc);
}
async function assetReactivate(id){
  const a=assets.find(x=>x.id===id);if(!a||!confirm('إعادة «'+a.code+'» للخدمة؟'))return;
  const o={stat:'',decDone:false};Object.assign(a,o);await db.collection('assets').doc(id).update(o);await assetLogAdd(a.code,'إعادة للخدمة','تمت إعادة الأصل للخدمة');closeEdit();toast('تمت الإعادة للخدمة');
}
function planBy(year){
  const by={},list=[],sug=[];
  assets.forEach(a=>{if(a.stat==='مُكهّن')return;const t=TYPE_TRADE[a.type]||'أخرى';
    if(a.dec==='استبدال'&&!a.decDone&&String(a.decYear)===String(year)){const c=+a.decCost||totVal(a)||0;by[t]=(by[t]||0)+c;list.push({a,c,t})}
  });
  return{by,list,sug};
}
function planTable(p,year){
  const tr=l=>l.map(r=>`<tr><td><b>${esc(r.a.code)}</b></td><td class="l">${esc(r.a.name)}</td><td class="l">${esc(r.a.loc)}</td><td>${r.t}</td><td>${money(r.c)}</td><td class="l">${esc(r.a.decWhy||'')}</td></tr>`).join('');
  const head=['الكود','الأصل','الموقع','التخصص','التكلفة (ج.م)','السبب'].map(x=>`<th>${x}</th>`).join('');
  return `<h4>خطة الاستبدال لسنة ${year} (قرارات اتُّخذت): ${money(p.list.reduce((t,r)=>t+r.c,0))} ج.م</h4><div style="overflow-x:auto"><table><tr>${head}</tr>${tr(p.list)||'<tr><td colspan="6">لا توجد قرارات استبدال مخططة لهذه السنة — حددها من «قرار» في سجل الأصول</td></tr>'}</table></div>`;
}
function exportAssets(){
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  const list=assets.filter(a=>!isAC(a)).map(a=>({a,...assetStats(a)})).sort((x,y)=>String(x.a.code).localeCompare(String(y.a.code),'en',{numeric:true}));
  const head=['الكود','الاسم / الطراز','النوع','القدرة','وحدة القدرة','الماركة','الموديل','الموقع','سنة التركيب','العمر (سنة)','العمر الافتراضي','قيمة الاستبدال (ج.م)','الحالة التشغيلية','عدد الأعطال','أعطال آخر 12 شهراً','تاريخ آخر عطل','إجمالي التكلفة (ج.م)','القرار','سبب القرار','سنة التنفيذ المخططة','تكلفة الاستبدال المقدّرة (ج.م)','نُفِّذ؟','ملاحظات','طريقة التسجيل','العدد','يحتاج إصلاح','تالف'];
  const rows=list.map(x=>[x.a.code,x.a.name||'',x.a.type||'',+x.a.cap||'',x.a.capu||'',x.a.brand||'',x.a.model||'',x.a.loc||'',yearOf(x.a.inst)||'',x.age===null?'':x.age,x.life,+x.a.value||'',x.st,x.ns.length,x.r12,toD(x.last)||'',Math.round(x.cost*100)/100,x.a.dec||'',x.a.decWhy||'',x.a.decYear||'',+x.a.decCost||'',x.a.decDone?'نعم':'',x.a.notes||'',isGrp(x.a)?'مجموعة':'فردي',isGrp(x.a)?(+x.a.qty||''):'',isGrp(x.a)?(+x.a.qtyFix||''):'',isGrp(x.a)?(+x.a.qtyDead||''):'']);
  const ws=XLSX.utils.aoa_to_sheet([['سجل الأصول – قسم الصيانة – مستشفى الابتسامة'],['تاريخ التصدير: '+dFmt(ymd(new Date()))+' – عدد الأصول: '+list.length+' (بدون التكييف – له تصدير مستقل من صفحة أصول التكييف)'],[],head,...rows],{cellDates:true});
  ws['!cols']=[10,32,20,9,10,12,12,30,11,10,12,16,24,10,12,13,16,16,30,12,16,8,28,12,8,12,8].map(w=>({wch:w}));ws['!views']=[{RTL:true}];
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'سجل الأصول');
  const fl=[];list.forEach(x=>x.ns.slice().sort((p,q)=>String(iso(p.date)).localeCompare(String(iso(q.date)))).forEach(n=>fl.push([x.a.code,x.a.name||'',n.ref,toD(n.date)||'',n.details||'',n.status||'',Math.round(noticeCost(n)*100)/100])));
  const w2=XLSX.utils.aoa_to_sheet([['الكود','اسم الأصل','الإخطار','التاريخ','العطل','الحالة','التكلفة (ج.م)'],...fl],{cellDates:true});w2['!cols']=[10,30,10,12,40,16,14].map(w=>({wch:w}));w2['!views']=[{RTL:true}];XLSX.utils.book_append_sheet(wb,w2,'أعطال الأصول');
  const w3=XLSX.utils.aoa_to_sheet([['الكود','الوقت','النوع','التفاصيل','بواسطة'],...assetLog.slice().reverse().filter(l=>{const z=assetByCode(l.code);return !(z&&isAC(z))}).map(l=>[l.code,String(l.at).slice(0,16).replace('T',' '),l.kind,l.text,l.by||''])]);w3['!cols']=[10,18,14,50,24].map(w=>({wch:w}));w3['!views']=[{RTL:true}];XLSX.utils.book_append_sheet(wb,w3,'سجل القرارات');
  (()=>{const w4=XLSX.utils.aoa_to_sheet([['الكود','الاسم','النوع','القسم','الحالة (5 حالات)','المبنى','الدور','الغرفة','الموقع','الموديل','المواصفات','تاريخ الشراء/التركيب','ملاحظات'],...list.map(x=>[x.a.code,x.a.name||'',x.a.type||'',secA(x.a),effCond(x),x.a.b||'',x.a.f||'',x.a.r||'',x.a.loc||'',x.a.model||'',x.a.specs||'',x.a.pdate||'',x.a.note||''])]);w4['!views']=[{RTL:true}];XLSX.utils.book_append_sheet(wb,w4,'الحصر الموسّع')})();
  dl('سجل_الأصول_'+ymd(new Date())+'.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx',cellDates:true}));toast('تم تجهيز ملف سجل الأصول');
}
const yearOf=v=>{if(v==null||v==='')return 0;if(v instanceof Date)return v.getFullYear();const m=String(v).match(/\d{4}/);return m?+m[0]:0};
const yearTxt=v=>{const y=yearOf(v);return y?y+' ('+(new Date().getFullYear()-y)+' سنة)':''};
async function assetBulkCap(){
  const f=$('#bk_f').value.trim(),t=$('#bk_t').value.trim(),c=+$('#bk_c').value;
  const m1=f.match(/^(.*?)(\d+)$/),m2=t.match(/^(.*?)(\d+)$/);
  if(!m1||!m2||m1[1].toLowerCase()!==m2[1].toLowerCase()||!(c>0)){alert('اكتب كودين بنفس البادئة (مثل AC-05 و AC-20) وقدرة أكبر من صفر');return}
  const lo=+m1[2],hi=+m2[2],pre=m1[1].toLowerCase();
  const list=assets.filter(a=>{const m=String(a.code).match(/^(.*?)(\d+)$/);return m&&m[1].toLowerCase()===pre&&+m[2]>=lo&&+m[2]<=hi});
  if(!list.length){alert('لا توجد أصول في هذا النطاق');return}
  if(!confirm('تعيين القدرة '+c+' '+$('#bk_u').value+' لعدد '+list.length+' أصل؟'))return;
  for(const a of list)await db.collection('assets').doc(a.id).update({cap:c,capu:$('#bk_u').value});
  toast('تم تحديث '+list.length+' أصل');
}
