import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PerimeterDesk } from "@/components/perimeter-desk";
import { ScreenGuard } from "@/components/screen-guard";
import { selectedRepos } from "@/content/selection";
import { getRepoReadmeHtml } from "@/lib/github";
import { perimeterReadings } from "@/lib/perimeter";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return selectedRepos.map((item) => ({ repo: item.repo }));
}

export default async function ProjectScreen({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const project = selectedRepos.find((item) => item.repo === repo);
  if (!project) notFound();
  if (project.repo === "perimeter") {
    const readings = await perimeterReadings();
    return (
      <>
        <ScreenGuard />
        <PerimeterDesk readings={readings} />
      </>
    );
  }

  const copy = await getSiteCopy();
  const written = copy.projects[project.repo];
  const title = written?.title || project.title;
  const intro = written?.intro || written?.summary || project.summary;
  const bullets = written?.bullets.length ? written.bullets : project.bullets;

  const readme = await getRepoReadmeHtml(project.repo);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-10 sm:py-14">
      <ScreenGuard />
      <p className="font-mono text-xs tracking-[0.14em]">{project.stack}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-snug">{intro}</p>
      {project.dates ? (
        <p className="mt-3 font-mono text-xs tracking-[0.04em]">{project.dates}</p>
      ) : null}
      <ul className="mt-6 space-y-2 text-base leading-snug">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      {readme ? (
        <article
          className="screen-readme mt-10 border-t border-black pt-8"
          dangerouslySetInnerHTML={{ __html: readme }}
        />
      ) : null}
    </main>
  );
}
