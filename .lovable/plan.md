## مقصد

جب AI اسسٹنٹ کوئی جواب دے تو اس میں موجود **کوڈ بلاکس** اور **پرومپٹ بلاکس** (markdown code fences) کو باقی متن سے الگ ایک نمایاں باکس میں دکھایا جائے، ہر باکس کے اوپر "Copy" بٹن ہو۔ باقی وضاحت/ہدایات معمول کے مطابق چیٹ بلبل میں دکھائی جائیں۔

## زبان و سمت (اہم)

- **کوڈ اور پرومپٹ بلاک ہمیشہ انگلش/LTR** میں رینڈر ہوں گے: `dir="ltr"`, `text-align: left`, monospace فونٹ — چاہے باقی پیغام اردو میں ہو۔
- **باقی وضاحتی متن** پہلے کی طرح `getTextDir()` سے خودکار RTL/LTR سمت میں دکھایا جائے گا (اردو → RTL، انگلش → LTR)۔

## کیا بنے گا

1. نیا کمپوننٹ `src/components/chat/AssistantMessage.tsx`:
   - `content` کو حصوں میں پارس کرے گا:
     - عام متن (پیراگراف/ہدایات) — RTL/LTR auto
     - fenced code blocks: <code>```lang\n...\n```</code> — ہمیشہ LTR
   - Regex: ` ```(\w+)?\n([\s\S]*?)``` `
   - اگر language `prompt` ہو یا بلاک سے پہلے کی لائن `/^\s*prompt\s*[:\-—]/i` سے میچ کرے تو badge پر "Prompt"، ورنہ language name (یا "code")۔
   - ہر code/prompt بلاک الگ باکس میں:
     - ہیڈر: بائیں language/Prompt badge، دائیں "Copy" بٹن (کلک پر صرف اس بلاک کا مواد کاپی، 1.5s کے لیے "Copied")
     - باڈی: `bg-card`/`border-border`، monospace، `dir="ltr"`, `text-left`, horizontal scroll، `whitespace-pre` (کوڈ) یا `whitespace-pre-wrap` (prompt)
   - عام متن `<p>` میں direction detection کے ساتھ رینڈر ہو گا۔

2. `src/pages/ProjectWorkspace.tsx` میں:
   - assistant پیغام کی موجودہ `<p className="whitespace-pre-wrap">…</p>` کو `<AssistantMessage content={m.content} />` سے بدلا جائے۔
   - user پیغام سادہ ٹیکسٹ ہی رہے گا۔
   - پوری بلبل کے اوپر موجود "Copy" اور "Save" بٹن برقرار۔

3. `src/pages/SavedResponses.tsx` میں بھی assistant متن کی جگہ وہی کمپوننٹ استعمال ہو گا (فائل چیک کر کے صرف assistant رینڈرنگ کی جگہ)۔

## نان‑گول

- Markdown کے دیگر عناصر (bold, headings, لسٹس) کی مکمل رینڈرنگ شامل نہیں۔
- Syntax highlighting شامل نہیں (bundle چھوٹا رکھنے کے لیے)۔
- backend/AI فنکشن میں کوئی تبدیلی نہیں۔

## توثیق

- اردو میں ایک assistant سے کوڈ کی درخواست کر کے دیکھیں گے کہ:
  - وضاحت اردو/RTL میں،
  - کوڈ الگ باکس میں انگلش/LTR اور monospace،
  - "Copy" بٹن سے صرف کوڈ کاپی ہوتا ہے۔
