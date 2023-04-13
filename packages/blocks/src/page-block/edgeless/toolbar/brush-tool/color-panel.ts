import { TransparentIcon } from '@blocksuite/global/config';
import type { Color } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

export class ColorEvent extends CustomEvent<Color> {}

const colors: Color[] = [
  '#ffe838',
  '#ffaf38',
  '#ff631f',
  '#fc3f55',
  '#ff38b3',
  '#b638ff',
  '#10cb86',
  '#4f90ff',
  '#3b25cc',
  '#010101',
  '#999999',
  '#ffffff',
];

@customElement('edgeless-color-panel')
export class EdgelessColorPanel extends LitElement {
  static styles = css`
    :host {
      display: flex;
      width: 204px;
      padding: 8px 12px;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 12px;
      box-sizing: border-box;
      background: var(--affine-background-primary-color);
    }

    .color-container {
      display: flex;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      box-sizing: border-box;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
    }

    .color-container[active] {
      border: 1px solid var(--affine-primary-color);
    }

    .color-unit {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .color-unit[bordered] {
      border: 1px solid #e5e5e5;
    }

    .color-unit::before {
      content: attr(data-letter);
      display: block;
      font-size: 12px;
    }
  `;

  @property()
  value?: Color;

  @property()
  options: Color[] = colors;

  @property()
  showLetterMark = false;

  private _onSelect(value: Color) {
    this.dispatchEvent(
      new ColorEvent('select', {
        detail: value,
        composed: true,
        bubbles: true,
      })
    );
    this.value = value;
  }

  render() {
    return repeat(
      this.options,
      color => color,
      color => {
        const style = { background: color };
        const isTransparent = color === '#00000000';
        const additionalIcon = isTransparent ? TransparentIcon : nothing;

        return html`
          <div
            class="color-container"
            ?active=${color === this.value}
            @click=${() => this._onSelect(color)}
          >
            <div
              class="color-unit"
              aria-label=${color.toLowerCase()}
              ?bordered=${color === '#ffffff'}
              style=${styleMap(style)}
              data-letter=${this.showLetterMark ? 'A' : ''}
            >
              ${additionalIcon}
            </div>
          </div>
        `;
      }
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-color-panel': EdgelessColorPanel;
  }
}
