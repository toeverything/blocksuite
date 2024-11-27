import { BlockComponent } from '@blocksuite/block-std';
import { css, html } from 'lit';

export class SheetCell extends BlockComponent {
  static override styles = css`
    affine-sheet-cell {
      width: 100%;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
  }

  override renderBlock() {
    return html`${this.renderChildren(this.model)}`;
  }
}
