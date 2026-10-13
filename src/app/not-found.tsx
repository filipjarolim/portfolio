import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center px-5 py-24">
      <p className="font-mono text-xs tracking-[0.16em]">404</p>
      <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em]">This page is not here.</h1>
      <a href="/" className="link-draw mt-8 inline-block text-sm font-bold">
        Home
      </a>
    </main>
  );
}
