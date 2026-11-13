import { cookies } from "next/headers";
import {
  isLocalEdit,
  passwordMatches,
  sameOrigin,
  sessionValid,
  signSession,
} from "@/lib/admin-session";

const COOKIE = "folio_admin";

export { isLocalEdit, passwordMatches, sameOrigin, sessionValid };

export async function readSession() {
  const jar = await cookies();
  return sessionValid(jar.get(COOKIE)?.value);
}

export async function writeSession(remember: boolean, secure: boolean) {
  const exp = Math.floor(Date.now() / 1000) + (remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12);
  const token = signSession(exp);
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
