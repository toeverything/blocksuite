import { EDGELESS_BLOCK_CHILD_PADDING } from '@blocksuite/global/config';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { TemplateResult } from 'lit';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { TopLevelBlockModel } from '../../../__internal__/utils/types.js';
import { DEFAULT_FRAME_COLOR } from '../../../frame-block/frame-model.js';

function EdgelessMask() {
  const style = {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    right: '0',
    zIndex: '1',
  };
  return html`
    <div class="affine-edgeless-mask" style=${styleMap(style)}></div>
  `;
}

function EdgelessBlockChild(
  index: number,
  model: TopLevelBlockModel,
  active: boolean,
  renderer: (model: TopLevelBlockModel) => TemplateResult
) {
  const { xywh, background } = model;
  const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);

  const style = {
    position: 'absolute',
    transform: `translate(${modelX}px, ${modelY}px)`,
    transformOrigin: '0 0',
    width: modelW + 'px',
    height: modelH + 'px',
    padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
    background: `var(${background ?? DEFAULT_FRAME_COLOR})`,
    pointerEvents: 'all',
    zIndex: `${index}`,
    boxSizing: 'border-box',
    borderRadius: '8px',
    border: '2px solid var(--affine-black-10)',
    boxShadow: 'var(--affine-shadow-3)',
  };

  const mask = active ? nothing : EdgelessMask();

  return html`
    <div class="affine-edgeless-block-child" style=${styleMap(style)}>
      ${renderer(model)} ${mask}
    </div>
  `;
}

export function EdgelessBlockChildrenContainer(
  frames: TopLevelBlockModel[],
  active: boolean,
  renderer: (model: TopLevelBlockModel) => TemplateResult
) {
  return html`
    ${repeat(
      frames,
      child => child.id,
      (child, index) => EdgelessBlockChild(index, child, active, renderer)
    )}
  `;
}
