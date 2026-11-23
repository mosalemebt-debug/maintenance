/* الأولوية والمهلة */
/* ---------- الأولوية والمهلة ---------- */
const PR=['حرج','عاجل','عادي'],SLA_H={'حرج':4,'عاجل':24,'عادي':72};
const CRIT=['العمليات','الحضانة','طوارئ','غازات','الغازات','مولد','المولد','مصعد','المصعد','التعقيم'];
const autoPrio=(dept,det)=>CRIT.some(k=>((dept||'')+' '+(det||'')).includes(k))?'حرج':'عادي';
const prCls=p=>p==='حرج'?'s-bad':p==='عاجل'?'s-warn':'';
function slaInfo(n){
  const pr=n.prio||autoPrio(n.dept,n.details),h=SLA_H[pr],d=iso(n.date);
  if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d))return{pr,txt:'',cls:'',over:false};
  const m=String(n.time||'').match(/^(\d{1,2}):(\d{2})/),tm=m?m[1].padStart(2,'0')+':'+m[2]:'08:00';
  const dl=new Date(new Date(d+'T'+tm+':00').getTime()+h*36e5);
  if(n.status==='تم الإصلاح'){const f=iso(n.fixdate);if(typeof f!=='string'||!f)return{pr,txt:'',cls:'',over:false};const ok=f<=ymd(dl);return{pr,txt:ok?'ضمن المهلة':'تجاوز المهلة',cls:ok?'s-ok':'s-bad',over:false}}
  const left=dl-new Date(),a=Math.abs(left)/36e5,t=a<48?Math.round(a)+' س':Math.round(a/24)+' يوم';
  return left>=0?{pr,txt:'متبقي '+t,cls:left<h*36e5*0.25?'s-warn':'',over:false}:{pr,txt:'متأخر '+t,cls:'s-bad',over:true};
}
