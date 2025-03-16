import {
  ConnectorUtils,
  EdgelessCRUDIdentifier,
  normalizeShapeBound,
  TextUtils,
} from '@blocksuite/affine-block-surface';
import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '@blocksuite/affine-components/color-picker';
import { packColor } from '@blocksuite/affine-components/color-picker';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import {
  type ColorScheme,
  ConnectorElementModel,
  DefaultTheme,
  EdgelessTextBlockModel,
  FontFamily,
  FontStyle,
  FontWeight,
  resolveColor,
  ShapeElementModel,
  type SurfaceTextModel,
  type SurfaceTextModelMap,
  TextAlign,
  TextElementModel,
  type TextStyleProps,
} from '@blocksuite/affine-model';
import { FeatureFlagService } from '@blocksuite/affine-shared/services';
import { Bound } from '@blocksuite/global/gfx';
import { WithDisposable } from '@blocksuite/global/lit';
import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '@blocksuite/icons/lit';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';
import countBy from 'lodash-es/countBy';
import maxBy from 'lodash-es/maxBy';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { SmallArrowDownIcon } from './icons.js';

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

const iconSize = { width: '20px', height: '20px' };
const TEXT_ALIGN_CHOOSE: [TextAlign, () => TemplateResult<1>][] = [
  [TextAlign.Left, () => TextAlignLeftIcon(iconSize)],
  [TextAlign.Center, () => TextAlignCenterIcon(iconSize)],
  [TextAlign.Right, () => TextAlignRightIcon(iconSize)],
] as const;

function countByField<K extends keyof Omit<TextStyleProps, 'color'>>(
  elements: SurfaceTextModel[],
  field: K
) {
  return countBy(elements, element => extractField(element, field));
}

function extractField<K extends keyof Omit<TextStyleProps, 'color'>>(
  element: SurfaceTextModel,
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
  elements: SurfaceTextModel[],
  field: K
) {
  const values = countByField(elements, field);
  return maxBy(Object.entries(values), ([_k, count]) => count);
}

function getMostCommonAlign(elements: SurfaceTextModel[]) {
  const max = getMostCommonValue(elements, 'textAlign');
  return max ? (max[0] as TextAlign) : TextAlign.Left;
}

function getMostCommonColor(
  elements: SurfaceTextModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: SurfaceTextModel) => {
    const color =
      ele instanceof ConnectorElementModel ? ele.labelStyle.color : ele.color;
    return resolveColor(color, colorScheme);
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max
    ? (max[0] as string)
    : resolveColor(DefaultTheme.textColor, colorScheme);
}

function getMostCommonFontFamily(elements: SurfaceTextModel[]) {
  const max = getMostCommonValue(elements, 'fontFamily');
  return max ? (max[0] as FontFamily) : FontFamily.Inter;
}

function getMostCommonFontSize(elements: SurfaceTextModel[]) {
  const max = getMostCommonValue(elements, 'fontSize');
  return max ? Number(max[0]) : FONT_SIZE_LIST[0].value;
}

function getMostCommonFontStyle(elements: SurfaceTextModel[]) {
  const max = getMostCommonValue(elements, 'fontStyle');
  return max ? (max[0] as FontStyle) : FontStyle.Normal;
}

function getMostCommonFontWeight(elements: SurfaceTextModel[]) {
  const max = getMostCommonValue(elements, 'fontWeight');
  return max ? (max[0] as FontWeight) : FontWeight.Regular;
}

