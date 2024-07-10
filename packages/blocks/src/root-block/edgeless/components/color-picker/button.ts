import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EditorMenuButton } from '../../../../_common/components/toolbar/menu-button.js';
import type { ColorEvent } from '../panel/color-panel.js';
import type { Rgb } from './utils.js';

import '../../../../_common/components/toolbar/icon-button.js';
import '../../../../_common/components/toolbar/menu-button.js';
import '../panel/color-panel.js';
import './color-picker.js';

type Type = 'normal' | 'custom';

@customElement('edgeless-color-picker-button')
export class EdgelessColorPickerButton extends WithDisposable(LitElement) {
  override firstUpdated() {
    this.disposables.addFromEvent(this.menuButton, 'toggle', (e: Event) => {
      const newState = (e as ToggleEvent).newState;
      if (newState === 'hidden') {
        this.tabType = 'normal';
      }
    });
  }

  override render() {
    return html`
      <editor-menu-button
        .contentPadding=${this.tabType === 'custom' ? '0px' : '8px'}
        .button=${html`
          <editor-icon-button
            aria-label=${this.label}
            .tooltip=${this.tooltip || this.label}
          >
            <edgeless-color-button .color=${this.color}></edgeless-color-button>
          </editor-icon-button>
        `}
      >
        ${choose(this.tabType, [
          [
            'normal',
            () => html`
              <edgeless-color-panel
                slot
                .value=${this.color}
                .options=${this.colors}
                @select=${(e: ColorEvent) => console.log(e.detail)}
              >
                <div
                  slot="custom"
                  @click=${(e: MouseEvent) => {
                    e.stopPropagation();
                    this.tabType = 'custom';
                    // refresh menu's position
                    this.menuButton.show(true);
                  }}
                >
                  <div
                    class="color-unit"
                    style=${styleMap({
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      border: '0.5px solid var(--affine-border-color)',
                      background:
                        'var(--affine-palette-custom, conic-gradient(from 180deg at 50% 50%, #D21C7E 0deg, #C240F0 30.697514712810516deg, #434AF5 62.052921652793884deg, #3CB5F9 93.59999656677246deg, #3CEEFA 131.40000343322754deg, #37F7BD 167.40000128746033deg, #2DF541 203.39999914169312deg, #E7F738 239.40000772476196deg, #FBAF3E 273.07027101516724deg, #FD904E 300.73712825775146deg, #F64545 329.47510957717896deg, #F040A9 359.0167021751404deg))',
                    })}
                  ></div>
                </div>
              </edgeless-color-panel>
            `,
          ],
          [
            'custom',
            () => {
              const rgb: Rgb = { r: 0, g: 0, b: 0 };
              const value = window
                .getComputedStyle(this)
                .getPropertyValue(this.color);
              if (value.startsWith('rgb')) {
                const [a, b, c] = value
                  .replace(/^rgba?/, '')
                  .replace(/\(|\)/, '')
                  .split(',')
                  .map(s => parseFloat(s.trim()));
                rgb.r = a;
                rgb.g = b;
                rgb.b = c;
              }
              const color = rgb;
              console.log(color);

              return html`
                <edgeless-color-picker
                  .color=${color}
                  .navType=${'colors'}
                ></edgeless-color-picker>
              `;
            },
          ],
        ])}
      </editor-menu-button>
    `;
  }

  @property()
  accessor color!: string;

  @property({ type: Array })
  accessor colors: string[] = [];

  @property()
  accessor label!: string;

  @query('editor-menu-button')
  accessor menuButton!: EditorMenuButton;

  @property()
  accessor tabType: Type = 'normal';

  @property()
  accessor tooltip: string | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-color-picker-button': EdgelessColorPickerButton;
  }
}
