import { BlockElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../_common/theme/css-variables.js';
import { wrapFontFamily } from '../surface-block/utils/font.js';
import type { EdgelessTextBlockModel } from './edgeless-text-model.js';

export const EDGELESS_TEXT_BLOCK_MIN_WIDTH = 50;
export const EDGELESS_TEXT_BLOCK_MIN_HEIGHT = 50;

@customElement('affine-edgeless-text')
export class EdgelessTextBlockComponent extends BlockElement<EdgelessTextBlockModel> {
  override renderBlock() {
    const { color, fontFamily, fontStyle, fontWeight, textAlign } = this.model;

    const style = styleMap({
      color: isCssVariable(color) ? `var(${color})` : color,
      fontFamily: wrapFontFamily(fontFamily),
      fontStyle,
      fontWeight,
      textAlign,
    });

    return html`
      <div style=${style} class="affine-edgeless-text-block-container">
        <div class="affine-block-children-container">
          ${this.renderChildren(this.model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-text': EdgelessTextBlockComponent;
  }
}
