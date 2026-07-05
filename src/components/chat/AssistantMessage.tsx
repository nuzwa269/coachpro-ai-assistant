import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { getTextDir } from "@/lib/text-direction";

type Part =
  | { type: "text"; text: string }
  | { type: "code"; lang: string; code: string; isPrompt: boolean };

const FENCE_RE = /```([\w+-]*)\n?([\s\S]*?)```/g;

function parse(content: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(content)) !== null) {
    const before = content.slice(last, m.index);
    const lang = (m[1] || "").trim().toLowerCase();
    const code = m[2].replace(/\n$/, "");
    // detect "Prompt:" label on the trailing line before the fence
    const trailing = before.match(/(^|\n)\s*prompt\s*[:\-—]\s*\n?\s*$/i);
    let cleanBefore = before;
    let isPrompt = lang === "prompt";
    if (trailing) {
      cleanBefore = before.slice(0, before.length - trailing[0].length);
      isPrompt = true;
    }
    if (cleanBefore.trim()) parts.push({ type: "text", text: cleanBefore.replace(/\s+$/, "") });
    parts.push({ type: "code", lang: isPrompt ? "prompt" : (lang || "code"), code, isPrompt });
    last = m.index + m[0].length;
  }
  const tail = content.slice(last);
  if (tail.trim()) parts.push({ type: "text", text: tail.replace(/^\s+/, "") });
  if (parts.length === 0) parts.push({ type: "text", text: content });
  return parts;
}

function CodeBlock({ lang, code, isPrompt }: { lang: string; code: string; isPrompt: boolean }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(isPrompt ? "Prompt copied" : "Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };
  const label = isPrompt ? "Prompt" : lang;
  return (
    <div
      className="my-2 overflow-hidden rounded-lg border border-border bg-card"
      dir="ltr"
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-primary"
          aria-label={isPrompt ? "Copy prompt" : "Copy code"}
          type="button"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre
        className={`m-0 overflow-x-auto p-3 font-mono text-xs leading-relaxed text-foreground ${
          isPrompt ? "whitespace-pre-wrap" : "whitespace-pre"
        }`}
        dir="ltr"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function AssistantMessage({ content }: { content: string }) {
  const parts = parse(content);
  return (
    <div className="space-y-1">
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} lang={p.lang} code={p.code} isPrompt={p.isPrompt} />
        ) : (
          <p
            key={i}
            className="whitespace-pre-wrap"
            dir={getTextDir(p.text)}
            style={{ textAlign: getTextDir(p.text) === "rtl" ? "right" : "left" }}
          >
            {p.text}
          </p>
        ),
      )}
    </div>
  );
}

export default AssistantMessage;