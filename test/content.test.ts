import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { githubUser, links, selectedRepos } from "../src/content/selection.ts";
import { folioHeaders } from "../src/lib/folio-headers.ts";

describe("selected projects", () => {
  it("keeps a unique repo id, a title, and résumé lines", () => {
    const ids = selectedRepos.map((item) => item.repo);
    assert.equal(new Set(ids).size, ids.length);
    for (const item of selectedRepos) {
      assert.ok(item.title.trim());
      assert.ok(item.summary.trim());
      assert.ok(item.stack.trim());
      assert.ok(item.bullets.length > 0);
      assert.ok(item.bullets.every((bullet) => bullet.trim().length > 0));
    }
  });

  it("shows a program with no product screen as code", () => {
    const brain = selectedRepos.find((item) => item.repo === "brainCore");
    assert.equal(brain?.form, "code");
    assert.ok((brain?.pieces?.length ?? 0) > 0);
    assert.ok(brain?.command?.includes("brain ask"));
    assert.ok(brain?.runtime?.includes("ollama"));
    const slugs = new Set((brain?.notes ?? []).map((note) => note.slug));
    assert.ok(slugs.has("IB000_Math"));
    assert.ok(slugs.has("Asymmetric_Crypto"));
    assert.equal(slugs.has("cybersecurity_student"), false);
    for (const note of brain?.notes ?? []) {
      for (const link of note.links) assert.ok(slugs.has(link), link);
    }
  });

  it("keeps Brain, NaučMěTo, and Perimeter, and leaves the rest off the site", () => {
    assert.deepEqual(
      selectedRepos.map((item) => item.repo),
      ["brainCore", "Nauc-Me-To", "perimeter"],
    );
    const study = selectedRepos.find((item) => item.repo === "Nauc-Me-To");
    assert.equal(study?.status, "In development");
    assert.equal(study?.resume, undefined);
  });

  it("keeps Perimeter on the site and off the résumé", () => {
    const perimeter = selectedRepos.find((item) => item.repo === "perimeter");
    assert.ok(perimeter);
    assert.equal(perimeter?.resume, false);
    assert.equal(perimeter?.githubRepo, null);
  });

  it("points the public profiles at the real accounts", () => {
    assert.equal(githubUser, "filipjarolim");
    assert.equal(links.github, "https://github.com/filipjarolim");
    assert.equal(links.linkedin, "https://www.linkedin.com/in/filip-jarolim");
    assert.match(links.email, /@/);
  });
});

describe("response headers", () => {
  it("names each header once and covers the desk the site can honestly show", () => {
    const keys = folioHeaders.map((item) => item.key.toLowerCase());
    assert.equal(new Set(keys).size, keys.length);
    for (const key of [
      "strict-transport-security",
      "x-content-type-options",
      "referrer-policy",
      "x-frame-options",
      "permissions-policy",
    ]) {
      assert.ok(keys.includes(key), key);
    }
    assert.ok(folioHeaders.every((item) => item.value.trim().length > 0));
  });
});
