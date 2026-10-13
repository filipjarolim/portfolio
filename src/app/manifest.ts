import type { MetadataRoute } from "next";
import { fallbackProfile } from "@/content/selection";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: fallbackProfile.name,
    short_name: "Filip Jarolím",
    description: fallbackProfile.bio,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
