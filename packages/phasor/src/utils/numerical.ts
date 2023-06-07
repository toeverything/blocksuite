export const EPSILON = 1e-12;
export const MACHINE_EPSILON = 1.12e-16;

export function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}
