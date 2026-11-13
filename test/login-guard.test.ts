import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientAddress, isBlocked, noteAttempt, type Attempt } from "../src/lib/login-guard.ts";

describe("clientAddress", () => {
  it("uses the platform IP ahead of a caller-supplied forward chain", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.8",
      "x-forwarded-for": "1.1.1.1, 203.0.113.8",
    });
    assert.equal(clientAddress(headers), "203.0.113.8");
  });

  it("uses the last forwarded hop when the platform IP is missing", () => {
    const headers = new Headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" });
    assert.equal(clientAddress(headers), "203.0.113.9");
    assert.equal(clientAddress(new Headers()), "local");
  });
});

describe("login attempts", () => {
  it("locks a key after eight failures and clears it after a success", () => {
    const attempts = new Map<string, Attempt>();
    const now = 1_000_000;
    for (let attempt = 0; attempt < 7; attempt += 1) noteAttempt(attempts, "203.0.113.8", false, now);
    assert.equal(isBlocked(attempts, "203.0.113.8", now), false);
    noteAttempt(attempts, "203.0.113.8", false, now);
    assert.equal(isBlocked(attempts, "203.0.113.8", now), true);
    noteAttempt(attempts, "203.0.113.8", true, now);
    assert.equal(isBlocked(attempts, "203.0.113.8", now), false);
  });

  it("starts a fresh window after the lock expires", () => {
    const attempts = new Map<string, Attempt>();
    const now = 1_000_000;
    for (let attempt = 0; attempt < 8; attempt += 1) noteAttempt(attempts, "local", false, now);
    assert.equal(isBlocked(attempts, "local", now + 15 * 60 * 1000), false);
    noteAttempt(attempts, "local", false, now + 15 * 60 * 1000);
    assert.equal(attempts.get("local")?.count, 1);
  });

  it("does not keep a unique key for every spoofed address", () => {
    const attempts = new Map<string, Attempt>();
    for (let index = 0; index < 600; index += 1) {
      noteAttempt(attempts, `203.0.113.${index}`, false, 1_000_000);
    }
    assert.ok(attempts.size <= 501);
  });
});
