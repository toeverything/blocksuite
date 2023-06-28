import type { ConnectorElement } from '@blocksuite/phasor';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

function capPointerdown(
  event: PointerEvent,
  edgeless: EdgelessPageBlockComponent,
  connector: ConnectorElement,
  connection: 'target' | 'source',
  requestUpdate: () => void
) {
  const pointermove = (mousePointerEvent: PointerEvent) => {
    const { clientX, clientY } = mousePointerEvent;
    const modelXY = edgeless.surface.viewport.clientToModelCoord([
      clientX,
      clientY,
    ]);
    edgeless.connector.updateConnection(connector, modelXY, connection);
    requestUpdate();
  };

  const pointerup = () => {
    edgeless.connector.clear();
    edgeless.page.captureSync();
    document.removeEventListener('pointermove', pointermove);
    document.removeEventListener('pointerup', pointerup);
  };

  document.addEventListener('pointermove', pointermove);
  document.addEventListener('pointerup', pointerup);
}

export function SingleConnectorHandles(
  element: ConnectorElement,
  edgeless: EdgelessPageBlockComponent,
  requestUpdate: () => void
) {
  const { surface } = edgeless;
  const { absolutePath } = element;
  const zoom = surface.viewport.zoom;
  const { x, y } = element;
  const start = {
    position: 'absolute',
    left: `${(absolutePath[0][0] - x) * zoom}px`,
    top: `${(absolutePath[0][1] - y) * zoom}px`,
  };
  const end = {
    position: 'absolute',
    left: `${(absolutePath[absolutePath.length - 1][0] - x) * zoom}px`,
    top: `${(absolutePath[absolutePath.length - 1][1] - y) * zoom}px`,
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
      .line-controller-hidden {
        display: none;
      }
    </style>
    <div
      class="line-controller line-start"
      style=${styleMap(start)}
      @pointerdown=${(e: PointerEvent) => {
        e.stopPropagation();
        capPointerdown(e, edgeless, element, 'source', requestUpdate);
      }}
    ></div>
    <div
      class="line-controller line-end"
      style=${styleMap(end)}
      @pointerdown=${(e: PointerEvent) => {
        e.stopPropagation();
        capPointerdown(e, edgeless, element, 'target', requestUpdate);
      }}
    ></div>
  `;
}
