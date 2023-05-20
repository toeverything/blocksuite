export function isFarEnough(a: PointerEvent, b: PointerEvent) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.pow(dx, 2) + Math.pow(dy, 2) > 100;
}
