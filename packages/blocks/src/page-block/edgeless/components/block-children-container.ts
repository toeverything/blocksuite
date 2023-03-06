import type { SurfaceViewport } from '@blocksuite/phasor';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { BaseBlockModel } from '@blocksuite/store';
import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BlockElement } from '../../../__internal__/index.js';
import type {
  BlockHost,
  FrameBlockModel,
  TopLevelBlockModel,
} from '../../../index.js';
import { PADDING_X, PADDING_Y } from '../utils.js';

const SHAPE_PADDING = 48;

function EdgelessBlockChild(
  model: TopLevelBlockModel,
  host: BlockHost,
  viewport: SurfaceViewport
) {
  const { xywh } = model;
  const isSurfaceElement = false;
  const { zoom, viewportX, viewportY } = viewport;
  const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
  const translateX =
    (modelX - viewportX - (isSurfaceElement ? SHAPE_PADDING / 2 : 0)) * zoom;
  const translateY =
    (modelY - viewportY - (isSurfaceElement ? SHAPE_PADDING / 2 : 0)) * zoom;

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: modelW + (isSurfaceElement ? SHAPE_PADDING : PADDING_X) + 'px',
    height: modelH + (isSurfaceElement ? SHAPE_PADDING : PADDING_Y) + 'px',
    padding: isSurfaceElement ? '0' : `${PADDING_X / 2}px`,
    background: isSurfaceElement ? 'transparent' : 'white',
    pointerEvents: isSurfaceElement ? 'none' : 'all',
    zIndex: '0',
  };

  return html`
    <div class="affine-edgeless-block-child" style=${styleMap(style)}>
      ${BlockElement(model, host, true)}
    </div>
  `;
}

export function EdgelessBlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost,
  viewport: SurfaceViewport
) {
  return html`
    ${repeat(
      model.children,
      child => child.id,
      child => EdgelessBlockChild(child as FrameBlockModel, host, viewport)
    )}
  `;
}
