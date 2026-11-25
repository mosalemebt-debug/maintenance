/* استيراد الأصول والمخزن من Excel */
/* ---------- استيراد الأصول والمخزن من نموذج Excel ---------- */
function tplDownload(){const b=atob(TPL_B64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);dl('نموذج_استيراد_الأصول.xlsx',new Blob([u],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))}
let xi=null;
const XS=v=>String(v==null?'':v).trim();
const XN=v=>{if(typeof v==='number')return isFinite(v)?v:0;const n=parseFloat(XS(v).replace(/[^\d.\-]/g,''));return isFinite(n)?n:0};
function xlSheet(ws,needs){
  const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
  for(let i=0;i<Math.min(raw.length,15);i++){const h=raw[i].map(XS);if(needs.every(n=>h.some(c=>c.startsWith(n))))return{raw,hi:i,h}}
  return null;
}
const xcol=(h,k)=>h.findIndex(c=>c.startsWith(k));
function xlParse(wb){
  const out={rows:[],err:[],stock:[],stErr:[],hasA:false,hasS:false};
  const codesSeen=new Set(),keysSeen=new Set(assets.map(a=>a.impKey).filter(Boolean));
  for(const name of wb.SheetNames){
    const ws=wb.Sheets[name];if(!ws)continue;
    const A=!out.hasA&&xlSheet(ws,['النوع','الاسم']);
    if(A){out.hasA=true;const{raw,hi,h}=A,C={};
      [['code','الكود'],['mode','طريقة'],['type','النوع'],['name','الاسم'],['qty','العدد'],['fl','الدور'],['pl','المكان'],['brand','الماركة'],['model','الموديل'],['cap','القدرة'],['capu','وحدة'],['inst','سنة'],['life','العمر'],['value','قيمة'],['qf','منها يحتاج'],['qd','منها تالف'],['notes','ملاحظات']].forEach(([k,t])=>C[k]=xcol(h,t));
      const g=(r,k)=>C[k]>=0?r[C[k]]:'';
      for(let i=hi+1;i<raw.length;i++){
        const r=raw[i],rowNo=i+1;
        if(r.every(c=>XS(c)===''))continue;
        if(XS(g(r,'code')).startsWith('مثال'))continue;
        const er=m=>out.err.push({row:rowNo,msg:m});
        const code=XS(g(r,'code')),type=XS(g(r,'type')),nm=XS(g(r,'name'));
        if(!nm){er('الاسم ناقص');continue}
        if(type==='تكييف'){er('أصول التكييف ليها صفحة واستيراد مستقل (قائمة «أصول التكييف»)');continue}
        if(!ATY.includes(type)){er(type?'النوع «'+type+'» غير موجود في القائمة':'النوع ناقص');continue}
        let mode=XS(g(r,'mode'));
        if(!mode)mode=GRP_TYPES.includes(type)?'مجموعة':'فردي';
        if(mode!=='فردي'&&mode!=='مجموعة'){er('طريقة التسجيل لازم تكون فردي أو مجموعة');continue}
        let qty=Math.floor(XN(g(r,'qty'))),qf=Math.floor(XN(g(r,'qf'))),qd=Math.floor(XN(g(r,'qd')));
        if(mode==='مجموعة'){
          if(qty<1){er('العدد مطلوب للمجموعة');continue}
          if(qf<0||qd<0||qf+qd>qty){er('«يحتاج إصلاح» + «تالف» أكبر من العدد الكلي ('+qty+')');continue}
        }else{
          if(qty<1)qty=1;
          if(qty>200){er('العدد الفردي لا يزيد عن 200 في السطر الواحد');continue}
          if(code&&qty>1){er('كود محدد مع عدد أكبر من 1: سيب الكود فاضي أو خلي العدد 1');continue}
          qf=0;qd=0;
        }
        if(code){const lc=code.toLowerCase();if(codesSeen.has(lc)){er('الكود «'+code+'» مكرر في الملف');continue}codesSeen.add(lc)}
        const fl=XS(g(r,'fl')),pl=XS(g(r,'pl')),loc=fl&&pl?fl+' – '+pl:(fl||pl);
        const rec={row:rowNo,code,type,name:nm,mode,qty,qf,qd,loc,
          cap:XN(g(r,'cap')),capu:XS(g(r,'capu')),brand:XS(g(r,'brand')),model:XS(g(r,'model')),inst:yearOf(g(r,'inst'))||'',life:XN(g(r,'life'))||'',value:XN(g(r,'value')),notes:XS(g(r,'notes'))};
        const ex=code?assetByCode(code):null;
        if(ex&&isAC(ex)){er('الكود «'+code+'» تابع لأصل تكييف – استخدم استيراد صفحة أصول التكييف');continue}
        if(ex){rec.action='update';rec.id=ex.id;out.rows.push(rec);continue}
        const base=['xl',mode,type,nm,loc].join('|').toLowerCase(),n=mode==='فردي'?qty:1,keys=[];
        for(let k=0;k<n;k++)keys.push(base+(n>1?'|'+k:''));
        if(!code&&keys.every(k=>keysSeen.has(k))){rec.action='skip';rec.n=n;out.rows.push(rec);continue}
        keys.forEach(k=>keysSeen.add(k));rec.action='create';rec.n=n;rec.keys=keys;out.rows.push(rec);
      }
    }
    const S=!out.hasS&&xlSheet(ws,['الصنف','الرصيد']);
    if(S){out.hasS=true;const{raw,hi,h}=S,C={};
      [['name','الصنف'],['qty','الرصيد'],['min','الحد'],['unit','الوحدة'],['cost','سعر'],['loc','مكان']].forEach(([k,t])=>C[k]=xcol(h,t));
      const g=(r,k)=>C[k]>=0?r[C[k]]:'',seen=new Set();
      for(let i=hi+1;i<raw.length;i++){
        const r=raw[i];if(r.every(c=>XS(c)===''))continue;
        const nm=XS(g(r,'name'));if(!nm){out.stErr.push({row:i+1,msg:'اسم الصنف ناقص'});continue}
        const lc=nm.toLowerCase();if(seen.has(lc)){out.stErr.push({row:i+1,msg:'الصنف «'+nm+'» مكرر في الملف'});continue}seen.add(lc);
        const ex=stock.find(x=>XS(x.name).toLowerCase()===lc);
        out.stock.push({row:i+1,name:nm,qty:XN(g(r,'qty')),min:XN(g(r,'min')),unit:XS(g(r,'unit'))||'قطعة',cost:XN(g(r,'cost')),loc:XS(g(r,'loc')),action:ex?'update':'create',id:ex?ex.id:''});
      }
    }
  }
  return out;
}
async function xlLoad(f){
  if(!f)return;
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  let r;try{r=xlParse(XLSX.read(await f.arrayBuffer()))}catch(e){alert('تعذر قراءة الملف: '+e.message);return}
  if(!r.hasA&&!r.hasS){alert('مش لاقي ورقة «الأصول» أو «المخزن» بالعناوين المتوقعة. استخدم «تحميل النموذج» ولا تغيّر العناوين.');return}
  r.file=f.name;xi=r;render();
}
function xlCancel(){xi=null;render()}
function vXlImport(){
  let h=`<div class="card addf"><b>استيراد من نموذج Excel (أصول فردية ومجموعات + مخزن)</b><div class="msg hint">حمّل النموذج، املأه بره البرنامج، وارفعه هنا. هتشوف معاينة قبل أي حفظ.</div><div class="row" style="margin-top:6px"><button class="btn alt" onclick="tplDownload()">تحميل النموذج</button><label class="btn" style="flex-direction:row">اختيار الملف المملوء<input type="file" accept=".xlsx" onchange="xlLoad(this.files[0]);this.value=''" hidden></label></div>`;
  if(xi){
    const cr=xi.rows.filter(r=>r.action==='create'),up=xi.rows.filter(r=>r.action==='update'),sk=xi.rows.filter(r=>r.action==='skip');
    const nInd=cr.filter(r=>r.mode==='فردي').reduce((t,r)=>t+r.n,0),nGrp=cr.filter(r=>r.mode==='مجموعة').length;
    const sc=xi.stock.filter(r=>r.action==='create').length,su=xi.stock.filter(r=>r.action==='update').length;
    const can=cr.length+up.length+xi.stock.length>0;
    h+=`<div style="margin-top:10px"><b>معاينة الملف: ${esc(xi.file)}</b></div><div class="grid" style="margin:8px 0"><div class="k s-ok"><b>${nInd}</b>أصل فردي جديد</div><div class="k s-ok"><b>${nGrp}</b>مجموعة جديدة</div><div class="k"><b>${up.length}</b>تحديث أصل موجود</div><div class="k"><b>${sk.length}</b>متخطى (مكرر)</div><div class="k ${xi.err.length?'s-bad':''}"><b>${xi.err.length}</b>سطر فيه خطأ</div><div class="k"><b>${sc}</b>صنف مخزن جديد</div><div class="k"><b>${su}</b>تحديث رصيد صنف</div><div class="k ${xi.stErr.length?'s-bad':''}"><b>${xi.stErr.length}</b>خطأ بالمخزن</div></div>`;
    if(xi.err.length||xi.stErr.length)h+=`<div class="card s-bad" style="margin-bottom:8px"><b>أخطاء (الأسطر دي مش هتتستورد):</b><br>${xi.err.slice(0,30).map(e=>'الأصول – سطر '+e.row+': '+esc(e.msg)).concat(xi.stErr.slice(0,20).map(e=>'المخزن – سطر '+e.row+': '+esc(e.msg))).join('<br>')}${xi.err.length>30?'<br>… وأخطاء أخرى':''}</div>`;
    const show=xi.rows.filter(r=>r.action!=='skip').slice(0,40);
    if(show.length)h+=`<div class="wrap" style="max-height:260px"><table><tr>${['سطر','الإجراء','الكود','النوع','الاسم','الطريقة','العدد','الموقع'].map(x=>`<th>${x}</th>`).join('')}</tr>${show.map(r=>`<tr><td>${r.row}</td><td class="${r.action==='create'?'s-ok':''}">${r.action==='create'?'جديد':'تحديث'}</td><td>${esc(r.code||'تلقائي')}</td><td>${esc(r.type)}</td><td class="l">${esc(r.name)}</td><td>${r.mode}</td><td>${r.mode==='مجموعة'?r.qty:r.n||1}</td><td class="l">${esc(r.loc)}</td></tr>`).join('')}</table></div>${xi.rows.filter(r=>r.action!=='skip').length>40?'<div class="msg">معروض أول 40 سطر فقط.</div>':''}`;
    h+=`<div class="msg hint" style="margin-top:6px">التحديث بيغيّر الخانات المكتوبة فقط ولا يمسح الفاضي. رصيد المخزن الموجود بيتحدّث بالقيمة اللي في الملف.</div><div class="row" style="margin-top:8px"><button class="btn" ${can?'':'disabled'} onclick="xlApply()">تأكيد الاستيراد</button><button class="btn alt" onclick="xlCancel()">إلغاء</button></div>`;
  }
  return h+`<div id="xlmsg" class="msg"></div></div>`;
}
async function xlApply(){
  if(!xi)return;
  if(!navigator.onLine){alert('لازم تكون متصل بالإنترنت أثناء الاستيراد');return}
  const jobs=[];let cA=0,cG=0,uA=0,cS=0,uS=0;
  for(const r of xi.rows){
    if(r.action==='update'){
      const p={mode:r.mode,name:r.name,type:r.type};
      if(r.loc)p.loc=r.loc;if(r.cap)p.cap=r.cap;if(r.capu)p.capu=r.capu;if(r.brand)p.brand=r.brand;if(r.model)p.model=r.model;if(r.inst)p.inst=r.inst;if(r.life)p.life=r.life;if(r.value)p.value=r.value;if(r.notes)p.notes=r.notes;
      if(r.mode==='مجموعة'){p.qty=r.qty;p.qtyFix=r.qf;p.qtyDead=r.qd}else p.qty=0;
      const ex=assets.find(a=>a.id===r.id);if(ex)Object.assign(ex,p);
      jobs.push(()=>db.collection('assets').doc(r.id).update(p));uA++;
    }else if(r.action==='create'){
      for(let k=0;k<r.n;k++){
        const code=r.code||nextCodes(r.type,1)[0],id='as_'+code;
        const o={code,name:r.name+(r.mode==='فردي'&&r.n>1?' '+(k+1):''),type:r.type,loc:r.loc,cap:r.cap||0,capu:r.capu||'',brand:r.brand,model:r.model,inst:r.inst,life:r.life,value:r.value||0,notes:r.notes,mode:r.mode,qty:r.mode==='مجموعة'?r.qty:0,qtyFix:r.qf||0,qtyDead:r.qd||0,impKey:r.keys[k],src:'استيراد Excel'};
        assets.push({id,...o});jobs.push(()=>db.collection('assets').doc(id).set(o));
        if(r.mode==='مجموعة')cG++;else cA++;
      }
    }
  }
  xi.stock.forEach((r,i)=>{
    const o={name:r.name,qty:r.qty,min:r.min,unit:r.unit,cost:r.cost,loc:r.loc};
    if(r.action==='update'){jobs.push(()=>db.collection('stock').doc(r.id).update(o));uS++}
    else{jobs.push(()=>db.collection('stock').doc('st'+Date.now()+'-'+i+'-'+DEV).set(o));cS++}
  });
  const msg=document.getElementById('xlmsg');
  try{
    for(let i=0;i<jobs.length;i+=15){await Promise.all(jobs.slice(i,i+15).map(f=>f()));if(msg)msg.textContent='جاري الحفظ… '+Math.min(i+15,jobs.length)+' من '+jobs.length}
  }catch(e){alert('حصل خطأ أثناء الحفظ: '+e.message+'\nراجع السجل وأعد الاستيراد (الأسطر المكررة بتتخطى تلقائياً).');return}
  xi=null;render();
  toast('تم الاستيراد ✓ – أصول '+cA+' · مجموعات '+cG+' · تحديث '+uA+' · مخزن '+(cS+uS));
}
xlApply=noLog(xlApply);

