import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/shape-style-panel.js';
import '../../edgeless/components/panel/shape-panel.js';
import './change-text-menu.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  ChangeShapeIcon,
  GeneralStyleIcon,
  LineStyleIcon,
  ScribbledStyleIcon,
  ShapeArrowDownSmallIcon,
} from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { LineWidth, type ShapeTool } from '../../../_common/types.js';
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import { CanvasTextFontFamily } from '../../../surface-block/consts.js';
import {
  FILL_COLORS,
  ShapeType,
  STROKE_COLORS,
} from '../../../surface-block/elements/shape/consts.js';
import {
  type ShapeElementModel,
  ShapeStyle,
  StrokeStyle,
} from '../../../surface-block/index.js';
import { lineSizeButtonStyles } from '../../edgeless/components/buttons/line-size-button.js';
import type { LineStyleButtonProps } from '../../edgeless/components/buttons/line-style-button.js';
import type { EdgelessToolIconButton } from '../../edgeless/components/buttons/tool-icon-button.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import { ColorUnit } from '../../edgeless/components/panel/color-panel.js';
import {
  GET_DEFAULT_LINE_COLOR,
  isTransparent,
} from '../../edgeless/components/panel/color-panel.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
} from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessShapePanel } from '../../edgeless/components/panel/shape-panel.js';
import type { EdgelessShapeStylePanel } from '../../edgeless/components/panel/shape-style-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import {
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from '../../edgeless/utils/consts.js';

const ICON_BUTTON_PADDING_TWO = 2;

function getMostCommonShape(
  elements: ShapeElementModel[]
): ShapeTool['shapeType'] | null {
  const shapeTypes = countBy(elements, (ele: ShapeElementModel) => {
    return ele.shapeType === 'rect' && ele.radius
      ? 'roundedRect'
      : ele.shapeType;
  });
  const max = maxBy(Object.entries(shapeTypes), ([_k, count]) => count);
  return max ? (max[0] as ShapeTool['shapeType']) : null;
}

