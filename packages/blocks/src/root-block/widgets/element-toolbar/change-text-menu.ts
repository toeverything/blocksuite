import '../../edgeless/components/panel/font-family-panel.js';
import '../../edgeless/components/panel/size-panel.js';
import '../../edgeless/components/panel/font-weight-and-style-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  SmallArrowDownIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '../../../_common/icons/index.js';
import { ShapeArrowDownSmallIcon } from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
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
  ColorUnit,
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
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      color: var(--affine-text-primary-color);
      stroke: none;
      fill: currentColor;
    }

    .text-color-unit-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
    }

    .color-panel-container,
    .align-panel-container.text-align,
    .font-size-panel-container,
    .font-family-panel-container,
    .font-weight-and-style-panel-container {
      display: none;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .color-panel-container[data-show],
    .align-panel-container[data-show],
    .font-size-panel-container[data-show],
    .font-family-panel-container[data-show],
    .font-weight-and-style-panel-container[data-show] {
      display: block;
    }

    .button-with-arrow-group {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .font-size-button-group {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 24px;
    }

    .font-size-button-group .selected-font-size-label {
      width: 40px;
      height: 20px;
      line-height: 20px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
    }

    .font-size-button-group .arrow-down-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selected-font-size {
      align-self: end;
    }

    .text-align-button svg {
      fill: var(--affine-icon-color);
      stroke: none;
    }

    component-toolbar-menu-divider {
      margin: 0 12px;
      height: 24px;
    }

    .text-color-button.shape {
      margin-left: 12px;
    }
  `;

  @property({ attribute: false })
  elements!: EdgelessCanvasTextElement[];

  @property({ attribute: false })
  elementType!: EdgelessCanvasTextElementType;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _showTextColorPopper = false;
  @query('.text-color-button')
  private _textColorButton!: HTMLButtonElement;
  @query('.color-panel-container.text-color')
  private _textColorMenu!: HTMLDivElement;
  private _colorSelectorPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showTextAlignPopper = false;
  @query('.text-align-button')
  private _textAlignButton!: HTMLButtonElement;
  @query('.align-panel-container.text-align')
  private _textAlignMenu!: HTMLDivElement;
  private _textAlignPopper: ReturnType<typeof createButtonPopper> | null = null;

  @state()
  private _showFontFamilyPopper = false;
  @query('.text-font-family-button')
  private _textFontFamilyButton!: HTMLButtonElement;
  @query('.font-family-panel-container')
  private _textFontFamilyMenu!: HTMLDivElement;
  private _textFontFamilyPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showFontSizePopper = false;
  @query('.text-font-size-button')
  private _textFontSizeButton!: HTMLButtonElement;
  @query('.font-size-panel-container')
  private _textFontSizeMenu!: HTMLDivElement;
  private _textFontSizePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showFontWeightPopper = false;
  @query('.text-font-weight-and-style-button')
  private _textFontWeightAndStyleButton!: HTMLButtonElement;
  @query('.font-weight-and-style-panel-container')
  private _textFontWeightAndStyleMenu!: HTMLDivElement;
  private _textFontWeightAndStylePopper: ReturnType<
    typeof createButtonPopper
  > | null = null;

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

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorSelectorPopper = createButtonPopper(
      this._textColorButton,
      this._textColorMenu,
      ({ display }) => {
        this._showTextColorPopper = display === 'show';
      }
    );
    _disposables.add(this._colorSelectorPopper);

    this._textFontFamilyPopper = createButtonPopper(
      this._textFontFamilyButton,
      this._textFontFamilyMenu,
      ({ display }) => {
        this._showFontFamilyPopper = display === 'show';
      }
    );
    _disposables.add(this._textFontFamilyPopper);

    this._textAlignPopper = createButtonPopper(
      this._textAlignButton,
      this._textAlignMenu,
      ({ display }) => {
        this._showTextAlignPopper = display === 'show';
      }
    );
    _disposables.add(this._textAlignPopper);

    this._textFontSizePopper = createButtonPopper(
      this._textFontSizeButton,
      this._textFontSizeMenu,
      ({ display }) => {
        this._showFontSizePopper = display === 'show';
      }
    );
    _disposables.add(this._textFontSizePopper);

    this._textFontWeightAndStylePopper = createButtonPopper(
      this._textFontWeightAndStyleButton,
      this._textFontWeightAndStyleMenu,
      ({ display }) => {
        this._showFontWeightPopper = display === 'show';
      }
    );
    _disposables.add(this._textFontWeightAndStylePopper);

    super.firstUpdated(changedProperties);
  }

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

    return html`
      ${this.elementType === 'shape'
        ? nothing
        : html`<edgeless-tool-icon-button
              class="text-color-button"
              .tooltip=${this._showTextColorPopper ? nothing : 'Text Color'}
              .active=${false}
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              @click=${() => this._colorSelectorPopper?.toggle()}
            >
              <div class="text-color-unit-container">
                ${ColorUnit(selectedColor)}
              </div>
            </edgeless-tool-icon-button>
            <div class="color-panel-container text-color">
              <edgeless-color-panel
                .value=${selectedColor}
                .options=${LINE_COLORS}
                @select=${(event: ColorEvent) => {
                  this._setTextColor(event.detail);
                }}
              ></edgeless-color-panel>
            </div>
            <component-toolbar-menu-divider></component-toolbar-menu-divider>`}

      <edgeless-tool-icon-button
        class="text-font-family-button"
        .tooltip=${this._showFontFamilyPopper ? nothing : 'Font'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._textFontFamilyPopper?.toggle()}
      >
        <div class="button-with-arrow-group">
          <span style=${`font-family:${wrapFontFamily(selectedFontFamily)};`}
            >Aa</span
          >${SmallArrowDownIcon}
        </div>
      </edgeless-tool-icon-button>
      <div class="font-family-panel-container text-font-family">
        <edgeless-font-family-panel
          .value=${selectedFontFamily}
          .onSelect=${(value: EdgelessFontFamilyPanel['value']) =>
            this._setFontFamily(value)}
        ></edgeless-font-family-panel>
      </div>

      ${this.elementType === 'shape'
        ? html`<edgeless-tool-icon-button
              class="text-color-button shape"
              .tooltip=${this._showTextColorPopper ? nothing : 'Text Color'}
              .active=${false}
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              @click=${() => this._colorSelectorPopper?.toggle()}
            >
              <div class="text-color-unit-container">
                ${ColorUnit(selectedColor)}
              </div>
            </edgeless-tool-icon-button>
            <div class="color-panel-container text-color">
              <edgeless-color-panel
                .value=${selectedColor}
                .options=${LINE_COLORS}
                @select=${(event: ColorEvent) => {
                  this._setTextColor(event.detail);
                }}
              ></edgeless-color-panel>
            </div>`
        : nothing}

      <component-toolbar-menu-divider></component-toolbar-menu-divider>

      <edgeless-tool-icon-button
        class="text-font-size-button"
        .tooltip=${this._showFontSizePopper ? nothing : 'Font Size'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._textFontSizePopper?.toggle()}
      >
        <div class="font-size-button-group">
          <div class="selected-font-size-label">${selectedFontSize}</div>
          <div class="arrow-down-icon">${ShapeArrowDownSmallIcon}</div>
        </div>
      </edgeless-tool-icon-button>
      <div class="font-size-panel-container text-font-size">
        <edgeless-size-panel
          .size=${selectedFontSize}
          .labels=${['16', '24', '32', '36', '40', '64', '128']}
          .sizes=${[16, 24, 32, 36, 40, 64, 128]}
          .onSelect=${(fontSize: EdgelessSizePanel['size']) => {
            this._setFontSize(fontSize);
          }}
          .onPopperCose=${() => this._textFontSizePopper?.hide()}
        ></edgeless-size-panel>
      </div>

      <component-toolbar-menu-divider></component-toolbar-menu-divider>

      <edgeless-tool-icon-button
        class="text-font-weight-and-style-button"
        .disabled=${matchFontFaces.length === 1 &&
        matchFontFaces[0].style === selectedFontStyle &&
        matchFontFaces[0].weight === selectedFontWeight}
        .tooltip=${this._showFontWeightPopper ? nothing : 'Font Style'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._textFontWeightAndStylePopper?.toggle()}
      >
        <div class="button-with-arrow-group">
          <span
            >${`${
              selectedFontWeight === FontWeight.Light
                ? 'Light'
                : selectedFontWeight === FontWeight.Regular
                  ? 'Regular'
                  : 'Semibold'
            }${
              selectedFontStyle === CanvasTextFontStyle.Italic ? ' Italic' : ''
            }`}</span
          >${SmallArrowDownIcon}
        </div>
      </edgeless-tool-icon-button>
      <div class="font-weight-and-style-panel-container">
        <edgeless-font-weight-and-style-panel
          .fontFamily=${selectedFontFamily}
          .fontWeight=${selectedFontWeight}
          .fontStyle=${selectedFontStyle}
          .onSelect=${(
            fontWeight: FontWeight,
            fontStyle: CanvasTextFontStyle
          ) => this._setFontWeightAndStyle(fontWeight, fontStyle)}
        ></edgeless-font-weight-and-style-panel>
      </div>

      <component-toolbar-menu-divider></component-toolbar-menu-divider>

      <edgeless-tool-icon-button
        class="text-align-button"
        .tooltip=${this._showTextAlignPopper ? nothing : 'Alignment'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._textAlignPopper?.toggle()}
      >
        <div class="button-with-arrow-group">
          ${selectedAlign === 'left'
            ? TextAlignLeftIcon
            : selectedAlign === 'center'
              ? TextAlignCenterIcon
              : TextAlignRightIcon}
          ${SmallArrowDownIcon}
        </div>
      </edgeless-tool-icon-button>
      <div class="align-panel-container text-align">
        <edgeless-align-panel
          .value=${selectedAlign}
          .onSelect=${(value: EdgelessAlignPanel['value']) => {
            this._setTextAlign(value);
          }}
        ></edgeless-align-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-menu': EdgelessChangeTextMenu;
  }
}
