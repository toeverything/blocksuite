import '../panel/align-panel.js';
import '../panel/font-family-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ConnectorLabelElementModel } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-change-connector-label-button')
export class EdgelessChangeConnectorLabelButton extends WithDisposable(
  LitElement
) {
  static override styles = css`
    :host {
      display: flex;
    }

    .change-connector-label-container {
      display: flex;
    }
  `;

  @property({ attribute: false })
  labels: ConnectorLabelElementModel[] = [];

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  override render() {
    return html`<div class="change-connector-label-container">
      <edgeless-change-text-menu
        .elements=${this.labels}
        .elementType=${'connector-label'}
        .surface=${this.surface}
      ></edgeless-change-text-menu>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-connector-label-button': EdgelessChangeConnectorLabelButton;
  }
}
