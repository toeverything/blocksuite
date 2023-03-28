export interface Point {
  x: number;
  y: number;
}

export function simplifyPath(points: Point[]) {
  if (points.length <= 2) {
    return points;
  }
  const path = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    if (
      (prev.x === cur.x && cur.x === next?.x) ||
      (prev.y === cur.y && cur.y === next?.y)
    ) {
      // nothing
    } else {
      path.push(cur);
    }
  }
  return path;
}
