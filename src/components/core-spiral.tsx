"use client";

const SPIRAL = (() => {
  const order = new Array<number>(25).fill(0);
  let top = 0;
  let bottom = 4;
  let left = 0;
  let right = 4;
  let step = 0;
  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col += 1) order[top * 5 + col] = step++;
    top += 1;
    for (let row = top; row <= bottom; row += 1) order[row * 5 + right] = step++;
    right -= 1;
    if (top <= bottom) {
      for (let col = right; col >= left; col -= 1) order[bottom * 5 + col] = step++;
      bottom -= 1;
    }
    if (left <= right) {
      for (let row = bottom; row >= top; row -= 1) order[row * 5 + left] = step++;
      left += 1;
    }
  }
  return order;
})();

/** Dot Matrix “Core Spiral”: a 5×5 grid that lights from the outside in. */
export function CoreSpiral() {
  return (
    <div className="dmx-root" aria-hidden="true">
      <div className="dmx-grid">
        {SPIRAL.map((order, index) => (
          <span
            key={index}
            className="dmx-dot dmx-spiral-snake"
            style={{ ["--dmx-spiral-order" as string]: order }}
          />
        ))}
      </div>
    </div>
  );
}
