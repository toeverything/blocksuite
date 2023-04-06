import type { Controller } from './types.js';

export function drawStraight(path: Path2D, controllers: Controller[]) {
  path.moveTo(controllers[0].x, controllers[0].y);

  const end = controllers[controllers.length - 1];
  path.lineTo(end.x, end.y);
}
