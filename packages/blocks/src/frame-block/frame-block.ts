/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import type { FrameBlockModel } from './frame-model.js';
import { FrameBlockService } from './frame-service.js';

@customElement('affine-frame')
export class FrameBlockComponent extends BlockElement<FrameBlockModel> {
  static override styles = css`
    .affine-frame-block-container {
      display: flow-root;
    }
    .affine-frame-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:frame', FrameBlockService);
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  override render() {
    return html`
      <div class="affine-frame-block-container">
        <div class="affine-block-children-container">${this.content}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
