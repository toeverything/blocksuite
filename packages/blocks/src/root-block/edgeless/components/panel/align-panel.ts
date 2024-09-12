import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '@blocksuite/affine-components/icons';
import { TextAlign } from '@blocksuite/affine-model';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

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

export class EdgelessAlignPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `;

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
        <edgeless-tool-icon-button
          .activeMode=${'background'}
          aria-label=${name}
          .tooltip=${name}
          .active=${this.value === value}
          @click=${() => this._onSelect(value)}
        >
          ${icon}
        </edgeless-tool-icon-button>
      `
    );
  }

  @property({ attribute: false })
  accessor onSelect: undefined | ((value: TextAlign) => void) = undefined;

  @property({ attribute: false })
  accessor value: TextAlign = TextAlign.Left;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-align-panel': EdgelessAlignPanel;
  }
}
