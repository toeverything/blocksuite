import '../buttons/tool-icon-button.js';
import '../panel/color-panel.js';
import '../panel/shape-style-panel.js';
import '../panel/shape-panel.js';
import './change-text-menu.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  ChangeShapeIcon,
  GeneralStyleIcon,
  LineStyleIcon,
  ScribbledStyleIcon,
  ShapeArrowDownSmallIcon,
} from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { countBy, maxBy } from '../../../../_common/utils/iterable.js';
import { LineWidth, type ShapeTool } from '../../../../_common/utils/types.js';
import { CanvasTextFontFamily } from '../../../../surface-block/consts.js';
import type { PhasorElementType } from '../../../../surface-block/index.js';
import {
  type ShapeElement,
  ShapeStyle,
  StrokeStyle,
} from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import {
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from '../../utils/consts.js';
import { lineSizeButtonStyles } from '../buttons/line-size-button.js';
import type { LineStyleButtonProps } from '../buttons/line-style-button.js';
import type { EdgelessToolIconButton } from '../buttons/tool-icon-button.js';
import type { ColorEvent } from '../panel/color-panel.js';
import { GET_DEFAULT_LINE_COLOR, isTransparent } from '../panel/color-panel.js';
import { ColorUnit } from '../panel/color-panel.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
} from '../panel/line-styles-panel.js';
import type { EdgelessShapePanel } from '../panel/shape-panel.js';
import type { EdgelessShapeStylePanel } from '../panel/shape-style-panel.js';
import { createButtonPopper } from '../utils.js';

const ICON_BUTTON_PADDING_TWO = 2;

function getMostCommonShape(
  elements: ShapeElement[]
): ShapeTool['shape'] | null {
  const shapeTypes = countBy(elements, (ele: ShapeElement) => {
    return ele.shapeType === 'rect' && ele.radius
      ? 'roundedRect'
      : ele.shapeType;
  });
  const max = maxBy(Object.entries(shapeTypes), ([_k, count]) => count);
  return max ? (max[0] as ShapeTool['shape']) : null;
}

