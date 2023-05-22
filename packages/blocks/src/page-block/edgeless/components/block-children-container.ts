import {
  EDGELESS_BLOCK_CHILD_PADDING,
  FRAME_BACKGROUND_COLORS,
} from '@blocksuite/global/config';
import type { SurfaceViewport } from '@blocksuite/phasor';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { TemplateResult } from 'lit';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { BlockHost, TopLevelBlockModel } from '../../../index.js';

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
  host: BlockHost,
  viewport: SurfaceViewport,
  active: boolean,
  renderer: (model: TopLevelBlockModel) => TemplateResult
) {
  const { xywh, background } = model;
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
    background: `var(${background || FRAME_BACKGROUND_COLORS[0]})`,
    pointerEvents: 'all',
    zIndex: `${index}`,
    boxSizing: 'border-box',
    borderRadius: '4px',
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
  host: BlockHost,
  viewport: SurfaceViewport,
  active: boolean,
  renderer: (model: TopLevelBlockModel) => TemplateResult
) {
  return html`
    ${repeat(
      frames,
      child => child.id,
      (child, index) =>
        EdgelessBlockChild(index, child, host, viewport, active, renderer)
    )}
  `;
}
