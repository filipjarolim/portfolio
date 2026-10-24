"use client";

import { useEffect, useState } from "react";
import { tap } from "@/lib/haptic";

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  window.dispatchEvent(new Event("folio-theme"));
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (localStorage.getItem("folio-theme")) return;
      apply(media.matches);
      read();
    };
    const onTheme = () => read();
    media.addEventListener("change", onSystem);
    window.addEventListener("folio-theme", onTheme);
    return () => {
      media.removeEventListener("change", onSystem);
      window.removeEventListener("folio-theme", onTheme);
    };
  }, []);

  function toggle() {
    tap(8);
    const next = !document.documentElement.classList.contains("dark");
    localStorage.setItem("folio-theme", next ? "dark" : "light");
    apply(next);
    setDark(next);
  }

  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      onClick={toggle}
      className="relative z-[1] shrink-0 border border-black bg-white px-2 py-1 text-xs font-bold"
    >
      {dark ? "Dark" : "Light"}
    </button>
  );
}
