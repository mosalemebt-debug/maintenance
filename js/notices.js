/* الصيانة العلاجية (الإخطارات) */
/* ---------- الصيانة العلاجية ---------- */
const FLD=['date','time','dept','reporter','details','action','status','fixdate','rep','needbuy','notes','cls'];
function vNotices(){
  let h=`<div class="card addf"><b>إخطار جديد</b><div class="row">
  <label>التاريخ<input type="date" id="f_date" value="${ymd(new Date())}"></label>
  <label>الوقت<input type="time" id="f_time"></label>
  <label>القسم<input id="f_dept"></label><label>الدور<select id="f_floor"><option value="">—</option>${nFloors().map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>المكان<input id="f_loc" placeholder="مثال: حمام 201" oninput="nAssetSuggest()"></label><label>مسؤول الإخطار<input id="f_reporter"></label>
  <label>تفاصيل العطل<input id="f_details" style="width:220px" oninput="nAssetSuggest()"></label><label>الإجراء المتخذ<input id="f_action" style="width:200px"></label>
  <label>الحالة<select id="f_status"><option value="" selected>مفتوح</option>${ST.map(s=>`<option>${s}</option>`).join('')}</select></label>
  <label>ممثل الصيانة<input id="f_rep"></label>
  <label>يحتاج شراء؟<select id="f_needbuy"><option>لا</option><option>نعم</option></select></label>
  <label>الأولوية<select id="f_prio"><option value="">تلقائي</option>${PR.map(p=>`<option>${p}</option>`).join('')}</select></label>
  <label>التخصص<select id="f_trade"><option value="">تلقائي</option>${TRD.map(t=>`<option>${t}</option>`).join('')}</select></label><label style="flex:2 1 260px;position:relative">الأصل – اكتب كود أو نوع أو مكان<input id="f_asset" autocomplete="off" placeholder="مثال: WH-03 أو سخان 107" oninput="nAssetSuggest()" onfocus="nAssetSuggest()"><div id="as_sug" class="asug"></div></label><label>التكلفة (ج.م)<input id="f_cost" type="number" min="0"></label><label>العدد المتأثر (لو الأصل مجموعة)<input id="f_aff" type="number" min="1" style="width:110px"></label>
  <button class="btn" onclick="saveNotice()">حفظ</button></div></div>
  <div class="card"><div class="row"><button class="btn" onclick="exportXlsx()">تصدير Excel</button>
  <label class="btn alt" style="flex-direction:row">استيراد من ملف الإكسل<input type="file" accept=".xlsx" onchange="importXlsx(this.files[0])" hidden></label></div><div id="imsg" class="msg"></div></div>
  ${nFilterBar()}<div class="card wrap"><table class="ntbl ${nAll?'':'compact'}"><tr>${['م','المرجع','التاريخ','الوقت','القسم','الدور','المكان','الأصل','المبلّغ','العطل','الإجراء','الحالة','تاريخ الإصلاح','ممثل الصيانة','شراء؟','ملاحظات','الأولوية','المهلة','إجراءات'].map(x=>`<th>${x}</th>`).join('')}</tr>`;
  notices.slice().reverse().filter(nfOK).forEach(n=>{const si=slaInfo(n);
    h+=`<tr><td>${n.n}</td><td>${n.ref}</td><td>${fd(n.date)}</td><td>${esc(n.time)}</td><td class="l">${esc(n.dept)}</td><td class="l">${esc(nFloor(n))}</td><td class="l">${esc(nLoc(n))}</td><td>${n.asset?`<a href="#" onclick="assetDetailByCode('${esc(n.asset)}');return false">${esc(n.asset)}</a>`:''}</td><td>${esc(n.reporter)}</td><td class="l">${esc(n.details)}</td>
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
  const o={};['date','time','dept','floor','loc','reporter','details','action','status','rep','needbuy','prio'].forEach(k=>o[k]=$('#f_'+k).value);
  ['trade','asset','cost','aff'].forEach(k=>{const e=$('#f_'+k);if(e)o[k]=(k==='cost'||k==='aff')?(+e.value||0):e.value});
  if(o.asset){o.asset=o.asset.trim();const _a=assetByCode(o.asset);if(!_a&&!confirm('الكود «'+o.asset+'» غير موجود في سجل الأصول. تكمل التسجيل بدون ربط؟'))return;if(_a&&_a.stat==='مُكهّن'&&!confirm('الأصل «'+_a.code+'» مُكهّن (خارج الخدمة). تكمل؟'))return}
  if(!o.dept||!o.details){alert('اكتب القسم وتفاصيل العطل');return}
  if(o.status==='تم الإصلاح')o.fixdate=o.date;
  await addNotice(o);
  toast('تم تسجيل الإخطار ✓');
}
function dl(name,data){return claude.use('downloads').then(d=>d?d.save({filename:name,data}):alert('التنزيل غير متاح'))}
async function exportXlsx(){
  const head=['م','الرقم المرجعي','التاريخ','الوقت','القسم','مسؤول الإخطار','تفاصيل العطل','الإجراء المتخذ','الحالة','تاريخ الإصلاح','ممثل الصيانة','يحتاج شراء؟','عدد أصناف الشراء','حالة الشراء','ملاحظات','التصنيف الأصلي للعطل','الدور'];
  const rows=notices.map(n=>{const ps=purchases.filter(p=>p.ref===n.ref);const done=ps.filter(p=>p.status==='تم الشراء/التوريد').length;
    const bs=!ps.length?(n.needbuy==='نعم'?'لم يُسجل صنف':''):done===ps.length?'تم الشراء كاملاً':done>0?'جزئي':'معلق';
    return [n.n,n.ref,toD(n.date),n.time||'',n.dept,n.reporter||'',n.details,n.action||'',n.status,toD(n.fixdate),n.rep||'',n.needbuy||'',ps.length,bs,n.notes||'',n.cls||'',nFloor(n)]});
  const ws=XLSX.utils.aoa_to_sheet([['سجل الصيانة العلاجية (إخطارات الصيانة) – مستشفى الابتسامة'],[],head,...rows],{cellDates:true});
  ws['!cols']=[5,11,12,9,22,14,40,35,15,12,16,10,11,17,30,24,14].map(w=>({wch:w}));ws['!views']=[{RTL:true}];
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'الصيانة العلاجية');
  dl('الصيانة_العلاجية_'+ymd(new Date())+'.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx',cellDates:true}));
}
async function importXlsx(f){
  if(!f)return;const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true});
  let c=0,p=0;
  const ws=wb.Sheets['الصيانة العلاجية'];
  if(ws){const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true}).slice(3);
    for(const r of rows){if(!r[1])continue;const n=num(r[1]);if(notices.find(x=>x.n===n))continue;
      await db.collection('notices').doc(uid('n',n)).set({n,ref:r[1],date:iso(r[2]),time:r[3] instanceof Date?r[3].toTimeString().slice(0,5):String(r[3]),dept:String(r[4]),reporter:String(r[5]),details:String(r[6]),action:String(r[7]),status:String(r[8]),fixdate:iso(r[9]),rep:String(r[10]),needbuy:String(r[11]),notes:String(r[14]??''),cls:String(r[15]??''),floor:String(r[16]??'')});c++}}
  const wp=wb.Sheets['طلبات الشراء'];
  if(wp&&!purchases.length){const rows=XLSX.utils.sheet_to_json(wp,{header:1,defval:'',raw:true}).slice(4);let k=1;
    for(const r of rows){if(!r[1]||!r[6])continue;await db.collection('purchases').doc(uid('p',k)).set({k,ref:String(r[1]),rdate:iso(r[5]),item:String(r[6]),qty:r[7],status:String(r[8]),ddate:iso(r[9]),notes:String(r[10]??'')});k++;p++}}
  $('#imsg').textContent=`تم استيراد ${c} إخطار و${p} صنف شراء`;
}

/* اختيار الأصل في الإخطار: بحث بالكود/النوع/الاسم/المكان، وترشيح تلقائي من «المكان» و«تفاصيل العطل» */
function nAssetPick(code){
  const a=assetByCode(code);if(!a)return;const g=id=>document.getElementById(id);
  g('f_asset').value=a.code;const fe=g('f_floor');if(fe&&!fe.value)fe.value=aFloor(a);const l=g('f_loc');if(l&&!l.value)l.value=a.loc||'';
  const t=g('f_trade');if(t&&!t.value&&TYPE_TRADE[a.type])t.value=TYPE_TRADE[a.type];
  nAssetSuggest();
}
function nAssetClear(){const e=document.getElementById('f_asset');if(e){e.value='';e.focus()}nAssetSuggest()}
function nAssetSuggest(){
  const box=document.getElementById('as_sug'),inp=document.getElementById('f_asset');if(!box||!inp)return;
  const v=id=>(document.getElementById(id)||{}).value||'',q=inp.value.trim(),cur=q?assetByCode(q):null;
  if(cur){box.className='asug on';box.innerHTML=`<div class="msg" style="padding:6px">✔ ${esc(cur.name)} · ${esc(cur.type||'')} · ${esc(cur.loc||'—')}${isGrp(cur)?' · مجموعة ('+(+cur.qty||1)+')':''} <a href="#" onmousedown="nAssetClear();return false">تغيير</a></div>`;return}
  const tk=s=>String(s||'').split(/[\s+\-_\/()،,]+/).map(nk).map(t=>t.length>3?t.replace(/^ال/,'').replace(/ات$/,''):t).filter(Boolean),hit=(hay,t)=>/^\d+$/.test(t)?new RegExp('(?<!\\d)'+t+'(?!\\d)').test(hay):hay.includes(t);
  const qt=tk(q),lt=tk(v('f_loc')),dt=tk(v('f_details')).filter(t=>t.length>=3);
  if(!qt.length&&!lt.length){box.className='asug';box.innerHTML='';return}
  const res=assets.filter(a=>a.stat!=='مُكهّن').map(a=>{
    const hay=nk([a.code,a.name,a.type,a.loc,a.brand,a.model].join(' ')),ty=nk([a.type,a.name].join(' '));
    if(!((q&&nk(a.code).startsWith(nk(q)))||qt.every(t=>hit(hay,t)))||!lt.every(t=>hit(hay,t)))return null;
    return{a,s:(qt.length&&nk(a.code).startsWith(qt[0])?5:0)+dt.filter(t=>ty.includes(t)).length*2}
  }).filter(Boolean).sort((x,y)=>y.s-x.s||String(x.a.code).localeCompare(String(y.a.code),'en',{numeric:true}));
  box.className='asug on';
  box.innerHTML=res.length?res.slice(0,8).map(({a})=>`<div class="asug-i" onmousedown="nAssetPick('${esc(a.code)}');return false"><b>${esc(a.code)}</b> ${esc(a.name)}<span class="msg"> · ${esc(a.loc||'—')}${isGrp(a)?' · مجموعة':''}</span></div>`).join('')+(res.length>8?'<div class="msg" style="padding:4px 8px">… زوّد كلمات البحث لتضييق النتائج</div>':''):'<div class="msg" style="padding:6px">مفيش أصل مطابق – لو الأصل مش مسجل سيب الخانة فاضية</div>';
}
document.addEventListener('click',e=>{if(!e.target.closest||e.target.closest('#f_asset')||e.target.closest('#as_sug'))return;const b=document.getElementById('as_sug');if(b)b.className='asug'});

/* الدور في الإخطار: المسجّل، وإلا دور الأصل المربوط */
const nFloors=()=>[...new Set(locRows().map(r=>r.f))];
const aFloor=a=>!a?'':(a.f||nFloors().find(f=>String(a.loc||'').startsWith(f))||'');
const nFloor=n=>n.floor||(n.asset?aFloor(assetByCode(n.asset)):'');
const nLoc=n=>n.loc||(n.asset?String((assetByCode(n.asset)||{}).loc||'').split(' – ').pop():'');
