"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CopyLabel } from "@/components/copy-control";
import { DeviceStage, type DeviceKind } from "@/components/device-stage";
import { links } from "@/content/selection";
import { confirm, copyText, tap } from "@/lib/haptic";

const DEVICE_MODELS = ["/models/macbook-air-m2.glb", "/models/iphone-15-pro-max.glb"];

export type ShowcaseProject = {
  repo: string;
  title: string;
  summary: string;
  intro: string;
  tags: string[];
  bullets: string[];
  onResume: boolean;
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

function smoothstep(value: number) {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function MobileScreen({ src, title }: { src: string; title: string }) {
  const [slots, setSlots] = useState<[string, string | null]>([src, null]);
  const [show, setShow] = useState<0 | 1>(0);
  const loaded = useRef(new Set<string>());

  useEffect(() => {
    const visible = show === 0 ? slots[0] : slots[1];
    if (src === visible) return;
    const hidden = show === 0 ? 1 : 0;
    if (slots[hidden] === src) {
      if (loaded.current.has(src)) setShow(hidden);
      return;
    }
    setSlots(show === 0 ? [slots[0], src] : [src, slots[1]]);
  }, [src, slots, show]);

  function onLoad(frameSrc: string) {
    loaded.current.add(frameSrc);
    if (frameSrc !== src) return;
    setShow(slots[0] === frameSrc ? 0 : 1);
  }

  return (
    <>
      {slots.map((frameSrc, index) =>
        frameSrc ? (
          <iframe
            key={`${index}:${frameSrc}`}
            title={title}
            src={frameSrc}
            className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-[var(--bg)] transition-opacity duration-500"
            style={{ opacity: show === index ? 1 : 0 }}
            onLoad={() => onLoad(frameSrc)}
          />
        ) : null,
      )}
    </>
  );
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
  const [wide, setWide] = useState<boolean | null>(null);
  const [repo, setRepo] = useState(projects[0]?.repo ?? "");
  const picked = useRef(false);
  const engageRef = useRef(0);
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
  repoRef.current = repo;

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
    if (!track || !pin) return;
    const stickyTop = Number.parseFloat(getComputedStyle(pin).top) || 0;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    pinStart.current = trackTop - stickyTop;
    pinSpan.current = Math.max(1, track.offsetHeight - pin.offsetHeight);
    const view = viewRef.current;
    if (!view) return;
    viewCenter.current = view.clientHeight / 2;
    centers.current = projects.map((item) => {
      const node = itemRefs.current.get(item.repo);
      return node ? node.offsetTop + node.offsetHeight / 2 : 0;
    });
  }

  function focusAt(scrollY: number) {
    const count = projects.length;
    if (count === 0) return null;
    const t = clamp((scrollY - pinStart.current) / pinSpan.current, 0, 1);
    const cursor = clamp(t * count - 0.5, 0, count - 1);
    const shift = shiftRef.current;
    const spots = centers.current;
    if (shift && spots.length === count) {
      const lower = Math.floor(cursor);
      const upper = Math.min(count - 1, lower + 1);
      const mix = cursor - lower;
      const focus = spots[lower] * (1 - mix) + spots[upper] * mix;
      shift.style.transform = `translate3d(0, ${viewCenter.current - focus}px, 0)`;
    }
    return projects[Math.round(cursor)]?.repo ?? null;
  }

  function placeEngage(scrollY: number) {
    const ramp = Math.max(window.innerHeight * 0.55, 1);
    const start = pinStart.current;
    const end = start + pinSpan.current;
    const enter = smoothstep((scrollY - start) / ramp);
    const leave = smoothstep((end - scrollY) / ramp);
    const engage = scrollY <= start || scrollY >= end ? 0 : Math.min(enter, leave);
    engageRef.current = engage;
    pinRef.current?.style.setProperty("--engage", engage.toFixed(4));
  }

  function scrollToProject(next: string, behavior: ScrollBehavior) {
    const index = projects.findIndex((item) => item.repo === next);
    if (index < 0) return;
    const count = Math.max(projects.length, 1);
    const top = pinStart.current + pinSpan.current * ((index + 0.5) / count);
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  function remember(next: string) {
    const url = new URL(window.location.href);
    url.hash = next;
    history.replaceState(null, "", url);
  }

  useLayoutEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("device");
    const saved = sessionStorage.getItem("folio-device");
    if (param === "phone" || (param !== "laptop" && saved === "iphone")) setKind("iphone");
    else if (param === "laptop" || saved === "macbook") setKind("macbook");
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
        placeEngage(window.scrollY);
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
    if (!wide) return;
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
  }, [projects, wide]);

  useLayoutEffect(() => {
    measure();
    placeEngage(window.scrollY);
    focusAt(window.scrollY);
    placeMark(repo);
  }, [repo, projects, wide]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => {
      measure();
      placeEngage(window.scrollY);
      focusAt(window.scrollY);
      placeMark(repoRef.current);
    });
    observer.observe(track);
    if (pinRef.current) observer.observe(pinRef.current);
    if (listRef.current) observer.observe(listRef.current);
    if (viewRef.current) observer.observe(viewRef.current);
    const onResize = () => {
      measure();
      placeEngage(window.scrollY);
      focusAt(window.scrollY);
      placeMark(repoRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [projects, wide]);

  const actions = useRef({
    pick: (_index: number) => {},
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable], iframe")) return;
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
  const phoneSurface = project.surfaces.find((item) => item.device === "iphone") ?? surface;
  const projectIndex = projects.findIndex((item) => item.repo === project.repo);
  const distinctSurfaces =
    new Set(project.surfaces.map((item) => item.src)).size > 1 ? project.surfaces : [];

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

  actions.current.pick = (index) => {
    const next = projects[index];
    if (next) select(next.repo);
  };

  const captionLinks = [
    ...project.sources,
    { label: "LinkedIn", href: links.linkedin },
    ...(project.onResume ? [{ label: "CV", href: "/cv.pdf" }] : []),
  ];

  return (
    <section
      id="work"
      ref={trackRef}
      aria-labelledby="work-heading"
      className="work-track fade-in"
      style={{ ["--work-steps" as string]: Math.max(projects.length - 1, 1) }}
    >
      <div
        ref={pinRef}
        className="work-pin"
        style={
          wide === false
            ? { width: "100vw", marginLeft: "calc(50% - 50vw)", paddingTop: 0, paddingBottom: 0 }
            : undefined
        }
      >
      {wide === false ? (
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[var(--bg)]">
          <MobileScreen src={phoneSurface?.src ?? ""} title={`${project.title} on a phone`} />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-5 pt-24 [&_a]:pointer-events-auto"
            style={{
              paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
              background:
                "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--bg) 72%, transparent) 28%, var(--bg) 52%, var(--bg) 100%)",
            }}
          >
            <div key={project.repo} className="work-cloud-copy mx-auto w-full max-w-lg">
              <h2 id="work-heading" className="font-mono text-[11px] tracking-[0.16em] uppercase">
                My work
                <span className="px-2 font-normal text-muted">
                  {String(projectIndex + 1).padStart(2, "0")}
                  <span className="px-1">/</span>
                  {String(projects.length).padStart(2, "0")}
                </span>
              </h2>
              <p className="mt-3 text-[clamp(1.7rem,7vw,2.4rem)] font-bold leading-none tracking-[-0.045em]">
                {project.title}
              </p>
              <p className="mt-3 line-clamp-2 text-base leading-6">{project.intro || project.summary}</p>
              <p className="mt-2 font-mono text-[11px] tracking-[0.02em] text-muted">
                {[project.stack, project.meta].filter(Boolean).join(" · ")}
              </p>
              <SourceLinks sources={captionLinks} className="mt-3" />
            </div>
          </div>
        </div>
      ) : null}
      {wide ? (
      <>
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
            onClick={copyLink}
            aria-live="polite"
            className={`copy-sheen tap shrink-0 border border-black bg-white px-3 py-3 text-sm font-bold ${copied ? "is-copied" : ""}`}
          >
            <CopyLabel copied={copied} label="Link" />
          </button>
      </div>
      <div className="work-layout grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_12.5rem] gap-3 lg:grid-rows-1">
        <div className="group flex min-h-0 min-w-0 flex-col">
          <div className="relative min-h-0 flex-1">
            <div
              role="application"
              aria-label={`${project.title} on ${device.label}`}
              className="h-full min-h-0 w-full"
            >
              <DeviceStage
                kind={kind}
                src={surface?.src ?? ""}
                title={`${project.title} on ${device.label}`}
                engageRef={engageRef}
              />
            </div>
          </div>
          <div className="mt-3 max-w-xl shrink-0">
            <p className="flex items-baseline justify-between gap-3 font-mono text-[11px] tracking-[0.02em] text-muted">
              <span className="min-w-0">{[project.stack, project.meta].filter(Boolean).join(" · ")}</span>
              <span className="shrink-0 tabular-nums">
                {String(projectIndex + 1).padStart(2, "0")}
                <span className="px-1">/</span>
                {String(projects.length).padStart(2, "0")}
              </span>
            </p>
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
          <SourceLinks sources={captionLinks} className="mt-2 shrink-0" />
          <div className="mt-3 flex justify-end">
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

        <div ref={viewRef} className="work-view relative min-h-0 overflow-hidden">
          <div ref={shiftRef} className="work-shift">
            <ol ref={listRef} className="relative min-w-0 border-b border-black" aria-label="Projects">
              <span ref={markRef} aria-hidden="true" className="spring-mark top-0 left-0 h-px w-full opacity-0" />
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
                    className={`spring-ink relative z-[1] border-t border-black ${selected ? "text-white" : "text-black"}`}
                  >
                    <button
                      type="button"
                      aria-current={selected ? "true" : undefined}
                      onClick={() => select(item.repo)}
                      className="tap flex w-full items-start gap-3 px-3 pt-3 text-left"
                    >
                      <span className="font-mono text-[11px] tracking-[0.14em]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold leading-tight tracking-[-0.03em]">{item.title}</span>
                        {selected ? null : (
                          <>
                            <span className="mt-1.5 block line-clamp-2 text-sm leading-6">{item.summary}</span>
                            {item.meta ? (
                              <span className="mt-1.5 block font-mono text-[11px] leading-none text-muted">{item.meta}</span>
                            ) : null}
                          </>
                        )}
                      </span>
                    </button>
                    {selected && item.bullets.length > 0 ? (
                      <div className="px-3 pb-3 pl-9">
                        {item.onResume ? (
                          <p className="font-mono text-[10px] tracking-[0.16em] opacity-70">CV</p>
                        ) : null}
                        <ul className={`${item.onResume ? "mt-1.5" : ""} space-y-1 text-sm leading-5`}>
                          {item.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <SourceLinks sources={item.sources} className="px-3 pb-2.5 pl-9" />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
      </>
      ) : wide === null ? (
        <h2 id="work-heading" className="sr-only">
          My work
        </h2>
      ) : null}
      </div>
    </section>
  );
}
