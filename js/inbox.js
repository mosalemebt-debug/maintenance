/* صندوق الوارد وواجهة مدخل البيانات */
/* ---------- صندوق الوارد (مدخل البيانات) ---------- */
const doneI=new Set();
async function procInbox(list){
  list.sort((a,b)=>String(a.o.at).localeCompare(String(b.o.at)));
  for(const x of list){
    if(doneI.has(x.id))continue;doneI.add(x.id);const o=x.o,d=o.data||{};
    try{
      if(o.type==='notice')await addNotice({...d,reporter:d.reporter||'',by:o.by});
      else if(o.type==='purchase'){const k=nextK();await db.collection('purchases').doc(uid('p',k)).set({k,ref:'',rdate:d.rdate,item:d.item,qty:d.qty,status:'جاري إعداد الطلب',ddate:'',notes:d.related||''})}
      else if(o.type==='round')await applyRound(d.date,d.marks,d.notes||{},o.by,d.sup);
      else if(o.type==='mark'){
        const r=rounds[d.date]||{marks:{},notes:{}};r.marks=r.marks||{};r.notes=r.notes||{};r.marks[d.i+'_'+d.j]=d.v;if(d.note)r.notes[d.i]=d.note;rounds[d.date]=r;
        await db.collection('rounds').doc(d.date).set(r);
        const a=ALL[d.i].a,c=CATS[d.j];
        if(d.v==='✗'&&!notices.find(n=>n.src==='مرور'&&n.dept===a&&n.cat===c&&n.status!=='تم الإصلاح'))
          await addNotice({date:d.date,dept:a,reporter:'المرور اليومي',details:(d.note||'عطل')+' – '+c,src:'مرور',cat:c,by:o.by});
      }
      await db.collection('inbox').doc(x.id).delete();
    }catch(e){doneI.delete(x.id)}
  }
}
/* ---------- واجهة مدخل البيانات ---------- */
function toast(t){if(/^(تمت الإضافة|تم إصدار|تم تسجيل|تمت إضافة)/.test(t))document.body.classList.remove('showf');const e=document.createElement('div');e.textContent=t;e.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1f4e79;color:#fff;padding:10px 18px;border-radius:8px;z-index:50';document.body.appendChild(e);setTimeout(()=>e.remove(),1800)}
async function send(o){const id='i'+Date.now()+Math.random().toString(36).slice(2,6);await db.collection('inbox').doc(id).set({...o,by:window.USER_EMAIL,at:new Date().toISOString()});toast(navigator.onLine?'تم الإرسال ✓':'تم الحفظ على الجهاز – هيتبعت لما الإنترنت يرجع')}
function vENotice(){
  return `<div class="card"><b>إخطار جديد</b><div class="row">
  <label>التاريخ<input type="date" id="f_date" value="${ymd(new Date())}"></label><label>الوقت<input type="time" id="f_time"></label>
  <label>القسم<input id="f_dept"></label><label>المكان<input id="f_loc" placeholder="مثال: حمام 201"></label><label>مسؤول الإخطار<input id="f_reporter"></label>
  <label>تفاصيل العطل<textarea id="f_details" rows="2" style="width:240px"></textarea></label><label>الإجراء المتخذ<textarea id="f_action" rows="2" style="width:220px"></textarea></label>
  <label>الحالة<select id="f_status"><option value="" selected>مفتوح</option>${ST.map(s=>`<option>${s}</option>`).join('')}</select></label>
  <label>ممثل الصيانة<input id="f_rep"></label><label>يحتاج شراء؟<select id="f_needbuy"><option>لا</option><option>نعم</option></select></label>
  <label>الأولوية<select id="f_prio"><option value="">تلقائي</option>${PR.map(p=>`<option>${p}</option>`).join('')}</select></label>
  <button class="btn" onclick="eSaveNotice()">إرسال</button></div></div>`;
}
async function eSaveNotice(){
  const o={};['date','time','dept','loc','reporter','details','action','status','rep','needbuy','prio'].forEach(k=>o[k]=$('#f_'+k).value);
  ['trade','asset','cost','aff'].forEach(k=>{const e=$('#f_'+k);if(e)o[k]=(k==='cost'||k==='aff')?(+e.value||0):e.value});
  if(o.asset){o.asset=o.asset.trim();const _a=assetByCode(o.asset);if(!_a&&!confirm('الكود «'+o.asset+'» غير موجود في سجل الأصول. تكمل التسجيل بدون ربط؟'))return;if(_a&&_a.stat==='مُكهّن'&&!confirm('الأصل «'+_a.code+'» مُكهّن (خارج الخدمة). تكمل؟'))return}
  if(!o.dept||!o.details){alert('اكتب القسم وتفاصيل العطل');return}
  if(o.status==='تم الإصلاح')o.fixdate=o.date;
  await send({type:'notice',data:o});$('#f_details').value='';$('#f_action').value='';$('#f_dept').value='';$('#f_loc').value='';
}
function vEPurch(){
  return `<div class="card"><b>طلب شراء جديد</b><div class="row">
  <label>تاريخ الطلب<input type="date" id="p_rdate" value="${ymd(new Date())}"></label>
  <label>الصنف<input id="p_item"></label><label>الكمية<input id="p_qty" type="number" value="1" style="width:70px"></label>
  <label>المرتبط بالعطل (القسم/العطل)<input id="p_rel" style="width:240px"></label><button class="btn" onclick="eSavePurch()">إرسال</button></div></div>`;
}
async function eSavePurch(){const item=$('#p_item').value;if(!item)return;await send({type:'purchase',data:{rdate:$('#p_rdate').value,item,qty:+$('#p_qty').value,related:$('#p_rel').value}});$('#p_item').value='';$('#p_rel').value=''}
