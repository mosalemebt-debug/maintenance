/* تقرير متابعة الأعمال اليومي */
/* ---------- تقرير متابعة الأعمال اليومي ---------- */
let dTab='';
function vDaily(){
  const today=ymd(new Date());
  const open=notices.filter(n=>n.status!=='تم الإصلاح').sort((a,b)=>PR.indexOf(slaInfo(a).pr)-PR.indexOf(slaInfo(b).pr)||a.n-b.n);
  const overdue=open.filter(n=>slaInfo(n).over).length,critOpen=open.filter(n=>slaInfo(n).pr==='حرج').length;
  const aAct=assets.filter(a=>a.stat!=='مُكهّن').map(a=>({a,...assetStats(a)})),aBroken=aAct.filter(x=>x.st!=='شغال').length;
  const age=n=>{const x=Math.round((new Date(today)-new Date(iso(n.date)))/864e5);return isNaN(x)?'':x};
  const byS={};open.forEach(n=>{const k=n.status||'بدون حالة';byS[k]=(byS[k]||0)+1});
  const nNew=notices.filter(n=>iso(n.date)===today).length,nCl=notices.filter(n=>n.status==='تم الإصلاح'&&iso(n.fixdate)===today).length;
  const r=rounds[today],badList=[];
  if(r)Object.entries(r.marks||{}).forEach(([k,v])=>{if(v==='✗'){const [i,j]=k.split('_');badList.push(ALL[i].a+' – '+CATS[j])}});
  const PLACED=['تم الطلب','تم الشراء/التوريد','صرف من المخزن','تم التركيب'];
  const rows=[];
  notices.filter(n=>n.needbuy==='نعم'&&n.status!=='تم الإصلاح').sort((a,b)=>a.n-b.n).forEach(n=>{
    const its=purchases.filter(p=>p.ref===n.ref);
    if(!its.length)rows.push({ref:n.ref,what:(n.dept||'')+' – '+(n.details||''),item:'لم يُحدد صنف',st:'—',ok:false,rd:'',dd:''});
    else its.filter(p=>p.status!=='تم التركيب').forEach(p=>rows.push({ref:n.ref,what:(n.dept||'')+' – '+(n.details||''),item:p.item+' × '+(p.qty??''),st:p.status,ok:PLACED.includes(p.status),rd:fd(p.rdate),dd:fd(p.ddate)}));
  });
  purchases.filter(p=>!p.ref&&p.status!=='تم التركيب').forEach(p=>rows.push({ref:'—',what:p.notes||'',item:p.item+' × '+(p.qty??''),st:p.status,ok:PLACED.includes(p.status),rd:fd(p.rdate),dd:fd(p.ddate)}));
  const notPlaced=rows.filter(x=>!x.ok).length,ordered=rows.filter(x=>x.st==='تم الطلب').length,delivered=rows.filter(x=>['تم الشراء/التوريد','صرف من المخزن'].includes(x.st)).length;
  const day=DAYS[new Date(today+'T12:00:00').getDay()];
  const chips=Object.entries(byS).map(([k,v])=>`<span class="${stCls(k)}" style="padding:4px 10px;border-radius:6px;display:inline-block;margin:2px"><b>${v}</b> ${esc(k)}</span>`).join('')||'لا توجد إخطارات مفتوحة';
  const dk=(key,cls,val,label)=>`<div class="k tabk ${cls||''} ${dTab===key?'on':''}" role="button" tabindex="0" onclick="dTab=dTab==='${key}'?'':'${key}';render()" title="اضغط لعرض بيانات هذه الحالة"><b>${val}</b>${label}</div>`;
  const nTbl=(list,title)=>`<h4>${title} (${list.length})</h4>
  <div style="overflow-x:auto"><table><tr>${['الإخطار','التاريخ','العمر (يوم)','القسم','العطل','الإجراء','الحالة','ممثل الصيانة','شراء؟','الأولوية','المهلة'].map(x=>`<th>${x}</th>`).join('')}</tr>
  ${list.map(n=>{const si=slaInfo(n);return `<tr><td>${n.ref}</td><td>${fd(n.date)}</td><td>${age(n)}</td><td class="l">${esc(n.dept)}</td><td class="l">${esc(n.details)}</td><td class="l">${esc(n.action)}</td><td class="${stCls(n.status)}">${esc(n.status||'مفتوح')}</td><td>${esc(n.rep)}</td><td>${esc(n.needbuy)}</td><td class="${prCls(si.pr)}">${si.pr}</td><td class="${si.cls}">${si.txt}</td></tr>`}).join('')||'<tr><td colspan="11">لا توجد بيانات</td></tr>'}</table></div>`;
  const pTbl=(list,title)=>`<h4>${title} (${list.length})</h4>
  <div style="overflow-x:auto"><table><tr>${['الإخطار','القسم / العطل','الصنف','حالة الصنف','هل تم عمل طلب؟','تاريخ الطلب','تاريخ التوريد'].map(x=>`<th>${x}</th>`).join('')}</tr>
  ${list.map(x=>`<tr><td>${x.ref}</td><td class="l">${esc(x.what)}</td><td class="l">${esc(x.item)}</td><td>${esc(x.st)}</td><td class="${x.ok?'s-ok':'s-bad'}">${x.ok?'تم عمل طلب':'لم يتم'}</td><td>${x.rd}</td><td>${x.dd}</td></tr>`).join('')||'<tr><td colspan="7">لا توجد بيانات</td></tr>'}</table></div>`;
  const aTbl=(list,title)=>`<h4>${title} (${list.length})</h4>
  <div style="overflow-x:auto"><table><tr>${['الكود','الاسم','النوع','الموقع','الحالة','القرار'].map(x=>`<th>${x}</th>`).join('')}</tr>
  ${list.map(x=>`<tr><td>${esc(x.a.code)}</td><td class="l">${esc(x.a.name)}</td><td>${esc(x.a.type)}</td><td class="l">${esc(x.a.loc)}</td><td class="${x.stc}">${x.st}${x.open.length?'<div class="msg">'+x.open.slice(0,3).map(n=>esc(n.ref)+': '+esc(n.details)).join('<br>')+'</div>':''}</td><td>${x.a.dec?esc(x.a.dec):'—'}</td></tr>`).join('')||'<tr><td colspan="6">لا توجد بيانات</td></tr>'}</table></div>`;
  const DT={
    open:['إخطارات لم يتم إصلاحها',()=>nTbl(open,'الإخطارات التي لم يتم إصلاحها')],
    new:['إخطارات جديدة اليوم',()=>nTbl(notices.filter(n=>iso(n.date)===today),'إخطارات جديدة اليوم')],
    closed:['تم إصلاحها اليوم',()=>nTbl(notices.filter(n=>n.status==='تم الإصلاح'&&iso(n.fixdate)===today),'إخطارات تم إصلاحها اليوم')],
    notPlaced:['أصناف لم يتم عمل طلب لها',()=>pTbl(rows.filter(x=>!x.ok),'أصناف لم يتم عمل طلب لها')],
    ordered:['تم طلبها ولم تُورَّد',()=>pTbl(rows.filter(x=>x.st==='تم الطلب'),'أصناف تم طلبها ولم تُورَّد')],
    delivered:['تم توريدها ولم تُركَّب',()=>pTbl(rows.filter(x=>['تم الشراء/التوريد','صرف من المخزن'].includes(x.st)),'أصناف تم توريدها ولم تُركَّب')],
    overdue:['متأخرة عن مهلتها',()=>nTbl(open.filter(n=>slaInfo(n).over),'إخطارات متأخرة عن مهلتها')],
    crit:['أعطال حرجة مفتوحة',()=>nTbl(open.filter(n=>slaInfo(n).pr==='حرج'),'أعطال حرجة مفتوحة')],
    aBroken:['أصول معطلة الآن',()=>aTbl(aAct.filter(x=>x.st!=='شغال'),'أصول معطلة الآن')]
  };
  const body=dTab&&DT[dTab]?'<div class="row noprint" style="margin:6px 0;align-items:center"><b>المعروض: '+DT[dTab][0]+'</b><button class="btn sm alt" onclick="dTab=\'\';render()">عرض التقرير كاملاً</button></div>'+DT[dTab][1]():nTbl(open,'الإخطارات التي لم يتم إصلاحها')+pTbl(rows,'طلبات الشراء المطلوبة');
  const lb=localStorage.getItem('lastBackup'),bk=(!lb||(new Date(today)-new Date(lb))/864e5>7)?`<div class="card s-warn"><b>⚠ لم تأخذ نسخة احتياطية منذ ${lb?'أكثر من أسبوع ('+dFmt(lb)+')':'البداية'}.</b> <button class="btn sm" onclick="tab='backup';nav();render()">نسخ احتياطي الآن</button></div>`:'';
  return bk+dupBanner()+qa()+`<div class="card"><div class="row"><button class="btn" onclick="pdf('تقرير_المتابعة_اليومي_${today}')">تصدير PDF</button><button class="btn alt" onclick="wordExp('تقرير_المتابعة_اليومي_${today}')">تصدير Word</button><button class="btn alt" onclick="render()">تحديث</button></div></div>
  <div class="card" id="rep"><h3>تقرير متابعة الأعمال اليومي – قسم الصيانة – مستشفى الابتسامة</h3>
  <div class="msg">${day} ${dFmt(today)}</div>
  <div class="grid" style="margin:8px 0">${dk('open','',open.length,'إخطارات لم يتم إصلاحها')}${dk('new','',nNew,'إخطارات جديدة اليوم')}${dk('closed','',nCl,'تم إصلاحها اليوم')}${dk('notPlaced','',notPlaced,'أصناف لم يتم عمل طلب لها')}${dk('ordered','',ordered,'تم طلبها ولم تُورَّد')}${dk('delivered','',delivered,'تم توريدها ولم تُركَّب')}${dk('overdue',overdue?'s-bad':'',overdue,'متأخرة عن مهلتها')}${dk('crit',critOpen?'s-bad':'',critOpen,'أعطال حرجة مفتوحة')}${dk('aBroken',aBroken?'s-warn':'',aBroken,'أصول معطلة الآن')}</div>
  <div class="msg noprint">اضغط على أي مربع لعرض بياناته، واضغط عليه تاني للرجوع للتقرير الكامل.</div>
  <div style="margin:6px 0"><b>الإخطارات المفتوحة حسب الحالة:</b> ${chips}</div>
  <div style="margin:6px 0"><b>مرور اليوم:</b> ${r?(badList.length?'محفوظ – أعطال: '+esc(badList.join('، ')):'محفوظ – لا توجد أعطال')+(r.sup?' · المشرف: '+esc(r.sup):''):'لم يُحفظ بعد'}</div>
  ${body}</div>`;
}
