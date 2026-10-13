import { cacheLife } from "next/cache";

const ORIGIN = "https://plavanilaviabrno.cz";

function absolutize(html: string) {
  return html
    .replace(/(\s(?:href|src|poster|action)=["'])\//gi, `$1${ORIGIN}/`)
    .replace(/url\(\s*(['"]?)\//gi, `url($1${ORIGIN}/`)
    .replace(/\s(srcset|imagesrcset)=["'][^"']*["']/gi, (attribute) =>
      attribute.replace(/(^|[\s,])\//g, `$1${ORIGIN}/`),
    );
}

export async function getLaviaSnapshot(): Promise<string> {
  "use cache";
  cacheLife("hours");

  const response = await fetch(ORIGIN, {
    headers: { "User-Agent": "filip-folio" },
  });
  if (!response.ok) {
    throw new Error(`Lavia snapshot failed: ${response.status}`);
  }

  const html = absolutize(await response.text())
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(
      /<head>/i,
      `<head><base href="${ORIGIN}/"><style>html,body,body *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}</style><script>document.addEventListener("contextmenu",function(e){e.preventDefault()});document.addEventListener("selectstart",function(e){e.preventDefault()});document.addEventListener("dragstart",function(e){e.preventDefault()});</script>`,
    );

  return html;
}
