import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { fallbackProfile, links, linkedinIntro } from "@/content/selection";
import { getGithubProfile } from "@/lib/github";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getGithubProfile();
  const name = profile.name || fallbackProfile.name;
  const description = [profile.bio || fallbackProfile.bio, linkedinIntro]
    .filter(Boolean)
    .join(" ");
  const site = getSiteUrl();

  return {
    metadataBase: site,
    title: {
      default: `${name} — Cybersecurity`,
      template: `%s — ${name}`,
    },
    description,
    applicationName: name,
    authors: [{ name, url: links.linkedin }],
    creator: name,
    publisher: name,
    category: "portfolio",
    keywords: [
      name,
      "cybersecurity",
      "Masaryk University",
      "Faculty of Informatics",
      "Brno",
      "network architecture",
      "cryptography",
    ],
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "profile",
      locale: "en_US",
      url: "/",
      siteName: name,
      title: `${name} — Cybersecurity`,
      description,
      firstName: "Filip",
      lastName: "Jarolím",
      username: "filipjarolim",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Cybersecurity`,
      description,
    },
    formatDetection: { email: false, address: false, telephone: false },
    appleWebApp: { title: name, statusBarStyle: "default" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans text-black">{children}</body>
    </html>
  );
}
