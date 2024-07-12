import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import type { BrushProps } from '../../../surface-block/element-model/brush.js';
import type { BrushElementModel } from '../../../surface-block/index.js';
import type { LineWidthEvent } from '../../edgeless/components/panel/line-width-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import '../../../_common/components/toolbar/icon-button.js';
import '../../../_common/components/toolbar/menu-button.js';
import '../../../_common/components/toolbar/separator.js';
import { LineWidth } from '../../../_common/types.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import '../../edgeless/components/panel/color-panel.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
} from '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/line-width-panel.js';

function getMostCommonColor(
  elements: BrushElementModel[]
): CssVariableName | null {
  const colors = countBy(elements, ele => ele.color);
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as CssVariableName) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonSize(elements: BrushElementModel[]): LineWidth {
  const sizes = countBy(elements, ele => ele.lineWidth);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
}

function notEqual<K extends keyof BrushProps>(key: K, value: BrushProps[K]) {
  return (element: BrushElementModel) => element[key] !== value;
}

@customElement('edgeless-change-brush-button')
export class EdgelessChangeBrushButton extends WithDisposable(LitElement) {
  private _setBrushColor = ({ detail: color }: ColorEvent) => {
    this._setBrushProp('color', color);
    this._selectedColor = color;
  };

  private _setLineWidth = ({ detail: lineWidth }: LineWidthEvent) => {
    this._setBrushProp('lineWidth', lineWidth);
    this._selectedSize = lineWidth;
  };

  private _setBrushProp<K extends keyof BrushProps>(
    key: K,
    value: BrushProps[K]
  ) {
    this.doc.captureSync();
    this.elements
      .filter(notEqual(key, value))
      .forEach(element =>
        this.service.updateElement(element.id, { [key]: value })
      );
  }

  override render() {
    const { selectedSize, selectedColor } = this;

    return html`
      <edgeless-line-width-panel
        .selectedSize=${selectedSize}
        @select=${this._setLineWidth}
      >
      </edgeless-line-width-panel>

      <editor-toolbar-separator></editor-toolbar-separator>

      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button aria-label="Color" .tooltip=${'Color'}>
            <edgeless-color-button
              .color=${selectedColor}
            ></edgeless-color-button>
          </editor-icon-button>
        `}
      >
        <edgeless-color-panel
          slot
          .value=${selectedColor}
          @select=${this._setBrushColor}
        >
        </edgeless-color-panel>
      </editor-menu-button>
    `;
  }

  get doc() {
    return this.edgeless.doc;
  }

  get selectedColor() {
    return this._selectedColor ?? getMostCommonColor(this.elements);
  }

  get selectedSize() {
    return this._selectedSize ?? getMostCommonSize(this.elements);
  }

  get service() {
    return this.surface.edgeless.service;
  }

  get surface() {
    return this.edgeless.surface;
  }

  @state()
  private accessor _selectedColor: string | null = null;

  @state()
  private accessor _selectedSize: LineWidth | null = null;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: BrushElementModel[] = [];
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
