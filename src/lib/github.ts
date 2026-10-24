import { cacheLife } from "next/cache";
import { fallbackProfile, githubUser } from "@/content/selection";

export type GithubProfile = {
  name: string;
  bio: string;
  location: string;
  publicRepos: number | null;
  hireable: boolean;
  htmlUrl: string;
};

export type LiveRepo = {
  description: string | null;
  stars: number;
  pushedAt: string | null;
  htmlUrl: string;
  homepage: string | null;
};

async function githubFetch(url: string, accept = "application/vnd.github+json") {
  const token = process.env.GITHUB_TOKEN;
  const headers = (authorized: boolean): HeadersInit => ({
    Accept: accept,
    "User-Agent": "filip-folio",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(authorized && token ? { Authorization: `Bearer ${token}` } : {}),
  });
  if (token) {
    const authed = await fetch(url, { cache: "no-store", headers: headers(true) });
    if (authed.ok) return authed;
  }
  return fetch(url, { cache: "no-store", headers: headers(false) });
}

export async function getGithubProfile(): Promise<GithubProfile> {
  "use cache";
  cacheLife("hours");

  const fallback: GithubProfile = {
    name: fallbackProfile.name,
    bio: fallbackProfile.bio,
    location: fallbackProfile.location,
    publicRepos: null,
    hireable: false,
    htmlUrl: `https://github.com/${githubUser}`,
  };

  try {
    const response = await githubFetch(`https://api.github.com/users/${githubUser}`);
    if (!response.ok) return fallback;

    const data = (await response.json()) as {
      name?: string | null;
      bio?: string | null;
      location?: string | null;
      public_repos?: number;
      hireable?: boolean | null;
      html_url?: string;
    };

    return {
      name: data.name || fallback.name,
      bio: data.bio || fallback.bio,
      location: data.location || fallback.location,
      publicRepos:
        typeof data.public_repos === "number" ? data.public_repos : null,
      hireable: data.hireable === true,
      htmlUrl: data.html_url || fallback.htmlUrl,
    };
  } catch {
    return fallback;
  }
}

export async function getSelectedRepoData(
  names: string[],
): Promise<Record<string, LiveRepo | null>> {
  "use cache";
  cacheLife("hours");

  const entries = await Promise.all(
    names.map(async (name) => {
      const fallbackUrl = `https://github.com/${githubUser}/${name}`;
      try {
        const response = await githubFetch(`https://api.github.com/repos/${githubUser}/${name}`);
        if (!response.ok) {
          return [name, null] as const;
        }

        const data = (await response.json()) as {
          description?: string | null;
          stargazers_count?: number;
          pushed_at?: string | null;
          html_url?: string;
          homepage?: string | null;
        };

        const homepage = data.homepage?.trim() || null;

        return [
          name,
          {
            description: data.description?.trim() || null,
            stars: data.stargazers_count ?? 0,
            pushedAt: data.pushed_at ?? null,
            htmlUrl: data.html_url || fallbackUrl,
            homepage,
          } satisfies LiveRepo,
        ] as const;
      } catch {
        return [name, null] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

export async function getRepoReadmeHtml(repo: string): Promise<string | null> {
  "use cache";
  cacheLife("hours");

  try {
    const response = await githubFetch(
      `https://api.github.com/repos/${githubUser}/${repo}/readme`,
      "application/vnd.github.html",
    );
    if (!response.ok) return null;
    const html = (await response.text()).trim();
    return html || null;
  } catch {
    return null;
  }
}
