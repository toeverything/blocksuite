import { WithDisposable } from '@blocksuite/lit';
import type { SurfaceManager, TextElement } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import { type ColorEvent, ColorUnit } from '../color-panel.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(texts: TextElement[]): TextElement['color'] | null {
  const colors = countBy(texts, (text: TextElement) => text.color);
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as TextElement['color']) : null;
}

const TEXT_COLORS: CssVariableName[] = [
  '--affine-palette-line-yellow',
  '--affine-palette-line-orange',
  '--affine-palette-line-tangerine',
  '--affine-palette-line-red',
  '--affine-palette-line-magenta',
  '--affine-palette-line-purple',
  '--affine-palette-line-navy',
  '--affine-palette-line-blue',
  '--affine-palette-line-green',
  '--affine-palette-line-white',
  '--affine-palette-line-black',
  '--affine-palette-line-grey',
];
export const DEFAULT_TEXT_COLOR = TEXT_COLORS[10];

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

    .color-panel-container {
      display: none;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .color-panel-container[data-show] {
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

  private _setTextColor(color: CssVariableName) {
    this.texts.forEach(text => {
      this.surface.updateElement<'text'>(text.id, {
        color,
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
    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedColor = getMostCommonColor(this.texts) ?? TEXT_COLORS[0];

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
          .options=${TEXT_COLORS}
          @select=${(event: ColorEvent) => {
            this._setTextColor(event.detail);
          }}
        ></edgeless-color-panel>
      </div>
    `;
  }
}
