import type { Point } from '@blocksuite/connector';
import { Rectangle, simplifyPath } from '@blocksuite/connector';
import type {
  ConnectorElement,
  Controller,
  SurfaceManager,
} from '@blocksuite/phasor';
import { ConnectorMode } from '@blocksuite/phasor';
import { getBrushBoundFromPoints } from '@blocksuite/phasor';
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

function capMousedown(
  event: MouseEvent,
  surface: SurfaceManager,
  page: Page,
  element: ConnectorElement,
  position: 'start' | 'end',
  connectorMode: ConnectorMode,
  requestUpdate: () => void
) {
  const originControllers = element.controllers.map(c => ({
    ...c,
    x: c.x + element.x,
    y: c.y + element.y,
  }));
  const mousemove = (mouseMoveEvent: MouseEvent) => {
    const { x, y } = mouseMoveEvent;
    const [modelX, modelY] = surface.toModelCoord(x, y);
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

    const { point: newPoint, direction: startDirection } = getAttachedPoint(
      modelX,
      modelY,
      newRect
    );

    let routes: Point[];
    if (position === 'start') {
      if (connectorMode === ConnectorMode.Orthogonal) {
        routes = generateConnectorPath(
          newRect,
          end.rect,
          newPoint,
          end.point,
          originControllers,
          'end'
        );
      } else {
        routes = [newPoint, end.point];
      }
    } else {
      if (connectorMode === ConnectorMode.Orthogonal) {
        routes = generateConnectorPath(
          start.rect,
          newRect,
          start.point,
          newPoint,
          originControllers,
          'start'
        );
      } else {
        routes = [start.point, newPoint];
      }
    }

    const bound = getBrushBoundFromPoints(
      routes.map(r => [r.x, r.y]),
      0
    );
    const controllers = routes.map(v => {
      return {
        ...v,
        x: v.x - bound.x,
        y: v.y - bound.y,
      };
    });

    if (position === 'start') {
      surface.updateConnectorElement(element.id, bound, controllers, {
        startElement: picked
          ? { id: picked.id, direction: startDirection }
          : undefined,
      });
    } else {
      surface.updateConnectorElement(element.id, bound, controllers, {
        endElement: picked
          ? { id: picked.id, direction: startDirection }
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

function centerControllerMousedown(
  event: MouseEvent,
  surface: SurfaceManager,
  page: Page,
  element: ConnectorElement,
  handle: Handle,
  requestUpdate: () => void
) {
  const startX = event.clientX;
  const startY = event.clientY;
  const { controllers, x, y } = element;

  const mousemove = (mouseMoveEvent: MouseEvent) => {
    const { isVertical, position } = handle;
    const { zoom } = surface.viewport;

    const absoluteControllers = controllers.map(c => ({
      ...c,
      x: c.x + x,
      y: c.y + y,
    }));

    const deltaX = isVertical ? mouseMoveEvent.clientX - startX : 0;
    const deltaY = isVertical ? 0 : mouseMoveEvent.clientY - startY;

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

    const bound = getBrushBoundFromPoints(
      absoluteControllers.map(r => [r.x, r.y]),
      0
    );

    const newControllers = simplifyPath(
      absoluteControllers.map(c => ({
        ...c,
        x: c.x - bound.x,
        y: c.y - bound.y,
      }))
    );
    surface.updateConnectorElement(element.id, bound, newControllers);

    requestUpdate();
  };
  const mouseup = (mouseUpEvent: MouseEvent) => {
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
  const { controllers, mode } = element;
  const controllerHandles =
    mode === ConnectorMode.Orthogonal ? getControllerHandles(controllers) : [];
  const start = {
    position: 'absolute',
    left: `${controllers[0].x}px`,
    top: `${controllers[0].y}px`,
  };
  const end = {
    position: 'absolute',
    left: `${controllers[controllers.length - 1].x}px`,
    top: `${controllers[controllers.length - 1].y}px`,
  };
  return html`
    <style>
      .line-controller {
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
      class="line-controller"
      style=${styleMap(start)}
      @mousedown=${(e: MouseEvent) => {
        capMousedown(e, surface, page, element, 'start', mode, requestUpdate);
      }}
    ></div>
    <div
      class="line-controller"
      style=${styleMap(end)}
      @mousedown=${(e: MouseEvent) => {
        capMousedown(e, surface, page, element, 'end', mode, requestUpdate);
      }}
    ></div>
    ${repeat(
      controllerHandles,
      c => Math.random(),
      c => {
        const style = {
          left: `${c.x}px`,
          top: `${c.y}px`,
          cursor: c.isVertical ? 'col-resize' : 'row-resize',
        };
        return html`<div
          class="line-controller"
          style=${styleMap(style)}
          @mousedown=${(e: MouseEvent) => {
            centerControllerMousedown(
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
