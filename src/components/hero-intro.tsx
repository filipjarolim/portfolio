"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { confirm, tap } from "@/lib/haptic";

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
  const openRef = useRef(false);
  const suspendRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const pin = pinRef.current;
    const magnet = magnetRef.current;
    if (!pin || !magnet) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let frame = 0;
    let running = false;
    let inside = false;
    let dirty = true;
    let seenOpen = false;
    let size = magnet.offsetWidth;
    let rect = magnet.parentElement?.getBoundingClientRect() ?? null;
    const pointer = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const measure = () => {
      size = magnet.offsetWidth;
      rect = magnet.parentElement?.getBoundingClientRect() ?? null;
    };

    const tick = () => {
      if (suspendRef.current) {
        pos.x = 0;
        pos.y = 0;
        vel.x = 0;
        vel.y = 0;
        magnet.style.transform = "";
        running = false;
        return;
      }
      if (inside && !openRef.current && dirty) {
        measure();
        dirty = false;
      }
      if (!inside || !rect) {
        target.x = 0;
        target.y = 0;
      } else {
        const cx = rect.right - size / 2;
        const cy = rect.top + size / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy);
        const reach = size * 0.72;
        if (dist > reach) {
          target.x = 0;
          target.y = 0;
        } else {
          const pull = (1 - dist / reach) * 0.42;
          target.x = Math.min(22, Math.max(-22, dx * pull));
          target.y = Math.min(22, Math.max(-22, dy * pull));
        }
      }
      vel.x += (target.x - pos.x) * 0.3;
      vel.y += (target.y - pos.y) * 0.3;
      vel.x *= 0.6;
      vel.y *= 0.6;
      pos.x += vel.x;
      pos.y += vel.y;
      const settled =
        Math.hypot(vel.x, vel.y) < 0.04 && Math.hypot(target.x - pos.x, target.y - pos.y) < 0.04;
      if (settled) {
        pos.x = target.x;
        pos.y = target.y;
        vel.x = 0;
        vel.y = 0;
        magnet.style.transform =
          target.x || target.y ? `translate3d(${target.x.toFixed(2)}px, ${target.y.toFixed(2)}px, 0)` : "";
        running = false;
        return;
      }
      magnet.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (seenOpen !== openRef.current) {
        seenOpen = openRef.current;
        dirty = true;
      }
      inside = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      start();
    };
    const onScroll = () => {
      dirty = true;
      if (inside) start();
    };
    const onLeave = () => {
      inside = false;
      start();
    };

    pin.addEventListener("pointermove", onMove);
    pin.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      pin.removeEventListener("pointermove", onMove);
      pin.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const shut = () => {
      if (openRef.current) buttonRef.current?.click();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") shut();
    };
    const onPointer = (event: PointerEvent) => {
      const magnet = magnetRef.current;
      if (magnet && event.target instanceof Node && magnet.contains(event.target)) return;
      shut();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

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
      const closed = button.offsetWidth;
      if (closed < 1) return;
      const size = circleSize(pin, copy, closed);
      button.style.setProperty("--open-s", String(size / closed));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(pin);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      toggle();
    };
    const onPointer = (event: PointerEvent) => {
      const button = buttonRef.current;
      if (button && event.target instanceof Node && button.contains(event.target)) return;
      toggle();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function toggle() {
    const button = buttonRef.current;
    const pin = pinRef.current;
    const copy = copyRef.current;
    const magnet = magnetRef.current;
    if (!button || !pin || !copy || !magnet) return;
    if (!open) {
      confirm();
      const closed = button.offsetWidth;
      const size = circleSize(pin, copy, closed);
      suspendRef.current = true;
      magnet.style.transform = "";
      button.style.setProperty("--open-s", String(size / Math.max(closed, 1)));
      setOpen(true);
      return;
    }
    tap(10);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      suspendRef.current = false;
      setOpen(false);
      return;
    }
    button.classList.add("is-from");
    let done = false;
    const shut = () => {
      if (done) return;
      done = true;
      window.clearTimeout(backup);
      button.removeEventListener("transitionend", finish);
      suspendRef.current = false;
      setOpen(false);
    };
    const finish = (event: TransitionEvent) => {
      if (event.target !== button || event.propertyName !== "transform") return;
      shut();
    };
    const backup = window.setTimeout(shut, 520);
    button.addEventListener("transitionend", finish);
  }

  return (
    <div
      ref={pinRef}
      className="hero-pin grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 pt-16 sm:gap-12 sm:pt-20"
    >
      <div ref={copyRef} className="hero-copy min-w-0">
        {children}
      </div>
      <div className="portrait-slot relative">
        <div className="size-32 sm:size-44 md:size-52 lg:size-60" aria-hidden="true" />
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
