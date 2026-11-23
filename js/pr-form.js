/* نموذج طلب الشراء PR وترقيمه */
/* ---------- نموذج طلب الشراء PR ---------- */
let prSel=new Set(),PRS=null;
function togglePR(id,on){on?prSel.add(id):prSel.delete(id);const c=document.getElementById('prc');if(c)c.textContent=prSel.size}
function prBar(){return `<div class="card"><div class="fbar qa"><b>تجميع طلبات الشراء في PR واحد: <span id="prc">${prSel.size}</span> صنف محدد</b>
  <button class="btn alt sm" onclick="selAllPR(true)">تحديد الكل (المعروض)</button><button class="btn alt sm" onclick="selPend()">تحديد غير المطلوب بعد</button><button class="btn alt sm" onclick="selAllPR(false)">إلغاء التحديد</button>
  <button class="btn" onclick="openPR()">🖨️ طباعة / إرسال للمالية</button><button class="btn alt" onclick="markReq()">تعليم المحدد «تم الطلب»</button></div>
  <div class="msg">علّم الأصناف من خانة الاختيار أول كل صف (أو استخدم أزرار التحديد)، ثم اضغط «طباعة / إرسال للمالية». ممكن تختار أصناف من إخطارات مختلفة وتطلع في نموذج PR واحد.</div></div>`}
