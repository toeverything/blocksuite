// import { PageRootBlockComponent } from '../page/page-root-block.js';
import { BlockComponent } from '@blocksuite/block-std';
import { css, html } from 'lit';

export class PreviewRootBlockComponent extends BlockComponent {
  static override styles = css`
    affine-preview-root {
      display: block;
    }
  `;

  override renderBlock() {
    return html`<div class="affine-preview-root">
      ${this.host.renderChildren(this.model)}
    </div>`;
  }
}
