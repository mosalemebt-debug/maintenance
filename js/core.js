/* الثوابت والحالة العامة والدوال المساعدة */
const CATS=['كهرباء','سباكة','نجارة','نقاشة','ألومنيوم','شاشة','التكييف'];
const AREAS=[["الدور الثاني",["غرفة 201","غرفة 202","غرفة 203","غرفة 204","غرفة 205","غرفة 206","غرفة 207","غرفة 208","غرفة 209","غرفة 210","الحضانة","غرفة النفايات – الدور الثاني","الكافتيريا","العمليات","مخزن أدوية فرعي – الدور الثاني"]],
["الدور الأول",["عيادة 1","عيادة 2","عيادة 3","عيادة 4","عيادة 5","غرفة الدعم الطبي","حمام رجالي – الدور الأول","حمام حريمي – الدور الأول","غرفة 100 (حسابات المرضى)","غرفة 101 (استراحة د. الأطفال)","غرفة 102","غرفة 103","غرفة 104 (نائب د. النساء)","غرفة 105","غرفة 106","غرفة 107 (مخزن)","غرفة 108 (مخزن الفندقة)","مكتب مديرة الفندقة","مخزن أدوية رئيسي"]],
["الدور الأرضي",["الريسيبشن","مكتب مدير المستشفى","الخزن","غرفة طوارئ","غرفة IT","معمل التحليل","معمل الذكورة","التعقيم","الصيدلية","المطبخ","المغسلة","حمام رجالي – الأرضي","حمام حريمي – الأرضي"]]];
const ALL=AREAS.flatMap(([f,l])=>l.map(a=>({f,a})));
const ST=['تم الإصلاح','غير قابل للإصلاح'];const LEGST=['تم جزئياً','إصلاح مؤقت','جاري التنفيذ','لم يتم الإصلاح'];const normN=o=>(LEGST.includes(o.status)?{...o,status:''}:o);
const FST=['تم الطلب','تم اكتمال الاعتمادات','تمت الموافقة والتوريد','لم يتم الموافقة'];const FLATE=3;
const PST=['لم يُطلب','جاري إعداد الطلب','تم الطلب','تم الشراء/التوريد','صرف من المخزن','تم التركيب'];
const stCls=s=>s==='تم الإصلاح'?'s-ok':s==='غير قابل للإصلاح'?'s-bad':'s-warn';
let db=null,notices=[],purchases=[],rounds={},tab='daily',assetLog=[],jobsheets=[],assets=[],stock=[],settings={},auditLog=[],rdate=ymd(new Date());
const $=s=>document.querySelector(s);
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function goDay(v){const d=getDraft();if(d.dirty&&!confirm('فيه تعديلات غير محفوظة في المرور الحالي. تتجاهلها؟'))return render();draft=null;rdate=v;render()}
function shiftDay(n){const d=new Date(rdate+'T12:00:00');d.setDate(d.getDate()+n);goDay(ymd(d))}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=r=>parseInt(String(r).replace(/\D/g,''))||0;
const ref=n=>'ع-'+String(n).padStart(2,'0');
const fd=v=>{if(!v)return'';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('en-GB')};
const toD=v=>{if(!v)return'';if(v instanceof Date)return v;const sv=String(v).trim().replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));const m=sv.match(/^(\d{1,2})\D(\d{1,2})\D(\d{4})$/);if(m)return new Date(Date.UTC(+m[3],m[2]-1,+m[1]));const d=new Date(v);return isNaN(d)?String(v):d};
const iso=v=>{const d=toD(v);return d instanceof Date?d.toISOString().slice(0,10):d};

