/* عمليات الأصول (الأدوار، التقسيم، الإحصاء، سجل الأصل) */
async function setFloor(id,v){const a=assets.find(x=>x.id===id);if(!a)return;a.f=v;await db.collection('assets').doc(id).update({f:v});await assetLogAdd(a.code,'تحديد الدور',v||'—');toast('اتحدد الدور ✓')}
async function bulkFloor(){const v=$('#bf_f').value;if(!v){alert('اختار الدور الأول');return}
  const l=assets.filter(a=>!isAC(a)).map(a=>({a,...assetStats(a)})).filter(x=>(!aSec||secA(x.a)===aSec)&&afOK(x));
  if(!l.length||!confirm('تحديد «'+v+'» لـ '+l.length+' أصل (الظاهرين في الجدول حسب الفلاتر الحالية)؟'))return;
  for(const x of l){x.a.f=v;await db.collection('assets').doc(x.a.id).update({f:v})}
  await assetLogAdd('—','تحديد الدور بالجملة',v+' ← '+l.length+' أصل');toast('تم ✓');render()}
function vFloorBulk(){return `<div class="card"><b>تحديد الدور بالجملة:</b> فلتر الأصول بالنوع أو غيره، اختار الدور واضغط تطبيق عشان يتسجل على كل الأصول الظاهرة. <div class="row" style="margin-top:6px"><label>الدور<select id="bf_f"><option value="">— اختر —</option>${[...new Set(locRows().map(r=>r.f))].map(f=>`<option>${esc(f)}</option>`).join('')}</select></label><button class="btn" onclick="bulkFloor()">تطبيق على الظاهر</button></div></div>`}
function assetSplit(id){const a=assets.find(x=>x.id===id);if(!a)return;closeEdit();
  const T=['غسالة','مجفف','مكواة'],d=document.createElement('div');d.id='md';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;overflow:auto;padding:12px';
  d.innerHTML=`<div class="card" style="max-width:620px;margin:30px auto"><b>تقسيم ${esc(a.code)} – ${esc(a.name)} لأصول منفصلة</b><div class="msg hint">اكتب كل أصل في سطر بالشكل: <b>النوع | الاسم</b>. السطر الأول بيحتفظ بالكود الحالي (${esc(a.code)}) وبسجل أعطاله، وباقي الأسطر بياخدوا كود جديد لكل واحد. الأنواع المتاحة: ${T.join('، ')} أو أي نوع من قايمة الأنواع. الموقع والماركة والموديل والدور بيتنسخوا.</div><textarea id="sp_t" rows="5" style="width:100%">${T[0]} | ${esc(a.name)} – غسالة\n${T[1]} | ${esc(a.name)} – مجفف</textarea><div class="row" style="margin-top:8px"><button class="btn" onclick="assetSplitDo('${id}')">تنفيذ التقسيم</button><button class="btn alt" onclick="assetDetail('${id}')">رجوع</button></div></div>`;document.body.appendChild(d)}
async function assetSplitDo(id){const a=assets.find(x=>x.id===id);if(!a)return;
  const ls=$('#sp_t').value.split('\n').map(l=>l.split('|').map(z=>z.trim())).filter(p=>p[0]&&p[1]);
  if(ls.length<2){alert('اكتب أصلين على الأقل');return}
  const bad=ls.find(p=>!ATY.includes(p[0]));if(bad){alert('النوع «'+bad[0]+'» مش موجود في قايمة الأنواع');return}
  if(!confirm('هيتقسم الأصل إلى '+ls.length+' أصول. نكمل؟'))return;
  const keep=['loc','b','f','r','brand','model','specs','pdate','cond','inst','value','note'],codes=[a.code];
  const first={type:ls[0][0],name:ls[0][1],mode:'فردي',qty:0,qtyFix:0,qtyDead:0,pieces:null};Object.assign(a,first);
  await db.collection('assets').doc(id).update(first);
  for(const p of ls.slice(1)){const c=nextCodes(p[0],1)[0],nid='as'+Date.now()+'-'+DEV+codes.length,o={code:c,name:p[1],type:p[0],mode:'فردي',qty:0,cap:0,capu:''};
    keep.forEach(k=>{if(a[k]!==undefined)o[k]=a[k]});assets.push({id:nid,...o});await db.collection('assets').doc(nid).set(o);await assetLogAdd(c,'إنشاء','ناتج تقسيم '+a.code);codes.push(c)}
  await assetLogAdd(a.code,'تقسيم','اتقسم إلى: '+codes.join('، '));toast('تم التقسيم ✓ ('+codes.join('، ')+')');assetDetail(id)}
