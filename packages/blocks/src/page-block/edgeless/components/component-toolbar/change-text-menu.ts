import '../panel/font-family-panel.js';
import '../panel/font-size-panel.js';

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  FontFamilyIcon,
  ItalicIcon,
  SmallArrowDownIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import {
  Bound,
  normalizeTextBound,
  type SurfaceManager,
  type TextElement,
} from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { countBy, maxBy } from '../../../../__internal__/utils/common.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { GENERAL_CANVAS_FONT_FAMILY } from '../../utils/consts.js';
import type { EdgelessSelectionState } from '../../utils/selection-manager.js';
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

    menu-divider {
      height: 24px;
    }

    .color-panel-container,
    .align-panel-container.text-align,
    .font-size-panel-container,
    .font-family-panel-container {
      display: none;
      padding: 4px;
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
      position: relative;
      width: 76px;
      height: 24px;
      line-height: 24px;
    }

    .font-size-button-group .selected-font-size-label {
      position: absolute;
      left: 4px;
    }

    .font-size-button-group .arrow-down-icon {
      position: absolute;
      right: 4px;
    }

    .selected-font-size {
      align-self: end;
    }
  `;

  @property({ attribute: false })
  elements!: EdgelessCanvasTextElement[];

  @property({ attribute: false })
  elementType!: EdgelessCanvasTextElementType;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
  selectionState!: EdgelessSelectionState;

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
    const max = maxBy(Object.entries(fontFamilies), ([k, count]) => count);
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
    const max = maxBy(Object.entries(fontSizes), ([k, count]) => count);
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
    const max = maxBy(Object.entries(colors), ([k, count]) => count);
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
    const max = maxBy(Object.entries(aligns), ([k, count]) => count);
    return max ? (max[0] as EdgelessCanvasTextElement['textAlign']) : 'left';
  };

  private _areAllelementsBold = (
    elements: EdgelessCanvasTextElement[]
  ): boolean => {
    return elements.every(element => element.isBold);
  };

  private _areAllelementsItalic = (
    elements: EdgelessCanvasTextElement[]
  ): boolean => {
    return elements.every(element => element.isItalic);
  };

  private _setTextColor = (color: CssVariableName) => {
    const elementType = this.elementType;
    this.elements.forEach(element => {
      this.surface.updateElement<typeof elementType>(element.id, {
        color,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  };

  private _setTextAlign = (align: EdgelessCanvasTextElement['textAlign']) => {
    const elementType = this.elementType;
    this.elements.forEach(element => {
      this.surface.updateElement<typeof elementType>(element.id, {
        textAlign: align,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  };

  private _setFontFamily = (
    fontFamily: EdgelessCanvasTextElement['fontFamily']
  ) => {
    const elementType = this.elementType;
    this.elements.forEach(element => {
      this.surface.updateElement<typeof elementType>(element.id, {
        fontFamily: fontFamily,
      });

      if (this.elementType === 'text') {
        // the change of font family will change the bound of the text
        const newBound = normalizeTextBound(
          element as TextElement,
          new Bound(element.x, element.y, element.w, element.h)
        );
        this.surface.updateElement<typeof elementType>(element.id, {
          xywh: newBound.serialize(),
        });
      }
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  };

  private _setFontSize = (fontSize: EdgelessCanvasTextElement['fontSize']) => {
    const elementType = this.elementType;
    this.elements.forEach(element => {
      this.surface.updateElement<typeof elementType>(element.id, {
        fontSize: fontSize,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  };

  private _setTextBold = (isBold: boolean) => {
    const elementType = this.elementType;
    this.elements.forEach(element => {
      this.surface.updateElement<typeof elementType>(element.id, {
        isBold: isBold,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  };

  private _setTextItalic = (isItalic: boolean) => {
    const elementType = this.elementType;
    this.elements.forEach(element => {
      this.surface.updateElement<typeof elementType>(element.id, {
        isItalic: isItalic,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
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

    this._colorSelectorPopper = createButtonPopper(
      this._textColorButton,
      this._textColorMenu,
      ({ display }) => {
        this._textColorPopperShow = display === 'show';
      }
    );
    _disposables.add(this._colorSelectorPopper);

    this._textAlignPopper = createButtonPopper(
      this._textAlignButton,
      this._textAlignMenu,
      ({ display }) => {
        this._textAlignPopperShow = display === 'show';
      }
    );
    _disposables.add(this._textAlignPopper);

    this._textFontFamilyPopper = createButtonPopper(
      this._textFontFamilyButton,
      this._textFontFamilyMenu,
      ({ display }) => {
        this._fontFamilyPopperShow = display === 'show';
      }
    );
    _disposables.add(this._textFontFamilyPopper);

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
    const isBold = this._areAllelementsBold(this.elements);
    const isItalic = this._areAllelementsItalic(this.elements);

    return html`
      <edgeless-tool-icon-button
        class="text-color-button"
        .tooltip=${this._textColorPopperShow ? '' : 'Text Color'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._colorSelectorPopper?.toggle()}
      >
        ${ColorUnit(selectedColor)}
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

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="text-font-size-button"
        .tooltip=${this._fontFamilyPopperShow ? '' : 'Font Size'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._textFontSizePopper?.toggle()}
      >
        <div class="font-size-button-group">
          <span class="selected-font-size-label"
            >${this._getFontSizeLabel(selectedFontSize)}</span
          >
          <span class="arrow-down-icon">${SmallArrowDownIcon}</span>
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

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="text-font-family-button"
        .tooltip=${this._fontSizePopperShow ? '' : 'Font'}
        .tipPosition=${'bottom'}
        .active=${false}
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
      </div>

      <edgeless-tool-icon-button
        .tooltip=${'Bold'}
        .tipPosition=${'bottom'}
        .active=${isBold}
        @click=${() => this._setTextBold(!isBold)}
      >
        ${BoldIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Italic'}
        .tipPosition=${'bottom'}
        .active=${isItalic}
        @click=${() => this._setTextItalic(!isItalic)}
      >
        ${ItalicIcon}
      </edgeless-tool-icon-button>

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="text-align-button"
        .tooltip=${this._textAlignPopperShow ? '' : 'Alignment'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._textAlignPopper?.toggle()}
      >
        <div class="button-with-arrow-group">
          ${selectedAlign === 'left'
            ? AlignLeftIcon
            : selectedAlign === 'center'
            ? AlignCenterIcon
            : AlignRightIcon}
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
