import type { Controller } from './types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;
const RADIUS = 10;

export function drawOrthogonal(path: Path2D, controllers: Controller[]) {
  path.moveTo(controllers[0].x, controllers[0].y);
  let lastX = controllers[0].x;
  let lastY = controllers[0].y;
  for (let i = 1; i < controllers.length - 1; i = i + 1) {
    const currentX = controllers[i].x;
    const currentY = controllers[i].y;
    const nextX = controllers[i + 1].x;
    const nextY = controllers[i + 1].y;

    const minX = Math.min(lastX, nextX);
    const minY = Math.min(lastY, nextY);
    const maxX = Math.max(lastX, nextX);
    const maxY = Math.max(lastY, nextY);
    const radius = Math.min(RADIUS, (maxX - minX) / 2, (maxY - minY) / 2);

    // current is right-bottom conner
    if (currentX === maxX && currentY === maxY) {
      if (lastX === currentX) {
        path.lineTo(currentX, currentY - radius);
        path.bezierCurveTo(
          currentX,
          currentY - kRect * radius,
          currentX - kRect * radius,
          currentY,
          currentX - radius,
          currentY
        );
      } else {
        path.lineTo(currentX - radius, currentY);
        path.bezierCurveTo(
          currentX - kRect * radius,
          currentY,
          currentX,
          currentY - kRect * radius,
          currentX,
          currentY - radius
        );
      }
    }
    // current is left-bottom conner
    else if (currentX === minX && currentY === maxY) {
      if (lastX === currentX) {
        path.lineTo(currentX, currentY - radius);
        path.bezierCurveTo(
          currentX,
          currentY - kRect * radius,
          currentX + kRect * radius,
          currentY,
          currentX + radius,
          currentY
        );
      } else {
        path.lineTo(currentX + radius, currentY);
        path.bezierCurveTo(
          currentX + kRect * radius,
          currentY,
          currentX,
          currentY - kRect * radius,
          currentX,
          currentY - radius
        );
      }
    }
    // current is left-top conner
    else if (currentX === minX && currentY === minY) {
      if (lastX === currentX) {
        path.lineTo(currentX, currentY + radius);
        path.bezierCurveTo(
          currentX,
          currentY + kRect * radius,
          currentX + kRect * radius,
          currentY,
          currentX + radius,
          currentY
        );
      } else {
        path.lineTo(currentX + radius, currentY);
        path.bezierCurveTo(
          currentX + kRect * radius,
          currentY,
          currentX,
          currentY + kRect * radius,
          currentX,
          currentY + radius
        );
      }
    }
    // current is right-top conner
    else if (currentX === maxX && currentY === minY) {
      if (lastX === currentX) {
        path.lineTo(currentX, currentY + radius);
        path.bezierCurveTo(
          currentX,
          currentY + kRect * radius,
          currentX - kRect * radius,
          currentY,
          currentX - radius,
          currentY
        );
      } else {
        path.lineTo(currentX - radius, currentY);
        path.bezierCurveTo(
          currentX - kRect * radius,
          currentY,
          currentX,
          currentY + kRect * radius,
          currentX,
          currentY + radius
        );
      }
    }

    lastX = currentX;
    lastY = currentY;
  }
  const end = controllers[controllers.length - 1];
  path.lineTo(end.x, end.y);
}
