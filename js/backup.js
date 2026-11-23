/* النسخ الاحتياطي */
/* ---------- النسخ الاحتياطي ---------- */
function vBackup(){
  const lb=localStorage.getItem('lastBackup');
  return `<div class="card"><b>النسخ الاحتياطي</b><div class="msg">آخر نسخة من هذا الجهاز: ${lb?dFmt(lb):'لا يوجد'}. يُنصح بنسخة أسبوعية على الأقل.</div>
  <div class="row" style="margin-top:8px"><button class="btn" onclick="backupJSON()">تحميل نسخة كاملة (JSON)</button><button class="btn alt" onclick="backupXlsx()">تحميل Excel (للقراءة والتحليل)</button>
  <label class="btn alt" style="flex-direction:row">استعادة من ملف JSON<input type="file" accept=".json" onchange="restoreJSON(this.files[0])" hidden></label></div>
  <div id="bkmsg" class="msg"></div></div>
  <div class="card"><div class="msg hint">ملف JSON يحتوي كل البيانات (الإخطارات وطلبات الشراء والمرور اليومي والأصول والمخزن) وهو الذي تُجرى منه الاستعادة. الاستعادة تضيف وتحدّث السجلات الموجودة في الملف ولا تحذف ما غيره.</div></div>`;
}
const bkData=()=>({app:'maintenance',v:1,at:new Date().toISOString(),notices,purchases,rounds,settings,assets,stock,jobsheets,assetLog,audit:auditLog});
function backupJSON(){const d=bkData();dl('نسخة_احتياطية_'+ymd(new Date())+'.json',new Blob([JSON.stringify(d)],{type:'application/json'}));localStorage.setItem('lastBackup',ymd(new Date()));render()}
function backupXlsx(){
  const wb=XLSX.utils.book_new(),add=(n,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{}]),n);
  add('الصيانة العلاجية',notices.map(n=>({م:n.n,المرجع:n.ref,التاريخ:n.date,الوقت:n.time,القسم:n.dept,المكان:n.loc,المبلّغ:n.reporter,العطل:n.details,الإجراء:n.action,الحالة:n.status,'تاريخ الإصلاح':n.fixdate,'ممثل الصيانة':n.rep,'يحتاج شراء':n.needbuy,الأولوية:n.prio,ملاحظات:n.notes})));
  add('طلبات الشراء',purchases.map(p=>({م:p.k,الإخطار:p.ref,الصنف:p.item,الكمية:p.qty,الحالة:p.status,'تاريخ الطلب':p.rdate,'اعتماد المالية':p.fin,'تاريخ قرار المالية':p.finDate,'مرجع القرار':p.finRef,'سبب الرفض':p.finWhy,'تاريخ التوريد':p.ddate,'تاريخ التركيب':p.idate,ملاحظات:p.notes})));
  const rr=[];Object.entries(rounds).forEach(([d,r])=>Object.entries(r.marks||{}).forEach(([k,v])=>{const [i,j]=k.split('_');rr.push({التاريخ:d,المشرف:r.sup||'',المكان:ALL[i].a,التخصص:CATS[j],النتيجة:v})}));add('المرور اليومي',rr);
  add('JobSheet',jobsheets.map(j=>({الرقم:j.no,الشركة:j.contractor,التاريخ:j.date,الإخطارات:j.refs,الموقع:j.dept,'نطاق العمل':j.scope,الحالة:j.status,'التكلفة النهائية':j.cost})));
  add('الأصول',assets.map(a=>({الكود:a.code,الاسم:a.name,النوع:a.type,الموقع:a.loc,'قيمة الاستبدال':a.value,الطريقة:a.mode||'فردي',العدد:a.qty||''})));
  add('المخزن',stock.map(x=>({الصنف:x.name,الرصيد:x.qty,'الحد الأدنى':x.min,الوحدة:x.unit,'سعر الوحدة':x.cost})));
  add('سجل التعديلات',auditLog.map(a=>({الوقت:a.at,المستخدم:a.by,القسم:SEC[a.col]||a.col,البند:a.label,الإجراء:a.action,التغييرات:a.ch?Object.entries(a.ch).map(([k,v])=>(FL[k]||k)+': '+v[0]+' ← '+v[1]).join(' | '):''})));
  dl('نسخة_Excel_'+ymd(new Date())+'.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx'}));localStorage.setItem('lastBackup',ymd(new Date()));render();
}
async function restoreJSON(f){
  if(!f)return;let d;try{d=JSON.parse(await f.text())}catch(e){alert('الملف غير صالح');return}
  if(d.app!=='maintenance'||!confirm('استعادة البيانات من النسخة؟ سيتم تحديث السجلات المطابقة.'))return;
  const m=document.getElementById('bkmsg');let c=0;
  const put=async(col,arr)=>{for(const x of arr){const {id,...rest}=x;await db.collection(col).doc(id).set(rest);c++;if(m&&c%20===0)m.textContent='جاري الاستعادة... '+c}};
  await put('notices',d.notices||[]);await put('purchases',d.purchases||[]);await put('assets',d.assets||[]);await put('assetLog',d.assetLog||[]);await put('jobsheets',d.jobsheets||[]);await put('stock',d.stock||[]);
  for(const [id,r] of Object.entries(d.rounds||{})){await db.collection('rounds').doc(id).set(r);c++}
  if(m)m.textContent='تمت استعادة '+c+' سجل.';toast('تمت الاستعادة ✓');
}
