/// <reference types="vite/client" />
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ShadowlessElement } from '../__internal__/index.js';
import { registerService } from '../__internal__/service.js';
import type { FrameBlockModel } from './frame-model.js';
import { FrameBlockService } from './frame-service.js';

@customElement('affine-frame')
export class FrameBlockComponent extends ShadowlessElement {
  static override styles = css`
    .affine-frame-block-container {
      display: flow-root;
    }
    .affine-frame-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  @property()
  model!: FrameBlockModel;

  @property()
  content!: TemplateResult;

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
      <div class="affine-frame-block-container">${this.content}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
