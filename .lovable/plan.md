## Forgot Password فیچر

Supabase auth کا built-in password recovery استعمال کریں گے۔ یوزر ای میل دے گا → ایک reset لنک اسی ای میل پر جائے گا → لنک پر کلک کرکے نیا پاس ورڈ سیٹ کرے گا۔

### فلو
1. Login پیج پر "Forgot password?" لنک → `/forgot-password` پر لے جائے گا۔
2. `/forgot-password` — ای میل انپٹ + Send reset link بٹن۔ `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${window.location.origin}/reset-password })` کال ہوگا۔ کامیابی پر: "Check your inbox" پیغام۔
3. یوزر ای میل میں لنک کھولے → app `/reset-password` پر آئے گا۔ Supabase URL hash میں recovery token دے گا اور خودکار session بنائے گا (event: `PASSWORD_RECOVERY`)۔
4. `/reset-password` — نیا پاس ورڈ + تصدیق فیلڈز۔ `supabase.auth.updateUser({ password })` کال ہوگا۔ کامیابی پر toast + `/dashboard` پر ری ڈائریکٹ۔

### فائلیں
- **New:** `src/pages/ForgotPassword.tsx` — ای میل فارم، loading state، success state۔
- **New:** `src/pages/ResetPassword.tsx` — دو پاس ورڈ فیلڈز (نیا + confirm)، minimum 6 chars validation، match check۔ Public route (auth کے بغیر قابلِ رسائی کیونکہ recovery session خود Supabase بناتا ہے)۔
- **Edit:** `src/App.tsx` — دونوں routes register کریں (public)۔
- **Edit:** `src/pages/Login.tsx` — password فیلڈ کے نیچے "Forgot password?" لنک۔

### ای میلز
Lovable Cloud خودکار طور پر default recovery ای میل بھیجے گا — کوئی extra setup درکار نہیں۔ اگر بعد میں custom branded ای میل چاہیے تو الگ سے auth email templates scaffold کیے جا سکتے ہیں (اس plan میں شامل نہیں)۔

### ڈیزائن
موجودہ Login/Signup پیجز کا ہی layout، colors (orange/purple)، Poppins/Inter فونٹس استعمال ہوں گے تاکہ consistency رہے۔
