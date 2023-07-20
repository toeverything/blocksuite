import '../buttons/tool-icon-button.js';
import '../panel/color-panel.js';
import '../toolbar/shape/shape-menu.js';
import './change-text-menu.js';

import { LineStyleIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import {
  type ShapeElement,
  StrokeStyle,
  type SurfaceManager,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { countBy, maxBy } from '../../../../__internal__/utils/common.js';
import {
  BrushSize,
  type ShapeTool,
} from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../utils/selection-manager.js';
import { lineSizeButtonStyles } from '../buttons/line-size-button.js';
import type { LineStyleButtonProps } from '../buttons/line-style-button.js';
import type { EdgelessToolIconButton } from '../buttons/tool-icon-button.js';
import type { ColorEvent } from '../panel/color-panel.js';
import { isTransparent } from '../panel/color-panel.js';
import { ColorUnit } from '../panel/color-panel.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
} from '../panel/line-styles-panel.js';
import type { EdgelessShapeMenu } from '../toolbar/shape/shape-menu.js';
import { ShapeComponentConfigMap } from '../toolbar/shape/shape-menu-config.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonShape(
  elements: ShapeElement[]
): ShapeTool['shape'] | null {
  const shapeTypes = countBy(elements, (ele: ShapeElement) => {
    return ele.shapeType === 'rect' && ele.radius
      ? 'roundedRect'
      : ele.shapeType;
  });
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (max[0] as ShapeTool['shape']) : null;
}

function getMostCommonFillColor(
  elements: ShapeElement[]
): ShapeTool['fillColor'] | null {
  const colors = countBy(elements, (ele: ShapeElement) => {
    return ele.filled ? ele.fillColor : '--affine-palette-transparent';
  });
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as ShapeTool['fillColor']) : null;
}

function getMostCommonStrokeColor(
  elements: ShapeElement[]
): ShapeTool['fillColor'] | null {
  const colors = countBy(elements, (ele: ShapeElement) => {
    return ele.strokeColor;
  });
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as ShapeTool['fillColor']) : null;
}

function getMostCommonLineSize(elements: ShapeElement[]): BrushSize {
  const sizes = countBy(elements, (ele: ShapeElement) => {
    return ele.strokeWidth;
  });
  const max = maxBy(Object.entries(sizes), ([k, count]) => count);
  return max ? (Number(max[0]) as BrushSize) : BrushSize.LINE_WIDTH_FOUR;
}

function getMostCommonLineStyle(
  elements: ShapeElement[]
): LineStyleButtonProps['mode'] | null {
  const sizes = countBy(elements, (ele: ShapeElement) => {
    switch (ele.strokeStyle) {
      case StrokeStyle.Solid: {
        return 'solid';
      }
      case StrokeStyle.Dashed: {
        return 'dash';
      }
      case StrokeStyle.None: {
        return 'none';
      }
    }
  });
  const max = maxBy(Object.entries(sizes), ([k, count]) => count);
  return max ? (max[0] as LineStyleButtonProps['mode']) : null;
}

function doesAllShapesContainText(elements: ShapeElement[]): boolean {
  return elements.every(ele => ele.text);
}

const FILL_COLORS: CssVariableName[] = [
  '--affine-palette-shape-yellow',
  '--affine-palette-shape-orange',
  '--affine-palette-shape-tangerine',
  '--affine-palette-shape-red',
  '--affine-palette-shape-magenta',
  '--affine-palette-shape-purple',
  '--affine-palette-shape-green',
  '--affine-palette-shape-blue',
  '--affine-palette-shape-navy',
  '--affine-palette-shape-black',
  '--affine-palette-shape-white',
  '--affine-palette-transparent',
];
export const DEFAULT_SHAPE_FILL_COLOR = FILL_COLORS[11];

const STROKE_COLORS: CssVariableName[] = [
  '--affine-palette-line-yellow',
  '--affine-palette-line-orange',
  '--affine-palette-line-tangerine',
  '--affine-palette-line-red',
  '--affine-palette-line-magenta',
  '--affine-palette-line-purple',
  '--affine-palette-line-green',
  '--affine-palette-line-blue',
  '--affine-palette-line-navy',
  '--affine-palette-line-black',
  '--affine-palette-line-white',
  '--affine-palette-transparent',
];
export const DEFAULT_SHAPE_STROKE_COLOR = STROKE_COLORS[9];

