/* بدء التشغيل */
/* مكتبات التصدير والطباعة (Excel / PDF) بتتحمل بعد ظهور الشاشة مش قبلها */
function loadLibs(){['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'].forEach(u=>{const s=document.createElement('script');s.src=u;s.async=true;document.head.appendChild(s)})}
init();
setTimeout(loadLibs,300);