async function setSec(t,v){await saveSet('secMap',{[t]:v});toast('اتغير تصنيف النوع ✓');render()}
function vSecSet(){return `<div class="card"><details><summary><b>تصنيف أنواع الأصول (هندسي / تجهيزات وأثاث)</b></summary><div class="msg hint">اختيارك بيتطبق على كل أصول النوع. ولو عايز أصل واحد يشذ عن نوعه، عدّل خانة «القسم» في تعديل الأصل.</div>${ATY.filter(t=>!HIDE_T.includes(t)).map(t=>`<span style="display:inline-block;margin:3px;border:1px solid var(--bd);border-radius:8px;padding:3px 8px">${esc(t)} <select onchange="setSec('${t}',this.value)">${['هندسي','تجهيزات'].map(o=>`<option ${secOf(t)===o?'selected':''}>${o}</option>`).join('')}</select></span>`).join('')}</details></div>`}
function vAssetLists(){
  const c=settings.assetLists||{},ts=c.types||[],us=c.units||[];
  const chip=(txt,fn)=>`<span style="display:inline-flex;gap:4px;align-items:center;background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:2px 4px 2px 10px;margin:2px">${esc(txt)}<button class="btn sm alt" style="padding:0 6px;min-height:0" title="حذف" onclick="${fn}">✕</button></span>`;
  return `<div class="card addf"><b>إضافة نوع أصل / وحدة قدرة جديدة</b><div class="msg hint">النوع الجديد بيظهر في كل القوائم (أصل جديد، التسجيل بالجملة، الفلاتر، التعديل، استيراد إكسل). الوحدة الجديدة بتظهر في حقل «وحدة القدرة».</div>
  <div class="row" style="margin-top:6px"><label>اسم النوع<input id="as_xn" data-keep="1" placeholder="مثلاً: مضخة حريق"></label><label>بادئة الكود (إنجليزي)<input id="as_xp" data-keep="1" maxlength="5" dir="ltr" placeholder="FP" style="width:90px"></label><label>العمر الافتراضي (سنة)<input id="as_xl" type="number" min="1" data-keep="1" placeholder="10" style="width:90px"></label><label>الطريقة<select id="as_xg"><option>فردي</option><option>مجموعة</option></select></label><label>التخصص<select id="as_xt">${TRD.map(t=>`<option ${t==='أخرى'?'selected':''}>${t}</option>`).join('')}</select></label><button class="btn" onclick="addAssetType()">إضافة النوع</button></div>
  <div class="row" style="margin-top:6px"><label>وحدة قدرة جديدة<input id="as_xu" data-keep="1" placeholder="مثلاً: م³/ساعة"></label><button class="btn" onclick="addCapUnit()">إضافة الوحدة</button></div>
  ${ts.length||us.length?`<div style="margin-top:6px">${ts.length?'<span class="msg">أنواع أضفتها: </span>'+ts.map((t,i)=>chip(t.name+' ('+t.pfx+')','delAssetType('+i+')')).join(''):''}${us.length?' <span class="msg">وحدات أضفتها: </span>'+us.map((u,i)=>chip(u,'delCapUnit('+i+')')).join(''):''}</div>`:''}</div>`;
}
function nextCodes(type,n){
  const p=PFX[type]||'OT';let mx=0;assets.forEach(x=>{const m=String(x.code).match(/^([A-Za-z]+)-(\d+)$/);if(m&&m[1].toUpperCase()===p)mx=Math.max(mx,+m[2])});
  const out=[];for(let i=1;i<=n;i++)out.push(p+'-'+String(mx+i).padStart(2,'0'));return out;
}
function assetStats(a){
  const grp=isGrp(a),qty=grp?(+a.qty||1):1,qf=grp?(+a.qtyFix||0):0,qd=grp?(+a.qtyDead||0):0,tv=totVal(a);
  const ns=notices.filter(n=>n.asset&&sameCode(n.asset,a.code)),d1=new Date();d1.setFullYear(d1.getFullYear()-1);const y1=ymd(d1);
  const jc=jobsheets.filter(j=>j.asset&&sameCode(j.asset,a.code)).reduce((t,j)=>t+(+j.cost||0),0);
  const cost=ns.reduce((t,n)=>t+noticeCost(n),0)+jc,open=ns.filter(n=>n.status!=='تم الإصلاح');
  const r12=ns.filter(n=>String(iso(n.date))>=y1).length,last=ns.map(n=>String(iso(n.date))).sort().pop()||'';
  const yr=yearOf(a.inst),age=yr?thisYear()-yr:null,life=+a.life||LIFE[a.type]||10;
  let st='شغال',stc='s-ok';
  const badN=grp?Math.min(qty,Math.max(open.reduce((t,n)=>t+(+n.aff||1),0),qf)+qd):0;
  if(a.stat==='مُكهّن'){st='مُكهّن';stc='s-bad'}
  else if(grp){if(badN>=qty){st='معطل – المجموعة كلها';stc='s-bad'}else if(badN>0){st='معطل جزئياً ('+badN+' من '+qty+')';stc='s-warn'}}
  else if(open.some(n=>n.status==='غير قابل للإصلاح')){st='معطل – غير قابل للإصلاح';stc='s-bad'}
  else if(open.length){st='معطل – تحت الصيانة';stc='s-warn'}
  return{ns,open,cost,r12,last,age,life,st,stc,grp,qty,qf,qd};
}
function assetLogAdd(code,kind,text){
  const id='al'+Date.now()+'-'+DEV+Math.random().toString(36).slice(2,4),o={code,at:new Date().toISOString(),kind,text,by:window.USER_EMAIL||''};
  assetLog.unshift({id,...o});return db.collection('assetLog').doc(id).set(o);
}
