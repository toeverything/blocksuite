import { getStroke } from '../../../perfect-freehand/getStroke.js';

export function getSolidStrokePoints(
  points: number[][],
  pressures: number[],
  lineWidth: number
) {
  const pts =
    pressures.length === 0
      ? points.map(([x, y]) => ({ x, y }))
      : points.map(([x, y], i) => ({ x, y, pressure: pressures[i] }));

  return getStroke(pts, {
    size: lineWidth,
    thinning: 0.6,
    streamline: 0.5,
    smoothing: 0.5,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: pressures.length === 0,
  });
}
