import { getArrowPoints } from './utils.js';

export function drawArrow(
  path: Path2D,
  start: number[],
  end: number[],
  arrowSize = 10
) {
  const { sides } = getArrowPoints(start, end, arrowSize);

  path.moveTo(sides[0][0], sides[0][1]);
  path.lineTo(end[0], end[1]);
  path.lineTo(sides[1][0], sides[1][1]);
}
