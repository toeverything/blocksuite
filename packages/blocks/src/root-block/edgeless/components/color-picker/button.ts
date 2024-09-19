import type { EditorMenuButton } from '@blocksuite/affine-components/toolbar';

import { WithDisposable } from '@blocksuite/global/utils';
import { html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ColorEvent } from '../panel/color-panel.js';
import type {
  ModeType,
  PickColorDetail,
  PickColorEvent,
  PickColorType,
} from './types.js';

import { keepColor, preprocessColor } from './utils.js';

type Type = 'normal' | 'custom';

export class EdgelessColorPickerButton extends WithDisposable(LitElement) {
  #select = (e: ColorEvent) => {
    this.#pick({ palette: e.detail });
  };

  switchToCustomTab = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.colorType === 'palette') {
      this.colorType = 'normal';
    }
    this.tabType = 'custom';
    // refresh menu's position
    this.menuButton.show(true);
  };

  get colorWithoutAlpha() {
    return this.isCSSVariable ? this.color : keepColor(this.color);
  }

  get customButtonStyle() {
    let b = 'transparent';
    let c = 'transparent';
    if (!this.isCSSVariable) {
      b = 'var(--affine-background-overlay-panel-color)';
      c = keepColor(this.color);
    }
    return { '--b': b, '--c': c };
  }

  get isCSSVariable() {
    return this.color.startsWith('--');
  }

  get tabContentPadding() {
    return `${this.tabType === 'custom' ? 0 : 8}px`;
  }

  #pick(detail: PickColorDetail) {
    this.pick?.({ type: 'start' });
    this.pick?.({ type: 'pick', detail });
    this.pick?.({ type: 'end' });
  }

  override firstUpdated() {
    this.disposables.addFromEvent(this.menuButton, 'toggle', (e: Event) => {
      const newState = (e as CustomEvent).detail;
      if (newState === 'hidden' && this.tabType !== 'normal') {
        this.tabType = 'normal';
      }
    });
  }

  override render() {
    return html`
      <editor-menu-button
        .contentPadding=${this.tabContentPadding}
        .button=${html`
          <editor-icon-button
            aria-label=${this.label}
            .tooltip=${this.tooltip || this.label}
          >
            ${this.isText
              ? html`
                  <edgeless-text-color-icon
                    .color=${this.colorWithoutAlpha}
                  ></edgeless-text-color-icon>
                `
              : html`
                  <edgeless-color-button
                    .color=${this.colorWithoutAlpha}
                    .hollowCircle=${this.hollowCircle}
                  ></edgeless-color-button>
                `}
          </editor-icon-button>
        `}
      >
        ${choose(this.tabType, [
          [
            'normal',
            () => html`
              <div data-orientation="vertical">
                <slot name="other"></slot>
                <slot name="separator"></slot>
                <edgeless-color-panel
                  role="listbox"
                  .value=${this.color}
                  .options=${this.palettes}
                  .hollowCircle=${this.hollowCircle}
                  .openColorPicker=${this.switchToCustomTab}
                  .hasTransparent=${false}
                  @select=${this.#select}
                >
                  <edgeless-color-custom-button
                    slot="custom"
                    style=${styleMap(this.customButtonStyle)}
                    .active=${!this.isCSSVariable}
                    @click=${this.switchToCustomTab}
                  ></edgeless-color-custom-button>
                </edgeless-color-panel>
              </div>
            `,
          ],
          [
            'custom',
            () => html`
              <edgeless-color-picker
                class="custom"
                .pick=${this.pick}
                .colors=${{
                  type:
                    this.colorType === 'palette' ? 'normal' : this.colorType,
                  modes: this.colors.map(
                    preprocessColor(window.getComputedStyle(this))
                  ),
                }}
              ></edgeless-color-picker>
            `,
          ],
        ])}
      </editor-menu-button>
    `;
  }

  @property()
  accessor color!: string;

  @property({ attribute: false })
  accessor colors: { type: ModeType; value: string }[] = [];

  @property()
  accessor colorType: PickColorType = 'palette';

  @property({ attribute: false })
  accessor hollowCircle: boolean = false;

  @property({ attribute: false })
  accessor isText!: boolean;

  @property()
  accessor label!: string;

  @query('editor-menu-button')
  accessor menuButton!: EditorMenuButton;

  @property({ attribute: false })
  accessor palettes: string[] = [];

  @property({ attribute: false })
  accessor pick!: (event: PickColorEvent) => void;

  @state()
  accessor tabType: Type = 'normal';

  @property()
  accessor tooltip: string | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-color-picker-button': EdgelessColorPickerButton;
  }
}