function buildProps(
  element: SurfaceTextModel,
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

export class EdgelessChangeTextMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: inherit;
      align-items: inherit;
      justify-content: inherit;
      gap: inherit;
      height: 100%;
    }
  `;

  get crud() {
    return this.edgeless.std.get(EdgelessCRUDIdentifier);
  }

  private readonly _setFontFamily = (fontFamily: FontFamily) => {
    const currentFontWeight = getMostCommonFontWeight(this.elements);
    const fontWeight = TextUtils.isFontWeightSupported(
      fontFamily,
      currentFontWeight
    )
      ? currentFontWeight
      : FontWeight.Regular;
    const currentFontStyle = getMostCommonFontStyle(this.elements);
    const fontStyle = TextUtils.isFontStyleSupported(
      fontFamily,
      currentFontStyle
    )
      ? currentFontStyle
      : FontStyle.Normal;

    const props = { fontFamily, fontWeight, fontStyle };
    this.elements.forEach(element => {
      this.crud.updateElement(element.id, buildProps(element, props));
      this._updateElementBound(element);
    });
  };

  private readonly _setFontSize = (fontSize: number) => {
    const props = { fontSize };
    this.elements.forEach(element => {
      this.crud.updateElement(element.id, buildProps(element, props));
      this._updateElementBound(element);
    });
  };

  private readonly _setFontWeightAndStyle = (
    fontWeight: FontWeight,
    fontStyle: FontStyle
  ) => {
    const props = { fontWeight, fontStyle };
    this.elements.forEach(element => {
      this.crud.updateElement(element.id, buildProps(element, props));
      this._updateElementBound(element);
    });
  };

  private readonly _setTextAlign = (textAlign: TextAlign) => {
    const props = { textAlign };
    this.elements.forEach(element => {
      this.crud.updateElement(element.id, buildProps(element, props));
    });
  };

  private readonly _updateElementBound = (element: SurfaceTextModel) => {
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
      const newBound = TextUtils.normalizeTextBound(
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
      this.crud.updateElement(element.id, {
        xywh: newBound.serialize(),
      });
    } else if (
      elementType === 'connector' &&
      ConnectorUtils.isConnectorWithLabel(element)
    ) {
      const {
        text,
        labelXYWH,
        labelStyle: { fontFamily, fontStyle, fontSize, fontWeight },
        labelConstraints: { hasMaxWidth, maxWidth },
      } = element as ConnectorElementModel;
      const prevBounds = Bound.fromXYWH(labelXYWH || [0, 0, 16, 16]);
      const center = prevBounds.center;
      const bounds = TextUtils.normalizeTextBound(
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
      this.crud.updateElement(element.id, {
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
      this.crud.updateElement(element.id, {
        xywh: newBound.serialize(),
      });
    }
    // no need to update the bound of edgeless text block, which updates itself using ResizeObserver
  };

  pickColor = (e: PickColorEvent) => {
    if (e.type === 'pick') {
      const color = e.detail.value;
      this.elements.forEach(element => {
        const props = packColor('color', color);
        this.crud.updateElement(element.id, buildProps(element, props));
        this._updateElementBound(element);
      });
      return;
    }

    const key = this.elementType === 'connector' ? 'labelStyle' : 'color';
    this.elements.forEach(ele => {
      ele[e.type === 'start' ? 'stash' : 'pop'](key as 'color');
    });
  };

  get service() {
    return this.edgeless.service;
  }

  override render() {
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const elements = this.elements;
    const selectedAlign = getMostCommonAlign(elements);
    const selectedColor = getMostCommonColor(elements, colorScheme);
    const selectedFontFamily = getMostCommonFontFamily(elements);
    const selectedFontSize = Math.trunc(getMostCommonFontSize(elements));
    const selectedFontStyle = getMostCommonFontStyle(elements);
    const selectedFontWeight = getMostCommonFontWeight(elements);
    const matchFontFaces =
      TextUtils.getFontFacesByFontFamily(selectedFontFamily);
    const fontStyleBtnDisabled =
      matchFontFaces.length === 1 &&
      matchFontFaces[0].style === selectedFontStyle &&
      matchFontFaces[0].weight === selectedFontWeight;
    const palettes =
      this.elementType === 'shape'
        ? DefaultTheme.ShapeTextColorPalettes
        : DefaultTheme.Palettes;
    const enableCustomColor = this.edgeless.doc
      .get(FeatureFlagService)
      .getFlag('enable_color_picker');

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
                  style=${`font-family: ${TextUtils.wrapFontFamily(selectedFontFamily)}`}
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

        html`
          <edgeless-color-picker-button
            class="text-color"
            .label="${'Text color'}"
            .pick=${this.pickColor}
            .isText=${true}
            .color=${selectedColor}
            .originalColor=${elements[0] instanceof ConnectorElementModel
              ? elements[0].labelStyle.color
              : elements[0].color}
            .theme=${colorScheme}
            .palettes=${palettes}
            .enableCustomColor=${enableCustomColor}
          >
          </edgeless-color-picker-button>
        `,

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

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements!: SurfaceTextModel[];

  @property({ attribute: false })
  accessor elementType!: keyof SurfaceTextModelMap;

  @query('edgeless-color-picker-button.text-color')
  accessor textColorButton!: EdgelessColorPickerButton;
}
