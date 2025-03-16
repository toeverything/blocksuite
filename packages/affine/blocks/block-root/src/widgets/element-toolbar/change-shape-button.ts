import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '@blocksuite/affine-components/color-picker';
import { packColor } from '@blocksuite/affine-components/color-picker';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import type {
  Color,
  ColorScheme,
  ShapeElementModel,
  ShapeProps,
} from '@blocksuite/affine-model';
import {
  DefaultTheme,
  FontFamily,
  getShapeName,
  getShapeRadius,
  getShapeType,
  isTransparent,
  LineWidth,
  MindmapElementModel,
  resolveColor,
  ShapeStyle,
  StrokeStyle,
} from '@blocksuite/affine-model';
import { FeatureFlagService } from '@blocksuite/affine-shared/services';
import { WithDisposable } from '@blocksuite/global/lit';
import {
  AddTextIcon,
  ShapeIcon,
  StyleGeneralIcon,
  StyleScribbleIcon,
} from '@blocksuite/icons/lit';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';
import { styleMap } from 'lit/directives/style-map.js';
import countBy from 'lodash-es/countBy';
import isEqual from 'lodash-es/isEqual';
import maxBy from 'lodash-es/maxBy';

import {
  type LineStyleEvent,
  LineStylesPanel,
} from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessShapePanel } from '../../edgeless/components/panel/shape-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { ShapeToolOption } from '../../edgeless/gfx-tool/shape-tool.js';
import { mountShapeTextEditor } from '../../edgeless/utils/text.js';
import { SmallArrowDownIcon } from './icons.js';

const changeShapeButtonStyles = [
  css`
    .edgeless-component-line-size-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 16px;
      height: 16px;
    }

    .edgeless-component-line-size-button div {
      border-radius: 50%;
      background-color: var(--affine-icon-color);
    }

    .edgeless-component-line-size-button.size-s div {
      width: 4px;
      height: 4px;
    }
    .edgeless-component-line-size-button.size-l div {
      width: 10px;
      height: 10px;
    }
  `,
];

function getMostCommonFillColor(
  elements: ShapeElementModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: ShapeElementModel) =>
    ele.filled ? resolveColor(ele.fillColor, colorScheme) : 'transparent'
  );
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max
    ? (max[0] as string)
    : resolveColor(DefaultTheme.shapeFillColor, colorScheme);
}

function getMostCommonStrokeColor(
  elements: ShapeElementModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: ShapeElementModel) =>
    resolveColor(ele.strokeColor, colorScheme)
  );
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max
    ? (max[0] as string)
    : resolveColor(DefaultTheme.shapeStrokeColor, colorScheme);
}

function getMostCommonShape(
  elements: ShapeElementModel[]
): ShapeToolOption['shapeName'] | null {
  const shapeTypes = countBy(elements, (ele: ShapeElementModel) =>
    getShapeName(ele.shapeType, ele.radius)
  );
  const max = maxBy(Object.entries(shapeTypes), ([_k, count]) => count);
  return max ? (max[0] as ShapeToolOption['shapeName']) : null;
}

function getMostCommonLineSize(elements: ShapeElementModel[]): LineWidth {
  const sizes = countBy(elements, (ele: ShapeElementModel) => ele.strokeWidth);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
}

function getMostCommonLineStyle(elements: ShapeElementModel[]): StrokeStyle {
  const sizes = countBy(elements, (ele: ShapeElementModel) => ele.strokeStyle);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as StrokeStyle) : StrokeStyle.Solid;
}

function getMostCommonShapeStyle(elements: ShapeElementModel[]): ShapeStyle {
  const roughnesses = countBy(
    elements,
    (ele: ShapeElementModel) => ele.shapeStyle
  );
  const max = maxBy(Object.entries(roughnesses), ([_k, count]) => count);
  return max ? (max[0] as ShapeStyle) : ShapeStyle.Scribbled;
}

export class EdgelessChangeShapeButton extends WithDisposable(LitElement) {
  static override styles = [changeShapeButtonStyles];

  private readonly _setShapeStyles = ({ type, value }: LineStyleEvent) => {
    if (type === 'size') {
      this._setShapeStrokeWidth(value);
      return;
    }
    if (type === 'lineStyle') {
      this._setShapeStrokeStyle(value);
    }
  };

  get service() {
    return this.edgeless.service;
  }

  get crud() {
    return this.edgeless.std.get(EdgelessCRUDIdentifier);
  }

  private _addText() {
    mountShapeTextEditor(this.elements[0], this.edgeless);
  }

  private _getTextColor(fillColor: Color, isNotTransparent = false) {
    // When the shape is filled with black color, the text color should be white.
    // When the shape is transparent, the text color should be set according to the theme.
    // Otherwise, the text color should be black.

    if (isNotTransparent) {
      if (isEqual(fillColor, DefaultTheme.black)) {
        return DefaultTheme.white;
      } else if (isEqual(fillColor, DefaultTheme.white)) {
        return DefaultTheme.black;
      } else if (isEqual(fillColor, DefaultTheme.pureBlack)) {
        return DefaultTheme.pureWhite;
      } else if (isEqual(fillColor, DefaultTheme.pureWhite)) {
        return DefaultTheme.pureBlack;
      }
    }

    // aka `DefaultTheme.pureBlack`
    return DefaultTheme.shapeTextColor;
  }

