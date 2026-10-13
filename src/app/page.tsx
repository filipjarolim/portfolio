import { Vault } from "@lucasmarkes/hairline/react";
import { HeroIntro } from "@/components/hero-intro";
import type { ShowcaseProject } from "@/components/showcase";
import { ShowcaseSlot } from "@/components/showcase-slot";
import { SiteHeader } from "@/components/site-header";
import {
  education,
  certification,
  likes,
  links,
  linkedinIntro,
  selectedPosts,
  selectedRepos,
  skills,
} from "@/content/selection";
import { formatStars, formatUpdated, repoUrl } from "@/lib/format";
import { getGithubProfile, getSelectedRepoData } from "@/lib/github";
import { getSiteUrl } from "@/lib/site";

export default async function Home() {
  const profile = await getGithubProfile();
  const live = await getSelectedRepoData(selectedRepos.map((item) => item.repo));

  const showcaseProjects: ShowcaseProject[] = selectedRepos.map((item) => {
    const repo = live[item.repo];
    const summary =
      item.preferLiveDescription && repo?.description ? repo.description : item.summary;
    const meta = [
      item.dates ??
        (formatUpdated(repo?.pushedAt ?? null)
          ? `Updated ${formatUpdated(repo?.pushedAt ?? null)}`
          : null),
      formatStars(repo?.stars ?? 0),
    ].filter(Boolean);

    return {
      repo: item.repo,
      title: item.title,
      summary,
      stack: item.stack,
      meta: meta.join(" · "),
      site: item.site || repo?.homepage || null,
      github: repo?.htmlUrl ?? repoUrl(item.repo),
      screen: item.embed ?? `/screen/${item.repo}`,
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
    knowsAbout: ["Cybersecurity", "Network architecture", "Cryptography"],
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
        className="mx-auto w-full max-w-6xl px-4 pb-20 pt-[calc(3.5rem+env(safe-area-inset-top))] sm:px-8 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top))]"
      >
        <section className="hero-track">
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
            <h1 className="mt-4 text-[clamp(2.15rem,6.6vw,6.25rem)] font-bold leading-[0.86] tracking-[-0.055em] break-words">
              <span className="block">Filip</span>
              <span className="block">Jarolím</span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-snug sm:mt-8 sm:text-2xl">
              {profile.bio}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed sm:mt-5 sm:text-base">
              {linkedinIntro}
            </p>
          </div>
          </HeroIntro>
        </section>

        <ShowcaseSlot projects={showcaseProjects} />

        <section id="about" className="about-track" aria-labelledby="about-heading">
          <div className="about-pin">
            <h2 id="about-heading" className="text-xs font-bold uppercase tracking-[0.22em]">
              About
            </h2>
            <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-3">
              {skills.map((skill) => (
                <li key={skill.label} className="border-t border-black pt-3">
                  <p className="font-mono text-xs tracking-[0.16em] uppercase">{skill.label}</p>
                  <p className="mt-2 text-base font-bold leading-snug sm:text-lg">{skill.value}</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 border-t border-black pt-4 font-mono text-xs tracking-[0.16em] uppercase">
              I like
            </p>
            <ol className="mt-4">
              {likes.map((like, index) => (
                <li
                  key={like}
                  className={`like like-${index + 1} flex items-baseline gap-4 sm:gap-6`}
                >
                  <span className="font-mono text-xs tracking-[0.14em]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[clamp(2.4rem,8vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.05em]">
                    {like}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="linkedin-heading" className="pt-20 sm:pt-28">
          <div className="grid items-center gap-x-16 gap-y-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <h2
              id="linkedin-heading"
              className="text-xs font-bold uppercase tracking-[0.22em] lg:col-start-2"
            >
              LinkedIn
            </h2>
            <Vault
              theme="light"
              intensity={0.7}
              play
              label="A vault door"
              className="hairline-ink row-start-2 w-full max-w-72 justify-self-start lg:col-start-1 lg:row-span-2 lg:row-start-1"
            />
            <div className="late min-w-0 border-b border-black lg:col-start-2">
            <article className="border-t border-black py-5 sm:py-6">
              <h3 className="font-mono text-xs tracking-[0.16em] uppercase">Education</h3>
              <p className="mt-3 text-2xl font-bold tracking-[-0.03em]">{education.degree}</p>
              <p className="mt-2 text-base leading-relaxed">
                {education.school}, {education.faculty}
              </p>
              <p className="mt-1 font-mono text-xs tracking-[0.04em]">
                {education.dates} · {education.location}
              </p>
            </article>
            <article className="border-t border-black py-5 sm:py-6">
              <h3 className="font-mono text-xs tracking-[0.16em] uppercase">Certification</h3>
              <p className="mt-3 text-2xl font-bold tracking-[-0.03em]">{certification.title}</p>
              <p className="mt-2 font-mono text-xs tracking-[0.04em]">{certification.detail}</p>
            </article>
            <a
              href={links.linkedin}
              target="_blank"
              rel="me noreferrer"
              className="link-draw flex items-baseline justify-between gap-4 border-t border-black py-5 font-bold tracking-tight sm:py-6 sm:text-xl"
            >
              Profile
              <span className="font-mono text-xs font-normal tracking-[0.08em]">Open</span>
            </a>
            </div>
          </div>

          {selectedPosts.length > 0 ? (
            <ol className="mt-12 border-b border-black">
              {selectedPosts.map((post) => (
                <li key={post.url} className="tone rise border-t border-black hover:bg-black hover:text-white">
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

        <footer className="late mt-20 border-t border-black pt-10 sm:mt-28">
          <a
            href={`mailto:${links.email}`}
            className="link-draw text-[clamp(1.05rem,4.2vw,2.75rem)] font-bold tracking-[-0.04em] break-all"
          >
            {links.email}
          </a>
        </footer>
      </main>
    </>
  );
}
