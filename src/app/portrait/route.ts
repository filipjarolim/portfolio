import { getPortraitImage } from "@/lib/linkedin-portrait";

export async function GET() {
  const image = await getPortraitImage();
  return new Response(Buffer.from(image.base64, "base64"), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
