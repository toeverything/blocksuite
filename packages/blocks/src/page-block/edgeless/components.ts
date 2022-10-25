import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseBlockModel } from '@blocksuite/store';

import { GroupBlockModel } from '../..';
import type {
  EdgelessSelectionState,
  ViewportState,
  XYWH,
} from './selection-manager';
import { BlockElement, BlockHost } from '../../__internal__';
import '../../__internal__';
import { PADDING_X, PADDING_Y } from './utils';

export function EdgelessSelectedRect(
  state: EdgelessSelectionState,
  zoom: number
) {
  const { type } = state;
  if (type === 'none') return html`<div></div>`;

  const { box } = state;
  const color = state.active ? '#6ccfff' : '#ccc';

  const style = {
    position: 'absolute',
    left: box.x + 'px',
    top: box.y + 'px',
    width: box.width + PADDING_X * zoom + 'px',
    height: box.height + PADDING_Y * zoom + 'px',
    border: `1px solid ${color}`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };

  return html`
    <div class="affine-edgeless-selected-rect" style=${styleMap(style)}></div>
  `;
}

function EdgelessBlockChild(
  model: GroupBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  const { xywh } = model;
  const { zoom, viewportX, viewportY } = viewport;
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const translateX = (modelX - viewportX) * zoom;
  const translateY = (modelY - viewportY) * zoom;

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: modelW + PADDING_X + 'px',
    minHeight: modelH + PADDING_Y + 'px',
    paddingLeft: '9px',
    paddingRight: '9px',
    paddingBottom: '18px',
    background: 'white',
    boxShadow: '0 0 7px #ddd',
  };

  return html`
    <div class="affine-edgeless-block-child" style=${styleMap(style)}>
      ${BlockElement(model, host)}
    </div>
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

  const gridStyle = {
    backgroundImage:
      'linear-gradient(#cccccc66 1px, transparent 1px),linear-gradient(90deg, #cccccc66 1px, transparent 1px)',
  };
  const defaultStyle = {};
  const USE_GRID = location.href.includes('grid');
  const style = USE_GRID ? gridStyle : defaultStyle;

  return html`
    <style>
      .affine-block-children-container.edgeless {
        padding-left: 0;
        position: relative;
        overflow: hidden;
        /* max-width: 300px; */
        /* height: ${viewport.height}px; */
        height: 100%;

        /* background-image: linear-gradient(#cccccc66 1px, transparent 1px),
          linear-gradient(90deg, #cccccc66 1px, transparent 1px); */
        background-size: ${20 * viewport.zoom}px ${20 * viewport.zoom}px;
        background-position: ${translateX}px ${translateY}px;
        background-color: #fff;
      }
    </style>
    <div
      class="affine-block-children-container edgeless"
      style=${styleMap(style)}
    >
      ${repeat(
        model.children,
        child => child.id,
        child => EdgelessBlockChild(child as GroupBlockModel, host, viewport)
      )}
    </div>
  `;
}
