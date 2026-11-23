/* طلبات الشراء + متابعة اعتماد المالية */
/* ---------- طلبات الشراء ---------- */
function vPurch(){
  const need=notices.filter(n=>n.needbuy==='نعم'&&n.status!=='تم الإصلاح').sort((a,b)=>a.n-b.n);
  const undef=need.filter(n=>!purchases.some(p=>p.ref===n.ref)).length;
  const needCard=`<div class="card"><b>إخطارات الصيانة العلاجية التي تحتاج شراء (${need.length}) – غير محدد لها صنف: ${undef}</b>
  <div class="msg hint">مرتبة بترتيب الإخطارات. اكتب الصنف والكمية واضغط إضافة، ويمكن إضافة أكثر من صنف لنفس الإخطار. (تظهر هنا الإخطارات المفتوحة فقط التي اخترت لها «يحتاج شراء = نعم»؛ بعد «تم الإصلاح» بتختفي من هنا.)</div>
  <div class="wrap"><table><tr>${['الإخطار','القسم','وصف العطل','حالة الإخطار','الأصناف المسجلة','صنف جديد','الكمية',''].map(x=>`<th>${x}</th>`).join('')}</tr>
  ${need.map(n=>{const its=purchases.filter(p=>p.ref===n.ref);return `<tr><td>${n.ref}</td><td class="l">${esc(n.dept)}</td><td class="l">${esc(n.details)}</td><td class="${stCls(n.status)}">${esc(n.status)}</td>
  <td class="l ${its.length?'':'s-warn'}">${its.length?its.map(p=>esc(p.item)+' × '+(p.qty??'')+' ('+esc(p.status)+') <button class="btn sm alt" style="padding:2px 8px;min-height:26px" onclick="openEdit(\'purchases\',\''+p.id+'\')">تعديل</button> <button class="btn sm" style="padding:2px 8px;min-height:26px;background:#b42318" onclick="delItem(\'purchases\',\''+p.id+'\')">حذف</button>').join('<br>'):'لم يُحدد صنف'}</td>
  <td><input id="ni_${n.id}" data-keep="1" placeholder="اسم الصنف" style="min-width:150px"></td><td><input id="nq_${n.id}" data-keep="1" type="number" value="1" style="width:70px"></td>
  <td><button class="btn sm" onclick="addItemFor('${n.ref}','${n.id}')">إضافة</button> <button class="btn sm alt" onclick="openPR('${n.ref}')">طباعة PR</button></td></tr>`}).join('')||'<tr><td colspan="8">لا توجد إخطارات تحتاج شراء</td></tr>'}</table></div></div>`;
  let h=needCard+`<div class="card addf"><b>صنف شراء جديد</b><div class="row">
  <label>الإخطار<select id="p_ref">${notices.slice().reverse().map(n=>`<option value="${n.ref}">${n.ref} – ${esc(n.dept)}</option>`).join('')}</select></label>
  <label>تاريخ الطلب<input type="date" id="p_rdate" value="${ymd(new Date())}"></label>
  <label>الصنف<input id="p_item"></label><label>الكمية<input id="p_qty" type="number" value="1" style="width:70px"></label>
  <button class="btn" onclick="savePurch()">حفظ</button><button class="btn alt" onclick="pdf('طلبات_الشراء')">تصدير PDF</button><button class="btn alt" onclick="wordExp('طلبات_الشراء')">تصدير Word</button><button class="btn" onclick="openPR()">طباعة طلب شراء PR (للأصناف المحددة)</button></div></div>
  ${finSummary()}${pFilterBar()}${prBar()}<div class="card wrap" id="rep"><h3>طلبات الشراء – مستشفى الابتسامة</h3><table><tr><th class="noprint"><input type="checkbox" title="تحديد الكل" onchange="selAllPR(this.checked)"></th>${['م','الإخطار','القسم','الصنف','الكمية','رقم PR','تاريخ الطلب','الحالة','اعتماد المالية','مرجع القرار','تاريخ التوريد','تاريخ التركيب'].map(x=>`<th>${x}</th>`).join('')}<th class="noprint">إجراءات</th></tr>`;
  purchases.slice().filter(pfOK).sort((a,b)=>(num(a.ref)||1e9)-(num(b.ref)||1e9)||a.k-b.k).forEach(p=>{const n=notices.find(x=>x.ref===p.ref)||{};
    const refSel=`<select onchange="db.collection('purchases').doc('${p.id}').update({ref:this.value})"><option value=""></option>${notices.slice().reverse().map(x=>`<option value="${x.ref}" ${x.ref===p.ref?'selected':''}>${x.ref}</option>`).join('')}</select>`;
    h+=`<tr><td class="noprint"><input type="checkbox" ${prSel.has(p.id)?'checked':''} onchange="togglePR('${p.id}',this.checked)"></td><td>${p.k}</td><td>${refSel}</td><td class="l">${esc(n.dept||p.notes)}</td><td class="l">${esc(p.item)}</td><td>${p.qty??''}</td><td>${esc(p.prNo||'')}</td><td>${fd(p.rdate)}</td>
    <td class="${['تم الشراء/التوريد','صرف من المخزن','تم التركيب'].includes(p.status)?'s-ok':p.status==='لم يُطلب'?'s-bad':'s-warn'}"><select onchange="setPurchStatus('${p.id}',this.value)">${PST.map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}</select></td>${finCells(p)}<td>${fd(p.ddate)}</td><td>${fd(p.idate)}</td><td class="noprint"><div style="display:flex;gap:4px;justify-content:center"><button class="btn sm alt" onclick="openEdit('purchases','${p.id}')">تعديل</button><button class="btn sm" style="background:#b42318" onclick="delItem('purchases','${p.id}')">حذف</button></div></td></tr>`});
  return h+'</table></div>';
}
/* ---------- متابعة اعتماد المالية لطلب الشراء ---------- */
const finDays=p=>{const d=iso(p.finDate);if(!d)return 0;return Math.floor((new Date(ymd(new Date())+'T12:00:00')-new Date(d+'T12:00:00'))/864e5)};
const finLate=p=>p.fin==='تم الطلب'&&finDays(p)>=FLATE;
const finCls=f=>f==='لم يتم الموافقة'?'s-bad':(f==='تم اكتمال الاعتمادات'||f==='تمت الموافقة والتوريد')?'s-ok':f?'s-warn':'';
function finCells(p){
  const late=finLate(p);
  const sel=`<select onchange="setFin('${p.id}',this.value)"><option value="">— لم يُرسل —</option>${FST.map(s=>`<option ${s===p.fin?'selected':''}>${s}</option>`).join('')}</select>`;
  const info=p.fin?`<div style="font-size:11px;margin-top:2px">${fd(p.finDate)}${late?` <b style="color:#b42318">⏰ متأخر ${finDays(p)} يوم</b>`:''}</div>`:'';
  const ref=`<input value="${esc(p.finRef||'')}" placeholder="رقم/إيميل/ختم" style="min-width:110px;width:100%" onchange="saveFinRef('${p.id}',this.value)">`;
  return `<td class="${late?'s-bad':finCls(p.fin)}">${sel}${info}</td><td class="l">${ref}${p.fin==='لم يتم الموافقة'&&p.finWhy?`<div style="font-size:11px;color:#b42318">السبب: ${esc(p.finWhy)}</div>`:''}</td>`;
}
function finSummary(){
  const c=x=>purchases.filter(p=>p.fin===x).length,none=purchases.filter(p=>!p.fin&&p.status!=='تم التركيب').length,late=purchases.filter(finLate).length;
  const b=(k,l,n,cls)=>`<button class="btn sm ${pf2.fin===k?'':'alt'}" style="${cls?'background:'+cls+';color:#fff;':''}" onclick="pf2.fin=pf2.fin==='${k}'?'':'${k}';render()">${l}: ${n}</button>`;
  return `<div class="card"><div class="fbar qa"><b>متابعة اعتماد المالية:</b>${b('__none','لم يُرسل بعد',none)}${FST.map(x=>b(x,x,c(x),x==='لم يتم الموافقة'&&c(x)?'#b42318':'')).join('')}${late?`<b style="color:#b42318">⏰ ${late} طلب تعدّى ${FLATE} أيام بدون رد</b>`:''}</div>
  <div class="msg hint">لما تسلّم PR للمالية اختار «تم الطلب»، وبعد رد المالية غيّرها حسب القرار واكتب المرجع (رقم الإيميل أو الختم أو الورقة). عند الرفض هيسألك عن السبب. «تمت الموافقة والتوريد» بتحوّل حالة الصنف تلقائياً إلى «تم الشراء/التوريد».</div></div>`;
}
async function setFin(id,v){
  const p=purchases.find(x=>x.id===id);if(!p)return;
  const today=ymd(new Date()),o={fin:v,finDate:v?today:'',finWhy:''};
  if(v==='لم يتم الموافقة'){const w=prompt('سبب الرفض (مهم للمرجع):',p.finWhy||'');if(w===null){render();return}o.finWhy=w.trim()}
  Object.assign(p,o);
  await db.collection('purchases').doc(id).update(o);
  const idx=PST.indexOf(p.status);
  if(v==='تم الطلب'&&idx<2)await setPurchStatus(id,'تم الطلب');
  if(v==='تمت الموافقة والتوريد'&&idx<3)await setPurchStatus(id,'تم الشراء/التوريد');
  toast('تم تسجيل قرار المالية ✓');render();
}
async function saveFinRef(id,v){
  const p=purchases.find(x=>x.id===id);if(!p)return;
  p.finRef=v.trim();await db.collection('purchases').doc(id).update({finRef:p.finRef});toast('تم حفظ المرجع ✓');
}
async function addItemFor(ref,id){
  const item=$('#ni_'+id).value.trim();if(!item){alert('اكتب اسم الصنف');return}
  const k=nextK(),o={k,ref,rdate:ymd(new Date()),item,qty:+$('#nq_'+id).value||1,status:'جاري إعداد الطلب',ddate:'',idate:''};
  await stockCheck(o);
  const pid=uid('p',k);
  if(!purchases.some(x=>x.id===pid))purchases.push({id:pid,...o});
  try{await db.collection('purchases').doc(pid).set(o)}catch(e){purchases=purchases.filter(x=>x.id!==pid);alert('تعذر الحفظ: '+e.message);return}
  $('#ni_'+id).value='';$('#nq_'+id).value=1;
  toast('تمت إضافة الصنف ✓');render();
}
async function setPurchStatus(id,v){
  const p=purchases.find(x=>x.id===id);if(!p)return;
  const today=ymd(new Date());
  const o={status:v,ddate:(v==='تم الشراء/التوريد'||v==='صرف من المخزن'||v==='تم التركيب')?(p.ddate||today):'',idate:v==='تم التركيب'?today:''};
  if(v==='تم الطلب'&&!p.fin){o.fin='تم الطلب';o.finDate=today}
  Object.assign(p,o);await db.collection('purchases').doc(id).update(o);
  if(v!=='تم التركيب'||!p.ref)return;
  const group=purchases.filter(x=>x.ref===p.ref);
  if(!group.every(x=>x.status==='تم التركيب'))return;
  const n=notices.find(x=>x.ref===p.ref);
  if(n&&n.status!=='تم الإصلاح'){
    await upd(n.id,{status:'تم الإصلاح',fixdate:today,viaPurchase:true,notes:(n.notes?n.notes+' | ':'')+'تم الإصلاح تلقائياً بعد الشراء والتركيب'});
    toast('تم تغيير حالة '+n.ref+' إلى «تم الإصلاح» تلقائياً');
  }
}
async function savePurch(){
  const item=$('#p_item').value.trim();if(!item){alert('اكتب اسم الصنف');return}const k=nextK();
  const o={k,ref:$('#p_ref').value,rdate:$('#p_rdate').value,item,qty:+$('#p_qty').value||1,status:'جاري إعداد الطلب',ddate:'',idate:''};
  await stockCheck(o);
  await db.collection('purchases').doc(uid('p',k)).set(o);
  $('#p_item').value='';$('#p_qty').value=1;
  toast('تمت الإضافة ✓');
}
