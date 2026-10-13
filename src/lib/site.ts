/** Absolute origin for canonical URLs. Set SITE_URL when the site has a public domain. */
export function getSiteUrl() {
  const configured = process.env.SITE_URL?.trim();
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  const raw = configured || vercel;
  if (!raw) return new URL("http://127.0.0.1:3000");
  return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
}
