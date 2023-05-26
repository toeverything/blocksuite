export const EPSILON = 1e-12;
export const isZero = (val: number) => {
  return val >= -EPSILON && val <= EPSILON;
};

export const approximatelyEqual = (
  a: number,
  b: number,
  epsilon = 0.000001
): boolean => {
  return Math.abs(a - b) < epsilon;
};
