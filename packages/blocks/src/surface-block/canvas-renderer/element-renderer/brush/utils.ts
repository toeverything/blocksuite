import { getStroke } from '../../../perfect-freehand/getStroke.js';

export function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStroke(points, {
    size: lineWidth,
    thinning: 0.6,
    streamline: 0.5,
    smoothing: 0.5,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: true,
  });
}
