export function subV(v1: number[], v2: number[]): number[] {
  return v1.map((item, index) => item - v2[index]);
}

export function addV(v1: number[], v2: number[]): number[] {
  return v1.map((item, index) => item + v2[index]);
}

export function calculateEuclideanDist(p1: number[], p2: number[]): number {
  return Math.hypot(...subV(p2, p1).map(Math.abs));
}

export function calculateManhattanDist(p1: number[], p2: number[]): number {
  const d = subV(p2, p1).map(Math.abs);
  return d[0] + d[1];
}

export function Key(p: number[]): string {
  return p.join(':');
}

export function getXYDFromKey(key: string): number[] {
  return key.split(':').map(Number);
}
