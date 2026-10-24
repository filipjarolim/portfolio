"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { confirm, copyText } from "@/lib/haptic";

export function CopyControl({
  value,
  label = "Copy",
  done = "Copied",
  className,
}: {
  value: string;
  label?: string;
  done?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyText(value);
    if (!ok) return;
    confirm();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      className={`copy-sheen ${copied ? "is-copied" : ""} ${className ?? ""}`}
      aria-live="polite"
      onClick={copy}
    >
      <CopyLabel copied={copied} label={label} done={done} />
    </button>
  );
}

export function CopyLabel({
  copied,
  label,
  done = "Copied",
}: {
  copied: boolean;
  label: string;
  done?: string;
}) {
  const probe = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const node = probe.current;
    if (!node) return;
    setWidth(Math.ceil(node.getBoundingClientRect().width));
  }, [copied, label, done]);

  return (
    <span className="copy-slot" style={width == null ? undefined : { width }}>
      <span ref={probe} className="copy-probe">
        <span>{copied ? done : label}</span>
        <svg className={copied ? "check is-on" : "check"} viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.2 6.4 4.7 9 9.8 3.2" />
        </svg>
      </span>
    </span>
  );
}
