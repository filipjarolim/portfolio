/** Rewrite root-relative links so a copied page still loads from its own site. */
export function absolutize(html: string, origin: string) {
  const root = origin.replace(/\/$/, "");
  const rooted = `(^|[\\s,"'])\\/(?!\\/)`;
  return html
    .replace(new RegExp(`(\\s(?:href|src|poster|action)=["'])\\/(?!\\/)`, "gi"), `$1${root}/`)
    .replace(/url\(\s*(['"]?)\/(?!\/)/gi, `url($1${root}/`)
    .replace(/\s(?:srcset|imagesrcset)=["'][^"']*["']/gi, (attribute) =>
      attribute.replace(new RegExp(rooted, "g"), `$1${root}/`),
    );
}
