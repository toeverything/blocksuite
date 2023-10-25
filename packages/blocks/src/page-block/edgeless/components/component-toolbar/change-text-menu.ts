import '../panel/font-family-panel.js';
import '../panel/font-size-panel.js';

import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  BoldIcon,
  FontFamilyIcon,
  ItalicIcon,
  SmallArrowDownIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { countBy, maxBy } from '../../../../_common/utils/iterable.js';
import {
  Bound,
  normalizeShapeBound,
  normalizeTextBound,
  PhasorElementType,
  type ShapeElement,
  type TextElement,
} from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { GENERAL_CANVAS_FONT_FAMILY } from '../../utils/consts.js';
import type { EdgelessAlignPanel } from '../panel/align-panel.js';
import {
  type ColorEvent,
  ColorUnit,
  GET_DEFAULT_LINE_COLOR,
  LINE_COLORS,
} from '../panel/color-panel.js';
import type { EdgelessFontFamilyPanel } from '../panel/font-family-panel.js';
import type { EdgelessFontSizePanel } from '../panel/font-size-panel.js';
import {
  type EdgelessCanvasTextElement,
  type EdgelessCanvasTextElementType,
  TEXT_FONT_SIZE,
} from '../text/types.js';
import { createButtonPopper } from '../utils.js';
import { ShapeArrowDownSmallIcon } from './../../../../_common/icons/index.js';

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
    .font-family-panel-container {
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
    .font-family-panel-container[data-show] {
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
      width: 72px;
      height: 24px;
    }

    .font-size-button-group .selected-font-size-label {
      width: 52px;
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

    .font-style-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .text-align-button svg {
      fill: var(--affine-icon-color);
      stroke: none;
    }

    component-toolbar-menu-divider {
      margin: 0 12px;
    }
  `;

  @property({ attribute: false })
  elements!: EdgelessCanvasTextElement[];

  @property({ attribute: false })
  elementType!: EdgelessCanvasTextElementType;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @state()
  private _textColorPopperShow = false;
  @state()
  private _fontFamilyPopperShow = false;
  @state()
  private _fontSizePopperShow = false;
  @state()
  private _textAlignPopperShow = false;

  @query('.text-color-button')
  private _textColorButton!: HTMLButtonElement;
  @query('.color-panel-container.text-color')
  private _textColorMenu!: HTMLDivElement;
  private _colorSelectorPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.text-align-button')
  private _textAlignButton!: HTMLButtonElement;
  @query('.align-panel-container.text-align')
  private _textAlignMenu!: HTMLDivElement;
  private _textAlignPopper: ReturnType<typeof createButtonPopper> | null = null;

  @query('.text-font-family-button')
  private _textFontFamilyButton!: HTMLButtonElement;
  @query('.font-family-panel-container')
  private _textFontFamilyMenu!: HTMLDivElement;
  private _textFontFamilyPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.text-font-size-button')
  private _textFontSizeButton!: HTMLButtonElement;
  @query('.font-size-panel-container')
  private _textFontSizeMenu!: HTMLDivElement;
  private _textFontSizePopper: ReturnType<typeof createButtonPopper> | null =
    null;

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
      : GENERAL_CANVAS_FONT_FAMILY;
  };

  private _getMostCommonFontSize = (
    elements: EdgelessCanvasTextElement[]
  ): EdgelessCanvasTextElement['fontSize'] => {
    const fontSizes = countBy(
      elements,
      (element: EdgelessCanvasTextElement) => element.fontSize
    );
    const max = maxBy(Object.entries(fontSizes), ([_k, count]) => count);
    return max
      ? (Number(max[0]) as EdgelessCanvasTextElement['fontSize'])
      : TEXT_FONT_SIZE.MEDIUM;
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
    return max ? (max[0] as EdgelessCanvasTextElement['textAlign']) : 'left';
  };

  private _areAllelementsBold = (
    elements: EdgelessCanvasTextElement[]
  ): boolean => {
    return elements.every(element => element.bold);
  };

  private _areAllelementsItalic = (
    elements: EdgelessCanvasTextElement[]
  ): boolean => {
    return elements.every(element => element.italic);
  };

  private _updateElementBound = (element: EdgelessCanvasTextElement) => {
    const elementType = this.elementType;
    if (elementType === PhasorElementType.TEXT) {
      // the change of font family will change the bound of the text
      const newBound = normalizeTextBound(
        element as TextElement,
        new Bound(element.x, element.y, element.w, element.h)
      );
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        xywh: newBound.serialize(),
      });
    } else {
      const newBound = normalizeShapeBound(
        element as ShapeElement,
        new Bound(element.x, element.y, element.w, element.h)
      );
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        xywh: newBound.serialize(),
      });
    }
  };

  private _setTextColor = (color: CssVariableName) => {
    this.elements.forEach(element => {
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        color,
      });
    });
  };

  private _setTextAlign = (align: EdgelessCanvasTextElement['textAlign']) => {
    this.elements.forEach(element => {
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        textAlign: align,
      });
    });
  };

  private _setFontFamily = (
    fontFamily: EdgelessCanvasTextElement['fontFamily']
  ) => {
    this.elements.forEach(element => {
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        fontFamily: fontFamily,
      });

      this._updateElementBound(element);
    });
  };

  private _setFontSize = (fontSize: EdgelessCanvasTextElement['fontSize']) => {
    this.elements.forEach(element => {
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        fontSize: fontSize,
      });

      this._updateElementBound(element);
    });
  };

  private _setTextBold = (bold: boolean) => {
    this.elements.forEach(element => {
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        bold,
      });

      this._updateElementBound(element);
    });
  };

  private _setTextItalic = (italic: boolean) => {
    this.elements.forEach(element => {
      this.surface.updateElement<PhasorElementType.TEXT>(element.id, {
        italic,
      });

      this._updateElementBound(element);
    });
  };

  private _getFontSizeLabel = (fontSize: number) => {
    switch (fontSize) {
      case TEXT_FONT_SIZE.SMALL:
        return 'Small';
      case TEXT_FONT_SIZE.MEDIUM:
        return 'Middle';
      case TEXT_FONT_SIZE.LARGE:
        return 'Large';
      case TEXT_FONT_SIZE.XLARGE:
        return 'Huge';
      default:
        return Math.trunc(fontSize);
    }
  };

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    if (this.elementType === 'text') {
      this._colorSelectorPopper = createButtonPopper(
        this._textColorButton,
        this._textColorMenu,
        ({ display }) => {
          this._textColorPopperShow = display === 'show';
        }
      );
      _disposables.add(this._colorSelectorPopper);

      this._textFontFamilyPopper = createButtonPopper(
        this._textFontFamilyButton,
        this._textFontFamilyMenu,
        ({ display }) => {
          this._fontFamilyPopperShow = display === 'show';
        }
      );
      _disposables.add(this._textFontFamilyPopper);
    }

    this._textAlignPopper = createButtonPopper(
      this._textAlignButton,
      this._textAlignMenu,
      ({ display }) => {
        this._textAlignPopperShow = display === 'show';
      }
    );
    _disposables.add(this._textAlignPopper);

    this._textFontSizePopper = createButtonPopper(
      this._textFontSizeButton,
      this._textFontSizeMenu,
      ({ display }) => {
        this._fontSizePopperShow = display === 'show';
      }
    );
    _disposables.add(this._textFontSizePopper);

    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedColor = this._getMostCommonColor(this.elements);
    const selectedAlign = this._getMostCommonAlign(this.elements);
    const selectedFontFamily = this._getMostCommonFontFamily(this.elements);
    const selectedFontSize = this._getMostCommonFontSize(this.elements);
    const bold = this._areAllelementsBold(this.elements);
    const italic = this._areAllelementsItalic(this.elements);

    return html`
      ${this.elementType === 'shape'
        ? nothing
        : html`
            <edgeless-tool-icon-button
              class="text-color-button"
              .tooltip=${this._textColorPopperShow ? '' : 'Text Color'}
              .tipPosition=${'bottom'}
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
            <component-toolbar-menu-divider></component-toolbar-menu-divider>
          `}

      <edgeless-tool-icon-button
        class="text-font-size-button"
        .tooltip=${this._fontFamilyPopperShow ? '' : 'Font Size'}
        .tipPosition=${'bottom'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._textFontSizePopper?.toggle()}
      >
        <div class="font-size-button-group">
          <div class="selected-font-size-label">
            ${this._getFontSizeLabel(selectedFontSize)}
          </div>
          <div class="arrow-down-icon">${ShapeArrowDownSmallIcon}</div>
        </div>
      </edgeless-tool-icon-button>
      <div class="font-size-panel-container text-font-size">
        <edgeless-font-size-panel
          .fontSize=${selectedFontSize}
          .onSelect=${(fontSize: EdgelessFontSizePanel['fontSize']) => {
            this._setFontSize(fontSize);
          }}
          .onPopperCose=${() => this._textFontSizePopper?.hide()}
        ></edgeless-font-size-panel>
      </div>

      <component-toolbar-menu-divider></component-toolbar-menu-divider>

      <div class="font-style-container">
        ${this.elementType === 'shape'
          ? nothing
          : html`<edgeless-tool-icon-button
                class="text-font-family-button"
                .tooltip=${this._fontSizePopperShow ? '' : 'Font'}
                .tipPosition=${'bottom'}
                .active=${false}
                .iconContainerPadding=${2}
                @click=${() => this._textFontFamilyPopper?.toggle()}
              >
                <div class="button-with-arrow-group">
                  ${FontFamilyIcon} ${SmallArrowDownIcon}
                </div>
              </edgeless-tool-icon-button>
              <div class="font-family-panel-container text-font-family">
                <edgeless-font-family-panel
                  .value=${selectedFontFamily}
                  .onSelect=${(value: EdgelessFontFamilyPanel['value']) => {
                    this._setFontFamily(value);
                  }}
                ></edgeless-font-family-panel>
              </div>`}

        <edgeless-tool-icon-button
          class="text-bold-button"
          .tooltip=${'Bold'}
          .tipPosition=${'bottom'}
          .active=${bold}
          .iconContainerPadding=${2}
          .activeMode=${'background'}
          @click=${() => this._setTextBold(!bold)}
        >
          ${BoldIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Italic'}
          .tipPosition=${'bottom'}
          .active=${italic}
          .iconContainerPadding=${2}
          .activeMode=${'background'}
          @click=${() => this._setTextItalic(!italic)}
        >
          ${ItalicIcon}
        </edgeless-tool-icon-button>
      </div>

      <component-toolbar-menu-divider></component-toolbar-menu-divider>

      <edgeless-tool-icon-button
        class="text-align-button"
        .tooltip=${this._textAlignPopperShow ? '' : 'Alignment'}
        .tipPosition=${'bottom'}
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
