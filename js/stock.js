/* المخزن وقطع الغيار + استيراد/تصدير */
/* ---------- المخزن وقطع الغيار ---------- */
const SF=()=>[['name','الصنف','text'],['qty','الرصيد','number'],['min','الحد الأدنى','number'],['unit','الوحدة','text'],['cost','سعر الوحدة (ج.م)','number'],['loc','مكان التخزين','text'],['notes','ملاحظات','area']];
function findStock(name){const b=String(name||'').trim().toLowerCase();if(!b)return null;return stock.find(x=>{const a=String(x.name||'').trim().toLowerCase();return a&&(a.includes(b)||b.includes(a))})||null}
async function stockCheck(o){
  const st=findStock(o.item);if(!st||!(+st.qty>0))return;
  if(+st.qty>=o.qty){
    if(confirm('الصنف «'+st.name+'» موجود بالمخزن (الرصيد '+st.qty+' '+(st.unit||'')+').\nهل تريد صرفه من المخزن بدلاً من الشراء؟')){
      o.status='صرف من المخزن';o.ddate=ymd(new Date());o.notes='صرف من المخزن';
      await db.collection('stock').doc(st.id).update({qty:st.qty-o.qty});st.qty-=o.qty;toast('تم الصرف من المخزن');
    }
  }else alert('الصنف «'+st.name+'» موجود بالمخزن لكن الرصيد ('+st.qty+') أقل من المطلوب ('+o.qty+'). سيُسجَّل طلب شراء.');
}
/* ---------- استيراد/تصدير المخزن (Excel) ---------- */
let si=null,siMode='set';
const ST_HEAD=['الصنف','الرصيد','الحد الأدنى','الوحدة','سعر الوحدة','مكان التخزين'];
function stockExport(){
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  const rows=stock.map(x=>({'الصنف':x.name,'الرصيد':+x.qty||0,'الحد الأدنى':+x.min||0,'الوحدة':x.unit||'','سعر الوحدة':+x.cost||0,'مكان التخزين':x.loc||''}));
  const ws=XLSX.utils.json_to_sheet(rows.length?rows:[Object.fromEntries(ST_HEAD.map(h=>[h,'']))],{header:ST_HEAD});
  ws['!cols']=[{wch:34},{wch:10},{wch:12},{wch:10},{wch:12},{wch:22}];ws['!views']=[{rightToLeft:true}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'المخزن');
  dl('المخزن_'+ymd(new Date())+'.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx'}));
}
function stockTemplate(){
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  const ws=XLSX.utils.aoa_to_sheet([ST_HEAD,['مثال: كابل 3×2.5 مم',50,10,'متر',45,'مخزن رئيسي']]);
  ws['!cols']=[{wch:34},{wch:10},{wch:12},{wch:10},{wch:12},{wch:22}];ws['!views']=[{rightToLeft:true}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'المخزن');
  dl('نموذج_المخزن.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx'}));
}
function stParse(wb){
  const out={rows:[],err:[]};
  let found=null;
  for(const name of wb.SheetNames){const r=wb.Sheets[name]&&xlSheet(wb.Sheets[name],['الصنف','الرصيد']);if(r){found=r;break}}
  if(!found)return null;
  const{raw,hi,h}=found,C={};
  [['name','الصنف'],['qty','الرصيد'],['min','الحد'],['unit','الوحدة'],['cost','سعر'],['loc','مكان']].forEach(([k,t])=>C[k]=xcol(h,t));
  const g=(r,k)=>C[k]>=0?r[C[k]]:'',has=(r,k)=>C[k]>=0&&XS(r[C[k]])!=='',seen=new Set();
  for(let i=hi+1;i<raw.length;i++){
    const r=raw[i];if(r.every(c=>XS(c)===''))continue;
    const nm=XS(g(r,'name'));
    if(!nm){out.err.push({row:i+1,msg:'اسم الصنف ناقص'});continue}
    if(nm.startsWith('مثال'))continue;
    const lc=nm.toLowerCase();
    if(seen.has(lc)){out.err.push({row:i+1,msg:'الصنف «'+nm+'» مكرر في الملف'});continue}seen.add(lc);
    if(has(r,'qty')&&!isFinite(parseFloat(XS(g(r,'qty')).replace(/[^\d.\-]/g,''))) ){out.err.push({row:i+1,msg:'الرصيد «'+XS(g(r,'qty'))+'» غير صالح'});continue}
    const ex=stock.find(x=>XS(x.name).toLowerCase()===lc);
    out.rows.push({row:i+1,name:nm,qty:XN(g(r,'qty')),hasMin:has(r,'min'),min:XN(g(r,'min')),hasUnit:has(r,'unit'),unit:XS(g(r,'unit')),hasCost:has(r,'cost'),cost:XN(g(r,'cost')),hasLoc:has(r,'loc'),loc:XS(g(r,'loc')),action:ex?'update':'create',id:ex?ex.id:'',old:ex?(+ex.qty||0):0});
  }
  return out;
}
function stNewQty(r){const q=r.qty;return siMode==='add'?r.old+q:siMode==='sub'?Math.max(0,r.old-q):q}
async function stImportLoad(f){
  if(!f)return;
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  let r;try{r=stParse(XLSX.read(await f.arrayBuffer()))}catch(e){alert('تعذر قراءة الملف: '+e.message);return}
  if(!r){alert('مش لاقي ورقة فيها عناوين «الصنف» و«الرصيد». استخدم «تحميل نموذج» أو ملف التصدير ولا تغيّر العناوين.');return}
  r.file=f.name;si=r;render();
}
function stImportCancel(){si=null;render()}
function stSetMode(v){siMode=v;render()}
function vStIO(){
  let h=`<div class="card addf"><b>استيراد / تصدير المخزن (Excel)</b><div class="msg hint">«تصدير» بينزل كل أصناف المخزن في ملف Excel. «استيراد» بيقرا ملف بنفس العناوين (الصنف، الرصيد، الحد الأدنى، الوحدة، سعر الوحدة، مكان التخزين) وبيعرض معاينة قبل أي حفظ.</div>
  <div class="row" style="margin-top:6px"><button class="btn" onclick="stockExport()">تصدير المخزن Excel</button><button class="btn alt" onclick="stockTemplate()">تحميل نموذج فاضي</button><label class="btn" style="flex-direction:row">استيراد من Excel<input type="file" accept=".xlsx,.xls" onchange="stImportLoad(this.files[0]);this.value=''" hidden></label></div>`;
  if(si){
    const cr=si.rows.filter(r=>r.action==='create').length,up=si.rows.filter(r=>r.action==='update').length;
    h+=`<div style="margin-top:10px"><b>معاينة الملف: ${esc(si.file)}</b></div>
    <div class="row" style="margin-top:6px"><label>طريقة التعامل مع الرصيد<select onchange="stSetMode(this.value)"><option value="set" ${siMode==='set'?'selected':''}>استبدال الرصيد بالقيمة في الملف (جرد)</option><option value="add" ${siMode==='add'?'selected':''}>إضافة للرصيد الحالي (وارد)</option><option value="sub" ${siMode==='sub'?'selected':''}>خصم من الرصيد الحالي (صادر)</option></select></label></div>
    <div class="grid" style="margin:8px 0"><div class="k s-ok"><b>${cr}</b>صنف جديد</div><div class="k"><b>${up}</b>تحديث صنف موجود</div><div class="k ${si.err.length?'s-bad':''}"><b>${si.err.length}</b>سطر فيه خطأ</div></div>`;
    if(si.err.length)h+=`<div class="card s-bad" style="margin-bottom:8px"><b>أخطاء (الأسطر دي مش هتتستورد):</b><br>${si.err.slice(0,30).map(e=>'سطر '+e.row+': '+esc(e.msg)).join('<br>')}${si.err.length>30?'<br>… وأخطاء أخرى':''}</div>`;
    h+=`<div class="wrap"><table><tr><th>سطر</th><th>الصنف</th><th>الإجراء</th><th>الرصيد الحالي</th><th>الرصيد بعد الاستيراد</th></tr>${si.rows.slice(0,200).map(r=>`<tr><td>${r.row}</td><td class="l">${esc(r.name)}</td><td class="${r.action==='create'?'s-ok':''}">${r.action==='create'?'جديد':'تحديث'}</td><td>${r.action==='create'?'—':r.old}</td><td>${stNewQty(r)}</td></tr>`).join('')}</table></div>${si.rows.length>200?`<div class="msg">… و${si.rows.length-200} سطر آخر (هيتم استيرادهم)</div>`:''}
    <div class="msg hint" style="margin-top:6px">الخانات الفاضية (الحد الأدنى، الوحدة، السعر، المكان) مش بتمسح القيمة الموجودة. الصنف بيتطابق بالاسم بالظبط.</div>
    <div class="row" style="margin-top:8px"><button class="btn" ${si.rows.length?'':'disabled'} onclick="stImportApply()">تأكيد الاستيراد</button><button class="btn alt" onclick="stImportCancel()">إلغاء</button></div>`;
  }
  return h+`<div id="stmsg" class="msg"></div></div>`;
}
async function stImportApply(){
  if(!si||!si.rows.length)return;
  if(!navigator.onLine){alert('لازم تكون متصل بالإنترنت أثناء الاستيراد');return}
  const jobs=[];let c=0,u=0;
  si.rows.forEach((r,i)=>{
    const qty=stNewQty(r);
    if(r.action==='update'){
      const o={qty};if(r.hasMin)o.min=r.min;if(r.hasUnit)o.unit=r.unit;if(r.hasCost)o.cost=r.cost;if(r.hasLoc)o.loc=r.loc;
      jobs.push(()=>db.collection('stock').doc(r.id).update(o));u++;
    }else{
      const o={name:r.name,qty,min:r.min,unit:r.unit||'قطعة',cost:r.cost,loc:r.loc};
      jobs.push(()=>db.collection('stock').doc('st'+Date.now()+'-'+i+'-'+DEV).set(o));c++;
    }
  });
  const msg=document.getElementById('stmsg');
  try{for(let i=0;i<jobs.length;i+=15){await Promise.all(jobs.slice(i,i+15).map(f=>f()));if(msg)msg.textContent='جاري الحفظ… '+Math.min(i+15,jobs.length)+' من '+jobs.length}}
  catch(e){alert('حصل خطأ أثناء الحفظ: '+e.message+'\nأعد الاستيراد بعد التأكد (في وضع «استبدال» التكرار آمن، لكن في «إضافة/خصم» راجع الأرصدة الأول).');return}
  si=null;render();toast('تم الاستيراد ✓ – أصناف جديدة '+c+' · تحديث '+u);
}
stImportApply=noLog(stImportApply);
function vStock(){
  const low=stock.filter(x=>+x.qty<=+x.min);
  let h=`<div class="card"><div class="grid"><div class="k"><b>${stock.length}</b>صنف في المخزن</div><div class="k ${low.length?'s-bad':''}"><b>${low.length}</b>عند أو تحت الحد الأدنى</div></div><div class="msg hint">عند إضافة صنف لطلب شراء بنفس اسم صنف موجود هنا، يسألك البرنامج هل تصرفه من المخزن بدلاً من الشراء، ويخصم الرصيد تلقائياً.</div></div>
${vStIO()}
  <div class="card addf"><div class="row"><label>الصنف<input id="st_n" data-keep="1"></label><label>الرصيد<input id="st_q" type="number" value="0" data-keep="1" style="width:90px"></label><label>الحد الأدنى<input id="st_m" type="number" value="1" data-keep="1" style="width:90px"></label><label>الوحدة<input id="st_u" data-keep="1" value="قطعة"></label><label>سعر الوحدة<input id="st_c" type="number" data-keep="1"></label><button class="btn" onclick="stockAdd()">إضافة</button></div></div>
  <div class="card wrap"><table><tr>${['الصنف','الرصيد','الحد الأدنى','الوحدة','سعر الوحدة','الحالة','إجراءات'].map(x=>`<th>${x}</th>`).join('')}</tr>`;
  stock.forEach(x=>{const st=+x.qty<=0?'نفد':+x.qty<=+x.min?'منخفض':'متوفر';
    h+=`<tr><td class="l">${esc(x.name)}</td><td><input type="number" data-keep="1" value="${x.qty??0}" style="width:80px" onchange="db.collection('stock').doc('${x.id}').update({qty:+this.value||0})"></td><td>${x.min??''}</td><td>${esc(x.unit)}</td><td>${x.cost?money(x.cost):''}</td><td class="${st==='متوفر'?'s-ok':'s-bad'}">${st}</td>
    <td><div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap"><button class="btn sm alt" onclick="stockAdj('${x.id}',1)">+1</button><button class="btn sm alt" onclick="stockAdj('${x.id}',-1)">−1</button><button class="btn sm alt" onclick="openEdit('stock','${x.id}')">تعديل</button>${st!=='متوفر'?`<button class="btn sm" onclick="stockReorder('${x.id}')">طلب شراء</button>`:''}<button class="btn sm" style="background:#b42318" onclick="delItem('stock','${x.id}')">حذف</button></div></td></tr>`});
  return h+(stock.length?'':'<tr><td colspan="7">المخزن فارغ</td></tr>')+'</table></div>';
}
async function stockAdd(){const n=$('#st_n').value.trim();if(!n){alert('اكتب اسم الصنف');return}
  await db.collection('stock').doc('st'+Date.now()).set({name:n,qty:+$('#st_q').value||0,min:+$('#st_m').value||0,unit:$('#st_u').value,cost:+$('#st_c').value||0});$('#st_n').value='';toast('تمت الإضافة ✓')}
async function stockAdj(id,d){const x=stock.find(s=>s.id===id);if(!x)return;await db.collection('stock').doc(id).update({qty:Math.max(0,(+x.qty||0)+d)})}
async function stockReorder(id){const x=stock.find(s=>s.id===id);if(!x)return;const k=nextK(),q=Math.max((+x.min||1)*2-(+x.qty||0),1);
  const o={k,ref:'',rdate:ymd(new Date()),item:x.name,qty:q,status:'جاري إعداد الطلب',ddate:'',idate:'',notes:'تجديد مخزون'};
  purchases.push({id:uid('p',k),...o});await db.collection('purchases').doc(uid('p',k)).set(o);toast('أُضيف لطلبات الشراء (الكمية '+q+')')}
function saveSet(id,patch){const e=settings[id]=Object.assign({},settings[id],patch);return db.collection('settings').doc(id).set(e)}
