import { revalidatePath, revalidateTag } from "next/cache";
import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { selectedRepos } from "@/content/selection";
import { normalize, siteFilePath, type SiteCopy } from "@/lib/site-copy";

const exec = promisify(execFile);

function git(args: string[]) {
  return exec("git", args, {
    cwd: process.cwd(),
    timeout: 20000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
}

async function publishWithGit() {
  const path = "content/site.json";
  await git(["add", "--", path]);
  let committed = false;
  try {
    await git(["diff", "--cached", "--quiet", "--", path]);
  } catch {
    await git(["commit", "-m", "Update the site copy from the admin.", "--", path]);
    committed = true;
  }
  await git(["push", "origin", "HEAD"]);
  return committed ? "Pushed to GitHub." : "Already on GitHub.";
}

async function publishWithApi(json: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return "";
  let remote = "https://github.com/filipjarolim/portfolio.git";
  try {
    const url = await git(["remote", "get-url", "origin"]);
    remote = url.stdout.trim() || remote;
  } catch {
    // The known portfolio remote is the fallback.
  }
  const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (!match) return "Could not read the GitHub repo.";
  const repo = `${match[1]}/${match[2]}`;
  const api = `https://api.github.com/repos/${repo}/contents/content/site.json`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "filip-folio",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const current = await fetch(api, { headers });
  const sha = current.ok ? ((await current.json()) as { sha?: string }).sha : undefined;
  const response = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "Update the site copy from the admin.",
      content: Buffer.from(json).toString("base64"),
      branch: "main",
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) return `GitHub rejected the save (${response.status}).`;
  return "Pushed to GitHub.";
}

export async function saveSiteCopy(input: unknown) {
  const copy: SiteCopy = normalize(input);
  const json = `${JSON.stringify(copy, null, 2)}\n`;
  let local = false;
  try {
    mkdirSync(dirname(siteFilePath()), { recursive: true });
    writeFileSync(siteFilePath(), json);
    local = true;
  } catch {
    local = false;
  }

  let github = "";
  if (!process.env.VERCEL) {
    try {
      github = await publishWithGit();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Git push failed.";
      github = message.split("\n").slice(-3).join(" ").slice(0, 280);
    }
  }
  if (!github.startsWith("Pushed") && !github.startsWith("Already")) {
    const viaApi = await publishWithApi(json);
    if (viaApi) github = viaApi;
  }
  if (!local && !github.startsWith("Pushed") && !github.startsWith("Already")) {
    throw new Error(github || "The file could not be saved.");
  }

  revalidateTag("site-copy", { expire: 0 });
  revalidatePath("/");
  for (const item of selectedRepos) revalidatePath(`/screen/${item.repo}`);
  const detail = local
    ? github.startsWith("Pushed") || github.startsWith("Already")
      ? github
      : `Saved on this machine. GitHub: ${github || "not updated."}`
    : github;
  return { copy, detail };
}
