import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { CheckIcon } from '../../../../_common/icons/edgeless.js';
import {
  FontFamily,
  FontFamilyList,
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
  accessor value: FontFamily = FontFamily.Inter;

  @property({ attribute: false })
  accessor onSelect: ((value: FontFamily) => void) | undefined = undefined;

  private _onSelect(value: FontFamily) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return repeat(
      FontFamilyList,
      item => item[0],
      ([font, name]) => {
        const active = this.value === font;
        return html`
          <edgeless-tool-icon-button
            data-font="${name}"
            style="font-family: ${wrapFontFamily(font)}"
            .iconContainerPadding=${[4, 8]}
            .justify=${'space-between'}
            .active=${active}
            @click=${() => this._onSelect(font)}
          >
            ${name} ${active ? CheckIcon : nothing}
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
