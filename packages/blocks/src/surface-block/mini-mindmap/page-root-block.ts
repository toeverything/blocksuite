import { BlockElement } from '@blocksuite/block-std';
import { css, html } from 'lit';

import type { RootBlockModel } from '../../root-block/root-model.js';

export class MindmapPageBlock extends BlockElement<RootBlockModel> {
  static override styles = css`
    .affine-mini-mindmap-root {
      position: absolute;
      top: 0;
      left: 0;
      contain: size layout style;

      background-color: var(--affine-background-primary-color);
      background-image: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }
  `;

  override render() {
    return html` <div class="affine-mini-mindmap-root">${this.content}</div> `;
  }
}
