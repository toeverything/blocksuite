export const regularizationNumberInRange = (
  n: number,
  min: number,
  max: number
) => {
  max = max - min;
  n = (n - min + max) % max;
  return min + (Number.isNaN(n) ? 0 : n);
};
