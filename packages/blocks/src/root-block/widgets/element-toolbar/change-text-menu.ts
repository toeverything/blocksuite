import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/font-family-panel.js';
import '../../edgeless/components/panel/size-panel.js';
import '../../edgeless/components/panel/font-weight-and-style-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

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
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
  LINE_COLORS,
} from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EdgelessRootService } from '../../edgeless/edgeless-root-service.js';

const FONT_SIZE_LIST = [16, 24, 32, 36, 40, 64, 128];

const FONT_WEIGHT_CHOOSE: [FontWeight, () => string][] = [
  [FontWeight.Light, () => 'Light'],
  [FontWeight.Regular, () => 'Regular'],
  [FontWeight.SemiBold, () => 'Semibold'],
];

const TEXT_ALIGN_CHOOSE: [TextAlign, () => TemplateResult<1>][] = [
  [TextAlign.Left, () => TextAlignLeftIcon],
  [TextAlign.Center, () => TextAlignCenterIcon],
  [TextAlign.Right, () => TextAlignRightIcon],
];

function countByField<K extends keyof TextStyleProps>(
  elements: BlockSuite.EdgelessTextModelType[],
  field: K
) {
  return countBy(elements, element => extractField(element, field));
}

function getMostCommonValue<K extends keyof TextStyleProps>(
  elements: BlockSuite.EdgelessTextModelType[],
  field: K
) {
  const values = countByField(elements, field);
  return maxBy(Object.entries(values), ([_k, count]) => count);
}

function extractField<K extends keyof TextStyleProps>(
  element: BlockSuite.EdgelessTextModelType,
  field: K
) {
  if (element instanceof EdgelessTextBlockModel) return null;
  return (
    element instanceof ConnectorElementModel
      ? element.labelStyle[field]
      : element[field]
  ) as TextStyleProps[K];
}

function updateFields(
  service: EdgelessRootService,
  element: BlockSuite.EdgelessTextModelType,
  props: { [K in keyof TextStyleProps]?: TextStyleProps[K] }
) {
  if (element instanceof ConnectorElementModel) {
    service.updateElement(element.id, {
      labelStyle: {
        ...element.labelStyle,
        ...props,
      },
    });
    return;
  }

  service.updateElement(element.id, props);
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

  private _getMostCommonFontFamily = (
    elements: BlockSuite.EdgelessTextModelType[]
  ): FontFamily => {
    const max = getMostCommonValue(elements, 'fontFamily');
    return max ? (max[0] as FontFamily) : FontFamily.Inter;
  };

  private _getMostCommonFontSize = (
    elements: BlockSuite.EdgelessTextModelType[]
  ): number => {
    const max = getMostCommonValue(elements, 'fontSize');
    return max ? Number(max[0]) : 16;
  };

  private _getMostCommonFontWeight = (
    elements: BlockSuite.EdgelessTextModelType[]
  ): FontWeight => {
    const max = getMostCommonValue(elements, 'fontWeight');
    return max ? (max[0] as FontWeight) : FontWeight.Regular;
  };

  private _getMostCommonFontStyle = (
    elements: BlockSuite.EdgelessTextModelType[]
  ): FontStyle => {
    const max = getMostCommonValue(elements, 'fontStyle');
    return max ? (max[0] as FontStyle) : FontStyle.Normal;
  };

  private _getMostCommonColor = (
    elements: BlockSuite.EdgelessTextModelType[]
  ): string => {
    const max = getMostCommonValue(elements, 'color');
    return max ? max[0] : GET_DEFAULT_LINE_COLOR();
  };

  private _getMostCommonAlign = (
    elements: BlockSuite.EdgelessTextModelType[]
  ): TextAlign => {
    const max = getMostCommonValue(elements, 'textAlign');
    return max ? (max[0] as TextAlign) : TextAlign.Left;
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

  private _setTextColor = (color: string) => {
    this.elements.forEach(element => {
      updateFields(this.service, element, {
        color,
      });
    });
  };

  private _setTextAlign = (textAlign: TextAlign) => {
    this.elements.forEach(element => {
      updateFields(this.service, element, {
        textAlign,
      });
    });
  };

  private _setFontFamily = (fontFamily: FontFamily) => {
    const currentFontWeight = this._getMostCommonFontWeight(this.elements);
    const fontWeight = isFontWeightSupported(fontFamily, currentFontWeight)
      ? currentFontWeight
      : FontWeight.Regular;
    const currentFontStyle = this._getMostCommonFontStyle(this.elements);
    const fontStyle = isFontStyleSupported(fontFamily, currentFontStyle)
      ? currentFontStyle
      : FontStyle.Normal;

    this.elements.forEach(element => {
      updateFields(this.service, element, {
        fontFamily,
        fontWeight,
        fontStyle,
      });

      this._updateElementBound(element);
    });
  };

  private _setFontSize = (fontSize: number) => {
    this.elements.forEach(element => {
      updateFields(this.service, element, {
        fontSize,
      });

      this._updateElementBound(element);
    });
  };

  private _setFontWeightAndStyle = (
    fontWeight: FontWeight,
    fontStyle: FontStyle
  ) => {
    this.elements.forEach(element => {
      updateFields(this.service, element, {
        fontWeight,
        fontStyle,
      });

      this._updateElementBound(element);
    });
  };

  override render() {
    const elements = this.elements;
    const selectedColor = this._getMostCommonColor(elements);
    const selectedAlign = this._getMostCommonAlign(elements);
    const selectedFontFamily = this._getMostCommonFontFamily(elements);
    const selectedFontSize = Math.trunc(this._getMostCommonFontSize(elements));
    const selectedFontWeight = this._getMostCommonFontWeight(elements);
    const selectedFontStyle = this._getMostCommonFontStyle(elements);
    const matchFontFaces = getFontFacesByFontFamily(selectedFontFamily);

    return html`
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
          .onSelect=${(value: FontFamily) => this._setFontFamily(value)}
        ></edgeless-font-family-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

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
          @select=${(event: ColorEvent) => this._setTextColor(event.detail)}
        ></edgeless-color-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <edgeless-tool-icon-button
            aria-label="Font style"
            .tooltip=${'Font style'}
            .justify=${'space-between'}
            .labelHeight=${'20px'}
            .iconContainerWidth=${'90px'}
            .disabled=${matchFontFaces.length === 1 &&
            matchFontFaces[0].style === selectedFontStyle &&
            matchFontFaces[0].weight === selectedFontWeight}
          >
            <span class="label ellipsis">
              ${choose(selectedFontWeight, FONT_WEIGHT_CHOOSE)}
              ${selectedFontStyle === FontStyle.Italic ? ' Italic' : ''}
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
          .onSelect=${(fontWeight: FontWeight, fontStyle: FontStyle) =>
            this._setFontWeightAndStyle(fontWeight, fontStyle)}
        ></edgeless-font-weight-and-style-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      ${this.elementType !== 'edgeless-text'
        ? html`<edgeless-menu-button
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
                .labels=${FONT_SIZE_LIST.map(String)}
                .sizes=${FONT_SIZE_LIST}
                .onSelect=${(fontSize: number) => this._setFontSize(fontSize)}
              ></edgeless-size-panel>
            </edgeless-menu-button>
            <edgeless-menu-divider></edgeless-menu-divider>`
        : nothing}

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
          .onSelect=${(value: TextAlign) => this._setTextAlign(value)}
        ></edgeless-align-panel>
      </edgeless-menu-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-menu': EdgelessChangeTextMenu;
  }
}
