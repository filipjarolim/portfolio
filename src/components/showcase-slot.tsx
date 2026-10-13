"use client";

import dynamic from "next/dynamic";
import type { ShowcaseProject } from "@/components/showcase";

const Showcase = dynamic(() => import("@/components/showcase"), {
  ssr: false,
});

export function ShowcaseSlot({ projects }: { projects: ShowcaseProject[] }) {
  return <Showcase projects={projects} />;
}
