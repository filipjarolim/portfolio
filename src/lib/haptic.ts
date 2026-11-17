const SOUND_KEY = "folio-sound";

let audio: AudioContext | null = null;
let sound: boolean | null = null;

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(pattern);
}

/** On unless the visitor turned it off, or asked the system for less motion and has not chosen yet. */
export function soundOn() {
  if (typeof window === "undefined") return false;
  if (sound === null) {
    const saved = localStorage.getItem(SOUND_KEY);
    sound =
      saved === "off"
        ? false
        : saved === "on"
          ? true
          : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return sound;
}

export function setSound(next: boolean) {
  sound = next;
  localStorage.setItem(SOUND_KEY, next ? "on" : "off");
  window.dispatchEvent(new Event("folio-sound"));
}

function context() {
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audio ??= new Ctx();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

/** A short sine tick. Gain stays low so a click reads as a click. */
function tone(frequency: number, when: number, duration: number, amount: number) {
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const start = ctx.currentTime + when;
  osc.type = "sine";
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(amount, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function click() {
  if (!soundOn()) return;
  tone(620, 0, 0.04, 0.035);
}

function done() {
  if (!soundOn()) return;
  tone(660, 0, 0.045, 0.04);
  tone(920, 0.055, 0.07, 0.032);
}

/** Short vibration where the browser supports it. Visual press is the fallback. */
export function tap(duration = 10) {
  vibrate(duration);
  click();
}

/** Two pulses for a completed action: copy, expand, open. */
export function confirm() {
  vibrate([8, 36, 14]);
  done();
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
