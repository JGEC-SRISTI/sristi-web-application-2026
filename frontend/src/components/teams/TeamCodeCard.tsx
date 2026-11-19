import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function TeamCodeCard({ code, label }: { code: string; label: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1600);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#181a22] px-3.5 py-3 text-left sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-space-mono text-[9px] uppercase tracking-widest text-white/55">{label}</p>
          <p className="mt-1 select-all wrap-anywhere font-space-mono text-lg tracking-[0.2em] text-white">{code}</p>
        </div>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-teal-300/25 bg-teal-400/10 px-2.5 py-2 font-space-mono text-[9px] uppercase tracking-wider text-teal-200 transition-colors hover:bg-teal-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 sm:px-3"
        >
          {copyStatus === "copied" ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          <span aria-live="polite">{copyStatus === "copied" ? "Copied" : "Copy"}</span>
        </button>
      </div>
      {copyStatus === "failed" && (
        <p role="alert" className="mt-2 text-xs text-red-200">Could not copy the code. You can select it to copy manually.</p>
      )}
    </div>
  );
}
