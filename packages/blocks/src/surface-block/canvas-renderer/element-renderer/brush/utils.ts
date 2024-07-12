import { getStroke } from '../../../perfect-freehand/getStroke.js';

export function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStroke(points, {
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: points[0]?.length === 2,
    size: lineWidth,
    smoothing: 0.5,
    streamline: 0.5,
    thinning: 0.6,
  });
}
