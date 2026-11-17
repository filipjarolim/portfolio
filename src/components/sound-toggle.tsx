"use client";

import { useEffect, useState } from "react";
import { confirm, setSound, soundOn } from "@/lib/haptic";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const read = () => setOn(soundOn());
    read();
    window.addEventListener("folio-sound", read);
    return () => window.removeEventListener("folio-sound", read);
  }, []);

  function toggle() {
    const next = !soundOn();
    setSound(next);
    setOn(next);
    if (next) confirm();
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Mute sounds" : "Turn sounds on"}
      onClick={toggle}
      className="relative z-[1] shrink-0 border border-black bg-white px-2 py-1 text-xs font-bold"
    >
      {on ? "Sound" : "Quiet"}
    </button>
  );
}