function selAllPR(on){purchases.filter(pfOK).forEach(p=>on?prSel.add(p.id):prSel.delete(p.id));render()}
function selPend(){prSel.clear();purchases.filter(pfOK).filter(p=>['لم يُطلب','جاري إعداد الطلب'].includes(p.status)).forEach(p=>prSel.add(p.id));render()}
async function markReq(){
  const ids=[...prSel].filter(i=>{const p=purchases.find(x=>x.id===i);return p&&['لم يُطلب','جاري إعداد الطلب'].includes(p.status)});
  if(!ids.length){alert('مفيش أصناف محددة حالتها «جاري إعداد الطلب» أو «لم يُطلب»');return}
  if(!confirm('تغيير حالة '+ids.length+' صنف إلى «تم الطلب»؟'))return;
  for(const i of ids)await setPurchStatus(i,'تم الطلب');
  prSel.clear();toast('تم تحديث الحالة ✓');render();
}
/* ---------- ترقيم طلبات الشراء PR تلقائياً ---------- */
const PR_PFX=()=>'PR-'+new Date().getFullYear()+'-';
function prSeq(no){const m=String(no||'').match(/^PR-(\d{4})-(\d+)$/);return m&&m[1]===String(new Date().getFullYear())?+m[2]:0}
function prNextNo(){
  const last=Math.max(+((settings.prcounter||{}).last)||0,...purchases.map(p=>prSeq(p.prNo)),0);
  return PR_PFX()+String(last+1).padStart(3,'0');
}
function prAutoNo(items){
  const nos=[...new Set(items.map(p=>p.prNo).filter(Boolean))];
  return nos.length===1&&items.every(p=>p.prNo===nos[0])?nos[0]:prNextNo();
}
async function prCommit(){
  if(!PRS||!PRS.no||PRS.committed===PRS.no)return;
  const no=PRS.no.trim();if(!no)return;
  const items=PRS.ids.map(i=>purchases.find(p=>p.id===i)).filter(Boolean);
  try{
    await Promise.all(items.filter(p=>p.prNo!==no).map(p=>{p.prNo=no;return db.collection('purchases').doc(p.id).update({prNo:no})}));
    const seq=prSeq(no);
    if(seq>(+((settings.prcounter||{}).last)||0))await saveSet('prcounter',{last:seq});
    PRS.committed=no;
  }catch(e){alert('تعذر حفظ رقم الـ PR: '+e.message)}
}
function openPR(ref){
  const items=(ref?purchases.filter(p=>p.ref===ref):[...prSel].map(i=>purchases.find(p=>p.id===i)).filter(Boolean)).sort((a,b)=>(num(a.ref)||1e9)-(num(b.ref)||1e9)||a.k-b.k);
  if(!items.length){alert('حدّد صنفاً واحداً على الأقل من عمود PR، أو أضف أصنافاً للإخطار أولاً');return}
  const refs=[...new Set(items.map(p=>p.ref).filter(Boolean))];
  const spec=refs.map(r=>{const n=notices.find(x=>x.ref===r);return n?r+': '+(n.dept||'')+' – '+(n.details||''):''}).filter(Boolean).join('؛ ');
  PRS={ids:items.map(p=>p.id),no:prAutoNo(items),by:localStorage.getItem('pr_by')||'إدارة الهندسية والصيانة',head:localStorage.getItem('pr_head')||'م/ محمد خالد المحمدي',isNew:'لا',repl:'',budget:'',spec};
  prShow();
}
function prShow(){
  const old=document.getElementById('prv');if(old)old.remove();
  const o=document.createElement('div');o.id='prv';
  const f=(k,l,t)=>`<label>${l}<input value="${esc(PRS[k])}" oninput="PRS.${k}=this.value;prRender()"></label>`;
  const sel=(k,l)=>`<label>${l}<select onchange="PRS.${k}=this.value;prRender()">${['','نعم','لا'].map(v=>`<option ${v===PRS[k]?'selected':''}>${v}</option>`).join('')}</select></label>`;
  o.innerHTML=`<div class="prtools"><b>طلب شراء PR – معاينة قبل الطباعة</b><div class="row" style="margin-top:6px">${f('no','رقم طلب الشراء')}${f('by','الجهة الطالبة')}${f('head','اسم مدير الصيانة')}${sel('isNew','صنف جديد؟')}${sel('repl','يحل محل صنف مستخدم؟')}${sel('budget','ضمن الموازنة والخطط؟')}<label style="flex:2 1 300px">المواصفات / سبب الطلب<textarea rows="2" style="min-width:0" oninput="PRS.spec=this.value;prRender()">${esc(PRS.spec)}</textarea></label></div>
  <div class="row" style="margin-top:8px"><button class="btn" onclick="prCommit().then(()=>window.print())">طباعة</button><button class="btn alt" onclick="prPdf()">تحميل PDF</button><button class="btn alt" onclick="prPdf(true)">📤 مشاركة PDF للمالية</button><button class="btn alt" onclick="document.getElementById('prv').remove()">إغلاق</button></div></div><div id="prpages"></div>`;
  document.body.appendChild(o);prRender();
}
const ck=v=>v?'☒':'☐';
function prRender(){
  localStorage.setItem('pr_by',PRS.by);localStorage.setItem('pr_head',PRS.head);
  const items=PRS.ids.map(i=>purchases.find(p=>p.id===i)).filter(Boolean);
  const pages=[];for(let i=0;i<items.length;i+=7)pages.push(items.slice(i,i+7));
  const bi=(en,ar)=>`<div class="bi"><span>${en}</span><span class="ar">${ar}</span></div>`;
  const box=(en,ar,v)=>`<td style="text-align:left">${bi(en,ar)}<div style="min-height:14px;text-align:center;font-weight:700">${esc(v||'')}</div></td>`;
  const sig=(en,ar,name)=>`<tr><td style="width:32%">${bi(en,ar)}</td><td style="height:52px">${esc(name||'')}</td><td></td><td></td></tr>`;
  const hd=`<tr><th>${bi('Authorized By','يعتمد')}</th><th>${bi('Name','الاسم')}</th><th>${bi('Sign Name','التوقيع')}</th><th>${bi('Date','التاريخ')}</th></tr>`;
  document.getElementById('prpages').innerHTML=pages.map((pg,pi)=>{
    const rows=[...Array(7)].map((_,r)=>{const p=pg[r];const n=pi*7+r+1;if(!p)return `<tr><td>${n}</td><td></td><td style="height:20px"></td><td></td></tr>`;
      return `<tr><td>${n}</td><td>${esc(p.code||'')}</td><td class="ar">${esc(p.item)}${p.spec?' – '+esc(p.spec):''}</td><td>${p.qty??''}</td></tr>`}).join('');
    return `<div class="prpage">
    <table><tr><td style="width:22%;border:0"></td><td style="border:0"><div class="t">Purchase Requisition (PR) طلب الشراء</div></td><td style="width:26%;border:0"><b>مستشفى الابتسامة</b><br>Al Ebtesama Hospital<br>${esc(PRS.by)}</td></tr></table>
    <table style="margin-top:4px"><tr>${box('PR No.','رقم طلب الشراء',PRS.no+(pages.length>1?' ('+(pi+1)+'/'+pages.length+')':''))}${box('Requested By','الجهة الطالبة',PRS.by)}</tr></table>
    <table style="margin-top:4px"><tr><td style="text-align:left;height:70px;vertical-align:top">${bi('Specifications','المواصفات')}<div class="g">(Please specify the item as much as possible or /and attached details specifications or catalogues, data sheets …etc)</div><div class="ar" style="margin-top:4px">${esc(PRS.spec)}</div></td></tr></table>
    <table style="margin-top:4px"><tr><td style="text-align:left">${bi('New Item','صنف جديد')}<div style="text-align:center">Yes ${ck(PRS.isNew==='نعم')} &nbsp; No ${ck(PRS.isNew==='لا')}</div></td><td style="text-align:left">${bi('If Yes, Does It Replace For Current Used Item','هل يحل محل صنف مستخدم')}<div style="text-align:center">Yes ${ck(PRS.repl==='نعم')} &nbsp; No ${ck(PRS.repl==='لا')}</div></td></tr></table>
    <table style="margin-top:4px"><tr><td>${bi('Item Code','كود الصنف')}</td><td>${bi('Current Stock','الرصيد الحالي')}</td><td>${bi('Current Stock Value','قيمة الرصيد')}</td></tr></table>
    <table style="margin-top:4px"><tr><th style="width:6%">S<br>م</th><th style="width:16%">Item Code<br>كود الصنف</th><th>Description<br>وصف الصنف</th><th style="width:18%">Quantity Per Month/Year/Single<br>الكمية</th></tr>${rows}</table>
    <table style="margin-top:4px"><tr><td style="text-align:left">${bi('Budget/Planned','الموازنة والخطط')}<div style="text-align:center">Yes ${ck(PRS.budget==='نعم')} &nbsp; No ${ck(PRS.budget==='لا')}</div></td></tr></table>
    <table style="margin-top:6px">${hd}${sig('Maintenance Manager','مدير الصيانة',PRS.head)}${sig('Hospital Manager','مدير المستشفى','')}${sig('Finance Department','الإدارة المالية','')}</table>
    <table style="margin-top:6px"><tr><td style="text-align:left;height:34px">${bi('Received Date With Required Authorization By Supply Chain','تم الاستلام بالتاريخ والاعتمادات المطلوبة في')}<div style="margin-top:6px">By: ____________ &nbsp;&nbsp; On: ____________ &nbsp;&nbsp; At: ____________</div></td></tr></table></div>`}).join('');
}
async function prPdf(share){if(typeof PRS!=='undefined'&&PRS&&PRS.ids)await prCommit();
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'p',unit:'pt',format:'a4'}),W=doc.internal.pageSize.getWidth()-30,Hh=doc.internal.pageSize.getHeight()-30;
  const els=[...document.querySelectorAll('#prpages .prpage')];
  for(let i=0;i<els.length;i++){const cv=await html2canvas(els[i],{scale:2,backgroundColor:'#ffffff'});let h=cv.height*W/cv.width,w=W;if(h>Hh){w=W*Hh/h;h=Hh}if(i)doc.addPage();doc.addImage(cv.toDataURL('image/jpeg',.95),'JPEG',15,15,w,h)}
  const nm='طلب_شراء_PR_'+ymd(new Date())+'.pdf',buf=doc.output('arraybuffer');
  if(share&&navigator.canShare){const f=new File([buf],nm,{type:'application/pdf'});if(navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'طلب شراء PR'});return}catch(e){if(e.name==='AbortError')return}}}
  dl(nm,buf);
}
async function pdf(name){
  const el=$('#rep');document.body.classList.add('pdfing');const cv=await html2canvas(el,{scale:2,backgroundColor:'#ffffff'});document.body.classList.remove('pdfing');
  const {jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'l',unit:'pt',format:'a4'});
  const W=doc.internal.pageSize.getWidth()-40,H=doc.internal.pageSize.getHeight()-40,ih=cv.height*W/cv.width;
  let y=0;while(y<ih){doc.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',20,20-y,W,ih);y+=H;if(y<ih)doc.addPage()}
  dl(name+'_'+ymd(new Date())+'.pdf',doc.output('arraybuffer'));
}

