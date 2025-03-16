import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '@blocksuite/affine-components/color-picker';
import { packColor } from '@blocksuite/affine-components/color-picker';
import type {
  BrushElementModel,
  BrushProps,
  ColorScheme,
} from '@blocksuite/affine-model';
import {
  DefaultTheme,
  LineWidth,
  resolveColor,
} from '@blocksuite/affine-model';
import { FeatureFlagService } from '@blocksuite/affine-shared/services';
import { WithDisposable } from '@blocksuite/global/lit';
import { html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import countBy from 'lodash-es/countBy';
import maxBy from 'lodash-es/maxBy';

import type { LineWidthEvent } from '../../edgeless/components/panel/line-width-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

function getMostCommonColor(
  elements: BrushElementModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: BrushElementModel) =>
    resolveColor(ele.color, colorScheme)
  );
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max
    ? (max[0] as string)
    : resolveColor(DefaultTheme.black, colorScheme);
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
  private readonly _setLineWidth = ({ detail: lineWidth }: LineWidthEvent) => {
    this._setBrushProp('lineWidth', lineWidth);
  };

  pickColor = (e: PickColorEvent) => {
    const field = 'color';

    if (e.type === 'pick') {
      const color = e.detail.value;
      this.elements.forEach(ele => {
        const props = packColor(field, color);
        this.crud.updateElement(ele.id, props);
      });
      return;
    }

    this.elements.forEach(ele =>
      ele[e.type === 'start' ? 'stash' : 'pop'](field)
    );
  };

  get doc() {
    return this.edgeless.doc;
  }

  get service() {
    return this.edgeless.service;
  }

  get surface() {
    return this.edgeless.surface;
  }

  get crud() {
    return this.edgeless.std.get(EdgelessCRUDIdentifier);
  }

  private _setBrushProp<K extends keyof BrushProps>(
    key: K,
    value: BrushProps[K]
  ) {
    this.doc.captureSync();
    this.elements
      .filter(notEqual(key, value))
      .forEach(element =>
        this.crud.updateElement(element.id, { [key]: value })
      );
  }

  override render() {
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const elements = this.elements;
    const selectedColor = getMostCommonColor(elements, colorScheme);
    const selectedSize = getMostCommonSize(elements);
    const enableCustomColor = this.edgeless.doc
      .get(FeatureFlagService)
      .getFlag('enable_color_picker');

    return html`
      <edgeless-line-width-panel
        .selectedSize=${selectedSize}
        @select=${this._setLineWidth}
      >
      </edgeless-line-width-panel>

      <editor-toolbar-separator></editor-toolbar-separator>

      <edgeless-color-picker-button
        class="color"
        .label="${'Color'}"
        .pick=${this.pickColor}
        .color=${selectedColor}
        .theme=${colorScheme}
        .originalColor=${elements[0].color}
        .enableCustomColor=${enableCustomColor}
      >
      </edgeless-color-picker-button>
    `;
  }

  @query('edgeless-color-picker-button.color')
  accessor colorButton!: EdgelessColorPickerButton;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: BrushElementModel[] = [];
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
