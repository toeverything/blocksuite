import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { BlockHost } from '@blocksuite/shared';
import { BaseBlockModel } from '@blocksuite/store';

import type {
  XYWH,
  ViewportState,
  EdgelessSelectionState,
} from './edgeless-page-block';
import { GroupBlockModel } from '../..';
import { BlockElement } from '../../__internal__';
import '../../__internal__';

export function EdgelessSelectionBox(selectionState: EdgelessSelectionState) {
  const { selected, box } = selectionState;
  if (!selected.length || !box) return html`<div></div>`;

  const style = {
    position: 'absolute',
    left: box.x + 'px',
    top: box.y + 'px',
    width: box.w + 'px',
    height: box.h + 'px',
    border: '2px solid #6ccfff',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };

  return html` <div style=${styleMap(style)}></div> `;
}

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
        /* height: ${viewport.height}px; */
        height: 100%;

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
