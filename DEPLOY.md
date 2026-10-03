# نشر Chatter في خطوة واحدة

## Blitz Cloud / Vercel / Netlify / Cloudflare Pages

ارفع هذا المشروع كما هو، ثم اضبط:

Build command:
npm run build

Output directory:
dist

Environment variables:
VITE_SUPABASE_URL=https://cbsnomgvbtggjzkqmsoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ضع_المفتاح_هنا

ثم Deploy.

مهم:
- لا تضع Supabase Secret Key في أي VITE_*.
- لا تحتاج إلى Node.js Backend منفصل؛ Supabase هو الـBackend.
- إذا استخدمت Confirm Email في Supabase، المستخدم سيحتاج تأكيد البريد قبل الدخول.
