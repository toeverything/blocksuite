import type { ColorScheme } from '@blocksuite/affine-model';

import {
  SmallArrowDownIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '@blocksuite/affine-components/icons';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '@blocksuite/affine-model';
import {
  ConnectorElementModel,
  EdgelessTextBlockModel,
  TextElementModel,
} from '@blocksuite/affine-model';
import { WithDisposable } from '@blocksuite/block-std';
import { Bound, countBy, maxBy } from '@blocksuite/global/utils';
import { LitElement, type TemplateResult, css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';
import { when } from 'lit/directives/when.js';

import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '../../edgeless/components/color-picker/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import {
  isFontStyleSupported,
  isFontWeightSupported,
} from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { normalizeTextBound } from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { isConnectorWithLabel } from '../../../surface-block/element-model/utils/connector.js';
import { ShapeElementModel } from '../../../surface-block/index.js';
import { normalizeShapeBound } from '../../../surface-block/index.js';
import {
  getFontFacesByFontFamily,
  wrapFontFamily,
} from '../../../surface-block/utils/font.js';
import '../../edgeless/components/color-picker/index.js';
import {
  packColor,
  packColorsWithColorScheme,
} from '../../edgeless/components/color-picker/utils.js';
import '../../edgeless/components/panel/align-panel.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
  LINE_COLORS,
} from '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/font-family-panel.js';
import '../../edgeless/components/panel/font-weight-and-style-panel.js';
import '../../edgeless/components/panel/size-panel.js';

const FONT_SIZE_LIST = [
  { value: 16 },
  { value: 24 },
  { value: 32 },
  { value: 40 },
  { value: 64 },
  { value: 128 },
] as const;

const FONT_WEIGHT_CHOOSE: [FontWeight, () => string][] = [
  [FontWeight.Light, () => 'Light'],
  [FontWeight.Regular, () => 'Regular'],
  [FontWeight.SemiBold, () => 'Semibold'],
] as const;

const FONT_STYLE_CHOOSE: [FontStyle, () => string | typeof nothing][] = [
  [FontStyle.Normal, () => nothing],
  [FontStyle.Italic, () => 'Italic'],
] as const;

const TEXT_ALIGN_CHOOSE: [TextAlign, () => TemplateResult<1>][] = [
  [TextAlign.Left, () => TextAlignLeftIcon],
  [TextAlign.Center, () => TextAlignCenterIcon],
  [TextAlign.Right, () => TextAlignRightIcon],
] as const;

function countByField<K extends keyof Omit<TextStyleProps, 'color'>>(
  elements: BlockSuite.EdgelessTextModelType[],
  field: K
) {
  return countBy(elements, element => extractField(element, field));
}

function extractField<K extends keyof Omit<TextStyleProps, 'color'>>(
  element: BlockSuite.EdgelessTextModelType,
  field: K
) {
  //TODO: It's not a very good handling method.
  //      The edgeless-change-text-menu should be refactored into a widget to allow external registration of its own logic.
  if (element instanceof EdgelessTextBlockModel) {
    return field === 'fontSize'
      ? null
      : (element[field as keyof EdgelessTextBlockModel] as TextStyleProps[K]);
  }
  return (
    element instanceof ConnectorElementModel
      ? element.labelStyle[field]
      : element[field]
  ) as TextStyleProps[K];
}

function getMostCommonValue<K extends keyof Omit<TextStyleProps, 'color'>>(
  elements: BlockSuite.EdgelessTextModelType[],
  field: K
) {
  const values = countByField(elements, field);
  return maxBy(Object.entries(values), ([_k, count]) => count);
}

function getMostCommonAlign(elements: BlockSuite.EdgelessTextModelType[]) {
  const max = getMostCommonValue(elements, 'textAlign');
  return max ? (max[0] as TextAlign) : TextAlign.Left;
}

