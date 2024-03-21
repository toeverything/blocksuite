import '../panel/align-panel.js';
import '../panel/font-family-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TextElementModel } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-change-text-button')
export class EdgelessChangeTextButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .change-text-container {
      display: flex;
    }
  `;

  @property({ attribute: false })
  texts: TextElementModel[] = [];

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  override render() {
    return html`<div class="change-text-container">
      <edgeless-change-text-menu
        .elements=${this.texts}
        .elementType=${'text'}
        .surface=${this.surface}
      ></edgeless-change-text-menu>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-button': EdgelessChangeTextButton;
  }
}
