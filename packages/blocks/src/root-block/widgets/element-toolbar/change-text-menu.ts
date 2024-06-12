import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/font-family-panel.js';
import '../../edgeless/components/panel/size-panel.js';
import '../../edgeless/components/panel/font-weight-and-style-panel.js';
import '../../edgeless/components/panel/align-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';

import {
  SmallArrowDownIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '../../../_common/icons/index.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import {
  isFontStyleSupported,
  isFontWeightSupported,
} from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { normalizeTextBound } from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../../../surface-block/consts.js';
import { isConnectorWithLabel } from '../../../surface-block/element-model/connector.js';
import { TextElementModel } from '../../../surface-block/element-model/text.js';
import {
  ConnectorElementModel,
  ShapeElementModel,
} from '../../../surface-block/index.js';
import { Bound, normalizeShapeBound } from '../../../surface-block/index.js';
import {
  getFontFacesByFontFamily,
  wrapFontFamily,
} from '../../../surface-block/utils/font.js';
import { renderMenuDivider } from '../../edgeless/components/buttons/menu-button.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
  LINE_COLORS,
} from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

const FONT_SIZE_LIST = [
  {
    value: 16,
  },
  {
    value: 24,
  },
  {
    value: 32,
  },
  {
    value: 40,
  },
  {
    value: 64,
  },
  {
    value: 128,
  },
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

function countByField<K extends keyof TextStyleProps>(
  elements: BlockSuite.EdgelessTextModelType[],
  field: K
) {
  return countBy(elements, element => extractField(element, field));
}

function extractField<K extends keyof TextStyleProps>(
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

function getMostCommonValue<K extends keyof TextStyleProps>(
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

function getMostCommonColor(elements: BlockSuite.EdgelessTextModelType[]) {
  const max = getMostCommonValue(elements, 'color');
  return max ? max[0] : GET_DEFAULT_LINE_COLOR();
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
  static override styles = css`
    :host {
      display: inherit;
      align-items: inherit;
      justify-content: inherit;
      gap: inherit;
      height: 100%;
    }
  `;

  @property({ attribute: false })
  accessor elements!: BlockSuite.EdgelessTextModelType[];

  @property({ attribute: false })
  accessor elementType!: BlockSuite.EdgelessTextModelKeyType;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  get service() {
    return this.edgeless.service;
  }

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

  private _setTextColor = ({ detail: color }: ColorEvent) => {
    const props = { color };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
    });
  };

  private _setTextAlign = (textAlign: TextAlign) => {
    const props = { textAlign };
    this.elements.forEach(element => {
      this.service.updateElement(element.id, buildProps(element, props));
    });
  };

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

  override render() {
    const elements = this.elements;
    const selectedAlign = getMostCommonAlign(elements);
    const selectedColor = getMostCommonColor(elements);
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
          <edgeless-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <edgeless-tool-icon-button
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
              </edgeless-tool-icon-button>
            `}
          >
            <edgeless-font-family-panel
              slot
              .value=${selectedFontFamily}
              .onSelect=${this._setFontFamily}
            ></edgeless-font-family-panel>
          </edgeless-menu-button>
        `,

        html`
          <edgeless-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <edgeless-tool-icon-button
                aria-label="Text color"
                .tooltip=${'Text color'}
              >
                <edgeless-text-color-icon
                  .color=${selectedColor}
                ></edgeless-text-color-icon>
              </edgeless-tool-icon-button>
            `}
          >
            <edgeless-color-panel
              slot
              .value=${selectedColor}
              .options=${LINE_COLORS}
              @select=${this._setTextColor}
            ></edgeless-color-panel>
          </edgeless-menu-button>
        `,

        html`
          <edgeless-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <edgeless-tool-icon-button
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
              </edgeless-tool-icon-button>
            `}
          >
            <edgeless-font-weight-and-style-panel
              slot
              .fontFamily=${selectedFontFamily}
              .fontWeight=${selectedFontWeight}
              .fontStyle=${selectedFontStyle}
              .onSelect=${this._setFontWeightAndStyle}
            ></edgeless-font-weight-and-style-panel>
          </edgeless-menu-button>
        `,

        this.elementType === 'edgeless-text'
          ? nothing
          : html`
              <edgeless-menu-button
                .contentPadding=${'8px'}
                .button=${html`
                  <edgeless-tool-icon-button
                    aria-label="Font size"
                    .tooltip=${'Font size'}
                    .justify=${'space-between'}
                    .labelHeight=${'20px'}
                    .iconContainerWidth=${'60px'}
                  >
                    <span class="label">${selectedFontSize}</span>
                    ${SmallArrowDownIcon}
                  </edgeless-tool-icon-button>
                `}
              >
                <edgeless-size-panel
                  slot
                  data-type="check"
                  .size=${selectedFontSize}
                  .sizeList=${FONT_SIZE_LIST}
                  .onSelect=${this._setFontSize}
                ></edgeless-size-panel>
              </edgeless-menu-button>
            `,

        html`
          <edgeless-menu-button
            .button=${html`
              <edgeless-tool-icon-button
                aria-label="Alignment"
                .tooltip=${'Alignment'}
              >
                ${choose(selectedAlign, TEXT_ALIGN_CHOOSE)}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            `}
          >
            <edgeless-align-panel
              slot
              .value=${selectedAlign}
              .onSelect=${this._setTextAlign}
            ></edgeless-align-panel>
          </edgeless-menu-button>
        `,
      ].filter(b => b !== nothing),
      renderMenuDivider
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-menu': EdgelessChangeTextMenu;
  }
}
