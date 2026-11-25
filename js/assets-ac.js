/* أصول التكييف: صفحة مستقلة باستيراد وتصدير خاصين (نفس مجموعة assets في Firestore، مفصولة بالنوع «تكييف») */
let acf={q:'',st:'',fl:''},aci=null;
const nk=s=>String(s==null?'':s).toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[\sـ]/g,'');
function fixFloor(t){t=XS(t);if(!t)return'';const fs=[...new Set(locRows().map(r=>r.f))];return fs.find(f=>nk(f)===nk(t))||fs.find(f=>nk(f)===nk('الدور '+t))||t}
const placeLabel=p=>{p=XS(p);return /^\d+$/.test(p)?'غرفة '+p:p};
const AC_HEAD=['الكود','الاسم / الطراز','القدرة','وحدة القدرة','الماركة','الموديل','سنة التركيب','العمر الافتراضي (سنة)','الدور','المكان','قيمة الاستبدال (ج.م)','المواصفات (نوع الوحدة، الغاز...)','ملاحظات'];
function acRows(){return assets.filter(isAC).map(a=>({a,...assetStats(a)}))}
function acOK(x){
  const a=x.a;
  if(acf.st==='خدمة'&&a.stat==='مُكهّن')return false;
  if(acf.st==='شغال'&&(x.st!=='شغال'))return false;
  if(acf.st==='معطل'&&!x.st.startsWith('معطل'))return false;
  if(acf.st==='مُكهّن'&&a.stat!=='مُكهّن')return false;
  if(acf.fl&&a.f!==acf.fl&&!String(a.loc||'').includes(acf.fl))return false;
  return !acf.q||norm([a.code,a.name,a.loc,a.brand,a.model,a.specs].join(' ')).includes(norm(acf.q));
}
function vACBulkCap(){return `<div class="card addf"><b>تعيين القدرة لمجموعة تكييفات دفعة واحدة</b><div class="row" style="margin-top:6px"><label>من كود<input id="bk_f" data-keep="1" placeholder="AC-05"></label><label>إلى كود<input id="bk_t" data-keep="1" placeholder="AC-41"></label><label>القدرة<input id="bk_c" type="number" step="0.25" data-keep="1" style="width:90px"></label><label>الوحدة<select id="bk_u">${CAPU.map(u=>`<option>${u}</option>`).join('')}</select></label><button class="btn" onclick="assetBulkCap()">تطبيق</button></div><div class="msg hint">مثال: من AC-05 إلى AC-20 بقدرة 2.25 حصان. الأكواد لازم تكون بنفس البادئة.</div></div>`}
function vACAssets(){
  const all=acRows(),act=all.filter(x=>x.a.stat!=='مُكهّن'),hp=Math.round(act.filter(x=>x.a.capu==='حصان').reduce((t,x)=>t+(+x.a.cap||0),0)*100)/100;
  const broken=act.filter(x=>x.st!=='شغال').length,noCap=act.filter(x=>!(+x.a.cap>0)).length,old=act.filter(x=>x.age!==null&&x.age>=x.life).length;
  const planned=act.filter(x=>x.a.dec==='استبدال'||x.a.dec==='تكهين').length;
  const fls=[...new Set(locRows().map(r=>r.f))];
  let h=`<div class="card"><div class="grid"><div class="k"><b>${act.length}</b>وحدة تكييف في الخدمة</div><div class="k"><b>${hp}</b>إجمالي القدرة (حصان)</div><div class="k ${broken?'s-warn':''}"><b>${broken}</b>معطل الآن</div><div class="k ${old?'s-warn':''}"><b>${old}</b>تجاوز العمر الافتراضي</div><div class="k"><b>${planned}</b>قرارات استبدال / تكهين</div><div class="k ${noCap?'s-warn':''}"><b>${noCap}</b>بدون قدرة مسجلة</div></div>
  <div class="msg hint">أصول التكييف هنا لوحدها: الاستيراد والتصدير في الصفحة دي بيتعاملوا مع التكييفات بس، وسجل الأصول العادي مابيشملهاش.</div>
  <div class="row" style="margin-top:8px"><button class="btn alt" onclick="exportAC()">تصدير أصول التكييف Excel</button><button class="btn alt" onclick="acTplDownload()">تحميل نموذج الاستيراد</button><label class="btn" style="flex-direction:row">استيراد من Excel<input type="file" accept=".xlsx" onchange="acLoad(this.files[0]);this.value=''" hidden></label></div>${vACImport()}</div>`;
  h+=`<div class="card"><div class="fbar"><label style="flex:2 1 200px">بحث (كود، اسم، موقع، ماركة)<input id="q_ac" data-keep="1" value="${esc(acf.q)}" oninput="liveFilter(this,acf,'q')"></label><label>الحالة<select onchange="liveFilter(this,acf,'st')"><option value="">الكل</option>${[['خدمة','في الخدمة'],['شغال','شغال'],['معطل','معطل'],['مُكهّن','مُكهّن']].map(([k,l])=>`<option value="${k}" ${acf.st===k?'selected':''}>${l}</option>`).join('')}</select></label><label>الدور<select onchange="liveFilter(this,acf,'fl')"><option value="">الكل</option>${fls.map(f=>`<option ${acf.fl===f?'selected':''}>${esc(f)}</option>`).join('')}</select></label><button class="btn sm alt" onclick="acf={q:'',st:'',fl:''};render()">مسح الفلاتر</button></div></div>`;
  const rows=all.filter(acOK).sort((x,y)=>String(x.a.code).localeCompare(String(y.a.code),'en',{numeric:true}));
  h+=`<div class="card wrap"><table><tr>${['الكود','الاسم / الطراز','القدرة','الموقع','الحالة','سنة التركيب / العمر','الأعطال (12 شهر / الكل)','التكلفة (ج.م)','القرار','إجراءات'].map(x=>`<th>${x}</th>`).join('')}</tr>`;
  rows.forEach(x=>{const a=x.a,yr=yearOf(a.inst);
    h+=`<tr><td><b>${esc(a.code)}</b></td><td class="l">${esc(a.name)}<div class="msg">${[a.brand,a.model,a.specs].filter(Boolean).map(esc).join(' · ')}</div></td><td>${+a.cap?a.cap+' '+esc(a.capu||''):'—'}</td><td class="l">${esc(a.loc)}</td><td class="${x.stc}">${x.st}</td><td class="${x.age!==null&&x.age>=x.life?'s-bad':x.age!==null&&x.age>=0.8*x.life?'s-warn':''}">${yr||'—'}<div class="msg">${x.age!==null?x.age+' من '+x.life+' سنة':''}</div></td><td class="${x.r12>=3?'s-bad':x.r12===2?'s-warn':''}">${x.r12} / ${x.ns.length}</td><td>${money(x.cost)}</td><td class="${a.dec==='استبدال'||a.dec==='تكهين'?'s-warn':''}">${a.dec?esc(a.dec)+(a.decDone?' ✔ نُفِّذ':''):'—'}</td><td><div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap"><button class="btn sm alt" onclick="assetDetail('${a.id}')">السجل</button><button class="btn sm" onclick="assetDecide('${a.id}')">قرار</button><button class="btn sm alt" onclick="newFaultFor('${esc(a.code)}')">عطل</button><button class="btn sm alt" onclick="openEdit('assets','${a.id}')">تعديل</button><button class="btn sm" style="background:#b42318" onclick="delItem('assets','${a.id}')">حذف</button></div></td></tr>`});
  h+=(rows.length?'':'<tr><td colspan="10">لا توجد وحدات تكييف مطابقة</td></tr>')+'</table></div>';
  h+=`<div class="card addf"><b>وحدة تكييف جديدة</b><div class="msg hint">سيب الكود فاضي وهيتولّد تلقائي (AC-48 مثلاً).</div><div class="row" style="margin-top:6px"><label>الكود (اختياري)<input id="ac_c" data-keep="1" placeholder="تلقائي"></label><label>الاسم / الطراز<input id="ac_n" data-keep="1"></label><label>القدرة<input id="ac_cap" type="number" step="0.25" data-keep="1" style="width:90px"></label><label>الوحدة<select id="ac_cu">${CAPU.map(u=>`<option>${u}</option>`).join('')}</select></label><label>الماركة<input id="ac_b" data-keep="1" style="width:110px"></label><label>الموديل<input id="ac_md" data-keep="1" style="width:110px"></label><label>سنة التركيب<input id="ac_y" type="number" min="1980" max="2100" data-keep="1" style="width:90px"></label><label>الدور<select id="ac_fl"><option value="">— اختر —</option>${fls.map(f=>`<option>${esc(f)}</option>`).join('')}</select></label><label>الموقع<select id="ac_lc"><option value="">— اختر —</option>${locRows().map((r,i)=>`<option value="${i}">${esc(locLbl(r))}</option>`).join('')}</select></label><label>تفصيل الموقع<input id="ac_l" data-keep="1" placeholder="اختياري"></label><label>المواصفات (نوع الوحدة، الغاز...)<input id="ac_sp" data-keep="1"></label><label>قيمة الاستبدال (ج.م)<input id="ac_v" type="number" data-keep="1"></label><label>ملاحظات<input id="ac_nt" data-keep="1"></label><button class="btn" onclick="acAdd()">إضافة وحدة تكييف</button></div></div>`;
  return h+vACBulkCap();
}
async function acAdd(){
  const n=$('#ac_n').value.trim();let c=$('#ac_c').value.trim();
  if(!n){alert('اكتب اسم / طراز الوحدة');return}
  if(!c)c=nextCodes('تكييف',1)[0];
  if(assetByCode(c)){alert('الكود «'+c+'» مستخدم من قبل');return}
  const li=$('#ac_lc').value,r=li!==''?locRows()[+li]:null,fl=$('#ac_fl').value,x=$('#ac_l').value.trim();
  const base=r?locLbl(r):fl,f=fl||(r?r.f:'');
  const id='as'+Date.now()+'-'+DEV,o={code:c,name:n,type:'تكييف',cap:+$('#ac_cap').value||0,capu:$('#ac_cu').value,loc:[base,x].filter(Boolean).join(' – '),...(r?{b:r.b||'',r:r.r||''}:{}),...(f?{f}:{}),brand:$('#ac_b').value.trim(),model:$('#ac_md').value.trim(),specs:$('#ac_sp').value.trim(),inst:+$('#ac_y').value||'',value:+$('#ac_v').value||0,notes:$('#ac_nt').value.trim(),cond:'جيد ويعمل',mode:'فردي',qty:0};
  assets.push({id,...o});await db.collection('assets').doc(id).set(o);await assetLogAdd(c,'إنشاء','تسجيل الأصل');
  $('#ac_c').value='';$('#ac_n').value='';toast('تمت الإضافة ✓ (الكود '+c+')');
}
/* ---------- التصدير ---------- */
function exportAC(){
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  const list=acRows().sort((x,y)=>String(x.a.code).localeCompare(String(y.a.code),'en',{numeric:true}));
  const head=[...AC_HEAD,'الحالة التشغيلية','عدد الأعطال','أعطال آخر 12 شهراً','تاريخ آخر عطل','إجمالي التكلفة (ج.م)','القرار','سنة التنفيذ المخططة','عمر الجهاز الآن (سنة)'];
  const rows=list.map(x=>{const a=x.a;return[a.code,a.name||'',+a.cap||'',a.capu||'',a.brand||'',a.model||'',yearOf(a.inst)||'',+a.life||'',a.f||'',a.r||(a.f?'':a.loc||''),+a.value||'',a.specs||'',a.notes||'',x.st,x.ns.length,x.r12,toD(x.last)||'',Math.round(x.cost*100)/100,a.dec||'',a.decYear||'',x.age===null?'':x.age]});
  const ws=XLSX.utils.aoa_to_sheet([head,...rows],{cellDates:true});
  ws['!cols']=[10,30,9,10,12,12,11,12,14,22,16,28,28,24,10,12,13,16,14,12,12].map(w=>({wch:w}));ws['!views']=[{RTL:true}];
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'أصول التكييف');
  const fl=[];list.forEach(x=>x.ns.slice().sort((p,q)=>String(iso(p.date)).localeCompare(String(iso(q.date)))).forEach(n=>fl.push([x.a.code,x.a.name||'',n.ref,toD(n.date)||'',n.details||'',n.status||'',Math.round(noticeCost(n)*100)/100])));
  const w2=XLSX.utils.aoa_to_sheet([['الكود','اسم الأصل','الإخطار','التاريخ','العطل','الحالة','التكلفة (ج.م)'],...fl],{cellDates:true});w2['!cols']=[10,30,10,12,40,16,14].map(w=>({wch:w}));w2['!views']=[{RTL:true}];XLSX.utils.book_append_sheet(wb,w2,'أعطال التكييف');
  dl('أصول_التكييف_'+ymd(new Date())+'.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx',cellDates:true}));toast('تم تجهيز ملف أصول التكييف ('+list.length+' وحدة)');
}
/* ---------- النموذج ---------- */
function acTplDownload(){
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  const ex=['مثال (يتجاهله البرنامج)','سبليت 1.5 حصان',1.5,'حصان','كاريير','',2022,12,'الدور الأول','غرفة 101',0,'سبليت – غاز R410',''];
  const ws=XLSX.utils.aoa_to_sheet([AC_HEAD,ex]);ws['!cols']=[22,30,9,10,12,12,11,12,14,22,16,28,28].map(w=>({wch:w}));ws['!views']=[{RTL:true}];
  const wi=XLSX.utils.aoa_to_sheet([['تعليمات استيراد أصول التكييف'],['1) كل سطر = وحدة تكييف واحدة. الاسم إجباري، وباقي الخانات اختيارية.'],['2) الكود فاضي = كود تلقائي (AC-..). كود موجود في البرنامج = تحديث الخانات المكتوبة فقط.'],['3) وحدة القدرة من: '+CAPU.join('، ')+' (لو كتبت قدرة بدون وحدة بتتحسب حصان).'],['4) ممكن تصدّر الأصول الحالية وتعدّلها وترفعها تاني (الأعمدة الإضافية في الآخر بيتجاهلها الاستيراد).'],['5) السطر اللي كوده يبدأ بـ «مثال» بيتجاهله البرنامج.']]);wi['!cols']=[90].map(w=>({wch:w}));wi['!views']=[{RTL:true}];
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'أصول التكييف');XLSX.utils.book_append_sheet(wb,wi,'تعليمات');
  dl('نموذج_استيراد_أصول_التكييف.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx'}));
}
/* ---------- الاستيراد ---------- */
function acParse(wb){
  const out={rows:[],err:[],found:false},codesSeen=new Set(),keysSeen=new Set(assets.map(a=>a.impKey).filter(Boolean)),cnt={};
  for(const name of wb.SheetNames){
    const ws=wb.Sheets[name];if(!ws)continue;const S=xlSheet(ws,['الاسم','القدرة']);if(!S)continue;
    out.found=true;const{raw,hi,h}=S,C={};
    [['code','الكود'],['name','الاسم'],['cap','القدرة'],['capu','وحدة'],['brand','الماركة'],['model','الموديل'],['inst','سنة التركيب'],['life','العمر'],['fl','الدور'],['pl','المكان'],['value','قيمة'],['specs','المواصفات'],['notes','ملاحظات']].forEach(([k,t])=>C[k]=xcol(h,t));
    const g=(r,k)=>C[k]>=0?r[C[k]]:'';
    for(let i=hi+1;i<raw.length;i++){
      const r=raw[i],rowNo=i+1;if(r.every(c=>XS(c)===''))continue;
      const code=XS(g(r,'code'));if(code.startsWith('مثال'))continue;
      const er=m=>out.err.push({row:rowNo,msg:m}),nm=XS(g(r,'name'));
      if(!nm){er('الاسم ناقص');continue}
      const cap=XN(g(r,'cap'));let capu=XS(g(r,'capu'));
      if(capu&&!CAPU.includes(capu)){er('وحدة القدرة «'+capu+'» غير موجودة في القائمة ('+CAPU.join('، ')+')');continue}
      if(cap>0&&!capu)capu='حصان';
      if(code){const lc=code.toLowerCase();if(codesSeen.has(lc)){er('الكود «'+code+'» مكرر في الملف');continue}codesSeen.add(lc)}
      const fl=fixFloor(g(r,'fl')),pl=placeLabel(g(r,'pl')),loc=fl&&pl?fl+' – '+pl:(fl||pl);
      const rec={row:rowNo,code,name:nm,cap,capu,brand:XS(g(r,'brand')),model:XS(g(r,'model')),inst:yearOf(g(r,'inst'))||'',life:XN(g(r,'life'))||'',value:XN(g(r,'value')),specs:XS(g(r,'specs')),notes:XS(g(r,'notes')),f:fl,r:pl,loc};
      const ex=code?assetByCode(code):null;
      if(ex){if(!isAC(ex)){er('الكود «'+code+'» لأصل مش تكييف – مش هيتحدّث من هنا');continue}rec.action='update';rec.id=ex.id;out.rows.push(rec);continue}
      const base=['ac',nm,loc].join('|').toLowerCase();cnt[base]=(cnt[base]||0)+1;const key=base+'|'+cnt[base];
      if(!code&&keysSeen.has(key)){rec.action='skip';out.rows.push(rec);continue}
      rec.action='create';rec.key=key;out.rows.push(rec);
    }
    break;
  }
  return out;
}
async function acLoad(f){
  if(!f)return;
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  let r;try{r=acParse(XLSX.read(await f.arrayBuffer()))}catch(e){alert('تعذر قراءة الملف: '+e.message);return}
  if(!r.found){alert('مش لاقي جدول بعناوين «الاسم» و«القدرة». استخدم «تحميل نموذج الاستيراد» ولا تغيّر العناوين.');return}
  r.file=f.name;aci=r;render();
}
function acCancel(){aci=null;render()}
function vACImport(){
  if(!aci)return'<div id="acmsg" class="msg"></div>';
  const cr=aci.rows.filter(r=>r.action==='create'),up=aci.rows.filter(r=>r.action==='update'),sk=aci.rows.filter(r=>r.action==='skip'),show=aci.rows.filter(r=>r.action!=='skip');
  let h=`<div style="margin-top:10px"><b>معاينة الملف: ${esc(aci.file)}</b></div><div class="grid" style="margin:8px 0"><div class="k s-ok"><b>${cr.length}</b>وحدة جديدة</div><div class="k"><b>${up.length}</b>تحديث وحدة موجودة</div><div class="k"><b>${sk.length}</b>متخطى (مكرر)</div><div class="k ${aci.err.length?'s-bad':''}"><b>${aci.err.length}</b>سطر فيه خطأ</div></div>`;
  if(aci.err.length)h+=`<div class="card s-bad" style="margin-bottom:8px"><b>أخطاء (الأسطر دي مش هتتستورد):</b><br>${aci.err.slice(0,30).map(e=>'سطر '+e.row+': '+esc(e.msg)).join('<br>')}${aci.err.length>30?'<br>… وأخطاء أخرى':''}</div>`;
  if(show.length)h+=`<div class="wrap" style="max-height:260px"><table><tr>${['سطر','الإجراء','الكود','الاسم','القدرة','الموقع'].map(x=>`<th>${x}</th>`).join('')}</tr>${show.slice(0,40).map(r=>`<tr><td>${r.row}</td><td class="${r.action==='create'?'s-ok':''}">${r.action==='create'?'جديد':'تحديث'}</td><td>${esc(r.code||'تلقائي')}</td><td class="l">${esc(r.name)}</td><td>${r.cap?r.cap+' '+esc(r.capu):'—'}</td><td class="l">${esc(r.loc)}</td></tr>`).join('')}</table></div>${show.length>40?'<div class="msg">معروض أول 40 سطر فقط.</div>':''}`;
  h+=`<div class="msg hint" style="margin-top:6px">التحديث بيغيّر الخانات المكتوبة فقط ولا يمسح الفاضي.</div><div class="row" style="margin-top:8px"><button class="btn" ${cr.length+up.length?'':'disabled'} onclick="acApply()">تأكيد الاستيراد</button><button class="btn alt" onclick="acCancel()">إلغاء</button></div><div id="acmsg" class="msg"></div>`;
  return h;
}
async function acApply(){
  if(!aci)return;
  if(!navigator.onLine){alert('لازم تكون متصل بالإنترنت أثناء الاستيراد');return}
  const jobs=[];let cN=0,uN=0;
  for(const r of aci.rows){
    if(r.action==='update'){
      const p={type:'تكييف',name:r.name};
      if(r.loc){p.loc=r.loc;if(r.f)p.f=r.f;if(r.r)p.r=r.r}
      if(r.cap){p.cap=r.cap;p.capu=r.capu}else if(r.capu)p.capu=r.capu;
      if(r.brand)p.brand=r.brand;if(r.model)p.model=r.model;if(r.inst)p.inst=r.inst;if(r.life)p.life=r.life;if(r.value)p.value=r.value;if(r.specs)p.specs=r.specs;if(r.notes)p.notes=r.notes;
      const ex=assets.find(a=>a.id===r.id);if(ex)Object.assign(ex,p);
      jobs.push(()=>db.collection('assets').doc(r.id).update(p));uN++;
    }else if(r.action==='create'){
      const code=r.code||nextCodes('تكييف',1)[0],id='as_'+code;
      const o={code,name:r.name,type:'تكييف',loc:r.loc,...(r.f?{f:r.f}:{}),...(r.r?{r:r.r}:{}),cap:r.cap||0,capu:r.capu||'',brand:r.brand,model:r.model,inst:r.inst,life:r.life,value:r.value||0,specs:r.specs,notes:r.notes,mode:'فردي',qty:0,impKey:r.key,src:'استيراد أصول التكييف'};
      assets.push({id,...o});jobs.push(()=>db.collection('assets').doc(id).set(o));cN++;
    }
  }
  const msg=document.getElementById('acmsg');
  window.NOLOG=true;
  try{
    for(let i=0;i<jobs.length;i+=15){await Promise.all(jobs.slice(i,i+15).map(f=>f()));if(msg)msg.textContent='جاري الحفظ… '+Math.min(i+15,jobs.length)+' من '+jobs.length}
  }catch(e){window.NOLOG=false;alert('حصل خطأ أثناء الحفظ: '+e.message+'\nأعد الاستيراد (الأسطر المكررة بتتخطى تلقائياً).');return}
  window.NOLOG=false;
  aci=null;render();toast('تم الاستيراد ✓ – تكييفات جديدة '+cN+' · تحديث '+uN);
}
