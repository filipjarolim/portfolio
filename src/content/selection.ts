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
  location: "Brno / Ostrava",
} as const;

/** His public LinkedIn line, kept as written. */
export const linkedinIntro =
  "Open to entry-level roles, research projects, and internships across Cybersecurity, Data Analysis, and Technical Product Design.";

export const education = {
  school: "Masaryk University",
  faculty: "Faculty of Informatics",
  degree: "B.Sc. Cybersecurity",
  dates: "2026 — Present",
  location: "Brno / Ostrava",
} as const;

export const certification = {
  title: "Cambridge English: First (FCE)",
  detail: "CEFR C1",
} as const;

export const skills = [
  { label: "Languages", value: "Python, TypeScript, Dart" },
  { label: "Frameworks", value: "Next.js, React, Flutter" },
  { label: "Tools", value: "Git, Linux, Supabase, Tailwind CSS, Cursor" },
] as const;

/** How he actually writes code. */
export const practice =
  "I use Cursor heavily for coding. Agents take the repetitive work. I decide what stays, and I review what ships.";

/** Things he actually does outside of school and projects. */
export const likes = ["Travelling", "Photography", "Gym"] as const;

/** Jobs, when there is one to list. Leave empty until then. */
export const experience: {
  role: string;
  org: string;
  location?: string;
  dates: string;
  bullets: string[];
}[] = [];

export type ProjectSource = {
  label: string;
  href: string;
};

/** What a device shows. Two surfaces let one project be a site and an app. */
export type ProjectSurface = {
  device: "macbook" | "iphone";
  label: string;
  src: string;
};

/** A site or an app is shown on a device. Code is shown as the program itself. */
export type ProjectForm = "site" | "app" | "code";

/** One part of a program that has no product screen. */
export type ProjectPiece = {
  name: string;
  line: string;
};

/** A note from a program's own public vault, used to show the program running. */
export type CodeNote = {
  slug: string;
  title: string;
  tags: string;
  /** Other slugs in the same showcase. */
  links: readonly string[];
  /** One sentence taken from that note. */
  line: string;
};

export type SelectedRepo = {
  repo: string;
  title: string;
  /** Used when the GitHub description is missing or too thin to stand alone. */
  summary: string;
  preferLiveDescription?: boolean;
  stack: string;
  site?: string;
  /**
   * Public GitHub repo used for stars and the last update.
   * Null when the project has no public repository. Defaults to `repo`.
   */
  githubRepo?: string | null;
  /** Extra places this project lives: a second repository, a store, a site. */
  sources?: ProjectSource[];
  /**
   * What each device loads. Omit to show /screen/[repo] on both.
   * A native app cannot be framed, so its phone surface is a page of real screenshots.
   */
  surfaces?: ProjectSurface[];
  /**
   * What the device screen loads. Set when the public site refuses to be framed.
   * Otherwise the screen shows /screen/[repo].
   */
  embed?: string;
  /** A real date range, only when one exists outside GitHub. */
  dates?: string;
  /**
   * How the showcase should present it.
   * Code is a program with no site or app to frame.
   */
  form?: ProjectForm;
  /** Named parts of a code project, taken from the program itself. */
  pieces?: readonly ProjectPiece[];
  /** One real command, when the program has a CLI. */
  command?: string;
  /** Provider line the CLI actually prints, when there is one. */
  runtime?: string;
  /** Public notes the running program would list. */
  notes?: readonly CodeNote[];
  /**
   * Same sentences as Jake Gutierrez’s template in cv/resume.tex.
   * False for a project that exists only on this site.
   */
  resume?: boolean;
  /** Set when the project is not finished. Omit for shipped work. */
  status?: string;
  bullets: string[];
};

export const selectedRepos: SelectedRepo[] = [
  {
    repo: "Strakata-Turistika-ANDROID",
    title: "Strakatá turistika",
    summary: "A Flutter GPS app and a separate website for the same season.",
    stack: "Flutter, Dart, Next.js",
    githubRepo: "Strakata-Turistika-ANDROID",
    site: "https://strakataturistika.vercel.app",
    form: "app",
    dates: "Jan 2025 — Present",
    sources: [
      { label: "App", href: "https://github.com/filipjarolim/Strakata-Turistika-ANDROID" },
      { label: "Web", href: "https://github.com/filipjarolim/Strakata-Turistika-WEB" },
      { label: "Site", href: "https://strakataturistika.vercel.app" },
      {
        label: "Play",
        href: "https://play.google.com/store/apps/details?id=cz.strakata.turistika.strakataturistikaandroidapp",
      },
    ],
    surfaces: [
      { device: "macbook", label: "Web", src: "/embed/strakata" },
      { device: "iphone", label: "App", src: "/view/strakata" },
    ],
    bullets: [
      "Flutter GPS app for Android and iOS, listed on Google Play.",
      "A second repository is the public site: trips, GPX files, scoring, and the board.",
      "In active use since January 2025.",
    ],
  },
  {
    repo: "plavanilavia",
    title: "Plavecká škola Lavia",
    summary: "The school site at plavanilaviabrno.cz. Next.js, no database, hosted on Vercel.",
    stack: "Next.js, TypeScript",
    site: "https://plavanilaviabrno.cz",
    embed: "/embed/lavia",
    bullets: [
      "Public site for the school at plavanilaviabrno.cz.",
      "Season content lives in the repository and is served by Next.js on Vercel.",
      "Staff edit it in an admin page. A save commits to GitHub and Vercel rebuilds.",
    ],
  },
  {
    repo: "Nauc-Me-To",
    title: "NaučMěTo",
    summary: "Still in development. A quiz, a cheat sheet, and flashcards from uploaded study material.",
    stack: "Next.js, TypeScript, Supabase",
    status: "In development",
    bullets: [
      "Still in development.",
      "Turns an uploaded PDF, slides, or notes into a quiz, a cheat sheet, and flashcards.",
      "Accounts, file storage, and the database sit on Supabase.",
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
