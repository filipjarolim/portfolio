"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CopyLabel } from "@/components/copy-control";
import { DeviceStage, type DeviceKind } from "@/components/device-stage";
import { confirm, copyText, tap } from "@/lib/haptic";

const DEVICE_MODELS = ["/models/macbook-air-m2.glb", "/models/iphone-15-pro-max.glb"];

export type ShowcaseProject = {
  repo: string;
  title: string;
  summary: string;
  intro: string;
  tags: string[];
  stack: string;
  meta: string;
  sources: { label: string; href: string }[];
  surfaces: { device: DeviceKind; label: string; src: string }[];
};

const devices: { kind: DeviceKind; label: string; credit: string; creditHref: string }[] = [
  {
    kind: "macbook",
    label: "Laptop",
    credit: "rtql8d",
    creditHref:
      "https://sketchfab.com/3d-models/macbook-air-m2-786fa23d402a4f90ae36c4168997f9cc",
  },
  {
    kind: "iphone",
    label: "Phone",
    credit: "polyman Studio",
    creditHref:
      "https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7",
  },
];

function repoFromHash(projects: ShowcaseProject[]) {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return projects.find((project) => project.repo === id)?.repo ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function SourceLinks({
  sources,
  className,
}: {
  sources: ShowcaseProject["sources"];
  className?: string;
}) {
  if (sources.length === 0) return null;
  return (
    <p className={`flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.04em] ${className ?? ""}`}>
      {sources.map((item) => (
        <a
          key={`${item.label}-${item.href}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="link-draw"
          onClick={() => tap(8)}
        >
          {item.label}
        </a>
      ))}
    </p>
  );
}

export default function Showcase({ projects }: { projects: ShowcaseProject[] }) {
  const [kind, setKind] = useState<DeviceKind>("macbook");
  const [repo, setRepo] = useState(projects[0]?.repo ?? "");
  const [expanded, setExpanded] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const picked = useRef(false);
  const [copied, setCopied] = useState(false);
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const lock = useRef<string | null>(null);
  const repoRef = useRef(repo);
  const centers = useRef<number[]>([]);
  const pinStart = useRef(0);
  const pinSpan = useRef(1);
  const viewCenter = useRef(0);
  const expandedRef = useRef(false);
  repoRef.current = repo;
  expandedRef.current = expanded;

  function placeMark(id: string) {
    const item = itemRefs.current.get(id);
    const mark = markRef.current;
    if (!item || !mark) return;
    mark.style.transform = `translate3d(0, ${item.offsetTop}px, 0) scale3d(1, ${item.offsetHeight}, 1)`;
    mark.style.opacity = "1";
  }

  function measure() {
    const track = trackRef.current;
    const pin = pinRef.current;
    const view = viewRef.current;
    if (!track || !pin || !view) return;
    const stickyTop = Number.parseFloat(getComputedStyle(pin).top) || 0;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    pinStart.current = trackTop - stickyTop;
    pinSpan.current = Math.max(1, track.offsetHeight - pin.offsetHeight);
    viewCenter.current = view.clientHeight / 2;
    centers.current = projects.map((item) => {
      const node = itemRefs.current.get(item.repo);
      return node ? node.offsetTop + node.offsetHeight / 2 : 0;
    });
  }

  function focusAt(scrollY: number) {
    const shift = shiftRef.current;
    const spots = centers.current;
    const count = projects.length;
    if (!shift || count === 0 || spots.length !== count) return null;
    if (expandedRef.current) {
      shift.style.transform = "";
      return null;
    }
    const t = clamp((scrollY - pinStart.current) / pinSpan.current, 0, 1);
    const cursor = clamp(t * count - 0.5, 0, count - 1);
    const lower = Math.floor(cursor);
    const upper = Math.min(count - 1, lower + 1);
    const mix = cursor - lower;
    const focus = spots[lower] * (1 - mix) + spots[upper] * mix;
    shift.style.transform = `translate3d(0, ${viewCenter.current - focus}px, 0)`;
    return projects[Math.round(cursor)]?.repo ?? null;
  }

  function scrollToProject(next: string, behavior: ScrollBehavior) {
    const index = projects.findIndex((item) => item.repo === next);
    if (index < 0 || expandedRef.current) return;
    const count = Math.max(projects.length, 1);
    const top = pinStart.current + pinSpan.current * ((index + 0.5) / count);
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  function remember(next: string) {
    const url = new URL(window.location.href);
    url.hash = next;
    history.replaceState(null, "", url);
  }

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("device");
    const saved = sessionStorage.getItem("folio-device");
    if (param === "phone" || (param !== "laptop" && saved === "iphone")) setKind("iphone");
    else if (param === "laptop" || saved === "macbook") setKind("macbook");
  }, []);

  useEffect(() => {
    const close = () => setExpanded(false);
    window.addEventListener("folio-close-expand", close);
    return () => window.removeEventListener("folio-close-expand", close);
  }, []);

  useEffect(() => {
    const sync = () => {
      const match = repoFromHash(projects);
      if (!match) return;
      lock.current = match;
      setRepo(match);
      const param = new URLSearchParams(window.location.search).get("device");
      const item = projects.find((project) => project.repo === match);
      if (!param && !picked.current && item) {
        const fit = deviceFor(item);
        if (fit) setKind(fit);
      }
      scrollToProject(match, "auto");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [projects]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = focusAt(window.scrollY);
        if (lock.current || !next || next === repoRef.current) return;
        repoRef.current = next;
        remember(next);
        setRepo(next);
        const param = new URLSearchParams(window.location.search).get("device");
        if (!picked.current && !param) {
          const item = projects.find((project) => project.repo === next);
          const fit = item ? deviceFor(item) : null;
          if (fit) setKind(fit);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [projects]);

  useEffect(() => {
    let timer = 0;
    const release = () => {
      if (!lock.current) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        lock.current = null;
      }, 90);
    };
    const cancel = () => {
      lock.current = null;
    };
    window.addEventListener("scroll", release, { passive: true });
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchmove", cancel, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", release);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
    };
  }, []);

  useEffect(() => {
    const urls = [...DEVICE_MODELS, ...projects.flatMap((project) => project.surfaces.map((surface) => surface.src))];
    let links: HTMLLinkElement[] = [];
    const idle = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 500));
    const cancel =
      window.cancelIdleCallback ??
      ((id: number) => {
        window.clearTimeout(id);
      });
    const id = idle(() => {
      links = urls.map((href) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = href;
        link.as = href.endsWith(".glb") ? "fetch" : "document";
        document.head.appendChild(link);
        return link;
      });
    });
    return () => {
      cancel(id);
      for (const link of links) link.remove();
    };
  }, [projects]);

  useLayoutEffect(() => {
    measure();
    focusAt(window.scrollY);
    placeMark(repo);
  }, [repo, projects, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const block = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".work-view, .work-rail")) return;
      event.preventDefault();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        return;
      }
      const target = event.target;
      const onControl = target instanceof Element && !!target.closest("button, a, input, textarea");
      if (!onControl && (event.key === " " || event.key === "PageUp" || event.key === "PageDown")) {
        event.preventDefault();
      }
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  useEffect(() => {
    const list = listRef.current;
    const track = trackRef.current;
    const view = viewRef.current;
    if (!list || !track || !view) return;
    const observer = new ResizeObserver(() => {
      measure();
      focusAt(window.scrollY);
      placeMark(repoRef.current);
    });
    observer.observe(list);
    observer.observe(track);
    observer.observe(view);
    const onResize = () => {
      measure();
      focusAt(window.scrollY);
      placeMark(repoRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [projects]);

  const actions = useRef({
    step: (_delta: number) => {},
    toggle: () => {},
    pick: (_index: number) => {},
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable], iframe")) return;
      if (expandedRef.current && (event.key === "ArrowDown" || event.key === "ArrowRight")) {
        event.preventDefault();
        actions.current.step(1);
        return;
      }
      if (expandedRef.current && (event.key === "ArrowUp" || event.key === "ArrowLeft")) {
        event.preventDefault();
        actions.current.step(-1);
        return;
      }
      if (event.key === "e" || event.key === "E") {
        event.preventDefault();
        actions.current.toggle();
        return;
      }
      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        actions.current.pick(Number(event.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projects]);

  const project = projects.find((item) => item.repo === repo) ?? projects[0];
  const device = devices.find((item) => item.kind === kind) ?? devices[0];
  if (!project) return null;
  const surface = project.surfaces.find((item) => item.device === kind) ?? project.surfaces[0];
  const distinctSurfaces =
    new Set(project.surfaces.map((item) => item.src)).size > 1 ? project.surfaces : [];

  function revealCard(next: string) {
    const item = itemRefs.current.get(next);
    const view = viewRef.current;
    if (!item || !view || !expandedRef.current) return;
    const itemBox = item.getBoundingClientRect();
    const viewBox = view.getBoundingClientRect();
    if (itemBox.left < viewBox.left) view.scrollLeft -= viewBox.left - itemBox.left;
    else if (itemBox.right > viewBox.right) view.scrollLeft += itemBox.right - viewBox.right;
    if (itemBox.top < viewBox.top) view.scrollTop -= viewBox.top - itemBox.top;
    else if (itemBox.bottom > viewBox.bottom) view.scrollTop += itemBox.bottom - viewBox.bottom;
  }

  function deviceFor(item: ShowcaseProject) {
    const tags = item.tags.map((tag) => tag.toLowerCase());
    const mobile = tags.includes("mobile");
    const web = tags.includes("web");
    const distinct = new Set(item.surfaces.map((surface) => surface.src)).size > 1;
    if (distinct && mobile) return "iphone" as const;
    if (mobile && !web) return "iphone" as const;
    if (web && !mobile) return "macbook" as const;
    return null;
  }

  function select(next: string) {
    tap(10);
    lock.current = next;
    setRepo(next);
    const item = projects.find((project) => project.repo === next);
    const fit = item && !picked.current ? deviceFor(item) : null;
    if (fit) choose(fit);
    remember(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollToProject(next, reduce ? "auto" : "smooth");
    revealCard(next);
  }

  function choose(next: DeviceKind, fromUser = false) {
    if (fromUser) picked.current = true;
    if (next === kind) return;
    if (fromUser) tap(14);
    setKind(next);
    sessionStorage.setItem("folio-device", next);
    const url = new URL(window.location.href);
    url.searchParams.set("device", next === "iphone" ? "phone" : "laptop");
    history.replaceState(null, "", url);
  }

  function focusTag(tag: string) {
    tap(8);
    const next = focus === tag ? null : tag;
    setFocus(next);
    if (!next) return;
    const current = projects.find((item) => item.repo === repo);
    const matches = (item: ShowcaseProject) => item.tags.some((value) => value.toLowerCase() === next.toLowerCase());
    if (current && matches(current)) return;
    const match = projects.find(matches);
    if (match) select(match.repo);
  }

  const tags = [...new Set(projects.flatMap((item) => item.tags))];

  async function copyLink() {
    const url = new URL(window.location.href);
    url.hash = repo;
    url.searchParams.set("device", kind === "iphone" ? "phone" : "laptop");
    const ok = await copyText(url.toString());
    if (!ok) return;
    history.replaceState(null, "", url);
    confirm();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function step(delta: number) {
    const index = projects.findIndex((item) => item.repo === repoRef.current);
    const next = projects[index + delta];
    if (next) select(next.repo);
  }

  actions.current.step = step;
  actions.current.pick = (index) => {
    const next = projects[index];
    if (next) select(next.repo);
  };
  actions.current.toggle = () => {
    confirm();
    setExpanded((value) => !value);
  };

  return (
    <section
      id="work"
      ref={trackRef}
      aria-labelledby="work-heading"
      className="work-track fade-in"
      style={{ ["--work-steps" as string]: Math.max(projects.length - 1, 1) }}
    >
      <div ref={pinRef} className={`work-pin${expanded ? " is-expanded" : ""}`}>
      <div className="mb-3 flex shrink-0 items-center gap-3">
        <h2 id="work-heading" className="shrink-0 text-xs font-bold uppercase tracking-[0.22em]">
          My work
        </h2>
        <div
          role="radiogroup"
          aria-label="Device"
          className="relative grid min-w-0 flex-1 grid-cols-2 border border-black sm:w-52 sm:flex-none"
        >
            <span
              aria-hidden="true"
              className="spring-mark inset-y-0 left-0 w-1/2"
              style={{
                transform: kind === "iphone" ? "translate3d(100%, 0, 0)" : "translate3d(0, 0, 0)",
              }}
            />
            {devices.map((item) => {
              const active = item.kind === kind;
              return (
                <button
                  key={item.kind}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => choose(item.kind, true)}
                  className={`spring-ink relative z-[1] bg-transparent px-3 py-3 text-left text-sm font-bold ${
                    active ? "text-white" : "text-black"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-pressed={expanded}
            aria-keyshortcuts="e"
            onClick={() => actions.current.toggle()}
            className="tap sweep shrink-0 border border-black bg-white px-3 py-3 text-sm font-bold"
          >
            {expanded ? "Close" : "Expand"}
          </button>
          <button
            type="button"
            onClick={copyLink}
            aria-live="polite"
            className={`copy-sheen tap shrink-0 border border-black bg-white px-3 py-3 text-sm font-bold ${copied ? "is-copied" : ""}`}
          >
            <CopyLabel copied={copied} label="Link" />
          </button>
      </div>
      {tags.length > 0 ? (
        <div className="mb-3 flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={focus === null}
            onClick={() => {
              tap(8);
              setFocus(null);
            }}
            className={`border border-black px-3 py-2 text-xs font-bold ${focus === null ? "bg-black text-white" : "bg-white"}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={focus === tag}
              onClick={() => focusTag(tag)}
              className={`border border-black px-3 py-2 text-xs font-bold ${focus === tag ? "bg-black text-white" : "bg-white"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={
          expanded
            ? "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_14rem] lg:grid-rows-1 lg:gap-6"
            : "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_11rem] gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(15rem,22rem)] lg:grid-rows-1 lg:gap-10"
        }
      >
        <div className="group flex min-h-0 min-w-0 flex-col">
          <div className="relative min-h-0 flex-1">
            <div
              role="application"
              aria-label={`${project.title} on ${device.label}`}
              className={
                expanded
                  ? "h-full min-h-0 w-full"
                  : kind === "iphone"
                    ? "mx-auto h-full min-h-0 w-full max-w-[min(100%,36rem)]"
                    : "h-full min-h-0 w-full"
              }
            >
              <DeviceStage
                kind={kind}
                src={surface?.src ?? ""}
                title={`${project.title} on ${device.label}`}
                interactive={expanded}
              />
            </div>
          </div>
          <div className="mt-3 max-w-xl shrink-0">
            <p className="flex items-baseline justify-between gap-3 text-sm font-bold tracking-tight">
              <span className="min-w-0">{project.title}</span>
              <span className="shrink-0 font-mono text-[11px] font-normal text-muted tabular-nums">
                {String(projects.findIndex((item) => item.repo === project.repo) + 1).padStart(2, "0")}
                <span className="px-1">/</span>
                {String(projects.length).padStart(2, "0")}
              </span>
            </p>
            <p className="mt-3 text-base leading-7">{project.intro || project.summary}</p>
            {project.meta ? (
              <p className="mt-2 font-mono text-[11px] tracking-[0.02em] text-muted">{project.meta}</p>
            ) : null}
            {distinctSurfaces.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Source">
                {distinctSurfaces.map((item) => {
                  const active = item.device === kind;
                  return (
                    <button
                      key={item.device}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => choose(item.device, true)}
                      className={`border border-black px-3 py-2 text-xs font-bold ${active ? "bg-black text-white" : "bg-white"}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {expanded ? <SourceLinks sources={project.sources} className="mt-2 shrink-0" /> : null}
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <p className="font-mono text-[11px] text-muted">1–{projects.length} · E</p>
            <details className="model-credit">
              <summary className="cursor-pointer font-mono text-[11px] text-muted">Model credit</summary>
              <p className="mt-2 max-w-xs text-right font-mono text-xs leading-5 text-muted">
                {device.kind === "macbook" ? "MacBook Air M2" : "iPhone 15 Pro Max"}. Model by{" "}
                <a href={device.creditHref} target="_blank" rel="noreferrer" className="link-draw">
                  {device.credit}
                </a>
                ,{" "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer license"
                  className="link-draw"
                >
                  CC BY 4.0
                </a>
                .
              </p>
            </details>
          </div>
        </div>

        <div
          ref={viewRef}
          className={
            expanded
              ? "work-rail flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
              : "work-view relative min-h-0 overflow-hidden"
          }
        >
          <div ref={shiftRef} className="work-shift">
            <ol
              ref={listRef}
              aria-keyshortcuts="ArrowUp ArrowDown"
              className={
                expanded
                  ? "relative flex min-w-0 gap-2 lg:flex-col lg:border-b lg:border-black"
                  : "relative min-w-0 border-b border-black"
              }
              aria-label="Projects"
            >
              <span
                ref={markRef}
                aria-hidden="true"
                className={`spring-mark top-0 left-0 h-px w-full opacity-0${expanded ? " hidden lg:block" : ""}`}
              />
              {projects.map((item, index) => {
                const selected = item.repo === project.repo;
                return (
                  <li
                    key={item.repo}
                    id={item.repo}
                    ref={(node) => {
                      if (node) itemRefs.current.set(item.repo, node);
                      else itemRefs.current.delete(item.repo);
                    }}
                    className={`spring-ink relative z-[1] border-black ${
                      focus && !item.tags.some((tag) => tag.toLowerCase() === focus.toLowerCase()) ? "is-dim" : ""
                    } ${
                      expanded
                        ? `shrink-0 border lg:w-full lg:border-x-0 lg:border-b-0 lg:border-t ${selected ? "bg-black text-white lg:bg-transparent" : "text-black"}`
                        : `border-t ${selected ? "text-white" : "text-black"}`
                    }`}
                  >
                    <button
                      type="button"
                      aria-current={selected ? "true" : undefined}
                      onClick={() => select(item.repo)}
                      className={
                        expanded
                          ? "tap flex w-40 items-baseline gap-2 px-2 py-2 text-left lg:w-full"
                          : `tap flex w-full items-start gap-3 px-3 text-left ${selected ? "py-4" : "pt-3"}`
                      }
                    >
                      <span className="font-mono text-[11px] tracking-[0.14em]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={
                            expanded
                              ? "block text-sm font-bold leading-tight"
                              : "block text-base font-bold leading-tight tracking-[-0.03em]"
                          }
                        >
                          {item.title}
                        </span>
                        {expanded || selected ? null : (
                          <>
                            <span className="mt-1.5 block line-clamp-2 text-sm leading-6">{item.summary}</span>
                            {item.meta ? (
                              <span className="mt-1.5 block font-mono text-[11px] leading-none text-muted">{item.meta}</span>
                            ) : null}
                          </>
                        )}
                      </span>
                    </button>
                    {expanded ? null : (
                      <SourceLinks sources={item.sources} className="px-3 pb-2.5 pl-9" />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
