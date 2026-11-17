import { getStrakataSnapshot } from "@/lib/strakata-snapshot";

export async function GET() {
  const html = await getStrakataSnapshot();
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
