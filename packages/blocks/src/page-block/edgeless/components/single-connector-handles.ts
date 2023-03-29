import { Rectangle, route } from '@blocksuite/connector';
import type { ConnectorElement, SurfaceManager } from '@blocksuite/phasor';
import { getBrushBoundFromPoints } from '@blocksuite/phasor';
import { AttachedElement, deserializeXYWH } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import {
  getPoint,
  getPointByDirection,
} from '../mode-controllers/connector-mode.js';
import { getXYWH, pickBy } from '../utils.js';

function mousedown(
  event: MouseEvent,
  surface: SurfaceManager,
  page: Page,
  element: ConnectorElement,
  position: 'start' | 'end',
  requestUpdate: () => void
) {
  const mousemove = (mouseMoveEvent: MouseEvent) => {
    const { x, y } = mouseMoveEvent;
    const [modelX, modelY] = surface.toModelCoord(x, y);
    const { startElement, endElement } = element;
    const originStart = startElement?.id
      ? surface.pickById(startElement.id)
      : null;
    const originStartRect = originStart
      ? new Rectangle(...deserializeXYWH(getXYWH(originStart)))
      : null;
    const originStartPoint =
      originStartRect && startElement
        ? getPointByDirection(originStartRect, startElement.direction)
        : {
            x: element.x + element.controllers[0],
            y: element.y + element.controllers[1],
          };

    const originEnd = endElement?.id ? surface.pickById(endElement.id) : null;
    const originEndRect = originEnd
      ? new Rectangle(...deserializeXYWH(getXYWH(originEnd)))
      : null;
    const originEndPoint =
      originEndRect && endElement
        ? getPointByDirection(originEndRect, endElement.direction)
        : {
            x: element.x + element.controllers[element.controllers.length - 2],
            y: element.y + element.controllers[element.controllers.length - 1],
          };

    const picked = pickBy(
      surface,
      page,
      x,
      y,
      ele => ele.id !== element.id && ele.type !== 'connector'
    );
    const newRect = picked
      ? new Rectangle(...deserializeXYWH(getXYWH(picked)))
      : null;

    const { point: newPoint, direction: startDirection } = getPoint(
      modelX,
      modelY,
      newRect
    );

    const routes =
      position === 'start'
        ? route([newRect, originEndRect].filter(r => !!r) as Rectangle[], [
            newPoint,
            originEndPoint,
          ])
        : route([originStartRect, newRect].filter(r => !!r) as Rectangle[], [
            originStartPoint,
            newPoint,
          ]);
    const bound = getBrushBoundFromPoints(
      routes.map(r => [r.x, r.y]),
      0
    );
    const controllers = routes
      .map(r => [r.x, r.y])
      .flat()
      .map((v, index) => {
        return index % 2 ? v - bound.y : v - bound.x;
      });

    if (position === 'start') {
      surface.updateConnectorElement(element.id, bound, controllers, {
        startElement: newRect
          ? { id: newRect.id, direction: startDirection }
          : undefined,
      });
    } else {
      surface.updateConnectorElement(element.id, bound, controllers, {
        endElement: newRect
          ? { id: newRect.id, direction: startDirection }
          : undefined,
      });
    }

    requestUpdate();
  };

  const mouseup = () => {
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  };

  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
}

export function SingleConnectorHandles(
  element: ConnectorElement,
  surface: SurfaceManager,
  page: Page,
  requestUpdate: () => void
) {
  const { controllers } = element;
  const start = {
    position: 'absolute',
    left: `${controllers[0]}px`,
    top: `${controllers[1]}px`,
  };
  const end = {
    position: 'absolute',
    left: `${controllers[controllers.length - 2]}px`,
    top: `${controllers[controllers.length - 1]}px`,
  };
  return html`
    <style>
      .line-cap-controller {
        position: absolute;
        width: 9px;
        height: 9px;
        box-sizing: border-box;
        border-radius: 50%;
        border: 2px solid #5438ff;
        background-color: #fff;
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 10;
        pointer-events: all;
      }
    </style>
    <div
      class="line-cap-controller"
      style=${styleMap(start)}
      @mousedown=${(e: MouseEvent) => {
        mousedown(e, surface, page, element, 'start', requestUpdate);
      }}
    ></div>
    <div
      class="line-cap-controller"
      style=${styleMap(end)}
      @mousedown=${(e: MouseEvent) => {
        mousedown(e, surface, page, element, 'end', requestUpdate);
      }}
    ></div>
  `;
}
