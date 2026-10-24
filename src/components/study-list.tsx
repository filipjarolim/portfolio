"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/content/courses";
import { tap } from "@/lib/haptic";

export function StudyList({ courses }: { courses: readonly Course[] }) {
  const [open, setOpen] = useState<string | null>(courses[0]?.code ?? null);

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
    <ol className="mt-8 border-b border-black">
      {courses.map((course) => {
        const on = open === course.code;
        return (
          <li key={course.code} className="border-t border-black">
            <button
              type="button"
              aria-expanded={on}
              onClick={() => {
                tap(8);
                setOpen(on ? null : course.code);
              }}
              className={`row tap flex w-full items-baseline justify-between gap-4 px-1 py-4 text-left sm:py-5 ${
                on ? "bg-black text-white" : "bg-white"
              }`}
            >
              <span className="min-w-0">
                <span className="block font-mono text-[11px] tracking-[0.14em]">
                  {course.faculty}:{course.code}
                </span>
                <span className="mt-1 block text-lg font-bold leading-snug tracking-tight sm:text-xl">
                  {course.title}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] tracking-[0.08em]">{on ? "Close" : "Open"}</span>
            </button>
            <div className={`fold${on ? " is-open" : ""}`} inert={!on}>
              <div className="fold-body">
                <div className="px-1 py-6 sm:py-8">
                  {course.czech.toLowerCase() === course.title.toLowerCase() ? null : (
                    <p className="font-mono text-xs tracking-[0.04em] text-muted">{course.czech}</p>
                  )}
                  <p className="mt-2 font-mono text-xs tracking-[0.04em] text-muted">{course.meta}</p>
                  <p className="mt-5 max-w-xl text-base leading-8">{course.knows}</p>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{course.topics.join(" · ")}</p>
                  <a
                    href={course.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-draw mt-4 inline-block text-sm font-bold"
                  >
                    Course page
                  </a>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
