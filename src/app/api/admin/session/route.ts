import { isLocalEdit, passwordMatches, readSession, sameOrigin, writeSession, clearSession } from "@/lib/admin-auth";

const attempts = new Map<string, { count: number; until: number }>();

function blocked(request: Request) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  const entry = attempts.get(key);
  return Boolean(entry && entry.until > Date.now() && entry.count >= 8);
}

function mark(request: Request, ok: boolean) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  if (ok) {
    attempts.delete(key);
    return;
  }
  const entry = attempts.get(key) ?? { count: 0, until: Date.now() + 15 * 60 * 1000 };
  if (entry.until < Date.now()) {
    entry.count = 0;
    entry.until = Date.now() + 15 * 60 * 1000;
  }
  entry.count += 1;
  attempts.set(key, entry);
}

export async function GET(request: Request) {
  const free = isLocalEdit(request);
  const authed = free || (await readSession());
  return Response.json({ free, authed });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Stay on this site to sign in." }, { status: 403 });
  if (isLocalEdit(request)) return Response.json({ free: true, authed: true });
  if (blocked(request)) return Response.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });
  const body = (await request.json().catch(() => null)) as { password?: string; remember?: boolean } | null;
  if (!passwordMatches(body?.password ?? "")) {
    mark(request, false);
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  const secure = new URL(request.url).protocol === "https:";
  const saved = await writeSession(body?.remember === true, secure);
  if (!saved) return Response.json({ error: "Admin secret is not configured." }, { status: 503 });
  mark(request, true);
  return Response.json({ free: false, authed: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Stay on this site to sign out." }, { status: 403 });
  await clearSession();
  return Response.json({ free: isLocalEdit(request), authed: isLocalEdit(request) });
}
