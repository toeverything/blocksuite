import '../align-panel.js';

import {
  AlighLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type { SurfaceManager, TextElement } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type { EdgelessAlignPanel } from '../align-panel.js';
import {
  type ColorEvent,
  ColorUnit,
  GET_DEFAULT_LINE_COLOR,
  LINE_COLORS,
} from '../color-panel.js';
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

    .color-panel-container,
    .align-panel-container {
      display: none;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .color-panel-container[data-show],
    .align-panel-container[data-show] {
      display: block;
    }
  `;

  @property()
  texts: TextElement[] = [];

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  @property()
  selectionState!: EdgelessSelectionState;

  @property()
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

    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedColor = getMostCommonColor(this.texts);
    const selectedAlign = getMostCommonAlign(this.texts);

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
        class="text-align-button"
        .tooltip=${this._popperShow ? '' : 'Alignment'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._textAlignPopper?.toggle()}
      >
        ${selectedAlign === 'left'
          ? AlighLeftIcon
          : selectedAlign === 'center'
          ? AlignCenterIcon
          : AlignRightIcon}
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
