import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { isLocalEdit, passwordMatches, sameOrigin, sessionValid } from "../src/lib/admin-session.ts";

const saved = {
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
};

function request(headers: Record<string, string>, url = "https://folio.example/admin") {
  return new Request(url, { headers });
}

function token(exp: number, secret = "test-secret") {
  const body = `v1.${exp}`;
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

afterEach(() => {
  if (saved.ADMIN_PASSWORD === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = saved.ADMIN_PASSWORD;
  if (saved.ADMIN_SECRET === undefined) delete process.env.ADMIN_SECRET;
  else process.env.ADMIN_SECRET = saved.ADMIN_SECRET;
});

describe("isLocalEdit", () => {
  it("is open only on this machine and only when it is not deployed", () => {
    const previous = process.env.VERCEL;
    delete process.env.VERCEL;
    assert.equal(isLocalEdit(request({ host: "localhost:3010" })), true);
    assert.equal(isLocalEdit(request({ host: "127.0.0.1" })), true);
    assert.equal(isLocalEdit(request({ host: "[::1]:3000" })), true);
    assert.equal(isLocalEdit(request({ host: "localhost.evil.test" })), false);
    assert.equal(isLocalEdit(request({ host: "folio.example" })), false);
    process.env.VERCEL = "1";
    assert.equal(isLocalEdit(request({ host: "localhost" })), false);
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  });
});

describe("sameOrigin", () => {
  it("requires the origin host to match the request host", () => {
    assert.equal(
      sameOrigin(request({ host: "folio.example", origin: "https://folio.example" })),
      true,
    );
    assert.equal(
      sameOrigin(request({ host: "folio.example", origin: "https://evil.example" })),
      false,
    );
    assert.equal(sameOrigin(request({ host: "folio.example" })), false);
    assert.equal(sameOrigin(request({ host: "folio.example", origin: "not a url" })), false);
  });
});

describe("passwordMatches", () => {
  it("rejects an empty configured password and a wrong length", () => {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(passwordMatches("secret"), false);
    process.env.ADMIN_PASSWORD = "secret";
    assert.equal(passwordMatches(""), false);
    assert.equal(passwordMatches("secretly"), false);
    assert.equal(passwordMatches("secret"), true);
  });
});

describe("sessionValid", () => {
  it("accepts a signed token that has not expired and rejects the rest", () => {
    process.env.ADMIN_SECRET = "test-secret";
    const future = Math.floor(Date.now() / 1000) + 60;
    const past = Math.floor(Date.now() / 1000) - 60;
    assert.equal(sessionValid(token(future)), true);
    assert.equal(sessionValid(token(past)), false);
    assert.equal(sessionValid(token(future, "other-secret")), false);
    assert.equal(sessionValid("v1.123"), false);
    assert.equal(sessionValid(undefined), false);
    delete process.env.ADMIN_SECRET;
    assert.equal(sessionValid(token(future)), false);
  });
});
