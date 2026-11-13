import { cacheLife, cacheTag } from "next/cache";
import { readSiteFile, type SiteCopy } from "@/lib/site-copy";

export async function getSiteCopy(): Promise<SiteCopy> {
  "use cache";
  cacheTag("site-copy");
  cacheLife("hours");
  return readSiteFile();
}
