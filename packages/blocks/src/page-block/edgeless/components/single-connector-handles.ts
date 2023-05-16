import type { Point } from '@blocksuite/connector';
import { Rectangle, simplifyPath } from '@blocksuite/connector';
import type {
  ConnectorElement,
  Controller,
  SurfaceManager,
} from '@blocksuite/phasor';
import { ConnectorMode } from '@blocksuite/phasor';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  generateConnectorPath,
  getAttachedPoint,
  getConnectorAttachedInfo,
  getXYWH,
  pickBy,
} from '../utils.js';

function capPointerdown(
  event: PointerEvent,
  surface: SurfaceManager,
  page: Page,
  element: ConnectorElement,
  position: 'start' | 'end',
  connectorMode: ConnectorMode,
  requestUpdate: () => void
) {
  const startX = event.clientX;
  const startY = event.clientY;

  const originControllers = element.controllers.map(c => ({
    ...c,
    x: c.x + element.x,
    y: c.y + element.y,
  }));

  const anchorPoint =
    position === 'start'
      ? originControllers[0]
      : originControllers[originControllers.length - 1];

  const elementX = anchorPoint.x;
  const elementY = anchorPoint.y;

  const pointermove = (mousePointerEvent: PointerEvent) => {
    const { clientX, clientY } = mousePointerEvent;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    const modelX = elementX + deltaX;
    const modelY = elementY + deltaY;
    const [x, y] = surface.toViewCoord(modelX, modelY);

    const { start, end } = getConnectorAttachedInfo(element, surface, page);

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

    const { point: newPoint, position: attachedPointPosition } =
      getAttachedPoint(modelX, modelY, newRect);

    let routes: Point[];
    if (position === 'start') {
      routes = generateConnectorPath(
        newRect,
        end.rect,
        newPoint,
        end.point,
        originControllers,
        connectorMode,
        'end'
      );
    } else {
      routes = generateConnectorPath(
        start.rect,
        newRect,
        start.point,
        newPoint,
        originControllers,
        connectorMode,
        'start'
      );
    }

    if (position === 'start') {
      surface.updateElement<'connector'>(element.id, {
        controllers: routes,
        startElement:
          picked && attachedPointPosition
            ? { id: picked.id, position: attachedPointPosition }
            : undefined,
      });
    } else {
      surface.updateElement<'connector'>(element.id, {
        controllers: routes,
        endElement:
          picked && attachedPointPosition
            ? { id: picked.id, position: attachedPointPosition }
            : undefined,
      });
    }

    requestUpdate();
  };

  const pointerup = () => {
    document.removeEventListener('pointermove', pointermove);
    document.removeEventListener('pointerup', pointerup);
  };

  document.addEventListener('pointermove', pointermove);
  document.addEventListener('pointerup', pointerup);
}

type Handle = {
  x: number;
  y: number;
  position: number;
  isVertical: boolean;
};

function getControllerHandles(controllers: Controller[]) {
  const handles: Handle[] = [];

  for (let i = 0; i < controllers.length - 1; i++) {
    const current = controllers[i];
    const next = controllers[i + 1];
    const isVertical = current.x === next.x;
    const handle = isVertical
      ? {
          x: current.x,
          y: (current.y + next.y) / 2,
          position: i,
          isVertical,
        }
      : {
          x: (current.x + next.x) / 2,
          y: current.y,
          position: i,
          isVertical,
        };
    handles.push(handle);
  }

  return handles;
}

