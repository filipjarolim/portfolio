import type { ProjectForm, ProjectSurface, SelectedRepo } from "@/content/selection";

export function projectForm(item: Pick<SelectedRepo, "form">): ProjectForm {
  return item.form ?? "site";
}

/** Sites and apps get a device. A code project has no screen to frame. */
export function showcaseSurfaces(item: SelectedRepo): ProjectSurface[] {
  if (projectForm(item) === "code") return [];
  const listed = item.surfaces ?? [];
  if (listed.length > 0) {
    const mac = listed.find((surface) => surface.device === "macbook");
    const phone = listed.find((surface) => surface.device === "iphone");
    const fallback = listed[0];
    return [
      mac ?? { device: "macbook", label: fallback.label, src: fallback.src },
      phone ?? { device: "iphone", label: fallback.label, src: fallback.src },
    ];
  }
  const src = item.embed ?? `/screen/${item.repo}`;
  return [
    { device: "macbook", label: "Web", src },
    { device: "iphone", label: "Phone", src },
  ];
}
