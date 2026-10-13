"use client";

import { useEffect } from "react";

/** The device page is a display. No selection, callout, or context menu. */
export function ScreenGuard() {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return (
    <style>{`
      html, body, body * {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `}</style>
  );
}
