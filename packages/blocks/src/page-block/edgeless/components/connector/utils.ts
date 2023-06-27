import type { Direction, Point as ConnectorPoint } from '@blocksuite/connector';
import { Rectangle, route, simplifyPath } from '@blocksuite/connector';
import type { SurfaceManager } from '@blocksuite/phasor';
import {
  ConnectorElement,
  ConnectorMode,
  type Controller,
  deserializeXYWH,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';

import { ATTACHED_DISTANCE } from '../../utils/consts.js';
import { getXYWH, pickSurfaceElementById } from '../../utils/query.js';
import type { Selectable } from '../../utils/selection-manager.js';

export function generateConnectorPath(
  startRect: Rectangle | null,
  endRect: Rectangle | null,
  startPoint: ConnectorPoint,
  endPoint: ConnectorPoint,
  originControllers: Controller[],
  mode: ConnectorMode = ConnectorMode.Orthogonal,
  // this indicating which part of the path is fixed when there are customized control points
  fixed?: 'start' | 'end'
) {
  if (mode !== ConnectorMode.Orthogonal) {
    return [startPoint, endPoint];
  }
  let customizedStart = Infinity;
  let customizedEnd = -1;
  originControllers.forEach((c, index) => {
    if (c.customized) {
      customizedStart = Math.min(customizedStart, index);
      customizedEnd = Math.max(customizedEnd, index);
    }
  });

  let path: ConnectorPoint[] = [];
  if (fixed && customizedEnd > -1) {
    const part0EndPoint = originControllers[customizedStart];
    const part0 =
      fixed === 'start'
        ? originControllers.slice(0, customizedStart + 1)
        : route(startRect ? [startRect] : [], [startPoint, part0EndPoint]);

    const part1 = originControllers.slice(customizedStart, customizedEnd + 1);

    const part2StartPoint = originControllers[customizedEnd];
    const part2 =
      fixed === 'end'
        ? originControllers.slice(customizedEnd)
        : route(endRect ? [endRect] : [], [part2StartPoint, endPoint]);

    path = simplifyPath([...part0.slice(0, -1), ...part1, ...part2.slice(1)]);
  } else {
    path = route([startRect, endRect].filter(r => !!r) as Rectangle[], [
      startPoint,
      endPoint,
    ]);
  }

  if (path.length < 3) {
    path = [startPoint, endPoint];
  }

  return path;
}

function getAttachedPointByDirection(
  { x, y, w, h }: Rectangle,
  direction: Direction
): ConnectorPoint {
  switch (direction) {
    case 'top': {
      return { x: x + w / 2, y };
    }
    case 'right': {
      return { x: x + w, y: y + h / 2 };
    }
    case 'bottom': {
      return { x: x + w / 2, y: y + h };
    }
    case 'left': {
      return { x, y: y + h / 2 };
    }
    default: {
      throw new Error(`Unknown direction: ${direction}`);
    }
  }
}

export function getAttachedPoint(
  x: number,
  y: number,
  rect?: Rectangle | null
): { point: ConnectorPoint; position: ConnectorPoint | null } {
  if (!rect || !rect.contains(x, y)) {
    return { point: { x, y }, position: null };
  }
  const direction = rect.relativeDirection(x, y);
  const position = {
    x: (x - rect.x) / rect.w,
    y: (y - rect.y) / rect.h,
  };

  const attachedPoint = getAttachedPointByDirection(rect, direction);
  const distance = Math.sqrt(
    Math.pow(x - attachedPoint.x, 2) + Math.pow(y - attachedPoint.y, 2)
  );
  if (distance < ATTACHED_DISTANCE) {
    return {
      point: attachedPoint,
      position: {
        x: (attachedPoint.x - rect.x) / rect.w,
        y: (attachedPoint.y - rect.y) / rect.h,
      },
    };
  }

  return { point: { x, y }, position };
}

function getAttachedPointByPosition(rect: Rectangle, position: ConnectorPoint) {
  const x = rect.x + rect.w * position.x;
  const y = rect.y + rect.h * position.y;

  const direction = rect.relativeDirection(x, y);
  const attachedPoint = getAttachedPointByDirection(rect, direction);
  const distance = Math.sqrt(
    Math.pow(x - attachedPoint.x, 2) + Math.pow(y - attachedPoint.y, 2)
  );
  if (distance < ATTACHED_DISTANCE) {
    return attachedPoint;
  }

  return { x, y };
}

export function getConnectorAttachedInfo(
  element: ConnectorElement,
  surface: SurfaceManager,
  page: Page
) {
  const { startElement, endElement } = element;
  const start = startElement?.id
    ? pickSurfaceElementById(surface, page, startElement.id)
    : null;
  const startRect = start
    ? new Rectangle(...deserializeXYWH(getXYWH(start)))
    : null;
  const startPoint =
    startRect && startElement
      ? getAttachedPointByPosition(startRect, startElement.position)
      : {
          x: element.x + element.controllers[0].x,
          y: element.y + element.controllers[0].y,
        };

  const end = endElement?.id
    ? pickSurfaceElementById(surface, page, endElement.id)
    : null;
  const endRect = end ? new Rectangle(...deserializeXYWH(getXYWH(end))) : null;
  const endPoint =
    endRect && endElement
      ? getAttachedPointByPosition(endRect, endElement.position)
      : {
          x: element.x + element.controllers[element.controllers.length - 1].x,
          y: element.y + element.controllers[element.controllers.length - 1].y,
        };

  return {
    start: {
      element: startElement,
      rect: startRect,
      point: startPoint,
    },
    end: {
      element: endElement,
      rect: endRect,
      point: endPoint,
    },
  };
}

export function isConnectorAndBindingsAllSelected(
  connector: ConnectorElement,
  selected: Selectable[]
) {
  const connectorSelected = selected.find(s => s.id === connector.id);
  if (!connectorSelected) {
    return false;
  }
  const { startElement, endElement } = connector;
  const startSelected = selected.find(s => s.id === startElement?.id);
  const endSelected = selected.find(s => s.id === endElement?.id);
  if (!startElement && !endElement) {
    return true;
  }
  if (!startElement && endSelected) {
    return true;
  }
  if (!endElement && startSelected) {
    return true;
  }
  if (startSelected && endSelected) {
    return true;
  }
  return false;
}

export function handleElementChangedEffectForConnector(
  element: Selectable,
  selected: Selectable[],
  surface: SurfaceManager,
  page: Page
) {
  if (element.type !== 'connector') {
    const bindingElements = surface.getBindingElements(element.id);
    bindingElements.forEach(bindingElement => {
      if (bindingElement instanceof ConnectorElement) {
        // if all connector and binding element are selected, they will process in common method.
        // like:
        // mode-controllers/default-mode: _handleSurfaceDragMove
        // components/edgeless-selected-rect: _onDragMove
        if (isConnectorAndBindingsAllSelected(bindingElement, selected)) {
          return;
        }
        const { startElement, endElement, id, x, y, controllers, mode } =
          bindingElement;
        const { start, end } = getConnectorAttachedInfo(
          bindingElement,
          surface,
          page
        );
        const fixed =
          startElement?.id === element.id
            ? 'end'
            : endElement?.id === element.id
            ? 'start'
            : undefined;

        const routes = generateConnectorPath(
          start.rect,
          end.rect,
          start.point,
          end.point,
          controllers.map(c => ({ ...c, x: c.x + x, y: c.y + y })),
          mode,
          fixed
        );

        surface.updateElement<'connector'>(id, {
          controllers: routes,
        });
      }
    });
  }
}