function getMostCommonFillColor(
  elements: ShapeElement[]
): ShapeTool['fillColor'] | null {
  const colors = countBy(elements, (ele: ShapeElement) => {
    return ele.filled ? ele.fillColor : '--affine-palette-transparent';
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as ShapeTool['fillColor']) : null;
}

function getMostCommonStrokeColor(
  elements: ShapeElement[]
): ShapeTool['fillColor'] | null {
  const colors = countBy(elements, (ele: ShapeElement) => {
    return ele.strokeColor;
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as ShapeTool['fillColor']) : null;
}

function getMostCommonLineSize(elements: ShapeElement[]): LineWidth {
  const sizes = countBy(elements, (ele: ShapeElement) => {
    return ele.strokeWidth;
  });
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.LINE_WIDTH_FOUR;
}

function getMostCommonLineStyle(
  elements: ShapeElement[]
): LineStyleButtonProps['mode'] | null {
  const sizes = countBy(elements, (ele: ShapeElement) => {
    switch (ele.strokeStyle) {
      case StrokeStyle.Solid: {
        return 'solid';
      }
      case StrokeStyle.Dashed: {
        return 'dash';
      }
      case StrokeStyle.None: {
        return 'none';
      }
    }
  });
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as LineStyleButtonProps['mode']) : null;
}

function doesAllShapesContainText(elements: ShapeElement[]): boolean {
  return elements.every(ele => ele.text);
}

function getMostCommonShapeStyle(elements: ShapeElement[]): ShapeStyle {
  const roughnesses = countBy(elements, (ele: ShapeElement) => {
    return ele.shapeStyle;
  });
  const max = maxBy(Object.entries(roughnesses), ([_k, count]) => count);
  return max ? (max[0] as ShapeStyle) : ShapeStyle.Scribbled;
}

const FILL_COLORS: CssVariableName[] = [
  '--affine-palette-shape-yellow',
  '--affine-palette-shape-orange',
  '--affine-palette-shape-tangerine',
  '--affine-palette-shape-red',
  '--affine-palette-shape-magenta',
  '--affine-palette-shape-purple',
  '--affine-palette-shape-green',
  '--affine-palette-shape-blue',
  '--affine-palette-shape-navy',
  '--affine-palette-shape-black',
  '--affine-palette-shape-white',
  '--affine-palette-transparent',
];
export const DEFAULT_SHAPE_FILL_COLOR = FILL_COLORS[0];

const STROKE_COLORS: CssVariableName[] = [
  '--affine-palette-line-yellow',
  '--affine-palette-line-orange',
  '--affine-palette-line-tangerine',
  '--affine-palette-line-red',
  '--affine-palette-line-magenta',
  '--affine-palette-line-purple',
  '--affine-palette-line-green',
  '--affine-palette-line-blue',
  '--affine-palette-line-navy',
  '--affine-palette-line-black',
  '--affine-palette-line-white',
  '--affine-palette-transparent',
];
export const DEFAULT_SHAPE_STROKE_COLOR = STROKE_COLORS[0];

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

      .stroke-color-button {
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
  elements: ShapeElement[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @state()
  private _popperShow = false;

  @query('.change-shape-button')
  private _changeShapeButton!: EdgelessToolIconButton;
  @query('edgeless-shape-panel')
  private _shapePanel!: EdgelessShapePanel;
  private _shapePanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.shape-style-button')
  private _shapeStyleButton!: EdgelessToolIconButton;
  @query('.shape-style-panel-container')
  private _shapeStyleMenu!: HTMLDivElement;
  private _shapeStyleMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.fill-color-button')
  private _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private _fillColorMenu!: HTMLDivElement;
  private _fillColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.stroke-color-button')
  private _strokeColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.stroke-color')
  private _strokeColorMenu!: HTMLDivElement;
  private _strokeColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.line-styles-button')
  private _lineStylesButton!: EdgelessToolIconButton;
  @query('.line-style-panel')
  private _lineStylesPanel!: HTMLDivElement;
  private _lineStylesPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

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
      this.surface.updateElement<PhasorElementType.SHAPE>(ele.id, {
        filled,
        fillColor: color,
        color: textColor,
      });
    });
  }

  private _setShapeStrokeColor(color: CssVariableName) {
    this.elements.forEach(ele => {
      this.surface.updateElement<PhasorElementType.SHAPE>(ele.id, {
        strokeColor: color,
      });
    });
  }

  private _setShapeStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele => {
      this.surface.updateElement<PhasorElementType.SHAPE>(ele.id, {
        strokeWidth,
      });
    });
  }

  private _setShapeStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele => {
      this.surface.updateElement<PhasorElementType.SHAPE>(ele.id, {
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
      this.surface.updateElement<PhasorElementType.SHAPE>(ele.id, {
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
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._shapePanelPopper);
    _disposables.add(
      this._shapePanel.slots.select.on(shapeType => {
        const updatedProps =
          shapeType === 'roundedRect'
            ? ({ shapeType: 'rect', radius: 0.1 } as const)
            : { shapeType, radius: 0 };

        this.page.captureSync();
        this.elements.forEach(element => {
          this.surface.updateElement<PhasorElementType.SHAPE>(
            element.id,
            updatedProps
          );
        });
      })
    );

    this._fillColorMenuPopper = createButtonPopper(
      this._fillColorButton,
      this._fillColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._fillColorMenuPopper);

    this._strokeColorMenuPopper = createButtonPopper(
      this._strokeColorButton,
      this._strokeColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._strokeColorMenuPopper);

    this._lineStylesPanelPopper = createButtonPopper(
      this._lineStylesButton,
      this._lineStylesPanel,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._lineStylesPanelPopper);

    this._shapeStyleMenuPopper = createButtonPopper(
      this._shapeStyleButton,
      this._shapeStyleMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
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
      getMostCommonLineSize(this.elements) ?? LineWidth.LINE_WIDTH_FOUR;
    const selectedLineStyle = getMostCommonLineStyle(this.elements) ?? 'solid';
    const selectedShapeStyle =
      getMostCommonShapeStyle(this.elements) ?? ShapeStyle.Scribbled;

    return html`
      <div class="change-shape-toolbar-container">
        <edgeless-tool-icon-button
          .tooltip=${this._popperShow ? '' : 'Switch Type'}
          .tipPosition=${'bottom'}
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
          .tooltip=${this._popperShow ? '' : 'Style'}
          .tipPosition=${'bottom'}
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
          .tooltip=${this._popperShow ? '' : 'Fill color'}
          .tipPosition=${'bottom'}
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

        <edgeless-tool-icon-button
          class="stroke-color-button"
          .tooltip=${this._popperShow ? '' : 'Border color'}
          .tipPosition=${'bottom'}
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

        <component-toolbar-menu-divider></component-toolbar-menu-divider>

        <edgeless-tool-icon-button
          .tooltip=${this._popperShow ? '' : 'Border style'}
          .tipPosition=${'bottom'}
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
                .surface=${this.surface}
                .slots=${this.slots}
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
