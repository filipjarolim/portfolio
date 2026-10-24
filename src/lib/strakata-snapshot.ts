import { cacheLife } from "next/cache";

const ORIGIN = "https://strakataturistika.vercel.app";

function absolutize(html: string) {
  return html
    .replace(/(\s(?:href|src|poster|action)=["'])\//gi, `$1${ORIGIN}/`)
    .replace(/url\(\s*(['"]?)\//gi, `url($1${ORIGIN}/`)
    .replace(/\s(srcset|imagesrcset)=["'][^"']*["']/gi, (attribute) =>
      attribute.replace(/(^|[\s,])\//g, `$1${ORIGIN}/`),
    );
}

/** The public site sends X-Frame-Options, so the laptop shows this same-origin copy. */
export async function getStrakataSnapshot(): Promise<string> {
  "use cache";
  cacheLife("hours");

  const response = await fetch(ORIGIN, {
    headers: { "User-Agent": "filip-folio" },
  });
  if (!response.ok) {
    throw new Error(`Strakatá snapshot failed: ${response.status}`);
  }

  const html = absolutize(await response.text())
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<div hidden id="S:/g, '<div id="S:')
    .replace(
      /<head>/i,
      `<head><base href="${ORIGIN}/"><style>html,body,body *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}</style><script>document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("selectstart",function(e){e.preventDefault()});document.addEventListener("dragstart",function(e){e.preventDefault()});</script>`,
    );

  return html;
}
