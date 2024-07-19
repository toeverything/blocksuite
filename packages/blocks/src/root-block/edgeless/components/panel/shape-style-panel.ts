import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  GeneralStyleIcon,
  ScribbledStyleIcon,
} from '../../../../_common/icons/index.js';
import { ShapeStyle } from '../../../../surface-block/index.js';

const SHAPE_STYLE_LIST = [
  {
    value: ShapeStyle.General,
    icon: GeneralStyleIcon,
  },
  {
    value: ShapeStyle.Scribbled,
    icon: ScribbledStyleIcon,
  },
];

@customElement('edgeless-shape-style-panel')
export class EdgelessShapeStylePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `;

  private _onSelect(value: ShapeStyle) {
    this.value = value;
    if (this.onSelect) {
      this.onSelect(value);
    }
  }

  override render() {
    return repeat(
      SHAPE_STYLE_LIST,
      item => item.value,
      ({ value, icon }) =>
        html`<edgeless-tool-icon-button
          .tipPosition=${'top'}
          .activeMode=${'background'}
          aria-label=${value}
          .tooltip=${value}
          .active=${this.value === value}
          @click=${() => this._onSelect(value)}
        >
          ${icon}
        </edgeless-tool-icon-button>`
    );
  }

  @property({ attribute: false })
  accessor onSelect: undefined | ((value: ShapeStyle) => void) = undefined;

  @property({ attribute: false })
  accessor value!: ShapeStyle;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-style-panel': EdgelessShapeStylePanel;
  }
}
