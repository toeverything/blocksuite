import type {
  BrushElementModel,
  BrushProps,
  ColorScheme,
} from '@blocksuite/affine-model';

import { LINE_COLORS, LineWidth } from '@blocksuite/affine-model';
import { countBy, maxBy, WithDisposable } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import type { EdgelessColorPickerButton } from '../../edgeless/components/color-picker/button.js';
import type { PickColorEvent } from '../../edgeless/components/color-picker/types.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import type { LineWidthEvent } from '../../edgeless/components/panel/line-width-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import {
  packColor,
  packColorsWithColorScheme,
} from '../../edgeless/components/color-picker/utils.js';
import { GET_DEFAULT_LINE_COLOR } from '../../edgeless/components/panel/color-panel.js';

function getMostCommonColor(
  elements: BrushElementModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: BrushElementModel) => {
    return typeof ele.color === 'object'
      ? (ele.color[colorScheme] ?? ele.color.normal ?? null)
      : ele.color;
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonSize(elements: BrushElementModel[]): LineWidth {
  const sizes = countBy(elements, ele => ele.lineWidth);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
}

function notEqual<K extends keyof BrushProps>(key: K, value: BrushProps[K]) {
  return (element: BrushElementModel) => element[key] !== value;
}

export class EdgelessChangeBrushButton extends WithDisposable(LitElement) {
  private _setBrushColor = ({ detail: color }: ColorEvent) => {
    this._setBrushProp('color', color);
    this._selectedColor = color;
  };

  private _setLineWidth = ({ detail: lineWidth }: LineWidthEvent) => {
    this._setBrushProp('lineWidth', lineWidth);
    this._selectedSize = lineWidth;
  };

  pickColor = (event: PickColorEvent) => {
    if (event.type === 'pick') {
      this.elements.forEach(ele =>
        this.service.updateElement(
          ele.id,
          packColor('color', { ...event.detail })
        )
      );
      return;
    }

    this.elements.forEach(ele =>
      ele[event.type === 'start' ? 'stash' : 'pop']('color')
    );
  };

  get doc() {
    return this.edgeless.doc;
  }

  get selectedColor() {
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    return (
      this._selectedColor ?? getMostCommonColor(this.elements, colorScheme)
    );
  }

  get selectedSize() {
    return this._selectedSize ?? getMostCommonSize(this.elements);
  }

  get service() {
    return this.edgeless.service;
  }

  get surface() {
    return this.edgeless.surface;
  }

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
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const elements = this.elements;
    const { selectedSize, selectedColor } = this;

    return html`
      <edgeless-line-width-panel
        .selectedSize=${selectedSize}
        @select=${this._setLineWidth}
      >
      </edgeless-line-width-panel>

      <editor-toolbar-separator></editor-toolbar-separator>

      ${when(
        this.edgeless.doc.awarenessStore.getFlag('enable_color_picker'),
        () => {
          const { type, colors } = packColorsWithColorScheme(
            colorScheme,
            selectedColor,
            elements[0].color
          );

          return html`
            <edgeless-color-picker-button
              class="color"
              .label=${'Color'}
              .pick=${this.pickColor}
              .color=${selectedColor}
              .colors=${colors}
              .colorType=${type}
              .palettes=${LINE_COLORS}
            >
            </edgeless-color-picker-button>
          `;
        },
        () => html`
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
              .value=${selectedColor}
              @select=${this._setBrushColor}
            >
            </edgeless-color-panel>
          </editor-menu-button>
        `
      )}
    `;
  }

  @state()
  private accessor _selectedColor: string | null = null;

  @state()
  private accessor _selectedSize: LineWidth | null = null;

  @query('edgeless-color-picker-button.color')
  accessor colorButton!: EdgelessColorPickerButton;

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
