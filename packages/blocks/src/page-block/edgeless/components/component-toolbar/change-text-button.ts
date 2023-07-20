import '../panel/align-panel.js';
import '../panel/font-family-panel.js';

import { WithDisposable } from '@blocksuite/lit';
import type { SurfaceManager, TextElement } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../utils/selection-manager.js';

@customElement('edgeless-change-text-button')
export class EdgelessChangeTextButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .change-text-container {
      display: flex;
      padding-left: 8px;
    }
  `;

  @property({ attribute: false })
  texts: TextElement[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
  selectionState!: EdgelessSelectionState;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  override render() {
    return html`<div class="change-text-container">
      <edgeless-change-text-menu
        .elements=${this.texts}
        .elementType=${'text'}
        .surface=${this.surface}
        .selectionState=${this.selectionState}
        .slots=${this.slots}
      ></edgeless-change-text-menu>
    </div>`;
  }
}
