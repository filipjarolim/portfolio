/** Short vibration where the browser supports it. Visual press is the fallback. */
export function tap(duration = 10) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(duration);
}
