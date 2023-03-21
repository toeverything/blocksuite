export const subV = (v1: number[], v2: number[]) =>
  v1.map((item, index) => item - v2[index]);

export const addV = (v1: number[], v2: number[]) =>
  v1.map((item, index) => item + v2[index]);

export const calculateEuclideanDist = (p1: number[], p2: number[]) => {
  return Math.hypot(...subV(p2, p1).map(Math.abs));
};

export const calculateManhattanDist = (p1: number[], p2: number[]) => {
  const d = subV(p2, p1).map(Math.abs);

  return d[0] + d[1];
};

export const Key = (p: number[]) => p.join(':');

export const getXYDFromKey = (key: string) => key.split(':').map(Number);