@customElement('edgeless-change-shape-button')
export class EdgelessChangeShapeButton extends WithDisposable(LitElement) {
  static override styles = [
    lineSizeButtonStyles,
    lineStylesPanelStyles,
    css`
      :host {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        color: var(--affine-text-primary-color);
        stroke: none;
        fill: currentColor;
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

      .change-shape-button {
        fill: none;
        stroke: currentColor;
        margin-left: 8px;
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

      .line-style-panel {
        display: none;
      }
      .line-style-panel[data-show] {
        display: flex;
      }
    `,
  ];

  @property({ attribute: false })
  elements: ShapeElement[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
  selectionState!: EdgelessSelectionState;

  @property({ attribute: false })
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

  @query('.line-styles-button')
  private _lineStylesButton!: EdgelessToolIconButton;
  @query('.line-style-panel')
  private _lineStylesPanel!: HTMLDivElement;
  private _lineStylesPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _forceUpdateSelection() {
    // FIXME: force update selection, because connector mode changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setShapeFillColor(color: CssVariableName) {
    const filled = !isTransparent(color);
    this.elements.forEach(ele => {
      this.surface.updateElement<'shape'>(ele.id, {
        filled,
        fillColor: color,
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStrokeColor(color: CssVariableName) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'shape'>(ele.id, {
        strokeColor: color,
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'shape'>(ele.id, {
        strokeWidth,
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'shape'>(ele.id, {
        strokeStyle,
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStyles({ type, value }: LineStylesPanelClickedButton) {
    if (type === 'size') {
      const strokeWidth = value;
      this._setShapeStrokeWidth(strokeWidth);
    } else if (type === 'lineStyle') {
      switch (value) {
        case 'solid': {
          this._setShapeStrokeStyle(StrokeStyle.Solid);
          break;
        }
        case 'dash': {
          this._setShapeStrokeStyle(StrokeStyle.Dashed);
          break;
        }
        case 'none': {
          this._setShapeStrokeStyle(StrokeStyle.None);
          break;
        }
      }
    }
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
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
          this.surface.updateElement<'shape'>(element.id, updatedProps);
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

    this._lineStylesPanelPopper = createButtonPopper(
      this._lineStylesButton,
      this._lineStylesPanel,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._lineStylesPanelPopper);

    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedShape = getMostCommonShape(this.elements);
    const icon = selectedShape
      ? ShapeComponentConfigMap[selectedShape].icon
      : null;

    const selectedFillColor =
      getMostCommonFillColor(this.elements) ?? FILL_COLORS[0];
    const selectedStrokeColor =
      getMostCommonStrokeColor(this.elements) ?? STROKE_COLORS[0];
    const selectedLineSize =
      getMostCommonLineSize(this.elements) ?? BrushSize.LINE_WIDTH_FOUR;
    const selectedLineStyle = getMostCommonLineStyle(this.elements) ?? 'solid';

    return html`
      <edgeless-tool-icon-button
        class="change-shape-button"
        .tooltip=${this._popperShow ? '' : 'Shape type'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._shapeMenuPopper?.toggle()}
      >
        ${icon}
      </edgeless-tool-icon-button>
      <edgeless-shape-menu .selectedShape=${selectedShape}>
      </edgeless-shape-menu>

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="fill-color-button"
        .tooltip=${this._popperShow ? '' : 'Fill color'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._fillColorMenuPopper?.toggle()}
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
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._strokeColorMenuPopper?.toggle()}
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

      <menu-divider .vertical=${true}></menu-divider>

      <edgeless-tool-icon-button
        class="line-styles-button"
        .tooltip=${this._popperShow ? '' : 'Border style'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._lineStylesPanelPopper?.toggle()}
      >
        ${LineStyleIcon}
      </edgeless-tool-icon-button>
      ${LineStylesPanel({
        selectedLineSize,
        selectedLineStyle,
        onClick: event => {
          this._setShapeStyles(event);
        },
      })}
      ${doesAllShapesContainText(this.elements)
        ? html` <menu-divider .vertical=${true}></menu-divider>
            <edgeless-change-text-menu
              .elements=${this.elements}
              .elementType=${'shape'}
              .surface=${this.surface}
              .selectionState=${this.selectionState}
              .slots=${this.slots}
            ></edgeless-change-text-menu>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-shape-button': EdgelessChangeShapeButton;
  }
}
