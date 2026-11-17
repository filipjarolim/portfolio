"use client";

import { useEffect, useState } from "react";
import { tap } from "@/lib/haptic";

export type CodePiece = { name: string; line: string };

export type CodeNote = {
  slug: string;
  title: string;
  tags: string;
  links: readonly string[];
  line: string;
};

const TERM = "#10141a";
const TERM_FG = "#e7eef6";
const TERM_DIM = "#8b97a8";
const TERM_CYAN = "#67e8f9";

function edges(points: { note: CodeNote; x: number; y: number }[]) {
  const bySlug = new Map(points.map((point) => [point.note.slug, point]));
  const seen = new Set<string>();
  const lines: { from: string; to: string; x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const point of points) {
    for (const link of point.note.links) {
      const other = bySlug.get(link);
      if (!other) continue;
      const key = [point.note.slug, link].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push({ from: point.note.slug, to: link, x1: point.x, y1: point.y, x2: other.x, y2: other.y });
    }
  }
  return lines;
}

function place(index: number, count: number) {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
  return {
    x: 200 + Math.cos(angle) * 122,
    y: 128 + Math.sin(angle) * 78,
  };
}

export function CodeStage({
  title,
  summary,
  pieces,
  command,
  runtime,
  notes,
  sources,
  index,
  total,
}: {
  title: string;
  summary: string;
  pieces: readonly CodePiece[];
  command: string | null;
  runtime: string | null;
  notes: readonly CodeNote[];
  sources: { label: string; href: string }[];
  index: number;
  total: number;
}) {
  const [open, setOpen] = useState(notes[0]?.slug ?? "");
  const [typed, setTyped] = useState(command?.length ?? 0);
  const active = notes.find((note) => note.slug === open) ?? notes[0] ?? null;

  useEffect(() => {
    if (!command) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(command.length);
      return;
    }
    setTyped(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setTyped(count);
      if (count >= command.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [command]);

  const ran = !command || typed >= command.length;

  if (notes.length === 0) {
    return (
      <article
        className="flex h-full min-h-0 flex-col border border-black bg-white"
        style={{ transform: "translate3d(0, calc((1 - var(--engage, 1)) * 0.75rem), 0)" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black px-4 py-3 sm:px-5">
          <p className="font-mono text-[11px] tracking-[0.16em]">CODE</p>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            {String(index).padStart(2, "0")}
            <span className="px-1">/</span>
            {String(total).padStart(2, "0")}
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6">
          <h3 className="text-[clamp(1.7rem,4vw,2.6rem)] font-bold leading-none tracking-[-0.045em]">{title}</h3>
          <p className="mt-4 max-w-xl text-base leading-7">{summary}</p>
          {command ? (
            <p className="mt-6 max-w-xl border border-black bg-black px-4 py-3 font-mono text-sm text-white">{command}</p>
          ) : null}
          {pieces.length > 0 ? (
            <ul className="mt-6 max-w-xl border-y border-black">
              {pieces.map((piece) => (
                <li
                  key={piece.name}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 border-t border-black py-3 first:border-t-0 sm:grid-cols-[7rem_minmax(0,1fr)]"
                >
                  <span className="font-mono text-[11px] tracking-[0.08em]">{piece.name}</span>
                  <span className="text-sm leading-6">{piece.line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <SourceRow sources={sources} />
        </div>
      </article>
    );
  }

  const points = notes.map((note, noteIndex) => ({ note, ...place(noteIndex, notes.length) }));

  return (
    <article
      className="flex h-full min-h-0 flex-col border border-black bg-white"
      style={{ transform: "translate3d(0, calc((1 - var(--engage, 1)) * 0.75rem), 0)" }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black px-4 py-3">
        <p className="min-w-0 truncate font-mono text-[11px] tracking-[0.16em]">
          {title}
          <span className="px-2 text-muted">vault/</span>
        </p>
        <p className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
          {String(index).padStart(2, "0")}
          <span className="px-1">/</span>
          {String(total).padStart(2, "0")}
        </p>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.15fr)_minmax(11.5rem,0.85fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:grid-rows-1">
        <div className="min-h-0 overflow-auto px-4 py-4 font-mono text-[12.5px] leading-5 sm:px-5" style={{ background: TERM, color: TERM_FG }}>
          <p style={{ color: TERM_DIM }}>
            <span style={{ color: TERM_CYAN }}>$ </span>
            brain list
          </p>
          <table className="mt-3 w-max border-collapse text-left whitespace-nowrap">
            <caption className="sr-only">Notes in the vault</caption>
            <thead>
              <tr style={{ color: TERM_DIM }}>
                <th className="pr-6 pb-1 font-normal">slug</th>
                <th className="pr-6 pb-1 font-normal">title</th>
                <th className="pb-1 font-normal">tags</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => {
                const selected = note.slug === active?.slug;
                return (
                  <tr key={note.slug}>
                    <td className="py-0.5 pr-6">
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(note.slug);
                          tap(6);
                        }}
                        className="text-left"
                        style={{ color: selected ? TERM_CYAN : TERM_FG }}
                      >
                        {note.slug}
                      </button>
                    </td>
                    <td className="py-0.5 pr-6">{note.title}</td>
                    <td className="py-0.5" style={{ color: TERM_DIM }}>
                      {note.tags}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {command ? (
            <p className="mt-4">
              <span style={{ color: TERM_CYAN }}>$ </span>
              {command.slice(0, typed)}
              {typed < command.length ? (
                <span className="motion-safe:animate-pulse" style={{ color: TERM_CYAN }}>
                  ▍
                </span>
              ) : null}
            </p>
          ) : null}
          {ran && runtime ? (
            <>
              <p className="mt-3" style={{ color: TERM_CYAN }}>
                BRAIN · {runtime}
              </p>
              <p style={{ color: TERM_DIM }}>Context: full vault ({notes.length} notes) → {runtime}</p>
            </>
          ) : null}
          {ran && active ? (
            <p className="mt-3 max-w-xl">
              <span style={{ color: TERM_DIM }}>note</span>
              <span className="mt-1 block" style={{ color: TERM_CYAN }}>
                [[{active.slug}]]
              </span>
              <span className="mt-1 block" style={{ color: TERM_FG }}>
                {active.line}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-col border-t border-black lg:border-t-0 lg:border-l">
          <p className="shrink-0 border-b border-black px-4 py-2 font-mono text-[11px] tracking-[0.14em]">GRAPH</p>
          <div className="relative min-h-0 flex-1">
            <svg viewBox="0 0 400 256" className="h-full w-full" aria-hidden="true">
              {edges(points).map((edge) => {
                const hot = edge.from === active?.slug || edge.to === active?.slug;
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="currentColor"
                    strokeOpacity={hot ? 1 : 0.28}
                    strokeWidth={hot ? 1.6 : 1}
                  />
                );
              })}
              {points.map((point) => {
                const selected = point.note.slug === active?.slug;
                return (
                  <g key={point.note.slug} transform={`translate(${point.x} ${point.y})`} className="pointer-events-none">
                    <circle r={selected ? 7 : 5} fill={selected ? "currentColor" : "transparent"} stroke="currentColor" strokeWidth="1.4" />
                    <text
                      y="18"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                      fontFamily="var(--font-mono), ui-monospace, monospace"
                    >
                      {point.note.slug}
                    </text>
                  </g>
                );
              })}
            </svg>
            {points.map((point) => (
              <button
                key={point.note.slug}
                type="button"
                aria-pressed={point.note.slug === active?.slug}
                aria-label={point.note.title}
                onClick={() => {
                  setOpen(point.note.slug);
                  tap(6);
                }}
                className="absolute h-11 w-28 -translate-x-1/2 -translate-y-3"
                style={{ left: `${(point.x / 400) * 100}%`, top: `${(point.y / 256) * 100}%` }}
              />
            ))}
          </div>
          {active ? (
            <p className="shrink-0 border-t border-black px-4 py-3 text-sm leading-5">
              <span className="font-mono text-[11px] tracking-[0.06em]">{active.slug}</span>
              <span className="mt-1 block">{active.line}</span>
            </p>
          ) : null}
          {pieces.length > 0 ? (
            <p className="shrink-0 border-t border-black px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-muted">
              {pieces.map((piece) => piece.name).join(" · ")}
            </p>
          ) : null}
          <SourceRow sources={sources} />
        </div>
      </div>
    </article>
  );
}

function SourceRow({ sources }: { sources: { label: string; href: string }[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-t border-black px-4 py-2 font-mono text-[11px] tracking-[0.04em]">
      {sources.map((item) => (
        <a
          key={`${item.label}-${item.href}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="link-draw"
          onClick={() => tap(8)}
        >
          {item.label}
        </a>
      ))}
    </p>
  );
}
