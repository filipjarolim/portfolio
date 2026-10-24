import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "folio_admin";

export function isLocalEdit(request: Request) {
  if (process.env.VERCEL) return false;
  const host = request.headers.get("host") ?? "";
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function secret() {
  return process.env.ADMIN_SECRET ?? "";
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !input) return false;
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(exp: number) {
  const key = secret();
  if (!key) return "";
  const body = `v1.${exp}`;
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function sessionValid(token: string | undefined) {
  if (!token || !secret()) return false;
  const [version, expRaw, mac] = token.split(".");
  if (version !== "v1" || !expRaw || !mac) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = sign(exp);
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function readSession() {
  const jar = await cookies();
  return sessionValid(jar.get(COOKIE)?.value);
}

export async function writeSession(remember: boolean, secure: boolean) {
  const exp = Math.floor(Date.now() / 1000) + (remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12);
  const token = sign(exp);
  if (!token) return false;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  return true;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
