export function sub(v1: number[], v2: number[]): number[] {
  return [v1[0] - v2[0], v1[1] - v2[1]];
}

export function add(v1: number[], v2: number[]): number[] {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

export function calculateManhattanDist(p1: number[], p2: number[]): number {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
}

export function createKey(p: number[]): string {
  return p.join(':');
}

export function getXYDFromKey(key: string): number[] {
  return key.split(':').map(Number);
}
