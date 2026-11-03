# تشغيل برنامج الصيانة على Firebase + GitHub Pages

## 1) Firebase (مرة واحدة)
1. console.firebase.google.com ← Add project (اسم مثلاً: ebtesama-maintenance، وعطّل Analytics).
2. Build ← Firestore Database ← Create database (Production mode، واختر أقرب منطقة).
3. Build ← Authentication ← Get started ← Sign-in method ← فعّل Email/Password.
4. Authentication ← Users ← Add user: ضع بريدك وكلمة مرور قوية.
5. Project settings (⚙) ← Your apps ← أيقونة </> (Web) ← سجّل التطبيق ← انسخ قيم firebaseConfig.
6. افتح firebase-config.js والصق القيم مكان PASTE_HERE.
7. Firestore ← Rules: الصق محتوى firestore.rules بعد تغيير PUT_YOUR_EMAIL_HERE لبريدك ← Publish.

## 2) GitHub Pages
1. github.com ← New repository (اسم مثلاً: maintenance، Public).
2. Add file ← Upload files: ارفع index.html و firebase-config.js (وباقي الملفات اختياري) ← Commit.
3. Settings ← Pages ← Source: Deploy from a branch ← Branch: main / (root) ← Save.
4. بعد دقيقة يظهر الرابط: https://USERNAME.github.io/maintenance/

## 3) خطوة أخيرة في Firebase
Authentication ← Settings ← Authorized domains ← Add domain: USERNAME.github.io

## 4) الاستخدام
- افتح الرابط من أي جهاز وسجّل الدخول (يفضل يفتكر الدخول).
- أول مرة: صفحة الصيانة العلاجية ← «استيراد من ملف الإكسل» وارفع ملف المتابعة.
- على الموبايل: قائمة المتصفح ← Add to Home screen.
- خد نسخة Excel احتياطية بشكل دوري من «تصدير Excel».

ملاحظة: إعدادات Firebase في firebase-config.js ليست سراً؛ الحماية من قواعد Firestore وتسجيل الدخول.

## مستخدم «مدخل بيانات» (بدون تقارير)
1. Firebase ← Authentication ← Users ← Add user: بريد وكلمة مرور لمدخل البيانات.
2. في firestore.rules ضع بريده مكان entry1@example.com (لأكثر من مدخل: ['a@x.com','b@x.com']) ثم Publish.
3. في firebase-config.js ضع بريدك في ADMIN_EMAIL.
4. هو يرى 3 صفحات فقط: مرور يومي، إخطار جديد، طلب شراء. لا يرى الإخطارات ولا الملخص ولا KPI ولا يصدّر ولا يستورد.
5. ما يدخله يصل إلى «صندوق الوارد» ويتحول لإخطارات برقم ع- تالي **عند فتحك أنت البرنامج** (لأن الترقيم يتم من جهازك). لذلك افتح البرنامج يومياً.
ملاحظة: الحماية الفعلية في قواعد Firestore، وليس في الواجهة.
