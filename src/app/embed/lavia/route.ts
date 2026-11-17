import { getLaviaSnapshot } from "@/lib/lavia-snapshot";

export async function GET() {
  const html = await getLaviaSnapshot();
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
