/** Camera distance that fits a subject into the requested share of the view. */
export function viewDistance(
  width: number,
  height: number,
  fov: number,
  aspect: number,
  spanY: number,
  fillX: number,
) {
  const tan = Math.tan((fov * Math.PI) / 360);
  const byHeight = height / Math.max(spanY, 1e-3) / (2 * tan);
  const byWidth = width / Math.max(fillX, 1e-3) / (2 * tan * Math.max(aspect, 0.01));
  const distance = Math.max(byHeight, byWidth);
  return Number.isFinite(distance) && distance > 0 ? distance : 1;
}

/** Move the look target so a centered subject sits at `anchor` from the top of the view. */
export function anchorShift(distance: number, fov: number, anchor: number) {
  const tan = Math.tan((fov * Math.PI) / 360);
  const shift = (1 - 2 * anchor) * distance * tan;
  return Number.isFinite(shift) ? shift : 0;
}
