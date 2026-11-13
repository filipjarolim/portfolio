import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { anchorShift, viewDistance } from "../src/lib/framing.ts";

describe("viewDistance", () => {
  it("fits the larger of the height and width constraints", () => {
    const fov = 30;
    const tan = Math.tan((fov * Math.PI) / 360);
    const distance = viewDistance(0.2, 0.1, fov, 1, 0.5, 0.5);
    const byWidth = 0.2 / 0.5 / (2 * tan * 1);
    assert.ok(Math.abs(distance - byWidth) < 1e-9);
    assert.ok(distance > 0.1 / 0.5 / (2 * tan));
  });

  it("stays finite when the requested span is zero", () => {
    const distance = viewDistance(1, 1, 30, 1, 0, 0);
    assert.equal(Number.isFinite(distance), true);
    assert.ok(distance > 0);
  });

  it("falls back when the field of view cannot form a camera", () => {
    assert.equal(viewDistance(1, 1, 0, 1, 0.5, 0.5), 1);
  });
});

describe("anchorShift", () => {
  it("leaves a centered subject on the look target", () => {
    assert.equal(anchorShift(4, 30, 0.5), 0);
  });

  it("raises the subject when the anchor sits above the middle", () => {
    const shift = anchorShift(4, 30, 0.36);
    assert.ok(shift > 0);
  });

  it("returns zero instead of NaN for a broken field of view", () => {
    assert.equal(anchorShift(4, Number.NaN, 0.36), 0);
  });
});
