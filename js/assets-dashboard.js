/* لوحة تحكم الأصول */
/* ===== لوحة تحكم الأصول ===== */
let adTab='';
let dsh={t:'',lc:'',cd:'',d1:'',d2:''};
function vADash(){
  const inP=d=>{d=String(iso(d));return(!dsh.d1||d>=dsh.d1)&&(!dsh.d2||d<=dsh.d2)};
  const all=assets.filter(a=>a.stat!=='مُكهّن'&&!isAC(a)).map(a=>({a,...assetStats(a)}));
  const L=all.filter(x=>(!dsh.t||x.a.type===dsh.t)&&(!dsh.lc||x.a.f===dsh.lc||String(x.a.loc||'').includes(dsh.lc))&&(!dsh.cd||effCond(x)===dsh.cd));
  const q=x=>isGrp(x.a)?(+x.a.qty||1):1,sum=l=>l.reduce((t,x)=>t+q(x),0);
  const eng=L.filter(x=>secA(x.a)==='هندسي'),fur=L.filter(x=>secA(x.a)==='تجهيزات');
  const cnd=c=>L.filter(x=>effCond(x)===c),good=cnd(CONDS[0]),need=cnd(CONDS[1]),bad=L.filter(x=>CONDS.indexOf(effCond(x))>=2);
  const ns=L.flatMap(x=>x.ns).filter(n=>inP(n.date)),op=ns.filter(n=>n.status!=='تم الإصلاح').length,cl=ns.length-op;
  const cost=ns.reduce((t,n)=>t+noticeCost(n),0);
  const cand=L.filter(x=>(x.a.dec==='استبدال'&&!x.a.decDone)||effCond(x)===CONDS[3]||(x.age!==null&&x.age>=x.life));
  const k=(v,l,c,key)=>`<div class="k ${c||''}" style="cursor:pointer;${adTab===key?'outline:3px solid #1e6fd9;':''}" onclick="adTab=adTab==='${key}'?'':'${key}';render()"><b>${v}</b>${l}</div>`;
  const sel=(key,l,o)=>`<label>${l}<select onchange="liveFilter(this,dsh,'${key}')"><option value="">الكل</option>${o.map(v=>`<option ${dsh[key]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
  const grp={};L.forEach(x=>{const a=x.a,key=[a.b,a.f].filter(Boolean).join(' › ')||(a.loc?'(نص حر) '+a.loc.split(' – ')[0]:'بدون موقع');const g=grp[key]=grp[key]||{e:0,f:0,w:0};secA(a)==='هندسي'?g.e+=q(x):g.f+=q(x);if(CONDS.indexOf(effCond(x))>=1)g.w+=q(x)});
  const rows=Object.entries(grp).sort((p,r)=>(r[1].e+r[1].f)-(p[1].e+p[1].f));
  const why=x=>[x.a.dec==='استبدال'&&!x.a.decDone?'قرار استبدال':'',effCond(x)===CONDS[3]?'تالف ويحتاج إحلال':'',x.age!==null&&x.age>=x.life?'تجاوز العمر ('+x.age+'/'+x.life+')':''].filter(Boolean).join(' · ');
  const sets={eng,fur,good,need,bad,cand},nl=L.flatMap(x=>x.ns.filter(n=>inP(n.date)).map(n=>({x,n})));
  const aRow=(x,extra)=>`<tr><td><a href="#" onclick="assetDetail('${x.a.id}');return false">${esc(x.a.code)}</a></td><td class="l">${esc(x.a.name)}</td><td class="l">${esc(x.a.type||'')}</td><td class="l">${esc(x.a.loc||'—')}</td><td>${effCond(x)}</td><td class="l">${extra||''}</td></tr>`;
  const T0='<tr><th>الكود</th><th>الاسم</th><th>النوع</th><th>الموقع</th><th>الحالة</th><th>تفاصيل</th></tr>';
  let dd='';
  if(sets[adTab])dd=T0+sets[adTab].map(x=>aRow(x,adTab==='cand'?why(x):'')).join('');
  else if(adTab==='cost')dd=T0+L.map(x=>({x,c:x.ns.filter(n=>inP(n.date)).reduce((t,n)=>t+noticeCost(n),0)})).filter(o=>o.c>0).sort((p,q)=>q.c-p.c).map(o=>aRow(o.x,'التكلفة: '+money(o.c))).join('');
  else if(adTab==='op'||adTab==='cl')dd='<tr><th>الإخطار</th><th>الأصل</th><th>العطل</th><th>الحالة</th><th>التاريخ</th></tr>'+nl.filter(o=>(o.n.status!=='تم الإصلاح')===(adTab==='op')).map(o=>`<tr><td>${esc(o.n.ref)}</td><td><a href="#" onclick="assetDetail('${o.x.a.id}');return false">${esc(o.x.a.code)}</a></td><td class="l">${esc(o.n.details||'')}</td><td>${esc(o.n.status||'')}</td><td>${dFmt(String(iso(o.n.date)))}</td></tr>`).join('');
  const dTitle={eng:'الأصول الهندسية',fur:'التجهيزات والأثاث',good:'الأصول الجيدة',need:'تحتاج صيانة',bad:'المتوقفة أو التالفة',cand:'المرشحة للإحلال',cost:'التكلفة حسب الأصل',op:'الأعطال المفتوحة',cl:'الأعطال المغلقة'}[adTab];
  const dBox=adTab&&dd?`<div class="card wrap"><b>${dTitle}</b> <a href="#" onclick="adTab='';render();return false">(إغلاق)</a><table>${dd}</table>${dd.split('<tr>').length<3?'<div class="msg">لا توجد عناصر</div>':''}</div>`:'';
  return `<div class="card"><b>لوحة تحكم الأصول</b><div class="fbar">${sel('t','النوع',ATY.filter(t=>t!=='تكييف'))}${sel('lc','الدور',[...new Set(locRows().map(r=>r.f))])}${sel('cd','الحالة',CONDS)}<label>أعطال من<input type="date" value="${dsh.d1}" onchange="liveFilter(this,dsh,'d1')"></label><label>إلى<input type="date" value="${dsh.d2}" onchange="liveFilter(this,dsh,'d2')"></label><button class="btn sm alt" onclick="dsh={t:'',lc:'',cd:'',d1:'',d2:''};render()">مسح</button></div><div class="msg hint">الفترة بتأثر على الأعطال والتكاليف فقط. الأصول المُكهّنة مش محسوبة. <b>التكييف مش داخل في اللوحة دي</b> (زي سجل الأصول)، وبيتحسب في <a href=\"#\" onclick=\"go('acassets');return false\">صفحة أصول التكييف</a>.</div></div>
  <div class="card"><div class="grid">${k(sum(eng),'أصول هندسية ('+eng.length+' بند)','','eng')}${k(sum(fur),'تجهيزات وأثاث ('+fur.length+' بند)','','fur')}${k(sum(good),'جيد ويعمل','','good')}${k(sum(need),'يعمل ويحتاج صيانة',need.length?'s-warn':'','need')}${k(sum(bad),'متوقف أو تالف',bad.length?'s-bad':'','bad')}${k(op,'أعطال مفتوحة',op?'s-warn':'','op')}${k(cl,'أعطال مغلقة','','cl')}${k(money(cost),'تكلفة الصيانة والإصلاح (ج.م)','','cost')}${k(cand.length,'مرشحة للإحلال',cand.length?'s-warn':'','cand')}</div></div>${dBox}
  <div class="card wrap"><b>التوزيع حسب المبنى › الدور (بالقطع)</b><table><tr><th>الموقع</th><th>هندسي</th><th>تجهيزات</th><th>تحتاج صيانة أو أسوأ</th></tr>${rows.map(([n,g])=>`<tr><td class="l">${esc(n)}</td><td>${g.e}</td><td>${g.f}</td><td class="${g.w?'s-warn':''}">${g.w}</td></tr>`).join('')||'<tr><td colspan="4">لا توجد بيانات</td></tr>'}</table></div>
  <div class="card wrap"><b>الأصول المرشحة للإحلال والاستبدال</b><table><tr><th>الكود</th><th>الاسم</th><th>الموقع</th><th>السبب</th><th>تكلفة مقدّرة</th></tr>${cand.slice(0,30).map(x=>`<tr><td><a href="#" onclick="assetDetail('${x.a.id}');return false">${esc(x.a.code)}</a></td><td class="l">${esc(x.a.name)}</td><td class="l">${esc(x.a.loc||'—')}</td><td class="l">${why(x)}</td><td>${(+x.a.decCost||totVal(x.a))?money(+x.a.decCost||totVal(x.a)):'—'}</td></tr>`).join('')||'<tr><td colspan="5">لا توجد أصول مرشحة</td></tr>'}</table></div>`}
