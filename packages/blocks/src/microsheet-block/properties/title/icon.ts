import { BaseCellRenderer } from '@blocksuite/microsheet-data-view';
import { css, html } from 'lit';

export class IconCell extends BaseCellRenderer<string> {
  static override styles = css`
    affine-microsheet-image-cell {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
    }
    affine-microsheet-image-cell img {
      width: 20px;
      height: 20px;
    }
  `;

  override render() {
    return html`<img src=${this.value ?? ''}></img>`;
  }
}
