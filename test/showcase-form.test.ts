import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectedRepos } from "../src/content/selection.ts";
import { projectForm, showcaseSurfaces } from "../src/lib/showcase-form.ts";

describe("showcase surfaces", () => {
  it("keeps an app on the phone and its site on the laptop", () => {
    const app = selectedRepos.find((item) => item.repo === "Strakata-Turistika-ANDROID");
    assert.ok(app);
    assert.equal(projectForm(app), "app");
    const surfaces = showcaseSurfaces(app);
    assert.equal(surfaces.find((item) => item.device === "iphone")?.label, "App");
    assert.equal(surfaces.find((item) => item.device === "macbook")?.label, "Web");
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
