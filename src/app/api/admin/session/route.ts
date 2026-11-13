import { isLocalEdit, passwordMatches, readSession, sameOrigin, writeSession, clearSession } from "@/lib/admin-auth";
import { clientAddress, isBlocked, noteAttempt, type Attempt } from "@/lib/login-guard";

const attempts = new Map<string, Attempt>();

function blocked(request: Request) {
  return isBlocked(attempts, clientAddress(request.headers), Date.now());
}

function mark(request: Request, ok: boolean) {
  noteAttempt(attempts, clientAddress(request.headers), ok, Date.now());
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
