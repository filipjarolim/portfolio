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

  it("keeps Strakatá, Lavia, and NaučMěTo, and leaves Brain and Perimeter off the site", () => {
    assert.deepEqual(
      selectedRepos.map((item) => item.repo),
      ["Strakata-Turistika-ANDROID", "plavanilavia", "Nauc-Me-To"],
    );
    const study = selectedRepos.find((item) => item.repo === "Nauc-Me-To");
    assert.equal(study?.status, "In development");
    assert.equal(selectedRepos.some((item) => item.repo === "brainCore"), false);
    assert.equal(selectedRepos.some((item) => item.repo === "perimeter"), false);
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
