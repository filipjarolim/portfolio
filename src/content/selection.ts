/**
 * What the site is allowed to show.
 * Add a repo name to feature it. Remove a line to hide it.
 * GitHub fills in the link, stars, and last update. No token required.
 * LinkedIn has no personal posts API, so posts appear only when you add them below.
 */

export const githubUser = "filipjarolim";

export const links = {
  github: "https://github.com/filipjarolim",
  linkedin: "https://www.linkedin.com/in/filip-jarolim",
  email: "jarolimfilip07@gmail.com",
} as const;

export const fallbackProfile = {
  name: "Filip Jarolím",
  bio: "Cybersecurity Aspirant | Focus: Network Architecture, Cryptography & CTF | Incoming FI MUNI",
  location: "Brno, Czech Republic",
} as const;

/** His public LinkedIn line, kept as written. */
export const linkedinIntro =
  "Open to entry-level roles, research projects, and internships across Cybersecurity, Data Analysis, and Technical Product Design.";

export const education = {
  school: "Masaryk University",
  faculty: "Faculty of Informatics",
  degree: "B.Sc. Cybersecurity",
  dates: "2026 — Present",
  location: "Brno, Czech Republic",
} as const;

export const certification = {
  title: "Cambridge English: First (FCE)",
  detail: "CEFR C1",
} as const;

export const skills = [
  { label: "Languages", value: "Python, TypeScript, Dart" },
  { label: "Frameworks", value: "Next.js, React, Flutter" },
  { label: "Tools", value: "Git, Linux, Supabase, Tailwind CSS" },
] as const;

/** Jobs, when there is one to list. Leave empty until then. */
export const experience: {
  role: string;
  org: string;
  location?: string;
  dates: string;
  bullets: string[];
}[] = [];

export type SelectedRepo = {
  repo: string;
  title: string;
  /** Used when the GitHub description is missing or too thin to stand alone. */
  summary: string;
  preferLiveDescription?: boolean;
  stack: string;
  site?: string;
  /**
   * What the device screen loads. Set when the public site refuses to be framed.
   * Otherwise the screen shows /screen/[repo].
   */
  embed?: string;
  /** A real date range, only when one exists outside GitHub. */
  dates?: string;
  bullets: string[];
};

export const selectedRepos: SelectedRepo[] = [
  {
    repo: "brainCore",
    title: "Brain",
    summary:
      "Local AI second brain: a Markdown vault, a CLI, a web graph, and an MCP server, all on your machine.",
    stack: "Python, TypeScript",
    bullets: [
      "Markdown vault with wikilinks and tags, plus a CLI, a web graph, and an MCP server.",
      "Capture turns pasted text, URLs, or screenshots into notes.",
      "Runs locally, with Ollama by default, or Groq or Gemini.",
    ],
  },
  {
    repo: "Nauc-Me-To",
    title: "NaučMěTo",
    summary:
      "Upload study material and get a quiz, a cheat sheet, and flashcards generated from it.",
    stack: "Next.js, TypeScript, Supabase",
    bullets: [
      "Upload a PDF, slides, or notes and get a quiz, a cheat sheet, and flashcards from the file.",
      "Notes and a workspace sit with each document.",
      "Supabase handles auth, storage, and the database.",
    ],
  },
  {
    repo: "plavanilavia",
    title: "Plavecká škola Lavia",
    summary:
      "The school site at plavanilaviabrno.cz. Next.js, no database, hosted on Vercel.",
    stack: "Next.js, TypeScript",
    site: "https://plavanilaviabrno.cz",
    embed: "/embed/lavia",
    bullets: [
      "Public site for Plavecká škola Lavia at plavanilaviabrno.cz.",
      "Next.js on Vercel, with season content stored in the repository.",
      "Staff edit that content in the admin page; a save commits to GitHub and Vercel rebuilds.",
    ],
  },
  {
    repo: "Strakata-Turistika-ANDROID",
    title: "Strakatá turistika",
    summary: "Flutter app for Strakatá turistika, built around GPS.",
    stack: "Flutter, Dart",
    dates: "Jan 2025 — Present",
    bullets: [
      "Flutter application for Strakatá turistika, built around GPS.",
      "Listed on LinkedIn as an active project since January 2025.",
    ],
  },
  {
    repo: "create-filip-app",
    title: "Create Filip App",
    summary:
      "CLI that scaffolds a Next.js app with TypeScript and Tailwind CSS.",
    preferLiveDescription: true,
    stack: "JavaScript, Next.js, Tailwind CSS",
    bullets: [
      "Scaffolds Next.js with the App Router, TypeScript, and Tailwind CSS.",
      "Interactive setup for components, themes, and the package manager.",
      "Published to run with npx create-filip-app.",
    ],
  },
];

export type SelectedPost = {
  url: string;
  title: string;
  date: string;
};

/** Paste a post URL, title, and date. Nothing is shown until you do. */
export const selectedPosts: SelectedPost[] = [];
