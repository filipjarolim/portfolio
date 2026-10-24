import { Vault } from "@lucasmarkes/hairline/react";
import { Hobbies } from "@/components/hobbies";
import { StudyList } from "@/components/study-list";
import { courses } from "@/content/courses";
import { CopyControl } from "@/components/copy-control";
import { HeroIntro } from "@/components/hero-intro";
import type { ShowcaseProject } from "@/components/showcase";
import type { ProjectSurface, SelectedRepo } from "@/content/selection";
import { ShowcaseSlot } from "@/components/showcase-slot";
import { SiteHeader } from "@/components/site-header";
import {
  education,
  certification,
  links,
  selectedPosts,
  selectedRepos,
} from "@/content/selection";
import { formatStars, formatUpdated, repoUrl } from "@/lib/format";
import { getGithubProfile, getSelectedRepoData } from "@/lib/github";
import { getSiteCopy } from "@/lib/site-copy";
import { getSiteUrl } from "@/lib/site";

function sourcesFor(item: SelectedRepo, github: string | null, homepage: string | null) {
  if (item.sources?.length) return item.sources;
  const sources: { label: string; href: string }[] = [];
  if (item.githubRepo !== null) {
    sources.push({ label: "GitHub", href: github ?? repoUrl(item.githubRepo ?? item.repo) });
  }
  const site = item.site || homepage;
  if (site) sources.push({ label: "Live", href: site });
  return sources;
}

function surfacesFor(item: SelectedRepo): ProjectSurface[] {
  const listed = item.surfaces ?? [];
  if (listed.length > 0) {
    const mac = listed.find((surface) => surface.device === "macbook");
    const phone = listed.find((surface) => surface.device === "iphone");
    const fallback = listed[0];
    return [
      mac ?? { device: "macbook", label: fallback.label, src: fallback.src },
      phone ?? { device: "iphone", label: fallback.label, src: fallback.src },
    ];
  }
  const src = item.embed ?? `/screen/${item.repo}`;
  return [
    { device: "macbook", label: "Web", src },
    { device: "iphone", label: "Phone", src },
  ];
}

