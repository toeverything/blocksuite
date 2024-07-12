import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, type TemplateResult, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import type { LineStyleEvent } from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessShapePanel } from '../../edgeless/components/panel/shape-panel.js';
import type { ShapeTool } from '../../edgeless/controllers/tools/shape-tool.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import '../../../_common/components/toolbar/icon-button.js';
import '../../../_common/components/toolbar/menu-button.js';
import { renderToolbarSeparator } from '../../../_common/components/toolbar/separator.js';
import {
  AddTextIcon,
  ChangeShapeIcon,
  GeneralStyleIcon,
  ScribbledStyleIcon,
  SmallArrowDownIcon,
} from '../../../_common/icons/index.js';
import { LineWidth } from '../../../_common/types.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import { FontFamily } from '../../../surface-block/consts.js';
import {
  FILL_COLORS,
  STROKE_COLORS,
  ShapeType,
} from '../../../surface-block/elements/shape/consts.js';
import {
  type ShapeElementModel,
  ShapeStyle,
  StrokeStyle,
} from '../../../surface-block/index.js';
import { lineSizeButtonStyles } from '../../edgeless/components/buttons/line-size-button.js';
import '../../edgeless/components/panel/color-panel.js';
import {
  GET_DEFAULT_LINE_COLOR,
  isTransparent,
} from '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/shape-panel.js';
import '../../edgeless/components/panel/shape-style-panel.js';
import '../../edgeless/components/panel/stroke-style-panel.js';
import {
  SHAPE_FILL_COLOR_BLACK,
  SHAPE_TEXT_COLOR_PURE_BLACK,
  SHAPE_TEXT_COLOR_PURE_WHITE,
} from '../../edgeless/utils/consts.js';
import { mountShapeTextEditor } from '../../edgeless/utils/text.js';
import './change-text-menu.js';

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
): StrokeStyle | null {
  const sizes = countBy(elements, (ele: ShapeElementModel) => ele.strokeStyle);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as StrokeStyle) : null;
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

  private _addText() {
    mountShapeTextEditor(this.elements[0], this.edgeless);
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

  private _setShapeFillColor(fillColor: CssVariableName) {
    const filled = !isTransparent(fillColor);
    const color = this._getTextColor(fillColor);
    this.elements.forEach(ele =>
      this.service.updateElement(ele.id, { filled, fillColor, color })
    );
  }

  private _setShapeStrokeColor(strokeColor: CssVariableName) {
    this.elements.forEach(ele =>
      this.service.updateElement(ele.id, { strokeColor })
    );
  }

  private _setShapeStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele =>
      this.service.updateElement(ele.id, { strokeStyle })
    );
  }

  private _setShapeStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele =>
      this.service.updateElement(ele.id, { strokeWidth })
    );
  }

  private _setShapeStyle(shapeStyle: ShapeStyle) {
    const fontFamily =
      shapeStyle === ShapeStyle.General ? FontFamily.Inter : FontFamily.Kalam;

    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, { shapeStyle, fontFamily });
    });
  }

  private _setShapeStyles({ type, value }: LineStyleEvent) {
    if (type === 'size') {
      this._setShapeStrokeWidth(value);
      return;
    }
    if (type === 'lineStyle') {
      this._setShapeStrokeStyle(value);
    }
  }

  private _showAddButtonOrTextMenu() {
    if (this.elements.length === 1 && !this.elements[0].text) {
      return 'button';
    }
    if (!this.elements.some(e => !e.text)) {
      return 'menu';
    }
    return 'nothing';
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
    const elements = this.elements;
    const selectedShape = getMostCommonShape(elements);
    const selectedFillColor =
      getMostCommonFillColor(elements) ?? FILL_COLORS[0];
    const selectedStrokeColor =
      getMostCommonStrokeColor(elements) ?? STROKE_COLORS[0];
    const selectedLineSize = getMostCommonLineSize(elements) ?? LineWidth.Four;
    const selectedLineStyle =
      getMostCommonLineStyle(elements) ?? StrokeStyle.Solid;
    const selectedShapeStyle =
      getMostCommonShapeStyle(elements) ?? ShapeStyle.Scribbled;

    return join(
      [
        html`
          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="Switch type"
                .tooltip=${'Switch type'}
              >
                ${ChangeShapeIcon}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-shape-panel
              slot
              .selectedShape=${selectedShape}
              .shapeStyle=${selectedShapeStyle}
            >
            </edgeless-shape-panel>
          </editor-menu-button>
        `,

        html`
          <editor-menu-button
            .button=${html`
              <editor-icon-button aria-label="Style" .tooltip=${'Style'}>
                ${cache(
                  selectedShapeStyle === ShapeStyle.General
                    ? GeneralStyleIcon
                    : ScribbledStyleIcon
                )}
                ${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-shape-style-panel
              slot
              .value=${selectedShapeStyle}
              .onSelect=${(value: ShapeStyle) => this._setShapeStyle(value)}
            >
            </edgeless-shape-style-panel>
          </editor-menu-button>
        `,

        html`
          <editor-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <editor-icon-button
                aria-label="Fill color"
                .tooltip=${'Fill color'}
              >
                <edgeless-color-button
                  .color=${selectedFillColor}
                ></edgeless-color-button>
              </editor-icon-button>
            `}
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
          </editor-menu-button>
        `,

        html`
          <editor-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <editor-icon-button
                aria-label="Border style"
                .tooltip=${'Border style'}
              >
                <edgeless-color-button
                  .color=${selectedStrokeColor}
                  .hollowCircle=${true}
                ></edgeless-color-button>
              </editor-icon-button>
            `}
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
          </editor-menu-button>
        `,

        choose<string, TemplateResult<1> | typeof nothing>(
          this._showAddButtonOrTextMenu(),
          [
            [
              'button',
              () => html`
                <editor-icon-button
                  aria-label="Add text"
                  .tooltip=${'Add text'}
                  @click=${this._addText}
                >
                  ${AddTextIcon}
                </editor-icon-button>
              `,
            ],
            [
              'menu',
              () => html`
                <edgeless-change-text-menu
                  .elementType=${'shape'}
                  .elements=${elements}
                  .edgeless=${this.edgeless}
                ></edgeless-change-text-menu>
              `,
            ],
            ['nothing', () => nothing],
          ]
        ),
      ].filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  get service() {
    return this.edgeless.service;
  }

  @query('edgeless-shape-panel')
  private accessor _shapePanel!: EdgelessShapePanel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: ShapeElementModel[] = [];
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

  return html`
    <edgeless-change-shape-button .elements=${elements} .edgeless=${edgeless}>
    </edgeless-change-shape-button>
  `;
}
