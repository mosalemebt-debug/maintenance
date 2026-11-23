/* الصيانة العلاجية (الإخطارات) */
/* ---------- الصيانة العلاجية ---------- */
const FLD=['date','time','dept','reporter','details','action','status','fixdate','rep','needbuy','notes','cls'];
function vNotices(){
  let h=`<div class="card addf"><b>إخطار جديد</b><div class="row">
  <label>التاريخ<input type="date" id="f_date" value="${ymd(new Date())}"></label>
  <label>الوقت<input type="time" id="f_time"></label>
  <label>القسم<input id="f_dept"></label><label>المكان<input id="f_loc" placeholder="مثال: حمام 201"></label><label>مسؤول الإخطار<input id="f_reporter"></label>
  <label>تفاصيل العطل<input id="f_details" style="width:220px"></label><label>الإجراء المتخذ<input id="f_action" style="width:200px"></label>
  <label>الحالة<select id="f_status"><option value="" selected>مفتوح</option>${ST.map(s=>`<option>${s}</option>`).join('')}</select></label>
  <label>ممثل الصيانة<input id="f_rep"></label>
  <label>يحتاج شراء؟<select id="f_needbuy"><option>لا</option><option>نعم</option></select></label>
  <label>الأولوية<select id="f_prio"><option value="">تلقائي</option>${PR.map(p=>`<option>${p}</option>`).join('')}</select></label>
  <label>التخصص<select id="f_trade"><option value="">تلقائي</option>${TRD.map(t=>`<option>${t}</option>`).join('')}</select></label><label>الأصل (الكود)<input id="f_asset" list="assetlist" placeholder="مثال: AC-05"></label><label>التكلفة (ج.م)<input id="f_cost" type="number" min="0"></label><label>العدد المتأثر (لو الأصل مجموعة)<input id="f_aff" type="number" min="1" style="width:110px"></label><datalist id="assetlist">${assets.map(a=>`<option value="${esc(a.code)}">${esc(a.name)}</option>`).join('')}</datalist>
  <button class="btn" onclick="saveNotice()">حفظ</button></div></div>
  <div class="card"><div class="row"><button class="btn" onclick="exportXlsx()">تصدير Excel</button>
  <label class="btn alt" style="flex-direction:row">استيراد من ملف الإكسل<input type="file" accept=".xlsx" onchange="importXlsx(this.files[0])" hidden></label></div><div id="imsg" class="msg"></div></div>
  ${nFilterBar()}<div class="card wrap"><table class="ntbl ${nAll?'':'compact'}"><tr>${['م','المرجع','التاريخ','الوقت','القسم','المكان','الأصل','المبلّغ','العطل','الإجراء','الحالة','تاريخ الإصلاح','ممثل الصيانة','شراء؟','ملاحظات','الأولوية','المهلة','إجراءات'].map(x=>`<th>${x}</th>`).join('')}</tr>`;
  notices.slice().reverse().filter(nfOK).forEach(n=>{const si=slaInfo(n);
    h+=`<tr><td>${n.n}</td><td>${n.ref}</td><td>${fd(n.date)}</td><td>${esc(n.time)}</td><td class="l">${esc(n.dept)}</td><td class="l">${esc(n.loc||'')}</td><td>${n.asset?`<a href="#" onclick="assetDetailByCode('${esc(n.asset)}');return false">${esc(n.asset)}</a>`:''}</td><td>${esc(n.reporter)}</td><td class="l">${esc(n.details)}</td>
    <td class="l"><textarea rows="1" data-keep="1" oninput="fit(this)" onchange="upd('${n.id}',{action:this.value})">${esc(n.action)}</textarea></td>
    <td class="${stCls(n.status)}"><select onchange="setStatus('${n.id}',this.value)"><option value="" ${!n.status?'selected':''}>مفتوح</option>${ST.map(s=>`<option ${s===n.status?'selected':''}>${s}</option>`).join('')}</select></td>
    <td><input type="date" value="${iso(n.fixdate)}" onchange="upd('${n.id}',{fixdate:this.value})"></td>
    <td><textarea rows="1" data-keep="1" oninput="fit(this)" onchange="upd('${n.id}',{rep:this.value})" style="min-width:110px">${esc(n.rep)}</textarea></td>
    <td><select onchange="upd('${n.id}',{needbuy:this.value})">${['','نعم','لا'].map(s=>`<option ${s===(n.needbuy||'')?'selected':''}>${s}</option>`).join('')}</select></td>
    <td class="l">${esc(n.notes)}</td><td class="${prCls(si.pr)}">${si.pr}</td><td class="${si.cls}">${si.txt}</td><td><div style="display:flex;gap:4px;justify-content:center"><button class="btn sm alt" onclick="openEdit('notices','${n.id}')">تعديل</button><button class="btn sm alt" onclick="openNT('${n.id}')">طباعة</button><button class="btn sm alt" onclick="createJS('${n.id}')">JobSheet</button><button class="btn sm" style="background:#b42318" onclick="delItem('notices','${n.id}')">حذف</button></div></td></tr>`});
  return h+'</table></div>';
}
const upd=(id,o)=>db.collection('notices').doc(id).update(o);
function setStatus(id,s){const o={status:s};if(s==='تم الإصلاح')o.fixdate=ymd(new Date());upd(id,o)}
async function saveNotice(){
  const o={};['date','time','dept','loc','reporter','details','action','status','rep','needbuy','prio'].forEach(k=>o[k]=$('#f_'+k).value);
  ['trade','asset','cost','aff'].forEach(k=>{const e=$('#f_'+k);if(e)o[k]=(k==='cost'||k==='aff')?(+e.value||0):e.value});
  if(o.asset){o.asset=o.asset.trim();const _a=assetByCode(o.asset);if(!_a&&!confirm('الكود «'+o.asset+'» غير موجود في سجل الأصول. تكمل التسجيل بدون ربط؟'))return;if(_a&&_a.stat==='مُكهّن'&&!confirm('الأصل «'+_a.code+'» مُكهّن (خارج الخدمة). تكمل؟'))return}
  if(!o.dept||!o.details){alert('اكتب القسم وتفاصيل العطل');return}
  if(o.status==='تم الإصلاح')o.fixdate=o.date;
  await addNotice(o);
  toast('تم تسجيل الإخطار ✓');
}
function dl(name,data){return claude.use('downloads').then(d=>d?d.save({filename:name,data}):alert('التنزيل غير متاح'))}
async function exportXlsx(){
  const head=['م','الرقم المرجعي','التاريخ','الوقت','القسم','مسؤول الإخطار','تفاصيل العطل','الإجراء المتخذ','الحالة','تاريخ الإصلاح','ممثل الصيانة','يحتاج شراء؟','عدد أصناف الشراء','حالة الشراء','ملاحظات','التصنيف الأصلي للعطل'];
  const rows=notices.map(n=>{const ps=purchases.filter(p=>p.ref===n.ref);const done=ps.filter(p=>p.status==='تم الشراء/التوريد').length;
    const bs=!ps.length?(n.needbuy==='نعم'?'لم يُسجل صنف':''):done===ps.length?'تم الشراء كاملاً':done>0?'جزئي':'معلق';
    return [n.n,n.ref,toD(n.date),n.time||'',n.dept,n.reporter||'',n.details,n.action||'',n.status,toD(n.fixdate),n.rep||'',n.needbuy||'',ps.length,bs,n.notes||'',n.cls||'']});
  const ws=XLSX.utils.aoa_to_sheet([['سجل الصيانة العلاجية (إخطارات الصيانة) – مستشفى الابتسامة'],[],head,...rows],{cellDates:true});
  ws['!cols']=[5,11,12,9,22,14,40,35,15,12,16,10,11,17,30,24].map(w=>({wch:w}));ws['!views']=[{RTL:true}];
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'الصيانة العلاجية');
  dl('الصيانة_العلاجية_'+ymd(new Date())+'.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx',cellDates:true}));
}
async function importXlsx(f){
  if(!f)return;const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true});
  let c=0,p=0;
  const ws=wb.Sheets['الصيانة العلاجية'];
  if(ws){const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true}).slice(3);
    for(const r of rows){if(!r[1])continue;const n=num(r[1]);if(notices.find(x=>x.n===n))continue;
      await db.collection('notices').doc(uid('n',n)).set({n,ref:r[1],date:iso(r[2]),time:r[3] instanceof Date?r[3].toTimeString().slice(0,5):String(r[3]),dept:String(r[4]),reporter:String(r[5]),details:String(r[6]),action:String(r[7]),status:String(r[8]),fixdate:iso(r[9]),rep:String(r[10]),needbuy:String(r[11]),notes:String(r[14]??''),cls:String(r[15]??'')});c++}}
  const wp=wb.Sheets['طلبات الشراء'];
  if(wp&&!purchases.length){const rows=XLSX.utils.sheet_to_json(wp,{header:1,defval:'',raw:true}).slice(4);let k=1;
    for(const r of rows){if(!r[1]||!r[6])continue;await db.collection('purchases').doc(uid('p',k)).set({k,ref:String(r[1]),rdate:iso(r[5]),item:String(r[6]),qty:r[7],status:String(r[8]),ddate:iso(r[9]),notes:String(r[10]??'')});k++;p++}}
  $('#imsg').textContent=`تم استيراد ${c} إخطار و${p} صنف شراء`;
}
