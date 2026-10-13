import type { ShowcaseProject } from "@/components/showcase";
import { ShowcaseSlot } from "@/components/showcase-slot";
import { SiteHeader } from "@/components/site-header";
import {
  education,
  certification,
  links,
  linkedinIntro,
  selectedPosts,
  selectedRepos,
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
        <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pb-14 pt-8 sm:gap-12 sm:pb-20 sm:pt-14">
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
          <img
            src="/portrait"
            alt="Filip Jarolím"
            width={460}
            height={460}
            fetchPriority="high"
            className="size-24 rounded-full object-cover object-[center_18%] sm:size-36 md:size-44 lg:size-52"
          />
        </section>

        <ShowcaseSlot projects={showcaseProjects} />

        <section aria-labelledby="linkedin-heading" className="pt-20 sm:pt-28">
          <div className="mb-8 flex items-baseline justify-between gap-6">
            <h2
              id="linkedin-heading"
              className="text-xs font-bold uppercase tracking-[0.22em]"
            >
              LinkedIn
            </h2>
            <a
              href={links.linkedin}
              target="_blank"
              rel="me noreferrer"
              className="link-draw font-mono text-xs tracking-[0.14em]"
            >
              Profile
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <article>
              <h3 className="font-mono text-xs tracking-[0.16em]">Education</h3>
              <p className="mt-3 text-2xl font-bold tracking-tight">
                {education.degree}
              </p>
              <p className="mt-2 text-base leading-relaxed">
                {education.school}, {education.faculty}
              </p>
              <p className="mt-1 font-mono text-xs tracking-[0.04em]">
                {education.dates} · {education.location}
              </p>
            </article>
            <article>
              <h3 className="font-mono text-xs tracking-[0.16em]">
                Certification
              </h3>
              <p className="mt-3 text-2xl font-bold tracking-tight">
                {certification.title}
              </p>
              <p className="mt-2 font-mono text-xs tracking-[0.04em]">
                {certification.detail}
              </p>
            </article>
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

        <footer className="mt-20 border-t border-black pt-10 sm:mt-28">
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
