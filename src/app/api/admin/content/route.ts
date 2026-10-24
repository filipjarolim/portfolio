import { isLocalEdit, readSession, sameOrigin } from "@/lib/admin-auth";
import { selectedRepos } from "@/content/selection";
import { getSiteCopy } from "@/lib/site-copy";
import { saveSiteCopy } from "@/lib/site-store";

async function allowed(request: Request) {
  return isLocalEdit(request) || (await readSession());
}

export async function GET(request: Request) {
  if (!(await allowed(request))) return Response.json({ error: "Sign in first." }, { status: 401 });
  const copy = await getSiteCopy();
  return Response.json({
    free: isLocalEdit(request),
    copy,
    catalog: selectedRepos.map((item) => ({
      repo: item.repo,
      stack: item.stack,
      dates: item.dates ?? null,
    })),
  });
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Stay on this site to save." }, { status: 403 });
  if (!(await allowed(request))) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    const body = await request.json();
    const saved = await saveSiteCopy(body);
    return Response.json({ ok: true, detail: saved.detail, copy: saved.copy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
