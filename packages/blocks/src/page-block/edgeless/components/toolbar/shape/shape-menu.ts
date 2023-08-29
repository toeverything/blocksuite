import '../../buttons/tool-icon-button.js';
import '../../panel/one-row-color-panel.js';

import { WithDisposable } from '@blocksuite/lit';
import { ShapeStyle, type ShapeType } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import {
  GeneralShapeStyleIcon,
  ScribbledShapeStyleIcon,
} from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { DEFAULT_SHAPE_FILL_COLOR } from '../../component-toolbar/change-shape-button.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import {
  LINE_COLOR_PREFIX,
  SHAPE_COLOR_PREFIX,
  SHAPE_SUBMENU_WIDTH,
  ShapeComponentConfig,
} from './shape-menu-config.js';

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
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  private _setShapeType = (shape: ShapeType | 'roundedRect') => {
    if (this.edgelessTool.type !== 'shape') return;

    const { fillColor, strokeColor, shapeStyle } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'shape',
      shape,
      fillColor,
      strokeColor,
      shapeStyle,
    });
  };

  private _setStrokeColor = (strokeColor: CssVariableName) => {
    if (this.edgelessTool.type !== 'shape') return;

    const { shape, shapeStyle } = this.edgelessTool;
    let { fillColor } = this.edgelessTool;
    if (shapeStyle === ShapeStyle.General) {
      fillColor = strokeColor.replace(LINE_COLOR_PREFIX, SHAPE_COLOR_PREFIX);
    }

    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'shape',
      shape,
      fillColor,
      strokeColor,
      shapeStyle,
    });
  };

  private _setShapeStyle = (shapeStyle: ShapeStyle) => {
    if (this.edgelessTool.type !== 'shape') return;

    const { shape, strokeColor } = this.edgelessTool;

    let { fillColor } = this.edgelessTool;
    if (shapeStyle === ShapeStyle.General) {
      fillColor = strokeColor.replace(LINE_COLOR_PREFIX, SHAPE_COLOR_PREFIX);
    } else {
      fillColor = DEFAULT_SHAPE_FILL_COLOR;
    }

    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'shape',
      shape,
      fillColor,
      strokeColor,
      shapeStyle,
    });
  };

  override render() {
    if (this.edgelessTool.type !== 'shape') return nothing;

    const { shape, strokeColor, shapeStyle } = this.edgelessTool;

    return html`
      <edgeless-slide-menu .menuWidth=${SHAPE_SUBMENU_WIDTH}>
        <div class="menu-content">
          <div class="shape-style-container">
            <edgeless-tool-icon-button
              .tooltip=${'General'}
              .tipPosition=${'top-end'}
              .iconContainerPadding=${2}
              .active=${shapeStyle === ShapeStyle.General}
              .activeMode=${'background'}
              @click=${() => {
                this._setShapeStyle(ShapeStyle.General);
              }}
            >
              ${GeneralShapeStyleIcon}
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
              ${ScribbledShapeStyleIcon}
            </edgeless-tool-icon-button>
          </div>
          <menu-divider .vertical=${true}></menu-divider>
          <div class="shape-type-container">
            ${ShapeComponentConfig.map(
              ({ name, generalIcon, scribbledIcon, tooltip }) => {
                return html`
                  <edgeless-tool-icon-button
                    .tooltip=${tooltip}
                    .active=${shape === name}
                    .activeMode=${'background'}
                    .iconContainerPadding=${2}
                    @click=${() => {
                      this._setShapeType(name);
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}
