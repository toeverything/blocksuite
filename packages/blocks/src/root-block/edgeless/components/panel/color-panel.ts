import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { TransparentIcon } from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { createZodUnion } from '../../../../_common/utils/index.js';
import { getThemeMode } from '../../../../_common/utils/query.js';
export class ColorEvent extends Event {
  detail: CssVariableName;

  constructor(
    type: string,
    {
      detail,
      composed,
      bubbles,
    }: { detail: CssVariableName; composed: boolean; bubbles: boolean }
  ) {
    super(type, { bubbles, composed });
    this.detail = detail;
  }
}

export const LINE_COLORS = [
  '--affine-palette-line-yellow',
  '--affine-palette-line-orange',
  '--affine-palette-line-tangerine',
  '--affine-palette-line-red',
  '--affine-palette-line-magenta',
  '--affine-palette-line-purple',
  '--affine-palette-line-green',
  '--affine-palette-line-blue',
  '--affine-palette-line-navy',
  '--affine-palette-line-black',
  '--affine-palette-line-grey',
  '--affine-palette-line-white',
] as const;

export const LineColorsSchema = createZodUnion(LINE_COLORS);

export const GET_DEFAULT_LINE_COLOR = () =>
  getThemeMode() === 'dark' ? LINE_COLORS[11] : LINE_COLORS[9];

export const GET_DEFAULT_TEXT_COLOR = () => LINE_COLORS[7];

export const DEFAULT_BRUSH_COLOR = '--affine-palette-line-blue';
export const DEFAULT_CONNECTOR_COLOR = LINE_COLORS[10];

export function isTransparent(color: CssVariableName) {
  return color.toLowerCase() === '--affine-palette-transparent';
}

function isSameColorWithBackground(color: CssVariableName) {
  return [
    '--affine-palette-line-white',
    '--affine-palette-shape-white',
  ].includes(color.toLowerCase());
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
    background: 'var(--affine-background-overlay-panel-color)',
  };

  const mask = hollowCircle
    ? html`<div style=${styleMap(maskStyle)}></div>`
    : nothing;

  return html`<div style=${styleMap(containerStyle)}>
    ${TransparentIcon} ${mask}
  </div>`;
}

function BorderedHollowCircle(color: CssVariableName) {
  const strokeWidth = isSameColorWithBackground(color) ? 1 : 0;
  const style = {
    fill: `var(${color})`,
    stroke: 'var(--affine-border-color)',
  };
  return html`<svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.3125 8C12.3125 10.3817 10.3817 12.3125 8 12.3125C5.61827 12.3125 3.6875 10.3817 3.6875 8C3.6875 5.61827 5.61827 3.6875 8 3.6875C10.3817 3.6875 12.3125 5.61827 12.3125 8ZM8 15.5C12.1421 15.5 15.5 12.1421 15.5 8C15.5 3.85786 12.1421 0.5 8 0.5C3.85786 0.5 0.5 3.85786 0.5 8C0.5 12.1421 3.85786 15.5 8 15.5Z"
      stroke-width="${strokeWidth}"
      style=${styleMap(style)}
    />
  </svg> `;
}

function AdditionIcon(color: CssVariableName, hollowCircle: boolean) {
  if (isTransparent(color)) {
    return TransparentColor(hollowCircle);
  }
  if (hollowCircle) {
    return BorderedHollowCircle(color);
  }
  return nothing;
}

export function ColorUnit(
  color: CssVariableName,
  {
    hollowCircle,
    letter,
  }: {
    hollowCircle?: boolean;
    letter?: boolean;
  } = {}
) {
  const additionIcon = AdditionIcon(color, !!hollowCircle);

  const colorStyle = !hollowCircle ? { background: `var(${color})` } : {};

  const borderStyle =
    isSameColorWithBackground(color) && !hollowCircle
      ? {
          border: '1px solid var(--affine-border-color)',
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

export const colorContainerStyles = css`
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

@customElement('edgeless-color-panel')
export class EdgelessColorPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      padding: 10px;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 12px;
      box-sizing: border-box;
      width: 200px;
      background: var(--affine-background-overlay-panel-color);
    }

    ${colorContainerStyles}
  `;

  @property({ attribute: false })
  value: CssVariableName | null = null;

  @property({ attribute: false })
  options = LINE_COLORS;

  @property({ attribute: false })
  showLetterMark = false;

  @property({ attribute: false })
  hollowCircle = false;

  onSelect(value: CssVariableName) {
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
            @click=${() => this.onSelect(color)}
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
