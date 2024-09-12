import { TransparentIcon } from '@blocksuite/affine-components/icons';
import {
  LINE_COLORS,
  LineColor,
  NoteBackgroundColor,
  ShapeFillColor,
} from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

export class ColorEvent extends Event {
  detail: string;

  constructor(
    type: string,
    {
      detail,
      composed,
      bubbles,
    }: { detail: string; composed: boolean; bubbles: boolean }
  ) {
    super(type, { bubbles, composed });
    this.detail = detail;
  }
}

export const GET_DEFAULT_LINE_COLOR = () =>
  ThemeObserver.mode === 'dark' ? LineColor.White : LineColor.Black;

export function isTransparent(color: string) {
  return color.toLowerCase().endsWith('transparent');
}

function isSameColorWithBackground(color: string) {
  const colors: string[] = [
    LineColor.Black,
    LineColor.White,
    NoteBackgroundColor.Black,
    NoteBackgroundColor.White,
    ShapeFillColor.Black,
    ShapeFillColor.White,
  ];
  return colors.includes(color.toLowerCase());
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

  return html`
    <div style=${styleMap(containerStyle)}>${TransparentIcon} ${mask}</div>
  `;
}

function BorderedHollowCircle(color: string) {
  const valid = color.startsWith('--');
  const strokeWidth = valid && isSameColorWithBackground(color) ? 1 : 0;
  const style = {
    fill: valid ? `var(${color})` : color,
    stroke: 'var(--affine-border-color)',
  };
  return html`
    <svg
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
    </svg>
  `;
}

function AdditionIcon(color: string, hollowCircle: boolean) {
  if (isTransparent(color)) {
    return TransparentColor(hollowCircle);
  }
  if (hollowCircle) {
    return BorderedHollowCircle(color);
  }
  return nothing;
}

export function ColorUnit(
  color: string,
  {
    hollowCircle,
    letter,
  }: {
    hollowCircle?: boolean;
    letter?: boolean;
  } = {}
) {
  const additionIcon = AdditionIcon(color, !!hollowCircle);

  const colorStyle =
    !hollowCircle && !isTransparent(color)
      ? { background: `var(${color})` }
      : {};

  const borderStyle =
    isSameColorWithBackground(color) && !hollowCircle
      ? {
          border: '0.5px solid var(--affine-border-color)',
        }
      : {};

  const style = {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...borderStyle,
    ...colorStyle,
  };

  return html`
    <div
      class="color-unit"
      style=${styleMap(style)}
      aria-label=${color.toLowerCase()}
      data-letter=${letter ? 'A' : ''}
    >
      ${additionIcon}
    </div>
  `;
}

export class EdgelessColorButton extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
    }

    .color-unit {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      box-sizing: border-box;
      overflow: hidden;
    }
  `;

  get preprocessColor() {
    const color = this.color;
    return color.startsWith('--') ? `var(${color})` : color;
  }

  override render() {
    const { color, hollowCircle, letter } = this;
    const additionIcon = AdditionIcon(color, !!hollowCircle);
    const style: Record<string, string> = {};
    if (!hollowCircle) {
      style.background = this.preprocessColor;
      if (isSameColorWithBackground(color)) {
        style.border = '0.5px solid var(--affine-border-color)';
      }
    }
    return html`<div
      class="color-unit"
      aria-label=${color.toLowerCase()}
      data-letter=${letter ? 'A' : nothing}
      style=${styleMap(style)}
    >
      ${additionIcon}
    </div>`;
  }

  @property({ attribute: false })
  accessor color!: string;

  @property({ attribute: false })
  accessor hollowCircle: boolean | undefined = undefined;

  @property({ attribute: false })
  accessor letter: boolean | undefined = undefined;
}

export const colorContainerStyles = css`
  .color-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    box-sizing: border-box;
    overflow: hidden;
    cursor: pointer;
    padding: 2px;
  }

  .color-unit::before {
    content: attr(data-letter);
    display: block;
    font-size: 12px;
  }

  .color-container[active]:after {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 0.5px solid var(--affine-primary-color);
    border-radius: 50%;
    box-sizing: border-box;
    content: attr(data-letter);
  }
`;

export class EdgelessColorPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      width: 184px;
      gap: 8px;
    }

    ${colorContainerStyles}
  `;

  get palettes() {
    return this.hasTransparent
      ? ['--affine-palette-transparent', ...this.options]
      : this.options;
  }

  onSelect(value: string) {
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
    return html`
      ${repeat(
        this.palettes,
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
      )}
      </div>
      <slot name="custom"></slot>
    `;
  }

  @property({ attribute: false })
  accessor hasTransparent: boolean = true;

  @property({ attribute: false })
  accessor hollowCircle = false;

  @property()
  accessor openColorPicker!: (e: MouseEvent) => void;

  @property({ type: Array })
  accessor options: readonly string[] = LINE_COLORS;

  @property({ attribute: false })
  accessor showLetterMark = false;

  @property({ attribute: false })
  accessor value: string | null = null;
}

export class EdgelessTextColorIcon extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
    }
  `;

  get preprocessColor() {
    const color = this.color;
    return color.startsWith('--') ? `var(${color})` : color;
  }

  override render() {
    return html`
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          fill="currentColor"
          d="M8.71093 3.85123C8.91241 3.31395 9.42603 2.95801 9.99984 2.95801C10.5737 2.95801 11.0873 3.31395 11.2888 3.85123L14.7517 13.0858C14.8729 13.409 14.7092 13.7692 14.386 13.8904C14.0628 14.0116 13.7025 13.8479 13.5813 13.5247L12.5648 10.8141H7.43487L6.41838 13.5247C6.29718 13.8479 5.93693 14.0116 5.61373 13.8904C5.29052 13.7692 5.12677 13.409 5.24797 13.0858L8.71093 3.85123ZM7.90362 9.56405H12.0961L10.1183 4.29013C10.0998 4.24073 10.0526 4.20801 9.99984 4.20801C9.94709 4.20801 9.89986 4.24073 9.88134 4.29013L7.90362 9.56405Z"
        />
        <rect
          x="3.3335"
          y="15"
          width="13.3333"
          height="2.08333"
          rx="1"
          fill=${this.preprocessColor}
        />
      </svg>
    `;
  }

  @property({ attribute: false })
  accessor color!: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-color-panel': EdgelessColorPanel;
    'edgeless-color-button': EdgelessColorButton;
    'edgeless-text-color-icon': EdgelessTextColorIcon;
  }
}
