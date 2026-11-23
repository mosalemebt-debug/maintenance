/* المرور اليومي */
/* ---------- المرور اليومي (افتراضي: الكل سليم ✓) ---------- */
let draft=null;
function getDraft(){if(!draft||draft.date!==rdate){const r=rounds[rdate];draft={date:rdate,dirty:false,saved:!!r,marks:{...((r&&r.marks)||{})},notes:{...((r&&r.notes)||{})},sup:(r&&r.sup)||''}}return draft}
const supList=()=>[...new Set(Object.values(rounds).map(r=>r.sup).filter(Boolean))];
function dSup(v){const d=getDraft();d.sup=v.trim();d.dirty=true;render()}
const fullMarks=d=>{const m={};ALL.forEach((x,i)=>CATS.forEach((c,j)=>m[i+'_'+j]=d.marks[i+'_'+j]||'✓'));return m};
function roundTable(d,withOpen){
  const bad=Object.values(fullMarks(d)).filter(x=>x==='✗').length;
  const stTxt=d.dirty?'⚠ تعديلات غير محفوظة':(d.saved&&withOpen)?'✔ محفوظ':'لم يُحفظ بعد – الكل ✓ افتراضياً';
  const stCls2=d.dirty?'s-warn':(d.saved&&withOpen)?'s-ok':'';
  let h=`<div class="card"><div class="row"><button class="btn alt" onclick="shiftDay(-1)">◀ اليوم السابق</button><button class="btn alt" onclick="goDay(ymd(new Date()))">اليوم</button><button class="btn alt" onclick="shiftDay(1)">اليوم التالي ▶</button>
  <label>التاريخ (${DAYS[new Date(rdate+'T12:00:00').getDay()]})<input type="date" value="${rdate}" onchange="goDay(this.value)"></label><label>المشرف المنفّذ للمرور<input id="rsup" list="suplist" data-keep="1" value="${esc(d.sup)}" onchange="dSup(this.value)" placeholder="اسم المشرف"></label><datalist id="suplist">${supList().map(s=>`<option value="${esc(s)}">`).join('')}</datalist></div>
  <div class="row" style="margin-top:8px"><span class="${stCls2}" style="padding:6px 10px;border-radius:6px"><b>${stTxt}</b></span><span><b>الأعطال المحددة: ${bad}</b></span><button class="btn" onclick="saveRound()">حفظ المرور اليومي</button></div>
  <div class="row" style="margin-top:8px"><label>تاريخ النسخ<input type="date" id="cpd" value="${cpVal()}" onchange="cpDate=this.value"></label><button class="btn alt" onclick="copyRoundTo()">📋 انسخ اليوم ده إلى التاريخ</button><button class="btn alt" onclick="copyRoundFrom()">📥 انسخ من التاريخ إلى اليوم ده</button></div>
  <div class="msg hint">كل الخانات سليمة ✓ افتراضياً؛ غيّر الخانات اللي فيها مشكلة فقط (✗) واكتب الملاحظة، ثم اضغط حفظ مرة واحدة. الأعطال بتتسجل في الصيانة العلاجية عند الحفظ.</div></div>
  <div class="card wrap"><table><tr><th>المكان</th>${CATS.map(c=>`<th>${c}</th>`).join('')}<th>ملاحظات</th>${withOpen?'<th>مفتوح بالعلاجية</th>':''}</tr>`;
  let last='';
  ALL.forEach((x,i)=>{
    if(x.f!==last){h+=`<tr><td class="fl" colspan="${CATS.length+2+(withOpen?1:0)}">${x.f}</td></tr>`;last=x.f}
    const occ=CATS.every((c,j)=>d.marks[i+'_'+j]==='مشغولة');
    h+=`<tr><td class="l"><span>${x.a}</span> <button class="btn sm ${occ?'':'alt'}" onclick="occupy(${i})">${occ?'✔ مشغولة':'مشغولة'}</button></td>`+CATS.map((c,j)=>{const m=d.marks[i+'_'+j]||'✓';
      return `<td class="${m==='✗'?'s-bad':m==='✓'?'s-ok':''}"><select onchange="dSet(${i},${j},this.value)">${['✓','✗','مشغولة','لا يوجد'].map(o=>`<option ${o===m?'selected':''}>${o}</option>`).join('')}</select></td>`}).join('')
      +`<td><textarea rows="1" data-keep="1" oninput="fit(this)" onchange="dNote(${i},this.value)">${esc(d.notes[i])}</textarea></td>`;
    if(withOpen){const open=notices.filter(n=>n.dept&&n.dept.includes(x.a)&&iso(n.date)<=rdate&&(n.status!=='تم الإصلاح'||(n.fixdate&&iso(n.fixdate)>rdate)));h+=`<td class="${open.length?'s-warn':''}">${open.map(n=>`<button class="btn sm alt" style="margin:1px" title="${esc(n.details||'')}" onclick="openEdit('notices','${n.id}')">${esc(n.ref)}</button>`).join(' ')}</td>`}
    h+='</tr>';
  });
  return h+'</table></div><div class="card"><button class="btn" onclick="saveRound()">حفظ المرور اليومي</button></div>';
}
let cpDate='';
function cpVal(){return cpDate||ymd(new Date(new Date(rdate+'T12:00:00').getTime()+864e5))}
function copyRoundTo(){
  const t=document.getElementById('cpd').value;
  if(!t||t===rdate){toast('اختار تاريخ مختلف عن اليوم الحالي');return}
  if(rounds[t]&&!confirm('يوم '+t+' فيه مرور محفوظ. هيتستبدل بنسخة اليوم الحالي عند الحفظ. تكمل؟'))return;
  const s=getDraft();
  draft={date:t,dirty:true,saved:!!rounds[t],marks:{...fullMarks(s)},notes:{...s.notes},sup:''};
  rdate=t;cpDate='';toast('اتنسخ إلى '+t+' – راجع واضغط حفظ');render();
}
function copyRoundFrom(){
  const t=document.getElementById('cpd').value;
  if(!t||t===rdate){toast('اختار تاريخ مختلف عن اليوم الحالي');return}
  const r=rounds[t];
  if(!r){toast('مفيش مرور محفوظ في '+t);return}
  const d=getDraft();
  if((d.dirty||d.saved)&&!confirm('هتستبدل بيانات اليوم الحالي بمرور '+t+'. تكمل؟'))return;
  draft={date:rdate,dirty:true,saved:!!rounds[rdate],marks:{...(r.marks||{})},notes:{...(r.notes||{})},sup:d.sup};
  toast('اتنسخ من '+t+' – راجع واضغط حفظ');render();
}
function vRound(){return roundTable(getDraft(),true)}
function vERound(){return roundTable(getDraft(),false)}
function occupy(i){const d=getDraft();const all=CATS.every((c,j)=>d.marks[i+'_'+j]==='مشغولة');CATS.forEach((c,j)=>d.marks[i+'_'+j]=all?'✓':'مشغولة');d.dirty=true;render()}
function dSet(i,j,v){const d=getDraft();d.marks[i+'_'+j]=v;d.dirty=true;render()}
function dNote(i,v){const d=getDraft();d.notes[i]=v;d.dirty=true;render()}
async function applyRound(date,marks,notes,by,sup){
  sup=(sup||'').trim();await db.collection('rounds').doc(date).set({marks,notes,sup});
  rounds[date]={marks,notes,sup};
  for(let i=0;i<ALL.length;i++)for(let j=0;j<CATS.length;j++){
    if(marks[i+'_'+j]!=='✗')continue;
    const a=ALL[i].a,c=CATS[j];
    if(notices.find(n=>n.src==='مرور'&&n.dept===a&&n.cat===c&&(n.status!=='تم الإصلاح'||n.date===date)))continue;
    await addNotice({date,dept:a,reporter:'المرور اليومي'+(sup?' – '+sup:''),details:(notes[i]||'عطل')+' – '+c,src:'مرور',cat:c,by:by||''});
  }
}
async function saveRound(){
  const d=getDraft(),marks=fullMarks(d);
  if(!(d.sup||'').trim()){alert('اكتب اسم المشرف المنفّذ للمرور قبل الحفظ');const e=document.getElementById('rsup');if(e)e.focus();return}
  if(window.ROLE==='entry'){await send({type:'round',data:{date:rdate,marks,notes:d.notes,sup:d.sup.trim()}});draft=null;render();return}
  await applyRound(rdate,marks,d.notes,'',d.sup);draft=null;toast('تم حفظ المرور اليومي ✓');render();
}
