import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../../_common/theme/css-variables.js';
import type { ShapeName } from './shape-tool-element.js';

import {
  GeneralStyleIcon,
  ScribbledStyleIcon,
} from '../../../../../_common/icons/index.js';
import { ShapeStyle } from '../../../../../surface-block/index.js';
import '../../buttons/tool-icon-button.js';
import { type ColorEvent, isTransparent } from '../../panel/color-panel.js';
import '../../panel/one-row-color-panel.js';
import {
  LINE_COLOR_PREFIX,
  SHAPE_COLOR_PREFIX,
  ShapeComponentConfig,
} from './shape-menu-config.js';

@customElement('edgeless-shape-menu')
export class EdgelessShapeMenu extends LitElement {
  private _setShapeStyle = (shapeStyle: ShapeStyle) => {
    this.onChange({
      shapeStyle,
    });
  };

  private _setStrokeColor = (strokeColor: CssVariableName) => {
    const props: Record<string, unknown> = { strokeColor };
    const fillColor = strokeColor.replace(
      LINE_COLOR_PREFIX,
      SHAPE_COLOR_PREFIX
    );
    const filled = !isTransparent(fillColor);
    props.fillColor = fillColor;
    props.filled = filled;
    this.onChange(props);
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
    const { radius, strokeColor, shapeStyle } = this;
    let { shapeType } = this;
    if (shapeType === 'rect' && radius > 0) {
      shapeType = 'roundedRect';
    }

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
            .value=${strokeColor}
            @select=${(e: ColorEvent) => this._setStrokeColor(e.detail)}
          ></edgeless-one-row-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor fillColor!: CssVariableName;

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;

  @property({ attribute: false })
  accessor radius!: number;

  @property({ attribute: false })
  accessor shapeStyle!: ShapeStyle;

  @property({ attribute: false })
  accessor shapeType!: ShapeName;

  @property({ attribute: false })
  accessor strokeColor!: CssVariableName;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}
