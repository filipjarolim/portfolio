"use client";

import { useEffect, useState } from "react";
import { DeviceStage, type DeviceKind } from "@/components/device-stage";
import { tap } from "@/lib/haptic";

const DEVICE_MODELS = ["/models/macbook-air-m2.glb", "/models/iphone-15-pro-max.glb"];

export type ShowcaseProject = {
  repo: string;
  title: string;
  summary: string;
  stack: string;
  meta: string;
  site: string | null;
  github: string;
  screen: string;
};

const devices: { kind: DeviceKind; label: string; credit: string; creditHref: string }[] = [
  {
    kind: "macbook",
    label: "MacBook",
    credit: "rtql8d",
    creditHref:
      "https://sketchfab.com/3d-models/macbook-air-m2-786fa23d402a4f90ae36c4168997f9cc",
  },
  {
    kind: "iphone",
    label: "iPhone",
    credit: "polyman Studio",
    creditHref:
      "https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7",
  },
];

function repoFromHash(projects: ShowcaseProject[]) {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return projects.find((project) => project.repo === id)?.repo ?? null;
}

export default function Showcase({ projects }: { projects: ShowcaseProject[] }) {
  const [kind, setKind] = useState<DeviceKind>("macbook");
  const [repo, setRepo] = useState(projects[0]?.repo ?? "");

  useEffect(() => {
    const sync = () => {
      const match = repoFromHash(projects);
      if (match) setRepo(match);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [projects]);

  useEffect(() => {
    const links = [...DEVICE_MODELS, ...projects.map((project) => project.screen)].map((href) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      link.as = href.endsWith(".glb") ? "fetch" : "document";
      document.head.appendChild(link);
      return link;
    });
    return () => {
      for (const link of links) link.remove();
    };
  }, [projects]);

  const project = projects.find((item) => item.repo === repo) ?? projects[0];
  const device = devices.find((item) => item.kind === kind) ?? devices[0];
  if (!project) return null;

  function select(next: string) {
    if (next === repo) return;
    tap(10);
    setRepo(next);
    const url = new URL(window.location.href);
    url.hash = next;
    history.replaceState(null, "", url);
  }

  function choose(next: DeviceKind) {
    if (next === kind) return;
    tap(14);
    setKind(next);
  }

  return (
    <section id="work" aria-labelledby="work-heading">
      <h2 id="work-heading" className="mb-6 text-xs font-bold uppercase tracking-[0.22em] sm:mb-8">
        My work
      </h2>

      <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,24rem)] lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-20">
          <div
            role="radiogroup"
            aria-label="Device"
            className="mb-4 grid w-full max-w-xs grid-cols-2 border border-black"
          >
            {devices.map((item) => {
              const active = item.kind === kind;
              return (
                <button
                  key={item.kind}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => choose(item.kind)}
                  className={`px-3 py-3 text-left text-sm font-bold ${
                    active ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div
            role="application"
            aria-label={`${project.title} on ${device.label}`}
            className={
              kind === "iphone"
                ? "mx-auto h-[min(82svh,52rem)] min-h-[30rem] w-full max-w-[min(100%,30rem)]"
                : "h-[min(76svh,50rem)] min-h-[22rem] w-full"
            }
          >
            <DeviceStage
              kind={kind}
              src={project.screen}
              title={`${project.title} on ${device.label}`}
            />
          </div>
          <p className="mt-4 font-mono text-[11px] leading-relaxed">
            {device.kind === "macbook" ? "MacBook Air M2" : "iPhone 15 Pro Max"}. Model
            by{" "}
            <a href={device.creditHref} target="_blank" rel="noreferrer" className="link-draw">
              {device.credit}
            </a>
            , CC BY 4.0
          </p>
        </div>

        <ol className="min-w-0 border-b border-black" aria-label="Projects">
          {projects.map((item, index) => {
            const selected = item.repo === project.repo;
            return (
              <li
                key={item.repo}
                className={`tone border-t border-black ${
                  selected ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                <button
                  type="button"
                  aria-current={selected ? "true" : undefined}
                  onClick={() => select(item.repo)}
                  className="tap flex w-full flex-col gap-3 px-4 pb-3 pt-6 text-left sm:pt-7"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-xs tracking-[0.14em]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 text-[clamp(1.35rem,4.5vw,2.15rem)] font-bold leading-none tracking-[-0.04em] break-words">
                      {item.title}
                    </span>
                  </span>
                  <span className="block pl-0 text-sm leading-snug sm:pl-10">{item.summary}</span>
                  <span className="block font-mono text-xs tracking-[0.04em] sm:pl-10">
                    {item.stack}
                    {item.meta ? ` · ${item.meta}` : ""}
                  </span>
                </button>
                <p className="flex gap-4 px-4 pb-6 font-mono text-xs tracking-[0.04em] sm:pl-14">
                  <a href={item.github} target="_blank" rel="noreferrer" className="link-draw">
                    GitHub
                  </a>
                  {item.site ? (
                    <a href={item.site} target="_blank" rel="noreferrer" className="link-draw">
                      Live
                    </a>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
