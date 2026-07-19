## مقصد
جب بھی کوئی اسسٹنٹ چیٹ میں کوئی "پرومپٹ" (یعنی ایسا متن جو یوزر نے کاپی کر کے کسی اور AI ٹول میں پیسٹ کرنا ہے) دے، وہ ہمیشہ ایک الگ code block میں Copy بٹن کے ساتھ دکھائی دے۔

## طریقہ کار: Global (ہر اسسٹنٹ پر خودکار)
ہدایت manually ہر اسسٹنٹ کو دینے کے بجائے edge function میں ایک بار شامل کی جائے گی — تمام موجودہ اور مستقبل کے assistants پر خودکار لاگو ہو گی۔

## موجودہ صورتحال
`src/components/chat/AssistantMessage.tsx` پہلے سے fenced code blocks (` ```prompt … ``` `) اور "Prompt:" لیبل کو detect کر کے Copy بٹن والا بلاک رینڈر کرتا ہے۔ صرف مسئلہ یہ ہے کہ ماڈل ہمیشہ یہ format استعمال نہیں کرتا۔

## تبدیلیاں

### 1) `supabase/functions/chat-ai/index.ts` — Global formatting rule
`buildPayload` میں اسسٹنٹ کے اپنے `system_prompt` کے **بعد** ایک اضافی system message شامل کیا جائے گا:

> "Formatting rule: Whenever you provide a ready-to-use prompt that the user is expected to copy and paste into another AI tool, output ONLY the prompt inside a fenced code block tagged `prompt` (```` ```prompt ... ``` ````). Put any explanation before or after the block, never inside it. Short conversational replies do not need this."

- Assistant کے اپنے system prompt کو overwrite نہیں کرے گا — ساتھ append ہو گا۔
- تمام assistants پر خودکار لاگو۔ نئے assistants بھی بغیر config کے follow کریں گے۔

### 2) `src/components/chat/AssistantMessage.tsx` — Parser بہتری (backup)
اگر کبھی ماڈل fence بھول جائے مگر "Prompt:" / "Here's the prompt:" / "Copy this prompt:" جیسا واضح لیبل ہو اور اس کے بعد ایک لمبا paragraph ہو، تو اسے بھی خودکار طور پر `prompt` code block کے طور پر render کیا جائے۔ باقی موجودہ logic میں کوئی تبدیلی نہیں۔

## کیا نہیں بدلے گا
- کسی بھی assistant کا DB والا `system_prompt`
- Credits, models, RLS, conversations, layout
- User messages کی rendering
- موجودہ code blocks کا رویہ

## متاثر فائلیں
1. `supabase/functions/chat-ai/index.ts`
2. `src/components/chat/AssistantMessage.tsx`

## تصدیق
- نئی چیٹ میں کسی بھی assistant سے پرومپٹ منگوا کر دیکھنا کہ Copy بٹن کے ساتھ code block میں آئے۔
- پرانی چیٹس بھی درست دکھیں (client heuristic کی وجہ سے)۔
