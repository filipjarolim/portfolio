"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { tap } from "@/lib/haptic";

function textEdge(copy: HTMLElement) {
  const range = document.createRange();
  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  let edge = copy.getBoundingClientRect().left;
  let node = walker.nextNode();
  while (node) {
    if (node.textContent?.trim()) {
      range.selectNodeContents(node);
      edge = Math.max(edge, range.getBoundingClientRect().right);
    }
    node = walker.nextNode();
  }
  return edge;
}

function circleSize(pin: HTMLElement, copy: HTMLElement, closed: number) {
  const pinBox = pin.getBoundingClientRect();
  const room = pinBox.right - textEdge(copy) - 20;
  const height = copy.getBoundingClientRect().height;
  return Math.max(closed, Math.min(room, height));
}

export function HeroIntro({ children }: { children: ReactNode }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const magnetRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const pin = pinRef.current;
    const magnet = magnetRef.current;
    if (!pin || !magnet) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const onMove = (event: PointerEvent) => {
      const host = magnet.parentElement?.getBoundingClientRect();
      if (!host) return;
      const size = magnet.offsetWidth;
      const cx = host.right - size / 2;
      const cy = host.top + size / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = size * 0.72;
      if (dist > reach) {
        magnet.style.transform = "";
        return;
      }
      const pull = (1 - dist / reach) * 0.42;
      const x = Math.min(22, Math.max(-22, dx * pull));
      const y = Math.min(22, Math.max(-22, dy * pull));
      magnet.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };
    const onLeave = () => {
      magnet.style.transform = "";
    };

    pin.addEventListener("pointermove", onMove);
    pin.addEventListener("pointerleave", onLeave);
    return () => {
      pin.removeEventListener("pointermove", onMove);
      pin.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    if (!open) {
      button.classList.remove("is-from");
      button.style.transition = "";
      return;
    }
    button.classList.add("is-from");
    button.style.transition = "none";
    void button.offsetWidth;
    button.style.transition = "";
    const frame = requestAnimationFrame(() => button.classList.remove("is-from"));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const pin = pinRef.current;
    const copy = copyRef.current;
    const magnet = magnetRef.current;
    const button = buttonRef.current;
    if (!pin || !copy || !magnet || !button) return;
    const apply = () => {
      const closed = Number(button.dataset.closed) || button.offsetWidth;
      const size = circleSize(pin, copy, closed);
      magnet.style.setProperty("--open-size", `${size}px`);
      button.style.setProperty("--from-s", String(closed / size));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(pin);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [open]);

  function toggle() {
    const button = buttonRef.current;
    const pin = pinRef.current;
    const copy = copyRef.current;
    const magnet = magnetRef.current;
    if (!button || !pin || !copy || !magnet) return;
    tap(12);
    if (!open) {
      const closed = button.offsetWidth;
      const size = circleSize(pin, copy, closed);
      button.dataset.closed = String(closed);
      magnet.style.setProperty("--open-size", `${size}px`);
      button.style.setProperty("--from-s", String(closed / size));
      setOpen(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(false);
      return;
    }
    button.classList.add("is-from");
    const finish = (event: TransitionEvent) => {
      if (event.target !== button || event.propertyName !== "transform") return;
      button.removeEventListener("transitionend", finish);
      setOpen(false);
    };
    button.addEventListener("transitionend", finish);
  }

  return (
    <div
      ref={pinRef}
      className="hero-pin grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pt-8 sm:gap-8 sm:pt-10"
    >
      <div ref={copyRef} className="hero-copy min-w-0">
        {children}
      </div>
      <div className={`portrait-drift relative${open ? " is-still" : ""}`}>
        <div className="size-24 sm:size-36 md:size-44 lg:size-52" aria-hidden="true" />
        <div ref={magnetRef} className={`portrait-magnet${open ? " is-open" : ""}`}>
          <button
            ref={buttonRef}
            type="button"
            className={`portrait portrait-frame${open ? " is-open" : ""}`}
            aria-expanded={open}
            aria-label={open ? "Shrink photo" : "Expand photo"}
            onClick={toggle}
          >
            <img
              src="/portrait"
              alt=""
              width={460}
              height={460}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover object-[center_18%]"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
