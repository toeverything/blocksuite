import '../panel/align-panel.js';
import '../panel/font-family-panel.js';

import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TextElement } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';

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
  texts: TextElement[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  override render() {
    return html`<div class="change-text-container">
      <edgeless-change-text-menu
        .elements=${this.texts}
        .elementType=${'text'}
        .surface=${this.surface}
        .slots=${this.slots}
      ></edgeless-change-text-menu>
    </div>`;
  }
}
