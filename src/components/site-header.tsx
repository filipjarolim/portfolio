"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { links } from "@/content/selection";
import { tap } from "@/lib/haptic";

const item =
  "link-draw focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black";

const sections = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "study", label: "Study" },
] as const;

export function SiteHeader() {
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [mark, setMark] = useState({ x: 0, w: 0, on: false });

  useEffect(() => {
    const paintTheme = () => {
      const node = document.querySelector("header");
      if (!node) return;
      const paint = getComputedStyle(node).backgroundColor;
      const match = paint.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const hex = match
        ? `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`
        : document.documentElement.classList.contains("dark")
          ? "#121820"
          : "#ffffff";
      document.documentElement.style.backgroundColor = hex;
      const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      if (metas.length === 0) {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = hex;
        document.head.appendChild(meta);
      } else {
        metas.forEach((meta) => meta.setAttribute("content", hex));
      }
    };
    paintTheme();
    window.addEventListener("folio-theme", paintTheme);
    return () => window.removeEventListener("folio-theme", paintTheme);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const top = window.innerHeight * 0.46;
      const bottom = window.innerHeight * 0.62;
      let next: string | null = null;
      let best = 0;
      for (const section of sections) {
        const node = document.getElementById(section.id);
        if (!node) continue;
        const box = node.getBoundingClientRect();
        const overlap = Math.min(box.bottom, bottom) - Math.max(box.top, top);
        if (overlap > best) {
          best = overlap;
          next = section.id;
        }
      }
      setActive((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const place = () => {
      const nav = navRef.current;
      const link = active ? nav?.querySelector<HTMLElement>(`[data-section="${active}"]`) : null;
      if (!nav || !link) {
        setMark({ x: 0, w: 0, on: false });
        return;
      }
      setMark({ x: link.offsetLeft, w: link.offsetWidth, on: true });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  function jump(id: string) {
    tap(10);
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    window.dispatchEvent(new Event("folio-close-expand"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black bg-white pt-[env(safe-area-inset-top)]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[calc(0.75rem+env(safe-area-inset-top))] focus:z-[60] focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link href="/" className={`${item} shrink-0 text-sm font-bold tracking-tight`} onClick={() => tap(8)}>
          Filip Jarolím
        </Link>
        <nav
          ref={navRef}
          aria-label="Primary"
          className="nav-scroll relative flex min-w-0 items-center justify-start gap-x-2.5 overflow-x-auto text-xs font-medium sm:justify-end sm:gap-x-5 sm:text-sm"
        >
          <span
            aria-hidden="true"
            className="nav-mark"
            style={{
              transform: `translate3d(${mark.x}px, 0, 0) scaleX(${mark.on ? mark.w : 0})`,
              opacity: mark.on ? 1 : 0,
            }}
          />
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              data-section={section.id}
              aria-current={active === section.id ? "true" : undefined}
              className={`${item} relative z-[1] ${active === section.id ? "font-bold" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                jump(section.id);
              }}
            >
              {section.label}
            </a>
          ))}
          <a href={links.github} className={`${item} relative z-[1]`} target="_blank" rel="me noreferrer" onClick={() => tap(8)}>
            GitHub
          </a>
          <a href={links.linkedin} className={`${item} relative z-[1]`} target="_blank" rel="me noreferrer" onClick={() => tap(8)}>
            LinkedIn
          </a>
          <a href="/cv.pdf" className={`${item} relative z-[1]`} onClick={() => tap(8)}>
            CV
          </a>
          <a href="/admin" className={`${item} relative z-[1]`} onClick={() => tap(8)}>
            Admin
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
