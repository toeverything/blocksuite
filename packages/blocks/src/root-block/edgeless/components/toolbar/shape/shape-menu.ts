import '../../buttons/tool-icon-button.js';
import '../../panel/one-row-color-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  GeneralStyleIcon,
  ScribbledStyleIcon,
} from '../../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../../_common/theme/css-variables.js';
import { ShapeStyle } from '../../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { type ColorEvent, isTransparent } from '../../panel/color-panel.js';
import {
  LINE_COLOR_PREFIX,
  SHAPE_COLOR_PREFIX,
  SHAPE_SUBMENU_WIDTH,
  ShapeComponentConfig,
} from './shape-menu-config.js';
import type { ShapeName } from './shape-tool-element.js';

@customElement('edgeless-shape-menu')
export class EdgelessShapeMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
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

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  shapeType!: ShapeName;

  @property({ attribute: false })
  fillColor!: CssVariableName;

  @property({ attribute: false })
  shapeStyle!: ShapeStyle;

  @property({ attribute: false })
  strokeColor!: CssVariableName;

  @property({ attribute: false })
  radius!: number;

  @property({ attribute: false })
  onChange!: (props: Record<string, unknown>) => void;

  private _setStrokeColor = (strokeColor: CssVariableName) => {
    if (this.edgeless.edgelessTool.type !== 'shape') return;

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

  private _setShapeStyle = (shapeStyle: ShapeStyle) => {
    if (this.edgeless.edgelessTool.type !== 'shape') return;

    this.onChange({
      shapeStyle,
    });
  };

  override render() {
    if (this.edgeless.edgelessTool.type !== 'shape') return nothing;

    const { radius, strokeColor, shapeStyle } = this;
    let { shapeType } = this;
    if (shapeType === 'rect' && radius > 0) {
      shapeType = 'roundedRect';
    }

    return html`
      <div class="shape-menu-container">
        <edgeless-slide-menu .menuWidth=${SHAPE_SUBMENU_WIDTH}>
          <div class="menu-content">
            <div class="shape-style-container">
              <edgeless-tool-icon-button
                .tooltip=${'General'}
                .iconContainerPadding=${2}
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
                .iconContainerPadding=${2}
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
                      .active=${shapeType === name}
                      .activeMode=${'background'}
                      .iconContainerPadding=${2}
                      @click=${() => {
                        this.onChange({ shapeType: name });
                      }}
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
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}
