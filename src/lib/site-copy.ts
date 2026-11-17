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
      "NaučMěTo is still in development. It takes a PDF, slides, or notes and turns them into a quiz, a cheat sheet, and flashcards. Supabase handles the account, the files, and the database.",
    tags: ["Web"],
  },
  perimeter: {
    intro:
      "Perimeter is a small security desk for this site. It reads the response and says, in plain language, what the browser is being told.",
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
    headline: "Cybersecurity.",
    intro: "Brain is what I ship. NaučMěTo is still in development.",
    note: linkedinIntro,
    focus: ["Cybersecurity"],
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
  const seen = new Set<string>();
  const projectOrder: string[] = [];
  for (const repo of requested) {
    if (!projects[repo] || seen.has(repo)) continue;
    seen.add(repo);
    projectOrder.push(repo);
  }
  for (const item of selectedRepos) {
    if (seen.has(item.repo)) continue;
    projectOrder.push(item.repo);
  }

  const skillRows = Array.isArray(record.skills) ? record.skills : skills;
  const parsedSkills = skillRows
    .map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return { label: clip(row.label, 40), value: clip(row.value, 160) };
    })
    .filter((item) => item.label && item.value)
    .slice(0, 8);
  const focus = lines(record.focus, 6, 32);
  const likeLines = lines(record.likes, 8, 40);
  return {
    headline: clip(record.headline, 160) || "Cybersecurity.",
    intro: clip(record.intro, 800) || "Brain is what I ship. NaučMěTo is still in development.",
    note: clip(record.note, 400) || linkedinIntro,
    focus: focus.length ? focus : ["Cybersecurity"],
    practice: clip(record.practice, 600) || practice,
    likes: likeLines.length ? likeLines : [...likes],
    skills: parsedSkills.length ? parsedSkills : skills.map((item) => ({ ...item })),
    projectOrder,
    projects,
  };
}

export function readSiteFile() {
  try {
    return normalize(JSON.parse(readFileSync(FILE, "utf8")));
  } catch {
    return defaultSiteCopy();
  }
}

export function siteFilePath() {
  return FILE;
}
