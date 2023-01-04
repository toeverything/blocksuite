import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, type BlockHost } from '../__internal__/index.js';
import '../__internal__/rich-text/rich-text.js';
import type { SurfaceBlockModel } from './surface-model.js';

@customElement('affine-surface')
export class SurfaceBlockComponent extends LitElement {
  static styles = css`
    .affine-surface-block-container {
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: SurfaceBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    return html` <canvas class="affine-surface-block-container"> </canvas> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
