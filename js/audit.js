/* سجل التعديلات */
/* ---------- سجل التعديلات ---------- */
const SEC={notices:'الصيانة العلاجية',purchases:'طلبات الشراء',rounds:'المرور اليومي',assets:'سجل الأصول',stock:'المخزن',jobsheets:'JobSheet'};
const FL={status:'الحالة',details:'العطل',action:'الإجراء',dept:'القسم',loc:'المكان',reporter:'المبلّغ',date:'التاريخ',time:'الوقت',fixdate:'تاريخ الإصلاح',rep:'ممثل الصيانة',needbuy:'يحتاج شراء',notes:'ملاحظات',prio:'الأولوية',cls:'التصنيف',item:'الصنف',qty:'الكمية',price:'السعر',ref:'الإخطار',rdate:'تاريخ الطلب',ddate:'تاريخ التوريد',idate:'تاريخ التركيب',code:'الكود',spec:'مواصفات',task:'المهمة',asset:'الأصل',freq:'التكرار',active:'نشطة',trade:'التخصص',asset:'الأصل',cost:'التكلفة',code:'الكود',name:'الاسم',type:'النوع',loc:'الموقع',value:'قيمة الاستبدال',min:'الحد الأدنى',unit:'الوحدة',title:'المطلوب',req:'الجهة الطالبة',due:'الموعد',pct:'نسبة التنفيذ',doneNote:'المنفذ',no:'الرقم',contractor:'الشركة',refs:'الإخطارات',scope:'نطاق العمل',materials:'المواد',end:'تاريخ التنفيذ',tech:'الفني'};
const SKIP=['id','n','by','src','cat','viaPurchase'];
function wrapDb(raw){
  const T={notices:()=>notices,purchases:()=>purchases,assets:()=>assets,stock:()=>stock,jobsheets:()=>jobsheets};
  const lbl=(c,o)=>c==='notices'?((o.ref||'')+' '+(o.dept||'')).trim():c==='purchases'?(o.item||''):c==='assets'?((o.code||'')+' '+(o.name||'')):c==='stock'?(o.name||''):c==='jobsheets'?((o.no||'')+' '+(o.contractor||'')):'';
  const cut=v=>{v=v===undefined||v===null?'':v;v=typeof v==='object'?JSON.stringify(v):String(v);return v.length>100?v.slice(0,100)+'…':v};
  const diff=(a,b)=>{const ch={};Object.keys(b).forEach(k=>{if(SKIP.includes(k))return;if(JSON.stringify(a[k]??'')!==JSON.stringify(b[k]??''))ch[k]=[cut(a[k]),cut(b[k])]});return ch};
  const log=(col,id,action,o,ch,by)=>{
    if(window.NOLOG||!(col in T||col==='rounds'))return;
    if(action==='تعديل'&&ch&&!Object.keys(ch).length)return;
    raw.collection('auditLog').doc('a'+Date.now()+Math.random().toString(36).slice(2,6)).set({at:new Date().toISOString(),by:by||window.USER_EMAIL||'',col,id,label:col==='rounds'?id:lbl(col,o||{}),action,ch:ch&&Object.keys(ch).length?ch:null}).catch(()=>{});
  };
  return{collection:name=>{const c=raw.collection(name);const find=id=>T[name]?T[name]().find(x=>x.id===id):null;return{
    onSnapshot:cb=>c.onSnapshot(cb),
    doc:id=>{const d=c.doc(id);return{
      set:async v=>{const old=find(id);await d.set(v);if(name==='rounds')log(name,id,'حفظ مرور',v,null);else{const ch=old?diff(old,v):{};log(name,id,(!old||!Object.keys(ch).length)?'إضافة':'تعديل',v,old?ch:null,v&&v.by)}},
      update:async v=>{const old=find(id)||{};await d.update(v);log(name,id,'تعديل',{...old,...v},diff(old,v))},
      delete:async()=>{const old=find(id)||{};await d.delete();log(name,id,'حذف',old,null)}}}}}};
}
function vAudit(){
  const f=auditF,rows=auditLog.filter(a=>(!f.sec||a.col===f.sec)&&(!f.q||(a.label+' '+a.by+' '+JSON.stringify(a.ch||'')).includes(f.q))).slice(0,300);
  const tm=t=>{const d=new Date(t);return isNaN(d)?'':d.toLocaleString('en-GB',{hour12:false}).replace(',','')};
  return `<div class="card"><div class="row"><label>القسم<select onchange="auditF.sec=this.value;render()"><option value="">الكل</option>${Object.entries(SEC).map(([k,v])=>`<option value="${k}" ${f.sec===k?'selected':''}>${v}</option>`).join('')}</select></label><label>بحث (اضغط Enter)<input data-keep="1" value="${esc(f.q)}" onchange="auditF.q=this.value;render()"></label></div><div class="msg hint">يُسجَّل تلقائياً كل إضافة وتعديل وحذف في الإخطارات وطلبات الشراء وحفظ المرور. أحدث 300 عملية.</div></div>
  <div class="card wrap"><table><tr>${['الوقت','المستخدم','القسم','البند','الإجراء','التغييرات'].map(x=>`<th>${x}</th>`).join('')}</tr>
  ${rows.map(a=>`<tr><td>${tm(a.at)}</td><td>${esc(a.by)}</td><td>${SEC[a.col]||a.col}</td><td class="l">${esc(a.label)}</td><td class="${a.action==='حذف'?'s-bad':a.action==='إضافة'?'s-ok':''}">${a.action}</td><td class="l">${a.ch?Object.entries(a.ch).map(([k,v])=>`${FL[k]||k}: ${esc(v[0])||'—'} ← ${esc(v[1])||'—'}`).join('<br>'):''}</td></tr>`).join('')||'<tr><td colspan="6">لا توجد عمليات مسجلة بعد</td></tr>'}</table></div>`;
}
let auditF={sec:'',q:''};
