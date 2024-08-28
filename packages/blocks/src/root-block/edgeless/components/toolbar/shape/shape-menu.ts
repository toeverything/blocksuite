import {
  GeneralStyleIcon,
  ScribbledStyleIcon,
} from '@blocksuite/affine-components/icons';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  LineColor,
  SHAPE_FILL_COLORS,
  ShapeStyle,
  ShapeType,
} from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { SignalWatcher, computed } from '@lit-labs/preact-signals';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { ShapeName } from './shape-tool-element.js';

import '../../buttons/tool-icon-button.js';
import { type ColorEvent, isTransparent } from '../../panel/color-panel.js';
import '../../panel/one-row-color-panel.js';
import {
  LINE_COLOR_PREFIX,
  SHAPE_COLOR_PREFIX,
  ShapeComponentConfig,
} from './shape-menu-config.js';

@customElement('edgeless-shape-menu')
export class EdgelessShapeMenu extends SignalWatcher(LitElement) {
  private _props$ = computed(() => {
    const { shape } = this.edgeless.service.editPropsStore.lastProps$.value;
    const { shapeStyle, fillColor, strokeColor, radius } = shape;
    let shapeType: ShapeName = shape.shapeType;
    if (shapeType === ShapeType.Rect && radius > 0) {
      shapeType = 'roundedRect';
    }
    return {
      shapeStyle,
      shapeType,
      fillColor,
      strokeColor,
      radius,
    };
  });

  private _setFillColor = (fillColor: string) => {
    const filled = !isTransparent(fillColor);
    let strokeColor = fillColor.replace(SHAPE_COLOR_PREFIX, LINE_COLOR_PREFIX);

    if (strokeColor.endsWith('transparent')) {
      strokeColor = LineColor.Grey;
    }

    this.onChange({ filled, fillColor, strokeColor });
  };

  private _setShapeStyle = (shapeStyle: ShapeStyle) => {
    this.onChange({
      shapeStyle,
    });
  };

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

  override render() {
    const { fillColor, shapeStyle, shapeType } = this._props$.value;
    const color = ThemeObserver.getColorValue(
      fillColor,
      DEFAULT_SHAPE_FILL_COLOR
    );

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
              ({ name, generalIcon, scribbledIcon, tooltip, value }) => {
                return html`
                  <edgeless-tool-icon-button
                    .tooltip=${tooltip}
                    .active=${shapeType === name}
                    .activeMode=${'background'}
                    @click=${() => this.onChange(value)}
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
          <edgeless-one-row-color-panel
            .value=${color}
            .options=${SHAPE_FILL_COLORS}
            .hasTransparent=${!this.edgeless.doc.awarenessStore.getFlag(
              'enable_color_picker'
            )}
            @select=${(e: ColorEvent) => this._setFillColor(e.detail)}
          ></edgeless-one-row-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}
