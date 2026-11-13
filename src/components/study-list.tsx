"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/content/courses";
import { tap } from "@/lib/haptic";

export function StudyList({ courses }: { courses: readonly Course[] }) {
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
    <ol className="mt-8 border-b border-black">
      {courses.map((course) => {
        const on = open === course.code;
        const [credit, ...rest] = course.meta.split("·").map((part) => part.trim());
        return (
          <li key={course.code} className="border-t border-black">
            <button
              type="button"
              aria-expanded={on}
              onClick={() => {
                tap(8);
                setOpen(on ? null : course.code);
              }}
              className={`row tap grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 px-1 py-3 text-left sm:gap-x-5 sm:py-3.5 ${
                on ? "bg-black text-white" : "bg-white"
              }`}
            >
              <span className="font-mono text-[11px] tracking-[0.08em]">
                <span className={on ? "opacity-70" : "text-muted"}>{course.faculty}</span>
                <span className="px-1.5 opacity-40">·</span>
                {course.code}
              </span>
              <span className="text-[15px] font-bold leading-snug tracking-tight sm:text-base">{course.title}</span>
              <span className={`font-mono text-[11px] tracking-[0.04em] ${on ? "opacity-70" : "text-muted"}`}>
                {credit}
              </span>
            </button>
            <div className={`fold${on ? " is-open" : ""}`} inert={!on}>
              <div className="fold-body">
                <div className="px-1 py-4 sm:py-5">
                  {course.czech.toLowerCase() === course.title.toLowerCase() ? null : (
                    <p className="font-mono text-xs tracking-[0.04em] text-muted">{course.czech}</p>
                  )}
                  {rest.length > 0 ? (
                    <p className="mt-1 font-mono text-xs tracking-[0.04em] text-muted">{rest.join(" · ")}</p>
                  ) : null}
                  <p className="mt-3 max-w-xl text-sm leading-6">{course.knows}</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{course.topics.join(" · ")}</p>
                  <a
                    href={course.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-draw mt-3 inline-block text-sm font-bold"
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
