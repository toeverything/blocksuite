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

// Radian and angle conversion functions
export function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

// Rotate a point in a rectangle.
export function calculateRotatedPointPosition(
  w: number,
  h: number,
  R: number,
  absoluteX: number,
  absoluteY: number
) {
  const x = absoluteX - w / 2;
  const y = absoluteY - h / 2;

  const originalX = x * Math.cos(toRadians(R)) - y * Math.sin(toRadians(R));
  const originalY = x * Math.sin(toRadians(R)) + y * Math.cos(toRadians(R));

  const originalAbsoluteX = w / 2 + originalX;
  const originalAbsoluteY = h / 2 + originalY;

  return [originalAbsoluteX, originalAbsoluteY];
}
