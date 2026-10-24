import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { fallbackProfile, links } from "@/content/selection";
import { getSiteCopy } from "@/lib/site-copy";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121820" },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getGithubProfile();
  const copy = await getSiteCopy();
  const name = profile.name || fallbackProfile.name;
  const description = [copy.headline, copy.intro].filter(Boolean).join(" ");
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
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans text-black">
        <Script id="folio-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("folio-theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var h=document.documentElement;h.classList.toggle("dark",d);h.style.colorScheme=d?"dark":"light";}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
