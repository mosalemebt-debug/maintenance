/* الاتصال والمزامنة وتسجيل الـService Worker */
/* ---------- الاتصال والمزامنة ---------- */
function syncUI(){
  const e=document.getElementById('net');if(!e)return;
  const off=!navigator.onLine,p=window._pend||0;
  let t;
  if(off)t='🔴 غير متصل – شغلك بيتحفظ على الجهاز'+(p?' ('+p+' بانتظار الرفع)':'');
  else if(p)t='🟡 جاري رفع '+p+' تغيير...';
  else if(window._fcAll)t='🟡 جاري الاتصال بالخادم...';
  else t='🟢 متصل ومتزامن';
  e.textContent=t;
  if((window._lastP||0)>0&&p===0&&!off)toast('تمت مزامنة كل التغييرات ✓');
  window._lastP=p;
}
window.syncUI=syncUI;
window.syncFail=e=>toast('تعذر حفظ تغيير على الخادم'+(e&&e.code?' ('+e.code+')':''));
window.addEventListener('online',()=>{toast('رجع الإنترنت – جاري رفع التغييرات');syncUI()});
window.addEventListener('offline',()=>{toast('الإنترنت قطع – كمّل شغلك وهيتحفظ على الجهاز');syncUI()});
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