export default async function Home() {
  const profile = await getGithubProfile();
  const copy = await getSiteCopy();
  const ordered = [...selectedRepos].sort(
    (a, b) => copy.projectOrder.indexOf(a.repo) - copy.projectOrder.indexOf(b.repo),
  );
  const visible = ordered.filter((item) => !copy.projects[item.repo]?.hidden);
  const liveNames = visible.flatMap((item) => {
    const name = item.githubRepo === null ? null : (item.githubRepo ?? item.repo);
    return name ? [name] : [];
  });
  const live = await getSelectedRepoData(liveNames);

  const showcaseProjects: ShowcaseProject[] = visible.map((item) => {
    const written = copy.projects[item.repo];
    const githubName = item.githubRepo === null ? null : (item.githubRepo ?? item.repo);
    const repo = githubName ? live[githubName] : null;
    const summary = written?.summary || item.summary;
    const meta = [
      item.dates ??
        (formatUpdated(repo?.pushedAt ?? null)
          ? `Updated ${formatUpdated(repo?.pushedAt ?? null)}`
          : null),
      formatStars(repo?.stars ?? 0),
    ].filter(Boolean);

    return {
      repo: item.repo,
      title: written?.title || item.title,
      summary,
      intro: written?.intro || summary,
      tags: written?.tags ?? [],
      stack: item.stack,
      meta: meta.join(" · "),
      sources: sourcesFor(item, repo?.htmlUrl ?? null, repo?.homepage ?? null),
      surfaces: surfacesFor(item),
    };
  });

  const site = getSiteUrl();
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    description: profile.bio,
    email: `mailto:${links.email}`,
    url: site.toString(),
    image: new URL("/portrait", site).toString(),
    jobTitle: "Cybersecurity student",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Brno",
      addressCountry: "CZ",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: education.school,
    },
    knowsAbout: [
      "Cybersecurity",
      "Mathematical foundations",
      "Programming",
      "Computer systems",
      "Databases",
    ],
    sameAs: [links.github, links.linkedin],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replaceAll("<", "\\u003c") }}
      />
      <link rel="preload" href="/models/macbook-air-m2.glb" as="fetch" />
      <link rel="preload" href="/models/iphone-15-pro-max.glb" as="fetch" />
      <SiteHeader />
      <main
        id="content"
        className="mx-auto w-full max-w-6xl px-4 pb-24 pt-[calc(3.5rem+env(safe-area-inset-top))] sm:px-8 sm:pb-32 sm:pt-[calc(4rem+env(safe-area-inset-top))]"
      >
        <section className="hero-track">
          <div className="drift">
          <div className="arrive">
          <HeroIntro>
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.14em] sm:text-xs sm:tracking-[0.16em]">
              {profile.location ? (
                <>
                  <span aria-hidden="true">📍 </span>
                  {profile.location}
                </>
              ) : null}
              {profile.location && profile.hireable ? "  ·  " : null}
              {profile.hireable ? "Open to work" : null}
            </p>
            <h1 className="mt-6 text-[clamp(2.15rem,6.6vw,6.25rem)] font-bold leading-[0.92] tracking-[-0.055em] break-words">
              <span className="block">Filip</span>
              <span className="block">Jarolím</span>
            </h1>
            <p className="mt-8 max-w-xl text-xl font-medium leading-snug sm:mt-10 sm:text-3xl">
              {copy.headline}
            </p>
            <p className="mt-8 max-w-xl text-base leading-8 sm:mt-10 sm:text-lg">{copy.intro}</p>
            <p className="mt-8 max-w-xl text-base leading-8">{copy.note}</p>
          </div>
          </HeroIntro>
          </div>
          </div>
        </section>

        <ShowcaseSlot projects={showcaseProjects} />

        <section id="about" className="about-track defer pt-24 sm:pt-36" aria-labelledby="about-heading">
          <div className="drift">
          <div className="seen">
          <div className="about-pin">
            <h2 id="about-heading" className="text-xs font-bold uppercase tracking-[0.22em]">
              About
            </h2>
            <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-3">
              {copy.skills.map((skill) => (
                <li key={skill.label} className="border-t border-black pt-3">
                  <p className="font-mono text-xs tracking-[0.16em] uppercase">{skill.label}</p>
                  <p className="mt-2 text-base font-bold leading-snug sm:text-lg">{skill.value}</p>
                </li>
              ))}
            </ul>
            <div className="mt-16 max-w-2xl border-t border-black pt-8">
              <h3 className="font-mono text-xs tracking-[0.16em] uppercase">Coding</h3>
              <p className="mt-4 text-base leading-7 sm:text-lg sm:leading-8">{copy.practice}</p>
            </div>
            <Hobbies likes={copy.likes} />
          </div>
          </div>
          </div>
        </section>

        <section id="study" aria-labelledby="study-heading" className="defer pt-28 sm:pt-40">
          <div className="drift">
          <div className="seen">
          <div className="grid items-start gap-x-16 gap-y-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <h2
              id="study-heading"
              className="text-xs font-bold uppercase tracking-[0.22em] lg:col-start-2"
            >
              Study
            </h2>
            <div className="row-start-2 w-full max-w-72 justify-self-start lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <Vault
                theme="auto"
                intensity={0.7}
                play
                label="A vault door"
                className="hairline-ink w-full"
              />
            </div>
            <div className="min-w-0 lg:col-start-2">
              <p className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{education.degree}</p>
              <p className="mt-3 text-base leading-7">
                {education.school}, {education.faculty}
              </p>
              <p className="mt-2 font-mono text-xs tracking-[0.04em] text-muted">
                Autumn 2026 · first semester · {education.location}
              </p>
              <p className="mt-1 font-mono text-xs tracking-[0.04em] text-muted">
                {certification.title} · {certification.detail}
              </p>
              <StudyList courses={courses} />
              <a
                href={links.linkedin}
                target="_blank"
                rel="me noreferrer"
                className="link-draw mt-6 inline-flex items-baseline gap-3 text-sm font-bold"
              >
                LinkedIn
                <span className="font-mono text-xs font-normal tracking-[0.08em]">Open</span>
              </a>
            </div>
          </div>
          </div>
          </div>

          {selectedPosts.length > 0 ? (
            <ol className="mt-12 border-b border-black">
              {selectedPosts.map((post) => (
                <li key={post.url} className="tone border-t border-black hover:bg-black hover:text-white">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="tap flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <span className="text-xl font-bold tracking-tight">
                      {post.title}
                    </span>
                    <span className="font-mono text-xs tracking-[0.08em]">
                      {post.date}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        <div className="drift">
        <footer className="seen mt-20 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-black pt-10 sm:mt-28">
          <a
            href={`mailto:${links.email}`}
            className="link-draw text-[clamp(1.05rem,4.2vw,2.75rem)] font-bold tracking-[-0.04em] break-all"
          >
            {links.email}
          </a>
          <CopyControl
            value={links.email}
            className="tap shrink-0 border border-black px-3 py-2 text-sm font-bold"
          />
        </footer>
        </div>
      </main>
    </>
  );
}