  private _setShapeStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele =>
      this.crud.updateElement(ele.id, { strokeStyle })
    );
  }

  private _setShapeStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele =>
      this.crud.updateElement(ele.id, { strokeWidth })
    );
  }

  private _setShapeStyle(shapeStyle: ShapeStyle) {
    const fontFamily =
      shapeStyle === ShapeStyle.General ? FontFamily.Inter : FontFamily.Kalam;

    this.elements.forEach(ele => {
      this.crud.updateElement(ele.id, { shapeStyle, fontFamily });
    });
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

  override firstUpdated() {
    const _disposables = this._disposables;

    _disposables.add(
      this._shapePanel.slots.select.subscribe(shapeName => {
        this.edgeless.doc.captureSync();
        this.elements.forEach(element => {
          this.crud.updateElement(element.id, {
            shapeType: getShapeType(shapeName),
            radius: getShapeRadius(shapeName),
          });
        });
      })
    );
  }

  pickColor<K extends keyof Pick<ShapeProps, 'fillColor' | 'strokeColor'>>(
    field: K
  ) {
    return (e: PickColorEvent) => {
      if (e.type === 'pick') {
        const value = e.detail.value;
        const filled = field === 'fillColor' && !isTransparent(value);
        this.elements.forEach(ele => {
          const props = packColor(field, value);
          // If `filled` can be set separately, this logic can be removed
          if (field && !ele.filled) {
            const color = this._getTextColor(value, filled);
            Object.assign(props, { filled, color });
          }
          this.crud.updateElement(ele.id, props);
        });
        return;
      }

      this.elements.forEach(ele =>
        ele[e.type === 'start' ? 'stash' : 'pop'](field)
      );
    };
  }

  override render() {
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const elements = this.elements;
    const selectedShape = getMostCommonShape(elements);
    const selectedFillColor = getMostCommonFillColor(elements, colorScheme);
    const selectedStrokeColor = getMostCommonStrokeColor(elements, colorScheme);
    const selectedLineSize = getMostCommonLineSize(elements);
    const selectedLineStyle = getMostCommonLineStyle(elements);
    const selectedShapeStyle = getMostCommonShapeStyle(elements);
    const iconSize = { width: '20px', height: '20px' };
    const enableCustomColor = this.edgeless.doc
      .get(FeatureFlagService)
      .getFlag('enable_color_picker');

    return join(
      [
        html`
          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="Switch type"
                .tooltip=${'Switch type'}
              >
                ${ShapeIcon(iconSize)}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-shape-panel
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
                    ? StyleGeneralIcon(iconSize)
                    : StyleScribbleIcon(iconSize)
                )}
                ${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-shape-style-panel
              .value=${selectedShapeStyle}
              .onSelect=${(value: ShapeStyle) => this._setShapeStyle(value)}
            >
            </edgeless-shape-style-panel>
          </editor-menu-button>
        `,

        html`
          <edgeless-color-picker-button
            class="fill-color"
            .label="${'Fill color'}"
            .pick=${this.pickColor('fillColor')}
            .color=${selectedFillColor}
            .theme=${colorScheme}
            .originalColor=${elements[0].fillColor}
            .enableCustomColor=${enableCustomColor}
          >
          </edgeless-color-picker-button>
        `,

        html`
          <edgeless-color-picker-button
            class="border-style"
            .label="${'Border style'}"
            .pick=${this.pickColor('strokeColor')}
            .color=${selectedStrokeColor}
            .theme=${colorScheme}
            .hollowCircle=${true}
            .originalColor=${elements[0].strokeColor}
            .enableCustomColor=${enableCustomColor}
          >
            <div
              slot="other"
              class="line-styles"
              style=${styleMap({
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                alignItems: 'center',
              })}
            >
              ${LineStylesPanel({
                selectedLineSize: selectedLineSize,
                selectedLineStyle: selectedLineStyle,
                onClick: this._setShapeStyles,
              })}
            </div>
            <editor-toolbar-separator
              slot="separator"
              data-orientation="horizontal"
            ></editor-toolbar-separator>
          </edgeless-color-picker-button>
        `,

        choose<string, TemplateResult<1> | typeof nothing>(
          this._showAddButtonOrTextMenu(),
          [
            [
              'button',
              () => html`
                <editor-icon-button
                  aria-label="Add text"
                  .tooltip="${'Add text'}"
                  .iconSize="${'20px'}"
                  @click=${this._addText}
                >
                  ${AddTextIcon()}
                </editor-icon-button>
              `,
            ],
            [
              'menu',
              () => html`
                <edgeless-change-text-menu
                  .elementType="${'shape'}"
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

  @query('edgeless-shape-panel')
  private accessor _shapePanel!: EdgelessShapePanel;

  @query('edgeless-color-picker-button.border-style')
  accessor borderStyleButton!: EdgelessColorPickerButton;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: ShapeElementModel[] = [];

  @query('edgeless-color-picker-button.fill-color')
  accessor fillColorButton!: EdgelessColorPickerButton;
}

export function renderChangeShapeButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: ShapeElementModel[]
) {
  if (!elements?.length) return nothing;
  if (elements.some(e => e.group instanceof MindmapElementModel))
    return nothing;

  return html`
    <edgeless-change-shape-button .elements=${elements} .edgeless=${edgeless}>
    </edgeless-change-shape-button>
  `;
}
