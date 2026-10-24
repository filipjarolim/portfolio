import { cacheLife, cacheTag } from "next/cache";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  likes,
  linkedinIntro,
  practice,
  selectedRepos,
  skills,
} from "@/content/selection";

export type ProjectCopy = {
  title: string;
  summary: string;
  intro: string;
  bullets: string[];
  tags: string[];
  hidden: boolean;
};

export type SiteCopy = {
  headline: string;
  intro: string;
  note: string;
  focus: string[];
  practice: string;
  likes: string[];
  skills: { label: string; value: string }[];
  projectOrder: string[];
  projects: Record<string, ProjectCopy>;
};

const FILE = join(process.cwd(), "content", "site.json");

const intros: Record<string, { intro: string; tags: string[] }> = {
  brainCore: {
    intro:
      "Brain is a local second brain. The vault, the command line, the web graph, and the MCP server stay on the machine. Paste text, a link, or a screenshot and it becomes a note.",
    tags: ["Web"],
  },
  "Nauc-Me-To": {
    intro:
      "NaučMěTo takes a PDF, slides, or notes and turns them into a quiz, a cheat sheet, and flashcards. Each file keeps its notes and a workspace. Supabase handles the account, the files, and the database.",
    tags: ["Web"],
  },
  plavanilavia: {
    intro:
      "The site for Plavecká škola Lavia. The season lives in the repository, staff edit it in the admin, and a save commits to GitHub so Vercel can rebuild.",
    tags: ["Web"],
  },
  "Strakata-Turistika-ANDROID": {
    intro:
      "Strakatá turistika is a phone app and a website. The Flutter repository ships the GPS app for Android and iOS. The website is a second repository, for trips, GPX files, and the season board.",
    tags: ["Web", "Mobile"],
  },
  perimeter: {
    intro:
      "Perimeter is a small security desk for the sites already on this page. It reads each response and says, in plain language, what the browser is being told.",
    tags: ["Security"],
  },
};

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function lines(value: unknown, max: number, each: number) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [];
  return source
    .map((item) => clip(item, each))
    .filter(Boolean)
    .slice(0, max);
}

function projectCopy(repo: string, value: unknown): ProjectCopy {
  const base = selectedRepos.find((item) => item.repo === repo);
  const extra = intros[repo];
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    title: clip(record.title, 80) || base?.title || repo,
    summary: clip(record.summary, 280) || base?.summary || "",
    intro: clip(record.intro, 600) || extra?.intro || base?.summary || "",
    bullets: "bullets" in record ? lines(record.bullets, 8, 240) : [...(base?.bullets ?? [])],
    tags: "tags" in record ? lines(record.tags, 6, 24) : [...(extra?.tags ?? [])],
    hidden: record.hidden === true,
  };
}

export function defaultSiteCopy(): SiteCopy {
  return normalize({
    headline: "Cybersecurity and mobile apps.",
    intro: "The projects here are the software I ship now, on the web and on a phone.",
    note: linkedinIntro,
    focus: ["Cybersecurity", "Mobile apps"],
    practice,
    likes: [...likes],
    skills: skills.map((item) => ({ ...item })),
    projectOrder: selectedRepos.map((item) => item.repo),
    projects: Object.fromEntries(selectedRepos.map((item) => [item.repo, projectCopy(item.repo, {})])),
  });
}

export function normalize(input: unknown): SiteCopy {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const projects: Record<string, ProjectCopy> = {};
  const incoming =
    record.projects && typeof record.projects === "object"
      ? (record.projects as Record<string, unknown>)
      : {};
  for (const item of selectedRepos) projects[item.repo] = projectCopy(item.repo, incoming[item.repo]);

  const requested = Array.isArray(record.projectOrder) ? record.projectOrder.map((item) => clip(item, 80)) : [];
  const projectOrder = [
    ...requested.filter((repo) => projects[repo]),
    ...selectedRepos.map((item) => item.repo).filter((repo) => !requested.includes(repo)),
  ];

  const skillRows = Array.isArray(record.skills) ? record.skills : skills;
  return {
    headline: clip(record.headline, 160) || "Cybersecurity and mobile apps.",
    intro:
      clip(record.intro, 800) ||
      "The projects here are the software I ship now, on the web and on a phone.",
    note: clip(record.note, 400) || linkedinIntro,
    focus: lines(record.focus, 6, 32).length ? lines(record.focus, 6, 32) : ["Cybersecurity", "Mobile apps"],
    practice: clip(record.practice, 600) || practice,
    likes: lines(record.likes, 8, 40).length ? lines(record.likes, 8, 40) : [...likes],
    skills: skillRows
      .map((item) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return { label: clip(row.label, 40), value: clip(row.value, 160) };
      })
      .filter((item) => item.label && item.value)
      .slice(0, 8),
    projectOrder,
    projects,
  };
}

function readSiteFile() {
  try {
    return normalize(JSON.parse(readFileSync(FILE, "utf8")));
  } catch {
    return defaultSiteCopy();
  }
}

export async function getSiteCopy(): Promise<SiteCopy> {
  "use cache";
  cacheTag("site-copy");
  cacheLife("hours");
  return readSiteFile();
}

export function siteFilePath() {
  return FILE;
}
