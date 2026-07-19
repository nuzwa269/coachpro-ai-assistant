import { useState } from "react";
import { Copy, Check, ImagePlus, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { getTextDir } from "@/lib/text-direction";
import { supabase } from "@/integrations/supabase/client";

type Part =
  | { type: "text"; text: string }
  | { type: "code"; lang: string; code: string; isPrompt: boolean; isImagePrompt?: boolean }
  | { type: "image"; url: string };

const FENCE_RE = /```([\w+-]*)\n?([\s\S]*?)```/g;
const IMAGE_MD_RE = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g;

// Detects a "Prompt:" style label followed by a block of text that should be
// treated as a copy-paste prompt even when the model forgets to fence it.
// Matches labels like:  Prompt:  |  Here's the prompt:  |  Copy this prompt:
const LABELED_PROMPT_RE =
  /(^|\n)\s*(?:here(?:'|’)?s\s+(?:the|your)\s+prompt|copy\s+this\s+prompt|use\s+this\s+prompt|prompt)\s*[:\-—]\s*\n+([\s\S]+?)(?=\n\s*\n\S|\n#{1,6}\s|$)/i;

function parse(content: string): Part[] {
  // First split off any generated image markdown into image parts.
  const imageUrls: string[] = [];
  const stripped = content.replace(IMAGE_MD_RE, (_m, url) => {
    imageUrls.push(url);
    return "\uE000IMG\uE000";
  });

  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(stripped)) !== null) {
    const before = stripped.slice(last, m.index);
    const lang = (m[1] || "").trim().toLowerCase();
    const code = m[2].replace(/\n$/, "");
    // detect "Prompt:" label on the trailing line before the fence
    const trailing = before.match(/(^|\n)\s*prompt\s*[:\-—]\s*\n?\s*$/i);
    let cleanBefore = before;
    const isImagePrompt = lang === "image-prompt" || lang === "imageprompt";
    let isPrompt = lang === "prompt" || isImagePrompt;
    if (trailing) {
      cleanBefore = before.slice(0, before.length - trailing[0].length);
      isPrompt = true;
    }
    if (cleanBefore.trim()) parts.push({ type: "text", text: cleanBefore.replace(/\s+$/, "") });
    parts.push({
      type: "code",
      lang: isImagePrompt ? "image-prompt" : isPrompt ? "prompt" : (lang || "code"),
      code,
      isPrompt,
      isImagePrompt,
    });
    last = m.index + m[0].length;
  }
  const tail = stripped.slice(last);
  if (tail.trim()) parts.push({ type: "text", text: tail.replace(/^\s+/, "") });
  if (parts.length === 0) parts.push({ type: "text", text: stripped });
  // Backup heuristic: within any remaining plain-text parts, if we find a
  // "Prompt:"-style label followed by a substantial block, promote it to a
  // prompt code block. Only runs on text that had no fences to avoid touching
  // already well-formatted output.
  const expanded: Part[] = [];
  for (const p of parts) {
    if (p.type !== "text") {
      expanded.push(p);
      continue;
    }
    const match = p.text.match(LABELED_PROMPT_RE);
    const captured = match?.[2]?.trim() ?? "";
    // Only treat as a prompt if it's a meaningful chunk (avoids catching
    // one-liners like "Prompt: hi").
    if (match && captured.length >= 40) {
      const start = p.text.indexOf(match[0]);
      const beforeText = p.text.slice(0, start + (match[1] ? match[1].length : 0)).replace(/\s+$/, "");
      const afterText = p.text.slice(start + match[0].length).replace(/^\s+/, "");
      if (beforeText.trim()) expanded.push({ type: "text", text: beforeText });
      expanded.push({ type: "code", lang: "prompt", code: captured, isPrompt: true });
      if (afterText.trim()) expanded.push({ type: "text", text: afterText });
    } else {
      expanded.push(p);
    }
  }
  // Replace image placeholders with image parts.
  const final: Part[] = [];
  let imgIdx = 0;
  for (const p of expanded) {
    if (p.type !== "text") {
      final.push(p);
      continue;
    }
    const segments = p.text.split("\uE000IMG\uE000");
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].trim()) final.push({ type: "text", text: segments[i] });
      if (i < segments.length - 1 && imgIdx < imageUrls.length) {
        final.push({ type: "image", url: imageUrls[imgIdx++] });
      }
    }
  }
  while (imgIdx < imageUrls.length) {
    final.push({ type: "image", url: imageUrls[imgIdx++] });
  }
  return final;
}

function CodeBlock({
  lang,
  code,
  isPrompt,
  isImagePrompt,
  canGenerate,
  generating,
  onGenerate,
  imageCost,
}: {
  lang: string;
  code: string;
  isPrompt: boolean;
  isImagePrompt?: boolean;
  canGenerate?: boolean;
  generating?: boolean;
  onGenerate?: () => void;
  imageCost?: number;
}) {
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
  const label = isImagePrompt ? "Image prompt" : isPrompt ? "Prompt" : lang;
  return (
    <div
      className="my-2 overflow-hidden rounded-lg border border-border bg-card"
      dir="ltr"
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {isImagePrompt && canGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary transition-colors hover:bg-background disabled:opacity-60"
              type="button"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Generate image ({imageCost ?? 15} cr)</span>
                </>
              )}
            </button>
          )}
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

function GeneratedImage({ url }: { url: string }) {
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-card" dir="ltr">
      <img src={url} alt="Generated" className="block max-h-[520px] w-full object-contain" loading="lazy" />
      <div className="flex items-center justify-between border-t border-border bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          Generated image
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-background hover:text-primary"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
}

export function AssistantMessage({
  content,
  messageId,
  imageEnabled,
  imageCost,
  onImageGenerated,
}: {
  content: string;
  messageId?: string;
  imageEnabled?: boolean;
  imageCost?: number;
  onImageGenerated?: (newContent: string) => void;
}) {
  const parts = parse(content);
  const [generating, setGenerating] = useState(false);
  const hasImage = parts.some((p) => p.type === "image");
  const canGenerate = !!(imageEnabled && messageId && !hasImage && onImageGenerated);

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    const cost = imageCost ?? 15;
    if (!confirm(`Generate image for ${cost} credits?`)) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-message-image", {
        body: { message_id: messageId },
      });
      if (error) throw error;
      const d = data as { new_content?: string; error?: string };
      if (d?.error) throw new Error(d.error);
      if (d?.new_content && onImageGenerated) {
        onImageGenerated(d.new_content);
        toast.success("Image generated");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate image";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-1">
      {parts.map((p, i) =>
        p.type === "image" ? (
          <GeneratedImage key={i} url={p.url} />
        ) : p.type === "code" ? (
          <CodeBlock
            key={i}
            lang={p.lang}
            code={p.code}
            isPrompt={p.isPrompt}
            isImagePrompt={p.isImagePrompt}
            canGenerate={p.isImagePrompt && canGenerate}
            generating={generating}
            onGenerate={handleGenerate}
            imageCost={imageCost}
          />
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