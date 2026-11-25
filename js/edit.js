/* تعديل / حذف */
/* ---------- تعديل / حذف ---------- */
let EM=null;
const NF=()=>[['date','التاريخ','date'],['time','الوقت','time'],['dept','القسم','text'],['floor','الدور','select',['',...nFloors()]],['loc','المكان','text'],['reporter','مسؤول الإخطار','text'],['details','تفاصيل العطل','area'],['action','الإجراء المتخذ','area'],['status','الحالة (فارغ = مفتوح)','select',['',...ST]],['fixdate','تاريخ الإصلاح','date'],['rep','ممثل الصيانة','text'],['needbuy','يحتاج شراء؟','select',['','نعم','لا']],['prio','الأولوية (فارغ = تلقائي)','select',['',...PR]],['trade','التخصص','select',['',...TRD]],['asset','الأصل (الكود)','text'],['aff','العدد المتأثر (لو الأصل مجموعة)','number'],['cost','تكلفة الإصلاح / الخدمة (ج.م)','number'],['notes','ملاحظات','area'],['cls','التصنيف','text']];
function openEdit(kind,id){
  const isN=kind==='notices',row=({notices,purchases,assets,stock,jobsheets}[kind]).find(x=>x.id===id);if(!row)return;
  const F=isN?NF():kind==='assets'?AF():kind==='stock'?SF():kind==='jobsheets'?JF():[['ref','الإخطار','select',['',...notices.slice().sort((a,b)=>a.n-b.n).map(n=>n.ref)]],['rdate','تاريخ الطلب','date'],['item','الصنف','text'],['code','كود الصنف','text'],['qty','الكمية','number'],['price','سعر الشراء الفعلي للوحدة (ج.م) – يُسجل بعد الشراء','number'],['spec','مواصفات إضافية','area'],['status','الحالة','select',PST],['fin','اعتماد المالية','select',['',...FST]],['finDate','تاريخ قرار المالية','date'],['finRef','مرجع القرار (رقم/إيميل/ختم)','text'],['finWhy','سبب الرفض','text'],['ddate','تاريخ التوريد','date'],['idate','تاريخ التركيب','date'],['notes','ملاحظات','area']];
  EM={kind,id,F};closeEdit();
  const d=document.createElement('div');d.id='md';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;overflow:auto;padding:12px';
  const fld=([k,l,t,o])=>{const v=t==='date'?iso(row[k]):row[k];
    return `<label>${l}${t==='area'?`<textarea id="e_${k}" rows="2" style="min-width:0">${esc(v)}</textarea>`:t==='select'?`<select id="e_${k}">${o.map(x=>`<option value="${esc(x)}" ${x===(row[k]||'')?'selected':''}>${esc(x)}</option>`).join('')}</select>`:`<input id="e_${k}" type="${t}" value="${esc(v)}">`}</label>`};
  d.innerHTML=`<div class="card" style="max-width:760px;margin:16px auto"><b>${isN?'تعديل الإخطار '+row.ref:kind==='assets'?'تعديل أصل '+row.code:kind==='stock'?'تعديل صنف مخزن':kind==='jobsheets'?'تعديل JobSheet '+(row.no||''):'تعديل صنف الشراء'}</b><div class="grid" style="margin-top:8px">${F.map(fld).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" onclick="saveEdit()">حفظ</button><button class="btn alt" onclick="closeEdit()">إلغاء</button></div></div>`;
  document.body.appendChild(d);
}
function closeEdit(){const m=document.getElementById('md');if(m)m.remove()}
async function saveEdit(){
  const {kind,id,F}=EM,o={};
  F.forEach(([k,l,t])=>{let v=document.getElementById('e_'+k).value;if(t==='number')v=+v||0;o[k]=v});
  if(kind==='notices'&&o.status==='تم الإصلاح'&&!o.fixdate)o.fixdate=ymd(new Date());
  if(kind==='purchases'&&o.status==='تم التركيب'){if(!o.idate)o.idate=ymd(new Date());if(!o.ddate)o.ddate=o.idate}
  await db.collection(kind).doc(id).update(o);
  if(kind==='purchases'){const p=purchases.find(x=>x.id===id);if(p)Object.assign(p,o);if(o.status==='تم التركيب')await checkAutoClose(o.ref)}
  closeEdit();toast('تم الحفظ ✓');
}
async function checkAutoClose(ref){
  if(!ref)return;const g=purchases.filter(x=>x.ref===ref);
  if(!g.length||!g.every(x=>x.status==='تم التركيب'))return;
  const n=notices.find(x=>x.ref===ref);
  if(n&&n.status!=='تم الإصلاح'){await upd(n.id,{status:'تم الإصلاح',fixdate:ymd(new Date()),viaPurchase:true,notes:(n.notes?n.notes+' | ':'')+'تم الإصلاح تلقائياً بعد الشراء والتركيب'});toast('تم تغيير حالة '+n.ref+' إلى «تم الإصلاح» تلقائياً')}
}
async function delItem(kind,id){
  if(kind==='notices'){
    const n=notices.find(x=>x.id===id);if(!n)return;const its=purchases.filter(p=>p.ref===n.ref);
    if(!confirm('حذف الإخطار '+n.ref+' ('+(n.dept||'')+')؟'+(its.length?'\nمرتبط بـ '+its.length+' صنف شراء وسيُفك ارتباطها.':'')))return;
    for(const p of its)await db.collection('purchases').doc(p.id).update({ref:'',notes:((p.notes||'')+' (الإخطار '+n.ref+' محذوف)').trim()});
    await db.collection('notices').doc(id).delete();
  }else if(['assets','stock','jobsheets'].includes(kind)){
    const x=({assets,stock,jobsheets}[kind]).find(y=>y.id===id);if(!x||!confirm('حذف «'+(x.name||x.code||x.no)+'»؟'))return;
    await db.collection(kind).doc(id).delete();
  }else{
    const p=purchases.find(x=>x.id===id);if(!p)return;
    if(!confirm('حذف صنف الشراء «'+p.item+'»؟'))return;
    await db.collection('purchases').doc(id).delete();
  }
  toast('تم الحذف');
}