function getMostCommonFillColor(elements: ShapeElementModel[]): string | null {
  const colors = countBy(elements, (ele: ShapeElementModel) => {
    return ele.filled ? ele.fillColor : '--affine-palette-transparent';
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : null;
}

function getMostCommonStrokeColor(
  elements: ShapeElementModel[]
): string | null {
  const colors = countBy(elements, (ele: ShapeElementModel) => {
    return ele.strokeColor;
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : null;
}

function getMostCommonLineSize(elements: ShapeElementModel[]): LineWidth {
  const sizes = countBy(elements, (ele: ShapeElementModel) => {
    return ele.strokeWidth;
  });
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
}

function getMostCommonLineStyle(
  elements: ShapeElementModel[]
): LineStyleButtonProps['mode'] | null {
  const sizes = countBy(elements, (ele: ShapeElementModel) => {
    switch (ele.strokeStyle) {
      case 'solid': {
        return 'solid';
      }
      case 'dash': {
        return 'dash';
      }
      case 'none': {
        return 'none';
      }
    }
  });
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as LineStyleButtonProps['mode']) : null;
}

function doesAllShapesContainText(elements: ShapeElementModel[]): boolean {
  return elements.every(ele => ele.text);
}

function getMostCommonShapeStyle(elements: ShapeElementModel[]): ShapeStyle {
  const roughnesses = countBy(elements, (ele: ShapeElementModel) => {
    return ele.shapeStyle;
  });
  const max = maxBy(Object.entries(roughnesses), ([_k, count]) => count);
  return max ? (max[0] as ShapeStyle) : ShapeStyle.Scribbled;
}

@customElement('edgeless-change-shape-button')
export class EdgelessChangeShapeButton extends WithDisposable(LitElement) {
  static override styles = [
    lineSizeButtonStyles,
    lineStylesPanelStyles,
    css`
      .change-shape-toolbar-container {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--affine-text-primary-color);
        stroke: none;
        fill: currentColor;
      }

      edgeless-shape-panel {
        display: none;
      }

      edgeless-shape-panel[data-show] {
        display: flex;
      }

      .change-shape-button,
      .shape-style-button,
      .line-styles-button {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .change-shape-button svg,
      .shape-style-button svg,
      .line-styles-button svg {
        fill: var(--affine-icon-color);
      }

      .border-styles-button {
        margin-left: 12px;
      }

      .fill-color-container,
      .stroke-color-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
      }

      .color-panel-container,
      .shape-style-panel-container {
        display: none;
        justify-content: center;
        align-items: center;
        background: var(--affine-background-overlay-panel-color);
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
      }

      .shape-style-panel-container {
        padding: 8px;
      }

      .color-panel-container[data-show],
      .shape-style-panel-container[data-show] {
        display: flex;
      }

      .shape-color-button-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        box-sizing: border-box;
        border-radius: 4px;
        cursor: pointer;
      }

      .shape-color-button-indicator div {
        border-radius: 50%;
        width: 16px;
        height: 16px;
      }

      .line-style-panel {
        display: none;
        padding: 6px;
      }

      .line-style-panel component-toolbar-menu-divider {
        margin: 0 8px;
      }

      .line-style-panel[data-show] {
        display: flex;
      }

      component-toolbar-menu-divider {
        margin: 0 12px;
        height: 24px;
      }
    `,
  ];

  @property({ attribute: false })
  elements: ShapeElementModel[] = [];

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _showTypePanelPopper = false;
  @query('.change-shape-button')
  private _changeShapeButton!: EdgelessToolIconButton;
  @query('edgeless-shape-panel')
  private _shapePanel!: EdgelessShapePanel;
  private _shapePanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showStylelPanelPopper = false;
  @query('.shape-style-button')
  private _shapeStyleButton!: EdgelessToolIconButton;
  @query('.shape-style-panel-container')
  private _shapeStyleMenu!: HTMLDivElement;
  private _shapeStyleMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showFillColorPanelPopper = false;
  @query('.fill-color-button')
  private _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private _fillColorMenu!: HTMLDivElement;
  private _fillColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showStrokeColorPanelPopper = false;
  @query('.stroke-color-button')
  private _strokeColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.stroke-color')
  private _strokeColorMenu!: HTMLDivElement;
  private _strokeColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showLineStylePanelPopper = false;
  @query('.line-styles-button')
  private _lineStylesButton!: EdgelessToolIconButton;
  @query('.line-style-panel')
  private _lineStylesPanel!: HTMLDivElement;
  private _lineStylesPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  get service() {
    return this.edgeless.service;
  }

  private _getTextColor(fillColor: CssVariableName) {
    // When the shape is filled with black color, the text color should be white.
    // When the shape is transparent, the text color should be set according to the theme.
    // Otherwise, the text color should be black.
    const textColor = isTransparent(fillColor)
      ? GET_DEFAULT_LINE_COLOR()
      : fillColor === SHAPE_FILL_COLOR_BLACK
        ? SHAPE_TEXT_COLOR_PURE_WHITE
        : SHAPE_TEXT_COLOR_PURE_BLACK;

    return textColor;
  }

  private _setShapeFillColor(color: CssVariableName) {
    const textColor = this._getTextColor(color);
    const filled = !isTransparent(color);
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        filled,
        fillColor: color,
        color: textColor,
      });
    });
  }

  private _setShapeStrokeColor(color: CssVariableName) {
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        strokeColor: color,
      });
    });
  }

  private _setShapeStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        strokeWidth,
      });
    });
  }

  private _setShapeStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        strokeStyle,
      });
    });
  }

  private _setShapeStyles({ type, value }: LineStylesPanelClickedButton) {
    if (type === 'size') {
      const strokeWidth = value;
      this._setShapeStrokeWidth(strokeWidth);
    } else if (type === 'lineStyle') {
      switch (value) {
        case 'solid': {
          this._setShapeStrokeStyle(StrokeStyle.Solid);
          break;
        }
        case 'dash': {
          this._setShapeStrokeStyle(StrokeStyle.Dashed);
          break;
        }
        case 'none': {
          this._setShapeStrokeStyle(StrokeStyle.None);
          break;
        }
      }
    }
  }

  private _setShapeStyle(shapeStyle: ShapeStyle) {
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        shapeStyle: shapeStyle,
        fontFamily:
          shapeStyle === ShapeStyle.General
            ? CanvasTextFontFamily.Inter
            : CanvasTextFontFamily.Kalam,
      });
    });
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._shapePanelPopper = createButtonPopper(
      this._changeShapeButton,
      this._shapePanel,
      ({ display }) => {
        this._showTypePanelPopper = display === 'show';
      }
    );
    _disposables.add(this._shapePanelPopper);
    _disposables.add(
      this._shapePanel.slots.select.on(shapeType => {
        const updatedProps =
          shapeType === 'roundedRect'
            ? ({ shapeType: ShapeType.Rect, radius: 0.1 } as const)
            : { shapeType, radius: 0 };

        this.edgeless.doc.captureSync();
        this.elements.forEach(element => {
          this.service.updateElement(element.id, updatedProps);
        });
      })
    );

    this._fillColorMenuPopper = createButtonPopper(
      this._fillColorButton,
      this._fillColorMenu,
      ({ display }) => {
        this._showFillColorPanelPopper = display === 'show';
      }
    );
    _disposables.add(this._fillColorMenuPopper);

    this._strokeColorMenuPopper = createButtonPopper(
      this._strokeColorButton,
      this._strokeColorMenu,
      ({ display }) => {
        this._showStrokeColorPanelPopper = display === 'show';
      }
    );
    _disposables.add(this._strokeColorMenuPopper);

    this._lineStylesPanelPopper = createButtonPopper(
      this._lineStylesButton,
      this._lineStylesPanel,
      ({ display }) => {
        this._showLineStylePanelPopper = display === 'show';
      }
    );
    _disposables.add(this._lineStylesPanelPopper);

    this._shapeStyleMenuPopper = createButtonPopper(
      this._shapeStyleButton,
      this._shapeStyleMenu,
      ({ display }) => {
        this._showStylelPanelPopper = display === 'show';
      }
    );
    _disposables.add(this._shapeStyleMenuPopper);

    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedShape = getMostCommonShape(this.elements);

    const selectedFillColor =
      getMostCommonFillColor(this.elements) ?? FILL_COLORS[0];
    const selectedStrokeColor =
      getMostCommonStrokeColor(this.elements) ?? STROKE_COLORS[0];
    const selectedLineSize =
      getMostCommonLineSize(this.elements) ?? LineWidth.Four;
    const selectedLineStyle = getMostCommonLineStyle(this.elements) ?? 'solid';
    const selectedShapeStyle =
      getMostCommonShapeStyle(this.elements) ?? ShapeStyle.Scribbled;

    return html`
      <div class="change-shape-toolbar-container">
        <edgeless-tool-icon-button
          .tooltip=${this._showTypePanelPopper ? nothing : 'Switch Type'}
          .active=${false}
          .iconContainerPadding=${ICON_BUTTON_PADDING_TWO}
          @click=${() => this._shapePanelPopper?.toggle()}
        >
          <div class="change-shape-button">
            ${ChangeShapeIcon} ${ShapeArrowDownSmallIcon}
          </div>
        </edgeless-tool-icon-button>
        <edgeless-shape-panel
          .selectedShape=${selectedShape}
          .shapeStyle=${selectedShapeStyle}
        >
        </edgeless-shape-panel>

        <component-toolbar-menu-divider></component-toolbar-menu-divider>

        <edgeless-tool-icon-button
          .tooltip=${this._showStylelPanelPopper ? nothing : 'Style'}
          .active=${false}
          .iconContainerPadding=${ICON_BUTTON_PADDING_TWO}
          @click=${() => this._shapeStyleMenuPopper?.toggle()}
        >
          <div class="shape-style-button">
            ${selectedShapeStyle === ShapeStyle.General
              ? GeneralStyleIcon
              : ScribbledStyleIcon}
            ${ShapeArrowDownSmallIcon}
          </div>
        </edgeless-tool-icon-button>
        <div class="shape-style-panel-container">
          <edgeless-shape-style-panel
            .value=${selectedShapeStyle}
            .onSelect=${(value: EdgelessShapeStylePanel['value']) => {
              this._setShapeStyle(value);
            }}
          >
          </edgeless-shape-style-panel>
        </div>

        <component-toolbar-menu-divider></component-toolbar-menu-divider>

        <edgeless-tool-icon-button
          class="fill-color-button"
          .tooltip=${this._showFillColorPanelPopper ? nothing : 'Fill color'}
          .active=${false}
          .iconContainerPadding=${ICON_BUTTON_PADDING_TWO}
          @click=${() => this._fillColorMenuPopper?.toggle()}
        >
          <div class="fill-color-container">
            ${ColorUnit(selectedFillColor)}
          </div>
        </edgeless-tool-icon-button>
        <div class="color-panel-container fill-color">
          <edgeless-color-panel
            .value=${selectedFillColor}
            .options=${FILL_COLORS}
            @select=${(e: ColorEvent) => this._setShapeFillColor(e.detail)}
          >
          </edgeless-color-panel>
        </div>

        <component-toolbar-menu-divider></component-toolbar-menu-divider>

        <edgeless-tool-icon-button
          class="stroke-color-button"
          .tooltip=${this._showStrokeColorPanelPopper
            ? nothing
            : 'Border color'}
          .active=${false}
          .iconContainerPadding=${ICON_BUTTON_PADDING_TWO}
          @click=${() => this._strokeColorMenuPopper?.toggle()}
        >
          <div class="stroke-color-container">
            ${ColorUnit(selectedStrokeColor, { hollowCircle: true })}
          </div>
        </edgeless-tool-icon-button>
        <div class="color-panel-container stroke-color">
          <edgeless-color-panel
            .value=${selectedStrokeColor}
            .options=${STROKE_COLORS}
            .hollowCircle=${true}
            @select=${(e: ColorEvent) => this._setShapeStrokeColor(e.detail)}
          >
          </edgeless-color-panel>
        </div>

        <edgeless-tool-icon-button
          class="border-styles-button"
          .tooltip=${this._showLineStylePanelPopper ? nothing : 'Border style'}
          .active=${false}
          .iconContainerPadding=${ICON_BUTTON_PADDING_TWO}
          @click=${() => this._lineStylesPanelPopper?.toggle()}
        >
          <div class="line-styles-button">
            ${LineStyleIcon} ${ShapeArrowDownSmallIcon}
          </div>
        </edgeless-tool-icon-button>
        ${LineStylesPanel({
          selectedLineSize,
          selectedLineStyle,
          onClick: event => {
            this._setShapeStyles(event);
          },
        })}
        ${doesAllShapesContainText(this.elements)
          ? html`<component-toolbar-menu-divider></component-toolbar-menu-divider>
              <edgeless-change-text-menu
                .elements=${this.elements}
                .elementType=${'shape'}
                .edgeless=${this.edgeless}
              ></edgeless-change-text-menu>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-shape-button': EdgelessChangeShapeButton;
  }
}

export function renderChangeShapeButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: ShapeElementModel[]
) {
  if (!elements?.length) return nothing;
  if (elements.some(e => edgeless.service.surface.isInMindmap(e.id)))
    return nothing;

  return html`<edgeless-change-shape-button
    .elements=${elements}
    .edgeless=${edgeless}
  >
  </edgeless-change-shape-button>`;
}
