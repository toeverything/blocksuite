import '../../../../_common/components/toolbar/icon-button.js';

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '../../../../_common/icons/index.js';
import { TextAlign } from '../../../../surface-block/consts.js';

const TEXT_ALIGN_LIST = [
  {
    name: 'Left',
    value: TextAlign.Left,
    icon: TextAlignLeftIcon,
  },
  {
    name: 'Center',
    value: TextAlign.Center,
    icon: TextAlignCenterIcon,
  },
  {
    name: 'Right',
    value: TextAlign.Right,
    icon: TextAlignRightIcon,
  },
];

@customElement('edgeless-align-panel')
export class EdgelessAlignPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `;

  @property({ attribute: false })
  accessor value: TextAlign = TextAlign.Left;

  @property({ attribute: false })
  accessor onSelect: undefined | ((value: TextAlign) => void) = undefined;

  private _onSelect(value: TextAlign) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return repeat(
      TEXT_ALIGN_LIST,
      item => item.name,
      ({ name, value, icon }) => html`
        <affine-toolbar-icon-button
          .activeMode=${'background'}
          aria-label=${name}
          .tooltip=${name}
          .active=${this.value === value}
          @click=${() => this._onSelect(value)}
        >
          ${icon}
        </affine-toolbar-icon-button>
      `
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-align-panel': EdgelessAlignPanel;
  }
}
