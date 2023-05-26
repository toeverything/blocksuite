import '../tool-icon-button.js';
import '../color-panel.js';

import { WithDisposable } from '@blocksuite/lit';
import type { BrushElement, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import { BrushSize } from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type { ColorEvent, EdgelessColorPanel } from '../color-panel.js';
import { DEFAULT_SELECTED_COLOR } from '../color-panel.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(elements: BrushElement[]): CssVariableName | null {
  const shapeTypes = countBy(elements, (ele: BrushElement) => ele.color);
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (max[0] as CssVariableName) : null;
}

function getMostCommonSize(elements: BrushElement[]): BrushSize | null {
  const shapeTypes = countBy(elements, (ele: BrushElement) => ele.lineWidth);
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (Number(max[0]) as BrushSize) : null;
}

@customElement('edgeless-change-brush-button')
export class EdgelessChangeBrushButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      color: var(--affine-text-primary-color);
      fill: currentColor;
    }

    menu-divider {
      height: 24px;
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

    .brush-size-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      border-radius: 4px;
      cursor: pointer;
    }

    .brush-size-button div {
      border-radius: 50%;
      background-color: var(--affine-icon-color);
    }

    .brush-size-button[active] div {
      background-color: var(--affine-blue);
    }

    .brush-size-button .thin {
      width: 4px;
      height: 4px;
    }

    .brush-size-button .thick {
      width: 10px;
      height: 10px;
    }
  `;

  @property()
  elements: BrushElement[] = [];

  @property({ type: Object })
  selectionState!: EdgelessSelectionState;

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  @property()
  slots!: EdgelessSelectionSlots;

  @state()
  private _popperShow = false;

  @query('.color-panel-container')
  private _colorPanel!: EdgelessColorPanel;

  private _colorPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _setBrushSize(size: BrushSize) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.lineWidth !== size) {
        this.surface.updateElement<'brush'>(element.id, { lineWidth: size });
      }
    });
    // FIXME: force update selection, because brush size changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setBrushColor(color: CssVariableName) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.color !== color) {
        this.surface.updateElement<'brush'>(element.id, { color });
      }
    });
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorPanelPopper = createButtonPopper(
      this,
      this._colorPanel,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._colorPanelPopper);
    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedColor =
      getMostCommonColor(this.elements) ?? DEFAULT_SELECTED_COLOR;
    const style = {
      backgroundColor: `var(${selectedColor})`,
    };

    const selectedSize = getMostCommonSize(this.elements);

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Thin'}
        @click=${() => this._setBrushSize(BrushSize.Thin)}
      >
        <div
          class="brush-size-button"
          ?active=${selectedSize === BrushSize.Thin}
        >
          <div class="thin"></div>
        </div>
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Thick'}
        @click=${() => this._setBrushSize(BrushSize.Thick)}
      >
        <div
          class="brush-size-button"
          ?active=${selectedSize === BrushSize.Thick}
        >
          <div class="thick"></div>
        </div>
      </edgeless-tool-icon-button>
      <menu-divider .vertical=${true}></menu-divider>
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : 'Color'}
        .active=${false}
        @click=${() => this._colorPanelPopper?.toggle()}
      >
        <div class="brush-size-button">
          <div class="thick" style=${styleMap(style)}></div>
        </div>
      </edgeless-tool-icon-button>
      <div class="color-panel-container">
        <edgeless-color-panel
          .value=${selectedColor}
          @select=${(e: ColorEvent) => this._setBrushColor(e.detail)}
        >
        </edgeless-color-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-brush-button': EdgelessChangeBrushButton;
  }
}
