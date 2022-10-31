import { html, type TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseBlockModel } from '@blocksuite/store';

import { GroupBlockModel } from '../..';
import type {
  EdgelessSelectionManager,
  ViewportState,
  XYWH,
} from './selection-manager';
import { BlockElement, BlockHost } from '../../__internal__';
import '../../__internal__';
import { PADDING_X, PADDING_Y } from './utils';

function getCommonRectStyle(rect: DOMRect, zoom: number) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + PADDING_X * zoom + 'px',
    height: rect.height + PADDING_Y * zoom + 'px',
    borderRadius: `${10 * zoom}px`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };
}

export function EdgelessHoverRect(rect: DOMRect | null, zoom: number) {
  if (!rect) return html`<div></div>`;

  const style = {
    ...getCommonRectStyle(rect, zoom),
    border: '1px solid var(--affine-primary-color)',
  };

  return html`
    <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
  `;
}

function HandleRect(centerX: number, centerY: number) {
  const style = {
    position: 'absolute',
    left: centerX - 6 + 'px',
    top: centerY - 6 + 'px',
    width: '12px',
    height: '12px',
    borderRadius: '6px',
    zIndex: '10',
    border: '2px var(--affine-primary-color) solid',
    background: 'white',
    cursor: 'not-allowed',
  };

  return html` <div style=${styleMap(style)}></div> `;
}

export function EdgelessSelectedRect(
  selection: EdgelessSelectionManager,
  zoom: number
) {
  const { state } = selection;
  const { type } = state;
  if (type === 'none') return html``;

  const { rect } = state;
  const style = {
    border: `${state.active ? 2 : 1}px solid var(--affine-primary-color)`,
    ...getCommonRectStyle(rect, zoom),
  };

  let handles: TemplateResult | null = null;
  if (!state.active) {
    const leftCenter = [
      rect.x,
      rect.y + rect.height / 2 + (PADDING_Y * zoom) / 2,
    ];
    const rightCenter = [
      rect.x + rect.width + PADDING_X * zoom,
      rect.y + rect.height / 2 + (PADDING_Y * zoom) / 2,
    ];
    const handleLeft = HandleRect(leftCenter[0], leftCenter[1]);
    const handleRight = HandleRect(rightCenter[0], rightCenter[1]);
    handles = html` ${handleLeft}${handleRight} `;
  }

  return html`
    ${handles}
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
    height: modelH + PADDING_Y + 'px',
    padding: `${PADDING_X / 2}px`,
    background: 'white',
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
