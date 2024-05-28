import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/line-width-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { LineWidth } from '../../../_common/types.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import type { BrushElementModel } from '../../../surface-block/index.js';
import {
  type ColorEvent,
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
  @property({ attribute: false })
  accessor elements: BrushElementModel[] = [];

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @state()
  private accessor _selectedColor: string | null = null;

  @state()
  private accessor _selectedSize: LineWidth | null = LineWidth.Four;

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

  override render() {
    this._selectedColor = getMostCommonColor(this.elements);
    this._selectedSize = getMostCommonSize(this.elements);

    return html`
      <edgeless-line-width-panel
        .selectedSize=${this._selectedSize}
        @select=${(e: LineWidthEvent) => this._setLineWidth(e.detail)}
      >
      </edgeless-line-width-panel>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <edgeless-tool-icon-button aria-label="Color" .tooltip=${'Color'}>
            <edgeless-color-button
              .color=${this._selectedColor}
            ></edgeless-color-button>
          </edgeless-tool-icon-button>
        `}
      >
        <edgeless-color-panel
          slot
          .value=${this._selectedColor}
          @select=${(e: ColorEvent) => this._setBrushColor(e.detail)}
        >
        </edgeless-color-panel>
      </edgeless-menu-button>
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

  return html`
    <edgeless-change-brush-button .elements=${elements} .edgeless=${edgeless}>
    </edgeless-change-brush-button>
  `;
}
