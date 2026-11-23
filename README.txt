هيكل البرنامج
=============
index.html        الصفحة الأساسية (هيكل فقط + ترتيب تحميل الملفات)
style.css         كل التنسيقات
sw.js             التشغيل بدون إنترنت (لو أضفت ملف جديد ضيفه في قائمة PRE وغيّر رقم النسخة V)
firebase-config.js, firestore.rules, manifest.webmanifest, icon-*.png   زي ما هم

js/ (بترتيب التحميل — الترتيب مهم)
  firebase-layer.js  الربط مع Firebase وتسجيل الدخول
  core.js            الثوابت والحالة العامة والدوال المساعدة
  app.js             init / nav / render
  round.js           المرور اليومي
  notices.js         الصيانة العلاجية
  purchases.js       طلبات الشراء + اعتماد المالية
  reports.js         التقارير
  edit.js            تعديل / حذف
  daily-report.js    تقرير متابعة الأعمال اليومي
  sla.js             الأولوية والمهلة
  backup.js          النسخ الاحتياطي
  pr-form.js         نموذج PR وترقيمه
  inbox.js           صندوق الوارد وواجهة مدخل البيانات
  audit.js           سجل التعديلات
  assets-*.js        الأصول (الأساس / المواقع / اللوحة / العمليات / السجل)
  xlsx-template.js   قالب Excel المضمّن
  assets-import.js   استيراد الأصول والمخزن
  stock.js           المخزن
  print.js           طباعة الإخطار
  jobsheets.js       JobSheet
  inputs.js          الأرقام العربية وحقول التاريخ
  sync.js            المزامنة
  boot.js            بدء التشغيل (لازم يكون آخر ملف)
