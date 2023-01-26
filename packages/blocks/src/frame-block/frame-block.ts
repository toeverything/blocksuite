/// <reference types="vite/client" />
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FrameBlockModel } from './frame-model.js';
import {
  type BlockHost,
  NonShadowLitElement,
  BlockChildrenContainer,
} from '../__internal__/index.js';
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';

@customElement('affine-frame')
export class FrameBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-frame-block-container.selected {
      background-color: var(--affine-selected-color);
    }
  `;

  @property({ hasChanged: () => true })
  model!: FrameBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );

    return html`
      <div class="affine-frame-block-container">${childrenContainer}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
