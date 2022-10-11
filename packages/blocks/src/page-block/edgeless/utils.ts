import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { BlockHost } from '@blocksuite/shared';
import { BaseBlockModel } from '@blocksuite/store';

import type { ViewportState } from './edgeless-page-block';
import { GroupBlockModel } from '../..';
import { BlockElement } from '../../__internal__';
import '../../__internal__';

const MIN_ZOOM = 0.1;

export function applyDeltaZoom(
  current: ViewportState,
  delta: number
): ViewportState {
  const val = (current.zoom * (100 + delta)) / 100;
  const newZoom = Math.max(val, MIN_ZOOM);
  // TODO ensure center stable
  return { ...current, zoom: newZoom };
}

export function applyDeltaCenter(
  current: ViewportState,
  deltaX: number,
  deltaY: number
): ViewportState {
  const newX = current.viewportX + deltaX;
  const newY = current.viewportY + deltaY;
  return { ...current, viewportX: newX, viewportY: newY };
}

type XYWH = [number, number, number, number];

function EdgelessBlockChild(
  model: GroupBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  const { xywh } = model;
  const { zoom, viewportX, viewportY } = viewport;
  const [x, y, w, h] = JSON.parse(xywh) as XYWH;
  const translateX = (x - viewportX) * zoom;
  const translateY = (y - viewportY) * zoom;

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: w + 'px',
    minHeight: h + 'px',
    background: 'white',
  };

  return html`
    <div style=${styleMap(style)}>${BlockElement(model, host)}</div>
  `;
}

export function EdgelessBlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  const { zoom, viewportX, viewportY } = viewport;
  const translateX = -viewportX * zoom;
  const translateY = -viewportY * zoom;

  return html`
    <style>
      .affine-block-children-container.edgeless {
        padding-left: 0;
        position: relative;
        overflow: hidden;
        border: 1px #ccc solid;
        /* max-width: 300px; */
        height: ${viewport.height}px;

        background-image: linear-gradient(#cccccc66 0.1em, transparent 0.1em),
          linear-gradient(90deg, #cccccc66 0.1em, transparent 0.1em);
        background-size: ${20 * viewport.zoom}px ${20 * viewport.zoom}px;
        background-position: ${translateX}px ${translateY}px;
      }
    </style>
    <div class="affine-block-children-container edgeless">
      ${repeat(
        model.children,
        child => child.id,
        child => EdgelessBlockChild(child as GroupBlockModel, host, viewport)
      )}
    </div>
  `;
}
