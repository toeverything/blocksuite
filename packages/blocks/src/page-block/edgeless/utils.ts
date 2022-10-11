import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { BlockHost } from '@blocksuite/shared';

import type { ViewportState } from './edgeless-page-block';
import type { GroupBlockModel } from '../..';
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

export function EdgelessBlockChild(
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
    background: '#dedede',
  };

  return html`
    <div style=${styleMap(style)}>${BlockElement(model, host)}</div>
  `;
}