function getMostCommonColor(
  elements: BlockSuite.EdgelessTextModelType[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: BlockSuite.EdgelessTextModelType) => {
    const color =
      ele instanceof ConnectorElementModel ? ele.labelStyle.color : ele.color;
    return typeof color === 'object'
      ? (color[colorScheme] ?? color.normal ?? null)
      : color;
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonFontFamily(elements: BlockSuite.EdgelessTextModelType[]) {
  const max = getMostCommonValue(elements, 'fontFamily');
  return max ? (max[0] as FontFamily) : FontFamily.Inter;
}

function getMostCommonFontSize(elements: BlockSuite.EdgelessTextModelType[]) {
  const max = getMostCommonValue(elements, 'fontSize');
  return max ? Number(max[0]) : FONT_SIZE_LIST[0].value;
}

function getMostCommonFontStyle(elements: BlockSuite.EdgelessTextModelType[]) {
  const max = getMostCommonValue(elements, 'fontStyle');
  return max ? (max[0] as FontStyle) : FontStyle.Normal;
}

function getMostCommonFontWeight(elements: BlockSuite.EdgelessTextModelType[]) {
  const max = getMostCommonValue(elements, 'fontWeight');
  return max ? (max[0] as FontWeight) : FontWeight.Regular;
}

function buildProps(
  element: BlockSuite.EdgelessTextModelType,
  props: { [K in keyof TextStyleProps]?: TextStyleProps[K] }
) {
  if (element instanceof ConnectorElementModel) {
    return {
      labelStyle: {
        ...element.labelStyle,
        ...props,
      },
    };
  }

  return { ...props };
}

@customElement('edgeless-change-text-menu')
export class EdgelessChangeTextMenu extends WithDisposable(LitElement) {
  private _setFontFamily = (fontFamily: FontFamily) => {
    const currentFontWeight = getMostCommonFontWeight(this.elements);
    const fontWeight = isFontWeightSupported(fontFamily, currentFontWeight)
      ? currentFontWeight
      : FontWeight.Regular;
    const currentFontStyle = getMostCommonFontStyle(this.elements);
    const fontStyle = isFontStyleSupported(fontFamily, currentFontStyle)
      ? currentFontStyle
      : FontStyle.Normal;

    const props = { fontFamily, fontWeight, fontStyle };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
      this._updateElementBound(element);
    });
  };

  private _setFontSize = (fontSize: number) => {
    const props = { fontSize };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
      this._updateElementBound(element);
    });
  };

  private _setFontWeightAndStyle = (
    fontWeight: FontWeight,
    fontStyle: FontStyle
  ) => {
    const props = { fontWeight, fontStyle };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
      this._updateElementBound(element);
    });
  };

  private _setTextAlign = (textAlign: TextAlign) => {
    const props = { textAlign };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
    });
  };

  private _setTextColor = ({ detail: color }: ColorEvent) => {
    const props = { color };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
    });
  };

  private _updateElementBound = (element: BlockSuite.EdgelessTextModelType) => {
    const elementType = this.elementType;
    if (elementType === 'text' && element instanceof TextElementModel) {
      // the change of font family will change the bound of the text
      const {
        text: yText,
        fontFamily,
        fontStyle,
        fontSize,
        fontWeight,
        hasMaxWidth,
      } = element;
      const newBound = normalizeTextBound(
        {
          yText,
          fontFamily,
          fontStyle,
          fontSize,
          fontWeight,
          hasMaxWidth,
        },
        Bound.fromXYWH(element.deserializedXYWH)
      );
      this.service.updateElement(element.id, {
        xywh: newBound.serialize(),
      });
    } else if (elementType === 'connector' && isConnectorWithLabel(element)) {
      const {
        text,
        labelXYWH,
        labelStyle: { fontFamily, fontStyle, fontSize, fontWeight },
        labelConstraints: { hasMaxWidth, maxWidth },
      } = element as ConnectorElementModel;
      const prevBounds = Bound.fromXYWH(labelXYWH || [0, 0, 16, 16]);
      const center = prevBounds.center;
      const bounds = normalizeTextBound(
        {
          yText: text!,
          fontFamily,
          fontStyle,
          fontSize,
          fontWeight,
          hasMaxWidth,
          maxWidth,
        },
        prevBounds
      );
      bounds.center = center;
      this.service.updateElement(element.id, {
        labelXYWH: bounds.toXYWH(),
      });
    } else if (
      elementType === 'shape' &&
      element instanceof ShapeElementModel
    ) {
      const newBound = normalizeShapeBound(
        element,
        Bound.fromXYWH(element.deserializedXYWH)
      );
      this.service.updateElement(element.id, {
        xywh: newBound.serialize(),
      });
    }
    // no need to update the bound of edgeless text block, which updates itself using ResizeObserver
  };

  static override styles = css`
    :host {
      display: inherit;
      align-items: inherit;
      justify-content: inherit;
      gap: inherit;
      height: 100%;
    }
  `;

  pickColor = (event: PickColorEvent) => {
    if (event.type === 'pick') {
      this.elements.forEach(ele => {
        if (ele instanceof ConnectorElementModel) {
          this.service.updateElement(ele.id, {
            labelStyle: {
              ...ele.labelStyle,
              ...packColor('color', { ...event.detail }),
            },
          });
          this._updateElementBound(ele);
          return;
        }

        this.service.updateElement(
          ele.id,
          packColor('color', { ...event.detail })
        );
        this._updateElementBound(ele);
      });
      return;
    }

    const key = this.elementType === 'connector' ? 'labelStyle' : 'color';
    this.elements.forEach(ele => {
      // @ts-expect-error: FIXME
      ele[event.type === 'start' ? 'stash' : 'pop'](key);
    });
  };

  override render() {
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const elements = this.elements;
    const selectedAlign = getMostCommonAlign(elements);
    const selectedColor = getMostCommonColor(elements, colorScheme);
    const selectedFontFamily = getMostCommonFontFamily(elements);
    const selectedFontSize = Math.trunc(getMostCommonFontSize(elements));
    const selectedFontStyle = getMostCommonFontStyle(elements);
    const selectedFontWeight = getMostCommonFontWeight(elements);
    const matchFontFaces = getFontFacesByFontFamily(selectedFontFamily);
    const fontStyleBtnDisabled =
      matchFontFaces.length === 1 &&
      matchFontFaces[0].style === selectedFontStyle &&
      matchFontFaces[0].weight === selectedFontWeight;

    return join(
      [
        html`
          <editor-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <editor-icon-button
                aria-label="Font"
                .tooltip=${'Font'}
                .justify=${'space-between'}
                .labelHeight=${'20px'}
                .iconContainerWidth=${'40px'}
              >
                <span
                  class="label padding0"
                  style=${`font-family: ${wrapFontFamily(selectedFontFamily)}`}
                  >Aa</span
                >${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-font-family-panel
              .value=${selectedFontFamily}
              .onSelect=${this._setFontFamily}
            ></edgeless-font-family-panel>
          </editor-menu-button>
        `,

        when(
          this.edgeless.doc.awarenessStore.getFlag('enable_color_picker'),
          () => {
            const { type, colors } = packColorsWithColorScheme(
              colorScheme,
              selectedColor,
              elements[0] instanceof ConnectorElementModel
                ? elements[0].labelStyle.color
                : elements[0].color
            );

            return html`
              <edgeless-color-picker-button
                class="text-color"
                .label=${'Text color'}
                .pick=${this.pickColor}
                .isText=${true}
                .color=${selectedColor}
                .colors=${colors}
                .colorType=${type}
                .palettes=${LINE_COLORS}
              >
              </edgeless-color-picker-button>
            `;
          },
          () => html`
            <editor-menu-button
              .contentPadding=${'8px'}
              .button=${html`
                <editor-icon-button
                  aria-label="Text color"
                  .tooltip=${'Text color'}
                >
                  <edgeless-text-color-icon
                    .color=${selectedColor}
                  ></edgeless-text-color-icon>
                </editor-icon-button>
              `}
            >
              <edgeless-color-panel
                .value=${selectedColor}
                @select=${this._setTextColor}
              ></edgeless-color-panel>
            </editor-menu-button>
          `
        ),

        html`
          <editor-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <editor-icon-button
                aria-label="Font style"
                .tooltip=${'Font style'}
                .justify=${'space-between'}
                .labelHeight=${'20px'}
                .iconContainerWidth=${'90px'}
                .disabled=${fontStyleBtnDisabled}
              >
                <span class="label ellipsis">
                  ${choose(selectedFontWeight, FONT_WEIGHT_CHOOSE)}
                  ${choose(selectedFontStyle, FONT_STYLE_CHOOSE)}
                </span>
                ${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-font-weight-and-style-panel
              .fontFamily=${selectedFontFamily}
              .fontWeight=${selectedFontWeight}
              .fontStyle=${selectedFontStyle}
              .onSelect=${this._setFontWeightAndStyle}
            ></edgeless-font-weight-and-style-panel>
          </editor-menu-button>
        `,

        this.elementType === 'edgeless-text'
          ? nothing
          : html`
              <editor-menu-button
                .contentPadding=${'8px'}
                .button=${html`
                  <editor-icon-button
                    aria-label="Font size"
                    .tooltip=${'Font size'}
                    .justify=${'space-between'}
                    .labelHeight=${'20px'}
                    .iconContainerWidth=${'60px'}
                  >
                    <span class="label">${selectedFontSize}</span>
                    ${SmallArrowDownIcon}
                  </editor-icon-button>
                `}
              >
                <edgeless-size-panel
                  data-type="check"
                  .size=${selectedFontSize}
                  .sizeList=${FONT_SIZE_LIST}
                  .onSelect=${this._setFontSize}
                ></edgeless-size-panel>
              </editor-menu-button>
            `,

        html`
          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="Alignment"
                .tooltip=${'Alignment'}
              >
                ${choose(selectedAlign, TEXT_ALIGN_CHOOSE)}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-align-panel
              .value=${selectedAlign}
              .onSelect=${this._setTextAlign}
            ></edgeless-align-panel>
          </editor-menu-button>
        `,
      ].filter(b => b !== nothing),
      renderToolbarSeparator
    );
  }

  get service() {
    return this.edgeless.service;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elementType!: BlockSuite.EdgelessTextModelKeyType;

  @property({ attribute: false })
  accessor elements!: BlockSuite.EdgelessTextModelType[];

  @query('edgeless-color-picker-button.text-color')
  accessor textColorButton!: EdgelessColorPickerButton;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-menu': EdgelessChangeTextMenu;
  }
}
