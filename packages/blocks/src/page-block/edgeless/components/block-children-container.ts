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
import { EDGELESS_BLOCK_CHILD_PADDING } from '../../utils/container-operations.js';

function EdgelessBlockChild(
  model: TopLevelBlockModel,
  host: BlockHost,
  viewport: SurfaceViewport
) {
  const { xywh } = model;
  const { zoom, viewportX, viewportY } = viewport;
  const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
  const translateX = (modelX - viewportX) * zoom;
  const translateY = (modelY - viewportY) * zoom;

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: modelW + 'px',
    height: modelH + 'px',
    padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
    background: 'white',
    pointerEvents: 'all',
    zIndex: '0',
    boxSizing: 'border-box',
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
