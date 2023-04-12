import '../tool-icon-button.js';
import '../color-panel.js';
import '../../toolbar/shape-tool/shape-menu.js';

import type { Color, ShapeElement, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { WithDisposable } from '../../../../__internal__/index.js';
import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type { ShapeMouseMode } from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type { EdgelessShapeMenu } from '../../toolbar/shape-tool/shape-menu.js';
import { ShapeComponentConfigMap } from '../../toolbar/shape-tool/shape-menu-config.js';
import type { ColorEvent } from '../color-panel.js';
import { isTransparent } from '../color-panel.js';
import { ColorUnit } from '../color-panel.js';
import type { EdgelessToolIconButton } from '../tool-icon-button.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonShape(
  elements: ShapeElement[]
): ShapeMouseMode['shape'] | undefined {
  const shapeTypes = countBy(elements, (ele: ShapeElement) => {
    return ele.shapeType === 'rect' && ele.radius
      ? 'roundedRect'
      : ele.shapeType;
  });
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (max[0] as ShapeMouseMode['shape']) : undefined;
}

function getMostCommonFillColor(
  elements: ShapeElement[]
): ShapeMouseMode['fillColor'] | undefined {
  const colors = countBy(elements, (ele: ShapeElement) => {
    return ele.filled ? ele.fillColor : '#00000000';
  });
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as ShapeMouseMode['fillColor']) : undefined;
}

function getMostCommonStrokeColor(
  elements: ShapeElement[]
): ShapeMouseMode['fillColor'] | undefined {
  const colors = countBy(elements, (ele: ShapeElement) => {
    return ele.strokeColor;
  });
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as ShapeMouseMode['fillColor']) : undefined;
}

export const DEFAULT_FILL_COLOR = '#00000000';
const FILL_COLORS: Color[] = [
  '#FFF188',
  '#FFCF88',
  '#FFA179',
  '#FD8C99',
  '#FF88D1',
  '#D388FF',
  '#70E0B6',
  '#95BCFF',
  '#897CE0',
  '#000000',
  '#FFFFFF',
  '#00000000',
];

export const DEFAULT_STROKE_COLOR = '#000000';
const STROKE_COLORS: Color[] = [
  '#FFE838',
  '#FFAF38',
  '#FF631F',
  '#FC3F55',
  '#FF38B3',
  '#B638FF',
  '#10CB86',
  '#4F90FF',
  '#3B25CC',
  '#000000',
  '#FFFFFF',
  '#00000000',
];

@customElement('edgeless-change-shape-button')
export class EdgelessChangeShapeButton extends WithDisposable(LitElement) {
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

    edgeless-shape-menu {
      display: none;
    }

    edgeless-shape-menu[data-show] {
      display: block;
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

    .shape-color-button-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      border-radius: 4px;
      cursor: pointer;
    }

    .shape-color-button-indicator div {
      border-radius: 50%;
      width: 16px;
      height: 16px;
    }
  `;

  @property()
  elements: ShapeElement[] = [];

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

  @query('.change-shape-button')
  private _changeShapeButton!: EdgelessToolIconButton;
  @query('edgeless-shape-menu')
  private _shapeMenu!: EdgelessShapeMenu;
  private _shapeMenuPopper: ReturnType<typeof createButtonPopper> | null = null;

  @query('.fill-color-button')
  private _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private _fillColorMenu!: HTMLDivElement;
  private _fillColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.stroke-color-button')
  private _strokeColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.stroke-color')
  private _strokeColorMenu!: HTMLDivElement;
  private _strokeColorMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _forceUpdateSelection() {
    // FIXME: force update selection, because connector mode changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setShapeFillColor(color: Color) {
    const filled = !isTransparent(color);
    this.page.transact(() => {
      this.elements.forEach(ele => {
        this.surface.updateElementProps(ele.id, {
          filled,
          fillColor: color,
        });
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStrokeColor(color: Color) {
    this.page.transact(() => {
      this.elements.forEach(ele => {
        this.surface.updateElementProps(ele.id, {
          strokeColor: color,
        });
      });
    });
    this._forceUpdateSelection();
  }

  firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._shapeMenuPopper = createButtonPopper(
      this._changeShapeButton,
      this._shapeMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._shapeMenuPopper);
    _disposables.add(
      this._shapeMenu.slots.select.on(shapeType => {
        const updatedProps =
          shapeType === 'roundedRect'
            ? ({ shapeType: 'rect', radius: 0.1 } as const)
            : { shapeType, radius: 0 };

        this.page.captureSync();
        this.elements.forEach(element => {
          this.surface.updateElementProps(element.id, updatedProps);
        });
        this._forceUpdateSelection();
      })
    );

    this._fillColorMenuPopper = createButtonPopper(
      this._fillColorButton,
      this._fillColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._fillColorMenuPopper);

    this._strokeColorMenuPopper = createButtonPopper(
      this._strokeColorButton,
      this._strokeColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._strokeColorMenuPopper);

    super.firstUpdated(changedProperties);
  }

  render() {
    const selectedShape = getMostCommonShape(this.elements);
    const icon = selectedShape
      ? ShapeComponentConfigMap[selectedShape].icon
      : null;

    const selectedFillColor =
      getMostCommonFillColor(this.elements) ?? FILL_COLORS[0];
    const selectedStrokeColor =
      getMostCommonStrokeColor(this.elements) ?? STROKE_COLORS[0];
    return html`
      <edgeless-tool-icon-button
        class="change-shape-button"
        .tooltip=${this._popperShow ? '' : 'Switch type'}
        .active=${false}
        @tool.click=${() => this._shapeMenuPopper?.toggle()}
      >
        ${icon}
      </edgeless-tool-icon-button>
      <edgeless-shape-menu .selectedShape=${selectedShape}>
      </edgeless-shape-menu>

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="fill-color-button"
        .tooltip=${this._popperShow ? '' : 'Shape color'}
        .active=${false}
        @tool.click=${() => this._fillColorMenuPopper?.toggle()}
      >
        ${ColorUnit(selectedFillColor)}
      </edgeless-tool-icon-button>
      <div class="color-panel-container fill-color">
        <edgeless-color-panel
          .value=${selectedFillColor}
          .options=${FILL_COLORS}
          @select=${(e: ColorEvent) => this._setShapeFillColor(e.detail)}
        >
        </edgeless-color-panel>
      </div>

      <edgeless-tool-icon-button
        class="stroke-color-button"
        .tooltip=${this._popperShow ? '' : 'Border color'}
        .active=${false}
        @tool.click=${() => this._strokeColorMenuPopper?.toggle()}
      >
        ${ColorUnit(selectedStrokeColor, { hollowCircle: true })}
      </edgeless-tool-icon-button>
      <div class="color-panel-container stroke-color">
        <edgeless-color-panel
          .value=${selectedStrokeColor}
          .options=${STROKE_COLORS}
          .hollowCircle=${true}
          @select=${(e: ColorEvent) => this._setShapeStrokeColor(e.detail)}
        >
        </edgeless-color-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-shape-button': EdgelessChangeShapeButton;
  }
}
