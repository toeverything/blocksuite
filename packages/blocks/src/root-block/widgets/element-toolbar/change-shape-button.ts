import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/stroke-style-panel.js';
import '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/shape-style-panel.js';
import '../../edgeless/components/panel/shape-panel.js';
import './change-text-menu.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import {
  AddTextIcon,
  ChangeShapeIcon,
  GeneralStyleIcon,
  ScribbledStyleIcon,
  SmallArrowDownIcon,
} from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { LineWidth, type ShapeTool } from '../../../_common/types.js';
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
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import {
  GET_DEFAULT_LINE_COLOR,
  isTransparent,
} from '../../edgeless/components/panel/color-panel.js';
import { type LineStyleEvent } from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessShapePanel } from '../../edgeless/components/panel/shape-panel.js';
import type { EdgelessShapeStylePanel } from '../../edgeless/components/panel/shape-style-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import {
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from '../../edgeless/utils/consts.js';
import { mountShapeTextEditor } from '../../edgeless/utils/text.js';

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

function onlyOneShapeWithoutText(elements: ShapeElementModel[]) {
  return elements.length === 1 && elements[0].text === undefined;
}

function doesAllShapesContainText(elements: ShapeElementModel[]): boolean {
  return !elements.some(ele => ele.text === undefined);
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
  static override styles = [lineSizeButtonStyles];

  @property({ attribute: false })
  accessor elements: ShapeElementModel[] = [];

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

<<<<<<< HEAD
  @query('edgeless-shape-panel')
  private _shapePanel!: EdgelessShapePanel;
=======
  @state()
  private accessor _showTypePanelPopper = false;
  @query('.change-shape-button')
  private accessor _changeShapeButton!: EdgelessToolIconButton;
  @query('edgeless-shape-panel')
  private accessor _shapePanel!: EdgelessShapePanel;
  private _shapePanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private accessor _showStylelPanelPopper = false;
  @query('.shape-style-button')
  private accessor _shapeStyleButton!: EdgelessToolIconButton;
  @query('.shape-style-panel-container')
  private accessor _shapeStyleMenu!: HTMLDivElement;
  private _shapeStyleMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private accessor _showFillColorPanelPopper = false;
  @query('.fill-color-button')
  private accessor _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private accessor _fillColorMenu!: HTMLDivElement;
  private _fillColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private accessor _showStrokeColorPanelPopper = false;
  @query('.stroke-color-button')
  private accessor _strokeColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.stroke-color')
  private accessor _strokeColorMenu!: HTMLDivElement;
  private _strokeColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private accessor _showLineStylePanelPopper = false;
  @query('.line-styles-button')
  private accessor _lineStylesButton!: EdgelessToolIconButton;
  @query('.line-style-panel')
  private accessor _lineStylesPanel!: HTMLDivElement;
  private _lineStylesPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;
>>>>>>> 46c40c3b3 (refactor: migrate decorators from v2 to v3)

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

  private _setShapeStyles({ type, value }: LineStyleEvent) {
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

  private _addText() {
    mountShapeTextEditor(this.elements[0], this.edgeless);
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

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

    return html`<edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Switch type"
          .tooltip=${'Switch type'}
        >
          ${ChangeShapeIcon}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-shape-panel
          slot
          .selectedShape=${selectedShape}
          .shapeStyle=${selectedShapeStyle}
        >
        </edgeless-shape-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Style"
          .tooltip=${'Style'}
        >
          ${cache(
            selectedShapeStyle === ShapeStyle.General
              ? GeneralStyleIcon
              : ScribbledStyleIcon
          )}
          ${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-shape-style-panel
          slot
          .value=${selectedShapeStyle}
          .onSelect=${(value: EdgelessShapeStylePanel['value']) =>
            this._setShapeStyle(value)}
        >
        </edgeless-shape-style-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
          aria-label="Fill color"
          .tooltip=${'Fill color'}
        >
          <edgeless-color-button
            .color=${selectedFillColor}
          ></edgeless-color-button>
        </edgeless-tool-icon-button>`}
      >
        <edgeless-color-panel
          slot
          role="listbox"
          aria-label="Fill colors"
          .value=${selectedFillColor}
          .options=${FILL_COLORS}
          @select=${(e: ColorEvent) => this._setShapeFillColor(e.detail)}
        >
        </edgeless-color-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
          aria-label="Border style"
          .tooltip=${'Border style'}
        >
          <edgeless-color-button
            .color=${selectedStrokeColor}
            .hollowCircle=${true}
          ></edgeless-color-button>
        </edgeless-tool-icon-button>`}
      >
        <stroke-style-panel
          slot
          .hollowCircle=${true}
          .strokeWidth=${selectedLineSize}
          .strokeStyle=${selectedLineStyle}
          .strokeColor=${selectedStrokeColor}
          .setStrokeStyle=${(e: LineStyleEvent) => this._setShapeStyles(e)}
          .setStrokeColor=${(e: ColorEvent) =>
            this._setShapeStrokeColor(e.detail)}
        >
        </stroke-style-panel>
      </edgeless-menu-button>

      ${onlyOneShapeWithoutText(this.elements)
        ? html`<edgeless-menu-divider></edgeless-menu-divider>
            <edgeless-tool-icon-button
              aria-label="Add text"
              .tooltip=${'Add text'}
              @click=${this._addText}
            >
              ${AddTextIcon}
            </edgeless-tool-icon-button>`
        : doesAllShapesContainText(this.elements)
          ? html`<edgeless-menu-divider></edgeless-menu-divider>
              <edgeless-change-text-menu
                .elements=${this.elements}
                .elementType=${'shape'}
                .edgeless=${this.edgeless}
              ></edgeless-change-text-menu>`
          : nothing}`;
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
