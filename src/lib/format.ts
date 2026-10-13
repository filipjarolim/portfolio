export function formatUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatStars(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? "1 star" : `${count} stars`;
}

export function repoUrl(repo: string): string {
  return `https://github.com/filipjarolim/${repo}`;
}
