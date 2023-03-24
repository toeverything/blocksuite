import type { SurfaceViewport } from '@blocksuite/phasor';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { BaseBlockModel } from '@blocksuite/store';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BlockElement } from '../../../__internal__/service/components.js';
import type {
  BlockHost,
  FrameBlockModel,
  TopLevelBlockModel,
} from '../../../index.js';
import { EDGELESS_BLOCK_CHILD_PADDING } from '../../utils/container-operations.js';

function EdgelessMask() {
  const style = {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    right: '0',
  };
  return html`
    <div class="affine-edgeless-mask" style=${styleMap(style)}></div>
  `;
}

function EdgelessBlockChild(
  model: TopLevelBlockModel,
  host: BlockHost,
  viewport: SurfaceViewport,
  active: boolean
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

  const mask = active ? nothing : EdgelessMask();

  return html`
    <div class="affine-edgeless-block-child" style=${styleMap(style)}>
      ${BlockElement(model, host, true)} ${mask}
    </div>
  `;
}

export function EdgelessBlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost,
  viewport: SurfaceViewport,
  active: boolean
) {
  return html`
    ${repeat(
      model.children,
      child => child.id,
      child =>
        EdgelessBlockChild(child as FrameBlockModel, host, viewport, active)
    )}
  `;
}
