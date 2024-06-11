// import { PageRootBlockComponent } from '../page/page-root-block.js';
import { BlockElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('affine-preview-root')
export class PreviewRootBlockComponent extends BlockElement {
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
