import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/font-family-panel.js';
import '../../edgeless/components/panel/size-panel.js';
import '../../edgeless/components/panel/font-weight-and-style-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  SmallArrowDownIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import {
  isFontStyleSupported,
  isFontWeightSupported,
} from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { normalizeTextBound } from '../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { CanvasTextFontStyle } from '../../../surface-block/consts.js';
import {
  FontFamily,
  FontWeight,
} from '../../../surface-block/element-model/common.js';
import type { TextElementModel } from '../../../surface-block/element-model/text.js';
import { TextAlign } from '../../../surface-block/elements/consts.js';
import type { ShapeElementModel } from '../../../surface-block/index.js';
import {
  Bound,
  CanvasElementType,
  normalizeShapeBound,
} from '../../../surface-block/index.js';
import {
  getFontFacesByFontFamily,
  wrapFontFamily,
} from '../../../surface-block/utils/font.js';
import type { EdgelessAlignPanel } from '../../edgeless/components/panel/align-panel.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
  LINE_COLORS,
} from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessFontFamilyPanel } from '../../edgeless/components/panel/font-family-panel.js';
import type { EdgelessSizePanel } from '../../edgeless/components/panel/size-panel.js';
import {
  type EdgelessCanvasTextElement,
  type EdgelessCanvasTextElementType,
} from '../../edgeless/components/text/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

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
  accessor elements!: EdgelessCanvasTextElement[];

  @property({ attribute: false })
  accessor elementType!: EdgelessCanvasTextElementType;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  get service() {
    return this.edgeless.service;
  }

  private _getMostCommonFontFamily = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['fontFamily'] => {
    const fontFamilies = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.fontFamily
    );
    const max = maxBy(Object.entries(fontFamilies), ([_k, count]) => count);
    return max
      ? (max[0] as EdgelessCanvasTextElement['fontFamily'])
      : FontFamily.Inter;
  };

  private _getMostCommonFontSize = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['fontSize'] => {
    const fontSizes = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.fontSize
    );
    const max = maxBy(Object.entries(fontSizes), ([_k, count]) => count);
    return max ? (Number(max[0]) as EdgelessCanvasTextElement['fontSize']) : 16;
  };

  private _getMostCommonFontWeight = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['fontWeight'] => {
    const fontWeights = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.fontWeight
    );
    const max = maxBy(Object.entries(fontWeights), ([_k, count]) => count);
    return max
      ? (max[0] as EdgelessCanvasTextElement['fontWeight'])
      : FontWeight.Regular;
  };

  private _getMostCommonFontStyle = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['fontStyle'] => {
    const fontStyles = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.fontStyle
    );
    const max = maxBy(Object.entries(fontStyles), ([_k, count]) => count);
    return max
      ? (max[0] as EdgelessCanvasTextElement['fontStyle'])
      : CanvasTextFontStyle.Normal;
  };

  private _getMostCommonColor = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['color'] => {
    const colors = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.color
    );
    const max = maxBy(Object.entries(colors), ([_k, count]) => count);
    return max
      ? (max[0] as EdgelessCanvasTextElement['color'])
      : GET_DEFAULT_LINE_COLOR();
  };

  private _getMostCommonAlign = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['textAlign'] => {
    const aligns = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.textAlign
    );
    const max = maxBy(Object.entries(aligns), ([_k, count]) => count);
    return max
      ? (max[0] as EdgelessCanvasTextElement['textAlign'])
      : TextAlign.Left;
  };

  private _updateElementBound = (element: EdgelessCanvasTextElement) => {
    const elementType = this.elementType;
    if (elementType === CanvasElementType.TEXT) {
      // the change of font family will change the bound of the text
      const newBound = normalizeTextBound(
        element as TextElementModel,
        new Bound(element.x, element.y, element.w, element.h)
      );
      this.service.updateElement(element.id, {
        xywh: newBound.serialize(),
      });
    } else {
      const newBound = normalizeShapeBound(
        element as ShapeElementModel,
        new Bound(element.x, element.y, element.w, element.h)
      );
      this.service.updateElement(element.id, {
        xywh: newBound.serialize(),
      });
    }
  };

  private _setTextColor = (color: CssVariableName) => {
    this.elements.forEach(element => {
      this.service.updateElement(element.id, {
        color,
      });
    });
  };

  private _setTextAlign = (align: EdgelessCanvasTextElement['textAlign']) => {
    this.elements.forEach(element => {
      this.service.updateElement(element.id, {
        textAlign: align,
      });
    });
  };

  private _setFontFamily = (
    fontFamily: EdgelessCanvasTextElement['fontFamily']
  ) => {
    const currentFontWeight = this._getMostCommonFontWeight(this.elements);
    const fontWeight = isFontWeightSupported(fontFamily, currentFontWeight)
      ? currentFontWeight
      : FontWeight.Regular;
    const currentFontStyle = this._getMostCommonFontStyle(this.elements);
    const fontStyle = isFontStyleSupported(fontFamily, currentFontStyle)
      ? currentFontStyle
      : CanvasTextFontStyle.Normal;

    this.elements.forEach(element => {
      this.service.updateElement(element.id, {
        fontFamily,
        fontWeight,
        fontStyle,
      });

      this._updateElementBound(element);
    });
  };

  private _setFontSize = (fontSize: EdgelessCanvasTextElement['fontSize']) => {
    this.elements.forEach(element => {
      this.service.updateElement(element.id, {
        fontSize: fontSize,
      });

      this._updateElementBound(element);
    });
  };

  private _setFontWeightAndStyle = (
    fontWeight: FontWeight,
    fontStyle: CanvasTextFontStyle
  ) => {
    this.elements.forEach(element => {
      this.service.updateElement(element.id, {
        fontWeight,
        fontStyle,
      });

      this._updateElementBound(element);
    });
  };

  override render() {
    const selectedColor = this._getMostCommonColor(this.elements);
    const selectedAlign = this._getMostCommonAlign(this.elements);
    const selectedFontFamily = this._getMostCommonFontFamily(this.elements);
    const selectedFontSize = Math.trunc(
      this._getMostCommonFontSize(this.elements)
    );
    const selectedFontWeight = this._getMostCommonFontWeight(this.elements);
    const selectedFontStyle = this._getMostCommonFontStyle(this.elements);

    const matchFontFaces = getFontFacesByFontFamily(selectedFontFamily);

    return html`<edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
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
        </edgeless-tool-icon-button>`}
      >
        <edgeless-font-family-panel
          slot
          .value=${selectedFontFamily}
          .onSelect=${(value: EdgelessFontFamilyPanel['value']) =>
            this._setFontFamily(value)}
        ></edgeless-font-family-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
          aria-label="Text color"
          .tooltip=${'Text color'}
        >
          <edgeless-text-color-icon
            .color=${selectedColor}
          ></edgeless-text-color-icon>
        </edgeless-tool-icon-button>`}
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
        .button=${html`<edgeless-tool-icon-button
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
            ${selectedFontWeight === FontWeight.Light
              ? 'Light'
              : selectedFontWeight === FontWeight.Regular
                ? 'Regular'
                : 'Semibold'}
            ${selectedFontStyle === CanvasTextFontStyle.Italic
              ? ' Italic'
              : ''}</span
          >${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-font-weight-and-style-panel
          slot
          .fontFamily=${selectedFontFamily}
          .fontWeight=${selectedFontWeight}
          .fontStyle=${selectedFontStyle}
          .onSelect=${(
            fontWeight: FontWeight,
            fontStyle: CanvasTextFontStyle
          ) => this._setFontWeightAndStyle(fontWeight, fontStyle)}
        ></edgeless-font-weight-and-style-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
          aria-label="Font size"
          .tooltip=${'Font size'}
          .justify=${'space-between'}
          .labelHeight=${'20px'}
          .iconContainerWidth=${'60px'}
        >
          <span class="label">${selectedFontSize}</span>
          ${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-size-panel
          slot
          data-type="check"
          .size=${selectedFontSize}
          .labels=${['16', '24', '32', '36', '40', '64', '128']}
          .sizes=${[16, 24, 32, 36, 40, 64, 128]}
          .onSelect=${(fontSize: EdgelessSizePanel['size']) =>
            this._setFontSize(fontSize)}
        ></edgeless-size-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Alignment"
          .tooltip=${'Alignment'}
        >
          ${selectedAlign === 'left'
            ? TextAlignLeftIcon
            : selectedAlign === 'center'
              ? TextAlignCenterIcon
              : TextAlignRightIcon}
          ${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <edgeless-align-panel
          slot
          .value=${selectedAlign}
          .onSelect=${(value: EdgelessAlignPanel['value']) =>
            this._setTextAlign(value)}
        ></edgeless-align-panel>
      </edgeless-menu-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-menu': EdgelessChangeTextMenu;
  }
}
