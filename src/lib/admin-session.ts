import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.ADMIN_SECRET ?? "";
}

export function isLocalEdit(request: Request) {
  if (process.env.VERCEL) return false;
  const host = request.headers.get("host") ?? "";
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
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

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !input) return false;
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signSession(exp: number) {
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
  const expected = signSession(exp);
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
