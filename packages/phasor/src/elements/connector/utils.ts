import { getBoundFromPoints } from '../../utils/bound.js';
import type { Controller, SerializedConnectorProps } from './types.js';

export function validateConnectorProps(
  props: Record<string, unknown>
): props is SerializedConnectorProps {
  return true;
}

export function getArrowPoints(
  [startX, startY]: number[],
  [endX, endY]: number[],
  arrowSize = 10
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);
  const oneSide = [
    endX - arrowSize * Math.cos(angle - Math.PI / 4),
    endY - arrowSize * Math.sin(angle - Math.PI / 4),
  ];
  const anotherSide = [
    endX - arrowSize * Math.cos(angle + Math.PI / 4),
    endY - arrowSize * Math.sin(angle + Math.PI / 4),
  ];
  return {
    sides: [oneSide, anotherSide],
    start: [startX, startY],
    end: [endX, endY],
  };
}

export function getConnectorPointsBound(controllers: Controller[]) {
  const last = controllers[controllers.length - 1];
  const secondToLast = controllers[controllers.length - 2];
  const arrowPoints = getArrowPoints(
    [last.x, last.y],
    [secondToLast.x, secondToLast.y]
  );

  const points = arrowPoints.sides.concat(controllers.map(c => [c.x, c.y]));
  return getBoundFromPoints(points);
}
