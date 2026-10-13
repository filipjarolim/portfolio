import Link from "next/link";
import { links } from "@/content/selection";

const item =
  "link-draw focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black bg-white pt-[env(safe-area-inset-top)]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[calc(0.75rem+env(safe-area-inset-top))] focus:z-[60] focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link href="/" className={`${item} min-w-0 truncate text-sm font-bold tracking-tight`}>
          Filip Jarolím
        </Link>
        <nav
          aria-label="Primary"
          className="flex shrink-0 items-center justify-end gap-x-3 text-sm font-medium sm:gap-x-5"
        >
          <a
            href={links.github}
            className={item}
            target="_blank"
            rel="me noreferrer"
          >
            GitHub
          </a>
          <a
            href={links.linkedin}
            className={item}
            target="_blank"
            rel="me noreferrer"
          >
            LinkedIn
          </a>
          <a href="/cv.pdf" className={item}>
            CV
          </a>
        </nav>
      </div>
    </header>
  );
}
