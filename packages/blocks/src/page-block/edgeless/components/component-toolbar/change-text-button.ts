import '../panel/align-panel.js';
import '../panel/font-family-panel.js';

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
  type SurfaceManager,
  type TextElement,
} from '@blocksuite/phasor';
import { normalizeTextBound } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
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
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(texts: TextElement[]): TextElement['color'] {
  const colors = countBy(texts, (text: TextElement) => text.color);
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as TextElement['color']) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonAlign(texts: TextElement[]): TextElement['textAlign'] {
  const aligns = countBy(texts, (text: TextElement) => text.textAlign);
  const max = maxBy(Object.entries(aligns), ([k, count]) => count);
  return max ? (max[0] as TextElement['textAlign']) : 'left';
}

function getMostCommonFontFamily(
  texts: TextElement[]
): TextElement['fontFamily'] {
  const fontFamilies = countBy(texts, (text: TextElement) => text.fontFamily);
  const max = maxBy(Object.entries(fontFamilies), ([k, count]) => count);
  return max
    ? (max[0] as TextElement['fontFamily'])
    : GENERAL_CANVAS_FONT_FAMILY;
}

function areAllTextsBold(texts: TextElement[]): boolean {
  return texts.every(text => text.isBold);
}

function areAllTextsItalic(texts: TextElement[]): boolean {
  return texts.every(text => text.isItalic);
}

@customElement('edgeless-change-text-button')
export class EdgelessChangeTextButton extends WithDisposable(LitElement) {
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
    .font-family-panel-container[data-show] {
      display: block;
    }

    .text-color-button {
      margin-left: 8px;
    }

    .button-with-arrow-group {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  @property({ attribute: false })
  texts: TextElement[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
  selectionState!: EdgelessSelectionState;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @state()
  private _popperShow = false;

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

  private _setTextColor(color: CssVariableName) {
    this.texts.forEach(text => {
      this.surface.updateElement<'text'>(text.id, {
        color,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setTextAlign(align: TextElement['textAlign']) {
    this.texts.forEach(text => {
      this.surface.updateElement<'text'>(text.id, {
        textAlign: align,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setFontFamily(fontFamily: TextElement['fontFamily']) {
    this.texts.forEach(text => {
      this.surface.updateElement<'text'>(text.id, {
        fontFamily,
      });

      // the change of font family will change the bound of the text
      const newBound = normalizeTextBound(
        text,
        new Bound(text.x, text.y, text.w, text.h)
      );
      this.surface.updateElement<'text'>(text.id, {
        xywh: newBound.serialize(),
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setTextsBold(isBold: boolean) {
    this.texts.forEach(text => {
      this.surface.updateElement<'text'>(text.id, {
        isBold: isBold,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setTextsItalic(isItalic: boolean) {
    this.texts.forEach(text => {
      this.surface.updateElement<'text'>(text.id, {
        isItalic: isItalic,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorSelectorPopper = createButtonPopper(
      this._textColorButton,
      this._textColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._colorSelectorPopper);

    this._textAlignPopper = createButtonPopper(
      this._textAlignButton,
      this._textAlignMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._textAlignPopper);

    this._textFontFamilyPopper = createButtonPopper(
      this._textFontFamilyButton,
      this._textFontFamilyMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._textFontFamilyPopper);

    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedColor = getMostCommonColor(this.texts);
    const selectedAlign = getMostCommonAlign(this.texts);
    const selectedFontFamily = getMostCommonFontFamily(this.texts);
    const isBold = areAllTextsBold(this.texts);
    const isItalic = areAllTextsItalic(this.texts);

    return html`
      <edgeless-tool-icon-button
        class="text-color-button"
        .tooltip=${this._popperShow ? '' : 'Text Color'}
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
        class="text-font-family-button"
        .tooltip=${this._popperShow ? '' : 'Font'}
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
        .tooltip=${this._popperShow ? '' : 'Bold'}
        .tipPosition=${'bottom'}
        .active=${isBold}
        @click=${() => this._setTextsBold(!isBold)}
      >
        ${BoldIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : 'Italic'}
        .tipPosition=${'bottom'}
        .active=${isItalic}
        @click=${() => this._setTextsItalic(!isItalic)}
      >
        ${ItalicIcon}
      </edgeless-tool-icon-button>

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="text-align-button"
        .tooltip=${this._popperShow ? '' : 'Alignment'}
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