function centerControllerPointerdown(
  event: PointerEvent,
  surface: SurfaceManager,
  page: Page,
  element: ConnectorElement,
  handle: Handle,
  requestUpdate: () => void
) {
  const startX = event.clientX;
  const startY = event.clientY;
  const { controllers, x, y } = element;

  const pointermove = (pointerMoveEvent: PointerEvent) => {
    const { isVertical, position } = handle;
    const { zoom } = surface.viewport;

    const absoluteControllers = controllers.map(c => ({
      ...c,
      x: c.x + x,
      y: c.y + y,
    }));

    const deltaX = isVertical ? pointerMoveEvent.clientX - startX : 0;
    const deltaY = isVertical ? 0 : pointerMoveEvent.clientY - startY;

    const point0 = absoluteControllers[position];
    const newPoint0 = {
      x: point0.x + deltaX / zoom,
      y: point0.y + deltaY / zoom,
      customized: true,
    };
    const point1 = absoluteControllers[position + 1];
    const newPoint1 = {
      x: point1.x + deltaX / zoom,
      y: point1.y + deltaY / zoom,
      customized: true,
    };

    if (position === 0) {
      // start
      absoluteControllers.splice(position + 1, 0, newPoint0);
      absoluteControllers[position + 2] = newPoint1;
    } else if (position === absoluteControllers.length - 2) {
      // end
      absoluteControllers[position] = newPoint0;
      absoluteControllers.splice(position + 1, 0, newPoint1);
    } else {
      absoluteControllers[position] = newPoint0;
      absoluteControllers[position + 1] = newPoint1;
    }

    surface.updateElement<'connector'>(element.id, {
      controllers: simplifyPath(absoluteControllers),
    });

    requestUpdate();
  };
  const pointerup = (pointerUpEvent: PointerEvent) => {
    document.removeEventListener('pointermove', pointermove);
    document.removeEventListener('pointerup', pointerup);
  };
  document.addEventListener('pointermove', pointermove);
  document.addEventListener('pointerup', pointerup);
}

export function SingleConnectorHandles(
  element: ConnectorElement,
  surface: SurfaceManager,
  page: Page,
  requestUpdate: () => void
) {
  const { controllers, mode } = element;
  const controllerHandles =
    mode === ConnectorMode.Orthogonal ? getControllerHandles(controllers) : [];
  const zoom = surface.viewport.zoom;
  const start = {
    position: 'absolute',
    left: `${controllers[0].x * zoom}px`,
    top: `${controllers[0].y * zoom}px`,
  };
  const end = {
    position: 'absolute',
    left: `${controllers[controllers.length - 1].x * zoom}px`,
    top: `${controllers[controllers.length - 1].y * zoom}px`,
  };
  return html`
    <style>
      .line-controller {
        position: absolute;
        width: 9px;
        height: 9px;
        box-sizing: border-box;
        border-radius: 50%;
        border: 2px solid var(--affine-text-emphasis-color);
        background-color: var(--affine-background-primary-color);
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 10;
        pointer-events: all;
        /**
         * Fix: pointerEvent stops firing after a short time.
         * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
         * up to the one that implements the gesture (in other words, the first containing scrolling element)
         * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
         */
        touch-action: none;
      }
    </style>
    <div
      class="line-controller line-start"
      style=${styleMap(start)}
      @pointerdown=${(e: PointerEvent) => {
        e.stopPropagation();
        capPointerdown(e, surface, page, element, 'start', mode, requestUpdate);
      }}
    ></div>
    <div
      class="line-controller line-end"
      style=${styleMap(end)}
      @pointerdown=${(e: PointerEvent) => {
        e.stopPropagation();
        capPointerdown(e, surface, page, element, 'end', mode, requestUpdate);
      }}
    ></div>
    ${repeat(
      controllerHandles,
      c => Math.random(),
      c => {
        const style = {
          left: `${c.x * zoom}px`,
          top: `${c.y * zoom}px`,
          cursor: c.isVertical ? 'col-resize' : 'row-resize',
        };
        return html`<div
          class="line-controller"
          style=${styleMap(style)}
          @pointerdown=${(e: PointerEvent) => {
            e.stopPropagation();
            centerControllerPointerdown(
              e,
              surface,
              page,
              element,
              c,
              requestUpdate
            );
          }}
        ></div>`;
      }
    )}
  `;
}
