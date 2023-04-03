import '../tool-icon-button.js';
import '../../toolbar/brush-tool/color-panel.js';

import { WithDisposable } from '@blocksuite/blocks/std';
import type { BrushElement, Color, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import { BrushSize } from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type {
  ColorEvent,
  EdgelessColorPanel,
} from '../../toolbar/brush-tool/color-panel.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(elements: BrushElement[]): Color | undefined {
  const shapeTypes = countBy(elements, (ele: BrushElement) => ele.color);
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (max[0] as Color) : undefined;
}

function getMostCommonSize(elements: BrushElement[]): BrushSize | undefined {
  const shapeTypes = countBy(elements, (ele: BrushElement) => ele.lineWidth);
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (Number(max[0]) as BrushSize) : undefined;
}

@customElement('edgeless-change-brush-button')
export class EdgelessChangeBrushButton extends WithDisposable(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      fill: none;
      stroke: currentColor;
      color: var(--affine-text-color);
    }

    menu-divider {
      height: 24px;
    }

    .color-panel-container {
      display: none;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
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
      background-color: #888a9e;
    }

    .brush-size-button[active] div {
      background-color: var(--affine-primary-color);
    }

    .brush-size-button .thin {
      width: 4px;
      height: 4px;
    }

    .brush-size-button .thick {
      width: 16px;
      height: 16px;
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

  @query('.color-panel-container')
  private _colorPanel!: EdgelessColorPanel;

  private _colorPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _setBrushSize(size: BrushSize) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.lineWidth !== size) {
        this.surface.updateElementProps(element.id, { lineWidth: size });
      }
    });
    // FIXME: force update selection, because brush size changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setBrushColor(color: Color) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.color !== color) {
        this.surface.updateElementProps(element.id, { color });
      }
    });
  }

  firstUpdated(changedProperties: Map<string, unknown>) {
    this._colorPanelPopper = createButtonPopper(this, this._colorPanel);
    this._disposables.add(this._colorPanelPopper);
    super.firstUpdated(changedProperties);
  }

  render() {
    const selectedColor = getMostCommonColor(this.elements);
    const style = {
      backgroundColor: selectedColor ?? '#fff',
    };

    const selectedSize = getMostCommonSize(this.elements);

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Thin'}
        @tool.click=${() => this._setBrushSize(BrushSize.Thin)}
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
        @tool.click=${() => this._setBrushSize(BrushSize.Thick)}
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
        .tooltip=${'Color'}
        .active=${false}
        @tool.click=${() => this._colorPanelPopper?.toggle()}
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
