"use client";

import { useEffect, useState } from "react";

export type Shot = {
  src: string;
  label: string;
};

export function ShotReel({ shots }: { shots: Shot[] }) {
  const [index, setIndex] = useState(0);
  const shot = shots[index] ?? shots[0];

  useEffect(() => {
    if (shots.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % shots.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [shots.length, index]);

  if (!shot) return null;

  return (
    <main className="fixed inset-0 bg-white">
      <button
        type="button"
        aria-label={`${shot.label}. Next screen.`}
        onClick={() => setIndex((current) => (current + 1) % shots.length)}
        className="absolute inset-0"
      >
        {/* The phone frame is the device around this page. These are the Play listing screens. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot.src} alt="" className="h-full w-full object-cover object-top" />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-white/90 px-3 py-2">
        <p className="min-w-0 truncate text-xs font-bold">{shot.label}</p>
        <div className="pointer-events-auto flex shrink-0 gap-1" role="tablist" aria-label="App screens">
          {shots.map((item, itemIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={item.label}
              onClick={() => setIndex(itemIndex)}
              className={`h-2 w-2 border border-black ${itemIndex === index ? "bg-black" : "bg-white"}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
