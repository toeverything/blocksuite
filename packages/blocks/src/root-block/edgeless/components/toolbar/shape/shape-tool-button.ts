import '../../buttons/toolbar-button.js';
import './shape-menu.js';
import './shape-tool-element.js';

import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  diamondSvg,
  ellipseSvg,
  rectSvg,
  roundedSvg,
  triangleSvg,
} from '../../../../../_common/icons/index.js';
import { isTransparent } from '../../../../../_common/theme/css-variables.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  ShapeType,
} from '../../../../../surface-block/elements/shape/consts.js';
import { ShapeStyle } from '../../../../../surface-block/index.js';
import { ShapeToolController } from '../../../controllers/tools/shape-tool.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper } from '../common/create-popper.js';
import { EdgelessToolButton } from '../edgeless-toolbar-button.js';
import type { EdgelessShapeMenu } from './shape-menu.js';
import type { Shape, ShapeName } from './shape-tool-element.js';

const { Rect, Triangle, Ellipse, Diamond } = ShapeType;

const shapes: Array<Shape> = [
  { name: Rect, svg: rectSvg },
  { name: Triangle, svg: triangleSvg },
  { name: Ellipse, svg: ellipseSvg },
  { name: Diamond, svg: diamondSvg },
  { name: 'roundedRect', svg: roundedSvg },
];

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends EdgelessToolButton<
  EdgelessShapeMenu,
  'shape',
  readonly ['shapeStyle', 'shapeType', 'fillColor', 'strokeColor', 'radius']
> {
  static override styles = css`
    .shape-button-group {
      display: block;
      position: relative;
      width: 72px;
      height: 48px;
    }

    edgeless-toolbar-button svg {
      transition: 0.3s ease-in-out;
    }

    edgeless-toolbar-button:hover svg {
      scale: 1.15;
    }

    edgeless-toolbar-button svg + svg {
      position: absolute;
      top: 6px;
      right: 4px;
    }

    :host {
      --width: 102px;
      --height: 64px;
      position: relative;
      width: var(--width);
      height: var(--height);
    }

    .container-clip {
      overflow: clip;
    }

    .shapes {
      height: var(--height);
      width: var(--width);
      color: #9747ff;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
  `;

  @state()
  shapeStyle: ShapeStyle = ShapeStyle.Scribbled;

  @state()
  shapeType: ShapeName = Rect;

  @state()
  fillColor: string = DEFAULT_SHAPE_FILL_COLOR;

  @state()
  strokeColor: string = DEFAULT_SHAPE_STROKE_COLOR;

  @state()
  radius = 0;

  @state()
  private order = shapes.map((_, i) => i + 1);

  protected override _type = 'shape' as const;
  protected override _states = [
    'shapeStyle',
    'shapeType',
    'fillColor',
    'strokeColor',
    'radius',
  ] as const;

  private _toggleMenu() {
    if (this._menu) {
      this._disposeMenu();
      this.requestUpdate();
    } else {
      this.edgeless.tools.setEdgelessTool({
        type: this._type,
        shapeType: this.shapeType,
      });
      this._menu = createPopper('edgeless-shape-menu', this, {
        x: -240,
        y: -40,
      });
      this._menu.element.edgeless = this.edgeless;
      this.updateMenu();
      this._menu.element.onChange = (props: Record<string, unknown>) => {
        if (props.shapeType) {
          this._activeShape(props.shapeType as ShapeName);
        }
        if (props.shapeType === 'rect') {
          props.radius = 0;
        } else if (props.shapeType === 'roundedRect') {
          props.shapeType = 'rect';
          props.radius = 0.1;
        }
        this.edgeless.service.editPropsStore.record(this._type, props);
      };
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.edgeless.service.editPropsStore.slots.lastPropsUpdated.on(
      ({ type, props }) => {
        if (type === 'shape' && props.shapeType) {
          let { shapeType } = props;
          if (shapeType === 'rect' && (props.radius as number) > 0) {
            shapeType = 'roundedRect';
          }
          this._activeShape(shapeType as ShapeName);
        }
      }
    );
  }

  protected override initLastPropsSlot(): void {
    this._disposables.add(
      this.edgeless.service.editPropsStore.slots.lastPropsUpdated.on(
        ({ type, props }) => {
          if (type === this._type) {
            this._states.forEach(_key => {
              const key = _key as string;
              if (key === 'rect' && (props.radius as number) > 0) {
                return;
              }
              if (props[key] != undefined) {
                Object.assign(this, { [key]: props[key] });
              }
            });
          }
        }
      )
    );
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (this._states.some(key => changedProperties.has(key))) {
      if (this._menu) {
        this.updateMenu();
        this.edgeless.tools.setEdgelessTool({
          type: this._type,
          shapeType: this.shapeType,
        });
        const controller = this.edgeless.tools.currentController;
        if (controller instanceof ShapeToolController) {
          controller.createOverlay();
        }
      }
    }
  }

  private _activeShape(name: ShapeName) {
    const { order } = this;
    const index = shapes.findIndex(({ name: n }) => n === name);
    const prevOrder = order[index];
    const newOrder = order.map(o =>
      o < prevOrder ? o + 1 : o === prevOrder ? 1 : o
    );
    this.order = newOrder;
  }

  override render() {
    const { active } = this;

    return html`
      <edgeless-toolbar-button
        class="edgeless-shape-button"
        .tooltip=${this._menu ? '' : getTooltipWithShortcut('Shape', 'S')}
        .tooltipOffset=${5}
        .active=${active}
      >
        <div class="container-clip">
          <div
            class="shapes"
            style=${styleMap({
              color: `${
                !isTransparent(this.fillColor)
                  ? `var(${this.fillColor})`
                  : 'var(--affine-white-60)'
              }`,
              stroke: 'var(--affine-black-10)',
            })}
          >
            ${repeat(shapes, (shape, index) => {
              return html`<edgeless-shape-tool-element
                .shape=${shape}
                .fillColor=${this.fillColor}
                .strokeColor=${this.strokeColor}
                .shapeStyle=${this.shapeStyle}
                .radius=${this.radius}
                .order=${this.order[index]}
                .getContainerRect=${() => this.getBoundingClientRect()}
                .handleClick=${() => this._toggleMenu()}
                .edgeless=${this.edgeless}
              ></edgeless-shape-tool-element>`;
            })}
          </div>
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
