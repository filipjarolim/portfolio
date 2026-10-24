import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/screen/", "/embed/", "/view/", "/admin", "/api/admin"],
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
