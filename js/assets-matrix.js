/* استيراد حصر الغرف: جدول (الدور / المكان) × أصناف بالأعداد + ورقة تفاصيل اختيارية (ماركة، مقاس، سنة، أماكن) */
let mx=null;
const lk=s=>nk(s).replace(/ه/g,'');
const mxItemKey=s=>nk(s).replace(/^ال/,'').replace(/(ات|ه)$/,'');
const MX_GUESS=[[/كشاف|لمب|اضاء|إضاء/,'كشاف'],[/باب/,'باب'],[/شباك|نافذ/,'شباك'],[/حوض|مغسل/,'حوض'],[/قاعد|مرحاض|كرسي\s*حمام/,'قاعدة'],[/(^|\s)دش|شاور/,'دش'],[/شفاط/,'شفاط'],[/سخان/,'سخان مياه'],[/خلاط|حنفي/,'خلاط'],[/ثلاج/,'ثلاجة'],[/تلفزيون|شاشة/,'تلفزيون'],[/سرير/,'سرير'],[/دولاب|خزان/,'دولاب'],[/مكتب/,'مكتب'],[/ترابيز|طاول/,'ترابيزة'],[/كنب|انتريه|أنتريه/,'كنب'],[/كرسي/,'كرسي'],[/ستار|ستاير/,'ستارة']];
const mxRoot=w=>String(w).toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/^ال/,'').replace(/(ات|ه)$/,'');
const mxToks=s=>String(s||'').split(/[\s+\-_\/()]+/).map(mxRoot).filter(w=>w.length>1);
/* الأنواع اللي أضافها المستخدم (إضافة نوع أصل) لها أولوية: مطابقة بالكلمات (لمبة كاسة = لمبات الكاسة) */
function mxCustomGuess(h){const ht=mxToks(h);let best='',bl=0;for(const t of ((settings.assetLists||{}).types||[])){const n=t&&t.name;if(!n||!ATY.includes(n))continue;const tt=mxToks(n);if(tt.length&&tt.every(w=>ht.includes(w))&&tt.length>bl){best=n;bl=tt.length}}return best}
function mxGuess(h){const c=mxCustomGuess(h);if(c)return c;for(const [rx,t] of MX_GUESS)if(rx.test(h)&&ATY.includes(t))return t;return ''}
function mxSplitType(t){t=XS(t).replace(/[\\\/\s]+$/,'').replace(/\s+/g,' ');const m=t.match(/^(.*?\S)\s+(\d.*)$/);return m?{brand:m[1],model:m[2]}:{brand:t,model:''}}
/* النوع والقدرة من خلية واحدة: «LG 55 بوصة» ← ماركة LG + قدرة 55 بوصة، «فريش 20 لتر»، «36 وات» */
function mxSpec(t){
  t=XS(t);let cap=0,capu='';
  const m=t.match(/(\d+(?:[.,]\d+)?)\s*(كيلو\s*وات|kw|وات|بوص[ةه]|[اإ]نش|inch|لتر|حصان|hp|[اأ]مبير|سم|cm|كجم)/i);
  if(m){cap=+m[1].replace(',','.');const u=m[2].replace(/\s+/g,'');capu=/^(كيلووات|kw)$/i.test(u)?'كيلووات':u==='وات'?'وات':/^(بوص|[اإ]نش|inch)/i.test(u)?'بوصة':u==='لتر'?'لتر':/^(حصان|hp)$/i.test(u)?'حصان':/مبير/.test(u)?'أمبير':/^(سم|cm)$/i.test(u)?'سم':'كجم';
    t=(t.slice(0,m.index)+' '+t.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim()}
  return{...mxSplitType(t),cap,capu};
}
const mxTypes=()=>ATY.filter(t=>t!=='تكييف');
function mxFindMatrix(ws){
  const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
  for(let i=0;i<Math.min(raw.length,15);i++){const h=raw[i].map(XS),fi=h.findIndex(c=>c.startsWith('الدور')),pi=h.findIndex(c=>c.startsWith('المكان'));if(fi>=0&&pi>=0)return{raw,hi:i,fi,pi,h}}
  return null;
}
function mxParse(wb){
  const m={cols:[],data:[],details:[],note:[]};let mName=null;
  for(const name of wb.SheetNames){const ws=wb.Sheets[name];if(!ws)continue;const M=mxFindMatrix(ws);if(!M)continue;mName=name;
    const{raw,hi,fi,pi,h}=M,W=Math.max(...raw.slice(0,hi+3).map(r=>r.length));
    const sub0=raw[hi+1]||[],hasSub=XS(sub0[pi])===''&&sub0.some(c=>/^(العدد|نوع)/.test(XS(c))),sub=hasSub?sub0.map(XS):[],start=hasSub?hi+2:hi+1;
    const body=raw.slice(start).filter(r=>XS(r[pi])!==''),isNum=v=>typeof v==='number'||/^[\d.\s]*$/.test(XS(v));
    let lastH='';
    for(let j=pi+1;j<W;j++){
      const isSub=x=>x&&!/^(العدد|نوع)/.test(x);let hj=h[j]||'';
      if(!hj){if(hasSub&&isSub(sub[j])&&lastH)hj=lastH;else continue}else lastH=hj;
      const sfx=hasSub&&isSub(sub[j])?sub[j]:'';if(sfx)hj=hj+' '+sfx;
      const k=j+1;let tj=-1;
      if(k<W&&!(h[k]||'')){const hasTxt=body.some(r=>XS(r[k])!==''&&!isNum(r[k]));if(/^نوع/.test(sub[k]||'')||hasTxt)tj=k}
      const t=mxGuess(hj),mm=hj.match(/^(.*?)\s*\((.*)\)\s*$/),nm=(mm?mm[1]:hj).replace(/\s*\+\s*/g,' + ').replace(/\s+/g,' ').trim();
      m.cols.push({j,tj,h:hj.replace(/\s+/g,' ').trim(),name:nm,notes:mm?mm[2].replace(/\s+/g,' ').trim():'',type:t,mode:t&&GRP_TYPES.includes(t)?'مجموعة':'فردي'});
    }
    let lastF='';
    for(let i=start;i<raw.length;i++){const r=raw[i];
      if(XS(r[fi])!=='')lastF=XS(r[fi]);
      const place=XS(r[pi]);if(!place)continue;
      m.data.push({row:i+1,f:fixFloor(lastF),place,qty:m.cols.map(c=>Math.max(0,Math.floor(XN(r[c.j])))),txt:m.cols.map(c=>c.tj>=0?XS(r[c.tj]):'')});
    }
    break;
  }
  if(!mName)return null;
  for(const name of wb.SheetNames){if(name===mName)continue;const ws=wb.Sheets[name];if(!ws)continue;
    XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true}).forEach((r,i)=>{
      if(XS(r[0])===''||XS(r[4])==='')return;if(XS(r[0]).startsWith('الصنف'))return;
      m.details.push({row:i+1,item:XS(r[0]),brand:XS(r[1]),model:XS(r[2]),inst:yearOf(r[3])||'',locs:XS(r[4]).split(/\s*[-–—،\n]\s*/).map(XS).filter(Boolean)});
    });
  }
  return m;
}
function mxCompute(){
  if(!mx)return;
  const rows=[],warn=[],keysSeen=new Set(assets.map(a=>a.impKey).filter(Boolean));
  const colDet=c=>mx.details.filter(d=>{const a=mxItemKey(c.h),b=mxItemKey(d.item);return a.length>1&&b.length>1&&(a.includes(b)||b.includes(a))});
  const placeKeys=new Set(mx.data.map(d=>lk(d.place)));
  /* تحذيرات ورقة التفاصيل */
  mx.details.forEach(d=>{
    const cs=mx.cols.map((c,ci)=>({c,ci})).filter(({c})=>c.type&&colDet(c).includes(d));
    if(!cs.length){warn.push('ورقة التفاصيل سطر '+d.row+': الصنف «'+d.item+'» مش مطابق لأي عمود في الجدول (أو العمود نوعه غير محدد)');return}
    d.locs.forEach(l=>{
      if(!placeKeys.has(lk(l))){warn.push('ورقة التفاصيل سطر '+d.row+': المكان «'+l+'» مش موجود في الجدول');return}
      const rs=mx.data.filter(x=>lk(x.place)===lk(l));
      if(!rs.some(x=>cs.some(({ci})=>x.qty[ci]>0)))warn.push('«'+d.item+'» مذكور في «'+l+'» بورقة التفاصيل لكن العدد في الجدول صفر – مش هيتسجل، راجع الجدول');
    });
  });
  mx.data.forEach(d=>mx.cols.forEach((c,ci)=>{
    const qty=d.qty[ci];if(!qty||!c.type)return;
    const dets=colDet(c),mine=dets.find(x=>x.locs.some(l=>lk(l)===lk(d.place)));
    if(dets.length&&!mine)warn.push('«'+c.h+'» في «'+d.place+'» (عدد '+qty+') مش مذكور في قائمة الأماكن بورقة التفاصيل – هيتسجل من غير ماركة/مقاس/سنة');
    const mode=c.mode,base=['mx',nk(c.h),nk(d.f),lk(d.place)].join('|'),pl=placeLabel(d.place),loc=d.f?d.f+' – '+pl:pl;
    const cb=mxSpec(d.txt[ci]);
    const rec={col:c.h,name:c.name||c.h,notes:c.notes||'',type:c.type,mode,qty,f:d.f,place:pl,loc,brand:cb.brand||(mine?mine.brand:''),model:cb.model||(mine?mine.model:''),cap:cb.cap,capu:cb.capu,inst:mine?mine.inst:'',base};
    if(mode==='مجموعة'){
      const ex=assets.find(a=>a.impKey===base);
      if(ex){const same=(+ex.qty||0)===qty&&(!rec.brand||ex.brand===rec.brand)&&(!rec.model||ex.model===rec.model)&&(!rec.cap||(+ex.cap===rec.cap&&ex.capu===rec.capu))&&(!rec.inst||+ex.inst===+rec.inst);rec.action=same?'skip':'update';rec.id=ex.id;rec.old=+ex.qty||0}else rec.action='create';
      rec.n=1;rows.push(rec);return;
    }
    if(qty>200){warn.push('«'+c.h+'» في «'+d.place+'»: العدد '+qty+' أكبر من 200 كأصول فردية – اتخطى');return}
    const keys=[];for(let k=0;k<qty;k++)if(!keysSeen.has(base+'|'+k))keys.push({k,key:base+'|'+k});
    rec.action=keys.length?'create':'skip';rec.keys=keys;rec.n=keys.length;rows.push(rec);
  }));
  const emptyP=mx.data.filter(d=>!d.qty.some(q=>q>0)&&!d.txt.some(Boolean)).map(d=>d.place);
  if(emptyP.length)warn.push(emptyP.length+' مكان من غير أي عدد في الجدول (لم يُحصر بعد؟): '+emptyP.slice(0,8).join('، ')+(emptyP.length>8?'…':''));
  mx.cols.forEach((c,ci)=>{if(c.type==='باب'&&/حمام/.test(c.h)){const ps=mx.data.filter(d=>d.qty[ci]>0&&!/حمام/.test(d.place)).map(d=>d.place);if(ps.length)warn.push('«'+c.h+'» مسجل في مكان مش حمام ('+ps.join('، ')+') – راجع: ممكن يكون المقصود صف الحمام بتاعه')}});
  mx.cols.forEach((c,ci)=>{if(c.tj<0||!c.type)return;const ps=mx.data.filter(d=>d.qty[ci]>0&&!d.txt[ci]).map(d=>d.place);if(ps.length)warn.push('«'+c.h+'»: '+ps.length+' مكان فيه عدد ومن غير نوع/ماركة ('+ps.slice(0,6).join('، ')+(ps.length>6?'…':'')+')')});
  mx.unset=mx.cols.filter(c=>!c.type&&mx.data.some(d=>d.qty[mx.cols.indexOf(c)]>0));
  mx.rows=rows;mx.warn=[...new Set(warn)];
}
async function mxLoad(f){
  if(!f)return;
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  let m;try{m=mxParse(XLSX.read(await f.arrayBuffer()))}catch(e){alert('تعذر قراءة الملف: '+e.message);return}
  if(!m||!m.cols.length){alert('مش لاقي جدول فيه عمودين «الدور» و«المكان» وبعدهم أعمدة الأصناف. استخدم «تحميل نموذج الحصر».');return}
  m.file=f.name;mx=m;mxCompute();render();
}
function mxCancel(){mx=null;render()}
function mxSet(i,k,v){const c=mx.cols[i];c[k]=v;if(k==='type')c.mode=v&&GRP_TYPES.includes(v)?'مجموعة':'فردي';mxCompute();render()}
function mxTplDownload(){
  if(typeof XLSX==='undefined'){alert('مكتبة الإكسل غير محملة – تأكد من الإنترنت وجرّب تاني');return}
  const H=['الدور','المكان','كشاف 60*60','كشاف بنل 36 وات','باب غرفه','باب حمام','قاعدة','حوض','دش','شفاط','سخان','شباك المونتال صغير','شباك المونتال كبير'];
  const ws=XLSX.utils.aoa_to_sheet([H,['الأول','مخزن رئيسي',2,6,1,0,0,0,0,0,0,0,0],[null,'غرف نواب 1',1,0,1,1,1,1,1,1,1,1,0],[null,108,4,1,1,1,1,1,1,1,1,0,1]]);ws['!cols']=H.map((h,i)=>({wch:i<2?18:14}));ws['!views']=[{RTL:true}];
  const w2=XLSX.utils.aoa_to_sheet([['الصنف','الماركة','الموديل / المقاس','سنة التركيب','الأماكن (مفصولة بـ -)'],['السخانات','فريش','20 لتر',2026,'غرف نواب 1-108'],['شفاط','فريش','25 سم',2026,'غرف نواب 1']]);w2['!cols']=[16,14,16,12,40].map(w=>({wch:w}));w2['!views']=[{RTL:true}];
  const w3=XLSX.utils.aoa_to_sheet([['تعليمات استيراد حصر الغرف'],['1) الورقة الأولى: عمود «الدور» (ممكن تكتبه مرة واحدة فوق أول مكان في الدور)، عمود «المكان»، وبعدهم عمود لكل صنف بعدد القطع في المكان.'],['2) الورقة التانية (اختيارية): لكل صنف الماركة والموديل/المقاس وسنة التركيب والأماكن اللي فيها الصنف ده، مفصولة بعلامة -.'],['3) في المعاينة بتحدد نوع كل عمود وهل بيتسجل «مجموعة» (كود واحد للعدد) أو «فردي» (كود لكل قطعة).'],['4) إعادة رفع نفس الملف مابتكررش الأصول: المجموعات بيتحدّث عددها، والفردي بيتضاف الناقص بس.']]);w3['!cols']=[110].map(w=>({wch:w}));w3['!views']=[{RTL:true}];
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'الحصر');XLSX.utils.book_append_sheet(wb,w2,'التفاصيل');XLSX.utils.book_append_sheet(wb,w3,'تعليمات');
  dl('نموذج_حصر_الغرف.xlsx',XLSX.write(wb,{type:'array',bookType:'xlsx'}));
}
function vMxImport(){
  let h=`<div class="card addf"><b>استيراد حصر الغرف (جدول: الدور / المكان × الأصناف بالأعداد)</b><div class="msg hint">نفس شكل ملفك: صف لكل مكان، وعمود لكل صنف (كشاف، باب، حوض، سخان...) بالعدد، وورقة تانية اختيارية فيها الماركة والمقاس والسنة والأماكن. هتشوف معاينة وتحدد نوع كل عمود قبل أي حفظ. التكييف مالوش دعوة بالاستيراد ده (له صفحته).</div><div class="row" style="margin-top:6px"><button class="btn alt" onclick="mxTplDownload()">تحميل نموذج الحصر</button><label class="btn" style="flex-direction:row">اختيار ملف الحصر<input type="file" accept=".xlsx" onchange="mxLoad(this.files[0]);this.value=''" hidden></label></div>`;
  if(mx){
    const cr=mx.rows.filter(r=>r.action==='create'),up=mx.rows.filter(r=>r.action==='update'),sk=mx.rows.filter(r=>r.action==='skip');
    const nI=cr.filter(r=>r.mode==='فردي').reduce((t,r)=>t+r.n,0),nG=cr.filter(r=>r.mode==='مجموعة').length,show=mx.rows.filter(r=>r.action!=='skip');
    h+=`<div style="margin-top:10px"><b>معاينة الملف: ${esc(mx.file)}</b> · ${mx.data.length} مكان · ${mx.cols.length} عمود</div>
    <div class="wrap" style="max-height:280px;margin:8px 0"><table><tr><th>العمود</th><th>الاسم اللي هيتسجل</th><th>النوع</th><th>طريقة التسجيل</th></tr>${mx.cols.map((c,i)=>`<tr><td class="l">${esc(c.h)}${c.tj>=0?'<div class="msg">+ عمود نوع/ماركة</div>':''}</td><td><input value="${esc(c.name)}" onchange="mxSet(${i},'name',this.value)" style="min-width:140px"></td><td><select onchange="mxSet(${i},'type',this.value)"><option value="">— تجاهل العمود —</option>${mxTypes().map(t=>`<option ${c.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select></td><td><select onchange="mxSet(${i},'mode',this.value)">${['فردي','مجموعة'].map(o=>`<option ${c.mode===o?'selected':''}>${o}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`;
    if(mx.unset.length)h+=`<div class="card s-warn" style="margin-bottom:8px">أعمدة فيها أعداد ونوعها مش محدد (مش هتتسجل): ${mx.unset.map(c=>esc(c.h)).join('، ')}. اختار نوعها من الجدول فوق، ولو النوع مش في القايمة ضيفه من «إضافة نوع أصل».</div>`;
    h+=`<div class="grid" style="margin:8px 0"><div class="k s-ok"><b>${nI}</b>أصل فردي جديد</div><div class="k s-ok"><b>${nG}</b>مجموعة جديدة</div><div class="k"><b>${up.length}</b>تحديث عدد مجموعة</div><div class="k"><b>${sk.length}</b>متخطى (موجود)</div><div class="k ${mx.warn.length?'s-warn':''}"><b>${mx.warn.length}</b>تنبيه</div></div>`;
    if(mx.warn.length)h+=`<div class="card s-warn" style="margin-bottom:8px"><b>تنبيهات (راجعها قبل التأكيد):</b><br>${mx.warn.slice(0,30).map(esc).join('<br>')}${mx.warn.length>30?'<br>… وتنبيهات أخرى':''}</div>`;
    if(show.length)h+=`<div class="wrap" style="max-height:300px"><table><tr>${['الإجراء','النوع','الاسم','الطريقة','العدد','الموقع','الماركة / الموديل / السنة'].map(x=>`<th>${x}</th>`).join('')}</tr>${show.slice(0,60).map(r=>`<tr><td class="${r.action==='create'?'s-ok':''}">${r.action==='create'?'جديد':'تحديث (كان '+r.old+')'}</td><td>${esc(r.type)}</td><td class="l">${esc(r.name)}</td><td>${r.mode}</td><td>${r.mode==='مجموعة'?r.qty:r.n+(r.n<r.qty?' من '+r.qty:'')}</td><td class="l">${esc(r.loc)}</td><td class="l">${[r.brand,r.model,r.cap?r.cap+' '+r.capu:'',r.inst].filter(Boolean).map(esc).join(' · ')||'—'}</td></tr>`).join('')}</table></div>${show.length>60?'<div class="msg">معروض أول 60 سطر فقط.</div>':''}`;
    h+=`<div class="row" style="margin-top:8px"><button class="btn" ${cr.length+up.length?'':'disabled'} onclick="mxApply()">تأكيد الاستيراد</button><button class="btn alt" onclick="mxCancel()">إلغاء</button></div><div id="mxmsg" class="msg"></div>`;
  }
  return h+'</div>';
}
async function mxApply(){
  if(!mx)return;
  if(!navigator.onLine){alert('لازم تكون متصل بالإنترنت أثناء الاستيراد');return}
  const jobs=[];let cI=0,cG=0,uG=0;
  for(const r of mx.rows){
    if(r.action==='update'){
      const p={qty:r.qty};if(r.brand)p.brand=r.brand;if(r.model)p.model=r.model;if(r.cap){p.cap=r.cap;p.capu=r.capu}if(r.inst)p.inst=r.inst;
      const ex=assets.find(a=>a.id===r.id);if(ex)Object.assign(ex,p);
      jobs.push(()=>db.collection('assets').doc(r.id).update(p));uG++;
    }else if(r.action==='create'){
      const mk=(code,name,key)=>({code,name,type:r.type,loc:r.loc,...(r.f?{f:r.f}:{}),r:r.place,cap:r.cap||0,capu:r.capu||'',brand:r.brand,model:r.model,inst:r.inst,life:'',value:0,notes:r.notes||'',mode:r.mode,qty:r.mode==='مجموعة'?r.qty:0,qtyFix:0,qtyDead:0,impKey:key,src:'استيراد حصر الغرف'});
      if(r.mode==='مجموعة'){const code=nextCodes(r.type,1)[0],id='as_'+code,o=mk(code,r.name,r.base);assets.push({id,...o});jobs.push(()=>db.collection('assets').doc(id).set(o));cG++}
      else r.keys.forEach(({k,key})=>{const code=nextCodes(r.type,1)[0],id='as_'+code,o=mk(code,r.name+(r.qty>1?' '+(k+1):''),key);assets.push({id,...o});jobs.push(()=>db.collection('assets').doc(id).set(o));cI++});
    }
  }
  const msg=document.getElementById('mxmsg');
  window.NOLOG=true;
  try{
    for(let i=0;i<jobs.length;i+=15){await Promise.all(jobs.slice(i,i+15).map(f=>f()));if(msg)msg.textContent='جاري الحفظ… '+Math.min(i+15,jobs.length)+' من '+jobs.length}
  }catch(e){window.NOLOG=false;alert('حصل خطأ أثناء الحفظ: '+e.message+'\nأعد الاستيراد (الموجود بيتخطى تلقائياً).');return}
  window.NOLOG=false;
  mx=null;render();toast('تم الاستيراد ✓ – أصول فردية '+cI+' · مجموعات '+cG+' · تحديث '+uG);
}
