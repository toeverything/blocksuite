export function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

/**
 * This function takes a value value, a minimum value min, and a maximum value max,
 * and returns the value of value clamped to the range [min, max].
 *
 * This means that if value is less than min, the function will return min;
 * if value is greater than max, the function will return max;
 * otherwise, the function will return value.
 *
 * @example
 * ```ts
 * const x = clamp(10, 0, 5); // x will be 5
 * const y = clamp(3, 0, 5); // y will be 3
 * const z = clamp(-1, 0, 5); // z will be 0
 * ```
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

/**
 * Converts an angle from degrees to radians.
 *
 * @param {number} angle - The angle in degrees.
 * @returns {number} - The angle in radians.
 */
export function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

/**
 * Calculates the new position of a point A after rotating around another point B by a certain angle.
 *
 * @param {number} Bx - The x-coordinate of point B.
 * @param {number} By - The y-coordinate of point B.
 * @param {number} R -The angle of rotation in degrees.
 * @param {number} Ax - The x-coordinate of point A.
 * @param {number} Ay - The y-coordinate of point A.
 * @returns {Array} - The new coordinates of point A after rotation.
 */
export function calculateRotatedPointPosition(
  Bx: number,
  By: number,
  R: number,
  Ax: number,
  Ay: number
): [number, number] {
  // Translate point A to the origin
  const x = Ax - Bx;
  const y = Ay - By;

  // Perform the rotation at the origin
  const newX = x * Math.cos(toRadians(R)) - y * Math.sin(toRadians(R));
  const newY = x * Math.sin(toRadians(R)) + y * Math.cos(toRadians(R));

  // Translate point A back to its original position relative to point B
  const rotatedAx = Bx + newX;
  const rotatedAy = By + newY;

  return [rotatedAx, rotatedAy];
}
