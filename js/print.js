/* طباعة إخطار صيانة */
/* ---------- طباعة إخطار صيانة ---------- */
function openNT(id){
  const n=notices.find(x=>x.id===id);if(!n)return;
  const its=purchases.filter(p=>p.ref===n.ref),si=slaInfo(n),old=document.getElementById('prv');if(old)old.remove();
  const o=document.createElement('div');o.id='prv';
  const ckb=(v)=>v?'☒':'☐',cell=(l,v,cs)=>`<td${cs?` colspan="${cs}"`:''} class="l"><div class="g">${l}</div><div style="min-height:18px;font-weight:700">${esc(v||'')}</div></td>`;
  const sts=['','تم الإصلاح','غير قابل للإصلاح'];
  o.innerHTML=`<div class="prtools"><b>إخطار صيانة ${n.ref} – معاينة قبل الطباعة</b><div class="row" style="margin-top:8px"><button class="btn" onclick="window.print()">طباعة</button><button class="btn alt" onclick="prPdf()">تحميل PDF</button><button class="btn alt" onclick="document.getElementById('prv').remove()">إغلاق</button></div></div>
  <div id="prpages"><div class="prpage rtl">
  <table><tr><td style="width:22%;border:0"></td><td style="border:0"><div class="t">إخطار صيانة</div><div>Maintenance Notice</div></td><td style="width:26%;border:0"><b>مستشفى الابتسامة</b><br>Al Ebtesama Hospital<br>قسم الصيانة</td></tr></table>
  <table style="margin-top:4px"><tr>${cell('رقم الإخطار',n.ref)}${cell('التاريخ',fd(n.date))}${cell('الوقت',n.time)}${cell('الأولوية',si.pr)}</tr>
  <tr>${cell('القسم / المكان',(n.dept||'')+(n.loc?' – '+n.loc:''),2)}${cell('مسؤول الإخطار',n.reporter)}${cell('توقيع مسؤول الإخطار','')}</tr>
  <tr>${cell('التخصص',tradeOf(n))}${cell('الأصل / الجهاز',n.asset,1)}${cell('المهلة المستهدفة',SLA_H[si.pr]+' ساعة',2)}</tr></table>
  <table style="margin-top:4px"><tr><td class="l" style="height:90px;vertical-align:top"><div class="g">وصف العطل</div><div style="font-weight:700">${esc(n.details)}</div></td></tr></table>
  <div style="margin:6px 0;font-weight:700;text-align:right">يُستكمل بمعرفة قسم الصيانة</div>
  <table><tr><td class="l" style="height:70px;vertical-align:top"><div class="g">الإجراء المتخذ</div><div>${esc(n.action)}</div></td></tr>
  <tr><td class="l" style="height:50px;vertical-align:top"><div class="g">القطع / المواد المستخدمة</div><div>${its.map(p=>esc(p.item)+' × '+(p.qty??'')+(p.status==='صرف من المخزن'?' (من المخزن)':'')).join('، ')}</div></td></tr></table>
  <table style="margin-top:4px"><tr>${cell('ممثل الصيانة',n.rep)}${cell('تاريخ الإصلاح',fd(n.fixdate))}${cell('وقت البدء / الانتهاء','')}${cell('التكلفة (ج.م)',noticeCost(n)?money(noticeCost(n)):'')}</tr>
  <tr><td colspan="4" class="l"><div class="g">الحالة</div><div>${sts.map(s=>ckb((n.status||'')===s)+' '+(s||'مفتوح')).join(' &nbsp;&nbsp; ')} &nbsp;&nbsp; ${ckb(n.needbuy==='نعم')} يحتاج شراء</div></td></tr></table>
  <table style="margin-top:8px"><tr><td class="l" style="height:60px;width:33%"><div class="g">توقيع ممثل الصيانة</div></td><td class="l" style="width:33%"><div class="g">اعتماد مدير الصيانة</div></td><td class="l"><div class="g">استلام القسم بعد الإصلاح (الاسم / التوقيع / التاريخ)</div></td></tr></table></div></div>`;
  document.body.appendChild(o);
}
