"use client";

import { useState } from "react";
import type { PerimeterReading } from "@/lib/perimeter";

export function PerimeterDesk({ readings }: { readings: PerimeterReading[] }) {
  const [id, setId] = useState(readings[0]?.id ?? "");
  const current = readings.find((item) => item.id === id) ?? readings[0];
  if (!current) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-8">
      <p className="font-mono text-[11px] tracking-[0.14em]">SECURITY</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Perimeter</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed">
        Reads the response headers of the sites on this page and says what the browser is being told.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Site">
        {readings.map((item) => {
          const active = item.id === current.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setId(item.id)}
              className={`border border-black px-3 py-2 text-xs font-bold ${active ? "bg-black text-white" : "bg-white"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {current.error ? <p className="mt-4 text-sm">{current.error}</p> : null}
      <dl className="mt-4 border-b border-black">
        {current.rows.map((row) => (
          <div key={row.name} className="border-t border-black py-2.5">
            <dt className="font-mono text-[11px] tracking-[0.12em] uppercase">{row.name}</dt>
            <dd className="mt-1 text-sm font-bold break-all">{row.value}</dd>
            <dd className="mt-1 text-xs leading-snug">{row.note}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
