import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { likes, selectedRepos, skills } from "../src/content/selection.ts";
import { normalize } from "../src/lib/site-copy.ts";

describe("normalize", () => {
  it("fills every selected project when the input is empty", () => {
    const copy = normalize(null);
    assert.deepEqual(
      copy.projectOrder,
      selectedRepos.map((item) => item.repo),
    );
    assert.equal(copy.projects.perimeter.hidden, false);
    assert.ok(copy.projects.perimeter.bullets.length > 0);
    assert.deepEqual(copy.likes, [...likes]);
    assert.equal(copy.skills.length, skills.length);
  });

  it("drops duplicate and unknown projects and keeps the rest in the requested order", () => {
    const copy = normalize({
      projectOrder: ["perimeter", "missing", "perimeter", "brainCore", ""],
    });
    assert.deepEqual(copy.projectOrder.slice(0, 2), ["perimeter", "brainCore"]);
    assert.equal(new Set(copy.projectOrder).size, selectedRepos.length);
    assert.equal(copy.projectOrder.length, selectedRepos.length);
  });

  it("clips text and ignores projects that are not on the allowlist", () => {
    const copy = normalize({
      headline: `  ${"A".repeat(200)}  `,
      projects: {
        nope: { title: "Injected" },
        brainCore: { title: "  Brain local  ", hidden: "yes", bullets: ["One", "", "Two"] },
      },
    });
    assert.equal(copy.headline.length, 160);
    assert.equal(copy.projects.nope, undefined);
    assert.equal(copy.projects.brainCore.title, "Brain local");
    assert.equal(copy.projects.brainCore.hidden, false);
    assert.deepEqual(copy.projects.brainCore.bullets, ["One", "Two"]);
  });

  it("lets an explicit empty bullet list replace the résumé lines", () => {
    const copy = normalize({ projects: { perimeter: { bullets: [] } } });
    assert.deepEqual(copy.projects.perimeter.bullets, []);
  });

  it("restores skills, likes, and focus when the saved rows are unusable", () => {
    const copy = normalize({
      skills: [{ label: "", value: "gone" }, "nope"],
      likes: ["", "   "],
      focus: [],
    });
    assert.equal(copy.skills.length, skills.length);
    assert.deepEqual(copy.likes, [...likes]);
    assert.deepEqual(copy.focus, ["Cybersecurity"]);
  });

  it("keeps a shorter skill list when the labels are real", () => {
    const copy = normalize({ skills: [{ label: "Languages", value: "TypeScript" }] });
    assert.deepEqual(copy.skills, [{ label: "Languages", value: "TypeScript" }]);
  });
});
