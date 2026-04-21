// Detect whether a string should be rendered RTL (Urdu, Arabic, Persian, Hebrew, etc.)
// Strategy: count strong RTL vs strong LTR letters in the first ~200 chars.
// If RTL letters dominate (or are present and no LTR letters appear), use RTL.
const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const LTR_RE = /[A-Za-z\u00C0-\u024F]/g;

export function getTextDir(text: string | null | undefined): "rtl" | "ltr" {
  if (!text) return "ltr";
  const sample = text.slice(0, 200);
  const rtl = (sample.match(RTL_RE) || []).length;
  const ltr = (sample.match(LTR_RE) || []).length;
  if (rtl === 0) return "ltr";
  if (ltr === 0) return "rtl";
  // Mixed: pick whichever script is dominant.
  return rtl >= ltr ? "rtl" : "ltr";
}
