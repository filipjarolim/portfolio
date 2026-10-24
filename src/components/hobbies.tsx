"use client";

import { Loupe, Terrain } from "@lucasmarkes/hairline/react";
import { useEffect, useState, type PointerEvent } from "react";
import { tap } from "@/lib/haptic";

const details = {
  travelling: {
    title: "Travelling",
    body: "I travel when I can. Brno is home for the degree. Move across the field.",
    figure: "terrain" as const,
  },
  photography: {
    title: "Photography",
    body: "I take photographs. This frame is the one the site, GitHub, and LinkedIn share.",
    figure: "loupe" as const,
  },
  gym: {
    title: "Gym",
    body: "I train. The bar follows the pointer.",
    figure: "bar" as const,
  },
};

function known(like: string) {
  const key = like.trim().toLowerCase();
  if (key in details) return details[key as keyof typeof details];
  return null;
}

function shift(event: PointerEvent<HTMLDivElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  event.currentTarget.style.setProperty("--px", x.toFixed(3));
  event.currentTarget.style.setProperty("--py", y.toFixed(3));
}

function clearShift(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty("--px");
  event.currentTarget.style.removeProperty("--py");
}

function Bar() {
  return (
    <svg viewBox="0 0 240 140" className="h-full w-full" aria-hidden="true">
      <g className="ink-shift-far" fill="none" stroke="var(--muted)" strokeWidth="1.25">
        <path d="M16 108h208" />
        <path d="M28 108V36M212 108V36" />
      </g>
      <g className="ink-shift" fill="none" stroke="var(--fg)" strokeWidth="1.5" strokeLinecap="square">
        <path d="M46 46v48M58 54v32" />
        <path d="M58 70h124" />
        <path d="M182 54v32M194 46v48" />
      </g>
    </svg>
  );
}

export function Hobbies({ likes }: { likes: readonly string[] }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mt-28 sm:mt-36">
      <h3 className="font-mono text-xs tracking-[0.16em] uppercase">I like</h3>
      <ol className="mt-6 border-t border-black">
        {likes.map((like, index) => {
          const item = known(like);
          const on = open === like;
          return (
            <li key={like} className="border-b border-black">
              <button
                type="button"
                aria-expanded={on}
                onClick={() => {
                  tap(8);
                  setOpen(on ? null : like);
                }}
                className={`row tap flex w-full items-baseline justify-between gap-6 px-1 py-7 text-left sm:py-9 ${
                  on ? "bg-black text-white" : ""
                }`}
              >
                <span className="font-mono text-xs tracking-[0.14em]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-none tracking-[-0.045em]">
                  {like}
                </span>
              </button>
              <div className={`fold${on ? " is-open" : ""}`} inert={!on}>
                <div className="fold-body">
                  {item ? (
                    <div
                      className="grid items-center gap-8 py-6 sm:grid-cols-[16rem_minmax(0,1fr)] sm:py-8"
                      onPointerMove={shift}
                      onPointerLeave={clearShift}
                    >
                      <div className="ink-stage relative h-52 w-full max-w-xs">
                        <div className="ink-shift-far absolute inset-3 border border-black" aria-hidden="true" />
                        <div className="ink-shift relative h-full">
                          {item.figure === "terrain" ? (
                            <Terrain theme="auto" play={on} intensity={0.65} label="A field of pillars" className="hairline-ink h-full w-full" />
                          ) : null}
                          {item.figure === "loupe" ? (
                            <Loupe theme="auto" play={on} intensity={0.65} label="A loupe over a sheet" className="hairline-ink h-full w-full" />
                          ) : null}
                          {item.figure === "bar" ? <Bar /> : null}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-xl text-base leading-7 sm:text-lg sm:leading-8">{item.body}</p>
                        {item.figure === "loupe" ? (
                          <img
                            src="/portrait"
                            alt="Filip Jarolím, the portrait shared with GitHub and LinkedIn."
                            width={460}
                            height={460}
                            className="mt-5 h-36 w-36 border border-black object-cover object-[center_18%]"
                          />
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="max-w-xl py-6 text-base leading-7">{like}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
