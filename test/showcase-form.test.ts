import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectedRepos } from "../src/content/selection.ts";
import { projectForm, showcaseSurfaces } from "../src/lib/showcase-form.ts";

describe("showcase surfaces", () => {
  it("gives a code project no device to frame", () => {
    const brain = selectedRepos.find((item) => item.repo === "brainCore");
    assert.ok(brain);
    assert.equal(projectForm(brain), "code");
    assert.deepEqual(showcaseSurfaces(brain), []);
  });

  it("keeps a site on both the laptop and the phone", () => {
    const study = selectedRepos.find((item) => item.repo === "Nauc-Me-To");
    assert.ok(study);
    assert.equal(projectForm(study), "site");
    const surfaces = showcaseSurfaces(study);
    assert.deepEqual(
      surfaces.map((item) => item.device),
      ["macbook", "iphone"],
    );
    assert.ok(surfaces.every((item) => item.src.length > 0));
  });
});
