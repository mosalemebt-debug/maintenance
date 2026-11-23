/* JobSheet */
/* ---------- JobSheet ---------- */
const JSTAT=['مسودة','صادر','قيد التنفيذ','تم التنفيذ','مغلق'];
const JF=()=>[['no','الرقم','text'],['contractor','الشركة المنفذة','text'],['date','التاريخ','date'],['refs','الإخطارات المرتبطة (ع-..)','text'],['dept','الموقع / القسم','text'],['asset','الأصل (الكود)','text'],['scope','نطاق العمل','area'],['materials','وصف ما تم ','area'],['cost','التكلفة النهائية (ج.م)','number'],['status','الحالة','select',JSTAT],['end','تاريخ التنفيذ','date'],['tech','فني الشركة','text'],['rep','مشرف الصيانة','text'],['notes','ملاحظات','area']];
let lastJ=0;const nextJ=()=>(lastJ=Math.max(lastJ,...jobsheets.map(j=>num(j.no)))+1),jno=n=>'JS-'+String(n).padStart(3,'0');
const lastContractor=()=>localStorage.getItem('js_contractor')||'GHD';
function vJobs(){
  let h=`<div class="card addf"><b>إصدار JobSheet جديد</b><div class="msg hint">يمكنك أيضاً إنشاءه من زر «JobSheet» بجانب أي إخطار في الصيانة العلاجية فيتعبّى منه تلقائياً.</div><div class="row" style="margin-top:6px"><label>الشركة المنفذة<input id="j_c" value="${esc(lastContractor())}" data-keep="1"></label><label>التاريخ<input id="j_d" type="date" value="${ymd(new Date())}"></label>
  <label>الإخطارات (ع-..، افصل بفاصلة)<input id="j_r" list="jnlist" data-keep="1"></label><datalist id="jnlist">${notices.filter(n=>n.status!=='تم الإصلاح').map(n=>`<option value="${n.ref}">${esc(n.dept)}</option>`).join('')}</datalist>
  <label>الموقع / القسم<input id="j_p" data-keep="1"></label><label>الأصل (الكود)<input id="j_a" list="assetlist" data-keep="1"></label><datalist id="assetlist">${assets.map(a=>`<option value="${esc(a.code)}">${esc(a.name)}</option>`).join('')}</datalist>
  <label style="flex:2 1 260px">نطاق العمل<textarea id="j_s" rows="2" data-keep="1" style="min-width:0"></textarea></label><button class="btn" onclick="jsAdd()">إصدار</button></div></div>
  <div class="card wrap"><table><tr>${['الرقم','الشركة','التاريخ','الإخطارات','الموقع','نطاق العمل','الحالة','التكلفة (ج.م)','إجراءات'].map(x=>`<th>${x}</th>`).join('')}</tr>`;
  jobsheets.slice().reverse().forEach(j=>{h+=`<tr><td>${esc(j.no)}</td><td>${esc(j.contractor)}</td><td>${fd(j.date)}</td><td>${esc(j.refs)}</td><td class="l">${esc(j.dept)}</td><td class="l">${esc(j.scope)}</td>
  <td class="${j.status==='تم التنفيذ'||j.status==='مغلق'?'s-ok':j.status==='قيد التنفيذ'?'s-warn':''}"><select onchange="setJSStatus('${j.id}',this.value)">${JSTAT.map(s=>`<option ${s===j.status?'selected':''}>${s}</option>`).join('')}</select></td><td>${+j.cost?money(j.cost):''}</td>
  <td><div style="display:flex;gap:4px;justify-content:center"><button class="btn sm" onclick="openJS('${j.id}')">طباعة</button><button class="btn sm alt" onclick="openEdit('jobsheets','${j.id}')">تعديل</button><button class="btn sm" style="background:#b42318" onclick="delItem('jobsheets','${j.id}')">حذف</button></div></td></tr>`});
  return h+(jobsheets.length?'':'<tr><td colspan="9">لا توجد JobSheets بعد</td></tr>')+'</table></div>';
}
async function jsCreate(o){const n=nextJ(),id=uid('js',n),d={no:jno(n),contractor:lastContractor(),date:ymd(new Date()),refs:'',dept:'',asset:'',scope:'',materials:'',cost:0,status:'مسودة',end:'',tech:'',rep:'',notes:'',...o};
  jobsheets.push({id,...d});localStorage.setItem('js_contractor',d.contractor);await db.collection('jobsheets').doc(id).set(d);return id}
async function jsAdd(){const sc=$('#j_s').value.trim();if(!sc){alert('اكتب نطاق العمل');return}
  await jsCreate({contractor:$('#j_c').value.trim()||'GHD',date:$('#j_d').value,refs:$('#j_r').value.trim(),dept:$('#j_p').value,asset:$('#j_a').value.trim(),scope:sc});
  $('#j_s').value='';$('#j_r').value='';toast('تم إصدار JobSheet ✓')}
async function createJS(nid){const n=notices.find(x=>x.id===nid);if(!n)return;
  const id=await jsCreate({refs:n.ref,dept:n.dept||'',asset:n.asset||'',scope:(n.details||'')+(n.action?' – '+n.action:'')});toast('تم إنشاء JobSheet من '+n.ref);openJS(id)}
