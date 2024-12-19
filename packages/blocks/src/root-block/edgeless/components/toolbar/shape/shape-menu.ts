import type { Signal } from '@preact/signals-core';

import {
  GeneralStyleIcon,
  ScribbledStyleIcon,
} from '@blocksuite/affine-components/icons';
import {
  DefaultTheme,
  isTransparent,
  type Palette,
  type ShapeName,
  ShapeStyle,
  ShapeType,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed, effect, signal } from '@preact/signals-core';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';

import { ShapeComponentConfig } from './shape-menu-config.js';

export class EdgelessShapeMenu extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = css`
    :host {
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
    }
    .shape-type-container,
    .shape-style-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }
    .shape-type-container svg,
    .shape-style-container svg {
      fill: var(--affine-icon-color);
      stroke: none;
    }
    menu-divider {
      height: 24px;
      margin: 0 9px;
    }
  `;

  private _shapeName$: Signal<ShapeName> = signal(ShapeType.Rect);

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private _props$ = computed(() => {
    const shapeName: ShapeName = this._shapeName$.value;
    const { shapeStyle, fillColor, strokeColor, radius } =
      this.edgeless.std.get(EditPropsStore).lastProps$.value[
        `shape:${shapeName}`
      ];
    return {
      shapeStyle,
      shapeName,
      fillColor,
      strokeColor,
      radius,
    };
  });

  private _setFillColor = ({ key, value }: Palette) => {
    const filled = !isTransparent(value);
    const fillColor = value;
    const strokeColor = filled
      ? DefaultTheme.globalToolbarPalettes.find(palette => palette.key === key)
          ?.value
      : DefaultTheme.StrokeColorMap.Grey;

    const { shapeName } = this._props$.value;
    this.edgeless.std
      .get(EditPropsStore)
      .recordLastProps(`shape:${shapeName}`, {
        filled,
        fillColor,
        strokeColor,
      });
    this.onChange(shapeName);
  };

  private _setShapeStyle = (shapeStyle: ShapeStyle) => {
    const { shapeName } = this._props$.value;
    this.edgeless.std
      .get(EditPropsStore)
      .recordLastProps(`shape:${shapeName}`, {
        shapeStyle,
      });
    this.onChange(shapeName);
  };

  private _theme$ = computed(() => {
    return this.edgeless.std.get(ThemeProvider).theme$.value;
  });

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      effect(() => {
        const value = this.edgeless.gfx.tool.currentToolOption$.value;

        if (value && value.type === 'shape') {
          this._shapeName$.value = value.shapeName;
        }
      })
    );
  }

  override render() {
    const { fillColor, shapeStyle, shapeName } = this._props$.value;

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="shape-style-container">
            <edgeless-tool-icon-button
              .tooltip=${'General'}
              .active=${shapeStyle === ShapeStyle.General}
              .activeMode=${'background'}
              @click=${() => {
                this._setShapeStyle(ShapeStyle.General);
              }}
            >
              ${GeneralStyleIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Scribbled'}
              .active=${shapeStyle === ShapeStyle.Scribbled}
              .activeMode=${'background'}
              @click=${() => {
                this._setShapeStyle(ShapeStyle.Scribbled);
              }}
            >
              ${ScribbledStyleIcon}
            </edgeless-tool-icon-button>
          </div>
          <menu-divider .vertical=${true}></menu-divider>
          <div class="shape-type-container">
            ${ShapeComponentConfig.map(
              ({ name, generalIcon, scribbledIcon, tooltip }) => {
                return html`
                  <edgeless-tool-icon-button
                    .tooltip=${tooltip}
                    .active=${shapeName === name}
                    .activeMode=${'background'}
                    @click=${() => this.onChange(name)}
                  >
                    ${shapeStyle === ShapeStyle.General
                      ? generalIcon
                      : scribbledIcon}
                  </edgeless-tool-icon-button>
                `;
              }
            )}
          </div>
          <menu-divider .vertical=${true}></menu-divider>
          <edgeless-color-panel
            class="one-way"
            .value=${fillColor}
            .theme=${this._theme$.value}
            .palettes=${DefaultTheme.globalToolbarShapeFillPalettes}
            .hasTransparent=${!this.edgeless.doc.awarenessStore.getFlag(
              'enable_color_picker'
            )}
            @select=${(e: ColorEvent) => this._setFillColor(e.detail)}
          ></edgeless-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor onChange!: (name: ShapeName) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}
