/* التقارير الأسبوعية والشهرية */
/* ---------- التقارير الأسبوعية والشهرية ---------- */
const REP_START='2026-11-07'; // السبت: بداية العمل بالتقارير
let repType='w',repSel='',repFrom='',repTo='';
const repLbl=()=>repType==='w'?'أسبوعي':repType==='m'?'شهري':'فترة';
function repPreset(k){const t=new Date(),f=new Date(t);let a,b=ymd(t);
  if(k==='7'){f.setDate(f.getDate()-6);a=ymd(f)}else if(k==='30'){f.setDate(f.getDate()-29);a=ymd(f)}
  else if(k==='mc'){a=ymd(new Date(t.getFullYear(),t.getMonth(),1))}
  else{a=ymd(new Date(t.getFullYear(),t.getMonth()-1,1));b=ymd(new Date(t.getFullYear(),t.getMonth(),0))}
  repFrom=a;repTo=b;render()}
const lastThu=(y,m)=>{const d=new Date(y,m+1,0);while(d.getDay()!==4)d.setDate(d.getDate()-1);return ymd(d)};
const dFmt=v=>{const [y,m,d]=v.split('-');return d+'/'+m+'/'+y};
function weekOptions(){const o=[],t=ymd(new Date());let d=new Date(REP_START+'T12:00:00');
  while(ymd(d)<=t){const e=new Date(d);e.setDate(e.getDate()+6);o.push({v:ymd(d),from:ymd(d),to:ymd(e)});d.setDate(d.getDate()+7)}return o.reverse()}
function monthOptions(){const o=[],s0=new Date(REP_START+'T12:00:00'),t=new Date();let y=s0.getFullYear(),m=s0.getMonth();
  while(y<t.getFullYear()||(y===t.getFullYear()&&m<=t.getMonth())){const f=ymd(new Date(y,m,1));o.push({v:y+'-'+(m+1),from:f<REP_START?REP_START:f,to:lastThu(y,m)});m++;if(m>11){m=0;y++}}return o.reverse()}
