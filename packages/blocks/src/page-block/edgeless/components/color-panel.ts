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

export function isTransparent(color: Color) {
  return color.toLowerCase() === '#00000000';
}

function isSameColorWithBackground(color: Color) {
  return color.toLowerCase() === '#ffffff';
}

function TransparentColor(hollowCircle = false) {
  const containerStyle = {
    position: 'relative',
    width: '16px',
    height: '16px',
    stroke: 'none',
  };
  const maskStyle = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    left: '3px',
    top: '3.5px',
    borderRadius: '50%',
    background: 'var(--affine-popover-background)',
  };

  const mask = hollowCircle
    ? html`<div style=${styleMap(maskStyle)}></div>`
    : nothing;

  return html`<div style=${styleMap(containerStyle)}>
    ${TransparentIcon} ${mask}
  </div>`;
}

function BorderedHollowCircle(color: Color) {
  const strokeWidth = isSameColorWithBackground(color) ? 1 : 0;
  return html`<svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.3125 8C12.3125 10.3817 10.3817 12.3125 8 12.3125C5.61827 12.3125 3.6875 10.3817 3.6875 8C3.6875 5.61827 5.61827 3.6875 8 3.6875C10.3817 3.6875 12.3125 5.61827 12.3125 8ZM8 15.5C12.1421 15.5 15.5 12.1421 15.5 8C15.5 3.85786 12.1421 0.5 8 0.5C3.85786 0.5 0.5 3.85786 0.5 8C0.5 12.1421 3.85786 15.5 8 15.5Z"
      fill="${color}"
      stroke="#e5e5e5"
      stroke-width="${strokeWidth}"
    />
  </svg> `;
}

function AdditionIcon(color: Color, hollowCircle: boolean) {
  if (isTransparent(color)) {
    return TransparentColor(hollowCircle);
  }
  if (hollowCircle) {
    return BorderedHollowCircle(color);
  }
  return nothing;
}

export function ColorUnit(
  color: Color,
  {
    hollowCircle,
    letter,
  }: {
    hollowCircle?: boolean;
    letter?: boolean;
  } = {}
) {
  const additionIcon = AdditionIcon(color, !!hollowCircle);

  const colorStyle = !hollowCircle ? { background: color } : {};

  const borderStyle =
    isSameColorWithBackground(color) && !hollowCircle
      ? {
          border: '1px solid #e5e5e5',
        }
      : {};

  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...borderStyle,
    ...colorStyle,
  };

  return html`<div
    class="color-unit"
    style=${styleMap(style)}
    aria-label=${color.toLowerCase()}
    data-letter=${letter ? 'A' : ''}
  >
    ${additionIcon}
  </div>`;
}

@customElement('edgeless-color-panel')
export class EdgelessColorPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      width: 204px;
      padding: 8px 12px;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 12px;
      box-sizing: border-box;
      background: var(--affine-popover-background);
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

  @property()
  hollowCircle = false;

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

  override render() {
    return repeat(
      this.options,
      color => color,
      color => {
        const unit = ColorUnit(color, {
          hollowCircle: this.hollowCircle,
          letter: this.showLetterMark,
        });

        return html`
          <div
            class="color-container"
            ?active=${color === this.value}
            @click=${() => this._onSelect(color)}
          >
            ${unit}
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
