import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  GENERAL_CANVAS_FONT_FAMILY,
  SCIBBLED_CANVAS_FONT_FANILY,
} from '../../utils/consts.js';
import type { CANVAS_TEXT_FONT } from '../../utils/text.js';

@customElement('edgeless-font-family-panel')
export class EdgelessFontFamilyPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .font-family-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 8px;
      padding: 4px;
    }

    .general-button {
      font-family: sans-serif;
    }

    .scibbled-button {
      font-family: Kalam, cursive;
    }
  `;

  @property({ attribute: false })
  value: CANVAS_TEXT_FONT = GENERAL_CANVAS_FONT_FAMILY;

  @property({ attribute: false })
  onSelect?: (value: EdgelessFontFamilyPanel['value']) => void;

  private _onSelect(value: EdgelessFontFamilyPanel['value']) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return html`
      <div class="font-family-container">
        <edgeless-tool-icon-button
          class="general-button"
          .active=${this.value === GENERAL_CANVAS_FONT_FAMILY}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(GENERAL_CANVAS_FONT_FAMILY);
          }}
        >
          <div class="font-family-button">General</div>
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          class="scibbled-button"
          .active=${this.value === SCIBBLED_CANVAS_FONT_FANILY}
          .activeMode=${'background'}
          .iconContainerPadding=${2}
          @click=${() => {
            this._onSelect(SCIBBLED_CANVAS_FONT_FANILY);
          }}
        >
          <div class="font-family-button">Scribbled</div>
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-family-panel': EdgelessFontFamilyPanel;
  }
}
