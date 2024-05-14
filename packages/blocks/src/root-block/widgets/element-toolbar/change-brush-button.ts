import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/line-width-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { LineWidth } from '../../../_common/types.js';
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import type { BrushElementModel } from '../../../surface-block/index.js';
import {
  type ColorEvent,
  type EdgelessColorPanel,
  GET_DEFAULT_LINE_COLOR,
} from '../../edgeless/components/panel/color-panel.js';
import type { LineWidthEvent } from '../../edgeless/components/panel/line-width-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

function getMostCommonColor(
  elements: BrushElementModel[]
): CssVariableName | null {
  const shapeTypes = countBy(elements, (ele: BrushElementModel) => ele.color);
  const max = maxBy(Object.entries(shapeTypes), ([_k, count]) => count);
  return max ? (max[0] as CssVariableName) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonSize(elements: BrushElementModel[]): LineWidth {
  const shapeTypes = countBy(
    elements,
    (ele: BrushElementModel) => ele.lineWidth
  );
  const max = maxBy(Object.entries(shapeTypes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
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
      margin: 0 5px;
    }

    .color-panel-container {
      display: none;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .color-panel-container[data-show] {
      display: flex;
    }

    .brush-size-button,
    .brush-color-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      border-radius: 4px;
      cursor: pointer;
    }

    .brush-size-button div,
    .brush-color-button div {
      border-radius: 50%;
      background-color: var(--affine-icon-color);
    }

    .brush-color-button div {
      width: 16px;
      height: 16px;
    }
  `;

  @property({ attribute: false })
  elements: BrushElementModel[] = [];

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _showPopper = false;

  @state()
  private _selectedColor: string | null = null;

  @state()
  private _selectedSize: LineWidth | null = LineWidth.Four;

  @query('.color-panel-container')
  private _colorPanel!: EdgelessColorPanel;

  private _colorPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  get surface() {
    return this.edgeless.surface;
  }

  get doc() {
    return this.edgeless.doc;
  }

  get service() {
    return this.surface.edgeless.service;
  }

  private _setLineWidth(size: LineWidth) {
    this.doc.captureSync();
    this.elements.forEach(element => {
      if (element.lineWidth !== size) {
        this.service.updateElement(element.id, {
          lineWidth: size,
        });
      }
    });
  }

  private _setBrushColor(color: CssVariableName) {
    this.doc.captureSync();
    this.elements.forEach(element => {
      if (element.color !== color) {
        this.service.updateElement(element.id, {
          color,
        });
      }
    });
    if (color && this._selectedColor !== color) {
      this._selectedColor = color;
    }
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorPanelPopper = createButtonPopper(
      this,
      this._colorPanel,
      ({ display }) => {
        this._showPopper = display === 'show';
      }
    );
    _disposables.add(this._colorPanelPopper);
    super.firstUpdated(changedProperties);
  }

  override render() {
    this._selectedColor = getMostCommonColor(this.elements);
    const style = {
      backgroundColor: `var(${this._selectedColor})`,
    };

    this._selectedSize = getMostCommonSize(this.elements);

    return html`
      <edgeless-line-width-panel
        .selectedSize=${this._selectedSize}
        @select=${(e: LineWidthEvent) => this._setLineWidth(e.detail)}
      >
      </edgeless-line-width-panel>
      <menu-divider .vertical=${true}></menu-divider>
      <edgeless-tool-icon-button
        .tooltip=${this._showPopper ? '' : 'Color'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._colorPanelPopper?.toggle()}
      >
        <div class="brush-color-button">
          <div style=${styleMap(style)}></div>
        </div>
      </edgeless-tool-icon-button>
      <div class="color-panel-container">
        <edgeless-color-panel
          .value=${this._selectedColor}
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

export function renderChangeBrushButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: BrushElementModel[]
) {
  if (!elements?.length) return nothing;

  return html`<edgeless-change-brush-button
    .elements=${elements}
    .edgeless=${edgeless}
  >
  </edgeless-change-brush-button>`;
}