function wordExp(name){
  const src=$('#rep');if(!src){alert('لا يوجد تقرير لتصديره');return}
  const el=src.cloneNode(true);
  el.querySelectorAll('.noprint,button,script,svg').forEach(x=>{const w=x.tagName==='svg'&&x.parentElement&&x.parentElement!==el?x.parentElement:x;w.remove()});
  el.querySelectorAll('select').forEach(x=>{const p=document.createElement('span');p.textContent=x.options[x.selectedIndex]?x.options[x.selectedIndex].text:'';x.replaceWith(p)});
  el.querySelectorAll('input,textarea').forEach(x=>{const p=document.createElement('span');p.textContent=x.type==='checkbox'?(x.checked?'☒':'☐'):x.value;x.replaceWith(p)});
  el.querySelectorAll('.grid').forEach(g=>{const t=document.createElement('table'),r=t.insertRow();[...g.children].forEach(k=>{const c=r.insertCell();c.innerHTML=k.innerHTML});g.replaceWith(t)});
  el.querySelectorAll('[contenteditable]').forEach(x=>{x.removeAttribute('contenteditable');x.removeAttribute('id')});
  const css='@page{size:A4;margin:2cm}body{font-family:Arial,"Traditional Arabic",sans-serif;direction:rtl;text-align:right;font-size:12pt}'
   +'table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px;text-align:center}td.l,th.l{text-align:right}th{background:#1f4e79;color:#fff}'
   +'h3{color:#1f4e79}h4{color:#1f4e79;border-bottom:1px solid #999}b{font-weight:bold}.s-ok{background:#d9f2e0}.s-warn{background:#fff3cd}.s-bad{background:#f8d7da}.msg{color:#555;font-size:10pt}';
  const html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>'+esc(name)+'</title>'
   +'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>'+css+'</style></head><body dir="rtl">'+el.innerHTML+'</body></html>';
  return dl(name+'_'+ymd(new Date())+'.doc',new TextEncoder().encode('\ufeff'+html).buffer);
}