function repData(from,to){
  const inR=v=>{const x=iso(v);return typeof x==='string'&&x>=from&&x<=to};
  const today=ymd(new Date());
  const nNew=notices.filter(n=>inR(n.date)),nClosed=notices.filter(n=>n.status==='تم الإصلاح'&&inR(n.fixdate));
  const dd=nClosed.map(n=>(new Date(iso(n.fixdate))-new Date(iso(n.date)))/864e5).filter(x=>!isNaN(x)&&x>=0);
  const avg=dd.length?dd.reduce((a,b)=>a+b,0)/dd.length:null;
  const rs=Object.entries(rounds).filter(([d])=>d>=from&&d<=to);
  const byA={},byC={},rec={};let bad=0;
  rs.forEach(([d,r])=>Object.entries(r.marks||{}).forEach(([k,v])=>{if(v!=='✗')return;const [i,j]=k.split('_');const a=ALL[i].a,c=CATS[j];bad++;byA[a]=(byA[a]||0)+1;byC[c]=(byC[c]||0)+1;rec[a+' – '+c]=(rec[a+' – '+c]||0)+1}));
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const lastDay=to<today?to:today,span=Math.max(0,Math.round((new Date(lastDay)-new Date(from))/864e5)+1);
  const open=notices.filter(n=>n.status!=='تم الإصلاح').map(n=>({...n,age:Math.round((new Date(today)-new Date(iso(n.date)))/864e5)})).filter(n=>!isNaN(n.age)).sort((a,b)=>b.age-a.age).slice(0,5);
  const pa=purchases.filter(p=>inR(p.rdate)).length,pd=purchases.filter(p=>['تم الشراء/التوريد','صرف من المخزن','تم التركيب'].includes(p.status)&&inR(p.ddate)).length,pi=purchases.filter(p=>inR(p.idate)).length,pp=purchases.filter(p=>p.status!=='تم التركيب').length;
  const slaOk=nClosed.filter(n=>slaInfo(n).txt==='ضمن المهلة').length;
  return{slaOk,nNew,nClosed,avg,days:rs.length,span,bad,byA:top(byA),byC:top(byC),rec:top(rec).filter(x=>x[1]>=2),open,pa,pd,pi,pp,openNow:notices.filter(n=>n.status!=='تم الإصلاح').length};
}
function repSave(key){try{localStorage.setItem(key,document.getElementById('narx').innerHTML)}catch(e){}}
function repReset(key){if(confirm('سيتم مسح تعديلاتك على هذا التقرير وإعادة كتابته من بيانات البرنامج. متابعة؟')){try{localStorage.removeItem(key)}catch(e){}render()}}
function repStory(from,to,type,d){
  const inR=v=>{const x=iso(v);return typeof x==='string'&&x>=from&&x<=to};
  const per=type==='w'?'الأسبوع':type==='m'?'الشهر':'الفترة',today=ymd(new Date());
  const li=a=>a.length?'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<p>لا يوجد خلال '+per+'.</p>';
  const fx=n=>{const f=iso(n.fixdate);return typeof f==='string'&&f?dFmt(f):''};
  const line=n=>'<b>'+esc(n.ref||'')+'</b> – '+esc(n.dept||'')+': '+esc(n.details||'');
  const pit=p=>esc(p.item||'')+(p.qty?' ('+esc(p.qty)+')':'')+(p.ref?' – '+esc(p.ref):'');
  const pl=(t,a)=>'<p><b>'+t+' ('+a.length+'):</b> '+(a.length?a.map(pit).join('، '):'لا يوجد')+'</p>';
  const DEL=['تم الشراء/التوريد','صرف من المخزن','تم التركيب'];
  const req=purchases.filter(p=>inR(p.rdate)),del=purchases.filter(p=>DEL.includes(p.status)&&inR(p.ddate)),ins=purchases.filter(p=>inR(p.idate));
  const js=jobsheets.filter(j=>inR(j.date)||inR(j.end));
  const open=notices.filter(n=>n.status!=='تم الإصلاح').map(n=>({n,age:Math.round((new Date(today)-new Date(iso(n.date)))/864e5),si:slaInfo(n)}))
    .sort((a,b)=>(b.si.pr==='حرج')-(a.si.pr==='حرج')||(b.age||0)-(a.age||0));
  const pend=purchases.filter(p=>p.status!=='تم التركيب');
  const sec=[];
  sec.push(['ملخص '+per,
    '<p>سُجّل خلال '+per+' عدد <b>'+d.nNew.length+'</b> إخطار صيانة جديد، وتم إصلاح <b>'+d.nClosed.length+'</b> إخطار'
    +(d.avg===null?'':' بمتوسط زمن إصلاح '+d.avg.toFixed(1)+' يوم')
    +(d.nClosed.length?'، منها '+d.slaOk+' ضمن المهلة المستهدفة':'')+'. '
    +'وتم تنفيذ المرور اليومي في '+d.days+' يوم من أصل '+d.span+'، وسُجّلت '+d.bad+' خانة بها ملاحظة. '
    +'ويبلغ عدد الإخطارات المفتوحة حالياً <b>'+d.openNow+'</b> إخطار'+(notices.filter(n=>n.status==='غير قابل للإصلاح').length?'، منها <b>'+notices.filter(n=>n.status==='غير قابل للإصلاح').length+'</b> غير قابل للإصلاح بانتظار قرار الاستبدال':'')+'.</p>']);
  sec.push(['المعاينة وتحديد الأعطال',li(d.nNew.map(n=>line(n)+(n.action?' – الإجراء/السبب: '+esc(n.action):'')+' ['+esc(n.status||'مفتوح')+']'))]);
  sec.push(['الإصلاحات التي نفذها القسم',li(d.nClosed.map(n=>line(n)+(n.action?' – '+esc(n.action):'')+(fx(n)?' (بتاريخ '+fx(n)+')':'')))]);
  sec.push(['المشتريات والتوريد',pl('طُلبت',req)+pl('تم توريدها',del)+pl('تم تركيبها',ins)]);
  if(js.length)sec.push(['أعمال الشركات الخارجية',li(js.map(j=>'<b>'+esc(j.no||'')+'</b> – '+esc(j.contractor||'')+': '+esc(j.scope||'')+(j.status?' ['+esc(j.status)+']':'')))]);
  sec.push(['ما سيتابعه القسم خلال الفترة القادمة',
    (open.length?'<p><b>إخطارات مفتوحة (الأهم أولاً):</b></p>'+li(open.slice(0,10).map(o=>line(o.n)+' ['+esc(o.n.status||'مفتوح')+' – عمره '+(isNaN(o.age)?'—':o.age)+' يوم'+(o.si.over?' – متأخر عن المهلة':'')+']'))+(open.length>10?'<p>وعدد '+(open.length-10)+' إخطارات أخرى مفتوحة.</p>':''):'<p>لا توجد إخطارات مفتوحة.</p>')
    +(pend.length?'<p><b>أصناف شراء لم يكتمل تركيبها ('+pend.length+'):</b> '+pend.slice(0,10).map(pit).join('، ')+(pend.length>10?' وغيرها':'')+'</p>':'')]);
  const OR=['أولاً','ثانياً','ثالثاً','رابعاً','خامساً','سادساً','سابعاً','ثامناً'];
  sec.push(['ملاحظات وتوصيات مدير الصيانة','<p>&nbsp;</p>']);
  const gen='<p><b>السيد الدكتور / مدير المستشفى</b></p><p>تحية طيبة وبعد،</p>'
    +'<p>أتشرف بأن أرفع لسيادتكم ملخصاً بما نفذه قسم الصيانة خلال الفترة من '+dFmt(from)+' إلى '+dFmt(to)+'.</p>'
    +sec.map((x,i)=>'<h4>'+OR[i]+': '+x[0]+'</h4>'+x[1]).join('')
    +'<p style="margin-top:12px">وتفضلوا بقبول فائق الاحترام والتقدير،</p><p><b>م/ محمد خالد المحمدي</b><br>مدير الصيانة<br>مستشفى الابتسامة – مصر الجديدة</p>';
  const key='repdoc_'+type+'_'+from+'_'+to;let saved=null;try{saved=localStorage.getItem(key)}catch(e){}
  return '<div class="msg noprint">'+(saved?'هذه نسخة معدّلة بخط يدك ومحفوظة على هذا الجهاز.':'التقرير قابل للتعديل: اضغط على أي نص وعدّله أو أضف توصياتك، ويُحفظ تلقائياً ويظهر في ملف PDF.')
    +' <button class="btn sm alt" onclick="repReset(\''+key+'\')">إعادة كتابته من بيانات البرنامج</button></div>'
    +'<div class="nar" id="narx" contenteditable="true" oninput="repSave(\''+key+'\')">'+(saved||gen)+'</div>';
}
function vReports(){
  const custom=repType==='c',opts=custom?[]:(repType==='w'?weekOptions():monthOptions());
  let h=`<div class="card"><div class="row"><button class="btn ${repType==='w'?'':'alt'}" onclick="repType='w';repSel='';render()">تقرير أسبوعي (السبت – الجمعة)</button><button class="btn ${repType==='m'?'':'alt'}" onclick="repType='m';repSel='';render()">تقرير شهري (حتى آخر خميس)</button><button class="btn ${repType==='c'?'':'alt'}" onclick="repType='c';render()">فترة مخصصة (من – إلى)</button></div>`;
  if(!custom&&!opts.length)return h+`<div class="msg">التقارير تبدأ من السبت ${dFmt(REP_START)}، وستظهر هنا تلقائياً.</div></div>`;
  let cur;
  if(custom){const t=ymd(new Date());let f=repFrom||(t.slice(0,8)+'01'),e=repTo||t;if(f>e){const x=f;f=e;e=x;repFrom=f;repTo=e}cur={v:'c',from:f,to:e}}
  else cur=opts.find(x=>x.v===repSel)||opts[0];
  h+=`<div class="row" style="margin-top:8px">${custom?`<label>من تاريخ<input type="date" value="${cur.from}" onchange="repFrom=this.value;render()"></label><label>إلى تاريخ<input type="date" value="${cur.to}" onchange="repTo=this.value;render()"></label><button class="btn sm alt" onclick="repPreset('7')">آخر 7 أيام</button><button class="btn sm alt" onclick="repPreset('30')">آخر 30 يوم</button><button class="btn sm alt" onclick="repPreset('mc')">هذا الشهر</button><button class="btn sm alt" onclick="repPreset('mp')">الشهر الماضي</button>`:`<label>الفترة<select onchange="repSel=this.value;render()">${opts.map(o=>`<option value="${o.v}" ${o.v===cur.v?'selected':''}>${dFmt(o.from)} → ${dFmt(o.to)}${o.to>ymd(new Date())?' (جارية)':''}</option>`).join('')}</select></label>`}<button class="btn" onclick="pdf('تقرير_'+repLbl()+'_'+'${cur.from}_${cur.to}')">تصدير PDF</button><button class="btn alt" onclick="wordExp('تقرير_'+repLbl()+'_'+'${cur.from}_${cur.to}')">تصدير Word</button></div></div>`;
  const d=repData(cur.from,cur.to);
  const tbl=(hd,rows)=>`<table><tr>${hd.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.length?rows.map(r=>`<tr>${r.map((c,i)=>`<td${i===0?' class="l"':''}>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${hd.length}">لا يوجد</td></tr>`}</table>`;
  h+=`<div class="card" id="rep"><h3>تقرير ${repType==='c'?'':repLbl()+' '}عن أعمال الصيانة – مستشفى الابتسامة</h3><div class="msg">الفترة: من ${dFmt(cur.from)} إلى ${dFmt(cur.to)}</div>
  ${repStory(cur.from,cur.to,repType,d)}
  <h4 style="margin-top:18px">ملحق: الأرقام والإحصائيات</h4>
  <div class="grid" style="margin:8px 0"><div class="k"><b>${d.days}/${d.span}</b>أيام مرور محفوظة</div><div class="k"><b>${d.bad}</b>خانات ✗ في المرور</div><div class="k"><b>${d.nNew.length}</b>إخطارات جديدة</div><div class="k"><b>${d.nClosed.length}</b>إخطارات تم إصلاحها</div><div class="k"><b>${d.avg===null?'—':d.avg.toFixed(1)}</b>متوسط زمن الإصلاح (يوم)</div><div class="k"><b>${d.openNow}</b>مفتوحة حالياً</div><div class="k"><b>${d.nClosed.length?Math.round(100*d.slaOk/d.nClosed.length)+'%':'—'}</b>إغلاق ضمن المهلة</div></div>
  <h4>أكثر الأماكن أعطالاً (من المرور)</h4>${tbl(['المكان','عدد ✗'],d.byA)}
  <h4>أكثر التخصصات أعطالاً</h4>${tbl(['التخصص','عدد ✗'],d.byC)}
  <h4>أعطال متكررة (نفس المكان والتخصص أكثر من مرة)</h4>${tbl(['المكان – التخصص','مرات التكرار'],d.rec)}
  <h4>أقدم الأعطال المفتوحة</h4>${tbl(['القسم','العطل','الحالة','العمر (يوم)'],d.open.map(n=>[n.dept,n.details,n.status,n.age]))}
  <h4>طلبات الشراء</h4>${tbl(['البند','العدد'],[['طُلبت في الفترة',d.pa],['تم توريدها',d.pd],['تم تركيبها',d.pi],['غير مكتملة حالياً',d.pp]])}`;
  if(repType==='m'||(repType==='c'&&Math.round((new Date(cur.to)-new Date(cur.from))/864e5)>7)){
    const rows=[];let x=new Date(cur.from+'T12:00:00');
    while(ymd(x)<=cur.to){const e=new Date(x);e.setDate(e.getDate()+((5-e.getDay()+7)%7));const end=ymd(e)>cur.to?cur.to:ymd(e);const w=repData(ymd(x),end);rows.push([dFmt(ymd(x))+' → '+dFmt(end),w.nNew.length,w.nClosed.length,w.bad]);x=new Date(e);x.setDate(x.getDate()+1)}
    h+=`<h4>التوزيع الأسبوعي</h4>${tbl(['الأسبوع','جديدة','تم إصلاحها','✗ في المرور'],rows)}`;
  }
  return h+'</div>';
}
