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
