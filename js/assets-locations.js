/* الأقسام والحالات والمواقع والنقل */
/* ===== المرحلة 1: الأقسام والحالات والمواقع ===== */
const FURN_T=['باب','شباك','كرسي','كنب','سرير','دولاب','مكتب','ترابيزة','ستارة','تلفزيون','أخرى'];
const HIDE_T=['نظام إنذار حريق','حضانة أطفال','غسالة / مجفف / مكواة'];
const secDef=t=>FURN_T.includes(t)||(GRP_TYPES.includes(t)&&!['حوض','قاعدة','خلاط','كشاف'].includes(t)&&!PFX_BASE_ENG.includes(t))?'تجهيزات':'هندسي';
const PFX_BASE_ENG=['تكييف','مولد','لوحة كهرباء','موتور مياه','مصعد','محطة غازات','غسالة / مجفف / مكواة','غسالة','مجفف','مكواة','سخان مياه','نظام نداء ممرضات','UPS','ثلاجة','شفاط','مخرج غاز طبي'];
const CONDS=['جيد ويعمل','يعمل ويحتاج صيانة','تالف ويحتاج إصلاح','تالف ويحتاج إحلال أو استبدال','خارج الخدمة'];
const secOf=t=>(settings.secMap||{})[t]||secDef(t);
const secA=a=>a.sec||secOf(a.type);
let aSec='';
function effCond(x){const a=x.a,c=a.cond||'جيد ويعمل';
  if(a.stat==='مُكهّن')return 'خارج الخدمة';
  if(a.dec==='استبدال'&&!a.decDone)return 'تالف ويحتاج إحلال أو استبدال';
  if(x.st!=='شغال'&&CONDS.indexOf(c)<2)return 'تالف ويحتاج إصلاح';
  return c;}
async function assetCond(id){const a=assets.find(x=>x.id===id);if(!a)return;
  const v=prompt('اختار رقم الحالة:\n'+CONDS.map((c,i)=>(i+1)+' - '+c).join('\n'),String(Math.max(1,CONDS.indexOf(a.cond||'جيد ويعمل')+1)));
  const c=CONDS[(+v)-1];if(!c)return;a.cond=c;
  await db.collection('assets').doc(id).update({cond:c});await assetLogAdd(a.code,'تغيير حالة',c);render();}
const locRows=()=>{const r=(settings.locations||{}).rows;return r&&r.length?r:AREAS.flatMap(([f,rs])=>rs.map(x=>({b:'المبنى الرئيسي',f,d:'',r:x})))};
const locLbl=r=>[r.b,r.f,r.r].filter(Boolean).join(' › ');
function locObj(){const i=$('#as_lc')?$('#as_lc').value:'';const r=i!==''?locRows()[+i]:null;return r?{b:r.b||'',f:r.f||'',r:r.r||''}:{}}
function locStr(){const i=$('#as_lc')?$('#as_lc').value:'',r=i!==''?locRows()[+i]:null,x=$('#as_l').value.trim();return [r?locLbl(r):($('#as_fl')?$('#as_fl').value:''),x].filter(Boolean).join(' – ')}
async function addLoc(){const g=k=>$('#lc_'+k).value.trim(),o={b:g('b'),f:g('f'),r:g('r')};
  if(!o.b||!o.f){alert('اكتب المبنى والدور على الأقل');return}
  await saveSet('locations',{rows:[...locRows(),o]});['b','f','r'].forEach(k=>$('#lc_'+k).value='');toast('اتضاف الموقع ✓');render();}
async function delLoc(i){if(!confirm('حذف الموقع من القائمة؟ الأصول المسجلة عليه مش هتتأثر.'))return;
  const r=[...locRows()];r.splice(i,1);await saveSet('locations',{rows:r});render();}
function vLocSet(){const r=locRows();
  return `<div class="card addf"><b>إعدادات المواقع (مبنى › دور › غرفة)</b><div class="msg hint">القائمة دي بتظهر في «موقع الأصل» عند التسجيل. إضافة أو حذف موقع مابيغيّرش الأصول المسجلة.</div><div class="row" style="margin-top:6px"><label>المبنى<input id="lc_b" data-keep="1"></label><label>الدور<input id="lc_f" data-keep="1"></label><label>الغرفة<input id="lc_r" data-keep="1"></label><button class="btn" onclick="addLoc()">إضافة موقع</button></div><details style="margin-top:6px"><summary>المواقع الحالية (${r.length})</summary>${r.map((x,i)=>`<span style="display:inline-flex;gap:4px;margin:2px;border:1px solid var(--bd);border-radius:14px;padding:2px 4px 2px 10px">${esc(locLbl(x))}<button class="btn sm alt" onclick="delLoc(${i})">✕</button></span>`).join('')}</details></div>`}
/* ===== المرحلة 2 و3: النقل والترقيم ===== */
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return ymd(x)};
function assetMove(id){const a=assets.find(x=>x.id===id);if(!a)return;closeEdit();
  const d=document.createElement('div');d.id='md';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;overflow:auto;padding:12px';
  d.innerHTML=`<div class="card" style="max-width:520px;margin:40px auto"><b>نقل ${esc(a.code)} – ${esc(a.name)}</b><div class="msg">الموقع الحالي: ${esc(a.loc||'بدون موقع')}</div><label>الموقع الجديد<select id="mv_l">${locRows().map((r,i)=>`<option value="${i}">${esc(locLbl(r))}</option>`).join('')}</select></label><div class="row" style="margin-top:8px"><button class="btn" onclick="assetMoveDo('${id}')">تأكيد النقل</button><button class="btn alt" onclick="assetDetail('${id}')">رجوع</button></div></div>`;document.body.appendChild(d)}
async function assetMoveDo(id){const a=assets.find(x=>x.id===id),r=locRows()[+$('#mv_l').value];if(!a||!r)return;
  const old=a.loc||'بدون موقع',p={loc:locLbl(r),b:r.b||'',f:r.f||'',r:r.r||''};Object.assign(a,p);
  await db.collection('assets').doc(id).update(p);await assetLogAdd(a.code,'نقل','من '+old+' إلى '+p.loc);toast('تم النقل ✓');assetDetail(id)}
async function assetPieces(id){const a=assets.find(x=>x.id===id);if(!a)return;
  if(!isGrp(a)||(+a.qty||0)<2){alert('الترقيم للمجموعات اللي عددها قطعتين أو أكتر');return}
  if(a.pieces&&!confirm('القطع مرقّمة بالفعل. إعادة الترقيم؟'))return;
  a.pieces=Array.from({length:+a.qty},(_,i)=>a.code+'-'+String(i+1).padStart(2,'0'));
  await db.collection('assets').doc(id).update({pieces:a.pieces});await assetLogAdd(a.code,'ترقيم','ترقيم '+a.qty+' قطعة');assetDetail(id)}
