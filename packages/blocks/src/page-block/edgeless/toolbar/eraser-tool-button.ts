import '../components/tool-icon-button.js';

import { EraserIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { type MouseMode } from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-eraser-tool-button')
export class EdgelessEraserToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    edgeless-tool-icon-button svg:hover {
      transform: translateY(-8px);
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  private iconButtonStyles = `
        --hover-color: transparent;
        --active-color: var(--affine-primary-color);
    `;

  override render() {
    return html`
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
        .tooltip=${'Eraser'}
      >
        ${EraserIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-eraser-tool-button': EdgelessEraserToolButton;
  }
}
