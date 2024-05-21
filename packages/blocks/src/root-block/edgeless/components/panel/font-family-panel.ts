import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { CheckIcon } from '../../../../_common/icons/edgeless.js';
import {
  CanvasTextFontFamily,
  CanvasTextFontFamilyKey,
  CanvasTextFontFamilyName,
  type CanvasTextFontFamilyValueType,
} from '../../../../surface-block/consts.js';
import { wrapFontFamily } from '../../../../surface-block/utils/font.js';

@customElement('edgeless-font-family-panel')
export class EdgelessFontFamilyPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: start;
      flex-direction: column;
      min-width: 136px;
    }

    edgeless-tool-icon-button {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  value: CanvasTextFontFamilyValueType = CanvasTextFontFamily.Inter;

  @property({ attribute: false })
  onSelect?: (value: EdgelessFontFamilyPanel['value']) => void;

  private _onSelect(value: EdgelessFontFamilyPanel['value']) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return repeat(
      CanvasTextFontFamilyKey,
      key => key,
      key => {
        const font = CanvasTextFontFamily[key];
        const active = this.value === font;

        return html`
          <edgeless-tool-icon-button
            class="${key.toLowerCase()}"
            style="font-family: ${wrapFontFamily(font)}"
            .iconContainerPadding=${[4, 8]}
            .justify=${'space-between'}
            .active=${active}
            @click=${() => this._onSelect(font)}
          >
            ${CanvasTextFontFamilyName[key]} ${active ? CheckIcon : nothing}
          </edgeless-tool-icon-button>
        `;
      }
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-family-panel': EdgelessFontFamilyPanel;
  }
}
