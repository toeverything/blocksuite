import '../../buttons/tool-icon-button.js';
import '../../panel/one-row-color-panel.js';

import { WithDisposable } from '@blocksuite/lit';
import { ShapeStyle, type ShapeType } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  EdgelessTool,
  ShapeTool,
} from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import {
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
    .shape-menu-container {
      display: flex;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px 8px 0 0;
      border: 1px solid var(--affine-border-color);
      position: relative;
      cursor: default;
    }
    .menu-content {
      display: flex;
      align-items: center;
    }
    .shape-type-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }
    .shape-type-container svg {
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

  @property({ attribute: false })
  selectedShape?: ShapeTool['shape'] | null;

  @property({ attribute: false })
  shapeStyle?: ShapeStyle = ShapeStyle.Scribbled;

  private _setShapeType = (shape: ShapeType | 'roundedRect') => {
    if (this.edgelessTool.type !== 'shape') return;

    const { fillColor, strokeColor } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'shape',
      shape,
      fillColor,
      strokeColor,
    });
  };

  private _setStrokeColor = (strokeColor: CssVariableName) => {
    if (this.edgelessTool.type !== 'shape') return;

    const { shape, fillColor } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'shape',
      shape,
      fillColor,
      strokeColor,
    });
  };

  override render() {
    if (this.edgelessTool.type !== 'shape') return nothing;

    const { shape, strokeColor } = this.edgelessTool;

    return html`
      <div class="shape-menu-container">
        <edgeless-slide-menu .menuWidth=${SHAPE_SUBMENU_WIDTH}>
          <div class="menu-content">
            <div class="shape-type-container">
              ${ShapeComponentConfig.map(
                ({ name, generalIcon, scribbledIcon, tooltip, disabled }) => {
                  return html`
                    <edgeless-tool-icon-button
                      .disabled=${disabled}
                      .tooltip=${tooltip}
                      .tipPosition=${name === 'rect' ? 'top-end' : 'top'}
                      .active=${shape === name}
                      .iconContainerPadding=${2}
                      @click=${() => {
                        if (disabled) return;
                        this._setShapeType(name);
                      }}
                    >
                      ${this.shapeStyle === ShapeStyle.General
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
