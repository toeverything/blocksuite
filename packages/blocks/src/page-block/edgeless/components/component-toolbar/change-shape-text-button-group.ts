import '../panel/font-family-panel.js';
import '../panel/font-size-panel.js';

import {
  BoldIcon,
  FontFamilyIcon,
  ItalicIcon,
  SmallArrowDownIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type { ShapeElement, SurfaceManager } from '@blocksuite/phasor';
import { SHAPE_TEXT_FONT_SIZE } from '@blocksuite/phasor/elements/shape/constants.js';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { countBy, maxBy } from '../../../../__internal__/utils/common.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { GENERAL_CANVAS_FONT_FAMILY } from '../../utils/consts.js';
import type { EdgelessSelectionState } from '../../utils/selection-manager.js';
import type { EdgelessFontFamilyPanel } from '../panel/font-family-panel.js';
import type { EdgelessFontSizePanel } from '../panel/font-size-panel.js';
// import type { EdgelessFontFamilyPanel } from '../panel/font-family-panel.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonFontFamily(
  shapes: ShapeElement[]
): ShapeElement['fontFamily'] {
  const fontFamilies = countBy(
    shapes,
    (shape: ShapeElement) => shape.fontFamily
  );
  const max = maxBy(Object.entries(fontFamilies), ([k, count]) => count);
  return max
    ? (max[0] as ShapeElement['fontFamily'])
    : GENERAL_CANVAS_FONT_FAMILY;
}

function getMostCommonFontSize(
  shapes: ShapeElement[]
): ShapeElement['fontSize'] {
  const fontSizes = countBy(shapes, (shape: ShapeElement) => shape.fontSize);
  const max = maxBy(Object.entries(fontSizes), ([k, count]) => count);
  return max
    ? (Number(max[0]) as ShapeElement['fontSize'])
    : SHAPE_TEXT_FONT_SIZE.MEDIUM;
}

function areAllshapesBold(shapes: ShapeElement[]): boolean {
  return shapes.every(shape => shape.isBold);
}

function areAllshapesItalic(shapes: ShapeElement[]): boolean {
  return shapes.every(shape => shape.isItalic);
}

@customElement('edgeless-change-shape-text-button-group')
export class EdgelessChangeShapeTextButtonGroup extends WithDisposable(
  LitElement
) {
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

    .font-size-panel-container[data-show],
    .font-family-panel-container[data-show] {
      display: block;
    }

    .button-with-arrow-group {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selected-font-size {
      align-self: end;
    }
  `;

  @property({ attribute: false })
  shapes: ShapeElement[] = [];

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
  selectionState!: EdgelessSelectionState;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @state()
  private _fontFamilyPopperShow = false;
  @state()
  private _fontSizePopperShow = false;

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

  private _setFontFamily(fontFamily: ShapeElement['fontFamily']) {
    this.shapes.forEach(shape => {
      this.surface.updateElement<'shape'>(shape.id, {
        fontFamily: fontFamily,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setFontSize(fontSize: ShapeElement['fontSize']) {
    this.shapes.forEach(shape => {
      this.surface.updateElement<'shape'>(shape.id, {
        fontSize: fontSize,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setShapeTextsBold(isBold: boolean) {
    this.shapes.forEach(shape => {
      this.surface.updateElement<'shape'>(shape.id, {
        isBold: isBold,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setShapeTextsItalic(isItalic: boolean) {
    this.shapes.forEach(shape => {
      this.surface.updateElement<'shape'>(shape.id, {
        isItalic: isItalic,
      });
    });
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

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
    const selectedFontFamily = getMostCommonFontFamily(this.shapes);
    const selectedFontSize = getMostCommonFontSize(this.shapes);
    const isBold = areAllshapesBold(this.shapes);
    const isItalic = areAllshapesItalic(this.shapes);

    return html`
      <edgeless-tool-icon-button
        class="text-font-size-button"
        .tooltip=${this._fontFamilyPopperShow ? '' : 'Font Size'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._textFontSizePopper?.toggle()}
      >
        <div class="button-with-arrow-group">
          <span class="selected-font-size">Middle</span> ${SmallArrowDownIcon}
        </div>
      </edgeless-tool-icon-button>
      <div class="font-size-panel-container text-font-size">
        <edgeless-font-size-panel
          .fontSize=${selectedFontSize}
          .onSelect=${(fontSize: EdgelessFontSizePanel['fontSize']) => {
            this._setFontSize(fontSize);
          }}
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
        @click=${() => this._setShapeTextsBold(!isBold)}
      >
        ${BoldIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Italic'}
        .tipPosition=${'bottom'}
        .active=${isItalic}
        @click=${() => this._setShapeTextsItalic(!isItalic)}
      >
        ${ItalicIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-shape-text-button-group': EdgelessChangeShapeTextButtonGroup;
  }
}
