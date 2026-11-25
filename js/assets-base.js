/* التخصصات والتكاليف وأنواع الأصول */
/* ---------- التخصصات والتكاليف ---------- */
const TRD=['كهرباء','سباكة','تكييف','نجارة','نقاشة','ألومنيوم','مدني','أخرى'],TRALL=[...TRD,'غير مصنف'];
const TRMAP={'كهرباء':'كهرباء','سباكة':'سباكة','نجارة':'نجارة','نقاشة':'نقاشة','ألومنيوم':'ألومنيوم','شاشة':'أخرى','التكييف':'تكييف'};
const TRRX=[['تكييف',/تكييف|تكيف|فريون|كمبروسر/],['كهرباء',/كهرب|كشاف|لمب|قاطع|فيشة|مفتاح|ترانس|جرس|تيار|ماس/],['سباكة',/سباك|مياه|سيفون|صرف|دش|حنفي|تسريب|غسال/],['نجارة',/باب|كالون|مفصل|نجار|دولاب|سرير/],['نقاشة',/دهان|نقاش|بوية|طلاء/],['ألومنيوم',/ألومنيوم|المونيوم|ألمونيوم/],['مدني',/فينيل|أرضي|بلاط|سيراميك|حائط|سقف|مدني/]];
function tradeOf(n){if(n.trade)return n.trade;if(TRMAP[n.cat])return TRMAP[n.cat];const t=(n.dept||'')+' '+(n.details||'');for(const [k,r] of TRRX)if(r.test(t))return k;return 'غير مصنف'}
const partsCost=ref=>purchases.filter(p=>p.ref===ref&&p.status!=='صرف من المخزن').reduce((a,p)=>a+(+p.price||0)*(+p.qty||0),0);
const noticeCost=n=>(+n.cost||0)+partsCost(n.ref);
const money=v=>(Math.round((+v||0)*100)/100).toLocaleString('en-US');
/* ---------- سجل الأصول ---------- */
const ATY=['تكييف','مولد','لوحة كهرباء','موتور مياه','مصعد','محطة غازات','غسالة / مجفف / مكواة','غسالة','مجفف','مكواة','سخان مياه','نظام نداء ممرضات','نظام إنذار حريق','UPS','ثلاجة','تلفزيون','شفاط','مخرج غاز طبي','حضانة أطفال','باب','شباك','حوض','قاعدة','دش','خلاط','كشاف','كرسي','كنب','سرير','دولاب','مكتب','ترابيزة','ستارة','أخرى'],CAPU=['حصان','BTU','طن تبريد','kVA','كيلووات','كجم','لتر','أمبير'];
const AF=()=>[['code','الكود','text'],['name','الاسم / الطراز','text'],['type','النوع','select',['',...ATY]],['mode','طريقة التسجيل','select',['فردي','مجموعة']],['qty','العدد الكلي (للمجموعة)','number'],['qtyFix','منها يحتاج إصلاح (للمجموعة)','number'],['qtyDead','منها تالف (للمجموعة)','number'],['cap','القدرة','number'],['capu','وحدة القدرة','select',['',...CAPU]],['f','الدور','select',['',...new Set(locRows().map(r=>r.f))]],['sec','القسم (فاضي = حسب النوع)','select',['','هندسي','تجهيزات']],['loc','الموقع','text'],['value','قيمة استبدال الوحدة التقريبية (ج.م)','number'],['brand','الماركة','text'],['model','الموديل / الشكل','text'],['inst','سنة التركيب','number'],['life','العمر الافتراضي (سنة)','number'],['notes','ملاحظات','area']];
/* ---------- نظام الأصول المكوّدة: الحالة والقرار والربط بالصيانة العلاجية ---------- */
const LIFE={'تكييف':12,'مولد':25,'لوحة كهرباء':25,'موتور مياه':10,'مصعد':25,'محطة غازات':20,'غسالة / مجفف / مكواة':10,'غسالة':10,'مجفف':10,'مكواة':10,'سخان مياه':8,'نظام نداء ممرضات':12,'نظام إنذار حريق':12,'UPS':7,'ثلاجة':12,'تلفزيون':8,'شفاط':8,'مخرج غاز طبي':20,'حضانة أطفال':12,'باب':20,'شباك':20,'حوض':15,'قاعدة':20,'دش':15,'خلاط':8,'كشاف':8,'كرسي':8,'كنب':10,'سرير':12,'دولاب':15,'مكتب':15,'ترابيزة':10,'ستارة':6,'أخرى':10};
const PFX={'تكييف':'AC','مولد':'GEN','لوحة كهرباء':'EP','موتور مياه':'PUMP','مصعد':'LIFT','محطة غازات':'GAS','غسالة / مجفف / مكواة':'WSH','غسالة':'WM','مجفف':'DRY','مكواة':'IRN','سخان مياه':'WH','نظام نداء ممرضات':'NC','نظام إنذار حريق':'FA','UPS':'UPS','ثلاجة':'FR','تلفزيون':'TV','شفاط':'EF','مخرج غاز طبي':'MG','حضانة أطفال':'INC','باب':'DR','شباك':'WN','حوض':'SK','قاعدة':'TL','دش':'SH','خلاط':'FX','كشاف':'LT','كرسي':'CH','كنب':'SF','سرير':'BD','دولاب':'CB','مكتب':'DK','ترابيزة':'TB','ستارة':'CT','أخرى':'OT'};
const TYPE_TRADE={'تكييف':'تكييف','مولد':'كهرباء','لوحة كهرباء':'كهرباء','موتور مياه':'سباكة','سخان مياه':'سباكة','نظام نداء ممرضات':'كهرباء','نظام إنذار حريق':'كهرباء','UPS':'كهرباء','شفاط':'كهرباء','كشاف':'كهرباء','باب':'نجارة','دولاب':'نجارة','مكتب':'نجارة','ترابيزة':'نجارة','شباك':'ألومنيوم','حوض':'سباكة','قاعدة':'سباكة','دش':'سباكة','خلاط':'سباكة'};
const DECS=['إبقاء في الخدمة','مراقبة','استبدال','تكهين'];
/* أصل فردي (كود لكل قطعة) أو مجموعة (كود واحد لعدد من القطع المتشابهة) */
const GRP_TYPES=['شباك','حوض','قاعدة','دش','خلاط','كشاف','كرسي','كنب','سرير','دولاب','مكتب','ترابيزة','ستارة'];
const isGrp=a=>!!a&&a.mode==='مجموعة';
const totVal=a=>(+a.value||0)*(isGrp(a)?(+a.qty||1):1);
const thisYear=()=>new Date().getFullYear();
const sameCode=(x,y)=>String(x||'').trim().toLowerCase()===String(y||'').trim().toLowerCase();
const assetByCode=c=>assets.find(a=>sameCode(a.code,c));
/* ---------- أنواع ووحدات قدرة يضيفها المستخدم ---------- */
function applyAssetLists(){
  const c=settings.assetLists||{};
  (c.types||[]).forEach(t=>{
    if(!t||!t.name||ATY.includes(t.name))return;
    const i=ATY.indexOf('أخرى');ATY.splice(i<0?ATY.length:i,0,t.name);
    PFX[t.name]=t.pfx;LIFE[t.name]=+t.life||10;
    if(t.trade)TYPE_TRADE[t.name]=t.trade;
    if(t.grp&&!GRP_TYPES.includes(t.name))GRP_TYPES.push(t.name);
  });
  (c.units||[]).forEach(u=>{if(u&&!CAPU.includes(u))CAPU.push(u)});
}
function dropFromLists(name){
  const i=ATY.indexOf(name);if(i>=0)ATY.splice(i,1);
  delete PFX[name];delete LIFE[name];delete TYPE_TRADE[name];
  const g=GRP_TYPES.indexOf(name);if(g>=0)GRP_TYPES.splice(g,1);
}
async function addAssetType(){
  const name=$('#as_xn').value.trim(),pfx=$('#as_xp').value.trim().toUpperCase();
  if(!name){alert('اكتب اسم النوع');return}
  if(ATY.includes(name)){alert('النوع «'+name+'» موجود بالفعل');return}
  if(!/^[A-Z]{2,5}$/.test(pfx)){alert('بادئة الكود لازم تكون من 2 إلى 5 حروف إنجليزية، مثال: PMP');return}
  if(Object.values(PFX).includes(pfx)){alert('البادئة '+pfx+' مستخدمة لنوع تاني، اختار غيرها');return}
  const t={name,pfx,life:+$('#as_xl').value||10,grp:$('#as_xg').value==='مجموعة',trade:$('#as_xt').value};
  await saveSet('assetLists',{types:[...((settings.assetLists||{}).types||[]),t]});
  applyAssetLists();
  ['#as_xn','#as_xp','#as_xl'].forEach(i=>$(i).value='');
  toast('اتضاف النوع «'+name+'» ✓');render();
}
async function delAssetType(i){
  const types=[...((settings.assetLists||{}).types||[])],t=types[i];if(!t)return;
  if(assets.some(a=>a.type===t.name)){alert('فيه أصول مسجلة بالنوع «'+t.name+'»، غيّر نوعها الأول وبعدين احذفه.');return}
  if(!confirm('حذف النوع «'+t.name+'»؟'))return;
  types.splice(i,1);dropFromLists(t.name);
  await saveSet('assetLists',{types});render();
}
async function addCapUnit(){
  const u=$('#as_xu').value.trim();
  if(!u){alert('اكتب وحدة القدرة');return}
  if(CAPU.includes(u)){alert('الوحدة «'+u+'» موجودة بالفعل');return}
  await saveSet('assetLists',{units:[...((settings.assetLists||{}).units||[]),u]});
  applyAssetLists();$('#as_xu').value='';toast('اتضافت الوحدة «'+u+'» ✓');render();
}
async function delCapUnit(i){
  const units=[...((settings.assetLists||{}).units||[])],u=units[i];if(!u)return;
  if(assets.some(a=>a.capu===u)){alert('فيه أصول قدرتها بالوحدة «'+u+'»، غيّرها الأول وبعدين احذفها.');return}
  if(!confirm('حذف الوحدة «'+u+'»؟'))return;
  units.splice(i,1);const k=CAPU.indexOf(u);if(k>=0)CAPU.splice(k,1);
  await saveSet('assetLists',{units});render();
}
