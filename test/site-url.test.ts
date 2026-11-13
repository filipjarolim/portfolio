import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getSiteUrl } from "../src/lib/site.ts";

const keys = ["SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;
const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function clearSiteEnv() {
  for (const key of keys) delete process.env[key];
}

afterEach(() => {
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("getSiteUrl", () => {
  it("falls back to the local server when nothing is configured", () => {
    clearSiteEnv();
    assert.equal(getSiteUrl().origin, "http://127.0.0.1:3000");
  });

  it("adds https to a bare host and keeps an explicit origin", () => {
    clearSiteEnv();
    process.env.SITE_URL = "folio.example";
    assert.equal(getSiteUrl().origin, "https://folio.example");
    process.env.SITE_URL = "http://localhost:3010";
    assert.equal(getSiteUrl().origin, "http://localhost:3010");
  });

  it("prefers SITE_URL over the Vercel host", () => {
    clearSiteEnv();
    process.env.SITE_URL = "https://filip.example";
    process.env.VERCEL_URL = "preview.vercel.app";
    assert.equal(getSiteUrl().host, "filip.example");
  });

  it("uses the production Vercel host before the preview host", () => {
    clearSiteEnv();
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "filip.vercel.app";
    process.env.VERCEL_URL = "filip-git-main.vercel.app";
    assert.equal(getSiteUrl().host, "filip.vercel.app");
  });

  it("does not throw when the configured value is not a URL", () => {
    clearSiteEnv();
    process.env.SITE_URL = "http://";
    assert.equal(getSiteUrl().origin, "http://127.0.0.1:3000");
    process.env.SITE_URL = ":::";
    assert.equal(getSiteUrl().origin, "http://127.0.0.1:3000");
  });
});
