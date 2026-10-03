# Chatter — Simple Supabase Edition

نسخة مبسطة جدًا من Chatter:
- تسجيل حساب بالبريد الإلكتروني + كلمة السر فقط
- تسجيل الدخول بالبريد الإلكتروني + كلمة السر فقط
- بعد الدخول: المحادثة العامة مباشرة
- رسائل فورية عبر Supabase Realtime
- Supabase Auth + PostgreSQL + RLS
- Frontend: Vite

## 1) Supabase
في Supabase > SQL Editor شغّل:
`supabase/schema.sql`

إذا كنت قد شغلت Schema قديمًا، هذه النسخة تستخدم جداول `profiles` و`messages` فقط. لا تشغّلها فوق بيئة إنتاج تحتوي على بيانات مهمة بدون مراجعة.

## 2) Environment Variables
انسخ `.env.example` إلى `.env.local` وضع:

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

استخدم Publishable Key فقط في الواجهة. لا تضع Secret Key في VITE_*.

## 3) تشغيل
npm install
npm run dev

## 4) Build
npm run build

الناتج في `dist/`.

## 5) نشر
أي منصة تدعم Vite/Node build تصلح.
Build command:
`npm run build`

Output directory:
`dist`

Environment Variables:
`VITE_SUPABASE_URL`
`VITE_SUPABASE_PUBLISHABLE_KEY`

## 6) Supabase Email confirmation
للتجربة السريعة يمكنك تعطيل Confirm email من:
Authentication > Providers > Email
إذا أردت أن يدخل المستخدم مباشرة بعد التسجيل.
للإنتاج، يفضّل إبقاؤه مفعّلًا وإعداد SMTP/إعدادات البريد المناسبة.