async function setJSStatus(id,v){
  const j=jobsheets.find(x=>x.id===id);if(!j)return;const o={status:v};
  if(v==='تم التنفيذ'&&!j.end)o.end=ymd(new Date());
  Object.assign(j,o);await db.collection('jobsheets').doc(id).update(o);
  if(v==='تم التنفيذ'){
    const refs=(String(j.refs||'').match(/ع-\d+/g)||[]),ns=refs.map(r=>notices.find(n=>n.ref===r)).filter(n=>n&&n.status!=='تم الإصلاح');
    if(ns.length&&confirm('تحويل الإخطارات المرتبطة ('+ns.map(n=>n.ref).join('، ')+') إلى «تم الإصلاح» بتاريخ '+(o.end||j.end||ymd(new Date()))+'؟'))
      for(const n of ns)await upd(n.id,{status:'تم الإصلاح',fixdate:o.end||j.end||ymd(new Date()),notes:(n.notes?n.notes+' | ':'')+'تم عبر '+j.no});
  }
}
function openJS(id){
  const j=jobsheets.find(x=>x.id===id);if(!j)return;const old=document.getElementById('prv');if(old)old.remove();
  const ns=(String(j.refs||'').match(/ع-\d+/g)||[]).map(r=>notices.find(n=>n.ref===r)).filter(Boolean);
  const as=assets.find(a=>sameCode(a.code,j.asset)),assetTxt=as?as.code+' – '+as.name:(j.asset||'');
  const o=document.createElement('div');o.id='prv';
  const bi=(en,ar)=>`<div class="bi"><span>${en}</span><span class="ar">${ar}</span></div>`;
  const box=(en,ar,v)=>`<td style="text-align:left">${bi(en,ar)}<div style="min-height:16px;text-align:center;font-weight:700">${esc(v||'')}</div></td>`;
  const sg=(en,ar)=>`<tr><td style="width:38%">${bi(en,ar)}</td><td style="height:58px"></td></tr>`;
  o.innerHTML=`<div class="prtools"><b>Job Sheet ${esc(j.no)} – معاينة قبل الطباعة</b><div class="row" style="margin-top:8px"><button class="btn" onclick="window.print()">طباعة</button><button class="btn alt" onclick="prPdf()">تحميل PDF</button><button class="btn alt" onclick="document.getElementById('prv').remove()">إغلاق</button></div></div>
  <div id="prpages"><div class="prpage">
  <table><tr><td style="width:22%;border:0"></td><td style="border:0"><div class="t">Job Sheet أمر عمل</div><div class="g" style="font-size:11px">External Maintenance Works – نموذج تنفيذ أعمال الصيانة الخارجية</div></td><td style="width:26%;border:0"><b>مستشفى الابتسامة</b><br>Al Ebtesama Hospital<br>قسم الصيانة</td></tr></table>
  <table style="margin-top:4px"><tr>${box('JS No.','رقم أمر العمل',j.no)}${box('Date','التاريخ',fd(j.date))}${box('Contractor','الشركة المنفذة',j.contractor)}${box('Status','حالة التنفيذ',j.status)}</tr></table>
  <table style="margin-top:4px"><tr>${box('Department','القسم',j.dept)}${box('Asset','الأصل والجهاز',assetTxt)}${box('Related Notice','رقم الإخطار المرتبط',j.refs)}</tr></table>
  <table style="margin-top:4px"><tr><td style="text-align:left;height:100px;vertical-align:top">${bi('Scope of Work','نطاق العمل المطلوب')}<div class="ar" style="margin-top:4px;font-weight:700">${esc(j.scope)}</div>${ns.length?`<div class="g" style="margin-top:6px">الأعطال المرتبطة: ${ns.map(n=>esc(n.ref)+' – '+esc(n.details)).join('؛ ')}</div>`:''}</td></tr></table>
  <table style="margin-top:4px"><tr><td style="text-align:left;height:100px;vertical-align:top">${bi('Work Done','وصف ما تم تنفيذه')}<div class="ar" style="margin-top:4px;font-weight:700">${esc(j.materials)}</div></td></tr></table>
  <table style="margin-top:4px"><tr>${box('Execution Date','تاريخ التنفيذ',j.end?fd(j.end):'')}${box('Final Cost (EGP)','التكلفة النهائية بالجنيه المصري',+j.cost?money(j.cost):'')}${box('Contractor Technician','فني الشركة',j.tech)}${box('Maintenance Supervisor','مشرف الصيانة',j.rep)}</tr></table>
  <table style="margin-top:4px"><tr><td style="text-align:left;height:46px;vertical-align:top">${bi('Notes','ملاحظات')}<div class="ar" style="margin-top:4px">${esc(j.notes)}</div></td></tr></table>
  <table style="margin-top:6px"><tr><th>${bi('Authorized By','يعتمد')}</th><th>${bi('Signature','التوقيع')}</th></tr>${sg('Executing Technician','الفني المنفذ')}${sg('Maintenance Manager','مدير الصيانة')}${sg('Hospital Manager','مدير المستشفى')}${sg('Finance Department','الإدارة المالية')}</table>
  <div class="g" style="text-align:center;margin-top:8px">مستشفى الابتسامة | قسم الصيانة${j.date?' · تاريخ الإصدار: '+fd(j.date):''}</div>
  </div></div>`;
  document.body.appendChild(o);
}
importXlsx=noLog(importXlsx);restoreJSON=noLog(restoreJSON);
function noLog(fn){return async function(...a){window.NOLOG=true;try{return await fn.apply(this,a)}finally{window.NOLOG=false}}}
