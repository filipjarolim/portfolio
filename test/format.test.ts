import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatStars, formatUpdated, repoUrl } from "../src/lib/format.ts";

describe("formatUpdated", () => {
  it("returns null for empty and invalid dates", () => {
    assert.equal(formatUpdated(null), null);
    assert.equal(formatUpdated(""), null);
    assert.equal(formatUpdated("not-a-date"), null);
  });

  it("formats in UTC so a late evening does not roll into the next month", () => {
    assert.equal(formatUpdated("2026-01-31T23:30:00.000Z"), "Jan 2026");
    assert.equal(formatUpdated("2026-03-01T00:30:00.000Z"), "Mar 2026");
  });
});

describe("formatStars", () => {
  it("hides a count that is not a real star total", () => {
    assert.equal(formatStars(0), null);
    assert.equal(formatStars(-3), null);
  });

  it("uses the singular only for one star", () => {
    assert.equal(formatStars(1), "1 star");
    assert.equal(formatStars(2), "2 stars");
    assert.equal(formatStars(12), "12 stars");
  });
});

describe("repoUrl", () => {
  it("points at the public GitHub account", () => {
    assert.equal(repoUrl("brainCore"), "https://github.com/filipjarolim/brainCore");
  });
});
